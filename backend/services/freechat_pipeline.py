import json
import logging
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from google import genai
from google.genai import types
from .tools import web_search, process_document

logger = logging.getLogger(__name__)

class FreechatPipeline:
    def __init__(self):
        self.client = genai.Client()
        self.model = "gemini-2.5-flash"
        self.system_instruction = (
            "ROLE: Eres 'AureliOS Principal Cognitive Router', el enrutador maestro de Antigravity OS.\n"
            "CONTEXT: Debes clasificar la intención del usuario y enrutar la ejecución. Estás operando bajo un entorno de VibeCoding interactivo.\n"
            "STYLE: Técnico, denso, estrictamente funcional. Cero lenguaje conversacional periférico.\n\n"
            "CONSTRAINTS:\n"
            "1. Debes usar OBLIGATORIAMENTE etiquetas <thinking> y </thinking> para razonar la clasificación antes de responder.\n"
            "2. Si el usuario pide crear O modificar nodos/agentes/flujos, genera un JSON estricto dentro de la etiqueta <topology>.\n"
            "3. Si el usuario pide generar código, interfaces, dashboards, o sistemas complejos, tu respuesta POSTERIOR al thinking debe ser EXACTA Y ÚNICAMENTE la cadena de texto: [TRIGGER_REAL_SWARM]\n"
            "4. Si es charla general, responde directamente después del thinking.\n\n"
            "SCHEMA ESPERADO PARA RUTEO DE ENJAMBRE:\n"
            "<thinking>\n1. Análisis de intención: Petición de código compleja detectada.\n2. Clasificación: Ruteo a Enjambre Táctico.\n</thinking>\n[TRIGGER_REAL_SWARM]"
        )
        self.tools = [web_search, process_document]

    async def process_chat(self, messages: List[Dict[str, Any]], files: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        """
        messages: Lista de mensajes estilo OpenAI: [{"role": "user", "content": "..."}]
        files: Lista de diccionarios {"name": "...", "mime_type": "...", "data": "base64_string"}
        """
        import base64
        from security.sly_data_masking import mask_sensitive_data, unmask_sensitive_data
        
        contents = []
        token_maps = {}
        for i, msg in enumerate(messages):
            role = msg.get("role", "user")
            gemini_role = "user" if role == "user" else "model"
            
            raw_content = msg.get("content", "")
            if role == "user":
                masked_text, token_map = mask_sensitive_data(raw_content)
                token_maps.update(token_map)
                content = masked_text
            else:
                content = raw_content
            
            parts = []
            
            # Si es el último mensaje del usuario y hay archivos, los adjuntamos a este mensaje
            if i == len(messages) - 1 and gemini_role == "user" and files:
                for f in files:
                    try:
                        mime_type = f.get("mime_type", "application/octet-stream")
                        if not mime_type: # Some browsers send empty mime types for unknown files
                           mime_type = "application/octet-stream"
                        file_data = base64.b64decode(f["data"])
                        parts.append(
                            types.Part.from_bytes(data=file_data, mime_type=mime_type)
                        )
                    except Exception as e:
                        logger.error(f"Error procesando archivo {f.get('name')}: {e}")
            
            parts.append(types.Part.from_text(text=content))
            
            contents.append(
                types.Content(
                    role=gemini_role,
                    parts=parts
                )
            )

        config = types.GenerateContentConfig(
            system_instruction=self.system_instruction,
            tools=self.tools,
            temperature=0.7,
        )

        try:
            # We'll just initiate a chat or call generate_content.
            # Using generate_content in a loop for tool calling
            max_turns = 3
            for _ in range(max_turns):
                response = self.client.models.generate_content(
                    model=self.model,
                    contents=contents,
                    config=config,
                )
                
                # Check if there are function calls
                function_calls = []
                if response.candidates and response.candidates[0].content and response.candidates[0].content.parts:
                    for part in response.candidates[0].content.parts:
                        if part.function_call:
                            function_calls.append(part.function_call)
                
                if not function_calls:
                    resp_text = response.text
                    if "[TRIGGER_REAL_SWARM]" in resp_text:
                        from backend.services.coautoria_level2_swarm import SwarmOrchestrator
                        from backend.services.supervisor_router import AgentCard
                        
                        # Definimos el equipo táctico base
                        tactical_team = [
                            AgentCard(id="arq1", name="Principal Solutions Architect", description="Define la arquitectura base, patrones de diseño y stack tecnológico. Aplica principios DRY y SOLID de forma matemática.", capabilities=["design", "architecture"]),
                            AgentCard(id="sec1", name="Zero-Trust Security Lead", description="Auditor implacable. Aplica principios de 'Default Deny' y escanea vectores de inyección, sanitización y manejo de memoria/credenciales.", capabilities=["security", "audit"]),
                            AgentCard(id="uiux", name="Frontend VibeCoding Engineer", description="Ingeniero de Interfaz. Dicta estructuras semánticas, Tailwind, accesibilidad y flujos cognitivos de usuario.", capabilities=["frontend", "ui"]),
                            AgentCard(id="qa", name="Red Teamer Operations", description="Atacante asimétrico. Su única función es destruir las suposiciones de los otros 3 buscando cuellos de botella lógicos y fallos de integración.", capabilities=["testing", "attack"])
                        ]
                        orchestrator = SwarmOrchestrator(agents=tactical_team)
                        
                        # Extraer el objetivo del último mensaje del usuario
                        last_user_prompt = "Crear sistema"
                        for m in reversed(messages):
                            if m.get("role") == "user":
                                last_user_prompt = m.get("content", "")
                                break
                                
                        # Ejecutar el verdadero enjambre asíncrono
                        resp_text = await orchestrator.execute_swarm_async(last_user_prompt)

                    return {
                        "status": "success",
                        "response": {
                            "role": "assistant",
                            "content": resp_text
                        }
                    }
                
                # Append the model's function call response to history
                contents.append(response.candidates[0].content)
                
                # Execute tools and append function response
                tool_results = []
                for fc in function_calls:
                    name = fc.name
                    args = fc.args
                    logger.info(f"LLM llamando a funcion: {name} con args: {args}")
                    
                    try:
                        if name == "web_search":
                            res = web_search(**args)
                        elif name == "process_document":
                            res = process_document(**args)
                        else:
                            res = f"Error: Tool {name} not found"
                    except Exception as e:
                        res = f"Error executing {name}: {e}"
                        
                    tool_results.append(
                        types.Part.from_function_response(
                            name=name,
                            response={"result": res}
                        )
                    )
                
                contents.append(
                    types.Content(
                        role="user",
                        parts=tool_results
                    )
                )
                
            # --- SLY-DATA UNMASKING ---
            final_text = response.text
            if token_maps:
                final_text = unmask_sensitive_data(final_text, token_maps)
                
            return {
                "status": "success",
                "response": {
                    "role": "assistant",
                    "content": final_text
                }
            }
        except Exception as e:
            logger.error(f"Error in FreeChatPipeline: {e}")
            return {
                "status": "error",
                "message": str(e)
            }
