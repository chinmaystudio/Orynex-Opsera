"""OrynexOpsera API — Phase 1 foundation.

Run:  uvicorn app.main:app --reload --port 8000
Docs: /docs (OpenAPI), health: /health
"""

from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import build_repository
from .routers import (
    agents,
    approvals,
    audit,
    command,
    customers,
    departments,
    employees,
    integrations,
    leads,
    organizations,
    overview,
    tasks,
)

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("opsera.main")


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description=(
            "AI-native Business Operating System (ORYNEX ecosystem). Phase 1: "
            "organizations, departments, employees, customers, leads, tasks, "
            "AI workforce registry (40 presets), RBAC + risk/approval gating, "
            "executive overview, NL command planner (plan-only), integrations "
            "registry and audit log."
        ),
    )
    app.state.repo = build_repository()
    logger.info("Repository mode: %s", app.state.repo.mode)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health", tags=["system"])
    def health():
        return {
            "status": "ok",
            "service": settings.app_name,
            "version": settings.app_version,
            "environment": settings.environment,
            "repository": app.state.repo.mode,
            "supabase_configured": settings.supabase_configured,
        }

    @app.get("/", tags=["system"])
    def root():
        return {"service": settings.app_name, "docs": "/docs", "health": "/health", "api_prefix": settings.api_prefix}

    prefix = settings.api_prefix
    for module in (
        organizations,
        departments,
        employees,
        customers,
        leads,
        tasks,
        agents,
        approvals,
        overview,
        command,
        integrations,
        audit,
    ):
        app.include_router(module.router, prefix=prefix)

    return app


app = create_app()
