import unittest
from test.e2e.helpers import get_authenticated_client


class TestCmsLaboratorioE2E(unittest.TestCase):
    def setUp(self):
        self.client = get_authenticated_client()
        self.test_slug = "lab-test-framework-e2e"
        # Limpieza previa: garantiza idempotencia si el slug quedó de una ejecución anterior
        self.client.request("DELETE", f"/content/laboratorio/{self.test_slug}")

    def tearDown(self):
        self.client.request("DELETE", f"/content/laboratorio/{self.test_slug}")

    def test_create_and_update_labs_item_with_specialized_fields(self):
        payload = {
            "slug": self.test_slug,
            "data": {
                "slug": self.test_slug,
                "codigo": "LAB-TEST",
                "nombreComercial": "Framework de Pruebas Labs",
                "nombreProyecto": "Investigación Agéntica",
                "categoria": "Investigación",
                "estado": "En desarrollo",
                "version": "v0.9.0",
                "tipoSolucion": "Investigación / Framework",
                "cliente": "TIVIT Labs",
                "descripcion": "Estudio de arquitectura agéntica para validaciones.",
                "descripcionLarga": "Texto extenso con investigación y resultados experimentales.",
                "documentoDrive": "https://docs.google.com/document/d/12345/edit",
                "autores": [
                    {"nombre": "Manuel Aliaga", "rol": "Investigador Principal", "foto": "/media/equipo/manuel-aliaga.jpg"}
                ],
                "equipo": [
                    {"nombre": "Manuel Aliaga", "rol": "Líder Técnico"}
                ],
                "stack": [{"value": "Python"}, {"value": "Rust"}],
                "puntosClave": [
                    {"stat": "99.9%", "etiqueta": "Precisión", "detalle": "Evaluación estática"}
                ],
                "ventajas": [
                    {"titulo": "Gobernanza", "descripcion": "Control total de políticas", "icono": "ShieldCheck"}
                ],
                "cicloVida": [
                    {"fase": "01", "titulo": "Diseño", "descripcion": "Definición de arquitectura", "icono": "Workflow"}
                ],
                "problemas": [{"value": "Falta de benchmarks estandarizados"}],
                "queHicimos": [{"value": "Construcción de motor de evaluación"}],
                "resultados": [{"value": "Publicación de paper y framework"}],
            },
            "published": True
        }

        status, created, _ = self.client.request("POST", "/content/laboratorio", payload)
        self.assertIn(status, [200, 201], f"Fallo al crear item de labs: {created}")

        # Validar persistencia de autores y cicloVida
        self.assertEqual(len(created["data"]["autores"]), 1)
        self.assertEqual(created["data"]["autores"][0]["nombre"], "Manuel Aliaga")
        self.assertEqual(len(created["data"]["cicloVida"]), 1)
        self.assertEqual(created["data"]["cicloVida"][0]["icono"], "Workflow")


if __name__ == "__main__":
    unittest.main()
