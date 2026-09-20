import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.core.database import SessionLocal, engine, Base
from backend.app.core.security import hash_password
from backend.app.models.all_models import User

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == "command").first()
        if not user:
            demo_user = User(
                email="command@control.gov",
                username="command",
                hashed_password=hash_password("control123"),
                full_name="Incident Command Officer"
            )
            db.add(demo_user)
            db.commit()
            print("Successfully seeded demo user: username='command', password='control123', email='command@control.gov'")
        else:
            print("Demo user 'command' already exists.")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
