"""
Semantic Search Engine para Antigravity OS
Usa sentence-transformers + ChromaDB para búsqueda vectorial sobre
22k prompts y 1.4k skills.

Workaround Windows: torchcodec tiene DLLs rotos en algunos entornos.
Las vars de entorno se setean ANTES de cualquier import de torch.
"""

import os

# --- Workaround obligatorio para Windows / torchcodec roto ---
os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["TORCHCODEC_DISABLE"] = "1"

import asyncio
import json
import logging
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query

logger = logging.getLogger("semantic_search")

# ─── Rutas de datos ─────────────────────────────────────────────────────────
_BACKEND_DIR = Path(__file__).resolve().parent.parent  # /backend
_ROOT_DIR = _BACKEND_DIR.parent  # /
_DATA_DIR = _ROOT_DIR / "data"
_CHROMA_DIR = _ROOT_DIR / "chroma_db"

PROMPTS_FILE = _ROOT_DIR / "prompts_db.json"  # 22k prompts en la raíz
SKILLS_FILE = _DATA_DIR / "skills_index.json"  # 1.4k skills

# Si prompts_db.json también está en data/, fallback:
if not PROMPTS_FILE.exists():
    PROMPTS_FILE = _DATA_DIR / "prompts_db.json"

PROMPTS_COLLECTION = "prompts_collection"
SKILLS_COLLECTION = "skills_collection"

router = APIRouter(tags=["Semantic Search"])


# ─── Motor de búsqueda (singleton) ──────────────────────────────────────────
class SemanticSearchEngine:
    def __init__(self):
        self._model = None
        self._chroma_client = None
        self._prompts_col = None
        self._skills_col = None
        self.is_indexing = False
        self.is_ready = False
        self.prompts_count = 0
        self.skills_count = 0

    def _load_model(self):
        """Carga sentence-transformers con manejo de errores."""
        if self._model is not None:
            return
        try:
            from sentence_transformers import SentenceTransformer

            self._model = SentenceTransformer("all-MiniLM-L6-v2")
            logger.info("[SemanticSearch] Modelo all-MiniLM-L6-v2 cargado OK.")
        except Exception as e:
            logger.error(f"[SemanticSearch] Error cargando modelo: {e}")
            raise

    def _init_chroma(self):
        """Inicializa ChromaDB con almacenamiento persistente."""
        if self._chroma_client is not None:
            return
        import chromadb

        _CHROMA_DIR.mkdir(parents=True, exist_ok=True)
        self._chroma_client = chromadb.PersistentClient(path=str(_CHROMA_DIR))
        # embedding_function=None → pasamos vectores pre-computados
        self._prompts_col = self._chroma_client.get_or_create_collection(
            name=PROMPTS_COLLECTION, metadata={"hnsw:space": "cosine"}
        )
        self._skills_col = self._chroma_client.get_or_create_collection(
            name=SKILLS_COLLECTION, metadata={"hnsw:space": "cosine"}
        )
        self.prompts_count = self._prompts_col.count()
        self.skills_count = self._skills_col.count()
        logger.info(
            f"[SemanticSearch] ChromaDB OK — prompts={self.prompts_count}, skills={self.skills_count}"
        )

    def _load_json(self, path: Path) -> list:
        if not path.exists():
            logger.warning(f"[SemanticSearch] No existe: {path}")
            return []
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, list):
            return data
        if isinstance(data, dict):
            # Algunos JSON tienen la lista bajo una clave
            for v in data.values():
                if isinstance(v, list):
                    return v
        return []

    def _already_indexed(self) -> bool:
        """Devuelve True si ya hay datos en ambas colecciones."""
        return self.prompts_count > 1000 and self.skills_count > 100

    async def index_all(self):
        """Indexa prompts y skills en background. Seguro llamar múltiples veces."""
        if self.is_indexing:
            logger.info("[SemanticSearch] Ya indexando, se omite llamada duplicada.")
            return
        self.is_indexing = True
        try:
            await asyncio.to_thread(self._index_sync)
        finally:
            self.is_indexing = False

    def _index_sync(self):
        """Indexación síncrona (se ejecuta en thread separado)."""
        self._load_model()
        self._init_chroma()

        if self._already_indexed():
            logger.info("[SemanticSearch] Índice ya existente, saltando re-indexación.")
            self.is_ready = True
            return

        # ── Indexar Prompts ───────────────────────────────────────────────
        prompts = self._load_json(PROMPTS_FILE)
        if prompts:
            logger.info(f"[SemanticSearch] Indexando {len(prompts)} prompts...")
            BATCH = 200
            for i in range(0, len(prompts), BATCH):
                batch = prompts[i : i + BATCH]
                texts = [
                    f"{p.get('title','')} {p.get('category','')} {p.get('content','')}"[
                        :512
                    ]
                    for p in batch
                ]
                embeddings = self._model.encode(texts, show_progress_bar=False).tolist()
                ids = [f"p_{i+j}" for j in range(len(batch))]
                metas = [
                    {
                        "title": p.get("title", ""),
                        "category": p.get("category", ""),
                        "content": p.get("content", "")[:300],
                        "source": "prompt",
                    }
                    for p in batch
                ]
                self._prompts_col.upsert(
                    ids=ids, embeddings=embeddings, metadatas=metas
                )
                if (i // BATCH) % 5 == 0:
                    logger.info(
                        f"[SemanticSearch] Prompts: {i+len(batch)}/{len(prompts)}"
                    )
            self.prompts_count = self._prompts_col.count()
            logger.info(f"[SemanticSearch] Prompts indexados: {self.prompts_count}")

        # ── Indexar Skills ────────────────────────────────────────────────
        skills = self._load_json(SKILLS_FILE)
        if skills:
            logger.info(f"[SemanticSearch] Indexando {len(skills)} skills...")
            BATCH = 100
            for i in range(0, len(skills), BATCH):
                batch = skills[i : i + BATCH]
                texts = [
                    f"{s.get('name','')} {s.get('category','')} {s.get('description','')}"[
                        :512
                    ]
                    for s in batch
                ]
                embeddings = self._model.encode(texts, show_progress_bar=False).tolist()
                ids = [f"s_{i+j}" for j in range(len(batch))]
                metas = [
                    {
                        "name": s.get("name", ""),
                        "category": s.get("category", ""),
                        "description": s.get("description", "")[:300],
                        "source": "skill",
                    }
                    for s in batch
                ]
                self._skills_col.upsert(ids=ids, embeddings=embeddings, metadatas=metas)
            self.skills_count = self._skills_col.count()
            logger.info(f"[SemanticSearch] Skills indexados: {self.skills_count}")

        self.is_ready = True
        logger.info("[SemanticSearch] ✅ Indexación completa.")

    def search(
        self, query: str, top_k: int = 30, filter_type: str | None = None
    ) -> list[dict]:
        """
        Búsqueda semántica por cosine similarity.
        filter_type: 'prompt', 'skill', o None (ambos)
        """
        if not self.is_ready:
            # Fallback a keyword mientras indexa
            return self._keyword_fallback(query, top_k, filter_type)

        self._load_model()
        query_vec = self._model.encode([query]).tolist()
        results = []

        if filter_type != "skill":
            try:
                res = self._prompts_col.query(
                    query_embeddings=query_vec,
                    n_results=min(top_k, self.prompts_count or 1),
                )
                for meta, dist in zip(res["metadatas"][0], res["distances"][0]):
                    results.append(
                        {
                            "title": meta.get("title", ""),
                            "category": meta.get("category", ""),
                            "content": meta.get("content", ""),
                            "source": "prompt",
                            "score": round(1 - dist, 4),  # cosine distance → similarity
                        }
                    )
            except Exception as e:
                logger.warning(f"[SemanticSearch] Error buscando prompts: {e}")

        if filter_type != "prompt":
            try:
                res = self._skills_col.query(
                    query_embeddings=query_vec,
                    n_results=min(top_k, self.skills_count or 1),
                )
                for meta, dist in zip(res["metadatas"][0], res["distances"][0]):
                    results.append(
                        {
                            "title": meta.get("name", ""),
                            "category": meta.get("category", ""),
                            "content": meta.get("description", ""),
                            "source": "skill",
                            "score": round(1 - dist, 4),
                        }
                    )
            except Exception as e:
                logger.warning(f"[SemanticSearch] Error buscando skills: {e}")

        # Mezclar y ordenar por score
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]

    def _keyword_fallback(
        self, query: str, top_k: int, filter_type: str | None
    ) -> list[dict]:
        """Búsqueda por keywords mientras el índice no está listo."""
        q = query.lower()
        results = []
        if filter_type != "skill":
            items = self._load_json(PROMPTS_FILE)
            for p in items:
                text = f"{p.get('title','')} {p.get('category','')} {p.get('content','')}".lower()
                score = sum(1 for kw in q.split() if kw in text)
                if score > 0:
                    results.append(
                        {
                            "title": p.get("title", ""),
                            "category": p.get("category", ""),
                            "content": p.get("content", "")[:300],
                            "source": "prompt",
                            "score": score / 10,
                        }
                    )
        if filter_type != "prompt":
            items = self._load_json(SKILLS_FILE)
            for s in items:
                text = f"{s.get('name','')} {s.get('description','')}".lower()
                score = sum(1 for kw in q.split() if kw in text)
                if score > 0:
                    results.append(
                        {
                            "title": s.get("name", ""),
                            "category": s.get("category", ""),
                            "content": s.get("description", "")[:300],
                            "source": "skill",
                            "score": score / 10,
                        }
                    )
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]


# Singleton global
_engine = SemanticSearchEngine()


# ─── Startup: inicializar ChromaDB y disparar indexación si falta ────────────
async def startup_semantic():
    """Llamar desde main.py en el lifespan."""
    try:
        _engine._init_chroma()
        if not _engine._already_indexed():
            logger.info("[SemanticSearch] Iniciando indexación en background...")
            asyncio.create_task(_engine.index_all())
        else:
            _engine.is_ready = True
            logger.info("[SemanticSearch] Índice ya existe, listo para buscar.")
    except Exception as e:
        logger.error(f"[SemanticSearch] Fallo en startup: {e}")


# ─── Endpoints ───────────────────────────────────────────────────────────────


@router.get("/semantic/status")
def status():
    return {
        "ready": _engine.is_ready,
        "indexing": _engine.is_indexing,
        "prompts_count": _engine.prompts_count,
        "skills_count": _engine.skills_count,
    }


@router.get("/semantic/search")
def semantic_search(
    q: str = Query(..., description="Texto de búsqueda"),
    top_k: int = Query(30, ge=1, le=100),
    type: str | None = Query(None, description="'prompt', 'skill', o None para ambos"),
):
    if not q.strip():
        raise HTTPException(
            status_code=400, detail="El parámetro 'q' no puede estar vacío."
        )
    results = _engine.search(query=q.strip(), top_k=top_k, filter_type=type)
    return {
        "query": q,
        "mode": "semantic" if _engine.is_ready else "keyword_fallback",
        "results": results,
        "total": len(results),
    }


@router.post("/semantic/index")
async def trigger_index(background_tasks: BackgroundTasks):
    """Dispara re-indexación manual."""
    if _engine.is_indexing:
        return {"status": "already_indexing"}
    background_tasks.add_task(_engine.index_all)
    return {"status": "indexing_started"}
