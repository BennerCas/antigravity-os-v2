const fs = require('fs');
const path = 'apps/web-app/src/pages/Flows.tsx';
let content = fs.readFileSync(path, 'utf8');

// Ensure NO line-clamp is applied to the main description.
content = content.replace(
  /className=\{`text-gray-300 mb-6 flex-grow \$\{activeLevel === "Avanzado" \? "text-sm line-clamp-3" : "text-base"\}`\}/g,
  'className={`text-gray-300 mb-6 flex-grow ${activeLevel === "Avanzado" ? "text-sm" : "text-base"}`}'
);

// If the old one was still there somehow:
content = content.replace(
  /className="text-sm text-gray-300 line-clamp-3 mb-6 flex-grow"/g,
  'className="text-base text-gray-300 mb-6 flex-grow"'
);

// Ensure the grid cells occupy the full height, removing any hidden overflow that truncates content
content = content.replace(
  /overflow-hidden h-full/g,
  'h-full'
);
content = content.replace(
  /relative overflow-hidden/g,
  'relative'
);

fs.writeFileSync(path, content, 'utf8');
