import unittest

def normalizar_item_api(item):
    """
    Implementación fiel de normalizarItemApi en frontend/src/data/contenido.js.
    Convierte arrays de objetos {value: '...'} en arrays de strings planos
    para prevenir el error Minified React error #31.
    """
    if not item or not isinstance(item, dict):
        return item

    result = dict(item)

    for campo, val in list(result.items()):
        if not isinstance(val, list) or len(val) == 0:
            continue

        es_array_de_value = any(
            isinstance(entry, dict)
            and len(entry.keys()) == 1
            and "value" in entry
            for entry in val
            if entry is not None
        )

        if es_array_de_value:
            normalized_list = []
            for entry in val:
                if isinstance(entry, str):
                    normalized_list.append(entry)
                elif isinstance(entry, dict) and "value" in entry:
                    normalized_list.append(str(entry.get("value") or ""))
                else:
                    normalized_list.append(str(entry or ""))
            result[campo] = normalized_list

    return result


class TestCmsNormalizer(unittest.TestCase):
    def test_normalizes_stack_value_objects(self):
        raw_item = {
            "slug": "prj-009",
            "stack": [{"value": "Python"}, {"value": "React"}, {"value": "PostgreSQL"}],
        }
        normalized = normalizar_item_api(raw_item)
        self.assertEqual(normalized["stack"], ["Python", "React", "PostgreSQL"])

    def test_preserves_plain_string_arrays(self):
        raw_item = {
            "slug": "prj-010",
            "stack": ["Python", "React", "PostgreSQL"],
        }
        normalized = normalizar_item_api(raw_item)
        self.assertEqual(normalized["stack"], ["Python", "React", "PostgreSQL"])

    def test_normalizes_multiple_nested_value_arrays(self):
        raw_item = {
            "slug": "lab-002",
            "problemas": [{"value": "Problema 1"}, {"value": "Problema 2"}],
            "queHicimos": [{"value": "Paso 1"}, {"value": "Paso 2"}],
            "resultados": [{"value": "Resultado 1"}],
        }
        normalized = normalizar_item_api(raw_item)
        self.assertEqual(normalized["problemas"], ["Problema 1", "Problema 2"])
        self.assertEqual(normalized["queHicimos"], ["Paso 1", "Paso 2"])
        self.assertEqual(normalized["resultados"], ["Resultado 1"])

    def test_preserves_complex_object_arrays(self):
        """Arrays con múltiples llaves (como equipo o highlights) no deben aplanarse"""
        raw_item = {
            "slug": "prj-009",
            "equipo": [
                {"nombre": "Manuel Aliaga", "rol": "Líder Técnico"},
                {"nombre": "Matías Méndez", "rol": "Ingeniero IA"},
            ],
            "highlights": [
                {"valor": "166", "etiqueta": "Pruebas", "detalle": "Unitarias"},
            ],
        }
        normalized = normalizar_item_api(raw_item)
        self.assertEqual(len(normalized["equipo"]), 2)
        self.assertEqual(normalized["equipo"][0]["nombre"], "Manuel Aliaga")
        self.assertEqual(normalized["highlights"][0]["valor"], "166")

    def test_handles_null_empty_and_mixed(self):
        raw_item = {
            "slug": "poc-001",
            "stack": [],
            "problemas": None,
            "resultados": [{"value": "Ok"}, "Direct String"],
        }
        normalized = normalizar_item_api(raw_item)
        self.assertEqual(normalized["stack"], [])
        self.assertIsNone(normalized["problemas"])
        self.assertEqual(normalized["resultados"], ["Ok", "Direct String"])


if __name__ == "__main__":
    unittest.main()
