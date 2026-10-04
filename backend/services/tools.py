import os

from backend.services.atlas_library import extract_text_from_source

try:
    from duckduckgo_search import DDGS
except ImportError:
    DDGS = None

try:
    import PyPDF2
except ImportError:
    PyPDF2 = None


def web_search(query: str, max_results: int = 5) -> str:
    """
    Realiza una búsqueda en la web utilizando DuckDuckGo y retorna un resumen de los resultados.

    Args:
        query (str): El término o frase a buscar.
        max_results (int): Número máximo de resultados a retornar.

    Returns:
        str: Cadena de texto formateada con los resultados de la búsqueda.
    """
    if not DDGS:
        return "Error: La librería 'duckduckgo-search' no está instalada. Ejecuta 'pip install duckduckgo-search'."

    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=max_results))

        if not results:
            return f"No se encontraron resultados para la búsqueda: {query}"

        formatted_results = []
        for i, res in enumerate(results, 1):
            title = res.get("title", "Sin título")
            href = res.get("href", "")
            body = res.get("body", "")
            formatted_results.append(f"{i}. {title}\nURL: {href}\nResumen: {body}\n")

        return "\n".join(formatted_results)
    except Exception as e:
        return f"Error al realizar la búsqueda web: {e!s}"


def process_document(file_path: str = None, raw_text: str = None) -> str:
    """
    Lee y procesa el contenido de un archivo (TXT, MD, JSON, PDF, EPUB) o texto en bruto.

    Args:
        file_path (str, optional): Ruta absoluta al archivo a procesar.
        raw_text (str, optional): Texto en bruto a retornar directamente si no se provee un archivo.

    Returns:
        str: Contenido extraído del archivo o el texto en bruto.
    """
    if raw_text is not None and not file_path:
        return raw_text

    if not file_path:
        return "Error: Se debe proporcionar 'file_path' o 'raw_text'."

    if not os.path.exists(file_path):
        return f"Error: El archivo '{file_path}' no existe."

    ext = os.path.splitext(file_path)[1].lower().lstrip(".")
    try:
        return extract_text_from_source(ext, file_path)
    except Exception as e:
        return f"Error procesando el documento: {e!s}"


# Exportamos las herramientas en un formato compatible con el ecosistema de IA
# para que el "Backend AI Engineer" pueda usarlas en pipelines de LangChain / OpenAI / Ollama.

AVAILABLE_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "web_search",
            "description": "Busca información en Internet sobre un tema específico usando DuckDuckGo.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "El término o pregunta a buscar en la web.",
                    },
                    "max_results": {
                        "type": "integer",
                        "description": "Número de resultados a obtener. Por defecto es 5.",
                    },
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "process_document",
            "description": "Lee el contenido de un documento (TXT, MD, JSON, PDF o EPUB) o procesa texto en bruto.",
            "parameters": {
                "type": "object",
                "properties": {
                    "file_path": {
                        "type": "string",
                        "description": "Ruta al archivo a leer (.txt, .md, .json, .pdf o .epub).",
                    },
                    "raw_text": {
                        "type": "string",
                        "description": "Texto en bruto a usar si no se especifica un archivo.",
                    },
                },
            },
        },
    },
]


def get_tool_map() -> dict[str, callable]:
    """
    Retorna un diccionario mapeando los nombres de las herramientas a sus funciones
    implementadas, útil para ejecución dinámica por agentes IA.
    """
    return {"web_search": web_search, "process_document": process_document}
