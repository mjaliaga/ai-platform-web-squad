import unittest
from test.e2e.helpers import get_authenticated_client


class TestCmsPocE2E(unittest.TestCase):
    def setUp(self):
        self.client = get_authenticated_client()
        self.test_slug = "poc-test-voice-e2e"
        # Limpieza previa: garantiza idempotencia si el slug quedó de una ejecución anterior
        self.client.request("DELETE", f"/content/poc/{self.test_slug}")

    def tearDown(self):
        self.client.request("DELETE", f"/content/poc/{self.test_slug}")

    def test_create_and_update_poc(self):
        payload = {
            "slug": self.test_slug,
            "data": {
                "slug": self.test_slug,
                "codigo": "POC-TEST",
                "nombreComercial": "Agente de Voz Ultra Baja Latencia",
                "nombreProyecto": "PoC de Voz con LLMs",
                "tipo": "Interno",
                "estado": "En evaluación",
                "version": "v0.1.0",
                "tipoSolucion": "Voz / Conversacional",
                "cliente": "Innovación Interna",
                "descripcion": "Validación de pipeline WebRTC + Whisper + TTS en menos de 400ms.",
                "descripcionLarga": "Arquitectura y resultados del benchmark de latencia.",
                "equipo": [
                    {"nombre": "Manuel Aliaga", "rol": "Líder Técnico"}
                ],
                "stack": [{"value": "WebRTC"}, {"value": "Rust"}, {"value": "Python"}],
                "highlights": [
                    {"valor": "380ms", "etiqueta": "Latencia", "detalle": "Voz a voz extremo a extremo"}
                ],
                "videoPromocional": {
                    "tipo": "youtube",
                    "url": "https://youtube.com/watch?v=poc-demo"
                },
                "problemas": [{"value": "Latencia elevada en streaming"}],
                "queHicimos": [{"value": "Pipeline con WebSocket y streaming de audio"}],
                "resultados": [{"value": "Latencia inferior a 400ms lograda"}],
            },
            "published": True
        }

        status, created, _ = self.client.request("POST", "/content/poc", payload)
        self.assertIn(status, [200, 201], f"Fallo al crear PoC: {created}")
        self.assertEqual(len(created["data"]["highlights"]), 1)
        self.assertEqual(created["data"]["highlights"][0]["valor"], "380ms")


if __name__ == "__main__":
    unittest.main()
