"""
FediChess Python SDK.
Talks to the FediChess Node bridge over stdio (JSON lines).
"""

from .client import FediChessClient

__all__ = ["FediChessClient"]
