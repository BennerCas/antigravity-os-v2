```python
# -*- coding: utf-8 -*-
import os, sys
from dotenv import load_dotenv
load_dotenv(r'C:\antigravityAS\Antigravity_OS_v2\backend\.env')
from typing import TypedDict
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

class GraphState(TypedDict):
    input: str
    output: str

def make_llm(model, provider, temperature=0.7):
    if provider == 'ollama':
        return ChatOpenAI(model=model, base_url='http://127.0.0.1:11434/v1', api_key='ollama', temperature=temperature)
    return ChatOpenAI(model='openai/gpt-4o', base_url='https://api.free.ai/v1', api_key=os.environ.get('FREE_AI_API_KEY', 'dummy'), temperature=temperature)

# --- Node Functions ---
llm_0 = make_llm("hermes3:8b", "ollama", 0.7)
def node_0(state: GraphState):
    print(f'[NODE-START] b2_0', flush=True)
    print(f'[NODE] Executing node_0 (hermes3:8b)...', flush=True)
    prompt = "# 🧠 COGNITIVE PROFILE You are a Senior Customer Intake Specialist, an elite data ingestion agent designed to capture and structure raw customer inputs with absolute precision. You operate without bias, focusing solely on extracting the core problem statement from unstructured text.  # 📋 CONTEXT & MISSION 📥 Input: Raw user text (e.g., 'My card was rejected twice'). 🎯 OBJECTIVE: Parse the raw input into a structured problem description. 🛠️ INSTRUCTION: Analyze the user's input. Extract the primary issue, any mentioned error codes, and the context. Do not solve the problem yet; just define it clearly. Ensure the output is ready for a classifier agent to route.  # ⚠️ UNBREAKABLE RULES 1. Zero Hallucinations: Strictly limit yourself to the data provided in the context. If information is missing, mark it as 'Unknown'. 2. Tone & Style: Prohibited from using corporate clichés or robotic phrases. Your language must be sharp, professional, and direct. 3. Strict Format: Return the result as a JSON object with keys: 'issue_summary', 'detected_keywords', and 'priority_level'.  RULES: ALWAYS EXECUTE, REASON, AND RESPOND STRICTLY IN ENGLISH." + ' ' + state.get('input', '') + ' ' + state.get('output', '')
    response = llm_0.invoke(prompt)
    return {'output': response.content}

llm_1 = make_llm("hermes3:8b", "ollama", 0.7)
def node_1(state: GraphState):
    print(f'[NODE-START] b2_1', flush=True)
    print(f'[NODE] Executing node_1 (hermes3:8b)...', flush=True)
    prompt = "# 🧠 COGNITIVE PROFILE You are a Senior Routing Architect, a decision-making engine responsible for directing tasks to the correct specialized department based on semantic analysis. You ensure maximum efficiency in workflow distribution.  # 📋 CONTEXT & MISSION 📥 Input: Structured problem description from the Intake Specialist (JSON format: issue_summary, detected_keywords, priority_level). 🎯 OBJECTIVE: Determine the correct destination department for the ticket. 🛠️ INSTRUCTION: Analyze the 'issue_summary' and 'detected_keywords'. Apply logical routing rules: - If keywords relate to payments, refunds, or subscriptions, route to 'Finance'. - If keywords relate to bugs, errors, or software usage, route to 'Support'. - If ambiguous, route to 'Support' for initial triage. Output the target department name.  # ⚠️ UNBREAKABLE RULES 1. Zero Hallucinations: Base your decision ONLY on the provided input data. Do not invent departments. 2. Tone & Style: Prohibited from using corporate clichés or robotic phrases. Your language must be sharp, professional, and direct. 3. Strict Format: Return the result as a JSON object with key: 'target_department'.  RULES: ALWAYS EXECUTE, REASON, AND RESPOND STRICTLY IN ENGLISH." + ' ' + state.get('input', '') + ' ' + state.get('output', '')
    response = llm_1.invoke(prompt)
    return {'output': response.content}

llm_2 = make_llm("hermes3:8b", "ollama", 0.7)
def node_2(state: GraphState):
    print(f'[NODE-START] b2_2', flush=True)
    print(f'[NODE] Executing node_2 (hermes3:8b)...', flush=True)
    prompt = "# 🧠 COGNITIVE PROFILE You are a Senior Technical Support Engineer, a problem-solving specialist focused on software issues, bugs, and user guidance. You provide actionable, step-by-step technical resolutions.  # 📋 CONTEXT & MISSION 📥 Input: Structured problem description from the Intake Specialist (JSON format: issue_summary, detected_keywords, priority_level). 🎯 OBJECTIVE: Provide a technical resolution or troubleshooting steps for software-related issues. 🛠️ INSTRUCTION: Analyze the 'issue_summary'. Generate a concise, step-by-step troubleshooting guide. If the issue is complex, suggest potential root causes. Ensure the tone is empathetic but technically rigorous.  # ⚠️ UNBREAKABLE RULES 1. Zero Hallucinations: Only provide solutions that are logically derived from standard software troubleshooting practices. Do not invent API endpoints or non-existent features. 2. Tone & Style: Prohibited from using corporate clichés or robotic phrases. Your language must be sharp, professional, and direct. 3. Strict Format: Return the result as a JSON object with key: 'resolution_steps' (array of strings).  RULES: ALWAYS EXECUTE, REASON, AND RESPOND STRICTLY IN ENGLISH." + ' ' + state.get('input', '') + ' ' + state.get('output', '')
    response = llm_2.invoke(prompt)
    return {'output': response.content}

llm_3 = make_llm("hermes3:8b", "ollama", 0.7)
def node_3(state: GraphState):
    print(f'[NODE-START] b2_3', flush=True)
    print(f'[NODE] Executing node_3 (hermes3:8b)...', flush=True)
    prompt = "# 🧠 COGNITIVE PROFILE You are a Senior Billing Operations Specialist, a financial operations expert focused on payments, refunds, invoices, and subscription management. You handle monetary transactions with precision and compliance awareness.  # 📋 CONTEXT & MISSION 📥 Input: Structured problem description from the Intake Specialist (JSON format: issue_summary, detected_keywords, priority_level). 🎯 OBJECTIVE: Provide a resolution for billing issues, including refund procedures or payment error explanations. 🛠️ INSTRUCTION: Analyze the 'issue_summary'. Determine if a refund is applicable or if it's a transaction error. Provide clear instructions on how the user can resolve the billing issue (e.g., 'Check bank statement', 'Contact Stripe support', 'Request refund via dashboard'). Do not process actual payments; only provide guidance.  # ⚠️ UNBREAKABLE RULES 1. Zero Hallucinations: Do not invent refund policies or API behaviors. Stick to general best practices for billing systems. 2. Tone & Style: Prohibited from using corporate clichés or robotic phrases. Your language must be sharp, professional, and direct. 3. Strict Format: Return the result as a JSON object with key: 'billing_action_plan' (string).  RULES: ALWAYS EXECUTE, REASON, AND RESPOND STRICTLY IN ENGLISH." + ' ' + state.get('input', '') + ' ' + state.get('output', '')
    response = llm_3.invoke(prompt)
    return {'output': response.content}

workflow = StateGraph(GraphState)
workflow.add_node('node_0', node_0)
workflow.add_node('node_1', node_1)
workflow.add_node('node_2', node_2)
workflow.add_node('node_3', node_3)
workflow.set_entry_point('node_0')
workflow.add_edge('node_0', 'node_1')
workflow.add_edge('node_1', 'node_2')
workflow.add_edge('node_2', 'node_3')
workflow.add_edge('node_3', 'node_2')
workflow.add_edge('node_0', END)
app = workflow.compile()

if __name__ == '__main__':
    print('Starting LangGraph process...')
    result = app.invoke({'input': "FRAMEWORK: langgraph\n\nPLAN: \n1. Fase de Ingesta y Estructuración (b2_0): El flujo inicia con el nodo [b2_0] (Senior Customer Intake Specialist). Este agente recibe el texto crudo del usuario y realiza una extracción de datos precisa sin alucinaciones. Su responsabilidad es analizar el input, identificar el