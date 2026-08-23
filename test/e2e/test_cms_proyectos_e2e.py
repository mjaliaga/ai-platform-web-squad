import unittest
from test.e2e.helpers import get_authenticated_client


class TestCmsProyectosE2E(unittest.TestCase):
    def setUp(self):
        self.client = get_authenticated_client()
        self.test_slug = "prj-test-automation-e2e"
        # Limpieza previa: garantiza idempotencia si el slug quedó de una ejecución anterior
        self.client.request("DELETE", f"/content/proyectos/{self.test_slug}")

    def tearDown(self):
        # Limpiar item de prueba si quedó creado
        self.client.request("DELETE", f"/content/proyectos/{self.test_slug}")

    def test_create_and_update_project_with_new_team_members(self):
        # 1. Crear nuevo proyecto
        initial_payload = {
            "slug": self.test_slug,
            "data": {
                "slug": self.test_slug,
                "codigo": "PRJ-TEST",
                "nombreComercial": "Plataforma de Automatización E2E",
                "nombreProyecto": "Iniciativa de Pruebas Automatizadas",
                "tipo": "Interno",
                "estado": "En desarrollo",
                "version": "v1.0.0",
                "tipoSolucion": "Testing / QA",
                "cliente": "Equipo TIVIT",
                "descripcion": "Proyecto de prueba para validar adición de integrantes y edición en CMS.",
                "descripcionLarga": "Descripción detallada del proyecto de testing automatizado.",
                "equipo": [
                    {"nombre": "Manuel Aliaga", "rol": "Líder Técnico"}
                ],
                "stack": [{"value": "Python"}, {"value": "React"}],
                "problemas": [{"value": "Falta de validaciones E2E"}],
                "queHicimos": [{"value": "Diseño de suite de pruebas"}],
                "resultados": [{"value": "Cobertura 100% de endpoints"}],
                "highlights": [
                    {"valor": "100%", "etiqueta": "Cobertura", "detalle": "Endpoints principales"}
                ],
                "documentoDrive": "https://docs.google.com/document/d/test-doc/edit"
            },
            "published": True
        }

        status, created, _ = self.client.request("POST", "/content/proyectos", initial_payload)
        self.assertIn(status, [200, 201], f"Fallo al crear proyecto: status={status}, resp={created}")

        # 2. Agregar un NUEVO integrante al equipo (simula el caso de uso del usuario)
        updated_data = dict(created["data"])
        updated_data["equipo"].append({"nombre": "Nuevo Integrante IA", "rol": "Ingeniero Backend"})
        updated_data["descripcion"] = "Descripción modificada con nuevo integrante."

        update_payload = {
            "slug": self.test_slug,
            "data": updated_data,
            "published": True
        }

        # 3. Guardar actualización
        status, updated, _ = self.client.request("PUT", f"/content/proyectos/{self.test_slug}", update_payload)
        self.assertEqual(status, 200, f"Error al guardar actualización del proyecto (Error 403 u otro): {updated}")

        # 4. Verificar que se persistieron los 2 integrantes
        self.assertEqual(len(updated["data"]["equipo"]), 2)
        self.assertEqual(updated["data"]["equipo"][1]["nombre"], "Nuevo Integrante IA")
        self.assertEqual(updated["data"]["equipo"][1]["rol"], "Ingeniero Backend")

        # 5. Obtener el item para confirmar persistencia en base de datos
        status, fetched, _ = self.client.request("GET", f"/content/proyectos/{self.test_slug}")
        self.assertEqual(status, 200)
        self.assertEqual(len(fetched["data"]["equipo"]), 2)


if __name__ == "__main__":
    unittest.main()
