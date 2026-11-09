import os
import subprocess
from pathlib import Path
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

ADMIN_TOKEN = os.environ.get("MPTRECO_ADMIN_TOKEN", "a8ead6af9a2e9d762a087839b245b246ef2da951889a9912")
DOWNLOADS_DIR = Path("/home/edu/Projects/mptreco/daemon/downloads")
DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)
FFMPEG_PATH = "/home/edu/.local/bin/ffmpeg"

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

@app.get("/health")
def health():
    return {"status": "ok", "app": "mptreco-local-engine"}

# Lista todos os MP3s baixados no PC
@app.get("/list")
def list_local_mp3s(token: str = Query(None)):
    verify_token(token)
    files = []
    for f in DOWNLOADS_DIR.glob("*.mp3"):
        files.append({
            "id": f.stem,
            "filename": f.name,
            "sizeBytes": f.stat().st_size,
            "updatedAt": int(f.stat().st_mtime * 1000)
        })
    return {"files": files}

# Baixa uma música do YouTube diretamente para o disco do PC
@app.post("/download")
def download_to_pc(id: str = Query(...), token: str = Query(None)):
    verify_token(token)
    target_mp3 = DOWNLOADS_DIR / f"{id}.mp3"
    if target_mp3.exists():
        return {"status": "already_downloaded", "id": id, "path": str(target_mp3)}

    url = f"https://www.youtube.com/watch?v={id}"
    cmd = [
        "/home/edu/Projects/mptreco/daemon/.venv/bin/yt-dlp",
        "--ffmpeg-location", FFMPEG_PATH,
        "-x", "--audio-format", "mp3",
        "-o", str(DOWNLOADS_DIR / "%(id)s.%(ext)s"),
        url
    ]
    try:
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        return {"status": "downloaded", "id": id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Entrega o arquivo MP3 real armazenado no PC para o celular/navegador (com suporte a Range)
@app.get("/file/{id}.mp3")
@app.head("/file/{id}.mp3")
def get_mp3_file(id: str, token: str = Query(None)):
    verify_token(token)
    file_path = DOWNLOADS_DIR / f"{id}.mp3"
    if not file_path.exists():
        # Se ainda não foi baixado pro disco, baixa agora
        url = f"https://www.youtube.com/watch?v={id}"
        cmd = [
            "/home/edu/Projects/mptreco/daemon/.venv/bin/yt-dlp",
            "--ffmpeg-location", FFMPEG_PATH,
            "-x", "--audio-format", "mp3",
            "-o", str(DOWNLOADS_DIR / "%(id)s.%(ext)s"),
            url
        ]
        try:
            subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao processar MP3: {e}")

    return FileResponse(
        path=file_path,
        media_type="audio/mpeg",
        filename=f"{id}.mp3",
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
