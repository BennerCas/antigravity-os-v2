# Agent Instructions

## Package Manager
- Root: `npm install`, `npm run build`, `npm test`
- Frontend: `cd apps\web-app && npm install`
- Backend: `pip install -r backend\requirements.txt`

## File-Scoped Commands
| Task | Command |
|------|---------|
| Backend syntax | `python -m py_compile backend\path\to\file.py` |
| Frontend lint | `cd apps\web-app && npx eslint src\path\to\file.tsx` |
| Frontend test | `cd apps\web-app && npm run test -- --run src\path\to\file.test.tsx` |
| Frontend build check | `cd apps\web-app && npm run build` |

## Key Conventions
- Local-first AI: prefer Ollama and local tooling before cloud fallbacks.
- Canonical AI prompts/assets: `backend\skills_v2.json`, `apps\web-app\public\skills_v2.json`, `backend\services\freechat_pipeline.py`.
- AureliOS doctrine: optimize for VibeCoding, fluid chat, visible end-to-end flow, robust specialist agents, swarms/hives, board + artifacts, Atlas Forge, and Quantum.
- For complex tasks, expose flow, active agents, artifacts, and missing local capabilities instead of hiding them behind prose.
- Keep legacy model aliases backward-compatible by normalizing them to the current local default.

## Project Structure
- Frontend app: `apps\web-app`
- FastAPI backend: `backend`
- Studio state + agent cards: `apps\web-app\src\stores\useStudioStore.ts`

## Commit Attribution
AI commits MUST include:
```
Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>
```
