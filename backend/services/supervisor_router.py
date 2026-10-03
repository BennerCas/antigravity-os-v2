from typing import List, Optional
from pydantic import BaseModel

class AgentCard(BaseModel):
    """Represents an available agent in the system."""
    id: str
    name: str
    description: str
    capabilities: List[str]

class SupervisorRouter:
    """
    Supervisor Router handles the dynamic routing of tasks to the appropriate
    agent based on their capabilities and the task description.
    """
    def __init__(self, use_llm: bool = False):
        self.use_llm = use_llm

    def route_task(self, task_description: str, agents: List[AgentCard]) -> Optional[AgentCard]:
        """
        Routes a task to the most appropriate agent.
        
        Args:
            task_description: A description of the task to be performed.
            agents: A list of available AgentCard instances.
            
        Returns:
            The selected AgentCard, or None if no agents are available.
        """
        if not agents:
            return None
            
        if self.use_llm:
            # TODO: Implement actual LLM routing logic here
            # e.g., prompt LLM with task_description and [agent.description for agent in agents]
            pass
            
        # Mock heuristic: Check if any agent capability is mentioned in the task description
        task_desc_lower = task_description.lower()
        
        for agent in agents:
            for cap in agent.capabilities:
                if cap.lower() in task_desc_lower:
                    return agent
        
        # Default to the first agent if no specific match is found
        return agents[0]
