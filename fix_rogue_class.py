import re

ROGUE_CLASS = 'className="border border-cyan-400 shadow-[0_0_10px_#22d3ee] text-cyan-400 hover:bg-cyan-900/30 hover:shadow-[0_0_15px_#06b6d4] transition-all font-bold"'

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    new_lines = []
    removed = 0
    for line in lines:
        # Remove the rogue className injected by the subagent that causes duplicates.
        # The subagent prepended it to lines that already have onClick/key attributes,
        # making the line look like:  className="..."          onClick={...}
        # We want to strip just the className part and keep the onClick/key part.
        stripped = line.strip()
        
        if stripped.startswith(ROGUE_CLASS):
            # The rest of the line after the rogue class is the actual attribute(s)
            rest = stripped[len(ROGUE_CLASS):].strip()
            if rest:
                # Preserve indentation from original line
                indent = len(line) - len(line.lstrip())
                new_lines.append(' ' * indent + rest + '\n')
            removed += 1
        else:
            new_lines.append(line)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    
    print(f"Fixed {filepath}: removed {removed} rogue className lines")

fix_file('apps/web-app/src/pages/Atlas.tsx')
fix_file('apps/web-app/src/pages/Agents.tsx')
