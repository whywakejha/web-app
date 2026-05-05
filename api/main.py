import base64
import io
import os
import shutil
import tempfile
from typing import Optional

import trimesh
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from huggingface_hub import InferenceClient
from pydantic import BaseModel

load_dotenv()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_client: Optional[InferenceClient] = None


def get_client() -> InferenceClient:
    global _client
    if _client is None:
        token = os.getenv("HUGGINGFACE_API_KEY")
        if not token:
            raise RuntimeError("HUGGINGFACE_API_KEY not set")
        _client = InferenceClient(token=token)
    return _client


class DesignRequest(BaseModel):
    prompt: str


TSHIRT_SUFFIX = (
    ", t-shirt graphic print design, bold flat graphic, high contrast, "
    "pure white background, isolated centered design, vector art style, "
    "clean crisp edges, no background pattern, suitable for screen printing, "
    "CMYK-friendly colors, strong outlines"
)


@app.post("/api/generate-design")
async def generate_design(req: DesignRequest):
    if not req.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")
    try:
        full_prompt = req.prompt.strip() + TSHIRT_SUFFIX
        image = get_client().text_to_image(
            full_prompt,
            model="black-forest-labs/FLUX.1-schnell",
        )
        buf = io.BytesIO()
        image.save(buf, format="PNG")
        return {"image": base64.b64encode(buf.getvalue()).decode()}
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"HuggingFace error: {e}")


def _lhm_repo_path() -> str:
    path = os.getenv("LHM_REPO_PATH", "")
    if not path or not os.path.isdir(path):
        raise RuntimeError(
            "LHM_REPO_PATH is not set or does not exist. "
            "Clone https://github.com/aigc3d/LHM, run its setup, and set "
            "LHM_REPO_PATH=/path/to/LHM in api/.env"
        )
    return path


def _ply_to_glb_bytes(ply_path: str) -> bytes:
    loaded = trimesh.load(ply_path)
    scene = loaded if isinstance(loaded, trimesh.Scene) else trimesh.Scene([loaded])
    buf = io.BytesIO()
    scene.export(buf, file_type="glb")
    return buf.getvalue()


@app.post("/api/reconstruct-body")
async def reconstruct_body(image: UploadFile = File(...)):
    """
    Reconstruct a clothed 3D body mesh from a single photo using LHM-MINI.

    Requires LHM installed locally with a 16 GB GPU (e.g. RTX 3080 / A10G).
    Setup:
      1. git clone https://github.com/aigc3d/LHM && cd LHM
      2. Follow README install steps (conda env, pip install -e .)
      3. Download weights: huggingface-cli download 3DAIGC/LHM-MINI
      4. Set LHM_REPO_PATH=/path/to/LHM in api/.env
    """
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        lhm_path = _lhm_repo_path()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    tmpdir = tempfile.mkdtemp()
    try:
        ext = (image.filename or "upload.jpg").rsplit(".", 1)[-1]
        img_path = os.path.join(tmpdir, f"input.{ext}")
        with open(img_path, "wb") as f:
            shutil.copyfileobj(image.file, f)

        out_dir = os.path.join(tmpdir, "output")
        os.makedirs(out_dir, exist_ok=True)

        # LHM mesh inference — produces output/raw.ply
        # inference_mesh.py lives in the cloned LHM repo root.
        import subprocess
        proc = subprocess.run(
            [
                "python", "inference_mesh.py",
                "--image", img_path,
                "--output_dir", out_dir,
                "--model", "LHM-MINI",
            ],
            cwd=lhm_path,
            capture_output=True,
            text=True,
            timeout=120,
        )
        if proc.returncode != 0:
            raise HTTPException(status_code=500, detail=f"LHM error: {proc.stderr[-500:]}")

        ply_path = os.path.join(out_dir, "output.ply")
        if not os.path.exists(ply_path):
            # fall back: find any PLY in out_dir
            plys = [f for f in os.listdir(out_dir) if f.endswith(".ply")]
            if not plys:
                raise HTTPException(status_code=500, detail="LHM produced no mesh file")
            ply_path = os.path.join(out_dir, plys[0])

        try:
            glb_bytes = _ply_to_glb_bytes(ply_path)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Mesh conversion error: {e}")

        return Response(content=glb_bytes, media_type="model/gltf-binary")
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
