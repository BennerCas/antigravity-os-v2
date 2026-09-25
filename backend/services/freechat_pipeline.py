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
            "Eres AureliOS en Modo Libre. Eres un agente independiente y aislado del Enjambre principal "
            "(Antigravity_OS_v2). Puedes adoptar el rol que el usuario pida. Tu objetivo es ayudar al usuario "
            "de forma directa usando tus herramientas si es necesario."
        )
        self.tools = [web_search, process_document]

    def process_chat(self, messages: List[Dict[str, Any]], files: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        """
        messages: Lista de mensajes estilo OpenAI: [{"role": "user", "content": "..."}]
        files: Lista de diccionarios {"name": "...", "mime_type": "...", "data": "base64_string"}
        """
        import base64
        
        contents = []
        for i, msg in enumerate(messages):
            role = msg.get("role", "user")
            gemini_role = "user" if role == "user" else "model"
            content = msg.get("content", "")
            
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
                    return {
                        "status": "success",
                        "response": {
                            "role": "assistant",
                            "content": response.text
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
                
            return {
                "status": "success",
                "response": {
                    "role": "assistant",
                    "content": response.text
                }
            }
        except Exception as e:
            logger.error(f"Error in FreeChatPipeline: {e}")
            return {
                "status": "error",
                "message": str(e)
            }
