import unittest
from test.e2e.helpers import ApiClient, DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD


class TestAuthE2E(unittest.TestCase):
    def setUp(self):
        self.client = ApiClient()

    def test_login_success(self):
        status, data = self.client.login(DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD)
        self.assertEqual(status, 200, f"Error en login: {data}")
        self.assertIn("user", data)
        self.assertEqual(data["user"]["email"], DEFAULT_ADMIN_EMAIL)
        self.assertIsNotNone(self.client.csrf_token, "La cookie csrf_token debe ser legible por el cliente")

    def test_login_invalid_password(self):
        status, data = self.client.login(DEFAULT_ADMIN_EMAIL, "wrongpassword999")
        self.assertEqual(status, 401)
        self.assertIn("error", data)

    def test_me_returns_profile_and_refreshes_csrf(self):
        # 1. Login
        self.client.login()
        # 2. Call /auth/me
        status, data, _ = self.client.me()
        self.assertEqual(status, 200)
        self.assertEqual(data["email"], DEFAULT_ADMIN_EMAIL)
        self.assertIn("role", data)
        self.assertIsNotNone(self.client.csrf_token, "Debe disponer de CSRF token tras consultar /auth/me")

    def test_logout_clears_session(self):
        self.client.login()
        status, _, _ = self.client.logout()
        self.assertEqual(status, 200)
        # Intentar llamar a /auth/me sin sesión
        status, _, _ = self.client.me()
        self.assertEqual(status, 401)


if __name__ == "__main__":
    unittest.main()
