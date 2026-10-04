import re
import uuid

# Simple regex patterns for sensitive data
# Note: These are basic patterns for demonstration.
PATTERNS = {
    "IP_ADDRESS": r"\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b",
    "API_KEY": r'(?i)(?:api[_-]?key|token)[\s:=]+[\'"]?([a-zA-Z0-9\-_]{16,})[\'"]?',
    "PASSWORD": r'(?i)(?:password|pass|pwd)[\s:=]+[\'"]?([^"\'\s]+)[\'"]?',
}


def mask_sensitive_data(text: str) -> tuple[str, dict[str, str]]:
    """
    Masks sensitive data in the given text, replacing it with tokens.
    Returns the masked text and a mapping of tokens to original values.
    """
    masked_text = text
    token_mapping = {}

    # Process IP Addresses
    ip_matches = re.finditer(PATTERNS["IP_ADDRESS"], masked_text)
    for i, match in enumerate(ip_matches, 1):
        original_value = match.group(0)
        token = f"[MASKED_IP_{i}_{uuid.uuid4().hex[:8]}]"
        token_mapping[token] = original_value
        masked_text = masked_text.replace(original_value, token)

    # Process API Keys
    api_matches = re.finditer(PATTERNS["API_KEY"], masked_text)
    for i, match in enumerate(api_matches, 1):
        original_value = match.group(1)  # The actual key part
        token = f"[MASKED_API_KEY_{i}_{uuid.uuid4().hex[:8]}]"
        token_mapping[token] = original_value
        masked_text = masked_text.replace(original_value, token)

    # Process Passwords
    pwd_matches = re.finditer(PATTERNS["PASSWORD"], masked_text)
    for i, match in enumerate(pwd_matches, 1):
        original_value = match.group(1)  # The actual password part
        token = f"[MASKED_PASSWORD_{i}_{uuid.uuid4().hex[:8]}]"
        token_mapping[token] = original_value
        masked_text = masked_text.replace(original_value, token)

    return masked_text, token_mapping


def unmask_sensitive_data(masked_text: str, token_mapping: dict[str, str]) -> str:
    """
    Restores original sensitive data from tokens.
    """
    unmasked_text = masked_text
    for token, original_value in token_mapping.items():
        unmasked_text = unmasked_text.replace(token, original_value)
    return unmasked_text
