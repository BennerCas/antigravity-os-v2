import os
import glob
import hashlib
from pathlib import Path
import chromadb
from chromadb.utils import embedding_functions

# Configuración de Rutas
CHROMA_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "chroma_data")
os.makedirs(CHROMA_DATA_DIR, exist_ok=True)

# Rutas de conocimiento
GEMINI_SKILLS_DIR = r"C:\Users\Benner\.gemini\config\skills"
COPILOT_DIR = r"C:\Users\Benner\.copilot\installed-plugins"
CRAFT_DIR = r"C:\Users\Benner\.craft-agent"
AWESOME_SKILLS_DIR = r"C:\antigravityAS\antigravity-awesome-skills"

class AntigravityVectorDB:
    def __init__(self):
        # Persistent client para guardar en disco
        self.client = chromadb.PersistentClient(path=CHROMA_DATA_DIR)
        
        # Modelo de embeddings local, ligero y eficiente en CPU/ONNX
        self.embedding_fn = embedding_functions.DefaultEmbeddingFunction()
        
        # Colecciones
        self.agents_collection = self.client.get_or_create_collection(
            name="agents_dna", 
            embedding_function=self.embedding_fn
        )
        self.atlas_collection = self.client.get_or_create_collection(
            name="atlas_kb", 
            embedding_function=self.embedding_fn
        )

    def search_agents(self, query: str, n_results: int = 5):
        if self.agents_collection.count() == 0:
            return []
        results = self.agents_collection.query(query_texts=[query], n_results=n_results)
        return results["documents"][0] if results["documents"] else []

    def search_atlas(self, query: str, n_results: int = 5):
        if self.atlas_collection.count() == 0:
            return []
        results = self.atlas_collection.query(query_texts=[query], n_results=n_results)
        return results["documents"][0] if results["documents"] else []

    def sync_database(self, force_reindex=False):
        """Crawler masivo para ingestar el conocimiento local."""
        print("Iniciando sincronización de Base de Datos Vectorial...")
        
        # 1. Sincronizar Agentes (Agents DNA)
        if force_reindex or self.agents_collection.count() < 1000:
            print("Escaneando ecosistema de Agentes (Gemini, Copilot, Craft)...")
            agent_docs = []
            agent_ids = []
            agent_metas = []
            
            # Escanear Gemini Skills
            if os.path.exists(GEMINI_SKILLS_DIR):
                for skill_file in Path(GEMINI_SKILLS_DIR).rglob("SKILL.md"):
                    content = skill_file.read_text(encoding="utf-8", errors="ignore")
                    unique_id = hashlib.md5(str(skill_file).encode()).hexdigest()
                    agent_ids.append(f"gemini_{unique_id}")
                    agent_docs.append(content[:1500])  # Primeros 1500 chars para contexto core
                    agent_metas.append({"source": "gemini_skills", "name": skill_file.parent.name})

            # Copilot e inyección adicional
            if os.path.exists(COPILOT_DIR):
                for md_file in Path(COPILOT_DIR).rglob("*.md"):
                    content = md_file.read_text(encoding="utf-8", errors="ignore")
                    unique_id = hashlib.md5(str(md_file).encode()).hexdigest()
                    agent_ids.append(f"copilot_{unique_id}")
                    agent_docs.append(content[:1500])
                    agent_metas.append({"source": "copilot", "name": md_file.name})

            # Inyectar en batches de 100
            print(f"Indexando {len(agent_docs)} agentes en ChromaDB...")
            for i in range(0, len(agent_docs), 100):
                self.agents_collection.upsert(
                    ids=agent_ids[i:i+100],
                    documents=agent_docs[i:i+100],
                    metadatas=agent_metas[i:i+100]
                )
            print("Colección agents_dna actualizada.")

        # 2. Sincronizar Atlas KB
        if force_reindex or self.atlas_collection.count() < 1000:
            print("Escaneando ecosistema Atlas KB (Awesome Skills)...")
            atlas_docs = []
            atlas_ids = []
            atlas_metas = []
            
            if os.path.exists(AWESOME_SKILLS_DIR):
                count = 0
                for md_file in Path(AWESOME_SKILLS_DIR).rglob("*.md"):
                    if "node_modules" in str(md_file): continue
                    content = md_file.read_text(encoding="utf-8", errors="ignore")
                    # Evitar archivos muy vacíos
                    if len(content.strip()) < 50: continue
                    
                    unique_id = hashlib.md5(str(md_file).encode()).hexdigest()
                    atlas_ids.append(f"atlas_{unique_id}")
                    atlas_docs.append(content[:1500])
                    atlas_metas.append({"source": "awesome_skills", "filename": md_file.name})
                    count += 1
                    # Limite de seguridad inicial de 5000 para no bloquear la VRAM
                    if count > 5000: 
                        break

            print(f"Indexando {len(atlas_docs)} KBs en ChromaDB...")
            for i in range(0, len(atlas_docs), 100):
                self.atlas_collection.upsert(
                    ids=atlas_ids[i:i+100],
                    documents=atlas_docs[i:i+100],
                    metadatas=atlas_metas[i:i+100]
                )
            print("Colección atlas_kb actualizada.")

# Instancia global (Singleton)
vector_db = AntigravityVectorDB()

if __name__ == "__main__":
    vector_db.sync_database()
