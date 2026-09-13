with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('CheckCircle, Shield, Code2,', '')
content = content.replace('Zap, TrendingUp, Target, AlertCircle', 'Target')
content = content.replace('let angle = 0;', '')

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
