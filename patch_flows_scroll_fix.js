const fs = require('fs');
const path = 'apps/web-app/src/pages/Flows.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove the absolute/overflow wrappers
content = content.replace(
  /\{\/\* Description Scroll Area \*\/\}\s*<div className="flex-grow overflow-hidden mb-4 relative min-h-\[100px\]">\s*<div className="absolute inset-0 overflow-y-auto pr-3 custom-scrollbar flex flex-col gap-4 pb-4">/,
  '{/* Description Content */}\n              <div className="flex flex-col gap-5 mb-4 flex-grow">'
);

// 2. Remove the extra closing div before the Action Footer
// We had </div> </div> exactly before {/* Action Footer */}
content = content.replace(
  /<\/div>\s*\{\/\* Action Footer \*\/\}/,
  '{/* Action Footer */}'
);

// 3. Update the Grid layout for Avanzado -> 4 columns
content = content.replace(
  /if \(activeLevel === 'Avanzado'\) \{\s*gridClass \+= "grid-cols-2 grid-rows-2 w-full h-full";/g,
  `if (activeLevel === 'Avanzado') {\n      gridClass += "grid-cols-4 w-full h-full";`
);

// 4. Ensure Avanzado cards are not constrained to "h-full" in a way that blocks expansion. Let's make all cards h-auto.
content = content.replace(
  /let itemClass = "group bg-gray-900\/30 border border-gray-800 rounded-2xl p-6 flex flex-col hover:border-blue-500\/50 transition-all shadow-lg relative h-full justify-between";/g,
  `let itemClass = "group bg-gray-900/30 border border-gray-800 rounded-2xl p-6 flex flex-col hover:border-blue-500/50 transition-all shadow-lg relative h-auto justify-between";`
);

// Fallbacks if the string didn't match perfectly:
content = content.replace(
  /itemClass \+= "h-full justify-between";/,
  `itemClass += "h-auto justify-between";`
);

fs.writeFileSync(path, content, 'utf8');
