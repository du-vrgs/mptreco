import os
import json
import shutil
import subprocess
from pathlib import Path
from fastapi import FastAPI, HTTPException, Query, Request, Body
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

ADMIN_TOKEN = os.environ.get("MPTRECO_ADMIN_TOKEN", "a8ead6af9a2e9d762a087839b245b246ef2da951889a9912")
DOWNLOADS_DIR = Path("/home/edu/Projects/mptreco/daemon/downloads")
DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)
CATALOG_FILE = DOWNLOADS_DIR / "library.json"
PLAYLISTS_FILE = DOWNLOADS_DIR / "playlists.json"
FFMPEG_PATH = "/home/edu/.local/bin/ffmpeg"
YTDLP_PATH = "/home/edu/Projects/mptreco/daemon/.venv/bin/yt-dlp"

app = FastAPI(title="mptreco Local Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def verify_token(token: str = Query(None)):
    if token != ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Token inválido")
    return token

def load_catalog() -> dict:
    if CATALOG_FILE.exists():
        try:
            with open(CATALOG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_catalog(catalog: dict):
    with open(CATALOG_FILE, "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)

def load_playlists() -> list:
    if PLAYLISTS_FILE.exists():
        try:
            with open(PLAYLISTS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []

def save_playlists_file(playlists: list):
    with open(PLAYLISTS_FILE, "w", encoding="utf-8") as f:
        json.dump(playlists, f, ensure_ascii=False, indent=2)

@app.get("/health")
def health():
    return {"status": "ok", "app": "mptreco-local-engine"}

@app.get("/list")
def list_tracks(token: str = Query(None)):
    verify_token(token)
    catalog = load_catalog()
    tracks = []
    for video_id, info in catalog.items():
        mp3_path = DOWNLOADS_DIR / info.get("filename", f"{video_id}.mp3")
        is_on_disk = mp3_path.exists()
        tracks.append({
            "id": video_id,
            "title": info.get("title", video_id),
            "artist": info.get("artist", "Desconhecido"),
            "durationFormatted": info.get("durationFormatted", "--:--"),
            "durationSeconds": info.get("durationSeconds", 0),
            "thumbnailUrl": info.get("thumbnailUrl", f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"),
            "filename": info.get("filename"),
            "sizeBytes": mp3_path.stat().st_size if is_on_disk else info.get("sizeBytes", 0),
            "isOnPcDisk": is_on_disk,
            "updatedAt": info.get("updatedAt", 0)
        })
    return {"tracks": sorted(tracks, key=lambda x: x["updatedAt"], reverse=True), "playlists": load_playlists()}

@app.post("/export-library")
def export_library_to_directory(target_path: str = Query(...), token: str = Query(None)):
    """Copia os arquivos .mp3 existentes para a pasta/pendrive escolhido, baixando sob demanda somente os que não estiverem no PC."""
    verify_token(token)
    dest_dir = Path(target_path).expanduser().resolve()
    dest_dir.mkdir(parents=True, exist_ok=True)

    catalog = load_catalog()
    results = []

    for video_id, info in catalog.items():
        filename = info.get("filename", f"{video_id}.mp3")
        source_file = DOWNLOADS_DIR / filename

        # Se o arquivo não existir localmente no PC, baixa agora
        if not source_file.exists():
            url = f"https://www.youtube.com/watch?v={video_id}"
            cmd = [
                YTDLP_PATH,
                "--ffmpeg-location", FFMPEG_PATH,
                "-x", "--audio-format", "mp3",
                "-o", str(DOWNLOADS_DIR / f"{video_id}.%(ext)s"),
                url
            ]
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if res.returncode == 0:
                source_file = DOWNLOADS_DIR / f"{video_id}.mp3"

        if source_file.exists():
            clean_name = f"{info.get('artist', 'Artista')} - {info.get('title', video_id)}.mp3".replace("/", "_").replace("\\", "_")
            dest_file = dest_dir / clean_name
            shutil.copy2(source_file, dest_file)
            results.append({"id": video_id, "title": info.get("title"), "dest": str(dest_file)})

    return {"status": "success", "dest_dir": str(dest_dir), "copied_count": len(results)}

@app.post("/cleanup-file/{id}")
def cleanup_file_from_pc(id: str, token: str = Query(None)):
    """Deleta apenas o arquivo físico .mp3 do PC após o celular sincronizar, mantendo os metadados no catálogo."""
    verify_token(token)
    catalog = load_catalog()
    deleted = False

    if id in catalog:
        filename = catalog[id].get("filename")
        if filename:
            file_path = DOWNLOADS_DIR / filename
            if file_path.exists():
                file_path.unlink()
                deleted = True

    for f in DOWNLOADS_DIR.glob(f"*{id}*.mp3"):
        if f.exists():
            f.unlink()
            deleted = True

    return {"status": "success", "file_cleaned": deleted, "id": id}

@app.post("/playlists")
def update_playlists(request_body: list = Body(...), token: str = Query(None)):
    verify_token(token)
    save_playlists_file(request_body)
    return {"status": "success", "playlists": request_body}

@app.post("/download")
def download_track(
    id: str = Query(...),
    title: str = Query(None),
    artist: str = Query(None),
    durationFormatted: str = Query(None),
    durationSeconds: int = Query(0),
    thumbnailUrl: str = Query(None),
    token: str = Query(None)
):
    verify_token(token)
    catalog = load_catalog()

    # Sanitizar nome de arquivo seguro
    safe_title = (title or id).replace("/", "_").replace("\\", "_").replace(":", " - ")
    safe_artist = (artist or "Artista").replace("/", "_").replace("\\", "_")
    filename = f"{safe_artist} - {safe_title}.mp3"
    target_path = DOWNLOADS_DIR / filename

    if not target_path.exists():
        url = f"https://www.youtube.com/watch?v={id}"
        cmd = [
            YTDLP_PATH,
            "--ffmpeg-location", FFMPEG_PATH,
            "-x", "--audio-format", "mp3",
            "-o", str(DOWNLOADS_DIR / f"{safe_artist} - {safe_title}.%(ext)s"),
            url
        ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if res.returncode != 0:
            raise HTTPException(status_code=500, detail=f"Erro yt-dlp: {res.stderr}")

    # Atualizar catálogo com metadados organizados
    catalog[id] = {
        "id": id,
        "title": title or safe_title,
        "artist": artist or safe_artist,
        "filename": filename,
        "durationFormatted": durationFormatted or "--:--",
        "durationSeconds": durationSeconds or 0,
        "thumbnailUrl": thumbnailUrl or f"https://i.ytimg.com/vi/{id}/hqdefault.jpg",
        "updatedAt": int(target_path.stat().st_mtime * 1000) if target_path.exists() else 0
    }
    save_catalog(catalog)

    return {"status": "success", "track": catalog[id]}

@app.delete("/file/{id}")
def delete_file(id: str, token: str = Query(None)):
    verify_token(token)
    catalog = load_catalog()
    deleted = False

    # Deletar arquivo físico registrado no catálogo
    if id in catalog:
        filename = catalog[id].get("filename")
        if filename:
            file_path = DOWNLOADS_DIR / filename
            if file_path.exists():
                file_path.unlink()
                deleted = True
        del catalog[id]
        save_catalog(catalog)

    # Deletar qualquer arquivo órfão com esse id no nome
    for f in DOWNLOADS_DIR.glob(f"*{id}*.mp3"):
        if f.exists():
            f.unlink()
            deleted = True

    return {"status": "success", "deleted": deleted, "id": id}

@app.get("/file/{id}.mp3")
@app.head("/file/{id}.mp3")
def get_mp3_file(id: str, token: str = Query(None)):
    verify_token(token)
    catalog = load_catalog()
    
    file_path = None
    if id in catalog:
        candidate = DOWNLOADS_DIR / catalog[id].get("filename", "")
        if candidate.exists():
            file_path = candidate

    if not file_path:
        for f in DOWNLOADS_DIR.glob(f"*{id}*.mp3"):
            file_path = f
            break

    # Se ainda não existe no disco, faz stream instantâneo em tempo real via pipe (yt-dlp -> ffmpeg -> MP3)
    if not file_path or not file_path.exists():
        url = f"https://www.youtube.com/watch?v={id}"
        cmd = f"{YTDLP_PATH} -o - -f ba/b \"{url}\" | {FFMPEG_PATH} -i pipe:0 -f mp3 -b:a 128k pipe:1"
        proc = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)

        def iter_stream():
            try:
                while True:
                    chunk = proc.stdout.read(64 * 1024)
                    if not chunk:
                        break
                    yield chunk
            finally:
                proc.terminate()

        return StreamingResponse(
            iter_stream(),
            media_type="audio/mpeg",
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Range, Content-Type",
                "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
                "Cache-Control": "no-cache",
            }
        )

    return FileResponse(
        path=file_path,
        media_type="audio/mpeg",
        filename=file_path.name,
        headers={
            "Accept-Ranges": "bytes",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Range, Content-Type",
            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
            "Cache-Control": "public, max-age=31536000, immutable",
        }
    )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7777)
