import os
import json
import sqlite3
import re
import logging

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
DB_PATH = os.path.join(DATA_DIR, "medicine_pricing.db")
JSON_PATH = os.path.join(DATA_DIR, "indian_medicine_data.json")

def ensure_db():
    if not os.path.exists(DB_PATH) and os.path.exists(JSON_PATH):
        logging.info("Building medicine_pricing.db from indian_medicine_data.json...")
        try:
            conn = sqlite3.connect(DB_PATH)
            cur = conn.cursor()
            cur.execute("""
                CREATE TABLE IF NOT EXISTS medicines (
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
            with open(JSON_PATH, "r", encoding="utf-8") as f:
                medicines = json.load(f)
            
            rows = []
            for m in medicines:
                raw_id = m.get("id")
                try:
                    med_id = int(raw_id)
                except (ValueError, TypeError):
                    med_id = None
                name = m.get("name", "").strip()
                name_lower = name.lower()
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
            cur.execute("CREATE INDEX IF NOT EXISTS idx_medicines_name_lower ON medicines (name_lower)")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_medicines_comp1 ON medicines (short_composition1)")
            conn.commit()
            conn.close()
            logging.info("Successfully created medicine_pricing.db.")
        except Exception as e:
            logging.error(f"Failed to build medicine_pricing.db: {e}")

def get_db_connection():
    ensure_db()
    if not os.path.exists(DB_PATH):
        return None
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def search_indian_medicines(query, limit=10):
    conn = get_db_connection()
    if not conn:
        return []
    try:
        cur = conn.cursor()
        clean_q = query.strip().lower()
        # 1. Try prefix search first
        cur.execute("""
            SELECT id, name, price, manufacturer_name, pack_size_label, short_composition1, short_composition2
            FROM medicines
            WHERE name_lower LIKE ?
            ORDER BY price ASC
            LIMIT ?
        """, (f"{clean_q}%", limit))
        results = [dict(r) for r in cur.fetchall()]
        
        # 2. If fewer results, search anywhere in name
        if len(results) < limit:
            cur.execute("""
                SELECT id, name, price, manufacturer_name, pack_size_label, short_composition1, short_composition2
                FROM medicines
                WHERE name_lower LIKE ? AND name_lower NOT LIKE ?
                ORDER BY price ASC
                LIMIT ?
            """, (f"%{clean_q}%", f"{clean_q}%", limit - len(results)))
            results.extend([dict(r) for r in cur.fetchall()])
            
        return results
    except Exception as e:
        logging.error(f"Search error: {e}")
        return []
    finally:
        conn.close()

def get_medicine_price_details(medicine_name):
    """
    Finds the best price match for a medicine name in the Indian Medicine Dataset.
    Returns { name, price, manufacturer, packSize, composition, found: True/False }
    """
    conn = get_db_connection()
    if not conn:
        return {"name": medicine_name, "price": 150.0, "found": False}
    try:
        cur = conn.cursor()
        clean = medicine_name.strip()
        clean_lower = clean.lower()
        
        # Strip common dosage suffixes for matching if needed
        # e.g., "Augmentin 625 Duo" -> "augmentin"
        first_token = re.split(r'[\s\(\)\-\+]+', clean_lower)[0] if clean_lower else ""
        
        # 1. Exact match on name
        cur.execute("SELECT * FROM medicines WHERE name_lower = ? LIMIT 1", (clean_lower,))
        row = cur.fetchone()
        if row:
            return {
                "name": row["name"],
                "price": round(float(row["price"]), 2),
                "manufacturer": row["manufacturer_name"],
                "packSize": row["pack_size_label"],
                "composition": f"{row['short_composition1']} {row['short_composition2']}".strip(),
                "found": True
            }
            
        # 2. Prefix match
        cur.execute("SELECT * FROM medicines WHERE name_lower LIKE ? ORDER BY LENGTH(name) ASC LIMIT 1", (f"{clean_lower}%",))
        row = cur.fetchone()
        if row:
            return {
                "name": row["name"],
                "price": round(float(row["price"]), 2),
                "manufacturer": row["manufacturer_name"],
                "packSize": row["pack_size_label"],
                "composition": f"{row['short_composition1']} {row['short_composition2']}".strip(),
                "found": True
            }

        # 3. Substring match on full name
        cur.execute("SELECT * FROM medicines WHERE name_lower LIKE ? ORDER BY price ASC LIMIT 1", (f"%{clean_lower}%",))
        row = cur.fetchone()
        if row:
            return {
                "name": row["name"],
                "price": round(float(row["price"]), 2),
                "manufacturer": row["manufacturer_name"],
                "packSize": row["pack_size_label"],
                "composition": f"{row['short_composition1']} {row['short_composition2']}".strip(),
                "found": True
            }

        # 4. Search by first token (brand keyword)
        if len(first_token) >= 3:
            cur.execute("SELECT * FROM medicines WHERE name_lower LIKE ? ORDER BY price ASC LIMIT 1", (f"%{first_token}%",))
            row = cur.fetchone()
            if row:
                return {
                    "name": row["name"],
                    "price": round(float(row["price"]), 2),
                    "manufacturer": row["manufacturer_name"],
                    "packSize": row["pack_size_label"],
                    "composition": f"{row['short_composition1']} {row['short_composition2']}".strip(),
                    "found": True
                }

        # 5. Search by composition if medicine_name contains active compound (like Paracetamol)
        cur.execute("SELECT * FROM medicines WHERE short_composition1 LIKE ? ORDER BY price ASC LIMIT 1", (f"%{clean_lower}%",))
        row = cur.fetchone()
        if row:
            return {
                "name": row["name"],
                "price": round(float(row["price"]), 2),
                "manufacturer": row["manufacturer_name"],
                "packSize": row["pack_size_label"],
                "composition": f"{row['short_composition1']} {row['short_composition2']}".strip(),
                "found": True
            }

        return {"name": medicine_name, "price": 100.0, "found": False}
    except Exception as e:
        logging.error(f"Error fetching medicine price: {e}")
        return {"name": medicine_name, "price": 100.0, "found": False}
    finally:
        conn.close()
