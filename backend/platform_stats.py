from pymongo import MongoClient
from dotenv import load_dotenv
from pathlib import Path
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

client = MongoClient(os.environ['MONGO_URL'])
db = client[os.environ['DB_NAME']]

print("\n" + "="*60)
print("           MENTIS PLATFORM STATISTICS")
print("="*60)
print(f"\n👥 Users & Community:")
print(f"   - Total Registered Users: {db.users.count_documents({})}")
print(f"   - Matrix Community Members: {db.matrix_registrations.count_documents({})}")
print(f"   - Partner Colleges: {len(db.matrix_registrations.distinct('college'))}")

print(f"\n📚 Resources:")
print(f"   - Approved Resources: {db.resources.count_documents({'status': 'approved'})}")
print(f"   - Pending Approval: {db.resources.count_documents({'status': 'pending'})}")
print(f"   - Total Submissions: {db.resources.count_documents({})}")

print(f"\n🎮 Content:")
print(f"   - Mathematical Games: {db.games.count_documents({})}")
print(f"   - Published Curiofacts: {db.curiofacts.count_documents({})}")

print("\n" + "="*60 + "\n")

client.close()