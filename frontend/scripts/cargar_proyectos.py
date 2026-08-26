#!/usr/bin/env python3
"""
Carga incremental de items (proyectos, casos-de-exito, laboratorio)
desde un CSV hacia src/data/items.json.

Uso:
  python3 scripts/cargar_proyectos.py
  python3 scripts/cargar_proyectos.py --archivo data/proyectos.csv
  python3 scripts/cargar_proyectos.py --coleccion proyectos --archivo data/proyectos.csv --prune

El script detecta la colección (por argumento --coleccion o por el nombre del
archivo) y hace un merge por slug: agrega los nuevos, actualiza los cambiados
y conserva lo ya existente. Con --prune elimina del JSON los items de la
colección que ya no aparezcan en el CSV.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from pathlib import Path

COLECCIONES = {"proyectos", "casos-de-exito", "laboratorio"}
TIPOS_VIDEO = {"youtube", "vimeo", "archivo"}

ROOT = Path(__file__).resolve().parent.parent
ARCHIVO_POR_DEFECTO = ROOT / "data" / "proyectos.csv"
SALIDA = ROOT / "src" / "data" / "items.json"


def detectar_por_nombre(nombre: str) -> str | None:
    n = Path(nombre).name.lower()
    claves = [
        ("proyecto", "proyectos"),
        ("caso", "casos-de-exito"),
        ("laboratorio", "laboratorio"),
    ]
    for clave, coleccion in claves:
        if clave in n:
            return coleccion
    return None


def preguntar_coleccion() -> str:
    print("Colecciones disponibles: proyectos, casos-de-uso, laboratorio, poc")
    while True:
        valor = input("¿Para qué colección es este archivo? [proyectos]: ").strip().lower()
        if not valor:
            valor = "proyectos"
        if valor in COLECCIONES:
            return valor
        print(f"  '{valor}' no es una colección válida.")


def resolver_coleccion(args: argparse.Namespace, nombre_archivo: str) -> str:
    if args.coleccion:
        if args.coleccion not in COLECCIONES:
            sys.exit(
                f"Colección inválida: {args.coleccion}. Válidas: {', '.join(sorted(COLECCIONES))}"
            )
        return args.coleccion

    detectada = detectar_por_nombre(nombre_archivo)
    interactivo = sys.stdin.isatty()

    if detectada and interactivo:
        respuesta = input(
            f"Colección detectada: {detectada}. ¿Es correcto? [s/n]: "
        ).strip().lower()
        if respuesta in ("s", "si", "sí", "y", "yes", ""):
            return detectada
    if detectada:
        print(f"→ Colección detectada automáticamente: {detectada}")
        return detectada
    if interactivo:
        return preguntar_coleccion()
    sys.exit("No se pudo detectar la colección. Usa --coleccion <nombre>.")


def parse_bool(valor) -> bool:
    if not valor:
        return False
    return valor.strip().lower() in ("true", "verdadero", "1", "si", "sí", "yes", "v")


def dividir(valor, sep="|"):
    if not valor:
        return []
    return [parte.strip() for parte in str(valor).split(sep) if parte.strip()]


def parse_video(valor):
    if not valor:
        return None
    partes = [p.strip() for p in str(valor).split("|")]
    if len(partes) == 1:
        url = partes[0]
        if url.startswith("/") or url.lower().endswith(".mp4"):
            return {"tipo": "archivo", "url": url}
        return {"tipo": "youtube", "url": url}
    tipo, url = partes[0], partes[1]
    return {"tipo": tipo if tipo in TIPOS_VIDEO else "youtube", "url": url}


def parse_equipo(valor):
    equipo = []
    for parte in dividir(valor):
        m = re.match(r"^(.*?)\s*\(([^)]*)\)\s*$", parte)
        if m:
            equipo.append({"nombre": m.group(1).strip(), "rol": m.group(2).strip()})
        else:
            equipo.append({"nombre": parte, "rol": ""})
    return equipo


def parse_autores(valor):
    autores = []
    for parte in dividir(valor):
        m = re.match(r"^(.*?)\s*\(([^)]*)\)\s*(?:\[([^\]]*)\])?\s*$", parte)
        if m:
            autores.append({
                "nombre": m.group(1).strip(),
                "rol": m.group(2).strip(),
                "foto": m.group(3).strip() if m.group(3) else None,
            })
        else:
            autores.append({"nombre": parte, "rol": "", "foto": None})
    return autores


def normalizar(fila, coleccion, advertencias, nro):
    slug = (fila.get("slug") or "").strip()
    if not slug:
        advertencias.append(f"Fila {nro}: falta 'slug' → se omite.")
        return None

    item = {
        "coleccion": coleccion,
        "slug": slug,
        "codigo": (fila.get("codigo") or "").strip() or None,
        "nombreComercial": (fila.get("nombre_comercial") or "").strip(),
        "nombreProyecto": (fila.get("nombre_proyecto") or "").strip(),
        "tipo": (fila.get("tipo") or "").strip() or None,
        "categoria": (fila.get("categoria") or "").strip() or None,
        "estado": (fila.get("estado") or "").strip() or None,
        "documentoDrive": (fila.get("documento_drive") or "").strip() or None,
        "cliente": (fila.get("cliente") or "").strip() or None,
        "descripcion": (fila.get("descripcion") or "").strip(),
        "descripcionLarga": (fila.get("descripcion_larga") or "").strip() or None,
        "equipo": parse_equipo(fila.get("equipo")),
        "autores": parse_autores(fila.get("autores")),
        "videoPromocional": parse_video(fila.get("video_promocional")),
        "videoTecnico": parse_video(fila.get("video_tecnico")),
        "documentacion": (fila.get("documentacion") or "").strip() or None,
        "galeria": dividir(fila.get("galeria")),
        "stack": dividir(fila.get("stack")),
        "problemas": dividir(fila.get("problemas")),
        "queHicimos": dividir(fila.get("que_hicimos")),
        "resultados": dividir(fila.get("resultados")),
        "reservado": parse_bool(fila.get("reservado")),
    }

    if not item["nombreComercial"] and not item["nombreProyecto"]:
        advertencias.append(f"{slug}: sin nombre comercial ni nombre de proyecto.")
    return item


def cargar_existentes():
    if not SALIDA.exists():
        return []
    with open(SALIDA, encoding="utf-8") as f:
        datos = json.load(f)
    return datos if isinstance(datos, list) else []


def guardar(items):
    SALIDA.parent.mkdir(parents=True, exist_ok=True)
    tmp = SALIDA.with_suffix(".json.tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
        f.write("\n")
    tmp.replace(SALIDA)


def main():
    parser = argparse.ArgumentParser(description="Carga incremental de items desde CSV.")
    parser.add_argument(
        "--archivo",
        default=str(ARCHIVO_POR_DEFECTO),
        help=f"Ruta al CSV de entrada (default: {ARCHIVO_POR_DEFECTO.relative_to(ROOT)}).",
    )
    parser.add_argument(
        "--coleccion",
        choices=sorted(COLECCIONES),
        help="Colección destino (si no, se detecta por el nombre del archivo o se pregunta).",
    )
    parser.add_argument(
        "--prune",
        action="store_true",
        help="Eliminar items de la colección que ya no estén en el CSV.",
    )
    args = parser.parse_args()

    archivo = Path(args.archivo).expanduser().resolve()
    if not archivo.exists():
        sys.exit(f"No se encontró el archivo: {archivo}")

    coleccion = resolver_coleccion(args, archivo.name)

    with open(archivo, encoding="utf-8-sig", newline="") as f:
        filas = list(csv.DictReader(f))

    advertencias = []
    items_entrada = []
    vistos = set()
    for nro, fila in enumerate(filas, start=2):
        item = normalizar(fila, coleccion, advertencias, nro)
        if item is None:
            continue
        if item["slug"] in vistos:
            advertencias.append(f"{item['slug']}: slug duplicado en el CSV (se conserva el primero).")
            continue
        vistos.add(item["slug"])
        items_entrada.append(item)

    existentes = cargar_existentes()
    mapa = {(e.get("coleccion"), e.get("slug")): e for e in existentes}

    claves_entrada = set()
    nuevos = []
    actualizados = []
    sin_cambios = 0
    for item in items_entrada:
        clave = (item["coleccion"], item["slug"])
        claves_entrada.add(clave)
        previo = mapa.get(clave)
        if previo is None:
            nuevos.append(item["slug"])
        elif previo == item:
            sin_cambios += 1
        else:
            actualizados.append(item["slug"])

    final = []
    pruned = 0
    for e in existentes:
        if e.get("coleccion") != coleccion:
            final.append(e)
        elif (e.get("coleccion"), e.get("slug")) not in claves_entrada:
            if not args.prune:
                final.append(e)
            else:
                pruned += 1
    final.extend(items_entrada)
    final.sort(key=lambda i: (i.get("coleccion", ""), i.get("slug", "")))

    print(f"→ Leyendo {archivo.relative_to(ROOT)}")
    print(f"→ Colección: {coleccion}")
    print(f"→ {len(items_entrada)} registro(s) procesado(s)")
    if nuevos:
        print(f"  + {len(nuevos)} nuevo(s): {', '.join(nuevos)}")
    if actualizados:
        print(f"  ~ {len(actualizados)} actualizado(s): {', '.join(actualizados)}")
    if sin_cambios:
        print(f"  = {sin_cambios} sin cambios")
    if args.prune:
        print(f"  - {pruned} item(s) eliminado(s) por --prune")
    for adv in advertencias:
        print(f"  ⚠ {adv}")
    guardar(final)
    print(f"→ Guardado {SALIDA.relative_to(ROOT)} ({len(final)} item(s) en total)")


if __name__ == "__main__":
    main()
