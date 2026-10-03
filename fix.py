with open("backend/services/freechat_pipeline.py", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("yield \"\n\n<swarm>", "yield \"\"\"\n\n<swarm>")
content = content.replace("Motor Cuántico...\n\"", "Motor Cuántico...\n\"\"\"")
content = content.replace("Motor Cuntico...\n\"", "Motor Cuntico...\n\"\"\"")
content = content.replace("Calculando Colmena...\n\"", "Calculando Colmena...\n\"\"\"")

with open("backend/services/freechat_pipeline.py", "w", encoding="utf-8") as f:
    f.write(content)
