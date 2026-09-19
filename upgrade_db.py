import json
import os

filepath = "backend/skills_v2.json"

upgrades = {
    "swarm-orchestrator": "Orquestador Cuántico. Mapea grafos DAG, gestiona topologías de enjambres y evita deadlocks en concurrencia paralela extrema.",
    "umpire-core": "Árbitro de Red Adversaria. Juez Sandbox que audita, ataca y destruye código débil para asegurar la cohesión cero-trust del sistema.",
    "state-reducer": "Arquitecto CQRS. Modela el flujo asíncrono y los eventos dirigidos, transformando caos en estados laminares predictivos.",
    "rag-synthesizer": "Motor de Memoria Holográfica. Cruza bases de datos vectoriales y grafos semánticos para inyectar contexto absoluto en el Match & Fuse.",
    "codebase-overlord": "Dictador del Repositorio. Refactoriza a nivel macro, aplicando patrones industriales y amputando deuda técnica en cadena.",
    "forensic-inspector": "Ojo de Telemetría. Observabilidad sub-milisegundo. Rastrea cuellos de botella en la comunicación WebSockets de los agentes.",
    "zero-trust-gatekeeper": "Centinela de Perímetro. Inyecta Guardrails dinámicos, validando que el I/O Contract nunca filtre alucinaciones letales.",
    "resource-optimizer": "CFO de Inferencia. Estratega JIT que enruta tokens entre modelos ligeros locales y APIs pesadas para maximizar el Context Window Budget.",
    "ux-psychologist": "Ingeniero de Fricción. Controla el coeficiente de compatibilidad para generar interfaces con flujo laminar o redes de debate.",
    "infrastructure-titan": "Titán de Despliegue. Automatiza clústeres para que las 'Empresas' de IA escalen en contenedores sin colapsar el hardware.",
    "api-nexus": "Ensamblador de Spans. Construye los puentes Pub/Sub entre los enjambres para que los outputs encajen como piezas de Tetris.",
    "synthetic-qa": "Red Teamer Cuántico. Simula enjambres de tráfico malicioso (DDoS cognitivo) para quebrar la red de agentes antes de producción."
}

if os.path.exists(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    modified = False
    for agent in data:
        if agent.get("id") in upgrades:
            agent["description"] = upgrades[agent["id"]]
            
            # Upgrade the 'instructions' prompt slightly to reflect the quantum leap if needed
            if "IDENTITY & ROLE" in agent.get("instructions", ""):
                # Append quantum leap rules to Guardrails
                agent["instructions"] += "\n\n[QUANTUM LEAP DIRECTIVE]\nOperate within a DAG topology. Ensure your Output strictly adheres to the Match & Fuse parameters. Maintain Zero-Hallucination policy in adversarial environments."
            
            modified = True
            
    if modified:
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        print("skills_v2.json successfully upgraded.")
    else:
        print("No matching agents found to upgrade.")
else:
    print(f"File {filepath} not found.")
