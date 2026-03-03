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

# ============================================
# EDIT THIS SECTION WITH YOUR NEW CURIOFACT
# ============================================

new_fact = {
    "id": str(uuid.uuid4()),
    "title": "Your Curiofact Title Here",
    "content": """Write your curiofact content here.

You can use multiple paragraphs.

Include mathematical explanations, examples, and interesting facts.

Make it engaging and educational!""",
    "image_url": "https://images.unsplash.com/photo-YOUR-IMAGE-ID?w=800",  # Optional: leave empty string "" if no image
    "published_at": datetime.now(timezone.utc).isoformat()
}

# ============================================

db.curiofacts.insert_one(new_fact)
print(f"\n✓ Successfully published curiofact!")
print(f"\nTitle: {new_fact['title']}")
print(f"Published at: {datetime.now(timezone.utc).strftime('%B %d, %Y at %H:%M UTC')}")
print(f"\nView it at: https://mentis-dev-1.preview.emergentagent.com/curiofacts\n")

client.close()