"""OrynexOpsera backend configuration.

All configuration comes from environment variables (see .env.example).
No secrets are hardcoded anywhere in this codebase.
"""

from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "OrynexOpsera API"
    app_version: str = "0.1.0-phase1"
    environment: str = "development"  # OPSERA_ENV
    api_prefix: str = "/api/v1"  # OPSERA_API_PREFIX

    # Supabase — when URL + service role key are present the API uses the
    # Supabase-backed repository; otherwise it falls back to the in-memory
    # development repository (empty at boot, clearly logged).
    supabase_url: str = ""  # SUPABASE_URL
    supabase_anon_key: str = ""  # SUPABASE_ANON_KEY
    supabase_service_role_key: str = ""  # SUPABASE_SERVICE_ROLE_KEY
    database_url: str = ""  # DATABASE_URL
    supabase_schema: str = "opsera"  # OPSERA_SUPABASE_SCHEMA

    # ORYNEX CORE (Phase 6). Empty => core_sdk reports not_configured.
    orynex_core_base_url: str = ""  # ORYNEX_CORE_BASE_URL
    orynex_core_api_key: str = ""  # ORYNEX_CORE_API_KEY

    @property
    def supabase_configured(self) -> bool:
        return bool(self.supabase_url and self.supabase_service_role_key)


settings = Settings()
