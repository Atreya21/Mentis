from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

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
    submitted_by: str
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
        return User(**user_doc)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin_user(user: User = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
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
    if not user_doc or not pwd_context.verify(login_data.password, user_doc['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if isinstance(user_doc['created_at'], str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
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
    return resources

@api_router.patch("/resources/{resource_id}", response_model=Resource)
async def update_resource_status(resource_id: str, update: ResourceApprove, admin: User = Depends(get_admin_user)):
    result = await db.resources.find_one_and_update(
        {"id": resource_id},
        {"$set": {"status": update.status}},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Resource not found")
    result.pop('_id', None)
    if isinstance(result['created_at'], str):
        result['created_at'] = datetime.fromisoformat(result['created_at'])
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
    game = Game(**game_data.model_dump())
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
    fact = Curiofact(**fact_data.model_dump())
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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()