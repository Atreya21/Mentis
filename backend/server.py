from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import re
import json
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
import secrets

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Helper function to convert Google Drive URLs to direct image URLs
def convert_google_drive_url(url: str, for_download: bool = False) -> str:
    if not url:
        return url
    
    file_id = None
    patterns = [
        r'drive\.google\.com/file/d/([a-zA-Z0-9_-]+)',
        r'drive\.google\.com/open\?id=([a-zA-Z0-9_-]+)',
        r'drive\.google\.com/uc\?.*id=([a-zA-Z0-9_-]+)',
        r'drive\.google\.com/thumbnail\?.*id=([a-zA-Z0-9_-]+)',
        r'lh3\.googleusercontent\.com/d/([a-zA-Z0-9_-]+)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            file_id = match.group(1)
            break
    
    if file_id:
        if for_download:
            return f"https://drive.google.com/uc?export=download&id={file_id}"
        else:
            # Use lh3.googleusercontent.com for better image embedding
            return f"https://lh3.googleusercontent.com/d/{file_id}"
    
    return url

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    role: str = "user"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

class Resource(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    content_type: str
    url: str
    topic: str
    submitted_by: Optional[str] = None
    uploader_name: Optional[str] = None
    status: str = "pending"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ResourceCreate(BaseModel):
    title: str
    description: str
    content_type: str
    url: str
    topic: str

class ResourceApprove(BaseModel):
    status: str

class Game(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    url: str
    thumbnail: Optional[str] = None
    difficulty: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class GameCreate(BaseModel):
    title: str
    description: str
    url: str
    thumbnail: Optional[str] = None
    difficulty: str

class Curiofact(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str
    image_url: Optional[str] = None
    published_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CuriofactCreate(BaseModel):
    title: str
    content: str
    image_url: Optional[str] = None

class MatrixRegistration(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    college: str
    interests: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MatrixRegistrationCreate(BaseModel):
    name: str
    email: EmailStr
    college: str
    interests: str

class Stats(BaseModel):
    total_members: int
    total_colleges: int

class SiteSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default="site_settings")
    hero_image_url: str = "https://images.unsplash.com/photo-1741298167028-1e781b6b3bbe?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA4Mzl8MHwxfHNlYXJjaHwyfHxhYnN0cmFjdCUyMG1hdGhlbWF0aWNzJTIwZ2VvbWV0cnklMjBhcnR8ZW58MHx8fHwxNzY5OTM2NzAyfDA&ixlib=rb-4.1.0&q=85"
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SiteSettingsUpdate(BaseModel):
    hero_image_url: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str
    new_password: str

class PasswordResetToken(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    token: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime
    used: bool = False

# Connection/Chat Models
class Connection(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    requester_id: str
    receiver_id: str
    status: str = "pending"  # pending, accepted, rejected
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ConnectionRequest(BaseModel):
    receiver_id: str

class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    connection_id: str
    sender_id: str
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    read: bool = False

class MessageCreate(BaseModel):
    content: str

class UserPublic(BaseModel):
    id: str
    name: str
    email: str
    college: Optional[str] = None
    created_at: datetime

# Like Model for Resources and Curiofacts
class Like(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    target_id: str  # resource_id or curiofact_id
    target_type: str  # 'resource' or 'curiofact'
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Comment Model for Resources and Curiofacts
class Comment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_name: Optional[str] = None
    target_id: str  # resource_id or curiofact_id
    target_type: str  # 'resource' or 'curiofact'
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CommentCreate(BaseModel):
    content: str

# User Report Model
class UserReport(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    reporter_id: str
    reported_user_id: str
    reason: str
    description: str
    status: str = "pending"  # pending, reviewed, resolved
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserReportCreate(BaseModel):
    reported_user_id: str
    reason: str
    description: str

# Reel Model for educational short videos
class Reel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_name: Optional[str] = None
    video_url: str
    video_type: str = "link"  # 'link' (YouTube, Instagram, Drive) or 'upload'
    caption: str
    status: str = "pending"  # pending, approved, rejected
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReelCreate(BaseModel):
    video_url: str
    video_type: str = "link"
    caption: str

# Pinned Chat Model
class PinnedChat(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    connection_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# WebSocket Connection Manager for real-time chat
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
    
    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
    
    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json(message)
    
    async def broadcast_to_users(self, message: dict, user_ids: List[str]):
        for user_id in user_ids:
            if user_id in self.active_connections:
                await self.active_connections[user_id].send_json(message)

manager = ConnectionManager()

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user_doc:
            raise HTTPException(status_code=401, detail="User not found")
        if isinstance(user_doc['created_at'], str):
            user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
        user_doc.pop('password', None)
        return User(**user_doc)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin_user(user: User = Depends(get_current_user)):
    if user.role != "admin" and user.role != "master_admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

async def get_master_admin_user(user: User = Depends(get_current_user)):
    if user.role != "master_admin":
        raise HTTPException(status_code=403, detail="Master Admin access required")
    return user

@api_router.post("/auth/signup", response_model=Token)
async def signup(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = pwd_context.hash(user_data.password)
    user = User(email=user_data.email, name=user_data.name)
    doc = user.model_dump()
    doc['password'] = hashed_password
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    
    token = create_access_token({"sub": user.id})
    return Token(access_token=token, user=user)

@api_router.post("/auth/login", response_model=Token)
async def login(login_data: UserLogin):
    user_doc = await db.users.find_one({"email": login_data.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    stored_password = user_doc.get('password')
    if not stored_password or not pwd_context.verify(login_data.password, stored_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if isinstance(user_doc['created_at'], str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    user_doc.pop('password', None)
    user = User(**user_doc)
    token = create_access_token({"sub": user.id})
    return Token(access_token=token, user=user)

@api_router.get("/auth/me", response_model=User)
async def get_me(user: User = Depends(get_current_user)):
    return user

@api_router.post("/resources", response_model=Resource)
async def create_resource(resource_data: ResourceCreate, user: User = Depends(get_current_user)):
    resource = Resource(**resource_data.model_dump(), submitted_by=user.id)
    doc = resource.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.resources.insert_one(doc)
    return resource

@api_router.get("/resources", response_model=List[Resource])
async def get_resources(status: Optional[str] = None):
    query = {"status": status} if status else {}
    resources = await db.resources.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for r in resources:
        if isinstance(r['created_at'], str):
            r['created_at'] = datetime.fromisoformat(r['created_at'])
        # Get uploader info
        if r.get('submitted_by'):
            uploader = await db.users.find_one({"id": r['submitted_by']}, {"_id": 0, "password": 0})
            if uploader:
                r['uploader_name'] = uploader.get('name', 'Unknown')
            else:
                r['uploader_name'] = 'Unknown'
        else:
            r['uploader_name'] = 'Admin'
    return resources

@api_router.patch("/resources/{resource_id}", response_model=Resource)
async def update_resource_status(resource_id: str, update: ResourceApprove, admin: User = Depends(get_admin_user)):
    # Get the resource first to check current status and get submitter info
    existing_resource = await db.resources.find_one({"id": resource_id}, {"_id": 0})
    if not existing_resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    was_pending = existing_resource.get('status') == 'pending'
    
    result = await db.resources.find_one_and_update(
        {"id": resource_id},
        {"$set": {"status": update.status}},
        return_document=True
    )
    result.pop('_id', None)
    if isinstance(result['created_at'], str):
        result['created_at'] = datetime.fromisoformat(result['created_at'])
    
    # Send approval email if resource was pending and is now approved
    if was_pending and update.status == 'approved':
        submitter_id = existing_resource.get('submitted_by')
        if submitter_id:
            submitter = await db.users.find_one({"id": submitter_id}, {"_id": 0})
            if submitter and submitter.get('email'):
                await send_resource_approval_email(
                    user_email=submitter['email'],
                    user_name=submitter.get('name', 'Mentis User'),
                    resource_title=existing_resource.get('title', 'Your Resource')
                )
    
    return Resource(**result)

@api_router.get("/games", response_model=List[Game])
async def get_games():
    games = await db.games.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for g in games:
        if isinstance(g['created_at'], str):
            g['created_at'] = datetime.fromisoformat(g['created_at'])
    return games

@api_router.post("/games", response_model=Game)
async def create_game(game_data: GameCreate, admin: User = Depends(get_admin_user)):
    game_dict = game_data.model_dump()
    # Convert Google Drive URL for thumbnail
    if game_dict.get('thumbnail'):
        game_dict['thumbnail'] = convert_google_drive_url(game_dict['thumbnail'], for_download=False)
    game = Game(**game_dict)
    doc = game.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.games.insert_one(doc)
    return game

@api_router.get("/curiofacts", response_model=List[Curiofact])
async def get_curiofacts():
    facts = await db.curiofacts.find({}, {"_id": 0}).sort("published_at", -1).to_list(1000)
    for f in facts:
        if isinstance(f['published_at'], str):
            f['published_at'] = datetime.fromisoformat(f['published_at'])
    return facts

@api_router.post("/curiofacts", response_model=Curiofact)
async def create_curiofact(fact_data: CuriofactCreate, admin: User = Depends(get_admin_user)):
    fact_dict = fact_data.model_dump()
    # Convert Google Drive URL for image
    if fact_dict.get('image_url'):
        fact_dict['image_url'] = convert_google_drive_url(fact_dict['image_url'], for_download=False)
    fact = Curiofact(**fact_dict)
    doc = fact.model_dump()
    doc['published_at'] = doc['published_at'].isoformat()
    await db.curiofacts.insert_one(doc)
    return fact

@api_router.post("/matrix/register", response_model=MatrixRegistration)
async def register_matrix(registration_data: MatrixRegistrationCreate):
    existing = await db.matrix_registrations.find_one({"email": registration_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    registration = MatrixRegistration(**registration_data.model_dump())
    doc = registration.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.matrix_registrations.insert_one(doc)
    return registration

@api_router.get("/matrix/stats", response_model=Stats)
async def get_matrix_stats():
    total_members = await db.matrix_registrations.count_documents({})
    colleges = await db.matrix_registrations.distinct("college")
    return Stats(total_members=total_members, total_colleges=len(colleges))

@api_router.get("/admin/users", response_model=List[User])
async def get_all_users(admin: User = Depends(get_admin_user)):
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    for user in users:
        if isinstance(user['created_at'], str):
            user['created_at'] = datetime.fromisoformat(user['created_at'])
    return users

@api_router.get("/admin/matrix-members", response_model=List[MatrixRegistration])
async def get_all_matrix_members(admin: User = Depends(get_admin_user)):
    members = await db.matrix_registrations.find({}, {"_id": 0}).to_list(1000)
    for member in members:
        if isinstance(member['created_at'], str):
            member['created_at'] = datetime.fromisoformat(member['created_at'])
    return members

@api_router.patch("/admin/promote-user/{user_id}")
async def promote_user_to_admin(user_id: str, admin: User = Depends(get_admin_user)):
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"role": "admin"}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found or already admin")
    return {"message": "User promoted to admin successfully"}

@api_router.post("/admin/create-resource", response_model=Resource)
async def admin_create_resource(resource_data: ResourceCreate, admin: User = Depends(get_admin_user)):
    resource = Resource(**resource_data.model_dump(), submitted_by=admin.id, status="approved")
    doc = resource.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.resources.insert_one(doc)
    return resource

@api_router.delete("/admin/delete-resource/{resource_id}")
async def delete_resource(resource_id: str, admin: User = Depends(get_admin_user)):
    result = await db.resources.delete_one({"id": resource_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Resource not found")
    return {"message": "Resource deleted successfully"}

@api_router.delete("/admin/delete-game/{game_id}")
async def delete_game(game_id: str, admin: User = Depends(get_admin_user)):
    result = await db.games.delete_one({"id": game_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Game not found")
    return {"message": "Game deleted successfully"}

@api_router.delete("/admin/delete-curiofact/{fact_id}")
async def delete_curiofact(fact_id: str, admin: User = Depends(get_admin_user)):
    result = await db.curiofacts.delete_one({"id": fact_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Curiofact not found")
    return {"message": "Curiofact deleted successfully"}

@api_router.delete("/admin/delete-user/{user_id}")
async def delete_user(user_id: str, admin: User = Depends(get_admin_user)):
    # Prevent admin from deleting themselves
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    # Check if user exists
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Delete the user
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": f"User {user.get('email', '')} deleted successfully"}

@api_router.delete("/admin/delete-matrix-member/{member_id}")
async def delete_matrix_member(member_id: str, admin: User = Depends(get_admin_user)):
    result = await db.matrix_registrations.delete_one({"id": member_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Matrix member not found")
    return {"message": "Matrix member removed successfully"}

@api_router.get("/admin/export-users-csv")
async def export_users_csv(admin: User = Depends(get_admin_user)):
    from fastapi.responses import StreamingResponse
    import io
    import csv
    
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=['id', 'name', 'email', 'role', 'created_at'])
    writer.writeheader()
    
    for user in users:
        writer.writerow({
            'id': user.get('id', ''),
            'name': user.get('name', ''),
            'email': user.get('email', ''),
            'role': user.get('role', ''),
            'created_at': user.get('created_at', '')
        })
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=mentis_users.csv"}
    )

@api_router.get("/admin/export-matrix-csv")
async def export_matrix_csv(admin: User = Depends(get_admin_user)):
    from fastapi.responses import StreamingResponse
    import io
    import csv
    
    members = await db.matrix_registrations.find({}, {"_id": 0}).to_list(1000)
    
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=['id', 'name', 'email', 'college', 'interests', 'created_at'])
    writer.writeheader()
    
    for member in members:
        writer.writerow({
            'id': member.get('id', ''),
            'name': member.get('name', ''),
            'email': member.get('email', ''),
            'college': member.get('college', ''),
            'interests': member.get('interests', ''),
            'created_at': member.get('created_at', '')
        })
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=mentis_matrix_members.csv"}
    )

@api_router.get("/site-settings", response_model=SiteSettings)
async def get_site_settings():
    settings = await db.site_settings.find_one({"id": "site_settings"}, {"_id": 0})
    if not settings:
        # Create default settings if not exist
        default_settings = SiteSettings()
        doc = default_settings.model_dump()
        doc['updated_at'] = doc['updated_at'].isoformat()
        await db.site_settings.insert_one(doc)
        return default_settings
    
    if isinstance(settings['updated_at'], str):
        settings['updated_at'] = datetime.fromisoformat(settings['updated_at'])
    return SiteSettings(**settings)

@api_router.patch("/admin/site-settings", response_model=SiteSettings)
async def update_site_settings(settings_update: SiteSettingsUpdate, admin: User = Depends(get_admin_user)):
    # Convert Google Drive URL for hero image
    hero_image_url = convert_google_drive_url(settings_update.hero_image_url, for_download=False)
    
    update_data = {
        "hero_image_url": hero_image_url,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.site_settings.update_one(
        {"id": "site_settings"},
        {"$set": update_data},
        upsert=True
    )
    
    settings = await db.site_settings.find_one({"id": "site_settings"}, {"_id": 0})
    if isinstance(settings['updated_at'], str):
        settings['updated_at'] = datetime.fromisoformat(settings['updated_at'])
    return SiteSettings(**settings)

@api_router.post("/auth/forgot-password")
async def forgot_password(request: PasswordResetRequest):
    user = await db.users.find_one({"email": request.email}, {"_id": 0})
    
    # Always return success message (don't reveal if email exists)
    success_message = {"message": "If your email is registered, you will receive a password reset link shortly"}
    
    if not user:
        return success_message
    
    # Generate secure token
    reset_token = secrets.token_urlsafe(32)
    
    # Create reset token document
    token_doc = {
        "id": str(uuid.uuid4()),
        "email": request.email,
        "token": reset_token,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
        "used": False
    }
    
    await db.password_reset_tokens.insert_one(token_doc)
    
    # Send email with reset link
    reset_link = f"{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/reset-password?token={reset_token}"
    
    try:
        # Check if SendGrid is configured
        sendgrid_api_key = os.environ.get('SENDGRID_API_KEY')
        from_email = os.environ.get('FROM_EMAIL', 'noreply@mentis.com')
        
        if sendgrid_api_key:
            from sendgrid import SendGridAPIClient
            from sendgrid.helpers.mail import Mail, Email, To, Content
            
            message = Mail(
                from_email=Email(from_email),
                to_emails=To(request.email),
                subject='Reset Your Mentis Password',
                html_content=f'''
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #f97316;">Reset Your Password</h2>
                    <p>Hi there,</p>
                    <p>You recently requested to reset your password for your Mentis account. Click the button below to reset it:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{reset_link}" style="background: linear-gradient(to right, #f97316, #ec4899); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block;">Reset Password</a>
                    </div>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="color: #64748b; word-break: break-all;">{reset_link}</p>
                    <p><strong>This link will expire in 1 hour.</strong></p>
                    <p>If you didn't request a password reset, you can safely ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                    <p style="color: #64748b; font-size: 12px;">Mentis - Mathematics Community Platform</p>
                </div>
                '''
            )
            
            sg = SendGridAPIClient(sendgrid_api_key)
            response = sg.send(message)
            logger.info(f"Password reset email sent to {request.email}, status: {response.status_code}")
        else:
            # Log for admin to manually share (development mode)
            logger.warning(f"SendGrid not configured. Reset link for {request.email}: {reset_link}")
            
    except Exception as e:
        logger.error(f"Failed to send password reset email: {str(e)}")
        # Don't reveal error to user for security
    
    return success_message

@api_router.post("/auth/reset-password")
async def reset_password(reset_data: PasswordReset):
    # Find valid token
    token_doc = await db.password_reset_tokens.find_one({
        "token": reset_data.token,
        "used": False
    }, {"_id": 0})
    
    if not token_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    # Check if token is expired
    expires_at = datetime.fromisoformat(token_doc['expires_at']) if isinstance(token_doc['expires_at'], str) else token_doc['expires_at']
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Reset token has expired")
    
    # Update user password
    hashed_password = pwd_context.hash(reset_data.new_password)
    result = await db.users.update_one(
        {"email": token_doc['email']},
        {"$set": {"password": hashed_password}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Mark token as used
    await db.password_reset_tokens.update_one(
        {"token": reset_data.token},
        {"$set": {"used": True}}
    )
    
    return {"message": "Password reset successfully"}

@api_router.get("/admin/password-reset-tokens")
async def get_password_reset_tokens(admin: User = Depends(get_admin_user)):
    tokens = await db.password_reset_tokens.find(
        {"used": False},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    
    for token in tokens:
        if isinstance(token.get('created_at'), str):
            token['created_at'] = datetime.fromisoformat(token['created_at'])
        if isinstance(token.get('expires_at'), str):
            token['expires_at'] = datetime.fromisoformat(token['expires_at'])
    
    return tokens

# ============== CONNECT FEATURE - User Discovery & Chat ==============

@api_router.get("/users/search")
async def search_users(
    q: Optional[str] = None,
    college: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Search users by name, email, or college"""
    query = {"id": {"$ne": current_user.id}}  # Exclude current user
    
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"email": {"$regex": q, "$options": "i"}}
        ]
    
    if college:
        query["college"] = {"$regex": college, "$options": "i"}
    
    users = await db.users.find(query, {"_id": 0, "password": 0}).limit(50).to_list(50)
    
    # Get connection status for each user
    for user in users:
        if isinstance(user.get('created_at'), str):
            user['created_at'] = datetime.fromisoformat(user['created_at'])
        
        # Check if there's an existing connection
        connection = await db.connections.find_one({
            "$or": [
                {"requester_id": current_user.id, "receiver_id": user['id']},
                {"requester_id": user['id'], "receiver_id": current_user.id}
            ]
        }, {"_id": 0})
        
        if connection:
            user['connection_status'] = connection['status']
            user['connection_id'] = connection['id']
            user['is_requester'] = connection['requester_id'] == current_user.id
        else:
            user['connection_status'] = None
            user['connection_id'] = None
            user['is_requester'] = None
    
    return users

@api_router.get("/users/colleges")
async def get_colleges(current_user: User = Depends(get_current_user)):
    """Get list of unique colleges for filtering"""
    colleges = await db.users.distinct("college")
    return [c for c in colleges if c]  # Filter out None/empty

@api_router.get("/users/{user_id}/profile")
async def get_user_profile(user_id: str, current_user: User = Depends(get_current_user)):
    """Get detailed profile of a user including stats"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if isinstance(user.get('created_at'), str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    # Count approved resources submitted by this user
    resources_count = await db.resources.count_documents({
        "submitted_by": user_id,
        "status": "approved"
    })
    user['resources_count'] = resources_count
    
    # Count total resources (including pending)
    total_resources = await db.resources.count_documents({
        "submitted_by": user_id
    })
    user['total_resources'] = total_resources
    
    # Count connections
    connections_count = await db.connections.count_documents({
        "$or": [
            {"requester_id": user_id},
            {"receiver_id": user_id}
        ],
        "status": "accepted"
    })
    user['connections_count'] = connections_count
    
    # Check connection status with current user
    connection = await db.connections.find_one({
        "$or": [
            {"requester_id": current_user.id, "receiver_id": user_id},
            {"requester_id": user_id, "receiver_id": current_user.id}
        ]
    }, {"_id": 0})
    
    if connection:
        user['connection_status'] = connection['status']
        user['connection_id'] = connection['id']
        user['is_requester'] = connection['requester_id'] == current_user.id
    else:
        user['connection_status'] = None
        user['connection_id'] = None
        user['is_requester'] = None
    
    return user

@api_router.post("/connections/request")
async def send_connection_request(request: ConnectionRequest, current_user: User = Depends(get_current_user)):
    """Send a connection request to another user"""
    if request.receiver_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot send connection request to yourself")
    
    # Check if receiver exists
    receiver = await db.users.find_one({"id": request.receiver_id}, {"_id": 0})
    if not receiver:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if connection already exists
    existing = await db.connections.find_one({
        "$or": [
            {"requester_id": current_user.id, "receiver_id": request.receiver_id},
            {"requester_id": request.receiver_id, "receiver_id": current_user.id}
        ]
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Connection already exists")
    
    connection = Connection(
        requester_id=current_user.id,
        receiver_id=request.receiver_id
    )
    
    doc = connection.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.connections.insert_one(doc)
    
    # Notify receiver via WebSocket if online
    await manager.send_personal_message({
        "type": "connection_request",
        "from_user": {"id": current_user.id, "name": current_user.name},
        "connection_id": connection.id
    }, request.receiver_id)
    
    return {"message": "Connection request sent", "connection_id": connection.id}

@api_router.post("/connections/{connection_id}/accept")
async def accept_connection(connection_id: str, current_user: User = Depends(get_current_user)):
    """Accept a connection request"""
    connection = await db.connections.find_one({"id": connection_id}, {"_id": 0})
    
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    if connection['receiver_id'] != current_user.id:
        raise HTTPException(status_code=403, detail="Only the receiver can accept this request")
    
    if connection['status'] != 'pending':
        raise HTTPException(status_code=400, detail="Connection is not pending")
    
    await db.connections.update_one(
        {"id": connection_id},
        {"$set": {"status": "accepted", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Notify requester via WebSocket
    await manager.send_personal_message({
        "type": "connection_accepted",
        "from_user": {"id": current_user.id, "name": current_user.name},
        "connection_id": connection_id
    }, connection['requester_id'])
    
    return {"message": "Connection accepted"}

@api_router.post("/connections/{connection_id}/reject")
async def reject_connection(connection_id: str, current_user: User = Depends(get_current_user)):
    """Reject a connection request"""
    connection = await db.connections.find_one({"id": connection_id}, {"_id": 0})
    
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    if connection['receiver_id'] != current_user.id:
        raise HTTPException(status_code=403, detail="Only the receiver can reject this request")
    
    if connection['status'] != 'pending':
        raise HTTPException(status_code=400, detail="Connection is not pending")
    
    await db.connections.update_one(
        {"id": connection_id},
        {"$set": {"status": "rejected", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Connection rejected"}

@api_router.delete("/connections/{connection_id}")
async def remove_connection(connection_id: str, current_user: User = Depends(get_current_user)):
    """Remove an existing connection"""
    connection = await db.connections.find_one({"id": connection_id}, {"_id": 0})
    
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    if connection['requester_id'] != current_user.id and connection['receiver_id'] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to remove this connection")
    
    await db.connections.delete_one({"id": connection_id})
    # Also delete all messages in this connection
    await db.messages.delete_many({"connection_id": connection_id})
    
    return {"message": "Connection removed"}

@api_router.get("/connections")
async def get_connections(current_user: User = Depends(get_current_user)):
    """Get all accepted connections for current user"""
    connections = await db.connections.find({
        "$or": [
            {"requester_id": current_user.id},
            {"receiver_id": current_user.id}
        ],
        "status": "accepted"
    }, {"_id": 0}).to_list(100)
    
    # Enrich with user details
    for conn in connections:
        if isinstance(conn.get('created_at'), str):
            conn['created_at'] = datetime.fromisoformat(conn['created_at'])
        if isinstance(conn.get('updated_at'), str):
            conn['updated_at'] = datetime.fromisoformat(conn['updated_at'])
        
        # Get the other user's details
        other_user_id = conn['receiver_id'] if conn['requester_id'] == current_user.id else conn['requester_id']
        other_user = await db.users.find_one({"id": other_user_id}, {"_id": 0, "password": 0})
        conn['other_user'] = other_user
        
        # Get last message
        last_message = await db.messages.find_one(
            {"connection_id": conn['id']},
            {"_id": 0}
        )
        if last_message:
            conn['last_message'] = last_message
        
        # Count unread messages
        unread_count = await db.messages.count_documents({
            "connection_id": conn['id'],
            "sender_id": {"$ne": current_user.id},
            "read": False
        })
        conn['unread_count'] = unread_count
    
    return connections

@api_router.get("/connections/pending")
async def get_pending_requests(current_user: User = Depends(get_current_user)):
    """Get pending connection requests received by current user"""
    connections = await db.connections.find({
        "receiver_id": current_user.id,
        "status": "pending"
    }, {"_id": 0}).to_list(50)
    
    # Enrich with requester details
    for conn in connections:
        if isinstance(conn.get('created_at'), str):
            conn['created_at'] = datetime.fromisoformat(conn['created_at'])
        requester = await db.users.find_one({"id": conn['requester_id']}, {"_id": 0, "password": 0})
        conn['requester'] = requester
    
    return connections

@api_router.get("/connections/sent")
async def get_sent_requests(current_user: User = Depends(get_current_user)):
    """Get pending connection requests sent by current user"""
    connections = await db.connections.find({
        "requester_id": current_user.id,
        "status": "pending"
    }, {"_id": 0}).to_list(50)
    
    # Enrich with receiver details
    for conn in connections:
        if isinstance(conn.get('created_at'), str):
            conn['created_at'] = datetime.fromisoformat(conn['created_at'])
        receiver = await db.users.find_one({"id": conn['receiver_id']}, {"_id": 0, "password": 0})
        conn['receiver'] = receiver
    
    return connections

@api_router.get("/messages/{connection_id}")
async def get_messages(connection_id: str, current_user: User = Depends(get_current_user)):
    """Get all messages for a connection"""
    # Verify user is part of this connection
    connection = await db.connections.find_one({"id": connection_id}, {"_id": 0})
    
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    if connection['requester_id'] != current_user.id and connection['receiver_id'] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view these messages")
    
    if connection['status'] != 'accepted':
        raise HTTPException(status_code=400, detail="Connection is not accepted")
    
    messages = await db.messages.find(
        {"connection_id": connection_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(500)
    
    for msg in messages:
        if isinstance(msg.get('created_at'), str):
            msg['created_at'] = datetime.fromisoformat(msg['created_at'])
    
    # Mark messages as read
    await db.messages.update_many(
        {"connection_id": connection_id, "sender_id": {"$ne": current_user.id}, "read": False},
        {"$set": {"read": True}}
    )
    
    return messages

@api_router.post("/messages/{connection_id}")
async def send_message(connection_id: str, message: MessageCreate, current_user: User = Depends(get_current_user)):
    """Send a message in a connection"""
    # Verify user is part of this connection
    connection = await db.connections.find_one({"id": connection_id}, {"_id": 0})
    
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    if connection['requester_id'] != current_user.id and connection['receiver_id'] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to send messages here")
    
    if connection['status'] != 'accepted':
        raise HTTPException(status_code=400, detail="Connection is not accepted")
    
    new_message = Message(
        connection_id=connection_id,
        sender_id=current_user.id,
        content=message.content
    )
    
    doc = new_message.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.messages.insert_one(doc)
    
    # Notify the other user via WebSocket
    other_user_id = connection['receiver_id'] if connection['requester_id'] == current_user.id else connection['requester_id']
    await manager.send_personal_message({
        "type": "new_message",
        "message": {
            "id": new_message.id,
            "connection_id": connection_id,
            "sender_id": current_user.id,
            "sender_name": current_user.name,
            "content": message.content,
            "created_at": doc['created_at']
        }
    }, other_user_id)
    
    return {"message": "Message sent", "id": new_message.id}

# ============== LIKE & COMMENT FEATURE ==============

@api_router.post("/{target_type}/{target_id}/like")
async def like_content(target_type: str, target_id: str, current_user: User = Depends(get_current_user)):
    """Like a resource or curiofact"""
    if target_type not in ['resources', 'curiofacts']:
        raise HTTPException(status_code=400, detail="Invalid target type")
    
    # Check if already liked
    existing = await db.likes.find_one({
        "user_id": current_user.id,
        "target_id": target_id,
        "target_type": target_type
    })
    
    if existing:
        # Unlike - remove the like
        await db.likes.delete_one({"id": existing['id']})
        return {"message": "Like removed", "liked": False}
    
    # Create new like
    like = Like(
        user_id=current_user.id,
        target_id=target_id,
        target_type=target_type
    )
    doc = like.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.likes.insert_one(doc)
    
    return {"message": "Content liked", "liked": True}

@api_router.get("/{target_type}/{target_id}/likes")
async def get_likes(target_type: str, target_id: str):
    """Get all likes for a resource or curiofact"""
    if target_type not in ['resources', 'curiofacts']:
        raise HTTPException(status_code=400, detail="Invalid target type")
    
    likes = await db.likes.find({
        "target_id": target_id,
        "target_type": target_type
    }, {"_id": 0}).to_list(1000)
    
    # Enrich with user details
    for like in likes:
        user = await db.users.find_one({"id": like['user_id']}, {"_id": 0, "password": 0})
        if user:
            like['user_name'] = user.get('name', 'Unknown')
    
    return {"count": len(likes), "likes": likes}

@api_router.post("/{target_type}/{target_id}/comment")
async def add_comment(target_type: str, target_id: str, comment_data: CommentCreate, current_user: User = Depends(get_current_user)):
    """Add a comment to a resource or curiofact"""
    if target_type not in ['resources', 'curiofacts']:
        raise HTTPException(status_code=400, detail="Invalid target type")
    
    comment = Comment(
        user_id=current_user.id,
        user_name=current_user.name,
        target_id=target_id,
        target_type=target_type,
        content=comment_data.content
    )
    doc = comment.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.comments.insert_one(doc)
    
    return {"message": "Comment added", "comment_id": comment.id}

@api_router.get("/{target_type}/{target_id}/comments")
async def get_comments(target_type: str, target_id: str):
    """Get all comments for a resource or curiofact"""
    if target_type not in ['resources', 'curiofacts']:
        raise HTTPException(status_code=400, detail="Invalid target type")
    
    comments = await db.comments.find({
        "target_id": target_id,
        "target_type": target_type
    }, {"_id": 0}).sort("created_at", -1).to_list(500)
    
    for c in comments:
        if isinstance(c.get('created_at'), str):
            c['created_at'] = datetime.fromisoformat(c['created_at'])
    
    return comments

@api_router.delete("/comments/{comment_id}")
async def delete_comment(comment_id: str, current_user: User = Depends(get_current_user)):
    """Delete own comment or admin can delete any comment"""
    comment = await db.comments.find_one({"id": comment_id}, {"_id": 0})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    if comment['user_id'] != current_user.id and current_user.role not in ['admin', 'master_admin']:
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")
    
    await db.comments.delete_one({"id": comment_id})
    return {"message": "Comment deleted"}

# ============== USER REPORT FEATURE ==============

@api_router.post("/users/{user_id}/report")
async def report_user(user_id: str, report_data: UserReportCreate, current_user: User = Depends(get_current_user)):
    """Report a user for misconduct"""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot report yourself")
    
    # Check if user exists
    reported_user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not reported_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    report = UserReport(
        reporter_id=current_user.id,
        reported_user_id=user_id,
        reason=report_data.reason,
        description=report_data.description
    )
    doc = report.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.user_reports.insert_one(doc)
    
    # Send email notification to admin
    try:
        sendgrid_api_key = os.environ.get('SENDGRID_API_KEY')
        admin_email = os.environ.get('FROM_EMAIL', 'mentis.mathematics@gmail.com')
        
        if sendgrid_api_key:
            from sendgrid import SendGridAPIClient
            from sendgrid.helpers.mail import Mail, Email, To
            
            reporter = await db.users.find_one({"id": current_user.id}, {"_id": 0})
            
            message = Mail(
                from_email=Email(admin_email),
                to_emails=To(admin_email),
                subject=f'🚨 User Report: {reported_user.get("name", "Unknown")} - Mentis',
                html_content=f'''
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; padding: 30px; border-radius: 10px;">
                    <h2 style="color: #ef4444; margin-bottom: 20px;">New User Report 🚨</h2>
                    <p style="color: #e2e8f0;"><strong>Reported User:</strong> {reported_user.get("name", "Unknown")} ({reported_user.get("email", "Unknown")})</p>
                    <p style="color: #e2e8f0;"><strong>Reported By:</strong> {reporter.get("name", "Unknown") if reporter else "Unknown"}</p>
                    <p style="color: #e2e8f0;"><strong>Reason:</strong> {report_data.reason}</p>
                    <p style="color: #e2e8f0;"><strong>Description:</strong> {report_data.description}</p>
                    <hr style="border: none; border-top: 1px solid #374151; margin: 20px 0;">
                    <p style="color: #64748b; font-size: 12px;">Please review this report in the Admin Dashboard.</p>
                </div>
                '''
            )
            
            sg = SendGridAPIClient(sendgrid_api_key)
            sg.send(message)
    except Exception as e:
        logger.error(f"Failed to send report notification email: {str(e)}")
    
    return {"message": "Report submitted successfully", "report_id": report.id}

@api_router.get("/admin/reports")
async def get_user_reports(admin: User = Depends(get_admin_user)):
    """Get all user reports (admin only)"""
    reports = await db.user_reports.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    
    for report in reports:
        if isinstance(report.get('created_at'), str):
            report['created_at'] = datetime.fromisoformat(report['created_at'])
        
        # Enrich with user details
        reporter = await db.users.find_one({"id": report['reporter_id']}, {"_id": 0, "password": 0})
        reported = await db.users.find_one({"id": report['reported_user_id']}, {"_id": 0, "password": 0})
        report['reporter'] = reporter
        report['reported_user'] = reported
    
    return reports

@api_router.patch("/admin/reports/{report_id}")
async def update_report_status(report_id: str, status: str, admin: User = Depends(get_admin_user)):
    """Update report status (admin only)"""
    if status not in ['pending', 'reviewed', 'resolved']:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.user_reports.update_one(
        {"id": report_id},
        {"$set": {"status": status}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Report not found")
    
    return {"message": f"Report status updated to {status}"}

# ============== REELS FEATURE ==============

def convert_video_url(url: str) -> dict:
    """Convert video URLs from various platforms to embeddable format"""
    result = {"url": url, "platform": "direct", "embed_url": url}
    
    # YouTube
    youtube_patterns = [
        r'youtube\.com/watch\?v=([a-zA-Z0-9_-]+)',
        r'youtu\.be/([a-zA-Z0-9_-]+)',
        r'youtube\.com/shorts/([a-zA-Z0-9_-]+)',
    ]
    for pattern in youtube_patterns:
        match = re.search(pattern, url)
        if match:
            video_id = match.group(1)
            result['platform'] = 'youtube'
            result['embed_url'] = f'https://www.youtube.com/embed/{video_id}'
            return result
    
    # Instagram
    instagram_patterns = [
        r'instagram\.com/reel/([a-zA-Z0-9_-]+)',
        r'instagram\.com/p/([a-zA-Z0-9_-]+)',
    ]
    for pattern in instagram_patterns:
        match = re.search(pattern, url)
        if match:
            result['platform'] = 'instagram'
            result['embed_url'] = url + '/embed'
            return result
    
    # Google Drive
    drive_pattern = r'drive\.google\.com/file/d/([a-zA-Z0-9_-]+)'
    match = re.search(drive_pattern, url)
    if match:
        file_id = match.group(1)
        result['platform'] = 'googledrive'
        result['embed_url'] = f'https://drive.google.com/file/d/{file_id}/preview'
        return result
    
    return result

@api_router.post("/reels", response_model=dict)
async def create_reel(reel_data: ReelCreate, current_user: User = Depends(get_current_user)):
    """Create a new reel (educational short video)"""
    video_info = convert_video_url(reel_data.video_url)
    
    reel = Reel(
        user_id=current_user.id,
        user_name=current_user.name,
        video_url=video_info['embed_url'],
        video_type=video_info['platform'],
        caption=reel_data.caption
    )
    doc = reel.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['original_url'] = reel_data.video_url
    await db.reels.insert_one(doc)
    
    return {"message": "Reel submitted for approval", "reel_id": reel.id}

@api_router.get("/reels")
async def get_reels(status: Optional[str] = "approved", current_user: User = Depends(get_current_user)):
    """Get all approved reels or pending (for submitter)"""
    query = {"status": status}
    
    reels = await db.reels.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    
    for reel in reels:
        if isinstance(reel.get('created_at'), str):
            reel['created_at'] = datetime.fromisoformat(reel['created_at'])
        
        # Get like count
        like_count = await db.likes.count_documents({
            "target_id": reel['id'],
            "target_type": "reels"
        })
        reel['like_count'] = like_count
        
        # Check if current user liked
        user_liked = await db.likes.find_one({
            "user_id": current_user.id,
            "target_id": reel['id'],
            "target_type": "reels"
        })
        reel['user_liked'] = user_liked is not None
    
    return reels

@api_router.get("/reels/pending")
async def get_pending_reels(admin: User = Depends(get_admin_user)):
    """Get all pending reels (admin only)"""
    reels = await db.reels.find({"status": "pending"}, {"_id": 0}).sort("created_at", -1).to_list(500)
    
    for reel in reels:
        if isinstance(reel.get('created_at'), str):
            reel['created_at'] = datetime.fromisoformat(reel['created_at'])
    
    return reels

@api_router.patch("/admin/reels/{reel_id}")
async def update_reel_status(reel_id: str, status: str, admin: User = Depends(get_admin_user)):
    """Update reel status (admin only)"""
    if status not in ['pending', 'approved', 'rejected']:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.reels.update_one(
        {"id": reel_id},
        {"$set": {"status": status}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Reel not found")
    
    return {"message": f"Reel status updated to {status}"}

@api_router.delete("/admin/reels/{reel_id}")
async def delete_reel(reel_id: str, admin: User = Depends(get_admin_user)):
    """Delete a reel (admin only)"""
    result = await db.reels.delete_one({"id": reel_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Reel not found")
    return {"message": "Reel deleted"}

# Like a reel
@api_router.post("/reels/{reel_id}/like")
async def like_reel(reel_id: str, current_user: User = Depends(get_current_user)):
    """Like or unlike a reel"""
    existing = await db.likes.find_one({
        "user_id": current_user.id,
        "target_id": reel_id,
        "target_type": "reels"
    })
    
    if existing:
        await db.likes.delete_one({"id": existing['id']})
        return {"message": "Like removed", "liked": False}
    
    like = Like(
        user_id=current_user.id,
        target_id=reel_id,
        target_type="reels"
    )
    doc = like.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.likes.insert_one(doc)
    
    return {"message": "Reel liked", "liked": True}

# ============== ENHANCED CHAT FEATURES ==============

@api_router.delete("/messages/{message_id}")
async def delete_message(message_id: str, current_user: User = Depends(get_current_user)):
    """Delete a specific message"""
    message = await db.messages.find_one({"id": message_id}, {"_id": 0})
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    if message['sender_id'] != current_user.id:
        raise HTTPException(status_code=403, detail="Can only delete your own messages")
    
    await db.messages.delete_one({"id": message_id})
    
    return {"message": "Message deleted"}

@api_router.delete("/connections/{connection_id}/messages")
async def clear_chat_history(connection_id: str, current_user: User = Depends(get_current_user)):
    """Clear all messages in a connection (for current user's view)"""
    connection = await db.connections.find_one({"id": connection_id}, {"_id": 0})
    
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    if connection['requester_id'] != current_user.id and connection['receiver_id'] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Delete all messages in this connection
    await db.messages.delete_many({"connection_id": connection_id})
    
    return {"message": "Chat history cleared"}

@api_router.patch("/messages/{message_id}/unsend")
async def unsend_message(message_id: str, current_user: User = Depends(get_current_user)):
    """Unsend (mark as deleted) a message - only sender can unsend"""
    message = await db.messages.find_one({"id": message_id}, {"_id": 0})
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    if message['sender_id'] != current_user.id:
        raise HTTPException(status_code=403, detail="Can only unsend your own messages")
    
    # Mark message as unsent instead of deleting
    await db.messages.update_one(
        {"id": message_id},
        {"$set": {"content": "This message was unsent", "unsent": True}}
    )
    
    return {"message": "Message unsent"}

@api_router.post("/messages/{message_id}/reply")
async def reply_to_message(message_id: str, reply_data: MessageCreate, current_user: User = Depends(get_current_user)):
    """Reply to a specific message"""
    original_message = await db.messages.find_one({"id": message_id}, {"_id": 0})
    
    if not original_message:
        raise HTTPException(status_code=404, detail="Original message not found")
    
    connection = await db.connections.find_one({"id": original_message['connection_id']}, {"_id": 0})
    
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    if connection['requester_id'] != current_user.id and connection['receiver_id'] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if connection['status'] != 'accepted':
        raise HTTPException(status_code=400, detail="Connection is not accepted")
    
    new_message = Message(
        connection_id=original_message['connection_id'],
        sender_id=current_user.id,
        content=reply_data.content
    )
    
    doc = new_message.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['reply_to'] = message_id
    doc['reply_to_content'] = original_message.get('content', '')[:100]  # Store first 100 chars of original
    await db.messages.insert_one(doc)
    
    # Notify the other user
    other_user_id = connection['receiver_id'] if connection['requester_id'] == current_user.id else connection['requester_id']
    await manager.send_personal_message({
        "type": "new_message",
        "message": {
            "id": new_message.id,
            "connection_id": original_message['connection_id'],
            "sender_id": current_user.id,
            "sender_name": current_user.name,
            "content": reply_data.content,
            "created_at": doc['created_at'],
            "reply_to": message_id,
            "reply_to_content": doc['reply_to_content']
        }
    }, other_user_id)
    
    return {"message": "Reply sent", "id": new_message.id}

# Pinned Chats
@api_router.post("/connections/{connection_id}/pin")
async def pin_chat(connection_id: str, current_user: User = Depends(get_current_user)):
    """Pin or unpin a chat"""
    connection = await db.connections.find_one({"id": connection_id}, {"_id": 0})
    
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    if connection['requester_id'] != current_user.id and connection['receiver_id'] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if already pinned
    existing = await db.pinned_chats.find_one({
        "user_id": current_user.id,
        "connection_id": connection_id
    })
    
    if existing:
        await db.pinned_chats.delete_one({"id": existing['id']})
        return {"message": "Chat unpinned", "pinned": False}
    
    pinned = PinnedChat(
        user_id=current_user.id,
        connection_id=connection_id
    )
    doc = pinned.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.pinned_chats.insert_one(doc)
    
    return {"message": "Chat pinned", "pinned": True}

@api_router.get("/connections/pinned")
async def get_pinned_chats(current_user: User = Depends(get_current_user)):
    """Get all pinned chats for current user"""
    pinned = await db.pinned_chats.find({"user_id": current_user.id}, {"_id": 0}).to_list(50)
    return [p['connection_id'] for p in pinned]

# ============== MASTER ADMIN FEATURES ==============

@api_router.patch("/master-admin/demote/{user_id}")
async def demote_admin(user_id: str, master_admin: User = Depends(get_master_admin_user)):
    """Demote an admin to regular user (master admin only)"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get('role') == 'master_admin':
        raise HTTPException(status_code=400, detail="Cannot demote master admin")
    
    if user.get('role') != 'admin':
        raise HTTPException(status_code=400, detail="User is not an admin")
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"role": "user"}}
    )
    
    return {"message": f"User {user.get('email')} demoted to regular user"}

@api_router.delete("/master-admin/remove-admin/{user_id}")
async def remove_admin(user_id: str, master_admin: User = Depends(get_master_admin_user)):
    """Remove admin status from a user (master admin only)"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get('role') == 'master_admin':
        raise HTTPException(status_code=400, detail="Cannot remove master admin")
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"role": "user"}}
    )
    
    return {"message": f"Admin privileges removed from {user.get('email')}"}

# Initialize Master Admin on startup
@app.on_event("startup")
async def setup_master_admin():
    """Set up the master admin user on startup"""
    master_admin_email = "atreyaghoshal.68@gmail.com"
    
    # Check if user exists
    user = await db.users.find_one({"email": master_admin_email})
    if user:
        # Update role to master_admin if not already
        if user.get('role') != 'master_admin':
            await db.users.update_one(
                {"email": master_admin_email},
                {"$set": {"role": "master_admin"}}
            )
            logger.info(f"Updated {master_admin_email} to master_admin role")
    else:
        logger.info(f"Master admin user {master_admin_email} not found yet - will be set on first login")

# WebSocket endpoint for real-time chat
@app.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    try:
        # Verify token and get user
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=4001)
            return
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            await websocket.close(code=4001)
            return
        
        await manager.connect(websocket, user_id)
        
        try:
            while True:
                data = await websocket.receive_text()
                message_data = json.loads(data)
                
                if message_data.get('type') == 'ping':
                    await websocket.send_json({"type": "pong"})
                elif message_data.get('type') == 'typing':
                    # Notify the other user that current user is typing
                    connection_id = message_data.get('connection_id')
                    if connection_id:
                        connection = await db.connections.find_one({"id": connection_id}, {"_id": 0})
                        if connection:
                            other_user_id = connection['receiver_id'] if connection['requester_id'] == user_id else connection['requester_id']
                            await manager.send_personal_message({
                                "type": "typing",
                                "connection_id": connection_id,
                                "user_id": user_id
                            }, other_user_id)
        except WebSocketDisconnect:
            manager.disconnect(user_id)
    except jwt.ExpiredSignatureError:
        await websocket.close(code=4001)
    except jwt.InvalidTokenError:
        await websocket.close(code=4001)

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def send_resource_approval_email(user_email: str, user_name: str, resource_title: str):
    """Send email notification when a user's resource is approved"""
    try:
        sendgrid_api_key = os.environ.get('SENDGRID_API_KEY')
        from_email = os.environ.get('FROM_EMAIL', 'noreply@mentis.com')
        frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
        
        if not sendgrid_api_key:
            logger.warning(f"SendGrid not configured. Cannot send approval email to {user_email}")
            return False
            
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail, Email, To
        
        message = Mail(
            from_email=Email(from_email),
            to_emails=To(user_email),
            subject='🎉 Your Resource Has Been Approved! - Mentis',
            html_content=f'''
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; padding: 30px; border-radius: 10px;">
                <h2 style="color: #f97316; margin-bottom: 20px;">Great News, {user_name}! 🎉</h2>
                <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6;">
                    Your submitted resource <strong style="color: #f97316;">"{resource_title}"</strong> has been reviewed and approved by our team!
                </p>
                <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6;">
                    It's now live on the Resource Hub and available to the entire Mentis community. Thank you for contributing to our growing collection of mathematics resources!
                </p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{frontend_url}/resources" style="background: linear-gradient(to right, #f97316, #ec4899); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">View Resource Hub</a>
                </div>
                <p style="color: #94a3b8; font-size: 14px;">
                    Keep contributing and help us build the best mathematics resource collection!
                </p>
                <hr style="border: none; border-top: 1px solid #374151; margin: 30px 0;">
                <p style="color: #64748b; font-size: 12px; text-align: center;">
                    Mentis - Mathematics Community Platform<br>
                    <a href="mailto:mentis.mathematics@gmail.com" style="color: #f97316;">mentis.mathematics@gmail.com</a>
                </p>
            </div>
            '''
        )
        
        sg = SendGridAPIClient(sendgrid_api_key)
        response = sg.send(message)
        logger.info(f"Resource approval email sent to {user_email}, status: {response.status_code}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send resource approval email to {user_email}: {str(e)}")
        return False

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()