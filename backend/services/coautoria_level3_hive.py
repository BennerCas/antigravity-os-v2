import uuid
import logging
from typing import Dict, Any, Optional
import json

logger = logging.getLogger(__name__)

class HiveManager:
    """
    Level 3: Strategic Hive (Enjambre Estratégico).
    Orchestrates multiple Swarms (Colmenas) for a massive global objective.
    """
    def __init__(self, hive_name: str = "Global Hive"):
        self.hive_id = str(uuid.uuid4())
        self.hive_name = hive_name
        self.swarms: Dict[str, Any] = {}
        self.global_objective: str = ""
        self.hive_state = "initialized"

    def assign_global_objective(self, objective: str):
        self.global_objective = objective
        self.hive_state = "objective_received"
        
    async def orchestrate_hive_async(self, global_objective: str, swarm_definitions: list) -> str:
        """
        swarm_definitions is a list of dicts: [{"name": "Frontend Swarm", "objective": "..."}]
        """
        from backend.services.coautoria_level2_swarm import SwarmOrchestrator
        from backend.services.supervisor_router import AgentCard
        from backend.services.agent_factory import AgentFactory
        
        self.assign_global_objective(global_objective)
        self.hive_state = "orchestrating"
        
        hive_log = f"=== INICIANDO COLMENA (NIVEL 3): {self.global_objective} ===\n\n"
        final_artifacts = []
        
        for sdef in swarm_definitions:
            swarm_name = sdef.get("name")
            swarm_obj = sdef.get("objective")
            hive_log += f"--- LEVANTANDO {swarm_name} ---\nObjetivo: {swarm_obj}\n\n"
            
            # Pedimos a la IA que defina dinámicamente de 4 a 15 agentes para este enjambre
            team_prompt = (
                f"ROLE: AI Team Builder\n"
                f"CONTEXT: Define un equipo táctico de 4 a 6 agentes (JSON array) para el enjambre '{swarm_name}' con el objetivo '{swarm_obj}'.\n"
                f"CONSTRAINTS: Devuelve ÚNICAMENTE un JSON estricto con el formato:\n"
                f"[{{\"id\": \"..\", \"name\": \"..\", \"description\": \"..\", \"capabilities\": [\"..\"]}}]"
            )
            
            try:
                team_json_str = await AgentFactory.chat_one_shot("system_builder", team_prompt, model="gemini-2.5-flash", use_tools=False)
                # Parse the JSON
                start_idx = team_json_str.find("[")
                end_idx = team_json_str.rfind("]") + 1
                team_data = json.loads(team_json_str[start_idx:end_idx])
                
                agents = [AgentCard(**d) for d in team_data]
            except Exception as e:
                # Fallback to standard 4
                agents = [
                    AgentCard(id="arq1", name="Architect", description="Diseña base.", capabilities=["design"]),
                    AgentCard(id="sec1", name="Security", description="Audita.", capabilities=["security"]),
                    AgentCard(id="uiux", name="Specialist", description="Construye.", capabilities=["code"]),
                    AgentCard(id="qa", name="QA", description="Testea.", capabilities=["testing"])
                ]
            
            orchestrator = SwarmOrchestrator(agents=agents)
            swarm_result = await orchestrator.execute_swarm_async(swarm_obj)
            
            # Extract the artifact from the swarm result
            # We assume swarm_result is "<swarm>...</swarm>\n<artifact name=...>...</artifact>"
            hive_log += swarm_result + "\n\n"
            
        self.hive_state = "completed"
        return hive_log
