from pymongo import MongoClient
from dotenv import load_dotenv
from pathlib import Path
import os
import csv
from datetime import datetime

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = MongoClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Export regular users
users = list(db.users.find({}, {"_id": 0, "password": 0}))
with open('/app/users_export.csv', 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=['name', 'email', 'role', 'created_at', 'id'])
    writer.writeheader()
    writer.writerows(users)

print("✓ Users exported to /app/users_export.csv")

# Export Matrix members
members = list(db.matrix_registrations.find({}, {"_id": 0}))
with open('/app/matrix_members_export.csv', 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=['name', 'email', 'college', 'interests', 'created_at', 'id'])
    writer.writeheader()
    writer.writerows(members)

print("✓ Matrix members exported to /app/matrix_members_export.csv")
print("\nYou can download these files from the /app directory")

client.close()