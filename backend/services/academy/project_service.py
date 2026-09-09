import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

import db


class Milestone(BaseModel):
    id: str
    title: str
    description: str
    completed: bool = False
    completed_at: Optional[str] = None


class LearningProjectModel(BaseModel):
    id: str
    user_id: str
    title: str
    status: str  # draft, in_progress, under_review, approved
    spec: Dict[str, Any] = Field(default_factory=dict)
    artifacts: List[Dict[str, Any]] = Field(default_factory=list)
    milestones: List[Dict[str, Any]] = Field(default_factory=list)
    reviews: List[Dict[str, Any]] = Field(default_factory=list)
    updated_at: str


class ProjectService:
    """
    Project Service manages learner projects, architectural specifications,
    milestones, and asynchronous review checkpoints.
    """

    DEFAULT_MILESTONES = [
        {"id": "m1_spec", "title": "Especificación Arquitectónica", "description": "Definición formal de contratos, diagramas C4 y metas de confiabilidad.", "completed": False},
        {"id": "m2_graph", "title": "Construcción de Topología", "description": "Implementación del grafo en Builder con validación sin bloqueantes.", "completed": False},
        {"id": "m3_chaos", "title": "Prueba de Estrés y Fallas", "description": "Inyección de fallas en Failure Lab con verificación de recuperación.", "completed": False},
        {"id": "m4_transfer", "title": "Validación de Transferencia", "description": "Superación del reto de transferencia en dominio secundario.", "completed": False},
        {"id": "m5_production", "title": "Promoción y Despliegue", "description": "Clonado a workspace de producción con cadena de evidencia.", "completed": False},
    ]

    @classmethod
    def create_project(cls, user_id: str, title: str, spec: Optional[Dict[str, Any]] = None) -> LearningProjectModel:
        now_str = datetime.now(timezone.utc).isoformat()
        project_id = f"proj_{uuid.uuid4().hex[:10]}"

        record = {
            "id": project_id,
            "user_id": user_id,
            "title": title,
            "status": "in_progress",
            "spec": spec or {},
            "artifacts": [],
            "milestones": list(cls.DEFAULT_MILESTONES),
            "reviews": [],
            "updated_at": now_str
        }

        db.project_upsert(record)
        return LearningProjectModel(**record)

    @classmethod
    def get_project(cls, project_id: str) -> Optional[LearningProjectModel]:
        data = db.project_get(project_id)
        if not data:
            return None
        return LearningProjectModel(**data)

    @classmethod
    def list_user_projects(cls, user_id: str) -> List[LearningProjectModel]:
        records = db.projects_user(user_id)
        return [LearningProjectModel(**r) for r in records]

    @classmethod
    def complete_milestone(cls, project_id: str, milestone_id: str) -> LearningProjectModel:
        data = db.project_get(project_id)
        if not data:
            raise ValueError(f"Project '{project_id}' not found.")

        milestones = data.get("milestones", [])
        found = False
        now_str = datetime.now(timezone.utc).isoformat()

        for m in milestones:
            if m.get("id") == milestone_id:
                m["completed"] = True
                m["completed_at"] = now_str
                found = True
                break

        if not found:
            raise ValueError(f"Milestone '{milestone_id}' not found in project.")

        # Check if all completed
        all_done = all(m.get("completed", False) for m in milestones)
        status = "approved" if all_done else data.get("status", "in_progress")

        updated = {
            **data,
            "milestones": milestones,
            "status": status,
            "updated_at": now_str
        }
        db.project_upsert(updated)
        return LearningProjectModel(**updated)

    @classmethod
    def attach_artifact(cls, project_id: str, artifact: Dict[str, Any]) -> LearningProjectModel:
        data = db.project_get(project_id)
        if not data:
            raise ValueError(f"Project '{project_id}' not found.")

        artifacts = data.get("artifacts", [])
        artifact_record = {
            "id": f"art_{uuid.uuid4().hex[:8]}",
            "attached_at": datetime.now(timezone.utc).isoformat(),
            **artifact
        }
        artifacts.append(artifact_record)

        updated = {
            **data,
            "artifacts": artifacts,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        db.project_upsert(updated)
        return LearningProjectModel(**updated)
