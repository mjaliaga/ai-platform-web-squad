#!/usr/bin/env python3
"""Interactive test runner with colored console output.

Supports a small set of CLI flags to make CI / local development easier:

    --unit-only       Run only the unit tests (no Docker required)
    --e2e-only        Run only the end-to-end tests
    --e2e-skip        Skip the E2E tests entirely (useful in CI without stack)
    --pattern PATTERN unittest-discover pattern, e.g. test_auth*
    --xml PATH        Emit a JUnit XML report at PATH
"""

from __future__ import annotations

import argparse
import os
import sys
import time
import unittest
import xml.etree.ElementTree as ET
from xml.dom import minidom

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


def parse_args(argv):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--unit-only", action="store_true", help="Run only unit tests")
    parser.add_argument("--e2e-only", action="store_true", help="Run only E2E tests")
    parser.add_argument("--e2e-skip", action="store_true", help="Skip E2E tests entirely")
    parser.add_argument("--pattern", default="test_*.py", help="unittest-discover pattern")
    parser.add_argument("--xml", help="Emit JUnit XML report at this path")
    return parser.parse_args(argv)


def collect_suite(args, project_root, test_dir):
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    if not args.e2e_only:
        unit = loader.discover(
            start_dir=os.path.join(test_dir, "unit"),
            pattern=args.pattern,
            top_level_dir=project_root,
        )
        suite.addTests(unit)

    if not args.unit_only and not args.e2e_skip:
        e2e = loader.discover(
            start_dir=os.path.join(test_dir, "e2e"),
            pattern=args.pattern,
            top_level_dir=project_root,
        )
        suite.addTests(e2e)

    return suite


def write_junit_xml(result, path, elapsed):
    suites = ET.Element("testsuites")
    suite = ET.SubElement(suites, "testsuite", attrib={
        "name": "tivit-tests",
        "tests": str(result.testsRun),
        "failures": str(len(result.failures)),
        "errors": str(len(result.errors)),
        "time": f"{elapsed:.3f}",
    })
    for tc, _ in result.failures:
        ET.SubElement(suite, "testcase", attrib={"name": tc.id()}).append(
            ET.fromstring(f"<failure>{'Failure'}</failure>")
        )
    for tc, _ in result.errors:
        ET.SubElement(suite, "testcase", attrib={"name": tc.id()}).append(
            ET.fromstring(f"<error>{'Error'}</error>")
        )
    xml_text = minidom.parseString(ET.tostring(suites)).toprettyxml(indent="  ")
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(xml_text)


def main(argv=None):
    args = parse_args(argv or sys.argv[1:])
    print_banner()

    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    if project_root not in sys.path:
        sys.path.insert(0, project_root)

    test_dir = os.path.dirname(os.path.abspath(__file__))

    if args.e2e_skip:
        print(f"{YELLOW}E2E tests skipped via --e2e-skip{RESET}\n")
    elif not args.unit_only:
        print(f"{YELLOW}ℹ  E2E tests requieren el stack Docker levantado. {RESET}\n")

    suite = collect_suite(args, project_root, test_dir)
    if suite.countTestCases() == 0:
        print(f"{YELLOW}No se encontraron tests con el patrón {args.pattern!r}.{RESET}")
        sys.exit(0)

    start = time.time()
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    elapsed = time.time() - start

    if args.xml:
        write_junit_xml(result, args.xml, elapsed)
        print(f"\n{BOLD}Reporte JUnit XML: {args.xml}{RESET}")

    print(f"\n{BOLD}------------------------------------------------------{RESET}")
    if result.wasSuccessful():
        print(f"{GREEN}{BOLD}✅ TODAS LAS PRUEBAS PASARON EXITOSAMENTE{RESET}")
        print(f"Total: {result.testsRun} tests ejecutados en {elapsed:.2f}s")
        sys.exit(0)
    else:
        print(f"{RED}{BOLD}❌ HUBO FALLOS EN LA EJECUCIÓN DE PRUEBAS{RESET}")
        print(
            f"Fallos: {len(result.failures)} | Errores: {len(result.errors)} "
            f"| Total: {result.testsRun}"
        )
        sys.exit(1)


if __name__ == "__main__":
    main()
