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
