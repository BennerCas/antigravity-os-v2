import re

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Completely remove active-card and active-card-blue overrides
    # Replace activeClass variable assignment
    content = content.replace(
        "const activeClass = isGenerated ? 'active-card-blue' : 'active-card';",
        "const activeClass = 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_#22d3ee]';"
    )
    content = content.replace(
        "const activeClass = isGenerated ? 'active-card-blue' : 'active-card';",
        "const activeClass = 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_#22d3ee]';"
    )

    # Remove active-card-exempt so buttons don't get forced to dark theme
    content = content.replace("active-card-exempt", "")
    content = content.replace("active-card-blue", "")
    content = content.replace("active-card", "")

    # Re-enforce buttons in Agents and Atlas to have the requested cyan glow
    content = content.replace("'Abrir en Builder'", "'Abrir en Builder'") # Just a marker
    
    # Specific fix for buttons that lost their glow
    # In Atlas, we saw: className=" text-white font-bold py-2 px-4 rounded-lg transition-colors w-full flex items-center justify-center gap-2"
    content = content.replace(
        'text-white font-bold py-2 px-4 rounded-lg transition-colors w-full flex items-center justify-center gap-2',
        'border border-cyan-400 shadow-[0_0_10px_#22d3ee] text-cyan-400 hover:bg-cyan-900/30 hover:shadow-[0_0_15px_#22d3ee] font-bold py-2 px-4 rounded-lg transition-colors w-full flex items-center justify-center gap-2'
    )
    content = content.replace(
        'text-white font-bold py-2 px-4 rounded-lg transition-colors w-full cursor-pointer hover:border-[#3b82f6]',
        'border border-cyan-400 shadow-[0_0_10px_#22d3ee] text-cyan-400 hover:bg-cyan-900/30 hover:shadow-[0_0_15px_#22d3ee] font-bold py-2 px-4 rounded-lg transition-colors w-full cursor-pointer'
    )
    
    # Ensure regular dark borders left by the previous runs are fully transformed
    content = content.replace('border-cyan-500/50 shadow-[0_0_10px_theme(colors.cyan.500)]', 'border-cyan-500 shadow-[0_0_10px_#06b6d4]')
    content = content.replace('shadow-[0_0_10px_theme(colors.cyan.400)]', 'shadow-[0_0_10px_#22d3ee]')
    content = content.replace('shadow-[0_0_15px_theme(colors.cyan.500)]', 'shadow-[0_0_15px_#06b6d4]')
    content = content.replace('shadow-[0_0_10px_theme(colors.orange.500)]', 'shadow-[0_0_10px_#f97316]')
    content = content.replace('shadow-[0_0_15px_theme(colors.orange.500)]', 'shadow-[0_0_15px_#f97316]')
    
    # If there are any bg-[#151515] left, nuke them
    content = content.replace('bg-[#151515]', 'bg-gray-900')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Fixed {filepath}')

fix_file('apps/web-app/src/pages/Agents.tsx')
fix_file('apps/web-app/src/pages/Atlas.tsx')
