import re

path = r"c:\antigravityAS\Antigravity_OS_v2\backend\services\match_fuse_pipeline.py"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()

debug_logic = """
            try:
                # DEBUG LOG
                with open("last_llm_output.txt", "w", encoding="utf-8") as dbgf:
                    dbgf.write(final_text)
                    
                parsed = json.loads(final_text)
"""

text = text.replace("            try:\n                parsed = json.loads(final_text)", debug_logic)

with open(path, "w", encoding="utf-8") as f:
    f.write(text)

print("Added debug log")
