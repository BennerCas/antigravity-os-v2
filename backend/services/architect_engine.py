import uuid
from typing import Dict, Any, List
from backend.schemas.architecture import ArchitectureSpec, Intent, Requirements, ArchitectureStateContract

class ArchitectEngine:
    """
    Simulates the AI generation of an ArchitectureSpec v1 from conversational discovery.
    """
    
    @staticmethod
    def analyze_discovery(conversation_context: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyzes the chat with the user and extracts structured Intents and Requirements.
        (Mock logic for Phase 2)
        """
        # In a real scenario, this calls call_ai() with a specialized prompt
        return {
            "intent": {
                "goal": "Procesar facturas entrantes, extraer datos clave y guardarlos en base de datos.",
                "success_criteria": [
                    "Factura extraida con 99% accuracy",
                    "Guardado en DB confirmado",
                    "Human-in-the-loop si falta monto"
                ]
            },
            "requirements": {
                "trigger": "Recepción de email o subida de archivo",
                "assumptions": [{"name": "Formato PDF o Imagen", "value": True}],
                "constraints": [{"name": "Tiempo máximo", "value": "30s"}]
            }
        }
        
    @staticmethod
    def generate_blueprint(intent: Dict[str, Any], requirements: Dict[str, Any]) -> ArchitectureSpec:
        """
        Takes Intents and Requirements and generates a draft ArchitectureSpec v1.
        """
        spec_id = str(uuid.uuid4())
        
        return ArchitectureSpec(
            schema_version="architect/v1",
            id=spec_id,
            revision=1,
            intent=Intent(**intent),
            requirements=Requirements(**requirements),
            state_contract=ArchitectureStateContract(
                input={"file_url": "string"},
                shared={"extracted_data": "json", "requires_review": "boolean"},
                output={"status": "string", "invoice_id": "string"}
            ),
            steps=[
                {
                    "id": "step_extract",
                    "kind": "agent",
                    "name": "Extractor de Facturas",
                    "input_bindings": [{"source": "input.file_url", "target": "document_url"}],
                    "configuration": {"role": "OCR Specialist", "model": "structured_private"},
                    "provenance": [{"source": "AI Generated", "confidence": 0.95}]
                },
                {
                    "id": "step_decision",
                    "kind": "decision",
                    "name": "Revisar completitud",
                    "input_bindings": [],
                    "configuration": {"expression": "shared.requires_review == true"},
                    "provenance": [{"source": "AI Generated", "confidence": 0.9}]
                },
                {
                    "id": "step_human",
                    "kind": "human_gate",
                    "name": "Aprobación Humana",
                    "input_bindings": [],
                    "configuration": {"objective": "Corregir datos faltantes"},
                    "provenance": [{"source": "AI Generated", "confidence": 0.99}]
                }
            ],
            transitions=[
                {
                    "id": "t1",
                    "from": "step_extract",
                    "to": "step_decision",
                    "kind": "route",
                    "provenance": []
                },
                {
                    "id": "t2",
                    "from": "step_decision",
                    "to": "step_human",
                    "kind": "route",
                    "label": "true",
                    "provenance": []
                }
            ],
            test_suite=[],
            provenance=[]
        )
