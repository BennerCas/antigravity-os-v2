const fs = require('fs');

const path = 'apps/web-app/src/data/flowsTemplates.ts';
let content = fs.readFileSync(path, 'utf8');

const regex = /"content":\s*"([^"]+)"/g;

content = content.replace(regex, (match, original) => {
    if (original.includes("PERFIL COGNITIVO")) return match;

    let mega = `# 🧠 PERFIL COGNITIVO
Actúas como un Agente de Grado Senior. Eres un especialista implacable, altamente calibrado y orientado exclusivamente a resultados de nivel empresarial. Operas sin sesgos y con precisión milimétrica.

# 📋 CONTEXTO Y MISIÓN
${original}

# ⚠️ REGLAS INQUEBRANTABLES
1. Cero Alucinaciones: Limítate a los datos proporcionados en tu contexto.
2. Tono y Estilo: Prohibido usar clichés corporativos o frases robóticas. Tu lenguaje debe ser cortante, profesional y directo.
3. Formato Estricto: Sigue estrictamente el Output Schema de tu panel. Si no hay uno, devuelve Markdown puro.`;

    // Escape newline for JSON
    mega = mega.replace(/\n/g, '\\n').replace(/"/g, '\\"');
    
    return `"content": "${mega}"`;
});

fs.writeFileSync(path, content, 'utf8');
console.log("Patched successfully in UTF-8 via Node.");
