const fs = require('fs');
const file = 'c:/antigravityAS/Antigravity_OS_v2/apps/web-app/src/pages/Agents.tsx';
let c = fs.readFileSync(file, 'utf8');

if (!c.includes('import ReactMarkdown')) {
  c = c.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\nimport ReactMarkdown from 'react-markdown';");
}

const oldContentDiv = `<div className="bg-gray-900/80 p-4 rounded-xl border border-gray-800 text-sm text-gray-300 leading-relaxed flex-1 overflow-y-auto custom-scrollbar max-h-[50vh] whitespace-pre-wrap font-mono text-[13px]">
                {inspectedAgent.instructions || inspectedAgent.content}
              </div>`;

const newContentDiv = `<div className="bg-gray-900/80 p-4 rounded-xl border border-gray-800 text-sm text-gray-300 leading-relaxed flex-1 overflow-y-auto custom-scrollbar max-h-[60vh] prose prose-invert prose-sm max-w-none prose-headings:text-blue-400 prose-a:text-blue-400">
                <ReactMarkdown>{inspectedAgent.instructions || inspectedAgent.content}</ReactMarkdown>
              </div>`;

c = c.replace(oldContentDiv, newContentDiv);

fs.writeFileSync(file, c);
console.log('Updated with ReactMarkdown');
