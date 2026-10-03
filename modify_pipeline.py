import re

with open("backend/services/freechat_pipeline.py", "r", encoding="utf-8") as f:
    content = f.read()

new_system_prompt = """              "ROLE: Eres 'AureliOS Principal Cognitive Router', el enrutador maestro de Antigravity OS.\\n"
              "CONTEXT: Debes clasificar la intención del usuario y enrutar la ejecución. Estás operando bajo un entorno de VibeCoding interactivo.\\n"
              "STYLE: Técnico, denso, estrictamente funcional. Cero lenguaje conversacional periférico.\\n\\n"
              "CONSTRAINTS:\\n"
              "1. Debes usar OBLIGATORIAMENTE etiquetas <thinking> y </thinking> para razonar la clasificación antes de responder.\\n"
              "2. NUNCA DEBES usar la palabra 'Calculando debate en GPU...' en tu respuesta. El sistema la agregará automáticamente.\\n"
              "3. Para CUALQUIER tarea compleja, genera UNA topología arquitectónica COMPLETA en formato ReactFlow dentro de la etiqueta <topology>.\\n"
              "4. Tu topología DEBE ser REAL. No solo nodos azules. Debes incluir obligatoriamente:\\n"
              "   - Un nodo inicial 'trigger' (color verde)\\n"
              "   - Nodos 'router' (color púrpura) para decisiones o balanceo de carga\\n"
              "   - Nodos 'agent' (color azul) para la ejecución lógica y programación. Incluye un mínimo de 4 a 8 agentes.\\n"
              "   - Nodos 'tool' (color naranja) si un agente necesita bases de datos o APIs\\n"
              "   - Un nodo final 'sink' (color pizarra) para la agregación de resultados\\n"
              "5. Debes conectar TODO lógicamente usando 'edges'. Cada nodo debe tener 'id', 'data': {{'label': 'Nombre', 'kind': 'tipo_de_nodo', 'description': '...'}}.\\n"
              "6. Despues de la etiqueta <topology>, añade la etiqueta [EJECUTAR_SWARM].\\n"
"""

# Replace the prompt
content = re.sub(
    r'"ROLE:.*?SCHEMA ESPERADO PARA HIVE:\\n.*?<thinking>...</thinking>\\n\[TRIGGER_HIVE\]\\n\[\{\\"name\\": \\"Backend Swarm\\", \\"objective\\": \\"...\\"\}\]"',
    new_system_prompt,
    content,
    flags=re.DOTALL
)

# Modify the interception logic
interception_logic = """                  if not is_intercepted:
                      if "[EJECUTAR_SWARM]" in buffer:
                          is_intercepted = True
                          trigger_type = "SWARM"
                      elif "[EJECUTAR_HIVE]" in buffer:
                          is_intercepted = True
                          trigger_type = "HIVE"
                      else:
                          yield chunk
"""

content = re.sub(
    r'                  if not is_intercepted:\s+if "\[TRIGGER_DYNAMIC_SWARM\]" in buffer:\s+is_intercepted = True\s+trigger_type = "SWARM"\s+yield "\\n\[TRIGGER_DYNAMIC_SWARM\] detectado[^\n]+\\n"\s+elif "\[TRIGGER_HIVE\]" in buffer:\s+is_intercepted = True\s+trigger_type = "HIVE"\s+else:\s+yield chunk',
    interception_logic,
    content,
    flags=re.DOTALL
)

# Replace the extraction logic
extraction_logic = """              if is_intercepted:
                  if trigger_type == "SWARM":
                      import json
                      from backend.services.coautoria_level2_swarm import SwarmOrchestrator
                      from backend.services.supervisor_router import AgentCard
                      tactical_team = []
                      try:
                          # Extraer de la topologia que ya fue mostrada en la UI
                          top_start = buffer.find("<topology>")
                          top_end = buffer.find("</topology>")
                          if top_start != -1 and top_end != -1:
                              top_json = json.loads(buffer[top_start+10:top_end])
                              for n in top_json.get("nodes", []):
                                  ndata = n.get("data", {})
                                  if ndata.get("kind") == "agent":
                                      tactical_team.append(AgentCard(
                                          id=n.get("id", ""),
                                          label=ndata.get("label", "Agent"),
                                          name=ndata.get("label", "Agent"),
                                          description=ndata.get("description", ""),
                                          capabilities=[]
                                      ))
                      except Exception as e:
                          pass
                      
                      if not tactical_team:
                           tactical_team = [
                               AgentCard(id="arq1", label="Architect", description="Diseñador", capabilities=["design"]),
                               AgentCard(id="qa", label="QualityAssurance", description="Asegura calidad", capabilities=["test"])
                           ]
                      
                      orchestrator = SwarmOrchestrator(agents=tactical_team)
                      yield "\\n```countdown\\n120\\n```\\n\\nCalculando debate del Enjambre en GPU...\\n\\n"
                      final_swarm = await orchestrator.execute_swarm_async(last_user_prompt)
                      yield "\\n<swarm>\\n" + final_swarm + "\\n</swarm>\\n"
"""

content = re.sub(
    r'              if is_intercepted:\s+if trigger_type == "SWARM":\s+try:.*?yield "\\n<swarm>\\n" \+ final_swarm \+ "\\n</swarm>\\n"',
    extraction_logic,
    content,
    flags=re.DOTALL
)


with open("backend/services/freechat_pipeline.py", "w", encoding="utf-8") as f:
    f.write(content)
