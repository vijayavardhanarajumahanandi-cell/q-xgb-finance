# Q-XGB Finance

Full-stack Next.js + FastAPI research platform for the Q-XGB Gold-market machine-learning project.

## Stack

- Next.js App Router + React + TypeScript
- Tailwind CSS 4
- Recharts
- Lucide React
- FastAPI + Pydantic
- Optional XGBoost / SHAP / PennyLane / yfinance model runtime
- Vercel Services
- **No database**

## Repository

```text
q-xgb-finance/
├── frontend/       # Next.js application
├── backend/        # FastAPI application
├── vercel.json     # Vercel Services routing
└── README.md
```

## Local development

### Fastest path: Vercel local services

Install the Vercel CLI and run from this folder:

```bash
vercel dev
```

The current Vercel Services pattern supports a Next.js frontend and FastAPI backend in sibling directories with API rewrites. The application uses `/api/*` for FastAPI routes.

### Separate servers

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Backend:

```bash
cd backend
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

For separate-server frontend requests create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api
```

## Real model artifacts

The frontend/backend work without a database and without a model artifact by using a clearly labeled Demo Mode.

To prepare a local XGBoost artifact:

```bash
cd backend
pip install -r requirements-ml.txt
python ml/train_models.py
```

This creates:

```text
backend/artifacts/model_bundle.joblib
backend/artifacts/metadata.json
```

The supplied training script reproduces the project's 12-feature engineering and chronological 70/15/15 split. The quantum artifact remains intentionally separate: the deployed service does not fabricate QML results when a trained PennyLane artifact is not present.

## Deploy to Vercel

1. Push this folder to GitHub.
2. Import the repository into Vercel.
3. Keep the repository root as the Vercel project root.
4. Vercel reads `vercel.json` and builds the `frontend` and `backend` services together.
5. API routes are served under `/api/*`.

No database environment variables are required.

## Important behavior

- No passwords are stored.
- No server-side prediction history is stored.
- Browser-local history/preferences use `localStorage`.
- Demo data is explicitly labeled.
- The frontend does not execute PennyLane circuits.
- The backend only reports quantum metadata when a real artifact is available.
- The application does not claim guaranteed profits or quantum advantage.
