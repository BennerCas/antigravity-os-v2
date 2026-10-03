with open("backend/services/freechat_pipeline.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if l.startswith("                        orchestrator = SwarmOrchestrator(agents=tactical_team)"):
        lines[i] = """                        import json
                        t_nodes = []
                        t_edges = []
                        for idx_a, a in enumerate(tactical_team):
                            t_nodes.append({"id": a.id, "type": "AgentNode", "position": {"x": 100 + (idx_a * 250), "y": 100}, "data": {"label": a.name, "description": a.description, "capabilities": a.capabilities}})
                            if idx_a > 0:
                                t_edges.append({"id": f"e-{tactical_team[0].id}-{a.id}", "source": tactical_team[0].id, "target": a.id, "animated": True})
                        topology_str = f"\\n</swarm>\\n<topology>\\n{json.dumps({'nodes': t_nodes, 'edges': t_edges})}\\n</topology>\\n<swarm>\\n"
                        yield topology_str
                        orchestrator = SwarmOrchestrator(agents=tactical_team)\n"""
        break

with open("backend/services/freechat_pipeline.py", "w", encoding="utf-8") as f:
    f.writelines(lines)
