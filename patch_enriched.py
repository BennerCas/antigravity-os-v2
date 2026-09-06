import codecs
import json
import re

def get_node_content(name):
    return f"""Eres un Agente especializado: {name}

[🎯 OBJETIVO DE APRENDIZAJE]
Edita este prompt para definir claramente el rol, las herramientas permitidas (Tools) y el formato de salida esperado. 

[🛠️ INSTRUCCIONES DE CONFIGURACIÓN]
1. Define el System Prompt: "Actúa como un experto en..."
2. Establece las Reglas de Negocio: "No debes hacer X, siempre debes hacer Y."
3. (Si usas CrewAI) Define la Tarea: "Tu objetivo final es entregar un archivo JSON con..."
4. (Si usas LangGraph) Define el Estado: "Lee el state['input'] y actualiza state['output']."

[💡 MASTER PROMPT BASE]
Por favor, analiza la entrada proporcionada y ejecuta tu tarea correspondiente a {name}. Asegúrate de ser conciso y preciso."""

def create_flow(id_prefix, names, layout='horizontal'):
    nodes = []
    edges = []
    
    x = 100
    y = 200
    
    for i, name in enumerate(names):
        node_id = f"{id_prefix}_{i}"
        
        node_type = "mainPrompt" if i == 0 else "action"
        if "Linter" in name or "Review" in name or "QA" in name or "Risk" in name or "Checker" in name or "Validator" in name:
            node_type = "logicaNode"  # Fixed type name from logica to logicaNode
            
        nodes.append({
            "id": node_id,
            "type": node_type,
            "position": {"x": x, "y": y},
            "data": {
                "title": name,
                "content": get_node_content(name)
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

builder_data = {
    'tpl_b1': create_flow('b1', ['1. Profiler (LinkedIn)', '2. Estratega (Ángulo)', '3. Copywriter (Email)']),
    'tpl_b2': create_flow('b2', ['Ticket Entrante', 'Clasificador (Baja/Media/Alta)', 'Dpto. Soporte', 'Dpto. Facturación'], 'grid'),
    'tpl_b3': create_flow('b3', ['Coder (Escribe código)', 'Linter (Analiza Errores)', 'Revisor (Audita Vulnerabilidad)']),
    'tpl_i1': create_flow('i1', ['1. Profiler', '2. Icebreaker', '3. Cold Copywriter', '4. Follow-up Strategist', '5. QA Spam Checker'], 'grid'),
    'tpl_i2': create_flow('i2', ['GroupChat Manager', 'Scanner (CVEs)', 'Exploiter (Ataque)', 'Patcher (Arreglo)', 'Reviewer (Aprobación)', 'Reporter (Compliance)'], 'grid'),
    'tpl_i3': create_flow('i3', ['Copywriter (Hero/CTA)', 'UX Designer (Wireframe JSON)', 'React Coder (Tailwind)', 'Linter (Syntax)', 'UI Reviewer'], 'grid'),
    'tpl_a1': create_flow('a1', ['Product Manager (Historias)', 'Arquitecto (BDD/API)', 'Frontend Dev', 'Backend Dev', 'QA Tester', 'DevOps (Docker)', 'Scrum Master', 'Tech Lead'], 'grid'),
    'tpl_a2': create_flow('a2', ['News Scraper', 'Twitter Sentiment', 'Macro Economist', 'Quant Model', 'Risk Manager (Circuit Breaker)', 'Compliance', 'Portfolio Exec', 'Alert System', 'Logger'], 'grid'),
    'tpl_a3': create_flow('a3', ['Director Marketing', 'Especialista SEO', 'Data Analyst', 'Copywriter Senior', 'Midjourney Prompter', 'Ads Manager', 'Social Media Manager', 'PR Specialist', 'Legal Reviewer', 'Brand Guardian'], 'grid'),
    'tpl_a4': create_flow('a4', ['Input de Código Gigante', 'Analista de Sistema', 'Desglosador (Átomos Lógicos)', 'Optimizador AST', 'Re-ensamblador', 'Linter Final'], 'grid'),
    'tpl_e1': create_flow('e1', ['Chief Scientist', 'Patent Scraper', 'Arxiv Scraper', 'Data Synthesizer', 'Hypothesis Generator', 'Logic Validator', 'Math Modeler', 'Peer Reviewer A', 'Peer Reviewer B', 'Ethics Board', 'Whitepaper Drafter', 'Editor in Chief', 'Diagram Prompter', 'Final Publisher'], 'grid'),
    'tpl_e2': create_flow('e2', ['Log Ingestor', 'Threat Intel', 'Anomaly Detector', 'Endpoint Isolator', 'Sandbox Evaluator', 'YARA Engine', 'PCAP Analyzer', 'Reverse Engineer', 'ATT&CK Mapper', 'Incident Commander', 'Legal Advisor', 'PR Drafter', 'Patch Deployer', 'Firewall Updater', 'Notifier 1', 'Notifier 2', 'Notifier 3', 'Dashboard'], 'grid'),
    'tpl_e3': create_flow('e3', ['Global Scraper', 'Fact Checker', 'Journalist', 'Bias Editor', 'Chief Editor', 'Translator EN', 'Translator ES', 'Translator FR', 'Translator ZH', 'Translator AR', 'Midjourney Thumbnails', 'Video Scripter', 'Audio Generator', 'SEO Optimizer', 'API Publisher YT', 'API Publisher Twitter', 'API Publisher Web', 'API Publisher LinkedIn', 'Community Manager', 'Data Analyst', 'Ethics Guardian', 'Master Orchestrator'], 'grid'),
}

file_path = r'C:\antigravityAS\Antigravity_OS\apps\web-app\src\data\flowsTemplates.ts'
with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

for tpl_id, b_data in builder_data.items():
    bd_str = json.dumps(b_data, ensure_ascii=False)
    
    # We match up to the end of the useCases array using DOTALL so .*? matches newlines
    # BUT this time, since we might have ALREADY injected builderData before,
    # we need to be careful to replace the EXISTING builderData if it exists!
    
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

print("Enriched nodes injected successfully")
