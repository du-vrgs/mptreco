import os
import subprocess
from fastapi import FastAPI, HTTPException, Security, Query
from fastapi.security.api_key import APIKeyHeader, APIKeyQuery
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

ADMIN_TOKEN = os.environ.get("MPTRECO_ADMIN_TOKEN", "a8ead6af9a2e9d762a087839b245b246ef2da951889a9912")

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

@app.get("/stream")
def get_stream(id: str, token: str = Query(None)):
    verify_token(token)
    if not id:
        raise HTTPException(status_code=400, detail="ID obrigatório")
    
    url = f"https://www.youtube.com/watch?v={id}"
    cmd = ["yt-dlp", "-g", "-f", "ba/b", url]
    try:
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        stream_urls = [line.strip() for line in res.stdout.split("\n") if line.strip().startswith("http")]
        if not stream_urls:
            raise HTTPException(status_code=502, detail="URL de áudio não encontrada")
        return {"streamUrl": stream_urls[0], "container": "webm"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7777)
