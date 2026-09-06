const fs = require('fs');
const path = 'apps/web-app/src/pages/Flows.tsx';
let content = fs.readFileSync(path, 'utf8');

// FIX 1: Array rendering crash
content = content.replace(
  /<span>\{flow\.nodes \|\| \(flow\.data\?\.nodes\?\.length \|\| 0\)\} nodos<\/span>/g,
  '<span>{Array.isArray(flow.nodes) ? flow.nodes.length : (flow.nodes || flow.data?.nodes?.length || 0)} nodos</span>'
);

// FIX 2: Layout changes for renderActiveLevel
const renderLevelOld = `  const renderActiveLevel = () => {
    const filtered = flowTemplates.filter((t: any) => t.complexity === activeLevel);
    if (filtered.length === 0) return null;

    return (
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 grid-rows-2 gap-6 h-full pb-6">
        {filtered.map((tpl: any) => (
          <div key={tpl.id} className="group bg-gray-900/30 border border-gray-800 rounded-2xl p-6 flex flex-col hover:border-blue-500/50 transition-all shadow-lg relative overflow-hidden h-full">`;

const renderLevelNew = `  const renderActiveLevel = () => {
    const filtered = flowTemplates.filter((t: any) => t.complexity === activeLevel);
    if (filtered.length === 0) return null;

    let gridClass = "flex-1 grid gap-6 h-full pb-6 ";
    let itemClass = "group bg-gray-900/30 border border-gray-800 rounded-2xl p-6 flex flex-col hover:border-blue-500/50 transition-all shadow-lg relative overflow-hidden ";
    
    if (activeLevel === 'Avanzado') {
      gridClass += "grid-cols-2 grid-rows-2 w-full h-full";
      itemClass += "h-full justify-between";
    } else {
      gridClass += "grid-cols-3 place-content-center items-stretch max-w-7xl mx-auto";
      itemClass += "h-auto text-lg"; // Larger font size
    }

    return (
      <div className={gridClass}>
        {filtered.map((tpl: any) => (
          <div key={tpl.id} className={itemClass}>`;

content = content.replace(renderLevelOld, renderLevelNew);

// FIX 3: Ensure "text-sm text-gray-300 line-clamp-3 mb-6" doesn't clamp if we want "contenido completo sin usar scroll"
content = content.replace(
  /className="text-sm text-gray-300 line-clamp-3 mb-6 flex-grow"/g,
  'className={`text-gray-300 mb-6 flex-grow ${activeLevel === "Avanzado" ? "text-sm line-clamp-3" : "text-base"}`}'
);

fs.writeFileSync(path, content, 'utf8');
