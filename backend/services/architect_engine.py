import uuid
import json
from typing import Dict, Any, List
from backend.schemas.architecture import ArchitectureSpec, Intent, Requirements, ArchitectureStateContract
from backend.routers.builder_actions import call_ai

FLOW_ARCHITECT_DISCOVERY_SYSTEM = (
    "Eres el FlowArchitect, un experto arquitecto de sistemas de IA y asistente técnico proactivo. "
    "Tu objetivo es interactuar con el usuario para ayudarle a diseñar, pensar y estructurar la aplicación o flujo que desea crear. "
    "Da ideas, sugiere mejoras, haz preguntas clave y asiste activamente en la definición del requerimiento.\n\n"
    "DEBES devolver UNICAMENTE un JSON valido (sin bloques ```json de markdown) con esta estructura exacta:\n"
    "{\n"
    '  "reply": "Tu respuesta conversacional, amigable y experta en TEXTO PLANO (SIN asteriscos, SIN negritas, SIN markdown, SIN caracteres especiales)",\n'
    '  "suggested_actions": ["Sugerencia corta 1", "Sugerencia corta 2", "Generar Blueprint"],\n'
    '  "intent": {"goal": "...", "success_criteria": ["..."]}, \n'
    '  "requirements": {"trigger": "...", "assumptions": [{"name": "...", "value": true}], "constraints": [{"name": "...", "value": "..."}]}\n'
    "}\n\n"
    "REGLAS OBLIGATORIAS:\n"
    "- 'reply' debe contener TODA la respuesta de texto visible para el usuario y DEBE ser texto plano sin formateo markdown.\n"
    "- 'suggested_actions' debe ser una lista de 2 a 3 frases cortas que el usuario podría responder a continuación.\n"
    "- NUNCA salgas del formato JSON. Si no puedes extraer un intent claro aún, pon valores genéricos u omítelos, pero asegúrate de devolver JSON válido."
)

FLOW_ARCHITECT_BLUEPRINT_SYSTEM = (
    "Eres el FlowArchitect. Genera un Blueprint de arquitectura (ArchitectureSpec) basado en la intencion y requerimientos.\n"
    "DEBES devolver UNICAMENTE un JSON valido con las llaves: 'state_contract', 'steps' y 'transitions'.\n"
    "- state_contract: {\"input\": {}, \"shared\": {}, \"output\": {}}\n"
    "- steps: lista de nodos. Cada uno con id, kind (start, agent, decision, transform, human_gate, end), name, configuration.\n"
    "- transitions: lista de aristas. Cada una con id, from, to, kind ('route'), y label (opcional).\n"
)

class ArchitectEngine:
    """
    Uses the AI Engine to generate an ArchitectureSpec v1 from conversational discovery.
    """
    
    @staticmethod
    async def analyze_discovery(conversation_history: List[Dict[str, Any]], model_override: str = "gpt-4o") -> Dict[str, Any]:
        """
        Analyzes the chat with the user, provides an expert conversational reply, and extracts structured Intents/Requirements.
        """
        system_prompt = FLOW_ARCHITECT_DISCOVERY_SYSTEM
        
        user_prompt = "Historial de conversacion:\n"
        for msg in conversation_history[-8:]: # ultimos 8 mensajes para contexto
            user_prompt += f"{msg.get('role', 'user')}: {msg.get('content', '')}\n"
            
        try:
            try:
                from services.agent_factory import AgentFactory
            except ImportError:
                from backend.services.agent_factory import AgentFactory
            result_text = await AgentFactory.chat_one_shot(
                agent_id="flowarchitect_analyzer",
                user_prompt=user_prompt,
                override_instructions=system_prompt,
            )
            import re
            json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
            if json_match:
                result_text = json_match.group(0)
            return json.loads(result_text)
        except Exception as e:
            # Fallback robusto en caso de error
            return {
                "reply": f"Error de comunicación con el motor de IA: {str(e)}",
                "intent": {"goal": f"Error extrayendo: {str(e)}", "success_criteria": []},
                "requirements": {"trigger": "manual", "assumptions": [], "constraints": []}
            }
        
    @staticmethod
    async def generate_blueprint(intent: Dict[str, Any], requirements: Dict[str, Any], model_override: str = "gpt-4o") -> ArchitectureSpec:
        """
        Takes Intents and Requirements and generates a draft ArchitectureSpec v1 using the AI Engine.
        """
        system_prompt = FLOW_ARCHITECT_BLUEPRINT_SYSTEM
        
        user_prompt = f"Intent: {json.dumps(intent)}\nRequirements: {json.dumps(requirements)}"
        spec_id = str(uuid.uuid4())
        
        try:
            try:
                from services.agent_factory import AgentFactory
            except ImportError:
                from backend.services.agent_factory import AgentFactory
            result_text = await AgentFactory.chat_one_shot(
                agent_id="flowarchitect_blueprint_generator",
                user_prompt=user_prompt,
                override_instructions=system_prompt,
            )
            import re
            json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
            if json_match:
                result_text = json_match.group(0)
            ai_data = json.loads(result_text)
            
            return ArchitectureSpec(
                schema_version="architect/v1",
                id=spec_id,
                revision=1,
                intent=Intent(**intent),
                requirements=Requirements(**requirements),
                state_contract=ArchitectureStateContract(**ai_data.get("state_contract", {"input": {}, "shared": {}, "output": {}})),
                steps=ai_data.get("steps", []),
                transitions=ai_data.get("transitions", []),
                test_suite=[],
                provenance=[{"source": "AI Generated Blueprint", "timestamp": "now"}]
            )
        except Exception:
            # Fallback en caso de que el modelo falle al generar un JSON valido complejo
            return ArchitectureSpec(
                schema_version="architect/v1",
                id=spec_id,
                revision=1,
                intent=Intent(**intent),
                requirements=Requirements(**requirements),
                state_contract=ArchitectureStateContract(input={}, shared={}, output={}),
                steps=[{"id": "fallback_node", "kind": "agent", "name": "Fallback Agent", "input_bindings": [], "configuration": {}, "provenance": []}],
                transitions=[],
                test_suite=[],
                provenance=[]
            )
