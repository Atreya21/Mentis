from pymongo import MongoClient
from dotenv import load_dotenv
from pathlib import Path
import os
from datetime import datetime

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = MongoClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Get all users
users = list(db.users.find({}, {"_id": 0, "password": 0}))

print(f"\n{'='*80}")
print(f"TOTAL REGISTERED USERS: {len(users)}")
print(f"{'='*80}\n")

for i, user in enumerate(users, 1):
    created_at = datetime.fromisoformat(user['created_at']) if isinstance(user['created_at'], str) else user['created_at']
    print(f"{i}. {user['name']}")
    print(f"   Email: {user['email']}")
    print(f"   Role: {user['role']}")
    print(f"   Joined: {created_at.strftime('%B %d, %Y at %H:%M')}")
    print(f"   User ID: {user['id']}")
    print()

# Statistics
admin_count = len([u for u in users if u['role'] == 'admin'])
user_count = len([u for u in users if u['role'] == 'user'])

print(f"{'='*80}")
print(f"STATISTICS:")
print(f"  - Total Users: {len(users)}")
print(f"  - Admins: {admin_count}")
print(f"  - Regular Users: {user_count}")
print(f"{'='*80}\n")

client.close()