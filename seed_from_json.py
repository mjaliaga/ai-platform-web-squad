#!/usr/bin/env python3
import sqlite3
import json
import uuid
from datetime import datetime

with open('/tmp/all_cms_data.json', 'r') as f:
    all_items = json.load(f)

print(f"Total items to seed: {len(all_items)}")

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

cursor.execute("SELECT collection, COUNT(*) FROM content_items WHERE deleted_at IS NULL GROUP BY collection")
print("\nAfter seeding:")
for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]}")

conn.close()
print(f"\nSeeded/updated {count} items")