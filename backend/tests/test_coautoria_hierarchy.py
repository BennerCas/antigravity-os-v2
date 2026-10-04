import os
import sys

# Add the project root to sys.path so we can import 'backend'
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))

from backend.services.coautoria_level1_agent import StandaloneAgent
from backend.services.coautoria_level2_swarm import SwarmOrchestrator
from backend.services.coautoria_level3_hive import HiveManager


class MockAgentCard:
    def __init__(self, id, name, role, capabilities=None):
        self.id = id
        self.name = name
        self.role = role
        self.capabilities = capabilities or []


def test_hierarchy():
    print("=== Testing Level 1: Standalone Agent ===")
    card1 = MockAgentCard("agent-1", "Alpha", "Research Agent")
    agent = StandaloneAgent(card1, use_data_masking=False)
    result = agent.execute("Find latest AI trends", context={"topic": "AI"})
    print("Agent Result:", result)

    print("\n=== Testing Level 2: Swarm Orchestrator ===")
    card2 = MockAgentCard("agent-2", "Beta", "Analysis Agent")
    card3 = MockAgentCard("agent-3", "Gamma", "Coding Agent")
    card4 = MockAgentCard("agent-4", "Delta", "Testing Agent")

    try:
        # Swarm needs at least 4 agents
        swarm = SwarmOrchestrator(agents=[card1, card2, card3, card4])
        swarm_result = swarm.execute_swarm(["Task A", "Task B"])
        print("Swarm Result:", swarm_result)
    except Exception as e:
        print("Swarm Error:", e)

    print("\n=== Testing Level 3: Hive Manager ===")
    try:
        hive = HiveManager("Test Global Hive")
        hive.assign_global_objective("Build an AGI")

        # Using the default SwarmOrchestratorMock for testing Hive level
        hive.spawn_swarm("Swarm Research", "Gather all data")
        hive.spawn_swarm("Swarm Engineering", "Build systems")

        hive_result = hive.orchestrate_global_objective()
        print("Hive Result:", hive_result)
    except Exception as e:
        print("Hive Error:", e)


if __name__ == "__main__":
    test_hierarchy()
