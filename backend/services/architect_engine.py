import uuid
import json
from typing import Dict, Any, List
from backend.schemas.architecture import ArchitectureSpec, Intent, Requirements, ArchitectureStateContract
from backend.routers.builder_actions import call_ai

class ArchitectEngine:
    """
    Uses the AI Engine to generate an ArchitectureSpec v1 from conversational discovery.
    """
    
    @staticmethod
    async def analyze_discovery(conversation_history: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyzes the chat with the user and extracts structured Intents and Requirements.
        """
        system_prompt = (
            "Eres el FlowArchitect, un experto arquitecto de sistemas. Tu objetivo es analizar "
            "la conversacion con el usuario y extraer las intenciones y requisitos de la aplicacion que desea crear.\n"
            "DEBES devolver UNICAMENTE un JSON valido (sin markdown) con esta estructura exacta:\n"
            "{\n"
            '  "intent": {"goal": "...", "success_criteria": ["..."]}, \n'
            '  "requirements": {"trigger": "...", "assumptions": [{"name": "...", "value": true}], "constraints": [{"name": "...", "value": "..."}]}\n'
            "}"
        )
        
        user_prompt = "Historial de conversacion:\n"
        for msg in conversation_history[-5:]: # ultimos 5 mensajes para contexto
            user_prompt += f"{msg.get('role', 'user')}: {msg.get('content', '')}\n"
            
        try:
            result_text, _ = await call_ai(system_prompt, user_prompt, model_override="gpt-4o")
            import re
            json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
            if json_match:
                result_text = json_match.group(0)
            return json.loads(result_text)
        except Exception as e:
            # Fallback robusto en caso de error
            return {
                "intent": {"goal": f"Error extrayendo: {str(e)}", "success_criteria": []},
                "requirements": {"trigger": "manual", "assumptions": [], "constraints": []}
            }
        
    @staticmethod
    async def generate_blueprint(intent: Dict[str, Any], requirements: Dict[str, Any]) -> ArchitectureSpec:
        """
        Takes Intents and Requirements and generates a draft ArchitectureSpec v1 using the AI Engine.
        """
        system_prompt = (
            "Eres el FlowArchitect. Genera un Blueprint de arquitectura (ArchitectureSpec) basado en la intencion y requerimientos.\n"
            "DEBES devolver UNICAMENTE un JSON valido con las llaves: 'state_contract', 'steps' y 'transitions'.\n"
            "- state_contract: {\"input\": {}, \"shared\": {}, \"output\": {}}\n"
            "- steps: lista de nodos. Cada uno con id, kind (start, agent, decision, transform, human_gate, end), name, configuration.\n"
            "- transitions: lista de aristas. Cada una con id, from, to, kind ('route'), y label (opcional).\n"
        )
        
        user_prompt = f"Intent: {json.dumps(intent)}\nRequirements: {json.dumps(requirements)}"
        spec_id = str(uuid.uuid4())
        
        try:
            result_text, _ = await call_ai(system_prompt, user_prompt, model_override="gpt-4o")
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
