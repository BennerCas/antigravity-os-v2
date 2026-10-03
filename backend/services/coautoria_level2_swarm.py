"""
CoautorIA Level 2: Tactical Swarms
Manages a swarm of agents (4-15) using a SupervisorRouter for task delegation
and a Blackboard for shared state and consensus.
"""

from typing import List, Dict, Any, Optional
from backend.services.supervisor_router import SupervisorRouter, AgentCard
from backend.services.blackboard_manager import blackboard

class SwarmOrchestrator:
    """
    Manages a Tactical Swarm (Level 2 of CoautorIA).
    Enforces a minimum of 4 and maximum of 15 agents.
    Delegates tasks using SupervisorRouter and shares state via the blackboard.
    """
    def __init__(self, agents: Optional[List[AgentCard]] = None, use_llm_router: bool = False):
        self.router = SupervisorRouter(use_llm=use_llm_router)
        self.agents: List[AgentCard] = []
        
        if agents:
            for agent in agents:
                self.add_agent(agent)

    def add_agent(self, agent: AgentCard) -> None:
        """Adds an agent to the swarm, enforcing the max limit of 15."""
        if len(self.agents) >= 15:
            raise ValueError("Swarm cannot exceed 15 agents.")
        self.agents.append(agent)

    def execute_swarm(self, tasks: List[str]) -> Dict[str, Any]:
        """
        Executes a sequence of tasks by delegating them to the swarm.
        Requires at least 4 agents to operate.
        Returns the final consensus and results from the blackboard.
        """
        if len(self.agents) < 4:
            raise ValueError(f"Swarm requires a minimum of 4 agents. Currently has {len(self.agents)}.")

        # Initialize the blackboard state for this run
        blackboard.set("swarm_status", "running")
        blackboard.set("completed_tasks", [])

        for i, task_description in enumerate(tasks):
            # 1. Route task to the most appropriate agent in the swarm
            selected_agent = self.router.route_task(task_description, self.agents)
            
            if not selected_agent:
                continue
                
            # 2. Agent processes the task (simulated execution for structural implementation)
            result_entry = {
                "task_id": i,
                "task": task_description,
                "assigned_agent_id": selected_agent.id,
                "assigned_agent_name": selected_agent.name,
                "status": "completed"
            }
            
            # 3. Agent updates the shared blackboard with its results, sharing consensus
            completed = blackboard.get("completed_tasks", [])
            completed.append(result_entry)
            blackboard.set("completed_tasks", completed)
            
            # Update specific consensus state on the blackboard
            blackboard.set(f"task_{i}_consensus", f"Task validated and approved by {selected_agent.name}")

        blackboard.set("swarm_status", "completed")
        
        return {
            "status": blackboard.get("swarm_status"),
            "completed_tasks": blackboard.get("completed_tasks"),
            "full_blackboard_state": blackboard.get_all()
        }
