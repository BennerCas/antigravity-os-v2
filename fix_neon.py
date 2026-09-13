import re
import os

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Replace shadow-[0_0_10px_theme(colors.cyan.500)] with hex values so Tailwind arbitrary values work
    content = content.replace('shadow-[0_0_10px_theme(colors.cyan.500)]', 'shadow-[0_0_10px_#06b6d4]')
    content = content.replace('shadow-[0_0_15px_theme(colors.cyan.500)]', 'shadow-[0_0_15px_#06b6d4]')
    content = content.replace('shadow-[0_0_10px_theme(colors.cyan.400)]', 'shadow-[0_0_10px_#22d3ee]')
    content = content.replace('shadow-[0_0_15px_theme(colors.cyan.400)]', 'shadow-[0_0_15px_#22d3ee]')
    content = content.replace('shadow-[0_0_10px_theme(colors.orange.500)]', 'shadow-[0_0_10px_#f97316]')
    content = content.replace('shadow-[0_0_15px_theme(colors.orange.500)]', 'shadow-[0_0_15px_#f97316]')

    # 2. Fix the ternary operators for cards in Agents.tsx
    content = content.replace(\"'border-[#174A1F] active-card'\", \"'bg-black/80 border-cyan-500 shadow-[0_0_10px_#06b6d4]'\")
    content = content.replace(\"'border-blue-500 active-card-blue'\", \"'bg-black/80 border-cyan-500 shadow-[0_0_10px_#06b6d4]'\")
    content = content.replace(\"'bg-[#151515] border-[#2A2A2A] hover:border-gray-500'\", \"'bg-black/80 border-cyan-500/50 shadow-[0_0_10px_#06b6d4] hover:border-cyan-400 hover:shadow-[0_0_15px_#22d3ee]'\")
    content = content.replace(\"'bg-[#151515] border-blue-900/40 hover:border-blue-700/60'\", \"'bg-black/80 border-orange-500/50 shadow-[0_0_10px_#f97316] hover:border-orange-400 hover:shadow-[0_0_15px_#fb923c]'\")
    
    # 3. For any remaining bg-[#151515], replace it with bg-gray-900 to match the dark theme and allow shadows to pop
    content = content.replace('bg-[#151515]', 'bg-gray-900')

    # 4. Buttons that missed the glow or have plain borders
    content = content.replace('border-gray-800', 'border-cyan-500/50 shadow-[0_0_8px_#06b6d4]')
    content = content.replace('border-[#2A2A2A]', 'border-cyan-500/50 shadow-[0_0_8px_#06b6d4]')
    
    # 5. Add !important equivalent or more specific tailwind class if needed, but Tailwind arbitrary should work now.
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Fixed {filepath}')

fix_file('apps/web-app/src/pages/Agents.tsx')
fix_file('apps/web-app/src/pages/Atlas.tsx')
