import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class StandaloneAgent:
    """
    Level 1 of the CoautorIA hierarchy: Atomic Agents.
    
    This agent handles atomic tasks independently. It encapsulates a specific role
    (defined by its AgentCard), processes an input task within a given context, 
    and optionally masks sensitive data before processing using sly_data_masking.
    """

    def __init__(self, agent_card: Any, use_data_masking: bool = True):
        """
        :param agent_card: The AgentCard defining the agent's identity, role, and capabilities.
        :param use_data_masking: Whether to apply sly_data_masking to secure context data.
        """
        self.agent_card = agent_card
        self.use_data_masking = use_data_masking

    def _mask_data(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Isolates and secures the context using sly_data_masking.
        """
        try:
            import sly_data_masking
            logger.info("Applying sly_data_masking to secure the context.")
            return sly_data_masking.mask_context(context)
        except ImportError:
            logger.warning("sly_data_masking module not found. Proceeding with unmasked context.")
            return context
            
    def _unmask_data(self, masked_result: Any) -> Any:
        """
        Reverses the masking process for the final output, if applicable.
        """
        try:
            import sly_data_masking
            return sly_data_masking.unmask_result(masked_result)
        except ImportError:
            return masked_result

    def _simulate_llm_inference(self, task: str, secure_context: Dict[str, Any]) -> str:
        """
        Simulates LLM inference as a placeholder.
        """
        role = getattr(self.agent_card, 'role', 'Generic Agent')
        logger.info(f"[{role}] Processing atomic task: {task}")
        return f"Simulated autonomous completion of task '{task}' by {role}."

    def execute(self, task: str, context: Optional[Dict[str, Any]] = None) -> str:
        """
        Executes the atomic task autonomously.
        
        :param task: The specific atomic task to perform.
        :param context: The context required to perform the task.
        :return: The result of the task execution.
        """
        context = context or {}
        
        # 1. Context Security / Isolation
        secure_context = self._mask_data(context) if self.use_data_masking else context
        
        # 2. Autonomous Action
        try:
            raw_result = self._simulate_llm_inference(task, secure_context)
        except Exception as e:
            logger.error(f"Error during LLM inference: {e}")
            raw_result = f"Error executing task: {str(e)}"
            
        # 3. Post-processing / Unmasking
        final_result = self._unmask_data(raw_result) if self.use_data_masking else raw_result
        
        return final_result
