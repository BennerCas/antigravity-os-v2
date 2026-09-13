const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../apps/web-app/src/pages/Architecture.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/import \{.*?\} from '@phosphor-icons\/react';/, "import { Star, Cpu, MagnifyingGlass, CheckCircle, Compass, Hammer, Brain, Gear, Rocket, Database, TerminalWindow, Lightning, LockKey, CaretRight, Sparkle, Check, Copy } from '@phosphor-icons/react';");

fs.writeFileSync(file, content);
console.log("Fixed icon imports in Architecture.tsx");

const file2 = path.join(__dirname, '../apps/web-app/src/components/builder/TooltipButton.tsx');
let content2 = fs.readFileSync(file2, 'utf8');
content2 = content2.replace("import React from 'react';\n", "");
fs.writeFileSync(file2, content2);
console.log("Fixed unused React import in TooltipButton.tsx");

