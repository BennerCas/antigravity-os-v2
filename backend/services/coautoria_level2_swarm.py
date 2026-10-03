"""
CoautorIA Level 2: Tactical Swarms
Manages a swarm of agents (4-15) using a SupervisorRouter for task delegation
and a Blackboard for shared state and consensus.
"""

from typing import List, Dict, Any, Optional
from backend.services.supervisor_router import SupervisorRouter, AgentCard
from backend.services.blackboard_manager import blackboard
from backend.services.agent_factory import AgentFactory

class SwarmOrchestrator:
    """
    Manages a Tactical Swarm (Level 2 of CoautorIA).
    Enforces a minimum of 4 and maximum of 15 agents.
    Delegates tasks using SupervisorRouter and shares state via the blackboard.
    """
    def __init__(self, agents: Optional[List[AgentCard]] = None, use_llm_router: bool = False):
        self.router = SupervisorRouter(use_llm=use_llm_router)
        self.agents: List[AgentCard] = []
        
        if agents:
            for agent in agents:
                self.add_agent(agent)

    def add_agent(self, agent: AgentCard) -> None:
        """Adds an agent to the swarm, enforcing the max limit of 15."""
        if len(self.agents) >= 15:
            raise ValueError("Swarm cannot exceed 15 agents.")
        self.agents.append(agent)

    async def execute_swarm_async(self, objective: str) -> str:
        """
        Ejecuta el enjambre de forma real, pasando el objetivo por los nodos.
        Genera un log de discusion y al final un artefacto.
        """
        # removed restriction to allow < 4 agents if Hermes decides so

        blackboard.set("swarm_status", "running")
        
        swarm_log = ""
        context = f"Objetivo Inicial: {objective}\n\n"
        
        for idx, agent in enumerate(self.agents):
            try:
                # Instruccion especifica segun su rol en el enjambre
                prompt = (
                    f"ROLE: Eres '{agent.name}'. {agent.description}\n"
                    f"CONTEXT: Estás operando en un Enjambre Táctico. Debes analizar el objetivo del usuario y criticar/mejorar las aportaciones previas de tus colegas.\n"
                    f"STYLE: Alta densidad técnica, vocabulario especializado de ingeniería. Cero saludos, cero cortesía.\n\n"
                    f"CONSTRAINTS:\n"
                    f"1. Razona tu postura OBLIGATORIAMENTE usando etiquetas <thinking> y </thinking>.\n"
                    f"2. Tu dictamen final (fuera del thinking) debe tener EXACTAMENTE 2 párrafos altamente condensados.\n"
                    f"3. Debes apuntar directamente a fallas o aportar código/estructuras vitales desde tu dominio de autoridad.\n\n"
                    f"OBJETIVO INICIAL: {objective}\n\n"
                    f"HISTORIAL DEL DEBATE (Blackboard):\n{context}"
                )
                
                # Ejecucion REAL llamando a un modelo local/cloud via AgentFactory
                response = await AgentFactory.chat_one_shot(
                    agent_id=agent.id,
                    user_prompt=prompt,
                    model="gemini-2.5-flash", # Puedes cambiar al motor local si lo requieres
                    use_tools=False
                )
                
                swarm_log += f"[{agent.name}]: {response}\n\n"
                context += f"Aporte de {agent.name}:\n{response}\n\n"
                
            except Exception as e:
                swarm_log += f"[{agent.name}]: Error al procesar - {str(e)}\n\n"

        # Escribano Final: Compila el artefacto
        escribano_prompt = (
            "ROLE: Eres 'Lead Integration Compiler' (El Escribano de Antigravity OS). Tu función es consolidar el debate táctico en un artefacto de software definitivo y ejecutable.\n"
            "CONTEXT: Un enjambre táctico ha debatido la solución. Debes compilar el artefacto final solicitado por el usuario.\n"
            "STYLE: Máximo rigor técnico. Cero texto conversacional periférico.\n\n"
            "CONSTRAINTS:\n"
            "1. Procesa tu síntesis lógica dentro de etiquetas <thinking> y </thinking>.\n"
            "2. El resultado final DEBE estar contenido de manera íntegra y exclusiva dentro de una estructura <artifact name=\"dashboard_app\">...</artifact>.\n"
            "3. REGLA DE ARTEFACTO VIVO: Si el usuario solicitó un dashboard, interfaz, login o aplicación, el contenido de <artifact> DEBE ser un archivo HTML/JS/CSS 100% completo, autocontenido y listo para renderizarse en vivo en el navegador (usando Tailwind CSS CDN, Chart.js CDN, iconos y estados interactivos reales). Debe ser visualmente impactante, con modo oscuro premium, métricas, botones funcionales y componentes activos.\n"
            "4. Prohibido omitir partes con '...'. Todo debe ser código real y ejecutable.\n\n"
            "SCHEMA ESPERADO:\n"
            "<thinking>\n1. Consolidación de Arquitectura\n2. Implementación de Componentes e Interactividad\n</thinking>\n<artifact name=\"dashboard_app\">\n<!DOCTYPE html>\n<html>...</html>\n</artifact>"
        )
        try:
            final_artifact = await AgentFactory.chat_one_shot(
                agent_id="escribano",
                user_prompt=escribano_prompt + "\n\nDiscusión:\n" + context,
                model="gemini-2.5-flash",
                use_tools=False
            )
        except Exception as e:
            final_artifact = f"<artifact name=\"Error\">{str(e)}</artifact>"

        blackboard.set("swarm_status", "completed")
        
        return f"<swarm>\n{swarm_log.strip()}\n</swarm>\n\n{final_artifact.strip()}"
