#!/usr/bin/env python3
"""Parser JS-literal a JSON estricto.

Uso: python3 js_to_json.py < archivo.js > archivo.json

Soporta:
- `clave: valor` -> `"clave": valor`
- Strings con comillas dobles o simples
- Comentarios `//` y `/* */`
- Comas colgantes (trailing commas)
- Referencias a constantes `const NAME = ...` definidas en el archivo

Limitaciones:
- No soporta template literals con expresiones
- No soporta funciones ni nada ejecutable (solo data literals)
"""
import re
import sys
import json


def extract_constants(text):
    """Encuentra declaraciones `const NAME = value;` a nivel top-level."""
    constants = {}
    # Match const NAME = literal_simple;
    pattern = re.compile(
        r'^\s*const\s+([A-Z_][A-Z0-9_]*)\s*=\s*('
        r'"(?:[^"\\]|\\.)*"'
        r"|'(?:[^'\\]|\\.)*'"
        r'|\[[^\[\]]*\]'
        r'|\{[^{}]*\}'
        r'|null|true|false|[-]?\d+(?:\.\d+)?'
        r')\s*[,;]',
        re.MULTILINE
    )
    for m in pattern.finditer(text):
        name = m.group(1)
        value = m.group(2).strip()
        if value.endswith(','):
            value = value[:-1].strip()
        constants[name] = value
    return constants


def inline_constants(text, constants):
    """Reemplaza referencias a constantes con su valor."""
    result = text
    for name in sorted(constants.keys(), key=len, reverse=True):
        value = constants[name]
        # Word boundary: NO reemplazar si va seguido de ':' (clave)
        pattern = re.compile(r'(?<![A-Za-z0-9_$])' + re.escape(name) + r'(?![A-Za-z0-9_$])')
        def make_replacer(v):
            def replacer(m):
                start, end = m.start(), m.end()
                # Si va seguido de ':' (con espacio opcional), es una clave
                rest = result[end:]
                if re.match(r'\s*:', rest):
                    return m.group(0)
                return v
            return replacer
        result = pattern.sub(make_replacer(value), result)
    return result


def js_to_json(text):
    """Convierte object/array literal de JS a JSON."""
    out = []
    i = 0
    while i < len(text):
        c = text[i]
        # Comentario de línea
        if c == '/' and i + 1 < len(text) and text[i+1] == '/':
            while i < len(text) and text[i] != '\n':
                i += 1
            continue
        # Comentario de bloque
        if c == '/' and i + 1 < len(text) and text[i+1] == '*':
            i += 2
            while i + 1 < len(text) and not (text[i] == '*' and text[i+1] == '/'):
                i += 1
            i += 2
            continue
        # String con " o '
        if c in '"\'':
            quote = c
            out.append(c)
            i += 1
            while i < len(text):
                ch = text[i]
                if ch == '\\' and i + 1 < len(text):
                    out.append(ch)
                    out.append(text[i+1])
                    i += 2
                    continue
                out.append(ch)
                if ch == quote:
                    i += 1
                    break
                i += 1
            continue
        # Identificador (clave candidata)
        if c.isalpha() or c == '_' or c == '$':
            start = i
            while i < len(text):
                ch = text[i]
                if not (ch.isalnum() or ch == '_' or ch == '$'):
                    break
                i += 1
            ident = text[start:i]
            j = i
            while j < len(text) and text[j].isspace():
                j += 1
            if j < len(text) and text[j] == ':':
                out.append('"')
                out.append(ident)
                out.append('"')
            else:
                out.append(ident)
            continue
        out.append(c)
        i += 1
    return ''.join(out)


def strip_trailing_commas(text):
    """Elimina `,` seguido de `}` o `]` (con espacio opcional)."""
    return re.sub(r',(\s*[}\]])', r'\1', text)


def find_array(text, var_name):
    """Encuentra `var_name = [...]` y devuelve el array literal."""
    patterns = [
        f'export const {var_name} = [',
        f'const {var_name} = [',
    ]
    for pat in patterns:
        idx = text.find(pat)
        if idx >= 0:
            start = idx + len(pat) - 1  # apunta al `[`
            depth = 0
            for i in range(start, len(text)):
                if text[i] == '[':
                    depth += 1
                elif text[i] == ']':
                    depth -= 1
                    if depth == 0:
                        return text[start:i+1]
    return None


def main():
    if len(sys.argv) < 2:
        print("Uso: js_to_json.py <archivo.js> <nombre_variable>", file=sys.stderr)
        sys.exit(1)

    path = sys.argv[1]
    var_name = sys.argv[2] if len(sys.argv) > 2 else None

    with open(path) as f:
        text = f.read()

    # Inline constantes
    constants = extract_constants(text)
    text = inline_constants(text, constants)

    if var_name:
        arr = find_array(text, var_name)
        if arr is None:
            print(f"ERROR: no se encontró '{var_name}'", file=sys.stderr)
            sys.exit(1)
    else:
        # Buscar el primer array export const
        m = re.search(r'export\s+const\s+(\w+)\s*=\s*\[', text)
        if not m:
            print("ERROR: no se encontró array", file=sys.stderr)
            sys.exit(1)
        var_name = m.group(1)
        arr = find_array(text, var_name)
        if arr is None:
            print(f"ERROR: no se encontró '{var_name}'", file=sys.stderr)
            sys.exit(1)

    converted = js_to_json(arr)
    final = strip_trailing_commas(converted)
    data = json.loads(final)
    print(json.dumps(data, indent=2, ensure_ascii=False))


if __name__ == '__main__':
    main()
