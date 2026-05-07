from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "Travel Tracker API"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    geoapify_api_key: str = ""
    cache_ttl_minutes: int = 10
    database_url: str = "sqlite+aiosqlite:///./travel.db"

    class Config:
        env_file = ".env"

settings = Settings()