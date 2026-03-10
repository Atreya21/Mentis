from pymongo import MongoClient
from dotenv import load_dotenv
from pathlib import Path
import os
from datetime import datetime, timezone
import uuid

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = MongoClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Get admin user ID
admin = db.users.find_one({"email": "admin@mentis.com"})

if not admin:
    print("\n✗ Error: Admin user not found!")
    print("Please create an admin account first.\n")
    client.close()
    exit(1)

# ============================================
# EDIT THIS SECTION WITH YOUR NEW RESOURCE
# ============================================

new_resource = {
    "id": str(uuid.uuid4()),
    "title": "Your Resource Title",
    "description": "Description of your resource. What does it cover? Why is it useful?",
    "content_type": "notes",  # Options: notes, playlist, book, article
    "url": "https://drive.google.com/file/d/YOUR-FILE-ID/view",  # Your Google Drive link
    "topic": "Calculus",  # e.g., Calculus, Algebra, Geometry, Statistics, etc.
    "submitted_by": admin['id'],
    "status": "approved",  # Change to "pending" if you want to review it first
    "created_at": datetime.now(timezone.utc).isoformat()
}

# ============================================

db.resources.insert_one(new_resource)
print(f"\n✓ Successfully added resource!")
print(f"\nTitle: {new_resource['title']}")
print(f"Type: {new_resource['content_type']}")
print(f"Topic: {new_resource['topic']}")
print(f"Status: {new_resource['status']}")
print(f"\nView it at: https://mentis-chat-fix.preview.emergentagent.com/resources\n")

client.close()