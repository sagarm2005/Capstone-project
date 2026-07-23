import os
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import logging

_client = None
_db = None

def get_db():
    global _client, _db
    if _db is not None:
        return _db
    uri = os.environ.get("MONGODB_URI", "").strip().replace('\r', '')
    db_name = os.environ.get("MONGODB_DB", "medicore").strip().replace('\r', '')
    
    if not uri:
        raise ConnectionError("CRITICAL: MONGODB_URI not found in environment. Data persistence is not possible.")

    try:
        _client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        # Force a call to verify connection
        _client.admin.command("ping")
        _db = _client[db_name]
        logging.info(f"Successfully connected to MongoDB Atlas: {db_name}")
    except Exception as e:
        logging.error(f"CRITICAL: Failed to connect to MongoDB Atlas: {e}")
        raise ConnectionError(f"Could not connect to live database: {e}")
        
    return _db

def close_db():
    global _client, _db
    if _client:
        _client.close()
        _client = None
        _db = None

def serialize(doc):
    if doc is None:
        return None
    doc = dict(doc)
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

def serialize_list(docs):
    return [serialize(d) for d in docs]
