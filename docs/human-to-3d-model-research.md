# Human Photo/Video → 3D Model: Open-Source Model Survey

**Context:** Research for the `/design` endpoint in PrintLlama — adding the ability to translate a user's photo or a short body video into a 3D avatar/mesh that can be rendered on the Three.js mannequin in `Design.jsx`.

**Date:** May 2026

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Category A — SMPL Body Mesh (Image / Video)](#category-a)
3. [Category B — Video-to-3D Reconstruction](#category-b)
4. [Category C — Clothed Human Reconstruction](#category-c)
5. [Category D — Recent 2024–2025 Models](#category-d)
6. [General Image-to-3D (non-human-specific)](#general)
7. [Master Comparison Table](#comparison-table)
8. [FastAPI Integration Guide](#fastapi)
9. [Recommended Stack](#recommended-stack)
10. [SMPL License Warning](#license-warning)

---

## Problem Statement

Given a single RGB photo of a person **or** a short monocular video, produce a 3D model (mesh + optional texture) that can be:

- Loaded into the existing Three.js `<Canvas>` in `Mannequin.jsx`
- Served via a new `POST /api/reconstruct-body` FastAPI endpoint
- Returned as a `.glb` / `.obj` file (or base64-encoded)

Key constraints from the existing stack:
- Backend is Python + FastAPI on `:8000`
- HuggingFace Inference API already used for FLUX
- Frontend expects a loadable GLB (or can accept OBJ with post-conversion)
- Prefer open-source, commercially usable models (Apache 2.0 / MIT)

---

## Category A — SMPL Body Mesh (Image / Video) {#category-a}

These models output a **parametric SMPL or SMPL-X body mesh** — accurate pose and shape but **no clothing detail**. They are the lightest, fastest, easiest to deploy.

---

### HMR 2.0 / 4DHumans

| | |
|---|---|
| **Paper** | "Humans in 4D" — CVPR 2023 |
| **GitHub** | https://github.com/shubham-goel/4D-Humans |
| **License** | **MIT** ✅ |
| **HuggingFace** | Space: `brjathu/HMR2.0`; weights: `camenduru/4D-Humans` |
| **Input** | Single image or video frames |
| **Output** | SMPL mesh (`.obj` via `--save_mesh`) |
| **GLB export** | OBJ only natively; trivial to convert with `trimesh` |
| **Backbone** | ViT-H — ~300–600M params total |
| **VRAM** | 8–12 GB |
| **Speed** | 1–3 FPS on single GPU; near real-time on A100 |
| **Quality** | SOTA SMPL pose accuracy; no clothing |
| **HF Inference API** | Space demo only, no serverless |
| **FastAPI ease** | ★★★★★ — `pip install 4d-humans`, clean Python API |

**Note:** 4DHumans adds temporal tracking across video frames with consistent person IDs — same model, video-aware inference mode.

---

### SMPLer-X

| | |
|---|---|
| **Paper** | "SMPLer-X: Scaling Up Expressive Human Pose and Shape Estimation" — NeurIPS 2023 |
| **GitHub** | https://github.com/SMPLCap/SMPLer-X |
| **License** | CC BY-NC 4.0 ⚠️ non-commercial |
| **Output** | SMPL-X (body + face + hands) |
| **VRAM** | 12–16 GB (ViT-H32) |
| **Speed** | 1–2 FPS |
| **FastAPI ease** | ★★★☆☆ — Docker-based, wrap via subprocess |

---

### PyMAF-X

| | |
|---|---|
| **Paper** | "PyMAF-X: Towards Well-aligned Full-body Model Regression" — TPAMI 2023 |
| **GitHub** | https://github.com/HongwenZhang/PyMAF-X |
| **License** | Non-commercial research ⚠️ |
| **HuggingFace** | `camenduru/PyMAF-X` (weights) |
| **Output** | SMPL-X (well-aligned wrists/hands) |
| **VRAM** | ~8 GB |
| **FastAPI ease** | ★★★☆☆ |

---

### SMPLify-X

| | |
|---|---|
| **GitHub** | https://github.com/vchoutas/smplify-x |
| **License** | Non-commercial (MPI) ⚠️ |
| **Output** | SMPL-X mesh (optimization-based) |
| **Speed** | 30–120 **seconds** per image — not suitable for API use |
| **FastAPI ease** | ★☆☆☆☆ — do not use for API |

---

## Category B — Video-to-3D Human Reconstruction {#category-b}

---

### VIBE

| | |
|---|---|
| **Paper** | "VIBE: Video Inference for Human Body Pose and Shape Estimation" — CVPR 2020 |
| **GitHub** | https://github.com/mkocabas/VIBE |
| **License** | Non-commercial research ⚠️ |
| **Input** | Video file or YouTube URL |
| **Output** | SMPL per-frame + **FBX / glTF export built in** |
| **GLB export** | Yes — native FBX and glTF output |
| **VRAM** | 6–8 GB |
| **Speed** | Up to 30 FPS on RTX 2080 Ti |
| **HF Inference API** | No |
| **FastAPI ease** | ★★★★☆ — best video→glTF pipeline if non-commercial use is OK |

---

### GaussianAvatar

| | |
|---|---|
| **Paper** | "GaussianAvatar" — CVPR 2024 |
| **GitHub** | https://github.com/aipixel/GaussianAvatar |
| **License** | **MIT** ✅ |
| **Input** | Monocular video |
| **Output** | 3D Gaussian Splatting (PLY); animatable |
| **VRAM** | 24+ GB |
| **Speed** | ~30 hours training per video — no feed-forward inference |
| **FastAPI ease** | ★☆☆☆☆ — per-subject training required; not suitable as API |

---

### Human4DiT

| | |
|---|---|
| **Paper** | "Human4DiT: 360° Human Video Generation" — SIGGRAPH Asia 2024 |
| **GitHub** | https://github.com/DSaurus/Human4DiT |
| **License** | Not clearly specified |
| **Input** | Reference image + driving video |
| **Output** | Novel-view video synthesis — **not a mesh** |
| **FastAPI ease** | ✗ — wrong output type for direct mesh use |

---

## Category C — Clothed Human Reconstruction {#category-c}

These models recover the **full surface including clothing**, not just the body shape. Output quality is much more suitable for a t-shirt design preview use case.

---

### PIFuHD

| | |
|---|---|
| **Paper** | "Multi-Level Pixel-Aligned Implicit Function for High-Resolution 3D Human Digitization" — CVPR 2020 |
| **GitHub** | https://github.com/facebookresearch/pifuhd |
| **License** | CC BY-NC 4.0 ⚠️ non-commercial |
| **Input** | Single RGB image (no mask needed) |
| **Output** | Implicit function → marching cubes → OBJ |
| **GLB export** | OBJ natively; `trimesh` converts to GLB |
| **VRAM** | ~8 GB |
| **Speed** | 30–60 seconds/image on 1 GPU |
| **Quality** | Foundational model; visible seams on back; dated by 2025 standards |
| **FastAPI ease** | ★★★☆☆ — well-documented CLI (`simple_test.py`) |

---

### ICON

| | |
|---|---|
| **Paper** | "ICON: Implicit Clothed humans Obtained from Normals" — CVPR 2022 |
| **GitHub** | https://github.com/yuliangxiu/icon |
| **License** | Non-commercial (MPI) ⚠️ |
| **Input** | Single RGB image |
| **Output** | Implicit occupancy → mesh |
| **VRAM** | ~12 GB |
| **Speed** | 1–2 minutes/image |
| **FastAPI ease** | ★★☆☆☆ — complex pipeline (needs SMPL-X fit first) |

---

### ECON

| | |
|---|---|
| **Paper** | "ECON: Explicit Clothed humans Optimized via Normal integration" — CVPR 2023 Highlight |
| **GitHub** | https://github.com/YuliangXiu/ECON |
| **License** | Non-commercial (MPI) ⚠️ |
| **HuggingFace** | Space: `Yuliang/ECON` (live demo) |
| **Input** | Single RGB image |
| **Output** | OBJ/PLY mesh; SMPL-X animation-ready; multi-person support |
| **GLB export** | OBJ + Blender add-on; GLB conversion via trimesh |
| **VRAM** | 12–16 GB |
| **Speed** | ~1.8 minutes/image |
| **FastAPI ease** | ★★★☆☆ — HF Space queryable via `gradio_client` (no local GPU needed but rate-limited) |

```python
# Zero-GPU option via HF Space
from gradio_client import Client
client = Client("Yuliang/ECON")
result = client.predict(image_path, api_name="/predict")
```

---

### SIFU

| | |
|---|---|
| **Paper** | "SIFU: Side-view Conditioned Implicit Function for Real-world Usable Clothed Human Reconstruction" — CVPR 2024 Highlight |
| **GitHub** | https://github.com/River-Zhang/SIFU |
| **License** | **MIT** ✅ |
| **Input** | Single RGB image |
| **Output** | Clothed mesh + texture |
| **VRAM** | >16 GB (CUDA 11.6–11.8 required) |
| **Speed** | ~44s (coarse) / ~6 min (full quality) on RTX 3090 |
| **Quality** | CVPR 2024 Highlight — improved over ECON/ICON on real-world images |
| **FastAPI ease** | ★★★☆☆ — MIT license is commercially viable but needs high-VRAM GPU |

---

### PIXIE

| | |
|---|---|
| **Paper** | "Collaborative Regression of Expressive Bodies using Moderation" — 3DV 2021 |
| **GitHub** | https://github.com/yfeng95/PIXIE |
| **License** | Non-commercial (MPI) ⚠️ |
| **Output** | SMPL-X (face + body + hands) — not a clothed surface |
| **VRAM** | 8–10 GB |
| **FastAPI ease** | ★★★☆☆ |

---

## Category D — Recent 2024–2025 Models {#category-d}

---

### SiTH (CVPR 2024)

| | |
|---|---|
| **Paper** | "SiTH: Single-view Textured Human Reconstruction with Image-Conditioned Diffusion" — CVPR 2024 |
| **GitHub** | https://github.com/SiTH-Diffusion/SiTH |
| **License** | **MIT** ✅ |
| **HuggingFace** | `hohs/SiTH_diffusion`, `hohs/SiTH-diffusion-1K` |
| **Input** | Single RGB image |
| **Output** | OBJ + UV texture maps (SMPL-X compatible); back hallucinated via diffusion |
| **GLB export** | OBJ + UV → GLB trivially with trimesh |
| **VRAM** | ~24 GB (RTX 3090) |
| **Speed** | ~2 min (mesh) / >10 min (full quality UV unwrap) |
| **Quality** | Diffusion-based back completion; realistic complete meshes |
| **FastAPI ease** | ★★★★☆ — MIT, weights on HF, clean Python script, returns OBJ |

---

### Human3Diffusion (NeurIPS 2024)

| | |
|---|---|
| **Paper** | "Human-3Diffusion: Realistic Avatar Creation via Explicit 3D Consistent Diffusion Models" — NeurIPS 2024 |
| **GitHub** | https://github.com/YuxuanSnow/Human3Diffusion |
| **License** | **MIT** ✅ |
| **HuggingFace** | `yuxuanx/human3diffusion` (safetensors weights) |
| **Input** | Single RGB image |
| **Output** | 3D Gaussian Splatting → TSDF → OBJ mesh |
| **VRAM** | ~24 GB estimated (dual diffusion pipeline) |
| **Quality** | Handles loose clothing, accessories, hats, bags |
| **FastAPI ease** | ★★★☆☆ — MIT + HF weights, but complex 3DGS+TSDF pipeline |

---

### LHM — Large Animatable Human Reconstruction Model (ICCV 2025)

| | |
|---|---|
| **Paper** | "LHM: Large Animatable Human Reconstruction Model from a Single Image in Seconds" — ICCV 2025 |
| **GitHub** | https://github.com/aigc3d/LHM |
| **License** | **Apache 2.0** ✅ |
| **HuggingFace** | `3DAIGC/LHM-MINI`, `3DAIGC/LHM-500M-HF`, `3DAIGC/LHM-1B-HF`; Space: `3DAIGC/LHM` |
| **Input** | Single RGB image |
| **Output** | 3D Gaussian Splatting (animatable) + mesh export via `inference_mesh.sh` |
| **GLB export** | Mesh export script available |

**Model variants:**

| Variant | VRAM | Speed | Notes |
|---|---|---|---|
| LHM-MINI | 16 GB | 1.4s | Best for API — lowest VRAM, fastest |
| LHM-500M | ~16–24 GB | 2s | Mid quality |
| LHM-1B | ~24–32 GB | 6.6s | Highest quality |

**Quality:** Animatable avatar; detailed clothing + face; ICCV 2025  
**FastAPI ease:** ★★★★★ — Apache 2.0, HF weights, Python SDK, 1.4s inference. **Best candidate overall.**

---

### IDOL (CVPR 2025)

| | |
|---|---|
| **Paper** | "IDOL: Instant Photorealistic 3D Human Creation from a Single Image" — CVPR 2025 |
| **GitHub** | https://github.com/yiyuzhuang/IDOL |
| **License** | **MIT** ✅ |
| **HuggingFace** | Paper page only — weights not yet released (as of May 2026, check repo) |
| **Input** | Single RGB image |
| **Output** | Photorealistic 3D (3DGS / UV Gaussian); animatable; 1K resolution |
| **Speed** | Claimed "instant" — feed-forward transformer |
| **FastAPI ease** | ★★★★☆ once weights release |

---

### PSHuman (CVPR 2025)

| | |
|---|---|
| **Paper** | "PSHuman: Photorealistic Single-image 3D Human Reconstruction" — CVPR 2025 |
| **GitHub** | https://github.com/pengHTYX/PSHuman |
| **HuggingFace** | HF Space demo deployed |
| **Input** | Single RGB image |
| **Output** | Textured OBJ (differentiable rasterization) |
| **VRAM** | >40 GB current model; 512-res version in development (~24 GB target) |
| **Speed** | ~1 minute |
| **Quality** | SOTA photorealism; face enhancement built-in |
| **FastAPI ease** | ★★☆☆☆ — wait for 512-res release |

---

### HumanDreamer-X (arXiv April 2025)

| | |
|---|---|
| **GitHub** | https://github.com/GigaAI-research/HumanDreamer-X |
| **Input** | Single RGB image |
| **Output** | 3DGS + HumanFixer photorealistic restoration |
| **Quality** | +16% PSNR over baselines (25.62 dB) |
| **Status** | Very new — weights may not be released yet |

---

## General Image-to-3D (non-human-specific) {#general}

These are not human-specialized but are the most deployment-friendly options if quality tradeoffs are acceptable.

| Model | HF Hub | License | Output | Speed | Notes |
|---|---|---|---|---|---|
| **TripoSR** | `stabilityai/TripoSR` | **MIT** ✅ | OBJ / GLB | <0.5s on A100 | Best speed; lower human quality |
| **Stable Fast 3D** | `stabilityai/stable-fast-3d` | Research/NC | UV-unwrapped **GLB** | <1s | Only model with native GLB + UV; no serverless API |
| **Hunyuan3D-2** | `tencent/Hunyuan3D-2` | Non-commercial | High-quality mesh | ~1 min | Best general quality; NC only |
| **One-2-3-45** | `One-2-3-45/One-2-3-45` | **MIT** ✅ | Mesh | ~45s | Multi-view → mesh; human quality mediocre |

> **Note:** None of these were trained on humans specifically. For a t-shirt design app where accurate clothing drape matters, the human-specific models above will produce better results.

---

## Master Comparison Table {#comparison-table}

| Model | Year | Input | Output | VRAM | License | HF Hub | Clothed | API Ease |
|---|---|---|---|---|---|---|---|---|
| **LHM-MINI** | 2025 | Image | 3DGS + mesh | 16 GB | **Apache 2.0** ✅ | Model + Space | Yes | ★★★★★ |
| **HMR2 / 4DHumans** | 2023 | Image/Video | SMPL OBJ | 8–12 GB | **MIT** ✅ | Space | No | ★★★★★ |
| **SiTH** | 2024 | Image | OBJ + UV | ~24 GB | **MIT** ✅ | Weights | Yes | ★★★★☆ |
| **SIFU** | 2024 | Image | Mesh + texture | >16 GB | **MIT** ✅ | No | Yes | ★★★☆☆ |
| **Human3Diffusion** | 2024 | Image | 3DGS + OBJ | ~24 GB | **MIT** ✅ | Weights | Yes | ★★★☆☆ |
| **VIBE** | 2020 | Video | FBX / glTF | 6–8 GB | NC ⚠️ | No | No | ★★★★☆ |
| **ECON** | 2023 | Image | Mesh | 12–16 GB | NC ⚠️ | Space | Yes | ★★★☆☆ |
| **PIFuHD** | 2020 | Image | OBJ | ~8 GB | NC ⚠️ | No | Yes | ★★★☆☆ |
| **ICON** | 2022 | Image | Mesh | ~12 GB | NC ⚠️ | No | Yes | ★★☆☆☆ |
| **IDOL** | 2025 | Image | 3DGS/UV | Unknown | **MIT** ✅ | Pending | Yes | ★★★★☆ |
| **PSHuman** | 2025 | Image | OBJ + texture | >40 GB | ? | Space | Yes | ★★☆☆☆ |
| **SMPLer-X** | 2023 | Image | SMPL-X | 12–16 GB | NC ⚠️ | No | No | ★★★☆☆ |
| **GaussianAvatar** | 2024 | Video | 3DGS | 24 GB+ | **MIT** ✅ | No | Yes | ★☆☆☆☆ |
| **EVA3D** | 2023 | 2D collection | NeRF | ~24 GB | NC ⚠️ | No | Yes | ✗ |
| **AvatarCLIP** | 2022 | Text | NeRF | ~24 GB | NC ⚠️ | No | Partial | ✗ |

---

## FastAPI Integration Guide {#fastapi}

### Tier 1 — Recommended starting points

#### LHM-MINI (Apache 2.0 — best overall)

```python
# api/reconstruct.py  (pseudocode)
from huggingface_hub import snapshot_download
# weights: 3DAIGC/LHM-MINI

@app.post("/api/reconstruct-body")
async def reconstruct_body(image: UploadFile):
    img_bytes = await image.read()
    img = load_image(img_bytes)
    gaussians = lhm_model.forward(img)          # ~1.4s on 16 GB GPU
    mesh_path = export_mesh(gaussians)           # LHM's inference_mesh script
    glb_path = convert_to_glb(mesh_path)         # trimesh
    return FileResponse(glb_path, media_type="model/gltf-binary")
```

Serve on a 16 GB GPU instance (e.g., HF Inference Endpoints, Modal A10G, RunPod RTX 4000).

#### HMR2 / 4DHumans (MIT — fastest body-pose)

```bash
pip install 4d-humans
```

```python
from hmr2.models import download_models, load_hmr2
model, model_cfg = load_hmr2(DEFAULT_CHECKPOINT)
# Returns SMPL mesh; use trimesh to convert OBJ → GLB
```

Best choice when clothing detail is not required (e.g., body scaling / body-type inference only).

#### SiTH (MIT — best textured clothed output on 24 GB)

Weights: `hohs/SiTH_diffusion` on HF Hub. Use `demo.py` from the repo, wrap the Python inference function. Returns OBJ + UV texture; one-liner GLB conversion with trimesh.

---

### Tier 2 — Zero-GPU option via HF Space

```python
# No local GPU needed — rate-limited, cold start ~30s
from gradio_client import Client
client = Client("Yuliang/ECON")          # ECON Space
result = client.predict(image_path, api_name="/predict")
# or
client = Client("3DAIGC/LHM")           # LHM Space
```

Good for prototyping/demo before provisioning a GPU.

---

### Tier 3 — Avoid for API use

| Model | Reason |
|---|---|
| GaussianAvatar | Per-subject optimization (hours) |
| PSHuman | >40 GB VRAM |
| SMPLify-X | 30–120s optimization per image |
| EVA3D / AvatarCLIP | Wrong input modality |
| Human4DiT | Video-out not mesh-out |

---

### GLB output pipeline

Most models output OBJ. Convert to GLB for Three.js:

```python
import trimesh

def obj_to_glb(obj_path: str, glb_path: str):
    mesh = trimesh.load(obj_path)
    mesh.export(glb_path)
```

For models that output 3DGS (PLY), use the model's own mesh export script first, then run `obj_to_glb`.

---

### Frontend integration sketch (`Mannequin.jsx`)

The existing `useGLTF` loader already handles GLB. The new endpoint just needs to return a URL the client can load:

```jsx
// Design.jsx — new body reconstruction flow
const [bodyModelUrl, setBodyModelUrl] = useState(null);

async function handleBodyUpload(file) {
  const fd = new FormData();
  fd.append("image", file);
  const res = await fetch("/api/reconstruct-body", { method: "POST", body: fd });
  const blob = await res.blob();
  setBodyModelUrl(URL.createObjectURL(blob));  // object URL → useGLTF
}
```

---

## Recommended Stack {#recommended-stack}

### For a first working prototype (low VRAM / no dedicated GPU)

1. **HMR2 / 4DHumans** (MIT, 8–12 GB) for body pose + shape → apply t-shirt texture on SMPL mesh
2. Query **ECON HF Space** via `gradio_client` for clothed mesh when GPU unavailable

### For production quality (16 GB GPU — e.g., A10G on Modal/RunPod)

1. **LHM-MINI** (Apache 2.0) — single image → animatable clothed avatar in 1.4s — clear winner
2. **4DHumans** for video input → per-frame SMPL tracking

### For maximum clothing detail (24 GB GPU)

1. **SiTH** (MIT) — returns OBJ + UV texture map with diffusion-hallucinated back view
2. **SIFU** (MIT) — CVPR 2024 Highlight, real-world robust

### Watch list (weights not yet public as of May 2026)

- **IDOL** (MIT) — CVPR 2025, claims instant feed-forward inference; check https://github.com/yiyuzhuang/IDOL
- **PSHuman 512-res** — CVPR 2025, targeting ~24 GB; check https://github.com/pengHTYX/PSHuman

---

## SMPL License Warning {#license-warning}

Nearly every SMPL-based model depends on the **SMPL / SMPL-X body model** from Max Planck Institute, which carries a **non-commercial research license** requiring registration at `smpl-x.is.tue.mpg.de`.

**This means: even if the code is MIT, you cannot ship a commercial product using SMPL/SMPL-X without a commercial license from [Meshcapade](https://meshcapade.com/smpl/).**

Models that **avoid this restriction entirely:**
- **PIFuHD** — implicit function; no SMPL dependency in inference
- **LHM** 3DGS representation — uses SMPL internally for training supervision but the deployed inference may not require the SMPL model file (verify in their license/setup docs)
- General-object models (TripoSR, Stable Fast 3D)

**Action:** Before shipping, verify which model file the deployed checkpoint actually loads and whether it triggers the SMPL registration requirement.

---

## Sources

- [4DHumans GitHub](https://github.com/shubham-goel/4D-Humans)
- [HMR2.0 HF Space](https://huggingface.co/spaces/brjathu/HMR2.0)
- [ECON GitHub](https://github.com/YuliangXiu/ECON) · [ECON HF Space](https://huggingface.co/spaces/Yuliang/ECON)
- [PIFuHD GitHub](https://github.com/facebookresearch/pifuhd)
- [ICON GitHub](https://github.com/yuliangxiu/icon)
- [SIFU GitHub](https://github.com/River-Zhang/SIFU) · [arXiv](https://arxiv.org/abs/2312.06704)
- [SiTH GitHub](https://github.com/SiTH-Diffusion/SiTH) · [HF Weights](https://huggingface.co/hohs/SiTH_diffusion)
- [Human3Diffusion GitHub](https://github.com/YuxuanSnow/Human3Diffusion) · [HF Weights](https://huggingface.co/yuxuanx/human3diffusion)
- [IDOL GitHub](https://github.com/yiyuzhuang/IDOL) · [arXiv](https://arxiv.org/abs/2412.14963)
- [PSHuman GitHub](https://github.com/pengHTYX/PSHuman) · [arXiv](https://arxiv.org/abs/2409.10141)
- [LHM GitHub](https://github.com/aigc3d/LHM) · [arXiv](https://arxiv.org/abs/2503.10625) · [HF Space](https://huggingface.co/spaces/3DAIGC/LHM)
- [HumanDreamer-X GitHub](https://github.com/GigaAI-research/HumanDreamer-X)
- [GaussianAvatar GitHub](https://github.com/aipixel/GaussianAvatar)
- [VIBE GitHub](https://github.com/mkocabas/VIBE)
- [SMPLer-X GitHub](https://github.com/SMPLCap/SMPLer-X)
- [TripoSR GitHub](https://github.com/VAST-AI-Research/TripoSR)
- [Stable Fast 3D HF](https://huggingface.co/stabilityai/stable-fast-3d)
- [SMPL-X License](https://smpl-x.is.tue.mpg.de/modellicense.html)
- [Meshcapade Commercial SMPL](https://meshcapade.com/smpl/)
