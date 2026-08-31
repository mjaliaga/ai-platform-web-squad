"""CMS Casos de éxito E2E."""

from __future__ import annotations

import time
import unittest

from .helpers import ApiClient, assert_ok


def _suffix():
    return str(int(time.time() * 1000))[-8:]


class TestCmsCasosExitoE2E(unittest.TestCase):
    collection = "casos-de-exito"

    @classmethod
    def setUpClass(cls):
        cls.client = ApiClient()
        assert_ok(cls.client.login(), "auth login for casos-de-exito tests")

    def setUp(self):
        self.suffix = _suffix()

    def test_01_create_and_publish_case(self):
        slug = f"caso-e2e-{self.suffix}"
        payload = {
            "slug": slug,
            "data": {
                "slug": slug,
                # Campos requeridos según backend-rust/src/content/schemas.rs:277-382
                "nombreComercial": f"Caso de éxito {self.suffix}",
                "descripcion": f"Descripción E2E para {self.suffix} — caso de éxito de prueba automatizada.",
                "industria": "Minería",
                "estado": "Implementado en Producción",
                "cliente": "Cliente Demo",
            },
            "published": True,
        }
        create = self.client.post(f"/content/{self.collection}", payload)
        assert_ok(create, "create caso de éxito")
        try:
            publish = self.client.post(
                f"/content/{self.collection}/{slug}/publish", {"published": True}
            )
            assert_ok(publish, "publish caso de éxito")
        finally:
            self.client.delete(f"/content/{self.collection}/{slug}")


if __name__ == "__main__":
    unittest.main()
