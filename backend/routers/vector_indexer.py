import json
import os
from pathlib import Path
from typing import List, Dict, Any

try:
    import chromadb
    from chromadb.utils import embedding_functions
except ImportError:
    print("Please install chromadb: pip install chromadb")
    raise

# Directories and file paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
DB_DIR = BASE_DIR / "chroma_db"

PROMPTS_FILE = DATA_DIR / "prompts_db.json"
SKILLS_FILE = DATA_DIR / "skills_index.json"

COLLECTION_NAME = "ai_orchestration_agents"

class VectorIndexer:
    def __init__(self, persist_directory: str = str(DB_DIR)):
        """Initialize the ChromaDB client and collection."""
        self.client = chromadb.PersistentClient(path=persist_directory)
        
        # Using the default embedding function (all-MiniLM-L6-v2)
        self.embedding_fn = embedding_functions.DefaultEmbeddingFunction()
        
        self.collection = self.client.get_or_create_collection(
            name=COLLECTION_NAME,
            embedding_function=self.embedding_fn
        )

    def load_json_data(self, file_path: Path) -> List[Dict[str, Any]]:
        """Safely load a JSON file."""
        if not file_path.exists():
            print(f"Warning: {file_path} does not exist.")
            return []
            
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                # Handle cases where the top level is a dictionary containing a list
                if isinstance(data, dict):
                    # Try to find a list value
                    for key, value in data.items():
                        if isinstance(value, list):
                            return value
                    return [data]
                elif isinstance(data, list):
                    return data
                else:
                    return [data]
        except json.JSONDecodeError as e:
            print(f"Error decoding JSON from {file_path}: {e}")
            return []
        except Exception as e:
            print(f"Error reading {file_path}: {e}")
            return []

    def prepare_documents(self, items: List[Dict[str, Any]], source_type: str):
        """Prepare documents, metadata, and ids for insertion."""
        documents = []
        metadatas = []
        ids = []

        for idx, item in enumerate(items):
            # Extract relevant fields, defaulting to empty strings if missing
            title = item.get("title", item.get("name", ""))
            role = item.get("role", "")
            description = item.get("description", "")
            content = item.get("content", item.get("prompt", ""))
            
            # Construct a comprehensive document for embedding
            doc_parts = []
            if title: doc_parts.append(f"Title: {title}")
            if role: doc_parts.append(f"Role: {role}")
            if description: doc_parts.append(f"Description: {description}")
            if content: doc_parts.append(f"Content: {content}")
            
            document = "\n".join(doc_parts)
            
            # Skip empty documents
            if not document.strip():
                continue
                
            documents.append(document)
            
            # Store original fields in metadata for retrieval
            metadata = {
                "source": source_type,
                "title": title[:50] if title else "Unknown",  # Truncate for metadata limits if any
                "role": role[:50] if role else "Unknown"
            }
            metadatas.append(metadata)
            
            # Create a unique ID
            item_id = item.get("id", f"{source_type}_{idx}")
            ids.append(str(item_id))
            
        return documents, metadatas, ids

    def build_index(self):
        """Build the vector database from JSON files."""
        print("Loading data...")
        prompts = self.load_json_data(PROMPTS_FILE)
        skills = self.load_json_data(SKILLS_FILE)
        
        print(f"Loaded {len(prompts)} prompts and {len(skills)} skills.")
        
        p_docs, p_meta, p_ids = self.prepare_documents(prompts, "prompt")
        s_docs, s_meta, s_ids = self.prepare_documents(skills, "skill")
        
        all_docs = p_docs + s_docs
        all_meta = p_meta + s_meta
        all_ids = p_ids + s_ids
        
        if not all_docs:
            print("No valid documents found to index.")
            return

        print(f"Indexing {len(all_docs)} documents into ChromaDB...")
        
        # Batch insert to handle large numbers of documents (ChromaDB limit is 41666, we do chunks of 5000)
        batch_size = 5000
        for i in range(0, len(all_docs), batch_size):
            end_idx = min(i + batch_size, len(all_docs))
            print(f"Inserting batch {i} to {end_idx}...")
            self.collection.upsert(
                documents=all_docs[i:end_idx],
                metadatas=all_meta[i:end_idx],
                ids=all_ids[i:end_idx]
            )
            
        print("Indexing complete.")

    def search_agents(self, intent: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Query the vector database for agents/skills matching the user intent.
        
        Args:
            intent: The user's query or intent
            top_k: Number of results to return
            
        Returns:
            List of dictionaries containing the search results
        """
        results = self.collection.query(
            query_texts=[intent],
            n_results=top_k
        )
        
        formatted_results = []
        if not results['ids'] or not results['ids'][0]:
            return formatted_results
            
        # Parse the ChromaDB results format
        for i in range(len(results['ids'][0])):
            formatted_results.append({
                "id": results['ids'][0][i],
                "distance": results['distances'][0][i] if 'distances' in results and results['distances'] else None,
                "metadata": results['metadatas'][0][i] if 'metadatas' in results and results['metadatas'] else {},
                "document": results['documents'][0][i] if 'documents' in results and results['documents'] else ""
            })
            
        return formatted_results

def search_agents(intent: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """Helper function to perform a search without manually instantiating the class."""
    indexer = VectorIndexer()
    return indexer.search_agents(intent, top_k)

if __name__ == "__main__":
    # Example usage:
    # indexer = VectorIndexer()
    # indexer.build_index()
    # 
    # results = search_agents("I need an agent to optimize my SQL queries")
    # for res in results:
    #     print(res)
    pass
