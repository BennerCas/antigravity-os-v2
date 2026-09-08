from typing import Dict, Any, List, Optional
from pydantic import BaseModel

class CapabilityVersion(BaseModel):
    version: str
    input_schema_ref: str
    output_schema_ref: str
    auth_mode: str
    required_scopes: List[str]
    risk_level: str
    side_effect: bool
    network_policy: Dict[str, Any]
    timeouts: Dict[str, int]
    retryable_errors: List[str]

class Capability(BaseModel):
    id: str
    display_name: str
    versions: List[CapabilityVersion]

class ModelProfile(BaseModel):
    id: str
    display_name: str
    allowed_providers: List[str]
    output_mode: str
    max_cost_per_1k: float
    max_latency_ms: int
    data_classification_allowed: List[str]

class CapabilityRegistry:
    """
    Mock/In-memory Registry for capabilities and model profiles.
    """
    def __init__(self):
        self.capabilities: Dict[str, Capability] = {
            "ai.document_extraction": Capability(
                id="ai.document_extraction",
                display_name="Document Extraction AI",
                versions=[
                    CapabilityVersion(
                        version="1.0.0",
                        input_schema_ref="Document/v1",
                        output_schema_ref="ExtractionResult/v1",
                        auth_mode="none",
                        required_scopes=[],
                        risk_level="medium",
                        side_effect=False,
                        network_policy={"allowed_domains": ["api.openai.com"]},
                        timeouts={"default_ms": 30000, "max_ms": 60000},
                        retryable_errors=["timeout", "429", "503"]
                    )
                ]
            ),
            "storage.invoice.write": Capability(
                id="storage.invoice.write",
                display_name="Save Invoice",
                versions=[
                    CapabilityVersion(
                        version="1.2.0",
                        input_schema_ref="Invoice/v1",
                        output_schema_ref="StorageReceipt/v1",
                        auth_mode="oauth_reference",
                        required_scopes=["invoices.write"],
                        risk_level="high",
                        side_effect=True,
                        network_policy={"allowed_domains": ["api.example.com"]},
                        timeouts={"default_ms": 15000, "max_ms": 60000},
                        retryable_errors=["timeout", "429", "503"]
                    )
                ]
            )
        }
        
        self.model_profiles: Dict[str, ModelProfile] = {
            "structured_private": ModelProfile(
                id="structured_private",
                display_name="Structured Private",
                allowed_providers=["azure-openai", "anthropic"],
                output_mode="json_schema",
                max_cost_per_1k=0.01,
                max_latency_ms=10000,
                data_classification_allowed=["internal", "confidential"]
            ),
            "fast_reasoning": ModelProfile(
                id="fast_reasoning",
                display_name="Fast Reasoning",
                allowed_providers=["openai", "groq"],
                output_mode="text",
                max_cost_per_1k=0.001,
                max_latency_ms=2000,
                data_classification_allowed=["public", "internal"]
            )
        }
        
    def get_capability(self, capability_id: str) -> Optional[Capability]:
        return self.capabilities.get(capability_id)
        
    def get_model_profile(self, profile_id: str) -> Optional[ModelProfile]:
        return self.model_profiles.get(profile_id)
