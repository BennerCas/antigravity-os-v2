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
            "CONTEXT: Debes clasificar la intencion del usuario y enrutar la ejecucion. Estas operando bajo un entorno de VibeCoding interactivo.\n"
            "STYLE: Tecnico, denso, estrictamente funcional. Cero lenguaje conversacional periferico.\n\n"
            "CONSTRAINTS:\n"
            "1. Debes usar OBLIGATORIAMENTE etiquetas <thinking> y </thinking> para razonar la clasificacion antes de responder.\n"
            "2. Para CUALQUIER tarea compleja (dashboard, modulo, sistema, app), genera una topologia arquitectonica COMPLETA dentro de <topology>.\n"
            "3. Tu topologia DEBE incluir OBLIGATORIAMENTE nodos de TODOS estos tipos (nunca solo azules):\n"
            "   - 'trigger': nodo inicial verde (punto de entrada del usuario)\n"
            "   - 'router': nodo purpura para decisiones o balanceo de carga\n"
            "   - 'agent': nodos azules para ejecucion. Minimo 4, maximo 8. Cada uno con nombre real y descripcion de su tarea especifica.\n"
            "   - 'tool': nodo naranja para bases de datos, APIs o servicios externos que use algun agente\n"
            "   - 'sink': nodo gris final para agregacion de resultados\n"
            "4. Cada nodo DEBE tener: 'id' unico, 'data': {'label': 'Nombre Real', 'kind': 'tipo', 'description': 'descripcion de su rol exacto'}.\n"
            "5. Conecta TODOS los nodos con 'edges' logicos. El flujo debe ser legible de izquierda a derecha.\n"
            "6. Al final de </topology>, escribe [EJECUTAR_SWARM] en una linea sola.\n"
            "7. Responde SIEMPRE en espanol.\n"
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
                    
                    # Extraer el objetivo del último mensaje del usuario
                    last_user_prompt = "Crear sistema"
                    for m in reversed(messages):
                        if m.get("role") == "user":
                            last_user_prompt = m.get("content", "")
                            break
                    
                    if "[TRIGGER_DYNAMIC_SWARM]" in resp_text:
                        import json
                        from backend.services.coautoria_level2_swarm import SwarmOrchestrator
                        from backend.services.supervisor_router import AgentCard
                        
                        try:
                            # Extract JSON array
                            start_idx = resp_text.find("[", resp_text.find("[TRIGGER_DYNAMIC_SWARM]"))
                            end_idx = resp_text.rfind("]") + 1
                            team_data = json.loads(resp_text[start_idx:end_idx])
                            tactical_team = [AgentCard(**d) for d in team_data]
                        except Exception as e:
                            # Fallback if json parsing fails
                            tactical_team = [
                                AgentCard(id="arq1", name="Principal Architect", description="Define arquitectura", capabilities=["design"]),
                                AgentCard(id="sec1", name="Security Lead", description="Audita seguridad", capabilities=["security"]),
                                AgentCard(id="uiux", name="Frontend Engineer", description="Diseña UI", capabilities=["frontend"]),
                                AgentCard(id="qa", name="Red Teamer", description="Ataca lógica", capabilities=["testing"])
                            ]
                            
                        orchestrator = SwarmOrchestrator(agents=tactical_team)
                        resp_text = await orchestrator.execute_swarm_async(last_user_prompt)

                    elif "[TRIGGER_HIVE]" in resp_text:
                        import json
                        from backend.services.coautoria_level3_hive import HiveManager
                        
                        try:
                            start_idx = resp_text.find("[", resp_text.find("[TRIGGER_HIVE]"))
                            end_idx = resp_text.rfind("]") + 1
                            hive_data = json.loads(resp_text[start_idx:end_idx])
                        except Exception as e:
                            hive_data = [{"name": "Frontend Swarm", "objective": "Construir UI"}, {"name": "Backend Swarm", "objective": "Construir APIs"}]
                            
                        manager = HiveManager(hive_name="Hive Global")
                        resp_text = await manager.orchestrate_hive_async(last_user_prompt, hive_data)

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

    async def process_chat_stream(self, messages: List[Dict[str, Any]], files: Optional[List[Dict[str, Any]]] = None):
        import json
        import asyncio
        import re
        from backend.services.agent_factory import AgentFactory
        from backend.services.coautoria_level2_swarm import SwarmOrchestrator
        from backend.services.coautoria_level3_hive import HiveManager
        from backend.services.supervisor_router import AgentCard

        last_user_prompt = messages[-1].get("content", "")

        tactical_team = [
            AgentCard(id="arq1", name="Architect", description="Diseñador de arquitectura", capabilities=["design"]),
            AgentCard(id="qa", name="QualityAssurance", description="Asegura calidad", capabilities=["test"])
        ]

        buffer = ""
        is_intercepted = False
        trigger_type = None
        
        try:
            async for chunk in AgentFactory.chat_stream(
                agent_id="freechat_router",
                user_prompt=last_user_prompt,
                override_instructions=self.system_instruction,
                model="free.ai/auto"
            ):
                buffer += chunk
                yield chunk

            # Check if Swarm or Hive execution is needed
            # We look outside of <thinking> tags to avoid false positives during reasoning
            content_to_check = buffer
            if "</thinking>" in buffer:
                content_to_check = buffer.split("</thinking>", 1)[1]

            has_swarm_trigger = "[EJECUTAR_SWARM]" in content_to_check or "[TRIGGER_DYNAMIC_SWARM]" in content_to_check or "[TRIGGER_SWARM]" in content_to_check
            has_hive_trigger = "[TRIGGER_HIVE]" in content_to_check or "[EJECUTAR_HIVE]" in content_to_check

            has_topology = ("<topology>" in buffer and "agent" in buffer) or ('"nodes"' in buffer and '"agent"' in buffer)
            if has_swarm_trigger or has_topology:
                tactical_team = []
                try:
                    top_obj = None
                    top_start = buffer.find("<topology>")
                    top_end = buffer.find("</topology>")
                    if top_start != -1 and top_end != -1:
                        top_json_str = buffer[top_start + 10:top_end].strip()
                        json_match = re.search(r"\{[\s\S]*\}", top_json_str)
                        if json_match:
                            top_obj = json.loads(json_match.group(0))
                    
                    if not top_obj:
                        # Try markdown ```json containing nodes/topology
                        md_match = re.search(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", buffer)
                        if md_match:
                            top_obj = json.loads(md_match.group(1))

                    if not top_obj:
                        # Try raw JSON containing nodes
                        bare_match = re.search(r"\{\s*\"(?:topology|nodes)\"[\s\S]*\}\s*\}", buffer)
                        if bare_match:
                            top_obj = json.loads(bare_match.group(0))

                    if top_obj:
                        nodes_list = (top_obj.get("topology") or top_obj).get("nodes", [])
                        for n in nodes_list:
                            ndata = n.get("data", {})
                            nkind = ndata.get("kind") or n.get("kind") or n.get("type") or ""
                            if nkind == "agent":
                                ag_name = ndata.get("label") or n.get("label") or ndata.get("name") or n.get("name") or "Especialista"
                                ag_desc = ndata.get("description") or n.get("description") or ""
                                ag_id = n.get("id") or f"ag_{len(tactical_team)+1}"
                                tactical_team.append(AgentCard(
                                    id=ag_id,
                                    name=ag_name,
                                    label=ag_name,
                                    description=ag_desc,
                                    capabilities=[]
                                ))
                except Exception as ex:
                    logger.warning(f"Error parsing topology agents: {ex}")

                if not tactical_team:
                    tactical_team = [
                        AgentCard(id="arq1", name="Architect", label="Architect", description="Diseñador de arquitectura", capabilities=["design"]),
                        AgentCard(id="qa", name="QualityAssurance", label="QualityAssurance", description="Asegurador de calidad", capabilities=["test"])
                    ]

                orchestrator = SwarmOrchestrator(agents=tactical_team)
                yield "\n\n```countdown\n120\n```\n\n**Calculando debate del Enjambre en GPU...**\n\n"
                final_swarm = await orchestrator.execute_swarm_async(last_user_prompt)
                yield "\n\n" + final_swarm + "\n\n"

            elif has_hive_trigger:
                hive_data = [{"name": "Frontend Swarm", "objective": "UI/UX"}, {"name": "Backend Swarm", "objective": "API"}]
                try:
                    trigger_idx = buffer.find("[TRIGGER_HIVE]")
                    if trigger_idx == -1:
                        trigger_idx = buffer.find("[EJECUTAR_HIVE]")
                    after_trigger = buffer[trigger_idx:] if trigger_idx != -1 else buffer
                    match = re.search(r"\[\s*\{.*?\}\s*\]", after_trigger, re.DOTALL)
                    if match:
                        hive_data = json.loads(match.group(0))
                except Exception as e:
                    yield f"\n[Motor Cuantico] Fallo la extraccion JSON ({str(e)}), usando colmenas por defecto.\n"

                manager = HiveManager(swarms_config=hive_data)
                yield "\n\n```countdown\n300\n```\n\n**Calculando Colmena de Enjambres en GPU...**\n\n"
                final_hive = await manager.execute_hive_async(last_user_prompt)
                yield "\n\n" + final_hive + "\n\n"
        except Exception as e:
            logger.error(f"Error in process_chat_stream: {e}")
            yield f"\n[Error en streaming de chat: {str(e)}]\n"
