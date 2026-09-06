import sys
sys.path.append('backend')
from routers.compiler import generate_langgraph_code

class Node:
    def __init__(self, title, content):
        self.title = title
        self.content = content

nodes = [Node("Técnico", "Hacer cosas con comillas ' simples y \" dobles y ¿ español")]
edges = []

try:
    code = generate_langgraph_code(nodes, edges, "Mi plan de ejecución con ' comillas")
    print("CODE COMPILED:")
    print("----------------")
    print(code)
    
    # Check syntax of generated code
    with open('test_out.py', 'w', encoding='utf-8') as f:
        f.write(code)
    
    import py_compile
    py_compile.compile('test_out.py', doraise=True)
    print("SYNTAX IS VALID!")
except Exception as e:
    print(f"Error: {e}")
