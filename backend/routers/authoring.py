from typing import Any

from fastapi import APIRouter, HTTPException
from schemas.authoring import AuthoringIntent, CommandEnvelope
from services.reducer import reduce_state

router = APIRouter(prefix="/authoring", tags=["Authoring"])

# In-memory store for demonstration purposes
# In a real system, this would be loaded from the database
project_states: dict[str, dict[str, Any]] = {}


@router.post("/intent")
def process_authoring_intent(intent: AuthoringIntent):
    """
    Process an AUTHORING_INTENT JSON patch.
    This endpoint validates the intent and can be used by the front-end.
    """
    return {"status": "accepted", "intent": intent.dict()}


@router.post("/command/{project_id}")
def process_command(project_id: str, envelope: CommandEnvelope):
    """
    Applies a command envelope to the project state.
    """
    if project_id not in project_states:
        project_states[project_id] = {"rev": 0, "graph": {"nodes": [], "edges": []}}

    state = project_states[project_id]

    next_state, error = reduce_state(state, envelope)
    if error:
        raise HTTPException(status_code=409, detail=error)

    project_states[project_id] = next_state

    return {"status": "success", "new_rev": next_state["rev"]}
