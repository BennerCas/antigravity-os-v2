import re

path = r"c:\antigravityAS\Antigravity_OS_v2\backend\services\match_fuse_pipeline.py"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()

replacement = """    system_prompt = f\"\"\"Act as a Principal Cognitive Systems Architect specializing in multi-agent frameworks. Your objective is to design a cohesive SWARM of highly specialized AI agents based on the user's intent. You MUST decompose the user's request into AT LEAST 3 distinct, complementary agents that work together."""

text = text.replace("    system_prompt = f\"\"\"Act as a Principal Cognitive Systems Architect specializing in multi-agent frameworks. Your objective is to design highly specialized AI agents based on the user's intent, base genes, and atlas knowledge, and output their configurations in a strict JSON format.", replacement)

with open(path, "w", encoding="utf-8") as f:
    f.write(text)

print("Prompt modified to force a swarm")
