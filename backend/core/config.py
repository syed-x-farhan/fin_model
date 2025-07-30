"""
Configuration settings for the Financial Modeling API
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings"""
    
    # API Settings
    api_v1_prefix: str = "/api/v1"
    project_name: str = "Financial Modeling API"
    version: str = "1.0.0"
    
    # CORS Settings
    allowed_origins: List[str] = [
        "http://localhost:8080",
        "http://localhost:3000",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:3000"
    ]
    
    # Server Settings
    host: str = "0.0.0.0"
    port: int = 8000
    reload: bool = True
    
    # Financial Model Settings
    default_tax_rate: float = 0.25  # 25%
    default_interest_rate: float = 0.06  # 6%
    forecast_years: int = 5
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings() 