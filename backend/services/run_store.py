from typing import Dict, Any, List, Optional
import uuid
from datetime import datetime
from backend.schemas.hitl import ApprovalTask

class RunStore:
    """
    Mock/In-memory persistent store for runs, checkpoints, and events.
    """
    def __init__(self):
        self.runs: Dict[str, Dict[str, Any]] = {}
        self.events: Dict[str, List[Dict[str, Any]]] = {}
        self.checkpoints: Dict[str, Dict[str, Any]] = {}
        self.approval_tasks: Dict[str, ApprovalTask] = {}
        self.published_revisions: Dict[str, Dict[str, Any]] = {}
        
    def start_run(self, flow_id: str, revision: int, input_data: Dict[str, Any], idempotency_key: str) -> str:
        run_id = str(uuid.uuid4())
        self.runs[run_id] = {
            "id": run_id,
            "flow_id": flow_id,
            "revision": revision,
            "status": "running",
            "idempotency_key": idempotency_key,
            "started_at": datetime.utcnow().isoformat(),
            "input_data": input_data,
            "current_node": None
        }
        self.events[run_id] = []
        
        self.emit_event(run_id, "run_started", {"flow_id": flow_id, "revision": revision})
        return run_id
        
    def emit_event(self, run_id: str, event_type: str, payload: Dict[str, Any]):
        if run_id not in self.events:
            self.events[run_id] = []
            
        event = {
            "id": str(uuid.uuid4()),
            "run_id": run_id,
            "event_type": event_type,
            "timestamp": datetime.utcnow().isoformat(),
            "payload": payload
        }
        self.events[run_id].append(event)
        
    def save_checkpoint(self, run_id: str, thread_id: str, state: Dict[str, Any]):
        """Durable checkpointing mechanism for LangGraph state"""
        self.checkpoints[thread_id] = {
            "run_id": run_id,
            "thread_id": thread_id,
            "state": state,
            "saved_at": datetime.utcnow().isoformat()
        }
        
    def create_approval_task(self, task: ApprovalTask):
        self.approval_tasks[task.id] = task
        self.emit_event(task.run_id, "human_paused", {"task_id": task.id, "node_id": task.pending_node_id})
        
    def resolve_approval_task(self, task_id: str, action_id: str, payload: Dict[str, Any]):
        if task_id in self.approval_tasks:
            task = self.approval_tasks[task_id]
            task.status = "completed"
            self.emit_event(task.run_id, "human_resumed", {"task_id": task_id, "action": action_id})
            
    def publish_revision(self, flow_id: str, builder_flow: Any, runtime_graph: Any) -> int:
        revision_id = f"{flow_id}_{runtime_graph.revision}"
        self.published_revisions[revision_id] = {
            "flow_id": flow_id,
            "revision": runtime_graph.revision,
            "builder_flow": builder_flow.model_dump(),
            "runtime_graph": runtime_graph.model_dump(),
            "published_at": datetime.utcnow().isoformat()
        }
        return runtime_graph.revision

    def get_run_events(self, run_id: str) -> List[Dict[str, Any]]:
        return self.events.get(run_id, [])
