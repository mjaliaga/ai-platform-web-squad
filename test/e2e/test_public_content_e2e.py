import unittest
from test.e2e.helpers import ApiClient


class TestPublicContentE2E(unittest.TestCase):
    def setUp(self):
        self.client = ApiClient()

    def test_public_proyectos_endpoint(self):
        status, data, _ = self.client.request("GET", "/public/content/proyectos?limit=10")
        self.assertEqual(status, 200)
        self.assertIn("items", data)
        self.assertIsInstance(data["items"], list)

    def test_public_casos_exito_endpoint(self):
        status, data, _ = self.client.request("GET", "/public/content/casos-de-exito?limit=10")
        self.assertEqual(status, 200)
        self.assertIn("items", data)

    def test_public_laboratorio_endpoint(self):
        status, data, _ = self.client.request("GET", "/public/content/laboratorio?limit=10")
        self.assertEqual(status, 200)
        self.assertIn("items", data)

    def test_public_poc_endpoint(self):
        status, data, _ = self.client.request("GET", "/public/content/poc?limit=10")
        self.assertEqual(status, 200)
        self.assertIn("items", data)


if __name__ == "__main__":
    unittest.main()
