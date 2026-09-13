import re

def fix_duplicate_classnames(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # The subagent injected `\n className="..."          onClick=` or similar.
    # We want to find cases where a tag has two classNames.
    # It looks like: className="<new_classes>"          onClick={...} [newlines/spaces] className="<old_classes>"
    
    # We will just look for ` className="([^"]*)"(\s*onClick=[^\n]*)(\s*className="([^"]*)")`
    # and merge them into a single className.
    
    pattern = r'className="([^"]*)"(\s*onClick=[^\n]*)(\s*className="([^"]*)")'
    
    def replacer(match):
        new_classes = match.group(1)
        onclick_part = match.group(2)
        old_classes = match.group(4)
        
        # Merge classes. We'll put new classes at the end so they override if there are conflicts, 
        # but in Tailwind order doesn't strictly matter. Let's combine them and remove duplicates.
        combined = list(dict.fromkeys((old_classes + " " + new_classes).split()))
        
        # Remove any old bg-purple-600 or text-white if we have cyan versions
        filtered = []
        for c in combined:
            if c in ['bg-purple-600', 'hover:bg-purple-500', 'text-white']:
                continue
            filtered.append(c)
            
        merged_class_str = " ".join(filtered)
        
        return f'{onclick_part}\n          className="{merged_class_str}"'
    
    content, count = re.subn(pattern, replacer, content)
    
    # Also handle the case where onClick is after className
    pattern2 = r'className="([^"]*)"(\s*key=[^\n]*)(\s*className="([^"]*)")'
    def replacer2(match):
        new_classes = match.group(1)
        key_part = match.group(2)
        old_classes = match.group(4)
        combined = list(dict.fromkeys((old_classes + " " + new_classes).split()))
        merged_class_str = " ".join(combined)
        return f'{key_part}\n          className="{merged_class_str}"'
    
    content, count2 = re.subn(pattern2, replacer2, content)
    
    # Let's use a more general regex for any tag with two classNames.
    # This is tricky in regex, so let's just do a greedy match within a tag:
    # <button ... className="A" ... className="B" ... >
    # Actually, a simpler way is just to fix the specific pattern the subagent used:
    # The subagent added `className="border border-cyan-400 ... "` right before `onClick` or `key`.
    
    # Let's just manually replace the exact broken string that the subagent used.
    # The subagent used:
    # className="border border-cyan-400 shadow-[0_0_10px_#22d3ee] text-cyan-400 hover:bg-cyan-900/30 hover:shadow-[0_0_15px_#06b6d4] transition-all font-bold"          onClick=
    
    bad_class = 'className="border border-cyan-400 shadow-[0_0_10px_#22d3ee] text-cyan-400 hover:bg-cyan-900/30 hover:shadow-[0_0_15px_#06b6d4] transition-all font-bold"          '
    content = content.replace(bad_class, '')
    
    bad_class_2 = 'className="font-bold py-4 px-7 rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2 whitespace-nowrap border border-cyan-400 shadow-[0_0_10px_#22d3ee] text-cyan-400 hover:bg-cyan-900/30 hover:shadow-[0_0_15px_#06b6d4] transition-all"              '
    content = content.replace(bad_class_2, '')
    
    bad_class_3 = 'className="font-bold py-4 px-7 rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-wait border border-cyan-400 shadow-[0_0_10px_#22d3ee] text-cyan-400 hover:bg-cyan-900/30 hover:shadow-[0_0_15px_#06b6d4] transition-all"              '
    content = content.replace(bad_class_3, '')
    
    bad_class_4 = 'className="flex items-center gap-2 mb-6 transition-colors px-4 py-2 rounded-lg w-fit border border-cyan-500/50 shadow-[0_0_10px_#06b6d4] border-cyan-400 shadow-[0_0_10px_#22d3ee] text-cyan-400 hover:bg-cyan-900/30 hover:shadow-[0_0_15px_#06b6d4] transition-all font-bold"          '
    content = content.replace(bad_class_4, '')

    bad_class_5 = 'className="font-bold py-3 px-6 rounded-xl flex items-center gap-2 whitespace-nowrap transition-colors border border-cyan-400 shadow-[0_0_10px_#22d3ee] text-cyan-400 hover:bg-cyan-900/30 hover:shadow-[0_0_15px_#06b6d4] transition-all"            '
    content = content.replace(bad_class_5, '')

    # I will just write a generalized python parser for the files that merges any duplicate className attributes inside tags.
    import ast
    # Not using AST, let's write a simple state machine.
    
    out = []
    i = 0
    while i < len(content):
        if content[i:i+11] == 'className="':
            # This is not safe enough if we don't track tags.
            pass
        i += 1
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Fixed {filepath}: replaced {count} + {count2} pattern matches')

fix_duplicate_classnames('apps/web-app/src/pages/Agents.tsx')
fix_duplicate_classnames('apps/web-app/src/pages/Atlas.tsx')
