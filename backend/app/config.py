"""
Application configuration using Pydantic Settings.
Reads from environment variables with sensible defaults.
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # CORS
    cors_origins: str = "http://localhost:3000,http://localhost:5173"

    # Environment
    environment: str = "development"

    # Job configuration
    job_timeout: int = 120  # seconds
    max_concurrency: int = 2
    max_queue_size: int = 50

    # Optimization defaults
    default_population_size: int = 100
    default_max_generations: int = 400
    default_num_seeds: int = 6

    # Export
    max_export_resolution: int = 1920
    max_gif_frames: int = 360

    @property
    def cors_origin_list(self) -> List[str]:
        """Parse comma-separated CORS origins into a list."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def is_development(self) -> bool:
        return self.environment == "development"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Singleton settings instance
settings = Settings()
