from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import uuid
import db

router = APIRouter(
    prefix="/automations",
    tags=["Automations"]
)

# Global scheduler instance
scheduler = AsyncIOScheduler()

class AutomationCreate(BaseModel):
    flow_id: str
    type: str  # "CRON" or "WEBHOOK"
    cron_expr: Optional[str] = None

class AutomationStatus(BaseModel):
    status: str
    message: str

def execute_flow_task(flow_id: str):
    import time
    print(f"[Automations] Ejecutando flujo {flow_id} desatendido...")
    # TODO: Llamar al modulo runner.py
    time.sleep(2)
    print(f"[Automations] Flujo {flow_id} completado.")

def init_scheduler():
    scheduler.start()
    autos = db.automations_all()
    for auto in autos:
        if auto["status"] == "ACTIVE" and auto["type"] == "CRON":
            try:
                trigger = CronTrigger.from_crontab(auto["cron_expr"])
                scheduler.add_job(
                    execute_flow_task,
                    trigger,
                    args=[auto["flow_id"]],
                    id=auto["id"],
                    replace_existing=True
                )
            except Exception as e:
                print(f"Error cargando CRON {auto['id']}: {e}")

@router.get("/jobs")
async def list_jobs():
    return db.automations_all()

@router.post("/jobs")
async def create_job(req: AutomationCreate):
    auto_id = str(uuid.uuid4())
    auto = {
        "id": auto_id,
        "type": req.type,
        "flow_id": req.flow_id,
        "cron_expr": req.cron_expr,
        "status": "ACTIVE"
    }
    db.automation_save(auto)
    
    if req.type == "CRON" and req.cron_expr:
        try:
            trigger = CronTrigger.from_crontab(req.cron_expr)
            scheduler.add_job(
                execute_flow_task,
                trigger,
                args=[req.flow_id],
                id=auto_id,
                replace_existing=True
            )
        except Exception as e:
            db.automation_delete(auto_id)
            raise HTTPException(status_code=400, detail=f"Cron invlido: {e}")
            
    return {"status": "success", "data": auto}

@router.delete("/jobs/{job_id}")
async def delete_job(job_id: str):
    db.automation_delete(job_id)
    if scheduler.get_job(job_id):
        scheduler.remove_job(job_id)
    return {"status": "deleted"}

@router.post("/trigger/{flow_id}", response_model=AutomationStatus)
async def trigger_flow(flow_id: str, background_tasks: BackgroundTasks):
    background_tasks.add_task(execute_flow_task, flow_id)
    return {"status": "accepted", "message": f"Flujo {flow_id} encolado."}
