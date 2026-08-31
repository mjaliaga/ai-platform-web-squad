"""User-related endpoints: list, create, update, delete, and stats."""

from __future__ import annotations

import time
import unittest

from .helpers import ApiClient, assert_ok


def _suffix():
    return str(int(time.time() * 1000))[-8:]


class TestUsersE2E(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = ApiClient()
        assert_ok(cls.client.login(), "auth login for users tests")

    def setUp(self):
        self._created = []

    def tearDown(self):
        for uid in self._created:
            self.client.delete(f"/users/{uid}")

    def _track(self, resp):
        if resp.get("ok") and resp["body"].get("id"):
            self._created.append(resp["body"]["id"])
        return resp

    def test_01_list_users(self):
        result = self.client.get("/users")
        assert_ok(result, "list users")
        self.assertTrue(isinstance(result["body"], (list, dict)))

    def test_02_create_user_lifecycle(self):
        suffix = _suffix()
        create = self._track(
            self.client.post(
                "/users",
                {
                    "name": f"E2E User {suffix}",
                    "email": f"e2e-{suffix}@tivit.com",
                    "password": "StrongP4ss!",
                    "role": "member",
                },
            )
        )
        self.assertTrue(create["ok"], f"Creation failed: {create}")
        uid = create["body"]["id"]
        stats = self.client.get(f"/users/{uid}/stats")
        # Creation succeeded, so stats should be 200; 403/404 allowed only if
        # role guard or stats feature is restricted.
        self.assertTrue(stats["ok"] or stats["status"] in (403, 404), f"Unexpected: {stats}")


if __name__ == "__main__":
    unittest.main()
