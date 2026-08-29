"""CMS Laboratorio entries E2E."""

from __future__ import annotations

import time
import unittest

from .helpers import ApiClient, assert_ok


def _suffix():
    return str(int(time.time() * 1000))[-8:]


class TestCmsLaboratorioE2E(unittest.TestCase):
    collection = "laboratorio"

    @classmethod
    def setUpClass(cls):
        cls.client = ApiClient()
        assert_ok(cls.client.login(), "auth login for laboratorio tests")

    def setUp(self):
        self.suffix = _suffix()

    def test_01_create_and_update_lab_entry(self):
        slug = f"lab-e2e-{self.suffix}"
        payload = {
            "slug": slug,
            "data": {
                "slug": slug,
                "titulo": f"Lab entry {self.suffix}",
                "autor": "QA Bot",
                "resumen": "Resumen de prueba E2E.",
                "estado": "En curso",
            },
            "published": False,
        }
        create = self.client.post(f"/content/{self.collection}", payload)
        assert_ok(create, "create lab entry")
        try:
            update = self.client.patch(
                f"/content/{self.collection}/{slug}",
                {
                    "data": {**payload["data"], "resumen": "Actualizado E2E."},
                    "published": True,
                },
            )
            assert_ok(update, "update lab entry")
        finally:
            self.client.delete(f"/content/{self.collection}/{slug}")


if __name__ == "__main__":
    unittest.main()
