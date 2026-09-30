# FastAPI backend

Run locally:

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

For local real model work:

```bash
pip install -r requirements-ml.txt
python ml/train_models.py
```

The backend does not use a database. It is designed for Vercel's Python runtime and request-based execution. Model artifacts, when present, are read from `backend/artifacts/`.
