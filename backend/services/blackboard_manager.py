import threading
from typing import Any


class BlackboardManager:
    """
    Thread-safe, in-memory key-value store for agents to share state.
    """

    def __init__(self):
        self._store: dict[str, Any] = {}
        self._lock = threading.Lock()

    def set(self, key: str, value: Any) -> None:
        """Post an update to the blackboard."""
        with self._lock:
            self._store[key] = value

    def get(self, key: str, default: Any = None) -> Any:
        """Read a value from the blackboard."""
        with self._lock:
            return self._store.get(key, default)

    def delete(self, key: str) -> bool:
        """Delete a key from the blackboard. Returns True if key existed."""
        with self._lock:
            if key in self._store:
                del self._store[key]
                return True
            return False

    def get_all(self) -> dict[str, Any]:
        """Get a copy of the entire blackboard state."""
        with self._lock:
            return self._store.copy()

    def clear(self) -> None:
        """Clear all entries in the blackboard."""
        with self._lock:
            self._store.clear()


# Singleton instance
blackboard = BlackboardManager()
