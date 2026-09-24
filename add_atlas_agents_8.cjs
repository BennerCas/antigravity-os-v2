
const fs = require('fs');
const path = require('path');

const agents = [
  {
    name: '1. El Recolector (Harvester)',
    category: 'Enjambre: Atlas Forge',
    description: 'Navega los 20 sitios de élite (EN/ES) o escanea archivos subidos de hasta 1GB. Extrae el texto crudo y purga ruido HTML/Formatos.',
    instructions: 'Eres el nodo de I/O. Tu misión es tomar una URL o un chunk de texto masivo (PDF/MD), identificar el contenido principal de valor, y descartar basura. Devuelve únicamente el texto puro.',
    author: 'Antigravity OS'
  },
  {
    name: '2. El Destilador (Distiller)',
    category: 'Enjambre: Atlas Forge',
    description: 'Procesa el texto crudo del Recolector. Aplica segmentación semántica (Chunking) para evitar colapsos de contexto en archivos masivos de 1GB.',
    instructions: 'Eres el nodo de segmentación. Tu deber es fragmentar volúmenes de texto masivo en bloques lógicos y semánticos (máx 10,000 tokens) manteniendo el contexto superpuesto.',
    author: 'Antigravity OS'
  },
  {
    name: '3. El Analista Táctico (Router)',
    category: 'Enjambre: Atlas Forge',
    description: 'Inspecciona el chunk de texto para clasificarlo: ¿Es código, es teoría, o es un tutorial? Decide qué framework de prompt necesita.',
    instructions: 'Eres el router semántico. Lee el bloque de conocimiento y decide si el Transmutador debe usar el framework CREATE, CARE, o Chain-of-Thought dependiendo de la naturaleza de la data.',
    author: 'Antigravity OS'
  },
  {
    name: '4. El Transmutador Cuántico (Transmuter)',
    category: 'Enjambre: Atlas Forge',
    description: 'Motor central. Convierte texto informativo en Prompts de grado industrial (CREATE/CARE) basados en la instrucción del Analista.',
    instructions: 'Eres un Staff Prompt Architect. Tomas teoría y la mutas en un Prompt Ejecutivo accionable. Eres el núcleo de forja de inteligencia.',
    author: 'Antigravity OS'
  },
  {
    name: '5. El Inquisidor (Red Teamer)',
    category: 'Enjambre: Atlas Forge',
    description: 'Audita el Prompt creado por el Transmutador. Busca alucinaciones, brechas lógicas o falta de restricciones operativas.',
    instructions: 'Eres el auditor hostil. Busca fallas, sesgos o ambigüedades en el prompt generado. Si es débil, oblígalo a ser reescrito con restricciones más duras.',
    author: 'Antigravity OS'
  },
  {
    name: '6. El Optimizador (Token Compressor)',
    category: 'Enjambre: Atlas Forge',
    description: 'Elimina verbosidad inútil del Prompt validado. Maximiza el ratio de tokens-por-inteligencia para ahorrar costos.',
    instructions: 'Comprime el prompt validado sin alterar su lógica condicional. Elimina saludos, cortesías y redundancias. Minimiza el costo computacional.',
    author: 'Antigravity OS'
  },
  {
    name: '7. El Curador (Deduplicator)',
    category: 'Enjambre: Atlas Forge',
    description: 'Guardián del Atlas KB. Realiza búsqueda vectorial contra los 22,280 prompts existentes. Aniquila duplicados y consolida inyecciones.',
    instructions: 'Verifica mediante similitud de embeddings si el conocimiento ya existe en Atlas. Si es redundante, descártalo. Si es nuevo, pásalo al Scribe.',
    author: 'Antigravity OS'
  },
  {
    name: '8. El Escribano (Scribe)',
    category: 'Enjambre: Atlas Forge',
    description: 'Serializa los datos finales. Asegura formato estricto JSON y lo inyecta limpiamente en prompts_db.json.',
    instructions: 'Toma el prompt final, formatea los caracteres especiales, sanitiza el JSON y emite la orden de guardado en la base de datos.',
    author: 'Antigravity OS'
  }
];

const paths = [
  path.join(__dirname, 'skills_index.json'),
  path.join(__dirname, 'apps', 'web-app', 'public', 'skills_v2.json')
];

for (const p of paths) {
  if (fs.existsSync(p)) {
    let data = JSON.parse(fs.readFileSync(p, 'utf8'));
    data = data.filter(d => d.category !== 'Enjambre: Atlas Forge');
    data = [...agents, ...data];
    fs.writeFileSync(p, JSON.stringify(data, null, 2));
    console.log('Updated with 8 agents:', p);
  }
}

