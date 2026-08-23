#!/usr/bin/env python3
import os
import sys
import unittest
import time

GREEN = "\033[92m"
RED = "\033[91m"
BLUE = "\033[94m"
YELLOW = "\033[93m"
BOLD = "\033[1m"
RESET = "\033[0m"


def print_banner():
    print(f"\n{BLUE}{BOLD}======================================================{RESET}")
    print(f"{BLUE}{BOLD}   🧪 TIVIT AI Platform — Test Suite (Unit + E2E)    {RESET}")
    print(f"{BLUE}{BOLD}======================================================{RESET}\n")


def main():
    print_banner()

    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    if project_root not in sys.path:
        sys.path.insert(0, project_root)

    test_dir = os.path.dirname(os.path.abspath(__file__))

    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    # Cargar Unit Tests
    unit_suite = loader.discover(
        start_dir=os.path.join(test_dir, "unit"),
        pattern="test_*.py",
        top_level_dir=project_root
    )
    # Cargar E2E Tests
    e2e_suite = loader.discover(
        start_dir=os.path.join(test_dir, "e2e"),
        pattern="test_*.py",
        top_level_dir=project_root
    )

    suite.addTests(unit_suite)
    suite.addTests(e2e_suite)

    start_time = time.time()
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    elapsed = time.time() - start_time

    print(f"\n{BOLD}------------------------------------------------------{RESET}")
    if result.wasSuccessful():
        print(f"{GREEN}{BOLD}✅ TODAS LAS PRUEBAS PASARON EXITOSAMENTE{RESET}")
        print(f"Total: {result.testsRun} tests ejecutados en {elapsed:.2f}s")
        sys.exit(0)
    else:
        print(f"{RED}{BOLD}❌ HUBO FALLOS EN LA EJECUCIÓN DE PRUEBAS{RESET}")
        print(f"Fallos: {len(result.failures)} | Errores: {len(result.errors)} | Total: {result.testsRun}")
        sys.exit(1)


if __name__ == "__main__":
    main()
