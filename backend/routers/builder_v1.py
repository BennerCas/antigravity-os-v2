from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List
from pydantic import BaseModel

from backend.schemas.builder_flow import BuilderFlow
from backend.services.flow_normalizer import LegacyFlowAdapter
from backend.services.flow_validator import FlowValidator
from backend.services.flow_compiler import FlowCompiler, CompilerError
from backend.services.run_store import RunStore
from backend.services.capability_registry import CapabilityRegistry

router = APIRouter(prefix="/v1/builder", tags=["Builder V1"])

# In-memory singletons for Phase 1
run_store = RunStore()
capability_registry = CapabilityRegistry()

class ValidateRequest(BaseModel):
    flow_data: Dict[str, Any]
    is_legacy: bool = False

@router.post("/validate")
async def validate_flow(req: ValidateRequest):
    """
    Validates a BuilderFlow (normalizes from legacy if required).
    Returns findings without side effects.
    """
    try:
        if req.is_legacy:
            normalized_dict = LegacyFlowAdapter.normalize(req.flow_data)
            builder_flow = BuilderFlow(**normalized_dict)
        else:
            builder_flow = BuilderFlow(**req.flow_data)
            
        findings = FlowValidator.validate_topology(builder_flow)
        
        return {
            "status": "success",
            "is_valid": not any(f.severity == "blocking" for f in findings),
            "findings": [f.__dict__ for f in findings],
            "normalized_flow": builder_flow.model_dump() if req.is_legacy else None
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

class PublishRequest(BaseModel):
    flow_data: Dict[str, Any]

@router.post("/publish")
async def publish_flow(req: PublishRequest):
    """
    Compiles a BuilderFlow to a RuntimeGraph and saves an immutable Flow Revision.
    """
    try:
        builder_flow = BuilderFlow(**req.flow_data)
        
        # We auto-increment revision based on existing in run_store (mock behavior)
        # In a real DB we'd count(revisions) where flow_id = builder_flow.id
        next_revision = builder_flow.revision + 1
        
        # Compile
        runtime_graph = FlowCompiler.compile(builder_flow, next_revision)
        
        # Persist Immutable Revision
        run_store.publish_revision(builder_flow.id, builder_flow, runtime_graph)
        
        return {
            "status": "success",
            "message": "Flow published successfully.",
            "revision": next_revision,
            "flow_hash": runtime_graph.flow_hash,
            "runtime_graph": runtime_graph.model_dump()
        }
    except CompilerError as ce:
        raise HTTPException(status_code=422, detail=f"Compilation Error: {str(ce)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/capabilities")
async def list_capabilities():
    """Returns available capabilities from the registry"""
    return {
        "capabilities": [c.model_dump() for c in capability_registry.capabilities.values()],
        "model_profiles": [m.model_dump() for m in capability_registry.model_profiles.values()]
    }
