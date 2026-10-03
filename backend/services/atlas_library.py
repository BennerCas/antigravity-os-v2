import json
import os
import re
import threading
import time
import uuid
import zipfile
from dataclasses import dataclass
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx

try:
    from duckduckgo_search import DDGS
except ImportError:
    DDGS = None

try:
    import PyPDF2
except ImportError:
    PyPDF2 = None

from backend.services.chroma_db import vector_db

_BACKEND_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = _BACKEND_DIR / "data"
UPLOADS_DIR = DATA_DIR / "atlas_uploads"
LIBRARY_FILE = DATA_DIR / "atlas_auto_library.json"
SOURCES_FILE = DATA_DIR / "atlas_auto_sources.json"
JOBS_FILE = DATA_DIR / "atlas_auto_jobs.json"
AUTO_SYNC_INTERVAL_SEC = int(os.getenv("ATLAS_AUTO_SYNC_INTERVAL_SEC", "900"))
MAX_JOB_HISTORY = 50

for path in (DATA_DIR, UPLOADS_DIR):
    path.mkdir(parents=True, exist_ok=True)

_LOCK = threading.Lock()
_SYNC_THREAD_STARTED = False


class _HTMLTextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts: List[str] = []

    def handle_data(self, data: str) -> None:
        text = data.strip()
        if text:
            self.parts.append(text)

    def text(self) -> str:
        return "\n".join(self.parts)


def _read_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return default


def _write_json(path: Path, data: Any) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", value).strip("-").lower()
    return slug or uuid.uuid4().hex[:8]


def _clean_text(text: str) -> str:
    text = unescape(text or "")
    text = re.sub(r"\r", "", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[\t ]+", " ", text)
    return text.strip()


def _chunk_text(text: str, chunk_size: int = 1600, overlap: int = 220) -> List[str]:
    cleaned = _clean_text(text)
    if not cleaned:
        return []
    chunks: List[str] = []
    start = 0
    while start < len(cleaned):
        end = min(len(cleaned), start + chunk_size)
        chunk = cleaned[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end >= len(cleaned):
            break
        start = max(end - overlap, start + 1)
    return chunks


def _extract_pdf_text(file_path: Path) -> str:
    if not PyPDF2:
        raise RuntimeError("PyPDF2 no está instalado para procesar PDF.")
    parts: List[str] = []
    with file_path.open("rb") as fh:
        reader = PyPDF2.PdfReader(fh)
        for page in reader.pages:
            parts.append(page.extract_text() or "")
    return _clean_text("\n".join(parts))


def _extract_epub_text(file_path: Path) -> str:
    parts: List[str] = []
    with zipfile.ZipFile(file_path, "r") as zf:
        for name in zf.namelist():
            if name.lower().endswith((".xhtml", ".html", ".htm", ".xml")):
                parser = _HTMLTextExtractor()
                parser.feed(zf.read(name).decode("utf-8", errors="ignore"))
                text = parser.text()
                if text:
                    parts.append(text)
    return _clean_text("\n\n".join(parts))


def _extract_web_text(url_or_query: str) -> str:
    candidate = (url_or_query or "").strip()
    if not candidate:
        raise RuntimeError("No se recibió URL o query web.")
    if re.match(r"^https?://", candidate, flags=re.I):
        resp = httpx.get(candidate, timeout=30.0, follow_redirects=True)
        resp.raise_for_status()
        parser = _HTMLTextExtractor()
        parser.feed(resp.text)
        text = parser.text()
        return _clean_text(text)
    if not DDGS:
        return candidate
    with DDGS() as ddgs:
        results = list(ddgs.text(candidate, max_results=5))
    lines = []
    for idx, item in enumerate(results, start=1):
        lines.append(f"{idx}. {item.get('title','Sin título')}\nURL: {item.get('href','')}\nResumen: {item.get('body','')}")
    return _clean_text("\n\n".join(lines))


def extract_text_from_source(source_type: str, source_value: str) -> str:
    source_type = (source_type or "").lower()
    if source_type in {"text", "raw", "txt-inline"}:
        return _clean_text(source_value)
    if source_type == "web":
        return _extract_web_text(source_value)
    file_path = Path(source_value)
    if not file_path.exists():
        raise FileNotFoundError(f"No existe el archivo: {source_value}")
    ext = file_path.suffix.lower()
    if source_type == "pdf" or ext == ".pdf":
        return _extract_pdf_text(file_path)
    if source_type == "epub" or ext == ".epub":
        return _extract_epub_text(file_path)
    if source_type in {"txt", "md", "json"} or ext in {".txt", ".md", ".json"}:
        return _clean_text(file_path.read_text(encoding="utf-8", errors="ignore"))
    raise RuntimeError(f"Formato no soportado: {source_type or ext}")


def _build_knowledge_card(name: str, source_type: str, source_value: str, namespace: str, strategy: str, text: str) -> Dict[str, Any]:
    chunks = _chunk_text(text)
    preview = "\n".join([line for line in text.splitlines() if line.strip()][:10])[:1400]
    summary = chunks[0][:900] if chunks else text[:900]
    item_id = _slugify(f"{namespace}-{name}-{source_value}")
    content = (
        f"# {name}\n\n"
        f"- source_type: {source_type}\n"
        f"- source_value: {source_value}\n"
        f"- namespace: {namespace}\n"
        f"- strategy: {strategy}\n\n"
        f"## Summary\n{summary}\n\n"
        f"## Agent Knowledge Packet\n{preview}\n"
    )
    return {
        "id": item_id,
        "title": name,
        "category": f"Atlas Auto KB · {source_type.upper()}",
        "content": content,
        "source_type": source_type,
        "source_value": source_value,
        "namespace": namespace,
        "strategy": strategy,
        "raw_length": len(text),
        "chunk_count": len(chunks),
        "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "chunks": chunks,
    }


def _load_library_items() -> List[Dict[str, Any]]:
    return _read_json(LIBRARY_FILE, [])


def _save_library_items(items: List[Dict[str, Any]]) -> None:
    _write_json(LIBRARY_FILE, items)


def list_library_items() -> List[Dict[str, Any]]:
    return _load_library_items()


def list_sources() -> List[Dict[str, Any]]:
    return _read_json(SOURCES_FILE, [])


def list_jobs() -> List[Dict[str, Any]]:
    return _read_json(JOBS_FILE, [])


def _save_jobs(jobs: List[Dict[str, Any]]) -> None:
    _write_json(JOBS_FILE, jobs[:MAX_JOB_HISTORY])


def _update_job(job_id: str, **fields: Any) -> None:
    with _LOCK:
        jobs = list_jobs()
        for job in jobs:
            if job.get("id") == job_id:
                job.update(fields)
                break
        _save_jobs(jobs)


def _upsert_library_item(item: Dict[str, Any]) -> None:
    existing = None
    with _LOCK:
        items = _load_library_items()
        existing = next((x for x in items if x.get("id") == item["id"]), None)
        if existing:
            items = [item if x.get("id") == item["id"] else x for x in items]
        else:
            items.insert(0, item)
        _save_library_items(items)
    chunk_docs = item.get("chunks", [])
    ids = [f"atlas_auto_{item['id']}_{i}" for i in range(len(chunk_docs))]
    metas = [{"source": "atlas_auto", "title": item["title"], "category": item["category"], "namespace": item["namespace"], "source_type": item["source_type"]} for _ in chunk_docs]
    if ids:
        vector_db.atlas_collection.upsert(ids=ids, documents=chunk_docs, metadatas=metas)
    previous_count = int((existing or {}).get("chunk_count") or 0)
    if previous_count > len(chunk_docs):
        stale_ids = [f"atlas_auto_{item['id']}_{i}" for i in range(len(chunk_docs), previous_count)]
        if stale_ids:
            vector_db.atlas_collection.delete(ids=stale_ids)


def register_source(payload: Dict[str, Any]) -> Dict[str, Any]:
    source = {
        "id": payload.get("id") or _slugify(f"{payload.get('namespace','atlas')}:{payload.get('name') or payload.get('source_value') or uuid.uuid4().hex[:8]}"),
        "name": payload.get("name") or Path(payload.get("source_value", "source")).stem or "Atlas Source",
        "source_type": payload["source_type"],
        "source_value": payload["source_value"],
        "namespace": payload.get("namespace") or "atlas-forge",
        "strategy": payload.get("strategy") or "rag",
        "active": payload.get("active", True),
        "auto_sync": payload.get("auto_sync", True),
        "created_at": payload.get("created_at") or time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "last_synced_at": payload.get("last_synced_at"),
        "last_error": payload.get("last_error"),
    }
    with _LOCK:
        sources = list_sources()
        updated = False
        for idx, existing in enumerate(sources):
            if existing.get("id") == source["id"] or (existing.get("source_value") == source["source_value"] and existing.get("namespace") == source["namespace"]):
                source["id"] = existing["id"]
                source["created_at"] = existing.get("created_at", source["created_at"])
                sources[idx] = {**existing, **source}
                updated = True
                break
        if not updated:
            sources.insert(0, source)
        _write_json(SOURCES_FILE, sources)
    return source


def create_ingestion_job(source: Dict[str, Any]) -> Dict[str, Any]:
    job = {
        "id": uuid.uuid4().hex,
        "name": source.get("name") or "Atlas Job",
        "source_id": source.get("id"),
        "source_type": source.get("source_type"),
        "namespace": source.get("namespace"),
        "status": "queued",
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    with _LOCK:
        jobs = list_jobs()
        jobs.insert(0, job)
        _save_jobs(jobs)
    return job


def run_ingestion_job(job_id: str, source: Dict[str, Any]) -> None:
    _update_job(job_id, status="running", updated_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()))
    try:
        text = extract_text_from_source(source["source_type"], source["source_value"])
        if len(text.strip()) < 40:
            raise RuntimeError("El contenido extraído es demasiado corto para crear conocimiento útil.")
        item = _build_knowledge_card(
            source.get("name") or "Atlas Source",
            source["source_type"],
            source["source_value"],
            source.get("namespace") or "atlas-forge",
            source.get("strategy") or "rag",
            text,
        )
        _upsert_library_item(item)
        source = register_source({**source, "last_synced_at": item["updated_at"], "last_error": None})
        _update_job(job_id, status="done", updated_at=item["updated_at"], item_id=item["id"], title=item["title"], raw_length=item["raw_length"], chunk_count=item["chunk_count"])
    except Exception as exc:
        register_source({**source, "last_error": str(exc)})
        _update_job(job_id, status="error", updated_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), error=str(exc))


def sync_active_sources() -> List[Dict[str, Any]]:
    triggered = []
    active_jobs = list_jobs()
    for source in list_sources():
        if not source.get("active") or not source.get("auto_sync"):
            continue
        source_id = source.get("id")
        if any(job.get("source_id") == source_id and job.get("status") in {"queued", "running"} for job in active_jobs):
            continue
        job = create_ingestion_job(source)
        triggered.append(job)
        active_jobs.insert(0, job)
        thread = threading.Thread(target=run_ingestion_job, args=(job["id"], source), daemon=True)
        thread.start()
    return triggered


def get_status() -> Dict[str, Any]:
    items = _load_library_items()
    jobs = list_jobs()
    sources = list_sources()
    return {
        "library_count": len(items),
        "source_count": len(sources),
        "active_source_count": sum(1 for s in sources if s.get("active")),
        "running_jobs": sum(1 for j in jobs if j.get("status") == "running"),
        "queued_jobs": sum(1 for j in jobs if j.get("status") == "queued"),
        "last_job": jobs[0] if jobs else None,
        "sources": sources[:20],
        "jobs": jobs[:20],
        "items": items[:20],
        "auto_sync_interval_sec": AUTO_SYNC_INTERVAL_SEC,
    }


def detect_source_type(filename: str) -> str:
    ext = Path(filename).suffix.lower()
    return {".pdf": "pdf", ".epub": "epub", ".txt": "txt", ".md": "md", ".json": "json"}.get(ext, "txt")


def save_upload(filename: str, content: bytes) -> Path:
    target = UPLOADS_DIR / f"{uuid.uuid4().hex}_{Path(filename).name}"
    target.write_bytes(content)
    return target


def ensure_auto_sync_started() -> None:
    global _SYNC_THREAD_STARTED
    if _SYNC_THREAD_STARTED:
        return

    def _loop() -> None:
        while True:
            try:
                sync_active_sources()
            except Exception:
                pass
            time.sleep(max(AUTO_SYNC_INTERVAL_SEC, 60))

    thread = threading.Thread(target=_loop, daemon=True, name="atlas-auto-sync")
    thread.start()
    _SYNC_THREAD_STARTED = True
