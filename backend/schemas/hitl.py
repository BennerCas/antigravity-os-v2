from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class HITLAction(BaseModel):
    id: str
    label: str
    route_to: str
    requires_comment: bool = False


class ResumeContract(BaseModel):
    schema_ref: str | None = None
    expected_fields: list[str] = Field(default_factory=list)


class ApprovalTask(BaseModel):
    id: str
    run_id: str
    thread_id: str
    pending_node_id: str
    status: str = "pending"  # pending, completed, expired
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime | None = None
    assigned_roles: list[str] = Field(default_factory=list)
    title: str
    objective: str
    evidence_redacted: dict[str, Any] = Field(default_factory=dict)
    actions: list[HITLAction] = Field(
        default_factory=lambda: [
            HITLAction(id="approve", label="Approve", route_to="approve"),
            HITLAction(
                id="reject", label="Reject", route_to="reject", requires_comment=True
            ),
        ]
    )
    resume_contract: ResumeContract = Field(default_factory=ResumeContract)
    expiry_policy: str = "route_expired"  # route_expired, dead_letter
