import firebase_admin
from firebase_admin import credentials, firestore
from src.infrastructure.config.settings import settings

class FirebaseConfig:
    _db = None

    @classmethod
    def get_db(cls):
        if cls._db is None:
            if not firebase_admin._apps:
                # Assuming default credentials (GCP environment)
                firebase_admin.initialize_app()
            
            cls._db = firestore.client()
        return cls._db
