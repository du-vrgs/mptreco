import os
import json
import subprocess
from pathlib import Path
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

ADMIN_TOKEN = os.environ.get("MPTRECO_ADMIN_TOKEN", "a8ead6af9a2e9d762a087839b245b246ef2da951889a9912")
DOWNLOADS_DIR = Path("/home/edu/Projects/mptreco/daemon/downloads")
DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)
CATALOG_FILE = DOWNLOADS_DIR / "library.json"
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
        if mp3_path.exists():
            tracks.append({
                "id": video_id,
                "title": info.get("title", video_id),
                "artist": info.get("artist", "Desconhecido"),
                "durationFormatted": info.get("durationFormatted", "--:--"),
                "durationSeconds": info.get("durationSeconds", 0),
                "thumbnailUrl": info.get("thumbnailUrl", f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"),
                "filename": info.get("filename"),
                "sizeBytes": mp3_path.stat().st_size,
                "updatedAt": int(mp3_path.stat().st_mtime * 1000)
            })
    return {"tracks": sorted(tracks, key=lambda x: x["updatedAt"], reverse=True)}

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
        # Fallback de busca por ID
        for f in DOWNLOADS_DIR.glob(f"*{id}*.mp3"):
            file_path = f
            break

    if not file_path or not file_path.exists():
        raise HTTPException(status_code=404, detail="Arquivo de áudio não encontrado no disco do PC")

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
