import codecs
import json
import re

def create_flow(id_prefix, names, layout='horizontal'):
    nodes = []
    edges = []
    
    x = 100
    y = 200
    
    for i, name in enumerate(names):
        node_id = f"{id_prefix}_{i}"
        
        node_type = "mainPrompt" if i == 0 else "action"
        if "Linter" in name or "Review" in name or "QA" in name or "Risk" in name:
            node_type = "logica"
            
        nodes.append({
            "id": node_id,
            "type": node_type,
            "position": {"x": x, "y": y},
            "data": {"content": name, "title": name}
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
            x += 350
        elif layout == 'grid':
            x += 350
            if (i + 1) % 4 == 0:
                y += 250
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
    pattern = r"(id: '" + tpl_id + r"'.*?useCases: \[.*?\])"
    
    def replacer(match):
        return match.group(1) + ",\n    builderData: " + bd_str
        
    content = re.sub(pattern, replacer, content, flags=re.DOTALL)

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)

print("Injected builderData successfully")
