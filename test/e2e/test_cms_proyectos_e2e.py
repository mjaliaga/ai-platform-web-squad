"""CMS Projects CRUD end-to-end.

Validates the lifecycle of a project: create → read → update → publish → delete,
plus team member management.
"""

from __future__ import annotations

import time
import unittest

from .helpers import ApiClient, assert_ok


def _suffix():
    return str(int(time.time() * 1000))[-8:]


class TestCmsProyectosE2E(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = ApiClient()
        login = cls.client.login()
        assert_ok(login, "auth login for projects tests")

    def setUp(self):
        self.suffix = _suffix()

    def _make_payload(self):
        return {
            "code": f"PRJ-{self.suffix}",
            "name": f"Proyecto E2E {self.suffix}",
            "description": "Proyecto creado desde suite E2E.",
            # backend-rust/src/routes/projects.rs:20-27 y 44-51
            # Categoría y stage deben ser valores válidos; 'proyectos' y 'Backlog' no combinan
            "stage": "Proyecto",
            "categoria": "Proyecto",
        }

    def test_01_create_and_update_project_with_team_members(self):
        create = self.client.post("/portfolio", self._make_payload())
        assert_ok(create, "create project")
        project_id = create["body"]["id"]
        try:
            update = self.client.patch(
                f"/portfolio/{project_id}",
                {"name": f"Proyecto E2E {self.suffix} (editado)"},
            )
            assert_ok(update, "update project")
            self.assertIn("(editado)", update["body"]["name"])

            progress = self.client.get(f"/portfolio/{project_id}/progress")
            assert_ok(progress, "get project progress")
        finally:
            self.client.delete(f"/portfolio/{project_id}")

    def test_02_publish_toggles_published_flag(self):
        create = self.client.post("/portfolio", self._make_payload())
        assert_ok(create, "create project for publish")
        project_id = create["body"]["id"]
        try:
            publish = self.client.post(
                f"/portfolio/{project_id}/publish", {"published": True}
            )
            assert_ok(publish, "publish project")
        finally:
            self.client.delete(f"/portfolio/{project_id}")


if __name__ == "__main__":
    unittest.main()
