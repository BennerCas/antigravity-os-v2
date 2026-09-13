import json

# 17 skills x 4 competencias each = 68 competency sub-nodes
COMPETENCIAS = {
    'n1': [('Reconocer elementos del canvas: nodos, aristas y paneles','#00f5d4'),('Navegar con zoom, pan y drag en el espacio 3D','#00f5d4'),('Diferenciar tipos de nodos por forma y color','#00f5d4'),('Interpretar la densidad y direccion de los flujos','#00f5d4')],
    'n2': [('Crear conexiones directas entre nodos emisores y receptores','#00f5d4'),('Distinguir conexiones sync vs async','#00f5d4'),('Detectar ambiguedad en grafos sin nodo de decision','#00f5d4'),('Validar integridad de links usando inspeccion visual','#00f5d4')],
    'n3': [('Definir contratos de datos con esquemas tipados','#00bbf9'),('Aplicar transforms de parseo (string -> numero, fecha)','#00bbf9'),('Mapear campos de entrada a salida con aliases','#00bbf9'),('Validar que transforms no pierden informacion critica','#00bbf9')],
    'n4': [('Construir nodos de decision con condiciones booleanas','#00bbf9'),('Encadenar multiples condiciones con AND/OR','#00bbf9'),('Gestionar casos de borde y rutas de fallback','#00bbf9'),('Documentar la logica de decision en el grafo','#00bbf9')],
    'n5': [('Integrar clasificadores de IA en nodos de decision','#00bbf9'),('Definir categorias y umbrales de confianza','#00bbf9'),('Manejar clasificaciones ambiguas con human-in-loop','#00bbf9'),('Evaluar accuracy del clasificador en produccion','#00bbf9')],
    'n6': [('Redactar prompts como artefactos versionables','#00bbf9'),('Aplicar tecnicas de few-shot y chain-of-thought','#00bbf9'),('Gestionar variables de contexto en plantillas de prompt','#00bbf9'),('Testear prompts con datasets de evaluacion','#00bbf9')],
    'n7': [('Definir permisos minimos por agente y herramienta','#fee440'),('Auditar capabilities activas en cada nodo','#fee440'),('Implementar sandboxes para agentes de alto riesgo','#fee440'),('Rotar y revocar credenciales de forma automatizada','#fee440')],
    'n8': [('Implementar logica de retry con backoff exponencial','#fee440'),('Disenar operaciones idempotentes con claves de deduplicacion','#fee440'),('Definir timeouts y circuit breakers por operacion','#fee440'),('Registrar intentos fallidos en logs de auditoria','#fee440')],
    'n9': [('Identificar puntos de decision que requieren validacion humana','#fee440'),('Disenar interfaces de revision claras para el operador','#fee440'),('Definir SLAs de respuesta para approval gates','#fee440'),('Gestionar escaladas automaticas por timeout','#fee440')],
    'n10': [('Instrumentar cada nodo con spans de traza distribuida','#fee440'),('Capturar payloads de entrada y salida para debugging','#fee440'),('Crear dashboards de latencia y tasa de error por nodo','#fee440'),('Configurar alertas sobre anomalias en el flujo','#fee440')],
    'n11': [('Leer y mapear requisitos del cliente a componentes del grafo','#f15bb5'),('Identificar actores, sistemas y flujos de datos principales','#f15bb5'),('Validar arquitectura con stakeholders antes de construir','#f15bb5'),('Documentar decisiones de diseno con ADR','#f15bb5')],
    'n12': [('Disenar el blueprint completo del flujo feliz','#f15bb5'),('Mapear todas las rutas de fallo y sus recuperaciones','#f15bb5'),('Aplicar patrones de compensacion transaccional (Saga)','#f15bb5'),('Validar el blueprint con simulaciones de carga','#f15bb5')],
    'n13': [('Extraer subflows reutilizables desde flujos monoliticos','#f15bb5'),('Definir interfaces claras entre subflows','#f15bb5'),('Versionar subflows como bibliotecas independientes','#f15bb5'),('Componer flujos complejos ensamblando subflows','#f15bb5')],
    'n14': [('Identificar tareas paralelizables en el grafo','#f15bb5'),('Implementar fan-out con nodos de fork','#f15bb5'),('Sincronizar resultados con nodos de join y reducers','#f15bb5'),('Gestionar timeouts en ejecuciones paralelas','#f15bb5')],
    'n15': [('Disenar el protocolo de comunicacion entre agentes','#9b5de5'),('Asignar roles y responsabilidades por agente','#9b5de5'),('Gestionar el estado compartido entre agentes orquestados','#9b5de5'),('Monitorear el progreso del enjambre en tiempo real','#9b5de5')],
    'n16': [('Disenar datasets de evaluacion representativos','#9b5de5'),('Ejecutar evaluaciones batch sobre cientos de prompts','#9b5de5'),('Analizar metricas de calidad: precision, recall, coherencia','#9b5de5'),('Iterar y mejorar prompts basado en resultados cuantitativos','#9b5de5')],
    'n17': [('Construir el argumento tecnico de la arquitectura elegida','#9b5de5'),('Justificar trade-offs con evidencia de benchmarks','#9b5de5'),('Responder preguntas de seguridad, escalabilidad y costo','#9b5de5'),('Presentar la arquitectura en formato ejecutivo y tecnico','#9b5de5')],
}

# Read file
content = open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx','r',encoding='utf-8').read()

# Find the last existing sub-node line to inject after it
# The gData ends with links block. Find the nodes closing bracket
last_sub_marker = '{"id": "n17_mission_18"'
idx = content.find(last_sub_marker)
# Find the end of that node object
end_idx = content.find('},', idx) + 2
print('Injecting after char:', end_idx)
print('Context:', content[end_idx-5:end_idx+50])

# Build the new competency node JSON lines
new_nodes = ''
new_links = ''
for skill_id, comps in COMPETENCIAS.items():
    for ci, (name, color) in enumerate(comps):
        nid = f'{skill_id}_c{ci+1:02d}'
        new_nodes += f'\n    {{"id": "{nid}", "name": "{name}", "desc": "{name}", "val": 8, "color": "{color}", "isSub": true}},'
        new_links += f'\n    {{"source": "{skill_id}", "target": "{nid}"}},'

# Inject nodes right after last existing sub-node
content = content[:end_idx] + new_nodes + content[end_idx:]

# Find end of links and inject new links
# Find '  links: [' and its closing ']'
links_close = content.rfind('    {"source": "n17"')
# Find the end of the last link entry
last_link_end = content.find('},', links_close) + 2
print('Injecting links after char:', last_link_end)
content = content[:last_link_end] + new_links + content[last_link_end:]

open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx','w',encoding='utf-8').write(content)
print('Done - injected', sum(len(v) for v in COMPETENCIAS.values()), 'competency nodes')
