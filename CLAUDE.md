# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A web application with a 3D React frontend and LLM API endpoints powered by HuggingFace models.

## Intended Architecture

### Frontend (`/client` or `/frontend`)
- React with Three.js (via `@react-three/fiber` and `@react-three/drei`) for 3D rendering
- API calls to the backend LLM endpoints

### Backend (`/server` or `/api`)
- Node.js (Express) or Python (FastAPI/Flask) serving LLM inference endpoints
- HuggingFace `transformers` or `@huggingface/inference` SDK for model calls
- Routes should be prefixed under `/api/`

## Suggested Setup Commands

Once the project is scaffolded, common commands will be:

```bash
# Install dependencies
npm install          # frontend
pip install -r requirements.txt  # backend (if Python)

# Development
npm run dev          # start frontend dev server (Vite/CRA)
npm run server       # start backend server

# Build
npm run build        # production build of frontend

# Tests
npm test             # run frontend tests
pytest               # run backend tests (if Python)
```

## HuggingFace Integration

- Store the HuggingFace API token in `.env` as `HUGGINGFACE_API_KEY` (never commit `.env`)
- Use the Inference API for serverless model calls, or `transformers` pipeline for local inference
- Prefer streaming responses for LLM endpoints to reduce perceived latency

## 3D React Notes

- Use `@react-three/fiber` as the React renderer for Three.js scenes
- Use `@react-three/drei` for helpers (cameras, controls, loaders, etc.)
- Keep heavy 3D assets (GLTF/GLB) in `public/models/` and lazy-load them
- Wrap `<Canvas>` in a `Suspense` boundary with a fallback for asset loading
