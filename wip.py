import json

def get_new_architecture():
    return {
        "app": "Antigravity_OS v2",
        "engine": {
            "name": "Motor Híbrido",
            "cloud": "cloud-model",
            "local": "local-model",
            "hybrid_enabled": True,
            "cloud_options": [],
            "local_options": [],
            "rule": "Nube primero si está encendido; fallback automático a local.",
        },
        "flow": [
            {
                "step": 0,
                "id": "studio",
                "name": "The AureliOS (Studio)",
                "page": "/studio",
                "what": "El Olimpo de los 13 Dioses de la Arquitectura. Aquí reside el Sistema Operativo (AureliOS) y su enjambre de élite.",
                "prompts": []
            },
            {
                "step": 1,
                "id": "swarms",
                "name": "Enjambres Industriales (Quantum Leap)",
                "page": "/agentland",
                "what": "Topologías de enjambres especializados operando en grafos DAG. Creados para erradicar deuda técnica y forzar la exactitud absoluta.",
                "prompts": []
            },
            {
                "step": 2,
                "id": "sandbox",
                "name": "Sandbox Umpire Core",
                "page": "/sandbox",
                "what": "Entorno determinista. El Umpire Core orquesta la batalla entre el Red Teamer y el System Designer.",
                "prompts": []
            },
            {
                "step": 3,
                "id": "flowboard",
                "name": "Flowboard CI/CD",
                "page": "/flowboard",
                "what": "Canvas de despliegue en producción y revisión visual de DAGs.",
                "prompts": []
            },
            {
                "step": 4,
                "id": "inspector",
                "name": "Inspector (Telemetría)",
                "page": "/inspector",
                "what": "Motor de depuración forense y trazabilidad OTel. Analiza Spans, Traces y costos de LLMs.",
                "prompts": []
            }
        ],
        "apps": [
            {
                "id": "academy",
                "name": "Academy",
                "page": "/academy",
                "what": "Plataforma de entrenamiento y certificación de sub-agentes y habilidades.",
                "prompts": []
            },
            {
                "id": "automations",
                "name": "Automatizaciones",
                "page": "/automations",
                "what": "Flujos en segundo plano (Cron Jobs, Webhooks, Colas de Mensajes).",
                "prompts": []
            },
            {
                "id": "coautoria",
                "name": "CoautorIA",
                "page": "/coautoria",
                "what": "Asistente de generación literaria y redacción asistida por inteligencia artificial.",
                "prompts": []
            }
        ]
    }

# We need to extract the existing prompts array for AureliOS, Swarms, etc., and inject them into this new structure.
