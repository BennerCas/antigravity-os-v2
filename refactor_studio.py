import os

with open('backend/routers/studio.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Make sure ensamblar_instrucciones is imported
if 'ensamblar_instrucciones' not in content:
    content = content.replace(
        "from backend.services.agent_factory import AgentFactory",
        "from backend.services.agent_factory import AgentFactory, ensamblar_instrucciones"
    )

import re

# We will replace the AgentFactory.chat_one_shot calls with _call_ollama calls
# The pattern spans multiple lines.

old_call_triage = """            resp_text = await AgentFactory.chat_one_shot(
                agent_id=agent_id,
                user_prompt=accumulated_context,
                override_instructions=override_instructions,
                model=None, # Deja que el Factory decida
                use_tools=False # Evita errores de compatibilidad en Ollama
            )"""

new_call_triage = """            sys_prompt = ensamblar_instrucciones(agent_id=agent_id, override_instructions=override_instructions)
            resp = await _call_ollama(
                user=accumulated_context,
                system=sys_prompt,
                model=os.environ.get("OLLAMA_MODEL", "hermes3:8b")
            )
            resp_text = resp.content"""

content = content.replace(old_call_triage, new_call_triage)

old_call_others = """            resp_text = await AgentFactory.chat_one_shot(
                agent_id=agent_id,
                user_prompt=accumulated_context,
                override_instructions=role["prompt"],
                model=None, # Quantum engine routing applies
                use_tools=False
            )"""

new_call_others = """            sys_prompt = ensamblar_instrucciones(agent_id=agent_id, override_instructions=role["prompt"])
            resp = await _call_ollama(
                user=accumulated_context,
                system=sys_prompt,
                model=os.environ.get("OLLAMA_MODEL", "hermes3:8b")
            )
            resp_text = resp.content"""

content = content.replace(old_call_others, new_call_others)


with open('backend/routers/studio.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Refactor complete!")
