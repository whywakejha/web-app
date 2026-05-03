# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A web application with a 3D React frontend and LLM API endpoints powered by HuggingFace models.

## Architecture

### Frontend (`/client`)
- React + Vite with Three.js via `@react-three/fiber` and `@react-three/drei`
- Wrap `<Canvas>` in a `Suspense` boundary; store GLTF/GLB assets in `public/models/` and lazy-load them
- API calls go to backend routes under `/api/`

### Backend (`/api`)
- Python + FastAPI serving LLM inference endpoints
- HuggingFace Inference API (serverless) via `huggingface_hub`; use streaming responses
- All routes prefixed under `/api/`
- Store `HUGGINGFACE_API_KEY` in `.env`

## Commands

```bash
# Frontend
cd client
npm install
npm run dev       # Vite dev server
npm run build
npm test          # Vitest

# Backend
cd api
pip install -r requirements.txt
uvicorn main:app --reload
pytest            # run all tests
pytest tests/test_foo.py::test_bar  # run a single test
```
