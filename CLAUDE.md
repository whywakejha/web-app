# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PrintLlama** — an AI t-shirt design app. Users describe a design in plain English; the backend calls `black-forest-labs/FLUX.1-schnell` via HuggingFace and returns a base64 PNG. The frontend renders it as a decal on a 3D mannequin.

## Commands

```bash
# Frontend (client/)
npm install
npm run dev       # Vite dev server on :5173
npm run build
npm test          # Vitest

# Backend (api/)
pip install -r requirements.txt
uvicorn main:app --reload   # FastAPI on :8000
pytest
pytest tests/test_foo.py::test_bar
```

Set `HUGGINGFACE_API_KEY` in `api/.env`.

## Architecture

### Frontend (`client/src/`)

Two routes via React Router: `/` → `Landing.jsx`, `/design` → `Design.jsx`.

`Design.jsx` owns all state (`shirtColor`, `bodyType`, `designSrc`, `isGenerating`) and passes it down to two siblings:
- **`<Canvas>`** wrapping `<Mannequin>` — the Three.js scene
- **`<DesignPanel>`** — the sidebar with body-type selector, colour swatches, prompt textarea, and design preview

Vite proxies `/api/*` → `http://localhost:8000` (configured in `vite.config.js`), so `fetch('/api/generate-design', ...)` works in dev without CORS issues.

#### Mannequin rendering (`Mannequin.jsx`)

Tries to load `/models/mannequin.glb` via `useGLTF`. If the file is missing or loading fails, a `GLBErrorBoundary` + `<Suspense>` catches it and renders a **geometric primitive fallback** (`MannequinPrimitive`) built from Three.js cylinder/sphere geometries. Both paths accept `color`, `bodyType`, and `designSrc` props; the design image is placed as a floating `<planeGeometry>` mesh in front of the chest.

Body type (`slim` / `regular` / `athletic` / `plus`) scales the model via `BODY_SCALES` (GLB path) or `BODY_PARAMS` dimensional constants (primitive path).

`TShirt.jsx` is a standalone extruded-shape component (not used in the main flow) — it exists as an alternative flat t-shirt view.

### Backend (`api/main.py`)

Single-file FastAPI app with two endpoints:
- `POST /api/generate-design` — accepts `{ prompt }`, appends a fixed `TSHIRT_SUFFIX` for screen-print constraints, calls `InferenceClient.text_to_image()` with FLUX.1-schnell, returns `{ image: "<base64 PNG>" }`
- `GET /api/health`

`InferenceClient` is a lazily-initialized module-level singleton. CORS allows only `http://localhost:5173`.
