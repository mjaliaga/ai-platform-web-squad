"""CMS Proofs of Concept (PoC) E2E."""

from __future__ import annotations

import time
import unittest

from .helpers import ApiClient, assert_ok


def _suffix():
    return str(int(time.time() * 1000))[-8:]


class TestCmsPocE2E(unittest.TestCase):
    collection = "poc"

    @classmethod
    def setUpClass(cls):
        cls.client = ApiClient()
        assert_ok(cls.client.login(), "auth login for poc tests")

    def setUp(self):
        self.suffix = _suffix()

    def test_01_create_and_update_poc(self):
        slug = f"poc-e2e-{self.suffix}"
        payload = {
            "slug": slug,
            "data": {
                "slug": slug,
                "titulo": f"PoC {self.suffix}",
                "estado": "Evaluación",
                "highlights": ["Highlight 1", "Highlight 2"],
            },
            "published": False,
        }
        create = self.client.post(f"/content/{self.collection}", payload)
        assert_ok(create, "create poc")
        try:
            update = self.client.patch(
                f"/content/{self.collection}/{slug}",
                {
                    "data": {**payload["data"], "estado": "PoC"},
                    "published": True,
                },
            )
            assert_ok(update, "update poc")
        finally:
            self.client.delete(f"/content/{self.collection}/{slug}")


if __name__ == "__main__":
    unittest.main()
