import unittest
from test.e2e.helpers import get_authenticated_client


class TestCmsCasosExitoE2E(unittest.TestCase):
    def setUp(self):
        self.client = get_authenticated_client()
        self.test_slug = "caso-test-mineria-e2e"
        # Limpieza previa: garantiza idempotencia si el slug quedó de una ejecución anterior
        self.client.request("DELETE", f"/content/casos-de-exito/{self.test_slug}")

    def tearDown(self):
        self.client.request("DELETE", f"/content/casos-de-exito/{self.test_slug}")

    def test_create_and_update_caso_exito(self):
        payload = {
            "slug": self.test_slug,
            "data": {
                "slug": self.test_slug,
                "codigo": "CASO-TEST",
                "nombreComercial": "Optimización de Flotas con IA",
                "industria": "Minería",
                "pais": "Perú",
                "estado": "Implementado en Producción",
                "plazo": "6 meses",
                "precio": "USD 60,000",
                "cliente": "Compañía Minera del Sur",
                "descripcion": "Sistema de visión artificial para control de carguío y acarreo.",
                "perfil": "Cliente minero líder con más de 120 camiones autónomos.",
                "alcance": "Despliegue en 3 tajos abiertos con telemetría en tiempo real.",
                "detalleTecnico": "Modelos YOLO v8 optimizados con TensorRT en Edge compute.",
                "stack": [{"value": "Python"}, {"value": "TensorRT"}, {"value": "OpenCV"}],
            },
            "published": True
        }

        status, created, _ = self.client.request("POST", "/content/casos-de-exito", payload)
        self.assertIn(status, [200, 201], f"Fallo al crear caso de éxito: {created}")
        self.assertEqual(created["data"]["industria"], "Minería")
        self.assertEqual(len(created["data"]["stack"]), 3)


if __name__ == "__main__":
    unittest.main()
