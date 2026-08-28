#!/usr/bin/env python3
import sqlite3
import json
import uuid
from datetime import datetime

# Load items.json
with open('/tmp/items.json', 'r') as f:
    items = json.load(f)

# Connect to database
conn = sqlite3.connect('/app/data/portal.db')
cursor = conn.cursor()

now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
count = 0

for item in items:
    slug = item.get('slug')
    collection = item.get('coleccion')
    if not slug or not collection:
        continue
    
    # Check if item exists
    cursor.execute(
        "SELECT id FROM content_items WHERE collection = ? AND slug = ? AND deleted_at IS NULL",
        (collection, slug)
    )
    existing = cursor.fetchone()
    
    data = json.dumps(item, ensure_ascii=False)
    item_id = str(uuid.uuid4())
    
    if existing:
        # Update
        cursor.execute(
            "UPDATE content_items SET data = ?, updated_at = ? WHERE id = ?",
            (data, now, existing[0])
        )
    else:
        # Insert
        cursor.execute(
            """INSERT INTO content_items 
               (id, collection, slug, data, published, created_by, updated_by, created_at, updated_at)
               VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?)""",
            (item_id, collection, slug, data, "system", "system", now, now)
        )
    count += 1

conn.commit()
conn.close()
print(f"Seeded {count} items")