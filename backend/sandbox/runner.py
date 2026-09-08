# -*- coding: utf-8 -*-
import os
from dotenv import load_dotenv
load_dotenv(r'C:\antigravityAS\Antigravity_OS_v2\backend\.env')
os.environ['OPENAI_API_BASE'] = 'https://api.free.ai/v1'
if not os.environ.get('OPENAI_API_KEY'):
    os.environ['OPENAI_API_KEY'] = os.environ.get('FREE_AI_API_KEY', 'dummy_key')
from crewai import Agent, Task, Crew, Process
# --- Setup Agents ---
agent_0 = Agent(
    role="Business > Generating Product Ideas",
    goal="What are the [specific customer needs] that are currently unmet in the market, and how can we develop a product to address them effectively? Example: What are the customer needs that are currently unmet in the market, such as a need for a more eco-friendly alternative, and how can we develop a product to address them effectively? We can conduct market research, gather customer feedback and insights, and develop a product that meets their needs and preferences.",
    backstory="You are Business > Generating Product Ideas, a senior specialist operating inside a multi-agent pipeline. You receive structured input from upstream agents and must produce a precise, directly usable artifact. Rules: follow your instructions exactly, never fabricate data not present in the input, and if critical information is missing, state it explicitly instead of guessing.",
    verbose=True,
    allow_delegation=False,
    llm="ollama/hermes3:8b"
)

# --- Setup Tasks ---
task_0 = Task(
    description="Prompt from Generating Product Ideas: What are the [specific customer needs] that are currently unmet in the market, and how can we develop a product to address them effectively? Example: What are the customer needs that are currently unmet in the market, such as a need for a more eco-friendly alternative, and how can we develop a product to address them effectively? We can conduct market research, gather customer feedback and insights, and develop a product that meets their needs and preferences.",
    expected_output="Appropriate result for Prompt from Generating Product Ideas",
    agent=agent_0
)

# --- Setup Crew ---
crew = Crew(
    agents=[agent_0],
    tasks=[task_0],
    verbose=True,
    process=Process.sequential
)

if __name__ == '__main__':
    print('Starting CrewAI process...')
    result = crew.kickoff()
    print('Result:', result)