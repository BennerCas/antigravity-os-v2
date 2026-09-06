# -*- coding: utf-8 -*-
import os
from dotenv import load_dotenv
load_dotenv(r'C:\antigravityAS\BennerAI\.env')
from typing import TypedDict
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI

class GraphState(TypedDict):
    input: str
    output: str

llm = ChatOpenAI(model='qwen7b', openai_api_key=os.environ.get('FREE_AI_API_KEY', 'dummy'), openai_api_base='https://api.free.ai/v1')

# --- Node Functions ---
def node_0(state: GraphState):
    print(f'Executing node_0...')
    prompt = "Hacer cosas con comillas ' simples y \" dobles y \u00bf espa\u00f1ol" + ' ' + state.get('input', '')
    response = llm.invoke(prompt)
    return {'output': response.content}

workflow = StateGraph(GraphState)
workflow.add_node('node_0', node_0)
workflow.set_entry_point('node_0')
workflow.add_edge('node_0', END)
app = workflow.compile()

if __name__ == '__main__':
    print('Starting LangGraph process...')
    result = app.invoke({'input': "Mi plan de ejecuci\u00f3n con ' comillas"})
    print('Final Output:', result['output'])