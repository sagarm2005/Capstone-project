import os
import logging
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)

def test_connection():
    uri = os.environ.get("MONGODB_URI", "").strip().replace('\r', '')
    db_name = os.environ.get("MONGODB_DB", "medicore").strip().replace('\r', '')
    
    print(f"Testing URI: {uri[:15]}... (masked)")
    
    try:
        print("Creating client...")
        client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        print("Pinging Atlas...")
        client.admin.command('ping')
        print(f"SUCCESS! Connected to Atlas. Collections: {client[db_name].list_collection_names()}")
    except Exception as e:
        print(f"FAILED to connect to Atlas: {e}")
        print("\nPossible fixes:")
        print("1. Run: pip install \"pymongo[srv]\"")
        print("2. Check MongoDB Atlas -> Network Access -> Add Current IP Address")
        print("3. Check if your DB password has special characters that need URL encoding")

if __name__ == "__main__":
    test_connection()
