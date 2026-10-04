with open("backend/services/freechat_pipeline.py", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("Desplegando Enjambre...\n\"", "Desplegando Enjambre...\n\"\"\"")
content = content.replace("agentes por defecto.\n\"", "agentes por defecto.\n\"\"\"")
content = content.replace("tomar ~2 minutos)...\n\"", "tomar ~2 minutos)...\n\"\"\"")
content = content.replace("tomará ~2 minutos)...\n\"", "tomará ~2 minutos)...\n\"\"\"")
content = content.replace("yield \"</swarm>\\n\\n\" + final_swarm", "yield \"</swarm>\\n\\n\" + final_swarm")

lines = content.split('\n')
for i, l in enumerate(lines):
    if l.startswith("            yield \"</swarm>"):
        lines[i] = "            yield \"</swarm>\\n\\n\" + final_swarm"
        lines[i+1] = ""
        lines[i+2] = ""

with open("backend/services/freechat_pipeline.py", "w", encoding="utf-8") as f:
    f.write("\n".join(lines))
