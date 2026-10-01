import json
import os
import sqlite3
import re
import time

json_path = os.path.join("backend", "data", "indian_medicine_data.json")
db_path = os.path.join("backend", "data", "medicine_pricing.db")

t0 = time.time()
print(f"Reading {json_path}...")
with open(json_path, "r", encoding="utf-8") as f:
    medicines = json.load(f)

print(f"Loaded {len(medicines)} records in {time.time() - t0:.2f}s. Creating SQLite DB...")

conn = sqlite3.connect(db_path)
cur = conn.cursor()

cur.execute("DROP TABLE IF EXISTS medicines")
cur.execute("""
    CREATE TABLE medicines (
        id INTEGER PRIMARY KEY,
        name TEXT,
        name_lower TEXT,
        price REAL,
        manufacturer_name TEXT,
        pack_size_label TEXT,
        short_composition1 TEXT,
        short_composition2 TEXT
    )
""")

rows = []
for m in medicines:
    raw_id = m.get("id")
    try:
        med_id = int(raw_id)
    except (ValueError, TypeError):
        med_id = None
    
    name = m.get("name", "").strip()
    name_lower = name.lower()
    
    # parse price
    price_val = 0.0
    for k in ["price(₹)", "price(\u20b9)", "price"]:
        if k in m and m[k] is not None:
            raw_price = str(m[k]).replace("₹", "").replace(",", "").strip()
            try:
                price_val = float(raw_price)
            except ValueError:
                price_val = 0.0
            break
            
    mfg = m.get("manufacturer_name", "").strip()
    pack = m.get("pack_size_label", "").strip()
    comp1 = m.get("short_composition1", "").strip()
    comp2 = m.get("short_composition2", "").strip()
    
    rows.append((med_id, name, name_lower, price_val, mfg, pack, comp1, comp2))

cur.executemany("""
    INSERT INTO medicines (id, name, name_lower, price, manufacturer_name, pack_size_label, short_composition1, short_composition2)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
""", rows)

print("Creating indices...")
cur.execute("CREATE INDEX idx_medicines_name_lower ON medicines (name_lower)")
cur.execute("CREATE INDEX idx_medicines_comp1 ON medicines (short_composition1)")
conn.commit()

# Test queries
print("\nTesting queries:")
for query in ["augmentin", "paracetamol", "crocin", "azithral", "metformin"]:
    q_start = time.time()
    cur.execute("SELECT name, price, manufacturer_name, pack_size_label, short_composition1 FROM medicines WHERE name_lower LIKE ? LIMIT 3", (f"%{query}%",))
    res = cur.fetchall()
    q_time = (time.time() - q_start) * 1000
    print(f"Query '{query}' took {q_time:.2f}ms: found {len(res)} matches. Top: {res[0] if res else 'None'}")

conn.close()
print(f"All done in {time.time() - t0:.2f}s! DB size: {os.path.getsize(db_path)/(1024*1024):.2f}MB")
