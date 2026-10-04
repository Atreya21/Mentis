import os
import uuid
from datetime import datetime, timezone
from pymongo import MongoClient
from passlib.context import CryptContext

MONGO_URL = os.environ.get(
    "MONGO_URL",
    "mongodb+srv://atreyaghoshal_db_user:Atreya4tr3y4@cluster0.iw4iaoy.mongodb.net/mentis_db?retryWrites=true&w=majority&appName=Cluster0"
)
DB_NAME = os.environ.get("DB_NAME", "mentis_db")

client = MongoClient(MONGO_URL)
db = client[DB_NAME]

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

accounts_to_register = [
    {
        "email": "atreyaghoshal.68@gmail.com",
        "name": "Atreya Ghoshal",
        "raw_password": "4tr3y4@54N14",
        "role": "master_admin",
    },
    {
        "email": "atreyaghoshal@gmail.com",
        "name": "Atreya Ghoshal",
        "raw_password": "AG@4tr3y4",
        "role": "admin",
    },
    {
        "email": "shyamaliroyghoshal15@gmail.com",
        "name": "Shyamali Roy Ghoshal",
        "raw_password": "Lava@9434",
        "role": "user",
    }
]

print("=" * 60)
print("REGISTERING USER ACCOUNTS IN MENTIS PRODUCTION DATABASE")
print("=" * 60)

for acc in accounts_to_register:
    email = acc["email"].strip().lower()
    name = acc["name"]
    raw_pwd = acc["raw_password"]
    role = acc["role"]
    
    hashed_password = pwd_context.hash(raw_pwd)
    
    existing = db.users.find_one({"email": email})
    now_iso = datetime.now(timezone.utc).isoformat()
    
    if existing:
        print(f"\nUser {email} already exists. Updating credentials and role...")
        db.users.update_one(
            {"email": email},
            {
                "$set": {
                    "name": name,
                    "password": hashed_password,
                    "role": role,
                    "email_verified": True,
                    "verification_token": None,
                    "verification_token_expires": None
                }
            }
        )
        print(f"✅ Updated {email} (role: {role})")
    else:
        print(f"\nCreating user {email}...")
        user_doc = {
            "id": str(uuid.uuid4()),
            "email": email,
            "name": name,
            "role": role,
            "mentis_score": 0,
            "email_verified": True,
            "verification_token": None,
            "verification_token_expires": None,
            "created_at": now_iso,
            "password": hashed_password
        }
        db.users.insert_one(user_doc)
        print(f"✅ Created {email} (role: {role}, id: {user_doc['id']})")

print("\n" + "=" * 60)
print("CURRENT USERS IN DATABASE:")
print("=" * 60)
all_users = list(db.users.find({}, {"password": 0}))
for u in all_users:
    print(f"- Name: {u.get('name')}, Email: {u.get('email')}, Role: {u.get('role')}, Verified: {u.get('email_verified')}")

client.close()
print("\nDone!")
