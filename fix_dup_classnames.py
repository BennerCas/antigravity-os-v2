import re
import sys

def remove_duplicate_classnames(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find all JSX tags, including those spanning multiple lines
    def replacer(match):
        tag_content = match.group(0)
        
        # Find all className attributes inside this tag
        class_matches = list(re.finditer(r'className\s*=\s*(["\'])(.*?)\1', tag_content, re.DOTALL))
        
        if len(class_matches) <= 1:
            return tag_content
            
        # We have duplicates! Merge them.
        all_classes = []
        for m in class_matches:
            classes = m.group(2).split()
            all_classes.extend(classes)
            
        # Remove duplicates while preserving order
        seen = set()
        merged_classes = []
        for c in all_classes:
            if c not in seen:
                seen.add(c)
                merged_classes.append(c)
                
        merged_str = " ".join(merged_classes)
        
        # Replace the first className with the merged one
        first_match = class_matches[0]
        # Erase all other classNames
        new_tag_content = tag_content
        
        # Start from the end so we don't mess up indices
        for m in reversed(class_matches[1:]):
            start, end = m.span()
            # Also remove preceding whitespace if possible, but keeping it simple:
            new_tag_content = new_tag_content[:start] + new_tag_content[end:]
            
        # Now replace the first one with the merged result
        # Note: the index of the first match might have shifted if there were preceding matches removed,
        # but since we removed from the END (reversed), the first match's start/end are still valid!
        start, end = first_match.span()
        new_tag_content = new_tag_content[:start] + f'className="{merged_str}"' + new_tag_content[end:]
        
        return new_tag_content

    # Regex to match a JSX tag: <TagName ... >
    # This regex is simplified but works for most JSX tags. 
    # It avoids matching arrow functions by ensuring the tag starts with a letter after <
    new_content = re.sub(r'<[a-zA-Z0-9]+(?:\s+[^>]+?)?>', replacer, content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"Fixed duplicates in {filepath}")

remove_duplicate_classnames('apps/web-app/src/pages/Agents.tsx')
remove_duplicate_classnames('apps/web-app/src/pages/Atlas.tsx')
