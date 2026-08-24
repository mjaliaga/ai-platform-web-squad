"""
Test E2E de regresión para el bug que rompía la sección "Proyectos" del portal.

Cuando el frontend llama `api.listProjects()` espera un array, pero el backend
Rust devuelve una respuesta paginada `{items, total, limit, offset}`. La
incompatibilidad causaba `TypeError: projects.map is not a function` al
renderizar `/portal/projects`.

Este test verifica el contrato del backend (paginado) y simula la lógica del
helper `unwrapPaginated` del frontend para asegurar que ambos lados pueden
cooperar sin crashear.
"""
import unittest
from test.e2e.helpers import get_authenticated_client


def unwrap_paginated(resp):
    """Espejo del helper JS en `frontend/src/lib/api.js`."""
    if isinstance(resp, list):
        return resp
    if isinstance(resp, dict) and isinstance(resp.get("items"), list):
        return resp["items"]
    return []


class TestPortalProyectosE2E(unittest.TestCase):
    def setUp(self):
        self.client = get_authenticated_client()

    def test_list_projects_paginated_contract_is_consumible_por_frontend(self):
        status, data, _ = self.client.request("GET", "/projects")
        self.assertEqual(status, 200, f"GET /projects falló: {data}")

        # Contrato actual del backend: respuesta paginada.
        self.assertIsInstance(data, dict)
        self.assertIn("items", data)
        self.assertIsInstance(data["items"], list)

        # El frontend debe poder consumirla como array sin errores.
        projects = unwrap_paginated(data)
        self.assertIsInstance(projects, list, "El frontend no podría iterar la respuesta")

        # Cada proyecto debe traer los stats que la UI necesita.
        for p in projects:
            self.assertIn("id", p)
            self.assertIn("name", p)
            self.assertIn("task_count", p)
            self.assertIn("done_count", p)
            self.assertIn("members", p)
            self.assertIsInstance(p["members"], list)

    def test_list_projects_con_filtro_pagination_no_revienta(self):
        status, data, _ = self.client.request("GET", "/projects?limit=1&offset=0")
        self.assertEqual(status, 200)
        projects = unwrap_paginated(data)
        self.assertLessEqual(len(projects), 1)


if __name__ == "__main__":
    unittest.main()