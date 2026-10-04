with open("backend/services/freechat_pipeline.py", "a", encoding="utf-8") as f:
    f.write("""
    async def process_chat_stream(self, messages: List[Dict[str, Any]], files: Optional[List[Dict[str, Any]]] = None):
        import json
        import asyncio
        from backend.services.agent_factory import AgentFactory
        from backend.services.coautoria_level2_swarm import SwarmOrchestrator
        from backend.models.coautoria import AgentCard

        last_user_prompt = messages[-1].get("content", "")

        tactical_team = [
            AgentCard(id="arq1", name="Architect", description="Diseñador de arquitectura", capabilities=["design"]),
            AgentCard(id="qa", name="QualityAssurance", description="Asegura calidad", capabilities=["test"])
        ]

        buffer = ""
        is_intercepted = False
        
        try:
            async for chunk in AgentFactory.chat_stream(
                agent_id="freechat_router",
                user_message=last_user_prompt,
                system_prompt=self.system_instruction,
                model_override="free.ai/auto"
            ):
                buffer += chunk
                if not is_intercepted:
                    if "[TRIGGER_DYNAMIC_SWARM]" in buffer:
                        is_intercepted = True
                        # Yield the portion before trigger? Actually just yield the trigger message
                        yield "\\n[TRIGGER_DYNAMIC_SWARM] detectado. Escuchando JSON del Motor Cuántico...\\n"
                    else:
                        yield chunk
            
            if is_intercepted:
                try:
                    start_idx = buffer.find("[", buffer.find("[TRIGGER_DYNAMIC_SWARM]") + len("[TRIGGER_DYNAMIC_SWARM]"))
                    end_idx = buffer.rfind("]") + 1
                    team_data = json.loads(buffer[start_idx:end_idx])
                    if isinstance(team_data, dict) and "dashboard" in team_data:
                         # Hermes hallucinated a weird json again, ignore
                         raise ValueError("Invalid format")
                    tactical_team = [AgentCard(**d) for d in team_data]
                    yield f"\\n[Motor Cuántico] {len(tactical_team)} Agentes extraídos exitosamente. Desplegando Enjambre...\\n"
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

        except Exception as e:
            logger.error(f"Error in stream: {e}")
            yield f"Error: {str(e)}"
""")
