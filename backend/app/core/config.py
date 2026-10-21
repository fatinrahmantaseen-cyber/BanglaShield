"""Core configuration and security constants for BanglaShield API."""

from typing import List, Set

class Settings:
    PROJECT_NAME: str = "BanglaShield Cybersecurity API"
    VERSION: str = "0.1.0"
    API_V1_PREFIX: str = "/api/v1"
    
    # Input security constraints
    MAX_URL_LENGTH: int = 2048
    ALLOWED_SCHEMES: Set[str] = {"http", "https"}
    
    # Frontend CORS origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

settings = Settings()

