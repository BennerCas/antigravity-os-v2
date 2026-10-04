import sys
from unittest.mock import MagicMock

# Fix for missing 'google.antigravity' proprietary module in test runner environments
if 'google.antigravity' not in sys.modules:
    sys.modules['google.antigravity'] = MagicMock()
