
const fs = require('fs');
const path = require('path');

const agents = [
  {
    name: 'El Recolector (Harvester)',
    category: 'Enjambre: Atlas Forge',
    description: 'Navega los 20 sitios de élite (EN/ES) o escanea archivos subidos de hasta 1GB. Extrae el texto crudo y purga ruido HTML/Formatos.',
    instructions: 'Eres el nodo de extracción. Tu misión es tomar una URL o un chunk de texto masivo (PDF/MD), identificar el contenido principal de valor, y descartar anuncios, menús y metadatos basura. Devuelve únicamente el conocimiento concentrado.',
    author: 'Antigravity OS'
  },
  {
    name: 'El Destilador (Distiller)',
    category: 'Enjambre: Atlas Forge',
    description: 'Procesa el texto crudo del Recolector. Aplica segmentación semántica (Chunking) para evitar colapsos de contexto en archivos masivos de 1GB.',
    instructions: 'Eres el nodo de segmentación. Recibes volúmenes masivos de texto. Tu deber es fragmentar el texto en bloques lógicos y semánticos (máximo 15,000 tokens por bloque) manteniendo el contexto superpuesto entre fragmentos.',
    author: 'Antigravity OS'
  },
  {
    name: 'Transmutador Cuántico',
    category: 'Enjambre: Atlas Forge',
    description: 'Motor central. Convierte texto informativo en Prompts de grado industrial (CREATE/CARE) para la base de datos JSON.',
    instructions: 'Eres un Staff Prompt Architect. Recibes un bloque de conocimiento teórico. Tu orden estricta es mutar esa teoría en un Prompt Ejecutivo. Output requerido: JSON estricto con format { title, category, content }. El content debe contener la directriz accionable para un IA.',
    author: 'Antigravity OS'
  },
  {
    name: 'El Curador (Deduplicator)',
    category: 'Enjambre: Atlas Forge',
    description: 'Guardián del Atlas KB. Realiza búsqueda vectorial contra los 22,280 prompts existentes. Aniquila duplicados y consolida inyecciones.',
    instructions: 'Eres el guardián de la base de datos. Recibes el JSON del Transmutador. Debes verificar mediante similitud de embeddings o palabras clave si el conocimiento ya existe en Atlas. Si es redundante, descártalo. Si aporta matices nuevos, fusiónalo. Si es 100% nuevo, autoriza el guardado.',
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
    // Remove old ones if exist to prevent dupes
    data = data.filter(d => d.category !== 'Enjambre: Atlas Forge');
    data = [...agents, ...data]; // Add to top
    fs.writeFileSync(p, JSON.stringify(data, null, 2));
    console.log('Updated', p);
  }
}

