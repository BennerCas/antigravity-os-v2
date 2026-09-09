"""Persistencia SQLite de Antigravity_OS v2.

Tablas:
- flows: flujos guardados desde el Builder (Nexus)
- executions: historial de ejecuciones del runtime
- variants: prompts/variantes generadas por los botones AI
- tour_progress: progreso de la guía interactiva

Todo vive en backend/data/antigravity.db
"""
import json
import os
import sqlite3
import threading
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

_DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
DB_PATH = os.path.join(_DATA_DIR, "antigravity.db")
_lock = threading.Lock()


def _conn() -> sqlite3.Connection:
    os.makedirs(_DATA_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db() -> None:
    with _lock, _conn() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS flows (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT DEFAULT '',
                nodes TEXT NOT NULL DEFAULT '[]',
                edges TEXT NOT NULL DEFAULT '[]',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS executions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                framework TEXT,
                model_used TEXT,
                exit_code INTEGER,
                log TEXT,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS variants (
                id TEXT PRIMARY KEY,
                node_id TEXT,
                title TEXT,
                role TEXT,
                framework TEXT,
                variables TEXT,
                content TEXT,
                ai_reasoning TEXT,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS tour_progress (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS automations (
                id TEXT PRIMARY KEY,
                name TEXT,
                type TEXT NOT NULL,
                flow_id TEXT NOT NULL,
                cron_expr TEXT,
                master_prompt TEXT,
                retries INTEGER DEFAULT 0,
                timeout INTEGER DEFAULT 30,
                status TEXT NOT NULL DEFAULT 'ACTIVE',
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS learning_profiles (
                user_id TEXT PRIMARY KEY,
                level TEXT NOT NULL DEFAULT 'foundation',
                current_track TEXT DEFAULT 'builder',
                preferences TEXT DEFAULT '{}',
                stats TEXT DEFAULT '{}',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS mission_definitions (
                id TEXT PRIMARY KEY,
                version TEXT NOT NULL,
                track TEXT NOT NULL,
                stage INTEGER DEFAULT 0,
                title TEXT NOT NULL,
                brief TEXT NOT NULL,
                mode TEXT NOT NULL,
                data_json TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS mission_sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                mission_id TEXT NOT NULL,
                status TEXT NOT NULL,
                current_step INTEGER DEFAULT 0,
                sandbox_flow TEXT NOT NULL,
                hints_revealed TEXT DEFAULT '[]',
                reflections TEXT DEFAULT '[]',
                rubric_results TEXT DEFAULT '{}',
                findings TEXT DEFAULT '[]',
                started_at TEXT NOT NULL,
                completed_at TEXT
            );
            CREATE TABLE IF NOT EXISTS skill_mastery (
                user_id TEXT NOT NULL,
                skill_id TEXT NOT NULL,
                mastery_score REAL DEFAULT 0.0,
                state TEXT NOT NULL DEFAULT 'UNKNOWN',
                dimensions TEXT DEFAULT '{}',
                updated_at TEXT NOT NULL,
                PRIMARY KEY (user_id, skill_id)
            );
            CREATE TABLE IF NOT EXISTS evidence_ledger (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                skill_id TEXT NOT NULL,
                mission_id TEXT NOT NULL,
                session_id TEXT NOT NULL,
                evidence_type TEXT NOT NULL,
                source TEXT NOT NULL,
                validation_hash TEXT NOT NULL,
                prev_hash TEXT DEFAULT 'GENESIS_ROOT',
                payload TEXT NOT NULL,
                confidence REAL DEFAULT 1.0,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS learning_projects (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                title TEXT NOT NULL,
                status TEXT NOT NULL,
                spec_json TEXT DEFAULT '{}',
                artifacts_json TEXT DEFAULT '[]',
                milestones_json TEXT DEFAULT '[]',
                reviews_json TEXT DEFAULT '[]',
                updated_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS capstone_submissions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                capstone_id TEXT NOT NULL,
                flow_json TEXT NOT NULL,
                spec_json TEXT NOT NULL,
                defense_json TEXT DEFAULT '{}',
                rubric_evaluation TEXT DEFAULT '{}',
                status TEXT NOT NULL,
                submitted_at TEXT NOT NULL,
                evaluated_at TEXT
            );
            CREATE TABLE IF NOT EXISTS certifications (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                level TEXT NOT NULL,
                verification_token TEXT UNIQUE NOT NULL,
                evidence_chain_hash TEXT NOT NULL,
                metadata_json TEXT DEFAULT '{}',
                issued_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS portfolio_items (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                item_type TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                artifact_ref TEXT NOT NULL,
                evidence_refs TEXT DEFAULT '[]',
                published_at TEXT NOT NULL,
                preview_data TEXT DEFAULT '{}'
            );
            CREATE TABLE IF NOT EXISTS learning_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                event_type TEXT NOT NULL,
                payload TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_sessions_user_mission ON mission_sessions (user_id, mission_id);
            CREATE INDEX IF NOT EXISTS idx_evidence_user_skill ON evidence_ledger (user_id, skill_id);
            CREATE INDEX IF NOT EXISTS idx_mastery_user ON skill_mastery (user_id);
            CREATE INDEX IF NOT EXISTS idx_cert_token ON certifications (verification_token);
            CREATE INDEX IF NOT EXISTS idx_events_user ON learning_events (user_id);
            """
        )
        
        # Migration: Add missing columns if they don't exist
        try:
            conn.execute("ALTER TABLE automations ADD COLUMN name TEXT")
        except sqlite3.OperationalError:
            pass
        try:
            conn.execute("ALTER TABLE automations ADD COLUMN master_prompt TEXT")
        except sqlite3.OperationalError:
            pass
        try:
            conn.execute("ALTER TABLE automations ADD COLUMN retries INTEGER DEFAULT 0")
        except sqlite3.OperationalError:
            pass
        try:
            conn.execute("ALTER TABLE automations ADD COLUMN timeout INTEGER DEFAULT 30")
        except sqlite3.OperationalError:
            pass
        try:
            conn.execute("ALTER TABLE evidence_ledger ADD COLUMN prev_hash TEXT DEFAULT 'GENESIS_ROOT'")
        except sqlite3.OperationalError:
            pass

def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# ─── Flows ────────────────────────────────────────────────────────────────────

def flows_all() -> list[dict]:
    with _lock, _conn() as conn:
        rows = conn.execute("SELECT * FROM flows ORDER BY updated_at DESC").fetchall()
    return [
        {
            "id": r["id"],
            "name": r["name"],
            "description": r["description"],
            "nodes": json.loads(r["nodes"]),
            "edges": json.loads(r["edges"]),
            "created_at": r["created_at"],
            "updated_at": r["updated_at"],
        }
        for r in rows
    ]


def flow_upsert(flow: dict) -> None:
    now = _now()
    with _lock, _conn() as conn:
        conn.execute(
            """INSERT INTO flows (id, name, description, nodes, edges, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT(id) DO UPDATE SET
                 name=excluded.name, description=excluded.description,
                 nodes=excluded.nodes, edges=excluded.edges, updated_at=excluded.updated_at""",
            (
                flow["id"],
                flow.get("name", "Sin nombre"),
                flow.get("description", ""),
                json.dumps(flow.get("nodes", []), ensure_ascii=False),
                json.dumps(flow.get("edges", []), ensure_ascii=False),
                flow.get("created_at", now),
                now,
            ),
        )


def flow_delete(flow_id: str) -> bool:
    with _lock, _conn() as conn:
        cur = conn.execute("DELETE FROM flows WHERE id = ?", (flow_id,))
        return cur.rowcount > 0


# ─── Executions ───────────────────────────────────────────────────────────────

def execution_log(framework: str, model_used: str, exit_code: int, log: str) -> None:
    with _lock, _conn() as conn:
        conn.execute(
            "INSERT INTO executions (framework, model_used, exit_code, log, created_at) VALUES (?, ?, ?, ?, ?)",
            (framework, model_used, exit_code, log[-20000:], _now()),
        )


def executions_recent(limit: int = 50) -> list[dict]:
    with _lock, _conn() as conn:
        rows = conn.execute(
            "SELECT id, framework, model_used, exit_code, log, created_at FROM executions ORDER BY id DESC LIMIT ?",
            (limit,),
        ).fetchall()
    return [dict(r) for r in rows]


# ─── Variants (prompts generados por IA) ─────────────────────────────────────

def variant_save(v: dict) -> None:
    with _lock, _conn() as conn:
        conn.execute(
            """INSERT OR REPLACE INTO variants (id, node_id, title, role, framework, variables, content, ai_reasoning, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                str(v.get("id")),
                v.get("node_id"),
                v.get("title"),
                v.get("role"),
                v.get("framework"),
                v.get("variables"),
                v.get("content"),
                v.get("ai_reasoning"),
                _now(),
            ),
        )


def variants_all() -> list[dict]:
    with _lock, _conn() as conn:
        rows = conn.execute("SELECT * FROM variants ORDER BY created_at DESC").fetchall()
    return [dict(r) for r in rows]

# --- Automations ---

def automations_all() -> list[dict]:
    with _lock, _conn() as conn:
        rows = conn.execute("SELECT * FROM automations ORDER BY created_at DESC").fetchall()
    return [dict(r) for r in rows]

def automation_save(auto: dict) -> None:
    with _lock, _conn() as conn:
        conn.execute(
            """INSERT OR REPLACE INTO automations (id, name, type, flow_id, cron_expr, master_prompt, retries, timeout, status, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                str(auto.get("id")),
                auto.get("name"),
                auto.get("type", "CRON"),
                auto.get("flow_id"),
                auto.get("cron_expr", ""),
                auto.get("master_prompt"),
                auto.get("retries", 0),
                auto.get("timeout", 30),
                auto.get("status", "ACTIVE"),
                auto.get("created_at", _now()),
            )
        )

def automation_delete(auto_id: str) -> bool:
    with _lock, _conn() as conn:
        cur = conn.execute("DELETE FROM automations WHERE id = ?", (auto_id,))
        return cur.rowcount > 0

def automation_update_status(auto_id: str, status: str) -> bool:
    with _lock, _conn() as conn:
        cur = conn.execute("UPDATE automations SET status = ? WHERE id = ?", (status, auto_id))
        return cur.rowcount > 0


# ─── Academy: Learning Profiles ──────────────────────────────────────────────

def learning_profile_get_or_create(user_id: str, default_level: str = "foundation", default_track: str = "builder") -> dict:
    now = _now()
    with _lock, _conn() as conn:
        row = conn.execute("SELECT * FROM learning_profiles WHERE user_id = ?", (user_id,)).fetchone()
        if not row:
            initial_stats = {
                "missions_completed": 0,
                "failures_resolved": 0,
                "hints_used_count": 0,
                "reflections_submitted": 0,
                "capstones_passed": 0,
                "current_streak_days": 1,
            }
            initial_prefs = {
                "mode": "adaptive",
                "target_role": "ai_systems_architect",
                "preferred_language": "es",
                "accessibility_mode": False,
                "reduced_motion": False,
            }
            conn.execute(
                """INSERT INTO learning_profiles (user_id, level, current_track, preferences, stats, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (user_id, default_level, default_track, json.dumps(initial_prefs), json.dumps(initial_stats), now, now),
            )
            row = conn.execute("SELECT * FROM learning_profiles WHERE user_id = ?", (user_id,)).fetchone()

    return {
        "user_id": row["user_id"],
        "level": row["level"],
        "current_track": row["current_track"],
        "preferences": json.loads(row["preferences"]),
        "stats": json.loads(row["stats"]),
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def learning_profile_update(user_id: str, updates: dict) -> dict:
    now = _now()
    current = learning_profile_get_or_create(user_id)
    level = updates.get("level", current["level"])
    current_track = updates.get("current_track", current["current_track"])
    
    preferences = current["preferences"]
    if "preferences" in updates:
        preferences.update(updates["preferences"])
        
    stats = current["stats"]
    if "stats" in updates:
        stats.update(updates["stats"])

    with _lock, _conn() as conn:
        conn.execute(
            """UPDATE learning_profiles
               SET level = ?, current_track = ?, preferences = ?, stats = ?, updated_at = ?
               WHERE user_id = ?""",
            (level, current_track, json.dumps(preferences), json.dumps(stats), now, user_id),
        )
    return learning_profile_get_or_create(user_id)


# ─── Academy: Mission Definitions ────────────────────────────────────────────

def mission_def_upsert(mission: dict) -> None:
    now = _now()
    with _lock, _conn() as conn:
        conn.execute(
            """INSERT OR REPLACE INTO mission_definitions (id, version, track, stage, title, brief, mode, data_json, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                mission["id"],
                mission.get("version", "1.0.0"),
                mission.get("track", "builder"),
                mission.get("stage", 0),
                mission.get("title", ""),
                mission.get("brief", ""),
                mission.get("mode", "guided"),
                json.dumps(mission, ensure_ascii=False),
                mission.get("created_at", now),
            ),
        )


def mission_def_get(mission_id: str) -> Optional[dict]:
    with _lock, _conn() as conn:
        row = conn.execute("SELECT data_json FROM mission_definitions WHERE id = ?", (mission_id,)).fetchone()
    if row:
        return json.loads(row["data_json"])
    return None


def mission_defs_all() -> list[dict]:
    with _lock, _conn() as conn:
        rows = conn.execute("SELECT data_json FROM mission_definitions ORDER BY stage ASC, id ASC").fetchall()
    return [json.loads(r["data_json"]) for r in rows]


# ─── Academy: Mission Sessions ───────────────────────────────────────────────

def mission_session_create(session: dict) -> dict:
    now = _now()
    session_id = session.get("id") or f"sess_{int(datetime.now().timestamp())}_{session['mission_id']}"
    with _lock, _conn() as conn:
        conn.execute(
            """INSERT OR REPLACE INTO mission_sessions (id, user_id, mission_id, status, current_step, sandbox_flow, hints_revealed, reflections, rubric_results, findings, started_at, completed_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                session_id,
                session["user_id"],
                session["mission_id"],
                session.get("status", "started"),
                session.get("current_step", 1),
                json.dumps(session.get("sandbox_flow", {}), ensure_ascii=False),
                json.dumps(session.get("hints_revealed", [])),
                json.dumps(session.get("reflections", []), ensure_ascii=False),
                json.dumps(session.get("rubric_results", {}), ensure_ascii=False),
                json.dumps(session.get("findings", []), ensure_ascii=False),
                session.get("started_at", now),
                session.get("completed_at"),
            ),
        )
    return mission_session_get(session_id)


def mission_session_get(session_id: str) -> Optional[dict]:
    with _lock, _conn() as conn:
        row = conn.execute("SELECT * FROM mission_sessions WHERE id = ?", (session_id,)).fetchone()
    if not row:
        return None
    return {
        "id": row["id"],
        "user_id": row["user_id"],
        "mission_id": row["mission_id"],
        "status": row["status"],
        "current_step": row["current_step"],
        "sandbox_flow": json.loads(row["sandbox_flow"]),
        "hints_revealed": json.loads(row["hints_revealed"]),
        "reflections": json.loads(row["reflections"]),
        "rubric_results": json.loads(row["rubric_results"]),
        "findings": json.loads(row["findings"]),
        "started_at": row["started_at"],
        "completed_at": row["completed_at"],
    }


def mission_session_update(session_id: str, updates: dict) -> Optional[dict]:
    current = mission_session_get(session_id)
    if not current:
        return None
    current.update(updates)
    with _lock, _conn() as conn:
        conn.execute(
            """UPDATE mission_sessions
               SET status = ?, current_step = ?, sandbox_flow = ?, hints_revealed = ?, reflections = ?, rubric_results = ?, findings = ?, completed_at = ?
               WHERE id = ?""",
            (
                current["status"],
                current["current_step"],
                json.dumps(current["sandbox_flow"], ensure_ascii=False),
                json.dumps(current["hints_revealed"]),
                json.dumps(current["reflections"], ensure_ascii=False),
                json.dumps(current["rubric_results"], ensure_ascii=False),
                json.dumps(current["findings"], ensure_ascii=False),
                current["completed_at"],
                session_id,
            ),
        )
    return mission_session_get(session_id)


def mission_sessions_user(user_id: str) -> list[dict]:
    with _lock, _conn() as conn:
        rows = conn.execute("SELECT * FROM mission_sessions WHERE user_id = ? ORDER BY started_at DESC", (user_id,)).fetchall()
    return [
        {
            "id": r["id"],
            "user_id": r["user_id"],
            "mission_id": r["mission_id"],
            "status": r["status"],
            "current_step": r["current_step"],
            "sandbox_flow": json.loads(r["sandbox_flow"]),
            "hints_revealed": json.loads(r["hints_revealed"]),
            "reflections": json.loads(r["reflections"]),
            "rubric_results": json.loads(r["rubric_results"]),
            "findings": json.loads(r["findings"]),
            "started_at": r["started_at"],
            "completed_at": r["completed_at"],
        }
        for r in rows
    ]


# ─── Academy: Skill Mastery ──────────────────────────────────────────────────

def skill_mastery_get(user_id: str, skill_id: str) -> dict:
    with _lock, _conn() as conn:
        row = conn.execute("SELECT * FROM skill_mastery WHERE user_id = ? AND skill_id = ?", (user_id, skill_id)).fetchone()
    if not row:
        return {
            "user_id": user_id,
            "skill_id": skill_id,
            "mastery_score": 0.0,
            "state": "UNKNOWN",
            "dimensions": {},
            "updated_at": _now(),
        }
    return {
        "user_id": row["user_id"],
        "skill_id": row["skill_id"],
        "mastery_score": row["mastery_score"],
        "state": row["state"],
        "dimensions": json.loads(row["dimensions"]),
        "updated_at": row["updated_at"],
    }


def skill_mastery_all(user_id: str) -> list[dict]:
    with _lock, _conn() as conn:
        rows = conn.execute("SELECT * FROM skill_mastery WHERE user_id = ? ORDER BY mastery_score DESC", (user_id,)).fetchall()
    return [
        {
            "user_id": r["user_id"],
            "skill_id": r["skill_id"],
            "mastery_score": r["mastery_score"],
            "state": r["state"],
            "dimensions": json.loads(r["dimensions"]),
            "updated_at": r["updated_at"],
        }
        for r in rows
    ]


def skill_mastery_upsert(user_id: str, skill_id: str, score: float, state: str, dimensions: dict) -> dict:
    now = _now()
    with _lock, _conn() as conn:
        conn.execute(
            """INSERT OR REPLACE INTO skill_mastery (user_id, skill_id, mastery_score, state, dimensions, updated_at)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (user_id, skill_id, float(score), state, json.dumps(dimensions), now),
        )
    return skill_mastery_get(user_id, skill_id)


# ─── Academy: Evidence Ledger ────────────────────────────────────────────────

def evidence_insert(evidence: dict) -> None:
    now = _now()
    prev_hash = evidence.get("prev_hash", "GENESIS_ROOT")
    with _lock, _conn() as conn:
        conn.execute(
            """INSERT INTO evidence_ledger (id, user_id, skill_id, mission_id, session_id, evidence_type, source, validation_hash, prev_hash, payload, confidence, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                evidence["id"],
                evidence["user_id"],
                evidence["skill_id"],
                evidence["mission_id"],
                evidence["session_id"],
                evidence["evidence_type"],
                evidence["source"],
                evidence["validation_hash"],
                prev_hash,
                json.dumps(evidence.get("payload", {}), ensure_ascii=False),
                evidence.get("confidence", 1.0),
                evidence.get("created_at", now),
            ),
        )


def evidence_user(user_id: str, skill_id: Optional[str] = None) -> list[dict]:
    with _lock, _conn() as conn:
        if skill_id:
            rows = conn.execute(
                "SELECT * FROM evidence_ledger WHERE user_id = ? AND skill_id = ? ORDER BY created_at ASC, rowid ASC",
                (user_id, skill_id),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM evidence_ledger WHERE user_id = ? ORDER BY created_at ASC, rowid ASC",
                (user_id,),
            ).fetchall()
    return [
        {
            "id": r["id"],
            "user_id": r["user_id"],
            "skill_id": r["skill_id"],
            "mission_id": r["mission_id"],
            "session_id": r["session_id"],
            "evidence_type": r["evidence_type"],
            "source": r["source"],
            "validation_hash": r["validation_hash"],
            "prev_hash": r["prev_hash"] if "prev_hash" in r.keys() and r["prev_hash"] else "GENESIS_ROOT",
            "payload": json.loads(r["payload"]),
            "confidence": r["confidence"],
            "created_at": r["created_at"],
        }
        for r in rows
    ]


def evidence_latest(user_id: str) -> Optional[dict]:
    with _lock, _conn() as conn:
        row = conn.execute(
            "SELECT * FROM evidence_ledger WHERE user_id = ? ORDER BY rowid DESC LIMIT 1",
            (user_id,),
        ).fetchone()
    if not row:
        return None
    return {
        "id": row["id"],
        "user_id": row["user_id"],
        "skill_id": row["skill_id"],
        "mission_id": row["mission_id"],
        "session_id": row["session_id"],
        "evidence_type": row["evidence_type"],
        "source": row["source"],
        "validation_hash": row["validation_hash"],
        "prev_hash": row["prev_hash"] if "prev_hash" in row.keys() and row["prev_hash"] else "GENESIS_ROOT",
        "payload": json.loads(row["payload"]),
        "confidence": row["confidence"],
        "created_at": row["created_at"],
    }


def evidence_by_id(evidence_id: str) -> Optional[dict]:
    with _lock, _conn() as conn:
        row = conn.execute(
            "SELECT * FROM evidence_ledger WHERE id = ?",
            (evidence_id,),
        ).fetchone()
    if not row:
        return None
    return {
        "id": row["id"],
        "user_id": row["user_id"],
        "skill_id": row["skill_id"],
        "mission_id": row["mission_id"],
        "session_id": row["session_id"],
        "evidence_type": row["evidence_type"],
        "source": row["source"],
        "validation_hash": row["validation_hash"],
        "prev_hash": row["prev_hash"] if "prev_hash" in row.keys() and row["prev_hash"] else "GENESIS_ROOT",
        "payload": json.loads(row["payload"]),
        "confidence": row["confidence"],
        "created_at": row["created_at"],
    }


# ─── Academy: Projects & Capstone ────────────────────────────────────────────

def projects_user(user_id: str) -> list[dict]:
    with _lock, _conn() as conn:
        rows = conn.execute("SELECT * FROM learning_projects WHERE user_id = ? ORDER BY updated_at DESC", (user_id,)).fetchall()
    return [
        {
            "id": r["id"],
            "user_id": r["user_id"],
            "title": r["title"],
            "status": r["status"],
            "spec": json.loads(r["spec_json"]),
            "artifacts": json.loads(r["artifacts_json"]),
            "milestones": json.loads(r["milestones_json"]),
            "reviews": json.loads(r["reviews_json"]),
            "updated_at": r["updated_at"],
        }
        for r in rows
    ]


def project_get(project_id: str) -> Optional[dict]:
    with _lock, _conn() as conn:
        r = conn.execute("SELECT * FROM learning_projects WHERE id = ?", (project_id,)).fetchone()
    if not r:
        return None
    return {
        "id": r["id"],
        "user_id": r["user_id"],
        "title": r["title"],
        "status": r["status"],
        "spec": json.loads(r["spec_json"]),
        "artifacts": json.loads(r["artifacts_json"]),
        "milestones": json.loads(r["milestones_json"]),
        "reviews": json.loads(r["reviews_json"]),
        "updated_at": r["updated_at"],
    }


def project_upsert(project: dict) -> None:
    now = _now()
    with _lock, _conn() as conn:
        conn.execute(
            """INSERT OR REPLACE INTO learning_projects (id, user_id, title, status, spec_json, artifacts_json, milestones_json, reviews_json, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                project["id"],
                project["user_id"],
                project.get("title", "Untitled Project"),
                project.get("status", "draft"),
                json.dumps(project.get("spec", {}), ensure_ascii=False),
                json.dumps(project.get("artifacts", []), ensure_ascii=False),
                json.dumps(project.get("milestones", []), ensure_ascii=False),
                json.dumps(project.get("reviews", []), ensure_ascii=False),
                now,
            ),
        )


def capstone_submit(capstone: dict) -> None:
    now = _now()
    with _lock, _conn() as conn:
        conn.execute(
            """INSERT OR REPLACE INTO capstone_submissions (id, user_id, capstone_id, flow_json, spec_json, defense_json, rubric_evaluation, status, submitted_at, evaluated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                capstone["id"],
                capstone["user_id"],
                capstone["capstone_id"],
                json.dumps(capstone.get("flow", {}), ensure_ascii=False),
                json.dumps(capstone.get("spec", {}), ensure_ascii=False),
                json.dumps(capstone.get("defense", {}), ensure_ascii=False),
                json.dumps(capstone.get("rubric_evaluation", {}), ensure_ascii=False),
                capstone.get("status", "submitted"),
                capstone.get("submitted_at", now),
                capstone.get("evaluated_at", now),
            ),
        )


def capstones_user(user_id: str) -> list[dict]:
    with _lock, _conn() as conn:
        rows = conn.execute("SELECT * FROM capstone_submissions WHERE user_id = ? ORDER BY submitted_at DESC", (user_id,)).fetchall()
    return [
        {
            "id": r["id"],
            "user_id": r["user_id"],
            "capstone_id": r["capstone_id"],
            "flow": json.loads(r["flow_json"]),
            "spec": json.loads(r["spec_json"]),
            "defense": json.loads(r["defense_json"]),
            "rubric_evaluation": json.loads(r["rubric_evaluation"]),
            "status": r["status"],
            "submitted_at": r["submitted_at"],
            "evaluated_at": r["evaluated_at"],
        }
        for r in rows
    ]


def capstone_get(submission_id: str) -> Optional[dict]:
    with _lock, _conn() as conn:
        r = conn.execute("SELECT * FROM capstone_submissions WHERE id = ?", (submission_id,)).fetchone()
    if not r:
        return None
    return {
        "id": r["id"],
        "user_id": r["user_id"],
        "capstone_id": r["capstone_id"],
        "flow": json.loads(r["flow_json"]),
        "spec": json.loads(r["spec_json"]),
        "defense": json.loads(r["defense_json"]),
        "rubric_evaluation": json.loads(r["rubric_evaluation"]),
        "status": r["status"],
        "submitted_at": r["submitted_at"],
        "evaluated_at": r["evaluated_at"],
    }


# ─── Academy: Certifications & Portfolio ─────────────────────────────────────

def certification_issue(cert: dict) -> None:
    now = _now()
    with _lock, _conn() as conn:
        conn.execute(
            """INSERT OR REPLACE INTO certifications (id, user_id, level, verification_token, evidence_chain_hash, metadata_json, issued_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (
                cert["id"],
                cert["user_id"],
                cert["level"],
                cert["verification_token"],
                cert["evidence_chain_hash"],
                json.dumps(cert.get("metadata", {}), ensure_ascii=False),
                cert.get("issued_at", now),
            ),
        )


def certifications_user(user_id: str) -> list[dict]:
    with _lock, _conn() as conn:
        rows = conn.execute("SELECT * FROM certifications WHERE user_id = ? ORDER BY issued_at DESC", (user_id,)).fetchall()
    return [
        {
            "id": r["id"],
            "user_id": r["user_id"],
            "level": r["level"],
            "verification_token": r["verification_token"],
            "evidence_chain_hash": r["evidence_chain_hash"],
            "metadata": json.loads(r["metadata_json"]),
            "issued_at": r["issued_at"],
        }
        for r in rows
    ]


def certification_verify(token: str) -> Optional[dict]:
    with _lock, _conn() as conn:
        row = conn.execute("SELECT * FROM certifications WHERE verification_token = ?", (token,)).fetchone()
    if not row:
        return None
    return {
        "id": row["id"],
        "user_id": row["user_id"],
        "level": row["level"],
        "verification_token": row["verification_token"],
        "evidence_chain_hash": row["evidence_chain_hash"],
        "metadata": json.loads(row["metadata_json"]),
        "issued_at": row["issued_at"],
    }


def portfolio_items_user(user_id: str) -> list[dict]:
    with _lock, _conn() as conn:
        rows = conn.execute("SELECT * FROM portfolio_items WHERE user_id = ? ORDER BY published_at DESC", (user_id,)).fetchall()
    return [
        {
            "id": r["id"],
            "user_id": r["user_id"],
            "item_type": r["item_type"],
            "title": r["title"],
            "description": r["description"],
            "artifact_ref": r["artifact_ref"],
            "evidence_refs": json.loads(r["evidence_refs"]),
            "published_at": r["published_at"],
            "preview_data": json.loads(r["preview_data"]),
        }
        for r in rows
    ]


def portfolio_item_upsert(item: dict) -> None:
    now = _now()
    with _lock, _conn() as conn:
        conn.execute(
            """INSERT OR REPLACE INTO portfolio_items (id, user_id, item_type, title, description, artifact_ref, evidence_refs, published_at, preview_data)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                item["id"],
                item["user_id"],
                item.get("item_type", "workflow"),
                item.get("title", "Untitled Portfolio Item"),
                item.get("description", ""),
                item.get("artifact_ref", ""),
                json.dumps(item.get("evidence_refs", [])),
                item.get("published_at", now),
                json.dumps(item.get("preview_data", {}), ensure_ascii=False),
            ),
        )


# ─── Academy: Event-Driven Learning ──────────────────────────────────────────

def learning_event_log(user_id: str, event_type: str, payload: dict) -> None:
    now = _now()
    with _lock, _conn() as conn:
        conn.execute(
            "INSERT INTO learning_events (user_id, event_type, payload, created_at) VALUES (?, ?, ?, ?)",
            (user_id, event_type, json.dumps(payload, ensure_ascii=False), now),
        )


def learning_events_recent(user_id: str, limit: int = 50) -> list[dict]:
    with _lock, _conn() as conn:
        rows = conn.execute(
            "SELECT id, user_id, event_type, payload, created_at FROM learning_events WHERE user_id = ? ORDER BY id DESC LIMIT ?",
            (user_id, limit),
        ).fetchall()
    return [
        {
            "id": r["id"],
            "user_id": r["user_id"],
            "event_type": r["event_type"],
            "payload": json.loads(r["payload"]),
            "created_at": r["created_at"],
        }
        for r in rows
    ]

