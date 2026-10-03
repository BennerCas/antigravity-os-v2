Set-Content -Path fix_stream_hive.py -Value @'
with open("backend/services/freechat_pipeline.py", "r", encoding="utf-8") as f:
    content = f.read()

new_stream_logic = """
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
                if not is_intercepted:
                    if "[TRIGGER_DYNAMIC_SWARM]" in buffer:
                        is_intercepted = True
                        trigger_type = "SWARM"
                        yield "\\n[TRIGGER_DYNAMIC_SWARM] detectado. Escuchando JSON del Motor Cuántico...\\n"
                    elif "[TRIGGER_HIVE]" in buffer:
                        is_intercepted = True
                        trigger_type = "HIVE"
                        yield "\\n[TRIGGER_HIVE] detectado. Escuchando JSON del Motor Cuántico...\\n"
                    else:
                        yield chunk
            
            if is_intercepted:
                if trigger_type == "SWARM":
                    try:
                        trigger_idx = buffer.find("[TRIGGER_DYNAMIC_SWARM]")
                        after_trigger = buffer[trigger_idx:] if trigger_idx != -1 else buffer
                        match = re.search(r"\[\s*\{.*?\}\s*\]", after_trigger, re.DOTALL)
                        if match:
                            team_data = json.loads(match.group(0))
                            tactical_team = [AgentCard(**d) for d in team_data]
                            yield f"\\n[Motor Cuántico] {len(tactical_team)} Agentes extraídos exitosamente. Desplegando Enjambre...\\n"
                        else:
                            raise ValueError("No JSON array found after trigger.")
                    except Exception as e:
                        yield f"\\n[Motor Cuántico] Falló la extracción JSON ({str(e)}), usando agentes por defecto.\\n"

                    t_nodes = []
                    t_edges = []
                    for idx_a, a in enumerate(tactical_team):
                        t_nodes.append({"id": a.id, "type": "AgentNode", "position": {"x": 100 + (idx_a * 250), "y": 100}, "data": {"label": a.name, "description": a.description, "capabilities": a.capabilities}})
                        if idx_a > 0:
                            t_edges.append({"id": f"e-{tactical_team[0].id}-{a.id}", "source": tactical_team[0].id, "target": a.id, "animated": True})
                    topology_str = f"\\n</swarm>\\n<topology>\\n{json.dumps({'nodes': t_nodes, 'edges': t_edges})}\\n</topology>\\n<swarm>\\n"
                    yield topology_str
                    
                    orchestrator = SwarmOrchestrator(agents=tactical_team)
                    yield "Calculando debate en GPU...\\n```countdown\\n120\\n```\\n"
                    final_swarm = await orchestrator.execute_swarm_async(last_user_prompt)
                    yield "</swarm>\\n\\n" + final_swarm

                elif trigger_type == "HIVE":
                    hive_data = [{"name": "Frontend Swarm", "objective": "Construir UI"}, {"name": "Backend Swarm", "objective": "Construir APIs"}]
                    try:
                        trigger_idx = buffer.find("[TRIGGER_HIVE]")
                        after_trigger = buffer[trigger_idx:] if trigger_idx != -1 else buffer
                        match = re.search(r"\[\s*\{.*?\}\s*\]", after_trigger, re.DOTALL)
                        if match:
                            hive_data = json.loads(match.group(0))
                            yield f"\\n[Motor Cuántico] {len(hive_data)} Colmenas extraídas exitosamente. Desplegando Hive...\\n"
                        else:
                            raise ValueError("No JSON array found after trigger.")
                    except Exception as e:
                        yield f"\\n[Motor Cuántico] Falló la extracción JSON ({str(e)}), usando colmenas por defecto.\\n"

                    manager = HiveManager(swarms_config=hive_data)
                    yield "Calculando Colmena de Enjambres en GPU...\\n```countdown\\n300\\n```\\n"
                    final_hive = await manager.execute_hive_async(last_user_prompt)
                    yield "</swarm>\\n\\n" + final_hive

        except Exception as e:
            import traceback
            trace = traceback.format_exc()
            logger.error(f"Error in stream: {e}\\n{trace}")
            yield f"Error: {str(e)}\\n{trace}"
"""

content = content.split("    async def process_chat_stream")[0] + new_stream_logic

with open("backend/services/freechat_pipeline.py", "w", encoding="utf-8") as f:
    f.write(content)
'@
python fix_stream_hive.py
python -c "import py_compile; py_compile.compile('backend/services/freechat_pipeline.py')"