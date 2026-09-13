import os
import glob

def replace_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        if 'hermes3:8b' in content:
            new_content = content.replace('hermes3:8b', 'qwen2.5-coder-local:latest')
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {filepath}")
    except Exception as e:
        print(f"Failed to process {filepath}: {e}")

if __name__ == "__main__":
    base_dir = r"C:\antigravityAS\Antigravity_OS_v2\backend"
    for ext in ("*.py", "*.json"):
        pattern = os.path.join(base_dir, "**", ext)
        for filepath in glob.glob(pattern, recursive=True):
            replace_in_file(filepath)
