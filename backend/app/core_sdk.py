"""ORYNEX CORE SDK client (interface).

ORYNEX CORE is the ecosystem layer that connects OrynexOpsera with
OrynexNeuroclass, OrynexLaunchpad and OrynexAegis (SSO, organization sync,
agent discovery, cross-app events, usage, audit). Cross-application access
goes through CORE APIs/events ONLY — never another app's database.

Phase 1 status: interface + honest ``not_configured`` behaviour. When
ORYNEX_CORE_BASE_URL / ORYNEX_CORE_API_KEY are unset, every operation raises
``CoreNotConfiguredError`` (or returns a not_configured status dict from
``health()``). Nothing here fakes a connection. Real transport lands in
Phase 6.
"""

from __future__ import annotations

from typing import Any

from .config import settings


class CoreNotConfiguredError(RuntimeError):
    """Raised when a CORE operation is attempted without CORE credentials."""

    status = "not_configured"


class OrynexCoreClient:
    def __init__(self, base_url: str | None = None, api_key: str | None = None) -> None:
        self.base_url = (base_url if base_url is not None else settings.orynex_core_base_url).rstrip("/")
        self.api_key = api_key if api_key is not None else settings.orynex_core_api_key

    @property
    def is_configured(self) -> bool:
        return bool(self.base_url and self.api_key)

    def health(self) -> dict[str, Any]:
        if not self.is_configured:
            return {
                "status": "not_configured",
                "detail": "Set ORYNEX_CORE_BASE_URL and ORYNEX_CORE_API_KEY to connect to ORYNEX CORE (Phase 6).",
            }
        return {"status": "configured_unverified", "base_url": self.base_url}

    def _require(self) -> None:
        if not self.is_configured:
            raise CoreNotConfiguredError(
                "ORYNEX CORE is not configured: set ORYNEX_CORE_BASE_URL and ORYNEX_CORE_API_KEY."
            )
        raise NotImplementedError("ORYNEX CORE transport ships in Phase 6; interface defined in Phase 1.")

    # --- Interface (Phase 6 transport) --------------------------------------
    def verify_sso_token(self, token: str) -> dict[str, Any]:
        self._require()
        raise AssertionError("unreachable")

    def get_organization(self, organization_id: str) -> dict[str, Any]:
        self._require()
        raise AssertionError("unreachable")

    def discover_agents(self, query: str | None = None) -> list[dict[str, Any]]:
        """Browse agents published to OrynexAegis via CORE."""
        self._require()
        raise AssertionError("unreachable")

    def deploy_agent(self, agent_id: str, organization_id: str) -> dict[str, Any]:
        self._require()
        raise AssertionError("unreachable")

    def discover_mcp_servers(self) -> list[dict[str, Any]]:
        self._require()
        raise AssertionError("unreachable")

    def publish_event(self, event_type: str, payload: dict[str, Any]) -> dict[str, Any]:
        """Cross-application event communication via CORE."""
        self._require()
        raise AssertionError("unreachable")

    def report_usage(self, organization_id: str, metric: str, quantity: float) -> dict[str, Any]:
        self._require()
        raise AssertionError("unreachable")

    def append_audit(self, entry: dict[str, Any]) -> dict[str, Any]:
        self._require()
        raise AssertionError("unreachable")


core_client = OrynexCoreClient()
