"""
HTTP client with cookie jar, CSRF injection, and auth helpers.

Used by the E2E test suite in this directory. The client transparently
follows the CSRF cookie/header pattern required by the Axum backend:

    1. The backend sets a `csrf_token` cookie on the first GET /api/auth/me.
    2. Mutating requests must echo it back via the `X-CSRF-Token` header.
    3. The cookie is `httpOnly=False` (so it can be read by the browser
       frontend) but `SameSite=Lax`.
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.parse
import urllib.request
from http.cookiejar import CookieJar
from typing import Any, Dict, Optional


DEFAULT_BASE_URL = os.environ.get(
    "TEST_API_URL",
    f"http://localhost:{os.environ.get('PORT', '8080')}/api",
)
# Prefer TEST_ADMIN_* but fallback to SEED_* so `cp .env.example .env && docker compose up` works without extra env
DEFAULT_ADMIN_EMAIL = (
    os.environ.get("TEST_ADMIN_EMAIL")
    or os.environ.get("SEED_ADMIN_EMAIL")
    or "admin@tivit.com"
)
DEFAULT_ADMIN_PASSWORD = (
    os.environ.get("TEST_ADMIN_PASSWORD")
    or os.environ.get("SEED_ADMIN_PASSWORD")
    or "TiviT-Portal-2026!"
)


class ApiClient:
    """Minimal API client for the E2E suite.

    The cookie jar is shared across requests, which lets the CSRF token
    set by the backend ride along without manual plumbing.
    """

    def __init__(self, base_url: str = DEFAULT_BASE_URL):
        self.base_url = base_url.rstrip("/")
        self.cookie_jar = CookieJar()
        self.opener = urllib.request.build_opener(
            urllib.request.HTTPCookieProcessor(self.cookie_jar)
        )

    # ------------------------------------------------------------------
    # Low-level HTTP
    # ------------------------------------------------------------------

    def _csrf_header_value(self) -> Optional[str]:
        for cookie in self.cookie_jar:
            if cookie.name == "csrf_token":
                return cookie.value
        return None

    def request(
        self,
        path: str,
        method: str = "GET",
        body: Optional[Any] = None,
        headers: Optional[Dict[str, str]] = None,
        expect_json: bool = True,
    ):
        url = f"{self.base_url}{path}" if path.startswith("/") else f"{self.base_url}/{path}"
        data = None
        req_headers = dict(headers or {})

        if body is not None:
            if isinstance(body, (dict, list)):
                data = json.dumps(body).encode("utf-8")
                req_headers.setdefault("Content-Type", "application/json")
            else:
                data = body

        # Inject CSRF on mutating verbs.
        if method.upper() in {"POST", "PATCH", "PUT", "DELETE"}:
            csrf = self._csrf_header_value()
            if csrf:
                req_headers.setdefault("X-CSRF-Token", csrf)

        req = urllib.request.Request(url, data=data, headers=req_headers, method=method.upper())

        status: int | None = None
        resp_headers: dict | None = None
        try:
            with self.opener.open(req) as resp:
                raw = resp.read()
                status = resp.status
                resp_headers = dict(resp.headers)
        except urllib.error.HTTPError as e:
            raw = e.read()
            try:
                parsed = json.loads(raw.decode("utf-8")) if raw else {"error": str(e)}
            except Exception:
                parsed = {"error": raw.decode("utf-8", errors="replace") or str(e)}
            return {
                "status": e.code,
                "body": parsed,
                "ok": False,
                "headers": dict(e.headers) if e.headers else None,
            }

        if not raw:
            return {"status": 204, "body": None, "ok": True, "headers": resp_headers}

        try:
            parsed = json.loads(raw.decode("utf-8"))
        except Exception:
            parsed = raw.decode("utf-8", errors="replace")

        # Preserve real HTTP status; ok is 2xx. Headers exposed optionally.
        assert status is not None  # set inside with block on success
        return {"status": status, "body": parsed, "ok": 200 <= status < 300, "headers": resp_headers}

    # Convenience helpers ------------------------------------------------

    def get(self, path: str, **kwargs):
        return self.request(path, method="GET", **kwargs)

    def post(self, path: str, body=None, **kwargs):
        return self.request(path, method="POST", body=body, **kwargs)

    def patch(self, path: str, body=None, **kwargs):
        return self.request(path, method="PATCH", body=body, **kwargs)

    def delete(self, path: str, **kwargs):
        return self.request(path, method="DELETE", **kwargs)

    # Auth helpers -------------------------------------------------------

    def login(self, email: str = DEFAULT_ADMIN_EMAIL, password: str = DEFAULT_ADMIN_PASSWORD) -> Dict:
        # First, hit /auth/me to ensure the CSRF cookie is set.
        self.get("/auth/me")
        return self.post("/auth/login", {"email": email, "password": password})

    def logout(self):
        return self.post("/auth/logout")

    def me(self):
        return self.get("/auth/me")


def unwrap_paginated(payload):
    """Mirror of the frontend `unwrapPaginated` helper."""
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        if isinstance(payload.get("items"), list):
            return payload["items"]
        # Payload is an error envelope (e.g. {"error": "..."}) without pagination keys.
        # Return [] for backwards-compat but don't hide the error: caller already has
        # response["ok"] == False / status 4xx, so it can branch on that.
        if "error" in payload and "items" not in payload and "total" not in payload:
            return []
    return []


def assert_ok(response, msg: str = ""):
    """Convenience assertion that fails the test with context if status != 2xx."""
    if not response.get("ok"):
        detail = response.get("body") or {}
        raise AssertionError(
            f"{msg} — status={response.get('status')} body={json.dumps(detail)[:500]}"
        )
    return response
