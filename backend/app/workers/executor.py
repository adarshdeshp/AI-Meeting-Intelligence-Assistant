"""
Shared executor access for background workers.
Initialized in main.py startup.
"""
from concurrent.futures import ThreadPoolExecutor
from typing import Optional

_executor: Optional[ThreadPoolExecutor] = None


def set_executor(executor: ThreadPoolExecutor):
    """Set the shared executor (called from main.py startup)."""
    global _executor
    _executor = executor


def get_executor() -> ThreadPoolExecutor:
    """Get the shared executor."""
    if _executor is None:
        raise RuntimeError("Executor not initialized. Ensure app startup completed.")
    return _executor
