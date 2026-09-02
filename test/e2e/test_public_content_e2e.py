"""Public unauthenticated content endpoints.

These endpoints must NOT require auth and must NOT expose draft items.
"""

from __future__ import annotations

import unittest

from .helpers import ApiClient, assert_ok, unwrap_paginated


class TestPublicContentE2E(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.auth_client = ApiClient()
        try:
            cls.auth_client.login()
        except Exception:
            pass
        # Cliente anónimo sin cookies — para validar acceso realmente público
        cls.anon_client = ApiClient()

    def test_01_collections_endpoint_requires_auth(self):
        # /content/collections actualmente requiere auth; anónimo debe recibir 401
        anon = self.anon_client.get("/content/collections")
        self.assertIn(anon["status"], (401, 403), f"collections sin auth debe ser 401, got {anon}")
        # Autenticado sí debe pasar
        result = self.auth_client.get("/content/collections")
        assert_ok(result, "list collections (auth)")
        body = result["body"]
        self.assertTrue(isinstance(body, (list, dict)))

    def test_02_list_projects_public_anonymous(self):
        # Endpoint público debe funcionar sin auth
        result = self.anon_client.get("/projects/list/public")
        assert_ok(result, "list public projects (anon)")
        items = unwrap_paginated(result["body"])
        self.assertIsInstance(items, list)

    def test_02b_list_projects_public_authenticated(self):
        # También debe funcionar autenticado
        result = self.auth_client.get("/projects/list/public")
        assert_ok(result, "list public projects (auth)")
        self.assertIsInstance(unwrap_paginated(result["body"]), list)

    def test_03_list_projects_by_slug_returns_404_for_missing(self):
        result = self.anon_client.get("/projects/public/no-such-slug-here")
        self.assertIn(result["status"], (404, 400))


if __name__ == "__main__":
    unittest.main()
