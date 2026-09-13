const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../apps/web-app/src/pages/Architecture.tsx');
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('master_prompts:')) {
    content = content.replace('const STEP_ICONS: Record<string, React.ReactNode> = {', 
        "const STEP_ICONS: Record<string, React.ReactNode> = {\n  master_prompts: <Star size={22} weight=\"fill\" className=\"text-yellow-500\" />,\n  engine: <Cpu size={22} weight=\"light\" />,\n  inspector: <MagnifyingGlass size={22} weight=\"light\" />,\n  results: <CheckCircle size={22} weight=\"light\" />,");
    
    // Add import if missing
    if (!content.includes('Star,')) {
        content = content.replace('import { Compass, Hammer', 'import { Star, Cpu, MagnifyingGlass, CheckCircle, Compass, Hammer');
    }
    fs.writeFileSync(file, content);
    console.log("Updated STEP_ICONS in Architecture.tsx");
} else {
    console.log("Already updated");
}
