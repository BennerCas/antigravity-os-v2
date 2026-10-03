from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import uuid
import db
import os
import sys
import subprocess
from routers.compiler import generate_langgraph_code, Node, Edge

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
    name: Optional[str] = None
    master_prompt: Optional[str] = None
    retries: Optional[int] = 0
    timeout: Optional[int] = 30

class AutomationStatus(BaseModel):
    status: str
    message: str

def execute_flow_task(flow_id: str, auto_id: str = None):
    print(f"[Automations] Ejecutando flujo {flow_id} desatendido (Auto ID: {auto_id})...")
    
    # 1. Fetch flow
    flows = db.flows_all()
    flow = next((f for f in flows if f["id"] == flow_id), None)
    if not flow:
        print(f"[Automations] Flujo {flow_id} no encontrado.")
        return

    # 2. Fetch automation to get master_prompt, timeout, retries
    autos = db.automations_all()
    auto = next((a for a in autos if a["id"] == auto_id), {}) if auto_id else {}
    
    master_prompt = auto.get("master_prompt") or "Start execution"
    timeout_mins = auto.get("timeout") or 30
    retries = auto.get("retries") or 0
    
    # 3. Compile code
    # Extract node data from React Flow structure
    try:
        nodes = []
        for n in flow.get("nodes", []):
            data = n.get("data", {})
            nodes.append(Node(
                id=n.get("id"),
                title=data.get("title", "Node"),
                content=data.get("content", ""),
                role=data.get("role", "assistant"),
                llm_model=data.get("llm_model", "hermes3:unlocked"),
                temperature=float(data.get("temperature", 0.7))
            ))
        edges = [Edge(source=e.get("source"), target=e.get("target")) for e in flow.get("edges", [])]
    except Exception as e:
        db.execution_log(
            job_id=auto_id,
            framework="langgraph",
            model_used="system",
            exit_code=1,
            log=f"Error parsing flow nodes: {str(e)}"
        )
        return
    
    code = generate_langgraph_code(nodes, edges, execution_plan=master_prompt)
    
    # 4. Save to a unique runner file
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    sandbox_dir = os.path.join(base_dir, "sandbox")
    os.makedirs(sandbox_dir, exist_ok=True)
    runner_path = os.path.join(sandbox_dir, f"runner_auto_{auto_id or flow_id}.py")
    
    with open(runner_path, "w", encoding="utf-8") as f:
        f.write(code)

    # 5. Execute with retries
    attempts = 0
    while attempts <= retries:
        print(f"[Automations] Intentando ejecución {attempts + 1}/{retries + 1}...")
        try:
            proc = subprocess.run(
                [sys.executable, runner_path],
                capture_output=True,
                text=True,
                timeout=timeout_mins * 60,
                encoding="utf-8",
                errors="replace"
            )
            
            output = proc.stdout + "\n" + proc.stderr
            db.execution_log(framework="langgraph", model_used="automation", exit_code=proc.returncode, log=output)
            
            if proc.returncode == 0:
                print(f"[Automations] Flujo {flow_id} completado con éxito.")
                break
            else:
                print(f"[Automations] Error en ejecución {attempts + 1}. Exit code {proc.returncode}")
                attempts += 1
                
        except subprocess.TimeoutExpired as e:
            err = f"Timeout de {timeout_mins} minutos excedido."
            print(f"[Automations] {err}")
            db.execution_log(framework="langgraph", model_used="automation", exit_code=-1, log=err)
            attempts += 1
        except Exception as e:
            print(f"[Automations] Fallo catastrófico: {e}")
            db.execution_log(framework="langgraph", model_used="automation", exit_code=-1, log=str(e))
            attempts += 1

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
                    args=[auto["flow_id"], auto["id"]],
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
        "name": req.name,
        "type": req.type,
        "flow_id": req.flow_id,
        "cron_expr": req.cron_expr,
        "master_prompt": req.master_prompt,
        "retries": req.retries,
        "timeout": req.timeout,
        "status": "ACTIVE"
    }
    db.automation_save(auto)
    
    if req.type == "CRON" and req.cron_expr:
        try:
            trigger = CronTrigger.from_crontab(req.cron_expr)
            scheduler.add_job(
                execute_flow_task,
                trigger,
                args=[req.flow_id, auto_id],
                id=auto_id,
                replace_existing=True
            )
        except Exception as e:
            db.automation_delete(auto_id)
            raise HTTPException(status_code=400, detail=f"Cron invalido: {e}")
            
    return {"status": "success", "data": auto}

@router.delete("/jobs/{job_id}")
async def delete_job(job_id: str):
    db.automation_delete(job_id)
    if scheduler.get_job(job_id):
        scheduler.remove_job(job_id)
    return {"status": "deleted"}

@router.post("/trigger/{flow_id}", response_model=AutomationStatus)
async def trigger_flow(flow_id: str, background_tasks: BackgroundTasks, auto_id: Optional[str] = None):
    background_tasks.add_task(execute_flow_task, flow_id, auto_id)
    return {"status": "accepted", "message": f"Flujo {flow_id} encolado."}
