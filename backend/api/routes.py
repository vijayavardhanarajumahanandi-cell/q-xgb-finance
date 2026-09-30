from __future__ import annotations

from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Any

from ml.service import model_service

router = APIRouter()


class PredictionRequest(BaseModel):
    instrument: str = Field(default="GC=F", min_length=1, max_length=32)
    timeframe: str = Field(default="1d", min_length=1, max_length=16)
    timestamp: str | None = None
    features: dict[str, float] = Field(default_factory=dict)


class ExplainRequest(BaseModel):
    instrument: str = "GC=F"
    timeframe: str = "1d"
    features: dict[str, float] = Field(default_factory=dict)


class BacktestRequest(BaseModel):
    instrument: str = "GC=F"
    timeframe: str = "1d"
    start_date: str | None = None
    end_date: str | None = None
    initial_capital: float = Field(default=10000, gt=0)
    transaction_cost: float = Field(default=0, ge=0)
    spread: float = Field(default=0, ge=0)
    slippage: float = Field(default=0, ge=0)
    model: str = "hybrid"


@router.get("/api/health")
def health() -> dict[str, Any]:
    return model_service.health()


@router.get("/api/models")
def models() -> dict[str, Any]:
    return model_service.models()


@router.get("/api/quantum")
def quantum() -> dict[str, Any]:
    return model_service.quantum_metadata()


@router.get("/api/market")
def market(
    instrument: str = Query("GC=F"),
    timeframe: str = Query("1d"),
    limit: int = Query(120, ge=20, le=500),
):
    return model_service.market(instrument=instrument, timeframe=timeframe, limit=limit)


@router.get("/api/indicators")
def indicators(instrument: str = Query("GC=F"), timeframe: str = Query("1d")):
    return model_service.indicators(instrument=instrument, timeframe=timeframe)


@router.get("/api/performance")
def performance():
    return model_service.performance()


@router.post("/api/predict")
def predict(req: PredictionRequest):
    try:
        return model_service.predict(req.instrument, req.timeframe, req.timestamp, req.features)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.post("/api/explain")
def explain(req: ExplainRequest):
    return model_service.explain(req.instrument, req.timeframe, req.features)


@router.post("/api/backtest")
def backtest(req: BacktestRequest):
    return model_service.backtest(req.model_dump())


@router.get("/api/system-info")
def system_info():
    return {
        "service": "Q-XGB Finance API",
        "version": "1.0.0",
        "database": False,
        "storage": "request-scoped backend + browser-local frontend storage",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
