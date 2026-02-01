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

# Get all Matrix registrations
members = list(db.matrix_registrations.find({}, {"_id": 0}))

print(f"\n{'='*80}")
print(f"MATRIX COMMUNITY MEMBERS: {len(members)}")
print(f"{'='*80}\n")

for i, member in enumerate(members, 1):
    created_at = datetime.fromisoformat(member['created_at']) if isinstance(member['created_at'], str) else member['created_at']
    print(f"{i}. {member['name']}")
    print(f"   Email: {member['email']}")
    print(f"   College: {member['college']}")
    print(f"   Interests: {member['interests']}")
    print(f"   Joined: {created_at.strftime('%B %d, %Y at %H:%M')}")
    print()

# College statistics
colleges = list(db.matrix_registrations.distinct("college"))
print(f"{'='*80}")
print(f"STATISTICS:")
print(f"  - Total Members: {len(members)}")
print(f"  - Total Colleges: {len(colleges)}")
print(f"\nColleges:")
for college in colleges:
    count = db.matrix_registrations.count_documents({"college": college})
    print(f"  - {college}: {count} member(s)")
print(f"{'='*80}\n")

client.close()