from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, BackgroundTasks, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import re
import json
import asyncio
import shutil
import mimetypes
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from passlib.context import CryptContext
import secrets
from pywebpush import webpush, WebPushException

ROOT_DIR = Path(__file__).parent
UPLOADS_DIR = ROOT_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)
load_dotenv(ROOT_DIR / '.env')

# Configure logging at the top level
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("mentis.backend")

# VAPID keys for Web Push Notifications
VAPID_PUBLIC_KEY = os.environ.get('VAPID_PUBLIC_KEY', '')
VAPID_PRIVATE_KEY = os.environ.get('VAPID_PRIVATE_KEY', '')
VAPID_EMAIL = os.environ.get('VAPID_EMAIL', 'mentis.mathematics@gmail.com')

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

mongo_url = os.environ.get('MONGO_URL', '')
if not mongo_url:
    raise ValueError("MONGO_URL environment variable is required")

# MongoDB connection with retry and timeout settings for production
client = AsyncIOMotorClient(
    mongo_url,
    serverSelectionTimeoutMS=5000,
    connectTimeoutMS=10000,
    socketTimeoutMS=30000,
    maxPoolSize=50,
    minPoolSize=10,
    retryWrites=True,
    w='majority'
)
db = client[os.environ.get('DB_NAME', 'mentis_db')]

app = FastAPI()
api_router = APIRouter(prefix="/api")

JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def hash_password(password: str) -> str:
    """Hash password using bcrypt with automatic truncation at 72 bytes and fallback."""
    try:
        return bcrypt.hashpw(password.encode("utf-8")[:72], bcrypt.gensalt()).decode("utf-8")
    except Exception:
        return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against bcrypt hash safely."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8")[:72], hashed_password.encode("utf-8"))
    except Exception:
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception:
            return False

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    role: str = "user"
    mentis_score: int = 0
    email_verified: bool = False
    verification_token: Optional[str] = None
    verification_token_expires: Optional[datetime] = None
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
    content_type: str  # notes, playlists, ppts, others
    url: str
    topic: str
    submitted_by: Optional[str] = None
    uploader_name: Optional[str] = None
    status: str = "pending"
    # Filter fields
    education_level: List[str] = []  # primary, high_school, ug, pg, research
    math_domain: List[str] = []  # algebra, geometry, calculus, etc.
    class_grade: Optional[str] = None  # class 1-12, semester 1-8
    difficulty: Optional[str] = None  # beginner, intermediate, advanced, expert
    exam_type: List[str] = []  # jee, neet, gre, gate, olympiad
    language: Optional[str] = "english"
    tags: List[str] = []  # user-generated tags
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ResourceCreate(BaseModel):
    title: str
    description: str
    content_type: str  # notes, playlists, ppts, others
    url: str
    topic: str
    education_level: List[str] = []
    math_domain: List[str] = []
    class_grade: Optional[str] = None
    difficulty: Optional[str] = None
    exam_type: List[str] = []
    language: Optional[str] = "english"
    tags: List[str] = []

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
    uploader_name: Optional[str] = None
    submitted_by: Optional[str] = None
    # Filter fields
    education_level: List[str] = []
    math_domain: List[str] = []
    difficulty: Optional[str] = None
    language: Optional[str] = "english"
    tags: List[str] = []
    published_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CuriofactCreate(BaseModel):
    title: str
    content: str
    image_url: Optional[str] = None
    education_level: List[str] = []
    math_domain: List[str] = []
    difficulty: Optional[str] = None
    language: Optional[str] = "english"
    tags: List[str] = []

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
    sender_name: Optional[str] = None
    content: str
    attachment: Optional[dict] = None  # File attachment info
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    read: bool = False

class MessageCreate(BaseModel):
    content: str
    attachment: Optional[dict] = None

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
    video_platform: Optional[str] = None  # youtube, instagram, facebook, tiktok, etc.
    caption: str
    status: str = "pending"  # pending, approved, rejected
    # Filter fields
    education_level: List[str] = []
    math_domain: List[str] = []
    difficulty: Optional[str] = None
    exam_type: List[str] = []
    language: Optional[str] = "english"
    tags: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReelCreate(BaseModel):
    video_url: str
    video_type: str = "link"
    video_platform: Optional[str] = None
    caption: str
    education_level: List[str] = []
    math_domain: List[str] = []
    difficulty: Optional[str] = None
    exam_type: List[str] = []
    language: Optional[str] = "english"
    tags: List[str] = []

# Pinned Chat Model
class PinnedChat(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    connection_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Saved Resource Model
class SavedResource(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    resource_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Email Request Model
class EmailRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    requester_id: str
    target_user_id: str
    status: str = "pending"  # pending, approved, rejected
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Curiofact Submission Model
class CuriofactSubmission(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_name: Optional[str] = None
    title: str
    content: str
    image_url: Optional[str] = None
    status: str = "pending"
    # Filter fields
    education_level: List[str] = []
    math_domain: List[str] = []
    difficulty: Optional[str] = None
    language: Optional[str] = "english"
    tags: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CuriofactSubmissionCreate(BaseModel):
    title: str
    content: str
    image_url: Optional[str] = None
    education_level: List[str] = []
    math_domain: List[str] = []
    difficulty: Optional[str] = None
    language: Optional[str] = "english"
    tags: List[str] = []

# File Attachment Model for Chat
class FileAttachment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    original_filename: str
    file_type: str  # image, document, video, audio, other
    mime_type: str
    size: int  # in bytes
    url: str

# Group Chat Models
class GroupChat(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    created_by: str
    members: List[str] = []  # List of user IDs
    admins: List[str] = []  # List of admin user IDs (creator is always admin)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class GroupChatCreate(BaseModel):
    name: str
    description: Optional[str] = None
    member_ids: List[str]  # Initial members to add

class GroupChatUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class GroupMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    group_id: str
    sender_id: str
    sender_name: str
    content: str
    attachment: Optional[FileAttachment] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class GroupMessageCreate(BaseModel):
    content: str
    attachment: Optional[dict] = None

# About Us Content Model
class AboutUsContent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "about_us_main"
    tagline: Optional[str] = None
    community_info: Optional[str] = None
    foundation_info: Optional[str] = None
    vision: Optional[str] = None
    mission: Optional[str] = None
    values: Optional[str] = None
    instructions: Optional[str] = None
    logo_url: Optional[str] = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_by: Optional[str] = None

class AboutUsUpdate(BaseModel):
    tagline: Optional[str] = None
    community_info: Optional[str] = None
    foundation_info: Optional[str] = None
    vision: Optional[str] = None
    mission: Optional[str] = None
    values: Optional[str] = None
    instructions: Optional[str] = None
    logo_url: Optional[str] = None

# Tutorial Video Model
class Tutorial(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    video_url: str
    order: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: Optional[str] = None

class TutorialCreate(BaseModel):
    title: str
    description: Optional[str] = None
    video_url: str
    order: Optional[int] = 0

# FAQ Model for About Us section
class FAQ(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question: str
    answer: str
    order: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: Optional[str] = None

class FAQCreate(BaseModel):
    question: str
    answer: str
    order: Optional[int] = 0

class FAQUpdate(BaseModel):
    question: Optional[str] = None
    answer: Optional[str] = None
    order: Optional[int] = None

# Filter Options Model for admin-managed filter categories
class FilterOption(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category: str  # education_level, math_domain, class_grade, difficulty, exam_type, language
    value: str  # The actual value (e.g., "algebra", "high_school")
    label: str  # Display label (e.g., "Algebra", "High School")
    order: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FilterOptionCreate(BaseModel):
    category: str
    value: str
    label: str
    order: Optional[int] = 0

class FilterOptionUpdate(BaseModel):
    value: Optional[str] = None
    label: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None

# Matrix Member Update Model (for Master Admin)
class MatrixMemberUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    college: Optional[str] = None
    interests: Optional[str] = None

# Push Subscription Model
class PushSubscription(BaseModel):
    endpoint: str
    keys: Dict[str, str]

class PushSubscriptionRequest(BaseModel):
    subscription: PushSubscription

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

# ================= EMAIL DISPATCH SERVICE =================
def _send_smtp_sync(to_email: str, subject: str, html_content: str, text_content: str, smtp_user: str, smtp_password: str, smtp_host: str = "smtp.gmail.com", smtp_port: int = 587, from_name: str = "Mentis Mathematics Foundation"):
    import smtplib
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{from_name} <{smtp_user}>"
    msg["To"] = to_email

    if text_content:
        msg.attach(MIMEText(text_content, "plain"))
    msg.attach(MIMEText(html_content, "html"))

    clean_password = smtp_password.replace(" ", "") if smtp_password else ""

    with smtplib.SMTP(smtp_host, smtp_port, timeout=5) as server:
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(smtp_user, clean_password)
        server.send_message(msg)

async def send_system_email(to_email: str, subject: str, html_content: str, text_content: str = "") -> bool:
    """
    Universal Email Dispatcher:
    1. Prioritizes Gmail SMTP (smtp.gmail.com:587) using SMTP_USER and SMTP_PASSWORD.
    2. Falls back to SendGrid if SENDGRID_API_KEY is configured.
    3. Logs detailed diagnostics.
    """
    smtp_user = os.environ.get('SMTP_USER') or os.environ.get('GMAIL_USER') or 'mentis.mathematics@gmail.com'
    smtp_password = os.environ.get('SMTP_PASSWORD') or os.environ.get('GMAIL_APP_PASSWORD') or 'tcmpubbriehmnufa'
    smtp_host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
    smtp_port = int(os.environ.get('SMTP_PORT', '587'))
    from_name = os.environ.get('FROM_NAME', 'Mentis Mathematics Foundation')

    # 1. Prioritize SendGrid Web API if configured (HTTPS Port 443 - works everywhere including Render Free)
    sendgrid_api_key = os.environ.get('SENDGRID_API_KEY')
    if sendgrid_api_key:
        try:
            from sendgrid import SendGridAPIClient
            from sendgrid.helpers.mail import Mail, Email, To
            from_email = os.environ.get('FROM_EMAIL', smtp_user or 'mentis.mathematics@gmail.com')
            message = Mail(
                from_email=Email(from_email, from_name),
                to_emails=To(to_email),
                subject=subject,
                html_content=html_content
            )
            sg = SendGridAPIClient(sendgrid_api_key)
            await asyncio.to_thread(sg.send, message)
            logger.info(f"Email '{subject}' successfully delivered via SendGrid to {to_email}")
            return True
        except Exception as e:
            logger.exception(f"SendGrid delivery failed to {to_email}: {e}")

    # 2. Resend Web API (HTTPS Port 443 - zero SMTP port blocks)
    resend_api_key = os.environ.get('RESEND_API_KEY')
    if resend_api_key:
        try:
            import requests
            resend_from = os.environ.get('RESEND_FROM', 'Mentis Mathematics <onboarding@resend.dev>')
            resp = await asyncio.to_thread(
                requests.post,
                'https://api.resend.com/emails',
                headers={'Authorization': f'Bearer {resend_api_key}', 'Content-Type': 'application/json'},
                json={
                    'from': resend_from,
                    'to': [to_email],
                    'subject': subject,
                    'html': html_content,
                    'text': text_content or None
                },
                timeout=10
            )
            if resp.status_code in [200, 201]:
                logger.info(f"Email '{subject}' successfully delivered via Resend to {to_email}")
                return True
            else:
                logger.error(f"Resend delivery failed ({resp.status_code}): {resp.text}")
        except Exception as e:
            logger.exception(f"Resend delivery failed to {to_email}: {e}")

    # 3. Direct Gmail SMTP (Ports 587/465 - works on local/paid hosts; timeout fast if port blocked)
    if smtp_user and smtp_password:
        try:
            logger.info(f"Attempting SMTP ({smtp_host}:{smtp_port}) to {to_email}")
            await asyncio.to_thread(_send_smtp_sync, to_email, subject, html_content, text_content, smtp_user, smtp_password, smtp_host, smtp_port, from_name)
            logger.info(f"Email '{subject}' successfully delivered via SMTP to {to_email}")
            return True
        except Exception as e:
            logger.warning(f"SMTP delivery failed to {to_email}: {e}")

    logger.warning(f"No configured email transport succeeded for {to_email}")
    return False

# Helper function to send push notification to a user
async def send_push_notification(user_id: str, title: str, body: str, url: str = "/", tag: str = "mentis"):
    """Send push notification to all subscriptions for a user"""
    if not VAPID_PUBLIC_KEY or not VAPID_PRIVATE_KEY:
        logger.warning("VAPID keys not configured, skipping push notification")
        return
    
    try:
        # Get all subscriptions for this user
        subscriptions = await db.push_subscriptions.find({"user_id": user_id}).to_list(100)
        
        if not subscriptions:
            logger.debug(f"No push subscriptions found for user {user_id}")
            return
        
        notification_data = json.dumps({
            "title": title,
            "body": body,
            "icon": "/icons/icon-192x192.png",
            "badge": "/icons/icon-72x72.png",
            "tag": tag,
            "data": {"url": url}
        })
        
        for sub in subscriptions:
            try:
                webpush(
                    subscription_info={
                        "endpoint": sub["endpoint"],
                        "keys": sub["keys"]
                    },
                    data=notification_data,
                    vapid_private_key=VAPID_PRIVATE_KEY,
                    vapid_claims={
                        "sub": f"mailto:{VAPID_EMAIL}"
                    }
                )
                logger.info(f"Push notification sent to user {user_id}")
            except WebPushException as e:
                logger.error(f"Push notification failed: {e}")
                # If subscription is invalid, remove it
                if e.response and e.response.status_code in [404, 410]:
                    await db.push_subscriptions.delete_one({"_id": sub["_id"]})
                    logger.info(f"Removed invalid subscription for user {user_id}")
            except Exception as e:
                logger.error(f"Push notification error: {e}")
    except Exception as e:
        logger.error(f"Error sending push notification: {e}")

# Push notification endpoints
@api_router.get("/push/vapid-public-key")
async def get_vapid_public_key():
    """Get the VAPID public key for push subscriptions"""
    return {"publicKey": VAPID_PUBLIC_KEY}

@api_router.post("/push/subscribe")
async def subscribe_to_push(
    request: PushSubscriptionRequest,
    current_user: User = Depends(get_current_user)
):
    """Subscribe user to push notifications"""
    try:
        subscription = request.subscription
        
        # Check if subscription already exists
        existing = await db.push_subscriptions.find_one({
            "user_id": current_user.id,
            "endpoint": subscription.endpoint
        })
        
        if existing:
            return {"message": "Already subscribed"}
        
        # Store subscription
        sub_doc = {
            "id": str(uuid.uuid4()),
            "user_id": current_user.id,
            "endpoint": subscription.endpoint,
            "keys": subscription.keys,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.push_subscriptions.insert_one(sub_doc)
        logger.info(f"Push subscription added for user {current_user.id}")
        
        return {"message": "Subscribed successfully"}
    except Exception as e:
        logger.error(f"Error subscribing to push: {e}")
        raise HTTPException(status_code=500, detail="Failed to subscribe")

@api_router.post("/push/unsubscribe")
async def unsubscribe_from_push(
    request: PushSubscriptionRequest,
    current_user: User = Depends(get_current_user)
):
    """Unsubscribe user from push notifications"""
    try:
        subscription = request.subscription
        
        result = await db.push_subscriptions.delete_one({
            "user_id": current_user.id,
            "endpoint": subscription.endpoint
        })
        
        if result.deleted_count > 0:
            logger.info(f"Push subscription removed for user {current_user.id}")
            return {"message": "Unsubscribed successfully"}
        else:
            return {"message": "Subscription not found"}
    except Exception as e:
        logger.error(f"Error unsubscribing from push: {e}")
        raise HTTPException(status_code=500, detail="Failed to unsubscribe")

@api_router.post("/push/test")
async def test_push_notification(current_user: User = Depends(get_current_user)):
    """Send a test push notification to the current user"""
    await send_push_notification(
        user_id=current_user.id,
        title="Test Notification",
        body="Push notifications are working! 🎉",
        url="/dashboard",
        tag="test"
    )
    return {"message": "Test notification sent"}

@api_router.post("/auth/signup")
async def signup(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = hash_password(user_data.password)
    
    # Generate verification token
    verification_token = str(uuid.uuid4())
    verification_expires = datetime.now(timezone.utc) + timedelta(hours=24)
    
    user = User(
        email=user_data.email, 
        name=user_data.name,
        email_verified=False,
        verification_token=verification_token,
        verification_token_expires=verification_expires
    )
    doc = user.model_dump()
    doc['password'] = hashed_password
    doc['created_at'] = doc['created_at'].isoformat()
    doc['verification_token_expires'] = doc['verification_token_expires'].isoformat()
    await db.users.insert_one(doc)
    
    # Send verification email
    try:
        frontend_url = os.environ.get('FRONTEND_URL', 'https://mentismathematicsfoundation.com').rstrip('/')
        verification_link = f"{frontend_url}/verify-email?token={verification_token}"
        
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1e293b; padding: 30px; border-radius: 12px; color: #e2e8f0;">
            <h2 style="color: #f97316; margin-bottom: 20px;">Welcome to Mentis!</h2>
            <p>Hi {user_data.name},</p>
            <p>Thank you for signing up for Mentis Mathematics Foundation. Please verify your email address to activate your account.</p>
            <p style="margin: 30px 0; text-align: center;">
                <a href="{verification_link}" 
                   style="background: linear-gradient(to right, #f97316, #ec4899); 
                          color: white; 
                          padding: 12px 30px; 
                          text-decoration: none; 
                          border-radius: 25px;
                          display: inline-block;
                          font-weight: bold;">
                    Verify Email
                </a>
            </p>
            <p style="color: #94a3b8; font-size: 13px;">
                Or copy and paste this link in your browser:<br>
                <a href="{verification_link}" style="color: #f97316; word-break: break-all;">{verification_link}</a>
            </p>
            <p style="color: #64748b; font-size: 12px; margin-top: 20px;">This link will expire in 24 hours.</p>
        </div>
        """
        text_content = f"Hi {user_data.name},\n\nPlease verify your email address for Mentis: {verification_link}\n\nThis link will expire in 24 hours.\n\nMentis Mathematics Foundation"
        
        await send_system_email(user_data.email, "Verify Your Mentis Account", html_content, text_content)
    except Exception as e:
        logger.error(f"Failed to send verification email: {e}")
    
    return {"message": "Account created successfully. Please check your email to verify your account.", "email": user_data.email}

@api_router.post("/auth/login", response_model=Token)
async def login(login_data: UserLogin):
    user_doc = await db.users.find_one({"email": login_data.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    stored_password = user_doc.get('password')
    if not stored_password or not verify_password(login_data.password, stored_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Email verification check
    # Allow login if:
    # 1. Master admin (always allowed)
    # 2. email_verified is True
    # 3. email_verified field doesn't exist (existing users before verification feature)
    # 4. No verification_token (existing users)
    master_admin_email = "atreyaghoshal.68@gmail.com"
    email_verified = user_doc.get('email_verified')
    has_verification_token = user_doc.get('verification_token') is not None
    
    # Only block if: email_verified is explicitly False AND has verification token (new signup)
    if login_data.email != master_admin_email:
        if email_verified is False and has_verification_token:
            raise HTTPException(
                status_code=403, 
                detail="Please verify your email before logging in. Check your inbox for the verification link."
            )
    
    if isinstance(user_doc['created_at'], str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    # Clean up sensitive/internal fields before returning
    user_doc.pop('password', None)
    user_doc.pop('verification_token', None)
    user_doc.pop('verification_token_expires', None)
    user = User(**user_doc)
    token = create_access_token({"sub": user.id})
    return Token(access_token=token, user=user)

@api_router.get("/auth/me", response_model=User)
async def get_me(user: User = Depends(get_current_user)):
    return user

@api_router.post("/auth/verify-email")
async def verify_email(token: str):
    """Verify user's email with the provided token"""
    user_doc = await db.users.find_one({"verification_token": token}, {"_id": 0})
    
    if not user_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired verification link")
    
    # Check if token has expired
    token_expires = user_doc.get('verification_token_expires')
    if token_expires:
        if isinstance(token_expires, str):
            token_expires = datetime.fromisoformat(token_expires)
        if datetime.now(timezone.utc) > token_expires:
            raise HTTPException(status_code=400, detail="Verification link has expired. Please request a new one.")
    
    # Update user as verified
    await db.users.update_one(
        {"id": user_doc['id']},
        {
            "$set": {"email_verified": True},
            "$unset": {"verification_token": "", "verification_token_expires": ""}
        }
    )
    
    # Return token so user can be logged in
    if isinstance(user_doc['created_at'], str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    user_doc.pop('password', None)
    user_doc.pop('verification_token', None)
    user_doc.pop('verification_token_expires', None)
    user_doc['email_verified'] = True
    user = User(**user_doc)
    access_token = create_access_token({"sub": user.id})
    
    return {"message": "Email verified successfully", "access_token": access_token, "user": user.model_dump()}

@api_router.post("/auth/resend-verification")
async def resend_verification(email: EmailStr):
    """Resend verification email"""
    user_doc = await db.users.find_one({"email": email}, {"_id": 0})
    
    if not user_doc:
        return {"message": "If your email is registered, you will receive a verification link shortly"}
    
    if user_doc.get('email_verified', False):
        raise HTTPException(status_code=400, detail="Email is already verified. You can login now.")
    
    # Generate new verification token
    verification_token = str(uuid.uuid4())
    verification_expires = datetime.now(timezone.utc) + timedelta(hours=24)
    
    await db.users.update_one(
        {"email": email},
        {
            "$set": {
                "verification_token": verification_token,
                "verification_token_expires": verification_expires.isoformat()
            }
        }
    )
    
    # Send verification email
    try:
        frontend_url = os.environ.get('FRONTEND_URL', 'https://mentismathematicsfoundation.com').rstrip('/')
        verification_link = f"{frontend_url}/verify-email?token={verification_token}"
        
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1e293b; padding: 30px; border-radius: 12px; color: #e2e8f0;">
            <h2 style="color: #f97316; margin-bottom: 20px;">Verify Your Email</h2>
            <p>Hi {user_doc.get('name', 'there')},</p>
            <p>Please click the button below to verify your email address for Mentis Mathematics Foundation.</p>
            <p style="margin: 30px 0; text-align: center;">
                <a href="{verification_link}" 
                   style="background: linear-gradient(to right, #f97316, #ec4899); 
                          color: white; 
                          padding: 12px 30px; 
                          text-decoration: none; 
                          border-radius: 25px;
                          display: inline-block;
                          font-weight: bold;">
                    Verify Email
                </a>
            </p>
            <p style="color: #94a3b8; font-size: 13px;">
                Or copy and paste this link in your browser:<br>
                <a href="{verification_link}" style="color: #f97316; word-break: break-all;">{verification_link}</a>
            </p>
            <p style="color: #64748b; font-size: 12px; margin-top: 20px;">This link will expire in 24 hours.</p>
        </div>
        """
        text_content = f"Hi {user_doc.get('name', 'there')},\n\nPlease verify your email address: {verification_link}\n\nMentis Mathematics Foundation"
        await send_system_email(email, "Verify Your Mentis Account", html_content, text_content)
    except Exception as e:
        logger.error(f"Failed to resend verification email: {e}")
    
    return {"message": "If your email is registered, you will receive a verification link shortly"}


@api_router.post("/resources", response_model=Resource)
async def create_resource(resource_data: ResourceCreate, user: User = Depends(get_current_user)):
    resource = Resource(**resource_data.model_dump(), submitted_by=user.id)
    doc = resource.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.resources.insert_one(doc)
    return resource

@api_router.get("/resources", response_model=List[Resource])
async def get_resources(
    status: Optional[str] = None,
    search: Optional[str] = None,
    content_type: Optional[str] = None,
    education_level: Optional[str] = None,
    math_domain: Optional[str] = None,
    class_grade: Optional[str] = None,
    difficulty: Optional[str] = None,
    exam_type: Optional[str] = None,
    language: Optional[str] = None,
    tags: Optional[str] = None
):
    query = {}
    
    if status:
        query["status"] = status
    
    # Search in title, description, topic, and tags
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"topic": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}}
        ]
    
    if content_type:
        query["content_type"] = content_type
    
    # Multi-select filters (comma-separated values)
    if education_level:
        levels = education_level.split(",")
        query["education_level"] = {"$in": levels}
    
    if math_domain:
        domains = math_domain.split(",")
        query["math_domain"] = {"$in": domains}
    
    if class_grade:
        query["class_grade"] = class_grade
    
    if difficulty:
        query["difficulty"] = difficulty
    
    if exam_type:
        exams = exam_type.split(",")
        query["exam_type"] = {"$in": exams}
    
    if language:
        query["language"] = language
    
    if tags:
        tag_list = tags.split(",")
        query["tags"] = {"$in": tag_list}
    
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
    
    # Send email notifications based on new status
    submitter_id = existing_resource.get('submitted_by')
    if was_pending and submitter_id:
        submitter = await db.users.find_one({"id": submitter_id}, {"_id": 0})
        if submitter and submitter.get('email'):
            if update.status == 'approved':
                # Increment mentis_score by 5 for approved resource
                await db.users.update_one(
                    {"id": submitter_id},
                    {"$inc": {"mentis_score": 5, "total_resources": 1}}
                )
                await send_resource_approval_email(
                    user_email=submitter['email'],
                    user_name=submitter.get('name', 'Mentis User'),
                    resource_title=existing_resource.get('title', 'Your Resource')
                )
            elif update.status == 'rejected':
                await send_resource_rejection_email(
                    user_email=submitter['email'],
                    user_name=submitter.get('name', 'Mentis User'),
                    resource_title=existing_resource.get('title', 'Your Resource')
                )
    
    return Resource(**result)

@api_router.get("/games", response_model=List[Game])
async def get_games(
    search: Optional[str] = None,
    difficulty: Optional[str] = None,
    math_domain: Optional[str] = None,
    education_level: Optional[str] = None
):
    query = {}
    
    # Search in title and description
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    # Filter by difficulty
    if difficulty:
        difficulties = difficulty.split(",")
        query["difficulty"] = {"$in": difficulties}
    
    # Filter by math domain (if games have this field)
    if math_domain:
        domains = math_domain.split(",")
        query["math_domain"] = {"$in": domains}
    
    # Filter by education level (if games have this field)
    if education_level:
        levels = education_level.split(",")
        query["education_level"] = {"$in": levels}
    
    games = await db.games.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
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
async def get_curiofacts(
    search: Optional[str] = None,
    education_level: Optional[str] = None,
    math_domain: Optional[str] = None,
    difficulty: Optional[str] = None,
    language: Optional[str] = None,
    tags: Optional[str] = None
):
    query = {}
    
    # Search in title, content, and tags
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"content": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}}
        ]
    
    # Multi-select filters
    if education_level:
        levels = education_level.split(",")
        query["education_level"] = {"$in": levels}
    
    if math_domain:
        domains = math_domain.split(",")
        query["math_domain"] = {"$in": domains}
    
    if difficulty:
        query["difficulty"] = difficulty
    
    if language:
        query["language"] = language
    
    if tags:
        tag_list = tags.split(",")
        query["tags"] = {"$in": tag_list}
    
    facts = await db.curiofacts.find(query, {"_id": 0}).sort("published_at", -1).to_list(1000)
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
    # Check for existing email (case-insensitive)
    existing_email = await db.matrix_registrations.find_one({
        "email": {"$regex": f"^{registration_data.email}$", "$options": "i"}
    })
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered in Matrix")
    
    # Check for existing name (case-insensitive, after uppercase conversion)
    name_upper = registration_data.name.upper().strip()
    existing_name = await db.matrix_registrations.find_one({
        "name": {"$regex": f"^{name_upper}$", "$options": "i"}
    })
    if existing_name:
        raise HTTPException(status_code=400, detail="Name already registered in Matrix. Please use a unique name.")
    
    # Create registration with uppercase name and college
    reg_data = registration_data.model_dump()
    reg_data['name'] = name_upper
    reg_data['college'] = registration_data.college.upper().strip()
    
    registration = MatrixRegistration(**reg_data)
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
    
    # Use production domain as default fallback
    frontend_url = os.environ.get('FRONTEND_URL', 'https://mentismathematicsfoundation.com').rstrip('/')
    reset_link = f"{frontend_url}/reset-password?token={reset_token}"
    
    # Create reset token document
    token_doc = {
        "id": str(uuid.uuid4()),
        "email": request.email,
        "token": reset_token,
        "reset_link": reset_link,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
        "used": False
    }
    
    await db.password_reset_tokens.insert_one(token_doc)
    
    html_content = f'''<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b1120; margin: 0; padding: 24px;">
  <div style="max-width: 560px; margin: 0 auto; background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 36px 32px; color: #e2e8f0; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);">
    <div style="text-align: center; margin-bottom: 28px;">
      <h1 style="color: #f97316; font-size: 24px; margin: 0 0 6px 0; font-weight: 800;">Mentis Mathematics Foundation</h1>
      <p style="color: #94a3b8; font-size: 14px; margin: 0;">Password Reset Request</p>
    </div>
    <p style="font-size: 15px; line-height: 1.6; color: #cbd5e1; margin-bottom: 16px;">Hi there,</p>
    <p style="font-size: 15px; line-height: 1.6; color: #cbd5e1; margin-bottom: 24px;">We received a request to reset your password for your Mentis account. Click the button below to choose a new password:</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="{reset_link}" target="_blank" style="background: linear-gradient(135deg, #f97316 0%, #ec4899 100%); color: #ffffff; padding: 14px 34px; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 9999px; display: inline-block; box-shadow: 0 4px 14px rgba(249, 115, 22, 0.35);">Reset Password</a>
    </div>
    <p style="font-size: 13px; line-height: 1.6; color: #94a3b8; margin-bottom: 8px;">If the button above does not work, copy and paste this link into your browser:</p>
    <p style="font-size: 12px; color: #f97316; word-break: break-all; background: #0f172a; padding: 14px; border-radius: 8px; border: 1px solid #334155; margin-bottom: 24px;">{reset_link}</p>
    <p style="font-size: 13px; color: #fb923c; margin-bottom: 12px;">⏱️ <strong>This link is valid for 1 hour.</strong></p>
    <p style="font-size: 13px; color: #64748b; line-height: 1.5;">If you did not request a password reset, you can safely ignore this email. Your account remains completely secure.</p>
    <hr style="border: none; border-top: 1px solid #334155; margin: 32px 0 20px 0;">
    <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">Mentis Mathematics Foundation • <a href="https://mentismathematicsfoundation.com" style="color: #f97316; text-decoration: none;">mentismathematicsfoundation.com</a></p>
  </div>
</body>
</html>'''

    text_content = f"""Hi there,

We received a request to reset your password for your Mentis account. Click the link below to choose a new password:

{reset_link}

This link is valid for 1 hour.

If you did not request a password reset, you can safely ignore this email.

Mentis Mathematics Foundation
https://mentismathematicsfoundation.com
"""

    await send_system_email(
        to_email=request.email,
        subject="Reset Your Mentis Password",
        html_content=html_content,
        text_content=text_content
    )
    
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
    hashed_password = hash_password(reset_data.new_password)
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
    
    # Ensure mentis_score exists (default to 0 for existing users)
    if 'mentis_score' not in user:
        user['mentis_score'] = 0
    
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
    
    # Check if current user can see email (email request approved)
    email_approved = await db.email_requests.find_one({
        "requester_id": current_user.id,
        "target_user_id": user_id,
        "status": "approved"
    })
    user['can_see_email'] = email_approved is not None
    
    # Hide email if not approved
    if not user['can_see_email']:
        user.pop('email', None)
    
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
    
    # Send push notification for connection request
    asyncio.create_task(send_push_notification(
        user_id=request.receiver_id,
        title="New Connection Request",
        body=f"{current_user.name} wants to connect with you!",
        url="/connect",
        tag=f"connection-request-{current_user.id}"
    ))
    
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
    
    # Send push notification for connection acceptance
    asyncio.create_task(send_push_notification(
        user_id=connection['requester_id'],
        title="Connection Accepted!",
        body=f"{current_user.name} accepted your connection request!",
        url="/connect",
        tag="connection-accepted"
    ))
    
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
        
        # Get last message (sorted by created_at descending)
        last_message = await db.messages.find_one(
            {"connection_id": conn['id']},
            {"_id": 0},
            sort=[("created_at", -1)]
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

# ============== UNREAD MESSAGES COUNT ==============
# NOTE: This endpoint MUST be defined BEFORE /messages/{connection_id} to avoid route conflict

@api_router.get("/messages/unread/count")
async def get_unread_messages_count(current_user: User = Depends(get_current_user)):
    """Get total count of unread messages for the current user across all connections"""
    # Get all connections where the user is involved
    connections = await db.connections.find({
        "$or": [
            {"requester_id": current_user.id},
            {"receiver_id": current_user.id}
        ],
        "status": "accepted"
    }, {"_id": 0, "id": 1}).to_list(1000)
    
    connection_ids = [c['id'] for c in connections]
    
    if not connection_ids:
        return {"unread_count": 0, "connections_with_unread": []}
    
    # Count unread messages where sender is not the current user
    unread_count = await db.messages.count_documents({
        "connection_id": {"$in": connection_ids},
        "sender_id": {"$ne": current_user.id},
        "read": False
    })
    
    # Get connections with unread messages for notification details
    pipeline = [
        {
            "$match": {
                "connection_id": {"$in": connection_ids},
                "sender_id": {"$ne": current_user.id},
                "read": False
            }
        },
        {
            "$group": {
                "_id": "$connection_id",
                "count": {"$sum": 1},
                "latest_message": {"$last": "$created_at"}
            }
        }
    ]
    
    connections_with_unread = []
    async for doc in db.messages.aggregate(pipeline):
        connections_with_unread.append({
            "connection_id": doc["_id"],
            "unread_count": doc["count"],
            "latest_message": doc["latest_message"]
        })
    
    return {
        "unread_count": unread_count,
        "connections_with_unread": connections_with_unread
    }

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
    
    # Send push notification to the other user
    asyncio.create_task(send_push_notification(
        user_id=other_user_id,
        title=f"New message from {current_user.name}",
        body=message.content[:100] + "..." if len(message.content) > 100 else message.content,
        url=f"/connect?chat={connection_id}",
        tag=f"message-{connection_id}"
    ))
    
    return {"message": "Message sent", "id": new_message.id}

@api_router.post("/messages/{connection_id}/mark-read")
async def mark_messages_as_read(connection_id: str, current_user: User = Depends(get_current_user)):
    """Explicitly mark all messages in a connection as read"""
    # Verify user is part of this connection
    connection = await db.connections.find_one({"id": connection_id}, {"_id": 0})
    
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    if connection['requester_id'] != current_user.id and connection['receiver_id'] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Mark messages as read (messages not sent by current user)
    result = await db.messages.update_many(
        {"connection_id": connection_id, "sender_id": {"$ne": current_user.id}, "read": False},
        {"$set": {"read": True}}
    )
    
    return {"message": "Messages marked as read", "marked_count": result.modified_count}

# ============== FILE UPLOAD FOR CHAT ==============

ALLOWED_FILE_TYPES = {
    'image': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    'document': ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                 'text/plain', 'text/csv'],
    'video': ['video/mp4', 'video/webm', 'video/quicktime'],
    'audio': ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3']
}

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

def get_file_type(mime_type: str) -> str:
    for file_type, mimes in ALLOWED_FILE_TYPES.items():
        if mime_type in mimes:
            return file_type
    return 'other'

@api_router.post("/chat/upload")
async def upload_chat_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload a file for chat attachment"""
    try:
        # Check file size
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large. Max size is 50MB")
        
        # Get mime type
        mime_type = file.content_type or mimetypes.guess_type(file.filename)[0] or 'application/octet-stream'
        file_type = get_file_type(mime_type)
        
        # Generate unique filename
        ext = os.path.splitext(file.filename)[1] if file.filename else ''
        unique_filename = f"{uuid.uuid4()}{ext}"
        
        # Create user upload directory
        user_dir = UPLOADS_DIR / current_user.id
        user_dir.mkdir(exist_ok=True)
        
        # Save file
        file_path = user_dir / unique_filename
        with open(file_path, 'wb') as f:
            f.write(content)
        
        # Generate URL
        file_url = f"/api/files/{current_user.id}/{unique_filename}"
        
        attachment = {
            "id": str(uuid.uuid4()),
            "filename": unique_filename,
            "original_filename": file.filename or unique_filename,
            "file_type": file_type,
            "mime_type": mime_type,
            "size": len(content),
            "url": file_url
        }
        
        return attachment
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File upload error: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload file")

@api_router.get("/files/{user_id}/{filename}")
async def get_file(user_id: str, filename: str):
    """Serve uploaded files"""
    file_path = UPLOADS_DIR / user_id / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    # Determine mime type
    mime_type = mimetypes.guess_type(str(file_path))[0] or 'application/octet-stream'
    
    # For images and PDFs, display inline (viewable in browser)
    # For other files, force download
    inline_types = ['image/', 'application/pdf', 'video/', 'audio/']
    disposition = 'inline' if any(mime_type.startswith(t) for t in inline_types) else 'attachment'
    
    return FileResponse(
        path=file_path,
        media_type=mime_type,
        filename=filename,
        content_disposition_type=disposition
    )

@api_router.post("/messages/{connection_id}/with-file")
async def send_message_with_file(
    connection_id: str,
    content: str = Form(""),
    file: UploadFile = File(None),
    current_user: User = Depends(get_current_user)
):
    """Send a message with optional file attachment"""
    # Verify connection
    connection = await db.connections.find_one({"id": connection_id, "status": "accepted"}, {"_id": 0})
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    if connection['requester_id'] != current_user.id and connection['receiver_id'] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    attachment = None
    if file and file.filename:
        # Upload the file
        file_content = await file.read()
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large. Max size is 50MB")
        
        mime_type = file.content_type or mimetypes.guess_type(file.filename)[0] or 'application/octet-stream'
        file_type = get_file_type(mime_type)
        
        ext = os.path.splitext(file.filename)[1] if file.filename else ''
        unique_filename = f"{uuid.uuid4()}{ext}"
        
        user_dir = UPLOADS_DIR / current_user.id
        user_dir.mkdir(exist_ok=True)
        
        file_path = user_dir / unique_filename
        with open(file_path, 'wb') as f:
            f.write(file_content)
        
        file_url = f"/api/files/{current_user.id}/{unique_filename}"
        
        attachment = {
            "id": str(uuid.uuid4()),
            "filename": unique_filename,
            "original_filename": file.filename,
            "file_type": file_type,
            "mime_type": mime_type,
            "size": len(file_content),
            "url": file_url
        }
    
    if not content and not attachment:
        raise HTTPException(status_code=400, detail="Message must have content or attachment")
    
    # Create message
    new_message = Message(
        connection_id=connection_id,
        sender_id=current_user.id,
        sender_name=current_user.name,
        content=content or "",
        attachment=attachment
    )
    
    doc = new_message.model_dump()
    doc['created_at'] = datetime.now(timezone.utc).isoformat()
    await db.messages.insert_one(doc)
    
    # Notify the other user
    other_user_id = connection['receiver_id'] if connection['requester_id'] == current_user.id else connection['requester_id']
    await manager.send_personal_message({
        "type": "new_message",
        "message": {
            "id": new_message.id,
            "connection_id": connection_id,
            "sender_id": current_user.id,
            "sender_name": current_user.name,
            "content": content,
            "attachment": attachment,
            "created_at": doc['created_at']
        }
    }, other_user_id)
    
    # Send push notification
    notification_body = content[:100] if content else f"Sent a {attachment['file_type'] if attachment else 'file'}"
    asyncio.create_task(send_push_notification(
        user_id=other_user_id,
        title=f"New message from {current_user.name}",
        body=notification_body,
        url=f"/connect?chat={connection_id}",
        tag=f"message-{connection_id}"
    ))
    
    return {"message": "Message sent", "id": new_message.id, "attachment": attachment}

# ============== GROUP CHAT FEATURE ==============

@api_router.post("/groups")
async def create_group(group_data: GroupChatCreate, current_user: User = Depends(get_current_user)):
    """Create a new group chat"""
    # Validate member IDs - they must be connections of the current user
    connections = await db.connections.find({
        "status": "accepted",
        "$or": [
            {"requester_id": current_user.id},
            {"receiver_id": current_user.id}
        ]
    }, {"_id": 0}).to_list(1000)
    
    connected_user_ids = set()
    for conn in connections:
        connected_user_ids.add(conn['requester_id'])
        connected_user_ids.add(conn['receiver_id'])
    connected_user_ids.discard(current_user.id)
    
    # Verify all members are connections
    invalid_members = set(group_data.member_ids) - connected_user_ids
    if invalid_members:
        raise HTTPException(status_code=400, detail="All members must be your connections")
    
    if len(group_data.member_ids) < 1:
        raise HTTPException(status_code=400, detail="Group must have at least one other member")
    
    # Create group
    group = GroupChat(
        name=group_data.name,
        description=group_data.description,
        created_by=current_user.id,
        members=[current_user.id] + group_data.member_ids,
        admins=[current_user.id]
    )
    
    doc = group.model_dump()
    doc['created_at'] = datetime.now(timezone.utc).isoformat()
    await db.groups.insert_one(doc)
    
    # Notify members
    for member_id in group_data.member_ids:
        asyncio.create_task(send_push_notification(
            user_id=member_id,
            title="Added to Group",
            body=f"{current_user.name} added you to '{group.name}'",
            url="/connect?tab=groups",
            tag=f"group-{group.id}"
        ))
    
    logger.info(f"Group '{group.name}' created by {current_user.id}")
    return {"message": "Group created", "group_id": group.id}

@api_router.get("/groups")
async def get_user_groups(current_user: User = Depends(get_current_user)):
    """Get all groups the user is a member of"""
    groups = await db.groups.find(
        {"members": current_user.id},
        {"_id": 0}
    ).to_list(100)
    
    # Enrich with member info and last message
    enriched_groups = []
    for group in groups:
        # Get member info
        members = await db.users.find(
            {"id": {"$in": group['members']}},
            {"_id": 0, "password": 0}
        ).to_list(100)
        
        # Get last message
        last_message = await db.group_messages.find_one(
            {"group_id": group['id']},
            {"_id": 0},
            sort=[("created_at", -1)]
        )
        
        group['member_info'] = members
        group['last_message'] = last_message
        group['member_count'] = len(group['members'])
        enriched_groups.append(group)
    
    # Sort by last message
    enriched_groups.sort(
        key=lambda g: g.get('last_message', {}).get('created_at', '') if g.get('last_message') else '',
        reverse=True
    )
    
    return enriched_groups

@api_router.get("/groups/{group_id}")
async def get_group(group_id: str, current_user: User = Depends(get_current_user)):
    """Get group details"""
    group = await db.groups.find_one({"id": group_id}, {"_id": 0})
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if current_user.id not in group['members']:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    
    # Get member info
    members = await db.users.find(
        {"id": {"$in": group['members']}},
        {"_id": 0, "password": 0}
    ).to_list(100)
    
    group['member_info'] = members
    return group

@api_router.patch("/groups/{group_id}")
async def update_group(group_id: str, update: GroupChatUpdate, current_user: User = Depends(get_current_user)):
    """Update group name/description (admins only)"""
    group = await db.groups.find_one({"id": group_id}, {"_id": 0})
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if current_user.id not in group.get('admins', []):
        raise HTTPException(status_code=403, detail="Only admins can update group")
    
    update_data = {}
    if update.name:
        update_data['name'] = update.name
    if update.description is not None:
        update_data['description'] = update.description
    
    if update_data:
        await db.groups.update_one({"id": group_id}, {"$set": update_data})
    
    return {"message": "Group updated"}

@api_router.post("/groups/{group_id}/members")
async def add_group_members(group_id: str, member_ids: List[str], current_user: User = Depends(get_current_user)):
    """Add members to group (admins only)"""
    group = await db.groups.find_one({"id": group_id}, {"_id": 0})
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if current_user.id not in group.get('admins', []):
        raise HTTPException(status_code=403, detail="Only admins can add members")
    
    # Validate new members are connections
    connections = await db.connections.find({
        "status": "accepted",
        "$or": [
            {"requester_id": current_user.id},
            {"receiver_id": current_user.id}
        ]
    }, {"_id": 0}).to_list(1000)
    
    connected_user_ids = set()
    for conn in connections:
        connected_user_ids.add(conn['requester_id'])
        connected_user_ids.add(conn['receiver_id'])
    
    valid_new_members = [m for m in member_ids if m in connected_user_ids and m not in group['members']]
    
    if valid_new_members:
        await db.groups.update_one(
            {"id": group_id},
            {"$addToSet": {"members": {"$each": valid_new_members}}}
        )
        
        # Notify new members
        for member_id in valid_new_members:
            asyncio.create_task(send_push_notification(
                user_id=member_id,
                title="Added to Group",
                body=f"You were added to '{group['name']}'",
                url="/connect?tab=groups",
                tag=f"group-{group_id}"
            ))
    
    return {"message": f"Added {len(valid_new_members)} members"}

@api_router.delete("/groups/{group_id}/leave")
async def leave_group(group_id: str, current_user: User = Depends(get_current_user)):
    """Leave a group chat"""
    group = await db.groups.find_one({"id": group_id}, {"_id": 0})
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if current_user.id not in group['members']:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    
    # Remove from members and admins
    await db.groups.update_one(
        {"id": group_id},
        {
            "$pull": {
                "members": current_user.id,
                "admins": current_user.id
            }
        }
    )
    
    # If no members left, delete the group
    updated_group = await db.groups.find_one({"id": group_id}, {"_id": 0})
    if not updated_group or len(updated_group.get('members', [])) == 0:
        await db.groups.delete_one({"id": group_id})
        await db.group_messages.delete_many({"group_id": group_id})
        logger.info(f"Group {group_id} deleted - no members left")
    elif len(updated_group.get('admins', [])) == 0 and len(updated_group.get('members', [])) > 0:
        # Promote first member to admin
        new_admin = updated_group['members'][0]
        await db.groups.update_one({"id": group_id}, {"$addToSet": {"admins": new_admin}})
    
    return {"message": "Left the group"}

@api_router.get("/groups/{group_id}/messages")
async def get_group_messages(group_id: str, current_user: User = Depends(get_current_user)):
    """Get messages from a group chat"""
    group = await db.groups.find_one({"id": group_id}, {"_id": 0})
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if current_user.id not in group['members']:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    
    messages = await db.group_messages.find(
        {"group_id": group_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(500)
    
    return messages

@api_router.post("/groups/{group_id}/messages")
async def send_group_message(
    group_id: str,
    message: GroupMessageCreate,
    current_user: User = Depends(get_current_user)
):
    """Send a message to a group chat"""
    group = await db.groups.find_one({"id": group_id}, {"_id": 0})
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if current_user.id not in group['members']:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    
    # Create message
    new_message = GroupMessage(
        group_id=group_id,
        sender_id=current_user.id,
        sender_name=current_user.name,
        content=message.content,
        attachment=message.attachment
    )
    
    doc = new_message.model_dump()
    doc['created_at'] = datetime.now(timezone.utc).isoformat()
    await db.group_messages.insert_one(doc)
    
    # Notify all other members
    for member_id in group['members']:
        if member_id != current_user.id:
            await manager.send_personal_message({
                "type": "group_message",
                "group_id": group_id,
                "group_name": group['name'],
                "message": {
                    "id": new_message.id,
                    "sender_id": current_user.id,
                    "sender_name": current_user.name,
                    "content": message.content,
                    "attachment": message.attachment,
                    "created_at": doc['created_at']
                }
            }, member_id)
            
            # Send push notification
            asyncio.create_task(send_push_notification(
                user_id=member_id,
                title=f"{group['name']}",
                body=f"{current_user.name}: {message.content[:50]}..." if len(message.content) > 50 else f"{current_user.name}: {message.content}",
                url=f"/connect?group={group_id}",
                tag=f"group-message-{group_id}"
            ))
    
    return {"message": "Message sent", "id": new_message.id}

@api_router.post("/groups/{group_id}/messages/with-file")
async def send_group_message_with_file(
    group_id: str,
    content: str = Form(""),
    file: UploadFile = File(None),
    current_user: User = Depends(get_current_user)
):
    """Send a message with file to a group chat"""
    group = await db.groups.find_one({"id": group_id}, {"_id": 0})
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    if current_user.id not in group['members']:
        raise HTTPException(status_code=403, detail="Not a member of this group")
    
    attachment = None
    if file and file.filename:
        file_content = await file.read()
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large. Max size is 50MB")
        
        mime_type = file.content_type or mimetypes.guess_type(file.filename)[0] or 'application/octet-stream'
        file_type = get_file_type(mime_type)
        
        ext = os.path.splitext(file.filename)[1] if file.filename else ''
        unique_filename = f"{uuid.uuid4()}{ext}"
        
        user_dir = UPLOADS_DIR / current_user.id
        user_dir.mkdir(exist_ok=True)
        
        file_path = user_dir / unique_filename
        with open(file_path, 'wb') as f:
            f.write(file_content)
        
        file_url = f"/api/files/{current_user.id}/{unique_filename}"
        
        attachment = {
            "id": str(uuid.uuid4()),
            "filename": unique_filename,
            "original_filename": file.filename,
            "file_type": file_type,
            "mime_type": mime_type,
            "size": len(file_content),
            "url": file_url
        }
    
    if not content and not attachment:
        raise HTTPException(status_code=400, detail="Message must have content or attachment")
    
    # Create message
    new_message = GroupMessage(
        group_id=group_id,
        sender_id=current_user.id,
        sender_name=current_user.name,
        content=content or "",
        attachment=attachment
    )
    
    doc = new_message.model_dump()
    doc['created_at'] = datetime.now(timezone.utc).isoformat()
    await db.group_messages.insert_one(doc)
    
    # Notify all other members
    for member_id in group['members']:
        if member_id != current_user.id:
            await manager.send_personal_message({
                "type": "group_message",
                "group_id": group_id,
                "group_name": group['name'],
                "message": {
                    "id": new_message.id,
                    "sender_id": current_user.id,
                    "sender_name": current_user.name,
                    "content": content,
                    "attachment": attachment,
                    "created_at": doc['created_at']
                }
            }, member_id)
            
            notification_body = content[:50] if content else f"Sent a {attachment['file_type']}"
            asyncio.create_task(send_push_notification(
                user_id=member_id,
                title=f"{group['name']}",
                body=f"{current_user.name}: {notification_body}",
                url=f"/connect?group={group_id}",
                tag=f"group-message-{group_id}"
            ))
    
    return {"message": "Message sent", "id": new_message.id, "attachment": attachment}

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
        admin_email = os.environ.get('ADMIN_NOTIFICATION_EMAIL') or os.environ.get('SMTP_USER') or 'mentis.mathematics@gmail.com'
        reporter = await db.users.find_one({"id": current_user.id}, {"_id": 0})
        html_content = f'''
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1e293b; padding: 30px; border-radius: 12px; color: #e2e8f0;">
            <h2 style="color: #ef4444; margin-bottom: 20px;">New User Report 🚨</h2>
            <p><strong>Reported User:</strong> {reported_user.get("name", "Unknown")} ({reported_user.get("email", "Unknown")})</p>
            <p><strong>Reported By:</strong> {reporter.get("name", "Unknown") if reporter else "Unknown"}</p>
            <p><strong>Reason:</strong> {report_data.reason}</p>
            <p><strong>Description:</strong> {report_data.description}</p>
            <hr style="border: none; border-top: 1px solid #334155; margin: 20px 0;">
            <p style="color: #64748b; font-size: 12px;">Please review this report in the Admin Dashboard.</p>
        </div>
        '''
        text_content = f"New User Report:\nReported User: {reported_user.get('name')}\nReason: {report_data.reason}\nDescription: {report_data.description}"
        await send_system_email(admin_email, f'🚨 User Report: {reported_user.get("name", "Unknown")} - Mentis', html_content, text_content)
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
async def get_reels(
    status: Optional[str] = "approved",
    search: Optional[str] = None,
    education_level: Optional[str] = None,
    math_domain: Optional[str] = None,
    difficulty: Optional[str] = None,
    exam_type: Optional[str] = None,
    language: Optional[str] = None,
    video_platform: Optional[str] = None,
    tags: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get all approved reels or pending (for submitter) with optional filters"""
    query = {"status": status}
    
    # Search in caption and tags
    if search:
        query["$or"] = [
            {"caption": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}},
            {"user_name": {"$regex": search, "$options": "i"}}
        ]
    
    # Multi-select filters
    if education_level:
        levels = education_level.split(",")
        query["education_level"] = {"$in": levels}
    
    if math_domain:
        domains = math_domain.split(",")
        query["math_domain"] = {"$in": domains}
    
    if difficulty:
        query["difficulty"] = difficulty
    
    if exam_type:
        exams = exam_type.split(",")
        query["exam_type"] = {"$in": exams}
    
    if language:
        query["language"] = language
    
    if video_platform:
        platforms = video_platform.split(",")
        query["video_platform"] = {"$in": platforms}
    
    if tags:
        tag_list = tags.split(",")
        query["tags"] = {"$in": tag_list}
    
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
    
    reel = await db.reels.find_one({"id": reel_id}, {"_id": 0})
    if not reel:
        raise HTTPException(status_code=404, detail="Reel not found")
    
    result = await db.reels.update_one(
        {"id": reel_id},
        {"$set": {"status": status}}
    )
    
    # If approved, increment user's mentis score by 3 for VEX
    if status == 'approved' and reel.get('status') != 'approved':
        await db.users.update_one(
            {"id": reel['user_id']},
            {"$inc": {"mentis_score": 3, "total_resources": 1}}
        )
    
    return {"message": f"Reel status updated to {status}"}

@api_router.delete("/admin/reels/{reel_id}")
async def delete_reel(reel_id: str, admin: User = Depends(get_admin_user)):
    """Delete a reel (admin only)"""
    result = await db.reels.delete_one({"id": reel_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Reel not found")
    return {"message": "Reel deleted"}

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

# ============== SAVED RESOURCES ==============

@api_router.post("/resources/{resource_id}/save")
async def save_resource(resource_id: str, current_user: User = Depends(get_current_user)):
    """Save or unsave a resource"""
    existing = await db.saved_resources.find_one({
        "user_id": current_user.id,
        "resource_id": resource_id
    })
    
    if existing:
        await db.saved_resources.delete_one({"id": existing['id']})
        return {"message": "Resource unsaved", "saved": False}
    
    saved = SavedResource(
        user_id=current_user.id,
        resource_id=resource_id
    )
    doc = saved.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.saved_resources.insert_one(doc)
    
    return {"message": "Resource saved", "saved": True}

@api_router.get("/saved-resources")
async def get_saved_resources(current_user: User = Depends(get_current_user)):
    """Get all saved resources for current user"""
    saved = await db.saved_resources.find({"user_id": current_user.id}, {"_id": 0}).to_list(500)
    return saved

# ============== SAVED REELS ==============

@api_router.post("/reels/{reel_id}/save")
async def save_reel(reel_id: str, current_user: User = Depends(get_current_user)):
    """Save or unsave a reel"""
    existing = await db.saved_reels.find_one({
        "user_id": current_user.id,
        "reel_id": reel_id
    })
    
    if existing:
        await db.saved_reels.delete_one({"id": existing['id']})
        return {"message": "Reel unsaved", "saved": False}
    
    saved = {
        "id": str(uuid.uuid4()),
        "user_id": current_user.id,
        "reel_id": reel_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.saved_reels.insert_one(saved)
    
    return {"message": "Reel saved", "saved": True}

@api_router.get("/saved-reels")
async def get_saved_reels(current_user: User = Depends(get_current_user)):
    """Get all saved reels for current user"""
    saved = await db.saved_reels.find({"user_id": current_user.id}, {"_id": 0}).to_list(500)
    return saved

# ============== EMAIL REQUESTS ==============

@api_router.post("/users/{user_id}/request-email")
async def request_email(user_id: str, current_user: User = Depends(get_current_user)):
    """Request to see another user's email"""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot request your own email")
    
    # Check if already requested
    existing = await db.email_requests.find_one({
        "requester_id": current_user.id,
        "target_user_id": user_id
    })
    
    if existing:
        return {"message": "Request already sent", "status": existing['status']}
    
    request = EmailRequest(
        requester_id=current_user.id,
        target_user_id=user_id
    )
    doc = request.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.email_requests.insert_one(doc)
    
    return {"message": "Email request sent", "request_id": request.id}

@api_router.get("/email-requests")
async def get_email_requests(current_user: User = Depends(get_current_user)):
    """Get email requests sent to current user"""
    requests = await db.email_requests.find({"target_user_id": current_user.id}, {"_id": 0}).to_list(100)
    
    for req in requests:
        requester = await db.users.find_one({"id": req['requester_id']}, {"_id": 0, "password": 0, "email": 0})
        req['requester'] = requester
    
    return requests

@api_router.patch("/email-requests/{request_id}")
async def respond_email_request(request_id: str, status: str, current_user: User = Depends(get_current_user)):
    """Approve or reject an email request"""
    if status not in ['approved', 'rejected']:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    request = await db.email_requests.find_one({"id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if request['target_user_id'] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.email_requests.update_one(
        {"id": request_id},
        {"$set": {"status": status}}
    )
    
    return {"message": f"Request {status}"}

@api_router.get("/users/{user_id}/email-visibility")
async def check_email_visibility(user_id: str, current_user: User = Depends(get_current_user)):
    """Check if current user can see target user's email"""
    if user_id == current_user.id:
        return {"can_see_email": True}
    
    approved = await db.email_requests.find_one({
        "requester_id": current_user.id,
        "target_user_id": user_id,
        "status": "approved"
    })
    
    return {"can_see_email": approved is not None}

# ============== CURIOFACT SUBMISSIONS ==============

@api_router.post("/curiofacts/submit")
async def submit_curiofact(fact_data: CuriofactCreate, current_user: User = Depends(get_current_user)):
    """Submit a curiofact for approval"""
    submission = CuriofactSubmission(
        user_id=current_user.id,
        user_name=current_user.name,
        title=fact_data.title,
        content=fact_data.content,
        image_url=fact_data.image_url
    )
    doc = submission.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.curiofact_submissions.insert_one(doc)
    
    return {"message": "Curiofact submitted for approval", "id": submission.id}

@api_router.get("/curiofacts/pending")
async def get_pending_curiofacts(admin: User = Depends(get_admin_user)):
    """Get pending curiofact submissions (admin only)"""
    submissions = await db.curiofact_submissions.find({"status": "pending"}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return submissions

@api_router.patch("/admin/curiofacts/{submission_id}")
async def approve_curiofact(submission_id: str, status: str, admin: User = Depends(get_admin_user)):
    """Approve or reject a curiofact submission"""
    if status not in ['approved', 'rejected']:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    submission = await db.curiofact_submissions.find_one({"id": submission_id}, {"_id": 0})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    if status == 'approved':
        # Create the actual curiofact
        new_fact = {
            "id": str(uuid.uuid4()),
            "title": submission['title'],
            "content": submission['content'],
            "image_url": submission.get('image_url'),
            "published_at": datetime.now(timezone.utc).isoformat(),
            "submitted_by": submission['user_id'],
            "uploader_name": submission['user_name']
        }
        await db.curiofacts.insert_one(new_fact)
        
        # Update user's mentis score by 1 for curiofact
        await db.users.update_one(
            {"id": submission['user_id']},
            {"$inc": {"mentis_score": 1, "total_resources": 1}}
        )
    
    await db.curiofact_submissions.update_one(
        {"id": submission_id},
        {"$set": {"status": status}}
    )
    
    return {"message": f"Curiofact {status}"}

# ============== MATRIX MEMBERS (PUBLIC VIEW) ==============

@api_router.get("/matrix-members-public")
async def get_matrix_members_public():
    """Get matrix members with public details only (no email)"""
    members = await db.matrix_registrations.find({}, {"_id": 0, "email": 0}).to_list(500)
    return members

# ============== UPDATE USER PROFILE ==============

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None

@api_router.patch("/users/me")
async def update_profile(updates: UserUpdate, current_user: User = Depends(get_current_user)):
    """Update current user's profile"""
    update_data = {}
    
    if updates.name and updates.name.strip():
        update_data['name'] = updates.name.strip()
    
    if updates.email and updates.email.strip():
        # Check if email is already taken
        existing = await db.users.find_one({"email": updates.email.strip(), "id": {"$ne": current_user.id}})
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        update_data['email'] = updates.email.strip()
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No updates provided")
    
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": update_data}
    )
    
    # Get updated user
    updated_user = await db.users.find_one({"id": current_user.id}, {"_id": 0, "password": 0})
    
    return {"message": "Profile updated", "user": updated_user}

# ============== USER PENDING ITEMS ==============

@api_router.get("/users/me/pending")
async def get_user_pending_items(current_user: User = Depends(get_current_user)):
    """Get current user's pending resources and reels"""
    pending_resources = await db.resources.find({
        "submitted_by": current_user.id,
        "status": "pending"
    }, {"_id": 0}).to_list(50)
    
    pending_reels = await db.reels.find({
        "user_id": current_user.id,
        "status": "pending"
    }, {"_id": 0}).to_list(50)
    
    pending_curiofacts = await db.curiofact_submissions.find({
        "user_id": current_user.id,
        "status": "pending"
    }, {"_id": 0}).to_list(50)
    
    return {
        "pending_resources": pending_resources,
        "pending_reels": pending_reels,
        "pending_curiofacts": pending_curiofacts
    }

# Initialize Master Admin on startup
@app.on_event("startup")
async def setup_master_admin():
    """Set up the master admin user on startup"""
    master_admin_email = "atreyaghoshal.68@gmail.com"
    
    # Check if user exists
    user = await db.users.find_one({"email": master_admin_email})
    if user:
        # Update role to master_admin and ensure email is verified
        updates = {"role": "master_admin", "email_verified": True}
        if user.get('role') != 'master_admin' or not user.get('email_verified'):
            await db.users.update_one(
                {"email": master_admin_email},
                {"$set": updates}
            )
            logger.info(f"Updated {master_admin_email} to master_admin role with verified email")
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

# ============== ABOUT US SECTION ==============

@api_router.get("/about-us")
async def get_about_us():
    """Get about us content (public)"""
    content = await db.about_us.find_one({"id": "about_us_main"}, {"_id": 0})
    if not content:
        # Return default content
        return {
            "id": "about_us_main",
            "tagline": "Empowering the mathematics community through collaboration and knowledge sharing",
            "community_info": None,
            "foundation_info": None,
            "vision": "To create a world where mathematical knowledge is accessible to everyone and mathematical thinking is celebrated.",
            "mission": "To build a supportive platform where mathematics enthusiasts can learn, share, and grow together.",
            "values": "Collaboration, curiosity, inclusivity, and the pursuit of mathematical excellence.",
            "instructions": None
        }
    return content

@api_router.patch("/master-admin/about-us")
async def update_about_us(updates: AboutUsUpdate, admin: User = Depends(get_master_admin_user)):
    """Update about us content (Master Admin only)"""
    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    update_data['updated_by'] = admin.id
    
    await db.about_us.update_one(
        {"id": "about_us_main"},
        {"$set": update_data},
        upsert=True
    )
    
    return {"message": "About Us content updated successfully"}

# ============== TUTORIALS SECTION ==============

@api_router.get("/tutorials")
async def get_tutorials():
    """Get all tutorials (public)"""
    tutorials = await db.tutorials.find({}, {"_id": 0}).sort("order", 1).to_list(50)
    return tutorials

@api_router.post("/master-admin/tutorials")
async def create_tutorial(tutorial_data: TutorialCreate, admin: User = Depends(get_master_admin_user)):
    """Create a new tutorial (Master Admin only)"""
    tutorial = Tutorial(
        title=tutorial_data.title,
        description=tutorial_data.description,
        video_url=tutorial_data.video_url,
        order=tutorial_data.order or 0,
        created_by=admin.id
    )
    doc = tutorial.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.tutorials.insert_one(doc)
    
    return {"message": "Tutorial created successfully", "id": tutorial.id}

@api_router.patch("/master-admin/tutorials/{tutorial_id}")
async def update_tutorial(tutorial_id: str, tutorial_data: TutorialCreate, admin: User = Depends(get_master_admin_user)):
    """Update a tutorial (Master Admin only)"""
    update_data = {k: v for k, v in tutorial_data.model_dump().items() if v is not None}
    
    result = await db.tutorials.update_one(
        {"id": tutorial_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Tutorial not found")
    
    return {"message": "Tutorial updated successfully"}

@api_router.delete("/master-admin/tutorials/{tutorial_id}")
async def delete_tutorial(tutorial_id: str, admin: User = Depends(get_master_admin_user)):
    """Delete a tutorial (Master Admin only)"""
    result = await db.tutorials.delete_one({"id": tutorial_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tutorial not found")
    
    return {"message": "Tutorial deleted successfully"}

# ============== FAQ ENDPOINTS ==============

@api_router.get("/faqs")
async def get_faqs():
    """Get all FAQs (public)"""
    faqs = await db.faqs.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    for faq in faqs:
        if isinstance(faq.get('created_at'), str):
            faq['created_at'] = datetime.fromisoformat(faq['created_at'])
    return faqs

@api_router.post("/master-admin/faqs")
async def create_faq(faq_data: FAQCreate, admin: User = Depends(get_master_admin_user)):
    """Create a new FAQ (Master Admin only)"""
    faq = FAQ(
        question=faq_data.question,
        answer=faq_data.answer,
        order=faq_data.order or 0,
        created_by=admin.id
    )
    doc = faq.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.faqs.insert_one(doc)
    return {"message": "FAQ created successfully", "id": faq.id}

@api_router.patch("/master-admin/faqs/{faq_id}")
async def update_faq(faq_id: str, faq_data: FAQUpdate, admin: User = Depends(get_master_admin_user)):
    """Update a FAQ (Master Admin only)"""
    update_data = {k: v for k, v in faq_data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = await db.faqs.update_one(
        {"id": faq_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="FAQ not found")
    
    return {"message": "FAQ updated successfully"}

@api_router.delete("/master-admin/faqs/{faq_id}")
async def delete_faq(faq_id: str, admin: User = Depends(get_master_admin_user)):
    """Delete a FAQ (Master Admin only)"""
    result = await db.faqs.delete_one({"id": faq_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="FAQ not found")
    
    return {"message": "FAQ deleted successfully"}

# ============== MATRIX MEMBER MANAGEMENT (Master Admin) ==============

@api_router.patch("/master-admin/matrix-members/{member_id}")
async def update_matrix_member(member_id: str, update_data: MatrixMemberUpdate, admin: User = Depends(get_master_admin_user)):
    """Update a Matrix member's details (Master Admin only)"""
    updates = {}
    
    if update_data.name is not None:
        new_name = update_data.name.upper().strip()
        # Check if name is already taken by another member
        existing = await db.matrix_registrations.find_one({
            "name": {"$regex": f"^{new_name}$", "$options": "i"},
            "id": {"$ne": member_id}
        })
        if existing:
            raise HTTPException(status_code=400, detail="Name already exists for another member")
        updates['name'] = new_name
    
    if update_data.email is not None:
        # Check if email is already taken by another member
        existing = await db.matrix_registrations.find_one({
            "email": {"$regex": f"^{update_data.email}$", "$options": "i"},
            "id": {"$ne": member_id}
        })
        if existing:
            raise HTTPException(status_code=400, detail="Email already exists for another member")
        updates['email'] = update_data.email
    
    if update_data.college is not None:
        updates['college'] = update_data.college.upper().strip()
    
    if update_data.interests is not None:
        updates['interests'] = update_data.interests
    
    if not updates:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = await db.matrix_registrations.update_one(
        {"id": member_id},
        {"$set": updates}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Matrix member not found")
    
    return {"message": "Matrix member updated successfully"}

# ============== SINGLE ITEM FETCH FOR DEEP LINKING ==============

@api_router.get("/resources/{resource_id}")
async def get_single_resource(resource_id: str):
    """Get a single resource by ID (for deep linking)"""
    resource = await db.resources.find_one({"id": resource_id, "status": "approved"}, {"_id": 0})
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    if isinstance(resource.get('created_at'), str):
        resource['created_at'] = datetime.fromisoformat(resource['created_at'])
    
    # Get uploader info
    if resource.get('submitted_by'):
        uploader = await db.users.find_one({"id": resource['submitted_by']}, {"_id": 0, "password": 0})
        if uploader:
            resource['uploader_name'] = uploader.get('name', 'Unknown')
    
    return resource

@api_router.get("/curiofacts/{fact_id}")
async def get_single_curiofact(fact_id: str):
    """Get a single curiofact by ID (for deep linking)"""
    fact = await db.curiofacts.find_one({"id": fact_id}, {"_id": 0})
    if not fact:
        raise HTTPException(status_code=404, detail="Curiofact not found")
    
    if isinstance(fact.get('published_at'), str):
        fact['published_at'] = datetime.fromisoformat(fact['published_at'])
    
    return fact

@api_router.get("/reels/{reel_id}")
async def get_single_reel(reel_id: str, current_user: User = Depends(get_current_user)):
    """Get a single reel by ID (for deep linking)"""
    reel = await db.reels.find_one({"id": reel_id, "status": "approved"}, {"_id": 0})
    if not reel:
        raise HTTPException(status_code=404, detail="Reel not found")
    
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
    
    return reel

# ============== FILTER OPTIONS API ==============

# Default filter options to seed the database
DEFAULT_FILTER_OPTIONS = [
    # Education Levels
    {"category": "education_level", "value": "primary", "label": "Primary School", "order": 1},
    {"category": "education_level", "value": "high_school", "label": "High School", "order": 2},
    {"category": "education_level", "value": "ug", "label": "Undergraduate (UG)", "order": 3},
    {"category": "education_level", "value": "pg", "label": "Postgraduate (PG)", "order": 4},
    {"category": "education_level", "value": "research", "label": "Research", "order": 5},
    
    # Math Domains
    {"category": "math_domain", "value": "algebra", "label": "Algebra", "order": 1},
    {"category": "math_domain", "value": "geometry", "label": "Geometry", "order": 2},
    {"category": "math_domain", "value": "calculus", "label": "Calculus", "order": 3},
    {"category": "math_domain", "value": "trigonometry", "label": "Trigonometry", "order": 4},
    {"category": "math_domain", "value": "statistics", "label": "Statistics & Probability", "order": 5},
    {"category": "math_domain", "value": "number_theory", "label": "Number Theory", "order": 6},
    {"category": "math_domain", "value": "linear_algebra", "label": "Linear Algebra", "order": 7},
    {"category": "math_domain", "value": "discrete_math", "label": "Discrete Mathematics", "order": 8},
    {"category": "math_domain", "value": "differential_equations", "label": "Differential Equations", "order": 9},
    {"category": "math_domain", "value": "real_analysis", "label": "Real Analysis", "order": 10},
    {"category": "math_domain", "value": "complex_analysis", "label": "Complex Analysis", "order": 11},
    {"category": "math_domain", "value": "topology", "label": "Topology", "order": 12},
    {"category": "math_domain", "value": "applied_math", "label": "Applied Mathematics", "order": 13},
    {"category": "math_domain", "value": "combinatorics", "label": "Combinatorics", "order": 14},
    
    # Class/Grade
    {"category": "class_grade", "value": "class_1", "label": "Class 1", "order": 1},
    {"category": "class_grade", "value": "class_2", "label": "Class 2", "order": 2},
    {"category": "class_grade", "value": "class_3", "label": "Class 3", "order": 3},
    {"category": "class_grade", "value": "class_4", "label": "Class 4", "order": 4},
    {"category": "class_grade", "value": "class_5", "label": "Class 5", "order": 5},
    {"category": "class_grade", "value": "class_6", "label": "Class 6", "order": 6},
    {"category": "class_grade", "value": "class_7", "label": "Class 7", "order": 7},
    {"category": "class_grade", "value": "class_8", "label": "Class 8", "order": 8},
    {"category": "class_grade", "value": "class_9", "label": "Class 9", "order": 9},
    {"category": "class_grade", "value": "class_10", "label": "Class 10", "order": 10},
    {"category": "class_grade", "value": "class_11", "label": "Class 11", "order": 11},
    {"category": "class_grade", "value": "class_12", "label": "Class 12", "order": 12},
    {"category": "class_grade", "value": "year_1", "label": "Year 1 (College)", "order": 13},
    {"category": "class_grade", "value": "year_2", "label": "Year 2 (College)", "order": 14},
    {"category": "class_grade", "value": "year_3", "label": "Year 3 (College)", "order": 15},
    {"category": "class_grade", "value": "year_4", "label": "Year 4 (College)", "order": 16},
    
    # Difficulty
    {"category": "difficulty", "value": "beginner", "label": "Beginner", "order": 1},
    {"category": "difficulty", "value": "intermediate", "label": "Intermediate", "order": 2},
    {"category": "difficulty", "value": "advanced", "label": "Advanced", "order": 3},
    {"category": "difficulty", "value": "expert", "label": "Expert", "order": 4},
    
    # Exam Types
    {"category": "exam_type", "value": "jee", "label": "JEE (Main/Advanced)", "order": 1},
    {"category": "exam_type", "value": "neet", "label": "NEET", "order": 2},
    {"category": "exam_type", "value": "gate", "label": "GATE", "order": 3},
    {"category": "exam_type", "value": "gre", "label": "GRE", "order": 4},
    {"category": "exam_type", "value": "olympiad", "label": "Math Olympiad", "order": 5},
    {"category": "exam_type", "value": "cat", "label": "CAT", "order": 6},
    {"category": "exam_type", "value": "cbse", "label": "CBSE Board", "order": 7},
    {"category": "exam_type", "value": "icse", "label": "ICSE Board", "order": 8},
    {"category": "exam_type", "value": "state_board", "label": "State Board", "order": 9},
    
    # Languages
    {"category": "language", "value": "english", "label": "English", "order": 1},
    {"category": "language", "value": "hindi", "label": "Hindi", "order": 2},
    {"category": "language", "value": "bengali", "label": "Bengali", "order": 3},
    {"category": "language", "value": "tamil", "label": "Tamil", "order": 4},
    {"category": "language", "value": "telugu", "label": "Telugu", "order": 5},
    {"category": "language", "value": "marathi", "label": "Marathi", "order": 6},
    {"category": "language", "value": "gujarati", "label": "Gujarati", "order": 7},
    {"category": "language", "value": "kannada", "label": "Kannada", "order": 8},
    {"category": "language", "value": "malayalam", "label": "Malayalam", "order": 9},
    {"category": "language", "value": "punjabi", "label": "Punjabi", "order": 10},
    
    # Video Platforms (for VEX)
    {"category": "video_platform", "value": "youtube", "label": "YouTube", "order": 1},
    {"category": "video_platform", "value": "instagram", "label": "Instagram", "order": 2},
    {"category": "video_platform", "value": "facebook", "label": "Facebook", "order": 3},
    {"category": "video_platform", "value": "tiktok", "label": "TikTok", "order": 4},
    {"category": "video_platform", "value": "vimeo", "label": "Vimeo", "order": 5},
    {"category": "video_platform", "value": "twitter", "label": "Twitter/X", "order": 6},
    {"category": "video_platform", "value": "reddit", "label": "Reddit", "order": 7},
    {"category": "video_platform", "value": "google_drive", "label": "Google Drive", "order": 8},
    {"category": "video_platform", "value": "other", "label": "Other", "order": 9},
    
    # Game Difficulty (for Funamatics)
    {"category": "game_difficulty", "value": "easy", "label": "Easy", "order": 1},
    {"category": "game_difficulty", "value": "medium", "label": "Medium", "order": 2},
    {"category": "game_difficulty", "value": "hard", "label": "Hard", "order": 3},
]

@api_router.get("/filter-options")
async def get_filter_options():
    """Get all active filter options grouped by category"""
    # Check if filter options exist, if not seed them
    count = await db.filter_options.count_documents({})
    if count == 0:
        # Seed default filter options
        for opt in DEFAULT_FILTER_OPTIONS:
            opt_doc = FilterOption(**opt).model_dump()
            opt_doc['created_at'] = opt_doc['created_at'].isoformat()
            await db.filter_options.insert_one(opt_doc)
    
    options = await db.filter_options.find({"is_active": True}, {"_id": 0}).sort("order", 1).to_list(500)
    
    # Group by category
    grouped = {}
    for opt in options:
        cat = opt['category']
        if cat not in grouped:
            grouped[cat] = []
        grouped[cat].append(opt)
    
    return grouped

@api_router.get("/admin/filter-options")
async def get_all_filter_options(admin: User = Depends(get_admin_user)):
    """Get all filter options including inactive ones (admin only)"""
    options = await db.filter_options.find({}, {"_id": 0}).sort([("category", 1), ("order", 1)]).to_list(500)
    
    # Group by category
    grouped = {}
    for opt in options:
        if isinstance(opt.get('created_at'), str):
            opt['created_at'] = datetime.fromisoformat(opt['created_at'])
        cat = opt['category']
        if cat not in grouped:
            grouped[cat] = []
        grouped[cat].append(opt)
    
    return grouped

@api_router.post("/admin/filter-options")
async def create_filter_option(option_data: FilterOptionCreate, admin: User = Depends(get_admin_user)):
    """Create a new filter option (admin only)"""
    # Check if value already exists in category
    existing = await db.filter_options.find_one({
        "category": option_data.category,
        "value": option_data.value
    })
    if existing:
        raise HTTPException(status_code=400, detail="Filter option with this value already exists in this category")
    
    option = FilterOption(**option_data.model_dump())
    doc = option.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.filter_options.insert_one(doc)
    
    return {"message": "Filter option created", "id": option.id}

@api_router.patch("/admin/filter-options/{option_id}")
async def update_filter_option(option_id: str, update_data: FilterOptionUpdate, admin: User = Depends(get_admin_user)):
    """Update a filter option (admin only)"""
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.filter_options.update_one(
        {"id": option_id},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Filter option not found")
    
    return {"message": "Filter option updated"}

@api_router.delete("/admin/filter-options/{option_id}")
async def delete_filter_option(option_id: str, admin: User = Depends(get_admin_user)):
    """Delete a filter option (admin only)"""
    result = await db.filter_options.delete_one({"id": option_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Filter option not found")
    
    return {"message": "Filter option deleted"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint for Kubernetes
@app.get("/api/health")
async def health_check():
    """Health check endpoint for Kubernetes liveness/readiness probes"""
    try:
        # Quick database ping to verify connectivity
        await db.command('ping')
        return {"status": "healthy", "database": "connected", "version": "ea723b1"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e), "version": "ea723b1"}

@app.get("/api/debug-email")
async def debug_email():
    """Diagnose email transport connectivity and credentials on Render host"""
    import socket
    smtp_test = {}
    for port in [587, 465, 25]:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(2.5)
        try:
            res = s.connect_ex(("smtp.gmail.com", port))
            smtp_test[f"port_{port}"] = "OPEN" if res == 0 else f"BLOCKED (code {res})"
        except Exception as e:
            smtp_test[f"port_{port}"] = f"ERROR: {str(e)}"
        finally:
            s.close()
            
    sg_key = os.environ.get("SENDGRID_API_KEY", "")
    resend_key = os.environ.get("RESEND_API_KEY", "")
    return {
        "smtp_connectivity": smtp_test,
        "has_sendgrid_key": bool(sg_key),
        "sendgrid_key_prefix": sg_key[:8] if sg_key else None,
        "has_resend_key": bool(resend_key),
        "smtp_user": os.environ.get("SMTP_USER", "mentis.mathematics@gmail.com"),
        "has_smtp_password": bool(os.environ.get("SMTP_PASSWORD") or "tcmpubbriehmnufa"),
    }

@app.get("/health")
async def health_check_root():
    """Root health check endpoint"""
    return {"status": "ok"}

async def send_resource_approval_email(user_email: str, user_name: str, resource_title: str):
    """Send email notification when a user's resource is approved"""
    frontend_url = os.environ.get('FRONTEND_URL', 'https://mentismathematicsfoundation.com').rstrip('/')
    html_content = f'''
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1e293b; padding: 30px; border-radius: 12px; color: #e2e8f0;">
        <h2 style="color: #f97316; margin-bottom: 20px;">Great News, {user_name}! 🎉</h2>
        <p style="font-size: 16px; line-height: 1.6;">
            Your submitted resource <strong style="color: #f97316;">"{resource_title}"</strong> has been reviewed and approved by our team!
        </p>
        <p style="font-size: 16px; line-height: 1.6;">
            It's now live on the Resource Hub and available to the entire Mentis community. Thank you for contributing to our growing collection of mathematics resources!
        </p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{frontend_url}/resources" style="background: linear-gradient(to right, #f97316, #ec4899); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">View Resource Hub</a>
        </div>
        <hr style="border: none; border-top: 1px solid #334155; margin: 30px 0;">
        <p style="color: #64748b; font-size: 12px; text-align: center;">
            Mentis Mathematics Foundation • <a href="{frontend_url}" style="color: #f97316; text-decoration: none;">mentismathematicsfoundation.com</a>
        </p>
    </div>
    '''
    text_content = f"Great news {user_name}! Your resource '{resource_title}' has been approved and is now live on the Mentis Resource Hub: {frontend_url}/resources"
    return await send_system_email(user_email, '🎉 Your Resource Has Been Approved! - Mentis', html_content, text_content)

async def send_resource_rejection_email(user_email: str, user_name: str, resource_title: str):
    """Send email notification when a user's resource is rejected"""
    frontend_url = os.environ.get('FRONTEND_URL', 'https://mentismathematicsfoundation.com').rstrip('/')
    html_content = f'''
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1e293b; padding: 30px; border-radius: 12px; color: #e2e8f0;">
        <h2 style="color: #f97316; margin-bottom: 20px;">Hello {user_name},</h2>
        <p style="font-size: 16px; line-height: 1.6;">
            Thank you for your contribution to Mentis! After careful review, we were unable to approve your submitted resource <strong style="color: #94a3b8;">"{resource_title}"</strong> at this time.
        </p>
        <ul style="color: #94a3b8; font-size: 14px; line-height: 1.8;">
            <li>The content may not align with our community guidelines</li>
            <li>The resource link may be inaccessible or broken</li>
            <li>Similar content already exists in our Resource Hub</li>
            <li>The description or metadata needs improvement</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{frontend_url}/resources" style="background: linear-gradient(to right, #f97316, #ec4899); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">Submit Another Resource</a>
        </div>
        <hr style="border: none; border-top: 1px solid #334155; margin: 30px 0;">
        <p style="color: #64748b; font-size: 12px; text-align: center;">
            Mentis Mathematics Foundation • <a href="{frontend_url}" style="color: #f97316; text-decoration: none;">mentismathematicsfoundation.com</a>
        </p>
    </div>
    '''
    text_content = f"Hello {user_name}, update on your resource '{resource_title}'. Check {frontend_url}/resources for guidelines."
    return await send_system_email(user_email, 'Resource Submission Update - Mentis', html_content, text_content)

async def send_unread_messages_notification_email(user_email: str, user_name: str, unread_count: int, sender_names: List[str]):
    """Send email notification when user has unread messages for more than 24 hours"""
    frontend_url = os.environ.get('FRONTEND_URL', 'https://mentismathematicsfoundation.com').rstrip('/')
    senders_text = ", ".join(sender_names[:3])
    if len(sender_names) > 3:
        senders_text += f" and {len(sender_names) - 3} others"
    html_content = f'''
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1e293b; padding: 30px; border-radius: 12px; color: #e2e8f0;">
        <h2 style="color: #f97316; margin-bottom: 20px;">Hey {user_name}! 💬</h2>
        <p style="font-size: 16px; line-height: 1.6;">
            You have <strong style="color: #f97316;">{unread_count} unread message{"s" if unread_count > 1 else ""}</strong> waiting for you on Mentis!
        </p>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
            Messages from: <strong style="color: #e2e8f0;">{senders_text}</strong>
        </p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{frontend_url}/connect" style="background: linear-gradient(to right, #f97316, #ec4899); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">View Messages</a>
        </div>
        <hr style="border: none; border-top: 1px solid #334155; margin: 30px 0;">
        <p style="color: #64748b; font-size: 12px; text-align: center;">
            Mentis Mathematics Foundation • <a href="{frontend_url}" style="color: #f97316; text-decoration: none;">mentismathematicsfoundation.com</a>
        </p>
    </div>
    '''
    text_content = f"Hey {user_name}! You have {unread_count} unread message(s) on Mentis: {frontend_url}/connect"
    return await send_system_email(user_email, f'💬 You have {unread_count} unread message{"s" if unread_count > 1 else ""} on Mentis!', html_content, text_content)

async def check_and_notify_unread_messages():
    """Background task to check for unread messages older than 24 hours and send notifications"""
    try:
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=24)
        
        # Find all unread messages older than 24 hours
        pipeline = [
            {
                "$match": {
                    "read": False,
                    "created_at": {"$lt": cutoff_time}
                }
            },
            {
                "$lookup": {
                    "from": "connections",
                    "localField": "connection_id",
                    "foreignField": "id",
                    "as": "connection"
                }
            },
            {"$unwind": "$connection"},
            {
                "$project": {
                    "sender_id": 1,
                    "receiver_id": {
                        "$cond": [
                            {"$eq": ["$sender_id", "$connection.requester_id"]},
                            "$connection.receiver_id",
                            "$connection.requester_id"
                        ]
                    },
                    "connection_id": 1
                }
            },
            {
                "$group": {
                    "_id": "$receiver_id",
                    "unread_count": {"$sum": 1},
                    "sender_ids": {"$addToSet": "$sender_id"}
                }
            }
        ]
        
        # Track which users we've already notified today
        today_key = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        
        async for doc in db.messages.aggregate(pipeline):
            receiver_id = doc["_id"]
            unread_count = doc["unread_count"]
            sender_ids = doc["sender_ids"]
            
            # Check if we already sent notification today for this user
            existing_notification = await db.message_notifications.find_one({
                "user_id": receiver_id,
                "date_key": today_key
            })
            
            if existing_notification:
                continue  # Already notified today
            
            # Get user and sender details
            user = await db.users.find_one({"id": receiver_id}, {"_id": 0})
            if not user or not user.get('email'):
                continue
            
            # Get sender names
            sender_names = []
            for sid in sender_ids[:5]:
                sender = await db.users.find_one({"id": sid}, {"_id": 0, "name": 1})
                if sender:
                    sender_names.append(sender.get('name', 'Someone'))
            
            # Send email notification
            await send_unread_messages_notification_email(
                user_email=user['email'],
                user_name=user.get('name', 'Mentis User'),
                unread_count=unread_count,
                sender_names=sender_names
            )
            
            # Record that we sent notification
            await db.message_notifications.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": receiver_id,
                "date_key": today_key,
                "sent_at": datetime.now(timezone.utc)
            })
            
        logger.info("Completed checking for unread messages notifications")
        
    except Exception as e:
        logger.error(f"Error in check_and_notify_unread_messages: {str(e)}")

# Background task scheduler
async def scheduled_notification_checker():
    """Run the unread messages check every hour"""
    while True:
        await asyncio.sleep(3600)  # Wait 1 hour
        await check_and_notify_unread_messages()

@app.on_event("startup")
async def startup_event():
    """Start background tasks on app startup"""
    asyncio.create_task(scheduled_notification_checker())
    logger.info("Started scheduled notification checker background task")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()