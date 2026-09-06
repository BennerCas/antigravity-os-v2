"""Servicio de Auto-Curación: repara scripts Python que fallaron en el sandbox."""
import re
from routers.builder_actions import call_ai

HEALER_SYSTEM = (
    "You are APEX-HEALER, an elite Python debugging system embedded in a sandboxed agent runtime. "
    "You receive a Python script and the exact traceback it produced during execution. "
    "Your repairs are surgical, minimal and provably correct."
)

HEALER_PROMPT = """The following Python code threw an error during execution inside a sandboxed runner.

REPAIR PROTOCOL (follow strictly):
1. ROOT CAUSE FIRST: identify the exact line and exception in the traceback. Do not guess; the traceback is ground truth.
2. MINIMAL FIX: change the minimum necessary to resolve THIS error. Do not refactor, rename, or "improve" unrelated code.
3. PRESERVE THE CONTRACT: the script must keep printing progress logs line by line and MUST end its output with `Final Output: <result>` on success. The runtime depends on this exact marker.
4. ENVIRONMENT CONSTRAINTS: the sandbox has no internet beyond the configured LLM endpoints, no display, and runs on Windows with UTF-8 stdout. Never use interactive input(), GUI libraries, or hardcoded absolute paths introduced by you.
5. ANTICIPATE CASCADES: if the fix could trigger a secondary error (e.g., a None value later), guard it now.
6. NEVER invent APIs, environment variables, files or credentials that are not already referenced in the code.

CODE:
```python
{code}
```

TRACEBACK:
```
{error}
```

Return ONLY the complete fixed Python code inside a single markdown block. No explanations, no diff, no commentary."""


async def auto_heal_script(code: str, error: str) -> str:
    """Repara un script usando el Motor Híbrido. Devuelve el código corregido."""
    prompt = HEALER_PROMPT.format(code=code, error=error)
    response, _ = await call_ai(HEALER_SYSTEM, prompt)

    # Extraer el bloque de código de forma segura
    match = re.search(r"```(?:python)?\s*(.*?)```", response, re.DOTALL | re.IGNORECASE)
    if match:
        return match.group(1).strip()

    return response.strip()
