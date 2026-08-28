#!/usr/bin/env python3
import sqlite3
import json
import uuid
import re
from datetime import datetime

def extract_js_array(content, export_name):
    """Extract a JS array from export const name = [...] or export const name = [ ... ];"""
    # Find the export statement and extract the array
    pattern = rf'export const {export_name}\s*=\s*(\[.*?\]);'
    match = re.search(pattern, content, re.DOTALL)
    if not match:
        pattern = rf'export const {export_name}\s*=\s*(\[.*?\])'
        match = re.search(pattern, content, re.DOTALL)
    if not match:
        print(f"  Could not find array for {export_name}")
        return []
    
    array_str = match.group(1)
    return parse_js_array(array_str)

def parse_js_array(array_str):
    """Convert JS array syntax to Python list"""
    # Remove comments
    array_str = re.sub(r'//.*', '', array_str)
    array_str = re.sub(r'/\*.*?\*/', '', array_str, flags=re.DOTALL)
    
    # Replace unquoted keys with quoted keys (handle nested objects)
    # This regex finds word: patterns and quotes the word
    array_str = re.sub(r'([a-zA-Z_$][a-zA-Z0-9_$]*):', r'"\1":', array_str)
    
    # Replace single quotes with double quotes
    array_str = array_str.replace("'", '"')
    
    # Handle template literals (backticks) - replace with regular strings
    array_str = re.sub(r'`([^`]*)`', r'"\1"', array_str)
    
    # Fix trailing commas in objects and arrays
    array_str = re.sub(r',\s*}', '}', array_str)
    array_str = re.sub(r',\s*]', ']', array_str)
    
    # Fix JavaScript null/true/false to JSON
    array_str = array_str.replace(': null', ': null')
    array_str = array_str.replace(': true', ': true')
    array_str = array_str.replace(': false', ': false')
    
    try:
        return json.loads(array_str)
    except json.JSONDecodeError as e:
        print(f"  JSON parse error: {e}")
        print(f"  First 200 chars of problematic area: {array_str[max(0, e.pos-100):e.pos+100]}")
        return []

# Load all data files
all_items = []

# items.json (already JSON)
with open('/tmp/items.json', 'r') as f:
    items = json.load(f)
    for item in items:
        item['coleccion'] = item.get('coleccion', '')
    all_items.extend(items)
    print(f"Loaded {len(items)} items from items.json")

# casosExito.js
with open('/tmp/casosExito.js', 'r') as f:
    content = f.read()
    items = extract_js_array(content, 'casosExito')
    for item in items:
        item['coleccion'] = 'casos-de-exito'
    all_items.extend(items)
    print(f"Loaded {len(items)} items from casosExito.js")

# almaviva.js
with open('/tmp/almaviva.js', 'r') as f:
    content = f.read()
    items = extract_js_array(content, 'productosAlmaviva')
    for item in items:
        item['coleccion'] = 'almaviva'
    all_items.extend(items)
    print(f"Loaded {len(items)} items from almaviva.js")

# xms.js
with open('/tmp/xms.js', 'r') as f:
    content = f.read()
    items = extract_js_array(content, 'agentesXms')
    for item in items:
        item['coleccion'] = 'xms'
    all_items.extend(items)
    print(f"Loaded {len(items)} items from xms.js")

print(f"\nTotal items to seed: {len(all_items)}")

# Connect to database
conn = sqlite3.connect('/app/data/portal.db')
cursor = conn.cursor()

now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
count = 0
collections_count = {}

for item in all_items:
    slug = item.get('slug')
    collection = item.get('coleccion')
    if not slug or not collection:
        continue
    
    cursor.execute(
        "SELECT id FROM content_items WHERE collection = ? AND slug = ? AND deleted_at IS NULL",
        (collection, slug)
    )
    existing = cursor.fetchone()
    
    data = json.dumps(item, ensure_ascii=False)
    item_id = str(uuid.uuid4())
    
    if existing:
        cursor.execute(
            "UPDATE content_items SET data = ?, updated_at = ? WHERE id = ?",
            (data, now, existing[0])
        )
    else:
        cursor.execute(
            """INSERT INTO content_items 
               (id, collection, slug, data, published, created_by, updated_by, created_at, updated_at)
               VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?)""",
            (item_id, collection, slug, data, "system", "system", now, now)
        )
    count += 1
    collections_count[collection] = collections_count.get(collection, 0) + 1

conn.commit()

# Verify
cursor.execute("SELECT collection, COUNT(*) FROM content_items WHERE deleted_at IS NULL GROUP BY collection")
print("\nAfter seeding:")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]}")

conn.close()
print(f"\nSeeded/updated {count} items")