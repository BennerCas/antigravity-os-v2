import codecs
import re

file_path = r'C:\antigravityAS\Antigravity_OS\apps\web-app\src\data\flowsTemplates.ts'
with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

replacements = {
    'tpl_b1': "apis: 'OpenAI + Serper', time: '~30 seg', useCases: ['Redacción', 'SEO', 'Blog']",
    'tpl_b2': "apis: 'Anthropic Claude', time: '~45 seg', useCases: ['Soporte', 'Tickets', 'CX']",
    'tpl_b3': "apis: 'Local (Ollama)', time: '~1 min', useCases: ['Refactor', 'Code Review']",
    'tpl_i1': "apis: 'Groq + Tavily', time: '~2 min', useCases: ['Outreach B2B', 'Ventas']",
    'tpl_i2': "apis: 'OpenAI + GitHub', time: '~3 min', useCases: ['DevSecOps', 'Compliance']",
    'tpl_i3': "apis: 'Anthropic + Vercel', time: '~5 min', useCases: ['Web Dev', 'Prototipado']",
    'tpl_a1': "apis: 'Multi-Model', time: '~10 min', useCases: ['Startups', 'Agile']",
    'tpl_a2': "apis: 'Bloomberg + OpenAI', time: '~15 min', useCases: ['Trading Quant', 'Riesgos']",
    'tpl_a3': "apis: 'OpenAI + Midjourney', time: '~20 min', useCases: ['Marketing 360', 'Agencias']",
    'tpl_e1': "apis: 'Anthropic + Arxiv', time: '~45 min', useCases: ['Deep Tech', 'R&D', 'Papers']",
    'tpl_e2': "apis: 'OpenAI + YARA', time: '~30 min', useCases: ['SOC', 'Respuesta Incidentes']",
    'tpl_e3': "apis: 'Multi-API Global', time: '24/7 (Continuo)', useCases: ['Media', 'Broadcasting']",
    'tpl_a4': "apis: 'Anthropic + AST', time: '~12 min', useCases: ['Optimización', 'Refactor']"
}

for tpl_id, meta in replacements.items():
    pattern = r"(id: '" + tpl_id + r"'.*?, category: '.*?'),"
    replacement = r"\1, " + meta + ","
    content = re.sub(pattern, replacement, content)

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)
