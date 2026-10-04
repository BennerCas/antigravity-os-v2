with open("backend/services/freechat_pipeline.py", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("yield \"Calculando Colmena de Enjambres...\n\"", "yield \"\"\"Calculando Colmena de Enjambres...\n\"\"\"")

with open("backend/services/freechat_pipeline.py", "w", encoding="utf-8") as f:
    f.write(content)
