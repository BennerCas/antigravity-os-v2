from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from pydantic import BaseModel

from backend.schemas.architecture import ArchitectureSpec
from backend.services.architect_engine import ArchitectEngine
from backend.services.flow_normalizer import LegacyFlowAdapter
from backend.schemas.builder_flow import BuilderFlow

router = APIRouter(prefix="/v1/architect", tags=["FlowArchitect V1"])

class DiscoveryRequest(BaseModel):
    conversation_history: List[Dict[str, Any]]

@router.post("/discovery/analyze")
async def analyze_discovery(req: DiscoveryRequest):
    """
    Analyzes conversation to extract Intents and Requirements.
    """
    try:
        analysis = ArchitectEngine.analyze_discovery(req.conversation_history)
        return {"status": "success", "analysis": analysis}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class BlueprintRequest(BaseModel):
    intent: Dict[str, Any]
    requirements: Dict[str, Any]

@router.post("/blueprint/generate")
async def generate_blueprint(req: BlueprintRequest):
    """
    Generates ArchitectureSpec v1 from Intents and Requirements.
    """
    try:
        spec = ArchitectEngine.generate_blueprint(req.intent, req.requirements)
        return {"status": "success", "spec": spec.model_dump()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class PublishBlueprintRequest(BaseModel):
    spec_data: Dict[str, Any]

@router.post("/publish")
async def publish_blueprint_to_builder(req: PublishBlueprintRequest):
    """
    Converts ArchitectureSpec v1 to BuilderFlow v1 (BuilderPatches)
    so the Builder UX can load it.
    """
    try:
        # For Phase 2, this does a 1:1 translation for scaffolding.
        # It's an initial BuilderFlow draft.
        spec = ArchitectureSpec(**req.spec_data)
        
        # We translate ArchitectureStep -> BuilderNode
        nodes = []
        for step in spec.steps:
            nodes.append({
                "id": step.id,
                "kind": step.kind,
                "name": step.name or step.kind,
                "config": step.configuration,
                "ui": {"position": {"x": 100, "y": 100}} # Auto-layout would place these properly
            })
            
        edges = []
        for trans in spec.transitions:
            edges.append({
                "id": trans.id,
                "from": trans.from_step,
                "to": trans.to_step,
                "kind": trans.kind,
                "label": trans.route.get("label") if trans.route else None,
                "ui": {}
            })
            
        builder_flow_raw = {
            "schema_version": "builder/v1",
            "id": spec.id,
            "revision": 1,
            "metadata": {"name": spec.intent.goal},
            "nodes": nodes,
            "edges": edges,
            "ui": {"viewport": {"x": 0, "y": 0, "zoom": 1}}
        }
        
        builder_flow = BuilderFlow(**builder_flow_raw)
        
        return {
            "status": "success",
            "message": "Blueprint pushed to Builder",
            "builder_flow": builder_flow.model_dump()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
