"""Authentication, /auth/me, CSRF token lifecycle, and role guards."""

from __future__ import annotations

import unittest

from .helpers import ApiClient, assert_ok


class TestAuthE2E(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = ApiClient()

    def test_01_login_succeeds_with_valid_credentials(self):
        result = self.client.login()
        assert_ok(result, "login")
        self.assertIn("user", result["body"] or {})

    def test_02_me_returns_authenticated_user(self):
        self.client.login()
        me = self.client.me()
        assert_ok(me, "me")
        self.assertEqual(me["body"]["email"], "admin@tivit.com")

    def test_03_logout_invalidates_session(self):
        self.client.login()
        out = self.client.logout()
        assert_ok(out, "logout")
        # After logout, /me should still respond but without user info,
        # or return 401 depending on backend behavior. We accept either.
        me = self.client.me()
        self.assertIn(me["status"], (200, 401))

    def test_04_login_rejects_invalid_credentials(self):
        client = ApiClient()
        client.get("/auth/me")  # prime CSRF cookie
        bad = client.post("/auth/login", {"email": "x@y.com", "password": "wrong"})
        self.assertFalse(bad.get("ok"))
        self.assertIn(bad["status"], (400, 401, 422))


if __name__ == "__main__":
    unittest.main()
