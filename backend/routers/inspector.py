from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/inspector", tags=["inspector"])


class TraceResult(BaseModel):
    trace_id: str
    run_id: str
    status: str
    spans: list[dict[str, Any]]


class ReplayRequest(BaseModel):
    trace_id: str
    node_id: str


class ReplayResult(BaseModel):
    scenario_id: str
    status: str
    details: str


class ErrorLogResult(BaseModel):
    log_id: str
    severity: str
    message: str
    trace_id: str


@router.get("/traces/{run_id}", response_model=list[TraceResult])
async def get_telemetry_traces(run_id: str):
    """
    Fetch telemetry traces and spans for a specific run execution.
    """
    return [
        TraceResult(
            trace_id=f"trace-{run_id}-001",
            run_id=run_id,
            status="OK",
            spans=[
                {
                    "span_id": "span-1",
                    "node": "trigger",
                    "duration_ms": 12,
                    "cost": 0.0,
                },
                {
                    "span_id": "span-2",
                    "node": "lead_qual",
                    "duration_ms": 1500,
                    "cost": 0.021,
                },
            ],
        )
    ]


@router.post("/replay", response_model=ReplayResult)
async def create_replay_session(request: ReplayRequest):
    """
    Create a deterministic replay session from a telemetry trace.
    """
    return ReplayResult(
        scenario_id="scenario_mock_123",
        status="CREATED",
        details=f"Replay session ready for trace {request.trace_id} at node {request.node_id}",
    )


@router.get("/errors", response_model=list[ErrorLogResult])
async def get_error_logs():
    """
    Fetch active error logs and incident reports.
    """
    return [
        ErrorLogResult(
            log_id="err-001",
            severity="HIGH",
            message="SCHEMA_MISMATCH in router node",
            trace_id="trace-err-001",
        )
    ]
