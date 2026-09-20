import os

class Settings:
    PROJECT_NAME: str = "Traffic Control Room Auto-Accident Detection API"
    VERSION: str = "2.0.0"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super_secret_traffic_control_jwt_key_2026_xyz")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./traffic_control.db")

    # Storage paths
    BASE_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    STORAGE_DIR: str = os.path.join(BASE_DIR, "storage")
    UPLOADS_DIR: str = os.path.join(STORAGE_DIR, "uploads")
    ANNOTATED_DIR: str = os.path.join(STORAGE_DIR, "annotated")
    THUMBNAILS_DIR: str = os.path.join(STORAGE_DIR, "thumbnails")
    POSTERS_DIR: str = os.path.join(STORAGE_DIR, "posters")

    # Upload validation
    MAX_UPLOAD_SIZE_BYTES: int = 100 * 1024 * 1024  # 100 MB
    ALLOWED_EXTENSIONS: set = {"mp4", "avi", "mov", "mkv"}

    def __init__(self):
        for path in [self.STORAGE_DIR, self.UPLOADS_DIR, self.ANNOTATED_DIR, self.THUMBNAILS_DIR, self.POSTERS_DIR]:
            os.makedirs(path, exist_ok=True)

settings = Settings()
