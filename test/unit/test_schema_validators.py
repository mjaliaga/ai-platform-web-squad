import re
import unittest

def is_valid_slug(slug: str) -> bool:
    """Validador idéntico al del backend Rust en schemas.rs"""
    if not slug or len(slug) > 200:
        return False
    return bool(re.match(r'^[a-z0-9-]+$', slug))


class TestSchemaValidators(unittest.TestCase):
    def test_valid_slugs(self):
        valid_cases = [
            "prj-009-automatizacion-qa",
            "lab-001-ia-cpu-only",
            "poc-001",
            "caso-exito-mineria-2026",
            "assistdev",
            "123-test",
        ]
        for slug in valid_cases:
            self.assertTrue(is_valid_slug(slug), f"Slug '{slug}' debería ser válido")

    def test_invalid_slugs(self):
        invalid_cases = [
            "",                        # Vacío
            "Slug_Con_Mayusculas",     # Mayúsculas
            "slug con espacios",       # Espacios
            "slug_con_guion_bajo",     # Guión bajo
            "slug/con/slash",          # Slashes
            "slug!@#$%",               # Caracteres especiales
            "a" * 201,                 # Más de 200 caracteres
        ]
        for slug in invalid_cases:
            self.assertFalse(is_valid_slug(slug), f"Slug '{slug}' debería ser inválido")


if __name__ == "__main__":
    unittest.main()
