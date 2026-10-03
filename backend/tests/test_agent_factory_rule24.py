import importlib
import sys
import types


def load_agent_factory_module():
    google_pkg = sys.modules.get("google") or types.ModuleType("google")
    antigravity_mod = types.ModuleType("google.antigravity")

    class DummyAgent:
        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

    class DummyLocalAgentConfig:
        def __init__(self, **kwargs):
            self.kwargs = kwargs

    class DummyCapabilitiesConfig:
        def __init__(self, **kwargs):
            self.kwargs = kwargs

    antigravity_mod.Agent = DummyAgent
    antigravity_mod.LocalAgentConfig = DummyLocalAgentConfig
    antigravity_mod.CapabilitiesConfig = DummyCapabilitiesConfig
    google_pkg.antigravity = antigravity_mod
    sys.modules["google"] = google_pkg
    sys.modules["google.antigravity"] = antigravity_mod

    dotenv_mod = types.ModuleType("dotenv")
    dotenv_mod.load_dotenv = lambda *args, **kwargs: None
    sys.modules["dotenv"] = dotenv_mod

    sys.modules.pop("backend.services.agent_factory", None)
    return importlib.import_module("backend.services.agent_factory")


def test_rule24_wraps_plain_hermes_prompt():
    module = load_agent_factory_module()

    prompt = module.ensamblar_instrucciones(
        "router",
        override_instructions="Clasifica la tarea del usuario y prepara la salida.",
        model="hermes3:unlocked",
    )

    for header in (
        "ROLE:",
        "CONTEXT:",
        "OBJECTIVE:",
        "STYLE:",
        "TONE:",
        "AUDIENCE:",
        "RESPONSE:",
        "CONSTRAINTS:",
        "HERMES_UNLOCKED_EXECUTION_PROFILE:",
    ):
        assert header in prompt

    assert "exactamente un bloque <thinking>...</thinking> con 3 lineas numeradas" in prompt.lower()
    assert "Modelo objetivo: hermes3:unlocked" in prompt


def test_rule24_augments_partial_costar_prompt_for_hermes():
    module = load_agent_factory_module()
    base_prompt = (
        "ROLE: Eres un router tecnico.\n"
        "CONTEXT: Clasifica la peticion entrante.\n"
        "STYLE: Tecnico y directo.\n"
        "CONSTRAINTS:\n1. Usa thinking."
    )

    prompt = module.ensamblar_instrucciones(
        "router",
        override_instructions=base_prompt,
        model="hermes3:unlocked",
    )

    assert prompt.count("ROLE:") == 1
    for header in ("OBJECTIVE:", "TONE:", "AUDIENCE:", "RESPONSE:", "HERMES_UNLOCKED_EXECUTION_PROFILE:"):
        assert header in prompt


def test_rule24_does_not_wrap_cloud_model_prompts():
    module = load_agent_factory_module()

    prompt = module.ensamblar_instrucciones(
        "router",
        override_instructions="Prompt base sin framework local.",
        model="gemini-2.5-flash",
    )

    assert prompt == "Prompt base sin framework local."
