import os
from typing import Optional
from dotenv import load_dotenv
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Vault:
    """
    The Vault: Secure Environment and Secret Management.
    Ensures that secrets are loaded securely and never logged or exposed.
    """
    _initialized = False

    @classmethod
    def initialize(cls, env_path: str = '.env') -> None:
        """
        Initialize The Vault by loading environment variables.
        """
        if not cls._initialized:
            if os.path.exists(env_path):
                load_dotenv(dotenv_path=env_path)
                logger.info("The Vault: Environment loaded successfully.")
            else:
                logger.warning(f"The Vault: '{env_path}' not found. Relying on system environment variables.")
            cls._initialized = True

    @classmethod
    def get_secret(cls, key: str, default: Optional[str] = None) -> Optional[str]:
        """
        Retrieve a secret from the vault safely.
        Logs the access without exposing the value.
        """
        if not cls._initialized:
            cls.initialize()
            
        value = os.getenv(key, default)
        if value:
            logger.debug(f"The Vault: Accessed secret '{key}'.")
        else:
            logger.warning(f"The Vault: Secret '{key}' requested but not found.")
        return value

    @classmethod
    def assert_secret(cls, key: str) -> str:
        """
        Retrieve a secret and raise an error if it's missing.
        """
        value = cls.get_secret(key)
        if not value:
            raise ValueError(f"CRITICAL: Required secret '{key}' is missing from The Vault.")
        return value
