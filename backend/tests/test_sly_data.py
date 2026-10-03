import sys
import os

# Add parent dir to path to allow importing backend
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend.security.sly_data_masking import mask_sensitive_data, unmask_sensitive_data

def test_mask_and_unmask_ip():
    original_text = "Server connection from 192.168.1.100 established."
    masked, mapping = mask_sensitive_data(original_text)
    
    assert "192.168.1.100" not in masked
    assert "[MASKED_IP_" in masked
    assert len(mapping) == 1
    
    unmasked = unmask_sensitive_data(masked, mapping)
    assert unmasked == original_text

def test_mask_and_unmask_api_key():
    original_text = "Here is my api_key: 'AIzaSyAXXXXXXX_YYYYYYYY_ZZZZZZZZ'"
    masked, mapping = mask_sensitive_data(original_text)
    
    assert "AIzaSyAXXXXXXX_YYYYYYYY_ZZZZZZZZ" not in masked
    assert "Here is my api_key: '" in masked
    assert "[MASKED_API_KEY_" in masked
    
    unmasked = unmask_sensitive_data(masked, mapping)
    assert unmasked == original_text

def test_mask_and_unmask_password():
    original_text = "db_password=SuperSecretPassword123!"
    masked, mapping = mask_sensitive_data(original_text)
    
    assert "SuperSecretPassword123!" not in masked
    assert "db_password=" in masked
    assert "[MASKED_PASSWORD_" in masked
    
    unmasked = unmask_sensitive_data(masked, mapping)
    assert unmasked == original_text

def test_multiple_maskings():
    original_text = "User from 10.0.0.1 used password=hunter2 and API_KEY: 1234567890abcdefGHIJKL"
    masked, mapping = mask_sensitive_data(original_text)
    
    assert "10.0.0.1" not in masked
    assert "hunter2" not in masked
    assert "1234567890abcdefGHIJKL" not in masked
    
    assert len(mapping) == 3
    
    unmasked = unmask_sensitive_data(masked, mapping)
    assert unmasked == original_text
