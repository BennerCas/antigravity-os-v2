import json
import re
from datetime import datetime
from pathlib import Path
from typing import Any

from backend.model_defaults import DEFAULT_LOCAL_MODEL
from backend.services.agent_factory import AgentFactory

ROOM_RUNS_DIR = Path(__file__).resolve().parent.parent / "registries" / "room_runs"
CHARACTER_DIR = (
    Path(__file__).resolve().parent.parent / "registries" / "character_profiles"
)
ROOM_RUNS_DIR.mkdir(parents=True, exist_ok=True)
CHARACTER_DIR.mkdir(parents=True, exist_ok=True)

ROOM_PRESETS: list[dict[str, Any]] = [
    {
        "id": "podcast-product-war-room",
        "name": "Podcast Product War Room",
        "description": "Simula una sala tipo podcast donde estratega, creador y operador discuten una propuesta de producto.",
        "participants": [
            {
                "id": "host-strategist",
                "name": "Astra",
                "role": "Host estratega",
                "voice": "precisa",
                "instructions": "Eres Astra, host estratega de producto. Moderas una sala tipo podcast, sintetizas tensión útil y exiges claridad de producto y diferenciación real. Habla en español técnico, conciso y con cadencia humana.",
            },
            {
                "id": "builder-operator",
                "name": "Forge",
                "role": "Builder-operador",
                "voice": "operativa",
                "instructions": "Eres Forge, operador constructor. Bajas ideas a runtime, entregables, paneles, flujos y criterios verificables. Habla como alguien que realmente va a implementarlo.",
            },
            {
                "id": "creator-storyteller",
                "name": "Pulse",
                "role": "Creador-narrador",
                "voice": "energética",
                "instructions": "Eres Pulse, creador y storyteller. Transformas decisiones en narrativa, hooks, experiencia viva y contenido usable sin perder precisión.",
            },
        ],
    },
    {
        "id": "character-lab",
        "name": "Character Lab",
        "description": "Sala para diseñar personajes consistentes, diferenciados y listos para operar en chat o voz.",
        "participants": [
            {
                "id": "persona-architect",
                "name": "Myra",
                "role": "Persona architect",
                "voice": "curada",
                "instructions": "Eres Myra, arquitecta de personajes. Diseñas identidad, límites, tono, motivaciones y consistencia conductual. Cero personaje hueco.",
            },
            {
                "id": "dialogue-director",
                "name": "Vox",
                "role": "Dialogue director",
                "voice": "expresiva",
                "instructions": "Eres Vox, director de diálogo. Vuelves a cada personaje expresivo, útil, reconocible y capaz de sostener una conversación real.",
            },
            {
                "id": "governance-editor",
                "name": "Sigma",
                "role": "Governance editor",
                "voice": "fría",
                "instructions": "Eres Sigma, editor de gobernanza. Eliminas incoherencia, exceso y ambigüedad. Dejas perfiles robustos y operables.",
            },
        ],
    },
]


def _utc_now() -> str:
    return datetime.utcnow().isoformat() + "Z"


def _slugify(value: str) -> str:
    value = re.sub(r"[^a-zA-Z0-9_-]+", "-", value.strip().lower())
    return re.sub(r"-+", "-", value).strip("-") or "item"


def list_room_presets() -> list[dict[str, Any]]:
    return ROOM_PRESETS


def _room_run_path(run_id: str) -> Path:
    return ROOM_RUNS_DIR / f"{run_id}.json"


def _character_path(character_id: str) -> Path:
    return CHARACTER_DIR / f"{character_id}.json"


def list_room_runs() -> list[dict[str, Any]]:
    runs: list[dict[str, Any]] = []
    for path in sorted(ROOM_RUNS_DIR.glob("*.json"), reverse=True):
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
            runs.append(
                {
                    "id": payload.get("id"),
                    "preset_id": payload.get("preset_id"),
                    "preset_name": payload.get("preset_name"),
                    "objective": payload.get("objective"),
                    "status": payload.get("status"),
                    "updated_at": payload.get("updated_at"),
                    "turns": payload.get("turns"),
                    "participants": [
                        participant.get("name")
                        for participant in payload.get("participants", [])
                    ],
                }
            )
        except Exception:
            continue
    return runs[:20]


def get_room_run(run_id: str) -> dict[str, Any] | None:
    path = _room_run_path(run_id)
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def list_character_profiles() -> list[dict[str, Any]]:
    profiles: list[dict[str, Any]] = []
    for path in sorted(CHARACTER_DIR.glob("*.json"), reverse=True):
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
            profiles.append(payload)
        except Exception:
            continue
    return profiles[:20]


async def clone_character(
    name: str, source_prompt: str, archetype: str = ""
) -> dict[str, Any]:
    objective = source_prompt.strip()
    instructions = (
        "Eres un diseñador senior de personajes conversacionales para sistemas locales. "
        "Debes devolver SOLO JSON válido con claves: name, essence, tone, motivations, guardrails, speaking_style, system_prompt. "
        "No uses markdown ni texto fuera del JSON."
    )
    user_prompt = (
        f"Diseña un personaje robusto llamado {name}.\n"
        f"Arquetipo: {archetype or 'no especificado'}\n"
        f"Material fuente: {objective}\n"
        "Hazlo útil para chat fluido, rooms multiagente y voz local. Guardrails explícitos. Sistema consistente."
    )
    raw = await AgentFactory.chat_one_shot(
        agent_id="aurelios-core",
        user_prompt=user_prompt,
        override_instructions=instructions,
        model=f"ollama/{DEFAULT_LOCAL_MODEL}",
        use_tools=False,
    )
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?", "", cleaned).strip()
        cleaned = re.sub(r"```$", "", cleaned).strip()
    try:
        profile = json.loads(cleaned)
    except Exception:
        profile = {
            "name": name,
            "essence": archetype or "character",
            "tone": "conversacional",
            "motivations": [objective[:160]],
            "guardrails": [
                "No contradecir su identidad base",
                "No rellenar con frases vacías",
            ],
            "speaking_style": "directo y humano",
            "system_prompt": cleaned,
        }
    character_id = f"character-{_slugify(name)}-{int(datetime.utcnow().timestamp())}"
    payload = {
        "id": character_id,
        "created_at": _utc_now(),
        "source_prompt": source_prompt,
        "archetype": archetype,
        **profile,
    }
    _character_path(character_id).write_text(
        json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return payload


async def simulate_room(
    preset_id: str,
    objective: str,
    turns: int = 2,
    model: str | None = None,
    broadcast=None,
) -> dict[str, Any]:
    preset = next((item for item in ROOM_PRESETS if item["id"] == preset_id), None)
    if not preset:
        raise KeyError(preset_id)

    run_id = f"room-{preset_id}-{int(datetime.utcnow().timestamp())}"
    transcript: list[dict[str, Any]] = []
    participants = preset.get("participants", [])
    resolved_model = model or f"ollama/{DEFAULT_LOCAL_MODEL}"

    run = {
        "id": run_id,
        "preset_id": preset_id,
        "preset_name": preset.get("name"),
        "objective": objective,
        "turns": turns,
        "status": "running",
        "participants": participants,
        "transcript": transcript,
        "artifacts": [],
        "created_at": _utc_now(),
        "updated_at": _utc_now(),
        "model": resolved_model,
    }
    _room_run_path(run_id).write_text(
        json.dumps(run, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    room_brief = preset.get("description", "")
    for turn_index in range(1, turns + 1):
        for participant in participants:
            if broadcast:
                await broadcast(
                    {
                        "type": "ROOM_RUN_EVENT",
                        "payload": {
                            "run_id": run_id,
                            "status": "running",
                            "speaker": participant.get("name"),
                            "turn": turn_index,
                        },
                    }
                )
            history = "\n".join(
                [f"{entry['speaker']}: {entry['message']}" for entry in transcript[-8:]]
            )
            prompt = (
                f"OBJETIVO DE LA SALA: {objective}\n"
                f"PRESET: {preset.get('name')}\n"
                f"BRIEF: {room_brief}\n"
                f"TURNO: {turn_index}/{turns}\n"
                f"TRANSCRIPTO RECIENTE:\n{history or '[vacío]'}\n\n"
                "Responde como tu personaje con 1 párrafo breve y útil. Si haces handoff explícito, cierra con [HANDOFF:<nombre>]."
            )
            message = await AgentFactory.chat_one_shot(
                agent_id="aurelios-core",
                user_prompt=prompt,
                override_instructions=participant.get("instructions"),
                model=resolved_model,
                use_tools=False,
            )
            transcript.append(
                {
                    "turn": turn_index,
                    "speaker": participant.get("name"),
                    "role": participant.get("role"),
                    "message": message.strip(),
                }
            )
            run["updated_at"] = _utc_now()
            run["transcript"] = transcript
            _room_run_path(run_id).write_text(
                json.dumps(run, ensure_ascii=False, indent=2), encoding="utf-8"
            )

    transcript_md = "\n\n".join(
        [f"### {entry['speaker']}\n{entry['message']}" for entry in transcript]
    )
    run["status"] = "completed"
    run["updated_at"] = _utc_now()
    run["artifacts"] = [
        {
            "name": f"{preset.get('name')} Transcript",
            "content": f"# {preset.get('name')}\n\n**Objetivo:** {objective}\n\n{transcript_md}",
        }
    ]
    _room_run_path(run_id).write_text(
        json.dumps(run, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    if broadcast:
        await broadcast(
            {
                "type": "ROOM_RUN_EVENT",
                "payload": {
                    "run_id": run_id,
                    "status": "completed",
                },
            }
        )
    return run
