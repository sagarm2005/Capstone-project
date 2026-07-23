import os
import logging
from pymongo import MongoClient
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
load_dotenv()

def test_local_connection():
    uri = os.environ.get("MONGODB_URI", "mongodb://localhost:27017")
    db_name = os.environ.get("MONGODB_DB", "medicore")
    
    print(f"--- DATABASE CONNECTION TEST ---")
    print(f"Targeting: {uri}")
    
    try:
        # Step 1: Initialize Client
        client = MongoClient(uri, serverSelectionTimeoutMS=2000)
        
        # Step 2: Ping
        client.admin.command('ping')
        print("[PASS] SUCCESS: Python is connected to MongoDB!")
        
        # Step 3: Check Database
        dbs = client.list_database_names()
        print(f"Available Databases: {dbs}")
        
        if db_name in dbs:
            print(f"[PASS] SUCCESS: Found your '{db_name}' database.")
            collections = client[db_name].list_collection_names()
            print(f"Collections in '{db_name}': {collections}")
        else:
            print(f"[WARN] WARNING: '{db_name}' database not found. You might need to run 'python seed.py'.")

    except Exception as e:
        print(f"[FAIL] FAILED: Python could not connect to MongoDB.")
        print(f"Error Details: {e}")
        print("\nPossible Solutions:")
        print("1. Ensure MongoDB Community Server is started on Windows.")
        print("2. Make sure no firewall is blocking port 27017.")

if __name__ == "__main__":
    test_local_connection()
