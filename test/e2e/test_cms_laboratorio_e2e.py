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
                # Requeridos por laboratorio_schema (schemas.rs:387-471)
                "nombreComercial": f"Lab entry {self.suffix}",
                "descripcion": f"Descripción corta E2E laboratorio {self.suffix} — validación automatizada.",
                "estado": "En curso",
                "categoria": "Producto",
            },
            "published": False,
        }
        create = self.client.post(f"/content/{self.collection}", payload)
        assert_ok(create, "create lab entry")
        try:
            update = self.client.patch(
                f"/content/{self.collection}/{slug}",
                {
                    "data": {**payload["data"], "descripcion": "Descripción actualizada E2E."},
                    "published": True,
                },
            )
            assert_ok(update, "update lab entry")
        finally:
            self.client.delete(f"/content/{self.collection}/{slug}")


if __name__ == "__main__":
    unittest.main()
