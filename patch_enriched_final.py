import codecs
import json
import re

def create_flow(id_prefix, configs, layout='horizontal'):
    nodes = []
    edges = []
    
    x = 100
    y = 200
    
    for i, config in enumerate(configs):
        name = config['name']
        content = config['content']
        node_id = f"{id_prefix}_{i}"
        
        node_type = "mainPrompt" if i == 0 else "action"
        if "Linter" in name or "Review" in name or "QA" in name or "Risk" in name or "Checker" in name or "Validator" in name:
            node_type = "logicaNode"
            
        nodes.append({
            "id": node_id,
            "type": node_type,
            "position": {"x": x, "y": y},
            "data": {
                "title": name,
                "content": content
            }
        })
        
        if i > 0:
            edges.append({
                "id": f"e_{id_prefix}_{i-1}_{i}",
                "source": f"{id_prefix}_{i-1}",
                "target": node_id,
                "type": "smoothstep",
                "animated": True,
                "style": {"stroke": "#a855f7", "strokeWidth": 2}
            })
            
        if layout == 'horizontal':
            x += 380
        elif layout == 'grid':
            x += 380
            if (i + 1) % 4 == 0:
                y += 280
                x = 100
    
    return {"nodes": nodes, "edges": edges}

# Rich educational definitions
tpls = {
    'tpl_b1': [
        {'name': '1. Profiler (LinkedIn)', 'content': "👤 Eres un Experto Profiler B2B.\n\n🎯 OBJETIVO: Leer un perfil de LinkedIn y extraer dolor, industria y métricas clave.\n\n🛠️ INSTRUCCIÓN: Edita este prompt para agregar reglas específicas (ej. 'Enfócate solo en Startups Series A')."},
        {'name': '2. Estratega (Ángulo)', 'content': "🧠 Eres un Estratega de Crecimiento.\n\n🎯 OBJETIVO: Tomar el perfil analizado y definir el ángulo de ataque.\n\n🛠️ INSTRUCCIÓN: Edita aquí el framework que debe usar (ej. 'Utiliza el framework PAS: Problem, Agitation, Solution')."},
        {'name': '3. Copywriter (Email)', 'content': "✍️ Eres un Copywriter de Email en frío.\n\n🎯 OBJETIVO: Redactar el email final.\n\n🛠️ INSTRUCCIÓN: Define el tono de voz y asegúrate de pedir que el correo sea menor a 150 palabras."}
    ],
    'tpl_b2': [
        {'name': 'Ticket Entrante', 'content': "📥 Input del Usuario.\n\n🎯 OBJETIVO: Recibir el problema del cliente.\n\n🛠️ INSTRUCCIÓN: Ingresa aquí el ticket de prueba (ej. 'Mi tarjeta fue rechazada doble vez')."},
        {'name': 'Clasificador', 'content': "🔀 Router LangGraph.\n\n🎯 OBJETIVO: Decidir a qué departamento va el ticket.\n\n🛠️ INSTRUCCIÓN: Define reglas condicionales (ej. 'Si detectas la palabra PAGO, enruta a Facturación')."},
        {'name': 'Dpto. Soporte', 'content': "🛠️ Agente de Soporte Técnico.\n\n🎯 OBJETIVO: Resolver dudas de software.\n\n🛠️ INSTRUCCIÓN: Proveer pasos técnicos de resolución."},
        {'name': 'Dpto. Facturación', 'content': "💳 Agente de Facturación.\n\n🎯 OBJETIVO: Procesar reembolsos o dudas de pagos.\n\n🛠️ INSTRUCCIÓN: Define cómo interactuar con la API de Stripe."}
    ],
    'tpl_b3': [
        {'name': 'Coder (Escribe código)', 'content': "💻 Eres un Desarrollador Senior.\n\n🎯 OBJETIVO: Escribir la primera iteración del código solicitado.\n\n🛠️ INSTRUCCIÓN: Define el lenguaje y convenciones (ej. 'Usa TypeScript y principios SOLID')."},
        {'name': 'Linter (Analiza Errores)', 'content': "🔎 Eres un Linter Estricto.\n\n🎯 OBJETIVO: Buscar errores de sintaxis y anti-patrones.\n\n🛠️ INSTRUCCIÓN: Indícale al modelo qué estándares revisar (ej. ESLint, PEP8)."},
        {'name': 'Revisor (Audita Vulnerabilidad)', 'content': "🛡️ Eres un Auditor de Seguridad.\n\n🎯 OBJETIVO: Buscar inyecciones SQL, XSS, etc.\n\n🛠️ INSTRUCCIÓN: Si hay errores, devuelve un JSON con {'status': 'rejected', 'reason': '...'}"}
    ]
}

# Generic generator for the rest to save space but still be rich
def get_generic_content(name):
    return f"🤖 Eres el Agente: {name}\n\n🎯 OBJETIVO DE APRENDIZAJE:\nConfigurar los parámetros específicos para el rol de este agente dentro del ecosistema.\n\n🛠️ INSTRUCCIONES:\n1. Define el System Prompt explícito para {name}.\n2. Define restricciones estrictas (Formatos de salida, tono).\n3. Determina qué información necesita recibir del nodo anterior."

advanced_templates = {
    'tpl_i1': ['1. Profiler', '2. Icebreaker', '3. Cold Copywriter', '4. Follow-up Strategist', '5. QA Spam Checker'],
    'tpl_i2': ['GroupChat Manager', 'Scanner (CVEs)', 'Exploiter (Ataque)', 'Patcher (Arreglo)', 'Reviewer (Aprobación)', 'Reporter (Compliance)'],
    'tpl_i3': ['Copywriter (Hero/CTA)', 'UX Designer (Wireframe JSON)', 'React Coder (Tailwind)', 'Linter (Syntax)', 'UI Reviewer'],
    'tpl_a1': ['Product Manager (Historias)', 'Arquitecto (BDD/API)', 'Frontend Dev', 'Backend Dev', 'QA Tester', 'DevOps (Docker)', 'Scrum Master', 'Tech Lead'],
    'tpl_a2': ['News Scraper', 'Twitter Sentiment', 'Macro Economist', 'Quant Model', 'Risk Manager (Circuit Breaker)', 'Compliance', 'Portfolio Exec', 'Alert System', 'Logger'],
    'tpl_a3': ['Director Marketing', 'Especialista SEO', 'Data Analyst', 'Copywriter Senior', 'Midjourney Prompter', 'Ads Manager', 'Social Media Manager', 'PR Specialist', 'Legal Reviewer', 'Brand Guardian'],
    'tpl_a4': ['Input de Código Gigante', 'Analista de Sistema', 'Desglosador (Átomos Lógicos)', 'Optimizador AST', 'Re-ensamblador', 'Linter Final'],
    'tpl_e1': ['Chief Scientist', 'Patent Scraper', 'Arxiv Scraper', 'Data Synthesizer', 'Hypothesis Generator', 'Logic Validator', 'Math Modeler', 'Peer Reviewer A', 'Peer Reviewer B', 'Ethics Board', 'Whitepaper Drafter', 'Editor in Chief', 'Diagram Prompter', 'Final Publisher'],
    'tpl_e2': ['Log Ingestor', 'Threat Intel', 'Anomaly Detector', 'Endpoint Isolator', 'Sandbox Evaluator', 'YARA Engine', 'PCAP Analyzer', 'Reverse Engineer', 'ATT&CK Mapper', 'Incident Commander', 'Legal Advisor', 'PR Drafter', 'Patch Deployer', 'Firewall Updater', 'Notifier 1', 'Notifier 2', 'Notifier 3', 'Dashboard'],
    'tpl_e3': ['Global Scraper', 'Fact Checker', 'Journalist', 'Bias Editor', 'Chief Editor', 'Translator EN', 'Translator ES', 'Translator FR', 'Translator ZH', 'Translator AR', 'Midjourney Thumbnails', 'Video Scripter', 'Audio Generator', 'SEO Optimizer', 'API Publisher YT', 'API Publisher Twitter', 'API Publisher Web', 'API Publisher LinkedIn', 'Community Manager', 'Data Analyst', 'Ethics Guardian', 'Master Orchestrator']
}

for k, names in advanced_templates.items():
    tpls[k] = [{'name': n, 'content': get_generic_content(n)} for n in names]

builder_data = {}
for tpl_id, configs in tpls.items():
    layout = 'horizontal' if tpl_id == 'tpl_b1' else 'grid'
    builder_data[tpl_id] = create_flow(tpl_id.split('_')[1], configs, layout)

file_path = r'C:\antigravityAS\Antigravity_OS\apps\web-app\src\data\flowsTemplates.ts'
with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

for tpl_id, b_data in builder_data.items():
    bd_str = json.dumps(b_data, ensure_ascii=False)
    
    pattern_with_builder = r"(id: '" + tpl_id + r"'.*?useCases: \[.*?\]),\n\s*builderData: \{.*?\}\n"
    if re.search(pattern_with_builder, content, flags=re.DOTALL):
        def replacer(match):
            return match.group(1) + ",\n    builderData: " + bd_str + "\n"
        content = re.sub(pattern_with_builder, replacer, content, flags=re.DOTALL)
    else:
        pattern = r"(id: '" + tpl_id + r"'.*?useCases: \[.*?\])"
        def replacer2(match):
            return match.group(1) + ",\n    builderData: " + bd_str
        content = re.sub(pattern, replacer2, content, flags=re.DOTALL)

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)

print("Highly enriched instructional nodes injected successfully")
