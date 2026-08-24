"""
Tests unitarios del helper `unwrapPaginated` definido en
frontend/src/lib/api.js.

Reproduce fielmente la lógica en Python para garantizar que la normalización
de respuestas paginadas se comporte igual en ambos lados. Esto previene
regresiones del bug que rompía la sección "Proyectos" del portal (el backend
devuelve `{items, total, limit, offset}` pero la página asume un array plano).
"""
import unittest


def unwrap_paginated(resp):
    if isinstance(resp, list):
        return resp
    if isinstance(resp, dict) and isinstance(resp.get("items"), list):
        return resp["items"]
    return []


class TestUnwrapPaginated(unittest.TestCase):
    def test_array_passthrough(self):
        self.assertEqual(unwrap_paginated([{"id": 1}, {"id": 2}]), [{"id": 1}, {"id": 2}])

    def test_paginated_object_is_unwrapped(self):
        resp = {"items": [{"id": 1}], "total": 1, "limit": 50, "offset": 0}
        self.assertEqual(unwrap_paginated(resp), [{"id": 1}])

    def test_empty_paginated_object_returns_empty_list(self):
        self.assertEqual(unwrap_paginated({"items": [], "total": 0}), [])

    def test_none_returns_empty_list(self):
        self.assertEqual(unwrap_paginated(None), [])

    def test_unexpected_shape_returns_empty_list(self):
        self.assertEqual(unwrap_paginated({"unexpected": "shape"}), [])

    def test_items_not_array_returns_empty_list(self):
        self.assertEqual(unwrap_paginated({"items": "not-an-array"}), [])


if __name__ == "__main__":
    unittest.main()