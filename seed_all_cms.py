#!/usr/bin/env python3
import sqlite3
import json
import uuid
import re
from datetime import datetime

def parse_js_module(content, collection):
    """Parse a JS module file that exports a const array"""
    # Find the array content
    # Pattern: export const name = [ ... ];
    match = re.search(r'export const \w+\s*=\s*(\[.*?\]);', content, re.DOTALL)
    if not match:
        # Try module.exports pattern
        match = re.search(r'module\.exports\s*=\s*(\[.*?\]);', content, re.DOTALL)
    
    if not match:
        print(f"Could not find array in {collection}")
        return []
    
    array_str = match.group(1)
    
    # Convert JS object syntax to JSON
    # Replace unquoted keys with quoted keys
    array_str = re.sub(r'(\w+):', r'"\1":', array_str)
    # Replace single quotes with double quotes
    array_str = array_str.replace("'", '"')
    # Handle trailing commas
    array_str = re.sub(r',\s*}', '}', array_str)
    array_str = re.sub(r',\s*]', ']', array_str)
    
    try:
        items = json.loads(array_str)
        for item in items:
            item['coleccion'] = collection
        return items
    except json.JSONDecodeError as e:
        print(f"Error parsing {collection}: {e}")
        # Try a more aggressive conversion
        try:
            # Try with ast.literal_eval for Python-like syntax
            import ast
            # Convert JS null/true/false to Python None/True/False
            array_str = array_str.replace('null', 'None').replace('true', 'True').replace('false', 'False')
            items = ast.literal_eval(array_str)
            for item in items:
                item['coleccion'] = collection
            return items
        except Exception as e2:
            print(f"  Also failed with ast: {e2}")
            return []

# Load all data files
all_items = []

# items.json
with open('/tmp/items.json', 'r') as f:
    all_items.extend(json.load(f))

# casosExito.js
with open('/tmp/casosExito.js', 'r') as f:
    all_items.extend(parse_js_module(f.read(), 'casos-de-exito'))

# almaviva.js
with open('/tmp/almaviva.js', 'r') as f:
    all_items.extend(parse_js_module(f.read(), 'almaviva'))

# xms.js
with open('/tmp/xms.js', 'r') as f:
    all_items.extend(parse_js_module(f.read(), 'xms'))

print(f"Total items to seed: {len(all_items)}")

# Connect to database
conn = sqlite3.connect('/app/data/portal.db')
cursor = conn.cursor()

now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
count = 0

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

conn.commit()

# Verify
cursor.execute("SELECT collection, COUNT(*) FROM content_items WHERE deleted_at IS NULL GROUP BY collection")
print("After seeding:")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]}")

conn.close()
print(f"Seeded/updated {count} items")