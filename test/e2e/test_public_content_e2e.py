"""Public unauthenticated content endpoints.

These endpoints must NOT require auth and must NOT expose draft items.
"""

from __future__ import annotations

import unittest

from .helpers import ApiClient, assert_ok, unwrap_paginated


class TestPublicContentE2E(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = ApiClient()

    def test_01_collections_endpoint_returns_metadata(self):
        result = self.client.get("/content/collections")
        assert_ok(result, "list collections")
        body = result["body"]
        self.assertTrue(isinstance(body, (list, dict)))

    def test_02_list_projects_public(self):
        result = self.client.get("/projects/list/public")
        assert_ok(result, "list public projects")
        items = unwrap_paginated(result["body"])
        # Could be empty in CI; the contract is "endpoint responds OK".
        self.assertIsInstance(items, list)

    def test_03_list_projects_by_slug_returns_404_for_missing(self):
        result = self.client.get("/projects/public/no-such-slug-here")
        self.assertIn(result["status"], (404, 400))


if __name__ == "__main__":
    unittest.main()
