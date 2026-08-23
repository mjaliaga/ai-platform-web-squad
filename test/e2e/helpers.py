import json
import os
import urllib.error
import urllib.parse
import urllib.request
import http.cookiejar

DEFAULT_BASE_URL = os.environ.get("TEST_API_URL", "http://localhost:8080/api")
DEFAULT_ADMIN_EMAIL = os.environ.get("TEST_ADMIN_EMAIL", "manuel.aliaga@tivit.com")
DEFAULT_ADMIN_PASSWORD = os.environ.get("TEST_ADMIN_PASSWORD", "tivit2026")


class ApiClient:
    """Cliente HTTP con soporte automático de cookies, token CSRF y manejo de JSON."""

    def __init__(self, base_url=DEFAULT_BASE_URL):
        self.base_url = base_url.rstrip("/")
        self.cookie_jar = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(
            urllib.request.HTTPCookieProcessor(self.cookie_jar)
        )
        self.csrf_token = None

    def _extract_csrf_from_cookies(self):
        for cookie in self.cookie_jar:
            if cookie.name == "csrf_token":
                self.csrf_token = cookie.value
                return self.csrf_token
        return None

    def request(self, method, endpoint, body=None, headers=None):
        url = f"{self.base_url}{endpoint}" if endpoint.startswith("/") else f"{self.base_url}/{endpoint}"
        req_headers = {"Content-Type": "application/json"}
        if headers:
            req_headers.update(headers)

        # Inyectar CSRF para métodos que mutan estado
        if method.upper() in ["POST", "PUT", "PATCH", "DELETE"]:
            token = self._extract_csrf_from_cookies() or self.csrf_token
            if token:
                req_headers["X-CSRF-Token"] = token

        data = json.dumps(body).encode("utf-8") if body is not None and not isinstance(body, (bytes, bytearray)) else body

        req = urllib.request.Request(url, data=data, headers=req_headers, method=method.upper())

        try:
            with self.opener.open(req, timeout=10) as resp:
                status = resp.status
                resp_headers = dict(resp.headers)
                resp_body = resp.read().decode("utf-8")
                self._extract_csrf_from_cookies()
                try:
                    data = json.loads(resp_body) if resp_body else None
                except Exception:
                    data = resp_body
                return status, data, resp_headers
        except urllib.error.HTTPError as e:
            status = e.code
            resp_headers = dict(e.headers)
            err_body = e.read().decode("utf-8")
            self._extract_csrf_from_cookies()
            try:
                data = json.loads(err_body) if err_body else None
            except Exception:
                data = err_body
            return status, data, resp_headers

    def login(self, email=DEFAULT_ADMIN_EMAIL, password=DEFAULT_ADMIN_PASSWORD):
        status, data, _ = self.request("POST", "/auth/login", {"email": email, "password": password})
        if status == 200:
            self._extract_csrf_from_cookies()
        return status, data

    def logout(self):
        status, data, headers = self.request("POST", "/auth/logout")
        self.cookie_jar.clear()
        self.csrf_token = None
        return status, data, headers

    def me(self):
        return self.request("GET", "/auth/me")


def get_authenticated_client(email=DEFAULT_ADMIN_EMAIL, password=DEFAULT_ADMIN_PASSWORD):
    client = ApiClient()
    status, data = client.login(email, password)
    if status != 200:
        raise RuntimeError(f"Fallo al autenticar cliente de prueba: status={status}, resp={data}")
    return client
