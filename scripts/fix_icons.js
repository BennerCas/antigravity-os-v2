const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../apps/web-app/src/pages/Architecture.tsx');
let content = fs.readFileSync(file, 'utf8');

// The script added Star, Cpu, MagnifyingGlass, CheckCircle but failed to import them if they weren't matched perfectly.
// Let's replace the phosphor-icons import
content = content.replace(/import \{.*?\} from '@phosphor-icons\/react';/, "import { Star, Cpu, MagnifyingGlass, CheckCircle, Compass, Hammer, Brain, Gear, Rocket, Database, TerminalWindow, Lightning, LockKey, CaretRight, ShieldCheck, XCircle } from '@phosphor-icons/react';");

fs.writeFileSync(file, content);
console.log("Fixed icon imports in Architecture.tsx");
