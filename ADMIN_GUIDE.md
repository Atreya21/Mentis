# Mentis Admin Guide

## 1. How to Update Curiofacts Monthly

### Method A: Using the Admin Dashboard (Recommended)
1. Login with admin credentials: `admin@mentis.com / admin123`
2. Navigate to **Admin Dashboard** from the top menu
3. Click on the **"Manage Curiofacts"** tab
4. Click the **"Publish Fact"** button
5. Fill in the form:
   - **Title**: Your curiofact title
   - **Content**: The full article text (supports multi-line)
   - **Image URL**: (Optional) Upload image to a service like Imgur or use Unsplash links
6. Click **"Publish Curiofact"**

### Method B: Using Python Script (For Bulk Updates)
Create a file `/app/backend/add_curiofact.py`:

```python
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

# Your new curiofact
new_fact = {
    "id": str(uuid.uuid4()),
    "title": "Your Curiofact Title Here",
    "content": """Your multi-line content here.
    
Can include multiple paragraphs.

And mathematical explanations.""",
    "image_url": "https://images.unsplash.com/photo-YOUR-IMAGE-ID",
    "published_at": datetime.now(timezone.utc).isoformat()
}

db.curiofacts.insert_one(new_fact)
print(f"✓ Published: {new_fact['title']}")
client.close()
```

Run: `cd /app/backend && python3 add_curiofact.py`

---

## 2. How to Upload Notes/Resources with Google Drive Links

### Step-by-Step Process:

#### A. Prepare Your Google Drive File
1. Upload your notes/document to Google Drive
2. Right-click the file → **Share** → **Get link**
3. Change permission to **"Anyone with the link can view"**
4. Copy the link (it will look like):
   ```
   https://drive.google.com/file/d/1ABC123XYZ.../view?usp=sharing
   ```

#### B. Add Resource via Admin Dashboard
1. Login as admin: `admin@mentis.com / admin123`
2. Go to **Resource Hub** page
3. Click **"Submit Resource"** button
4. Fill in the form:
   - **Title**: "Linear Algebra Notes - Chapter 1"
   - **Description**: "Comprehensive notes on vector spaces and linear transformations"
   - **Type**: Select "notes" or "book"
   - **Topic**: "Linear Algebra"
   - **URL**: Paste your Google Drive link
5. Since you're admin, approve it immediately in **Admin Dashboard** → **Pending Resources**

#### C. Add Resource as Regular User
1. Login as any user
2. Go to **Resource Hub**
3. Click **"Submit Resource"**
4. Fill the form with your Google Drive link
5. As admin, approve it from **Admin Dashboard** → **Pending Resources**

#### D. Direct Database Method (For Bulk Upload)
Create `/app/backend/add_resource.py`:

```python
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

resources = [
    {
        "id": str(uuid.uuid4()),
        "title": "Calculus I - Complete Notes",
        "description": "Comprehensive calculus notes covering limits, derivatives, and integrals",
        "content_type": "notes",
        "url": "https://drive.google.com/file/d/YOUR-FILE-ID/view",
        "topic": "Calculus",
        "submitted_by": admin['id'],
        "status": "approved",
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Linear Algebra Lecture Series",
        "description": "Video playlist covering eigenvalues, eigenvectors, and matrix decomposition",
        "content_type": "playlist",
        "url": "https://drive.google.com/drive/folders/YOUR-FOLDER-ID",
        "topic": "Linear Algebra",
        "submitted_by": admin['id'],
        "status": "approved",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
]

db.resources.insert_many(resources)
print(f"✓ Added {len(resources)} resources")
client.close()
```

Run: `cd /app/backend && python3 add_resource.py`

---

## 3. How to Track Registered Users

### Method A: View All Users via Python Script
Create `/app/backend/view_users.py`:

```python
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
```

Run: `cd /app/backend && python3 view_users.py`

### Method B: View Matrix Community Registrations
Create `/app/backend/view_matrix_members.py`:

```python
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
```

Run: `cd /app/backend && python3 view_matrix_members.py`

### Method C: Export to CSV
Create `/app/backend/export_users.py`:

```python
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

client.close()
```

Run: `cd /app/backend && python3 export_users.py`

---

## 4. Quick Reference Commands

### Add a New Admin User
```bash
cd /app/backend && python3 << 'EOF'
from pymongo import MongoClient
from dotenv import load_dotenv
from pathlib import Path
import os
from passlib.context import CryptContext
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
client = MongoClient(os.environ['MONGO_URL'])
db = client[os.environ['DB_NAME']]

# Create new admin
new_admin = {
    "id": str(uuid.uuid4()),
    "email": "newemail@example.com",  # Change this
    "password": pwd_context.hash("newpassword123"),  # Change this
    "name": "New Admin Name",  # Change this
    "role": "admin",
    "created_at": datetime.now(timezone.utc).isoformat()
}

db.users.insert_one(new_admin)
print(f"✓ Admin created: {new_admin['email']}")
client.close()
EOF
```

### View Current Stats
```bash
cd /app/backend && python3 << 'EOF'
from pymongo import MongoClient
from dotenv import load_dotenv
from pathlib import Path
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

client = MongoClient(os.environ['MONGO_URL'])
db = client[os.environ['DB_NAME']]

print("\nMENTIS PLATFORM STATISTICS")
print("="*50)
print(f"Total Users: {db.users.count_documents({})}")
print(f"Matrix Members: {db.matrix_registrations.count_documents({})}")
print(f"Resources (Approved): {db.resources.count_documents({'status': 'approved'})}")
print(f"Resources (Pending): {db.resources.count_documents({'status': 'pending'})}")
print(f"Games: {db.games.count_documents({})}")
print(f"Curiofacts: {db.curiofacts.count_documents({})}")
print("="*50 + "\n")

client.close()
EOF
```

---

## 5. Automation Ideas

### Monthly Curiofact Reminder
Set up a cron job or calendar reminder to add new curiofacts monthly.

### Auto-backup User Data
```bash
# Run weekly
cd /app/backend && python3 export_users.py
```

### Monitor Resource Submissions
Check pending resources regularly:
- Login to Admin Dashboard
- Go to "Pending Resources" tab
- Approve/reject submissions

---

## Tips & Best Practices

1. **Google Drive Links**: Always use "Anyone with the link" permission for shared resources
2. **Image URLs**: Use services like Imgur, Unsplash, or Google Drive for curiofact images
3. **Backup**: Export user data monthly for backup purposes
4. **Content Quality**: Review all community-submitted resources before approval
5. **Engagement**: Publish curiofacts weekly or bi-weekly to keep community engaged

---

## Need Help?

- Admin Dashboard: Login at `/admin` route
- Database Access: Use Python scripts in `/app/backend/`
- Logs: Check `/var/log/supervisor/backend.*.log` for any issues
