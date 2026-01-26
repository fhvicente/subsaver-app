from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production-12345678')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ==================== Models ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    currency: str
    timezone: str
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class UserUpdate(BaseModel):
    currency: Optional[str] = None
    timezone: Optional[str] = None

class SubscriptionCreate(BaseModel):
    service_name: str
    price: float
    renewal_date: str  # ISO date string
    start_date: Optional[str] = None
    category: Optional[str] = None
    notes: Optional[str] = None
    shared_with: Optional[List[str]] = None  # List of names/emails sharing
    split_count: Optional[int] = 1  # Total number of people splitting cost

class SubscriptionUpdate(BaseModel):
    service_name: Optional[str] = None
    price: Optional[float] = None
    renewal_date: Optional[str] = None
    start_date: Optional[str] = None
    category: Optional[str] = None
    notes: Optional[str] = None
    shared_with: Optional[List[str]] = None
    split_count: Optional[int] = None

class SubscriptionResponse(BaseModel):
    id: str
    service_name: str
    price: float
    renewal_date: str
    start_date: Optional[str] = None
    category: Optional[str] = None
    notes: Optional[str] = None
    monthly_cost: float
    annual_cost: float
    days_until_renewal: int
    created_at: datetime
    shared_with: Optional[List[str]] = None
    split_count: int = 1
    user_share: float  # User's portion of the cost

class DashboardAnalytics(BaseModel):
    total_subscriptions: int
    monthly_spend: float
    annual_spend: float
    next_renewal: Optional[SubscriptionResponse] = None
    category_breakdown: dict

class SubscriptionTemplate(BaseModel):
    name: str
    category: str
    suggested_price: Optional[float] = None
    description: Optional[str] = None

# Common subscription templates
COMMON_TEMPLATES = [
    {"name": "Netflix", "category": "Streaming", "suggested_price": 15.99, "description": "Video streaming service"},
    {"name": "Spotify", "category": "Music", "suggested_price": 9.99, "description": "Music streaming service"},
    {"name": "YouTube Premium", "category": "Streaming", "suggested_price": 11.99, "description": "Ad-free YouTube"},
    {"name": "Amazon Prime", "category": "Shopping & Streaming", "suggested_price": 14.99, "description": "Shopping benefits and Prime Video"},
    {"name": "Disney+", "category": "Streaming", "suggested_price": 7.99, "description": "Disney content streaming"},
    {"name": "Apple Music", "category": "Music", "suggested_price": 10.99, "description": "Apple music streaming"},
    {"name": "Hulu", "category": "Streaming", "suggested_price": 7.99, "description": "TV shows and movies"},
    {"name": "HBO Max", "category": "Streaming", "suggested_price": 15.99, "description": "HBO content and more"},
    {"name": "Adobe Creative Cloud", "category": "Productivity", "suggested_price": 54.99, "description": "Creative software suite"},
    {"name": "Microsoft 365", "category": "Productivity", "suggested_price": 6.99, "description": "Office productivity suite"},
    {"name": "Dropbox", "category": "Cloud Storage", "suggested_price": 11.99, "description": "Cloud file storage"},
    {"name": "iCloud", "category": "Cloud Storage", "suggested_price": 2.99, "description": "Apple cloud storage"},
    {"name": "Google One", "category": "Cloud Storage", "suggested_price": 1.99, "description": "Google cloud storage"},
    {"name": "GitHub Pro", "category": "Development", "suggested_price": 4.00, "description": "Code hosting platform"},
    {"name": "LinkedIn Premium", "category": "Professional", "suggested_price": 29.99, "description": "Professional networking"},
    {"name": "Notion", "category": "Productivity", "suggested_price": 8.00, "description": "Note-taking and productivity"},
    {"name": "Evernote", "category": "Productivity", "suggested_price": 7.99, "description": "Note-taking app"},
    {"name": "Audible", "category": "Entertainment", "suggested_price": 14.95, "description": "Audiobook service"},
    {"name": "Kindle Unlimited", "category": "Entertainment", "suggested_price": 9.99, "description": "E-book subscription"},
    {"name": "PlayStation Plus", "category": "Gaming", "suggested_price": 9.99, "description": "PlayStation online service"},
    {"name": "Xbox Game Pass", "category": "Gaming", "suggested_price": 9.99, "description": "Xbox gaming subscription"},
    {"name": "Nintendo Switch Online", "category": "Gaming", "suggested_price": 3.99, "description": "Nintendo online service"},
    {"name": "ChatGPT Plus", "category": "AI & Tools", "suggested_price": 20.00, "description": "Advanced AI assistant"},
    {"name": "Grammarly", "category": "Productivity", "suggested_price": 12.00, "description": "Writing assistant"},
    {"name": "Canva Pro", "category": "Design", "suggested_price": 12.99, "description": "Graphic design platform"},
]

# ==================== Helper Functions ====================

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise credentials_exception
    return user

def calculate_subscription_metrics(subscription: dict) -> dict:
    """Calculate derived fields for a subscription"""
    renewal_date = datetime.fromisoformat(subscription['renewal_date'].replace('Z', '+00:00'))
    today = datetime.now()
    
    # Calculate days until renewal
    days_until = (renewal_date.date() - today.date()).days
    
    # For now, assume all prices are monthly (can be enhanced later)
    monthly_cost = subscription['price']
    annual_cost = monthly_cost * 12
    
    # Calculate user's share if subscription is split
    split_count = subscription.get('split_count', 1)
    user_share = monthly_cost / split_count if split_count > 0 else monthly_cost
    
    return {
        'monthly_cost': round(monthly_cost, 2),
        'annual_cost': round(annual_cost, 2),
        'days_until_renewal': days_until,
        'user_share': round(user_share, 2)
    }

# ==================== Auth Routes ====================

@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    user = {
        "email": user_data.email,
        "password_hash": hashed_password,
        "currency": "USD",
        "timezone": "UTC",
        "created_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user)
    user["_id"] = result.inserted_id
    
    # Create token
    access_token = create_access_token(data={"sub": str(user["_id"])})
    
    user_response = UserResponse(
        id=str(user["_id"]),
        email=user["email"],
        currency=user["currency"],
        timezone=user["timezone"],
        created_at=user["created_at"]
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

@api_router.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    # Find user
    user = await db.users.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Create token
    access_token = create_access_token(data={"sub": str(user["_id"])})
    
    user_response = UserResponse(
        id=str(user["_id"]),
        email=user["email"],
        currency=user["currency"],
        timezone=user["timezone"],
        created_at=user["created_at"]
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

# ==================== User Routes ====================

@api_router.get("/user/profile", response_model=UserResponse)
async def get_profile(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user["_id"]),
        email=current_user["email"],
        currency=current_user["currency"],
        timezone=current_user["timezone"],
        created_at=current_user["created_at"]
    )

@api_router.put("/user/profile", response_model=UserResponse)
async def update_profile(update_data: UserUpdate, current_user: dict = Depends(get_current_user)):
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    
    if update_dict:
        await db.users.update_one(
            {"_id": current_user["_id"]},
            {"$set": update_dict}
        )
    
    updated_user = await db.users.find_one({"_id": current_user["_id"]})
    
    return UserResponse(
        id=str(updated_user["_id"]),
        email=updated_user["email"],
        currency=updated_user["currency"],
        timezone=updated_user["timezone"],
        created_at=updated_user["created_at"]
    )

# ==================== Subscription Routes ====================

@api_router.post("/subscriptions", response_model=SubscriptionResponse)
async def create_subscription(sub_data: SubscriptionCreate, current_user: dict = Depends(get_current_user)):
    subscription = {
        "user_id": str(current_user["_id"]),
        "service_name": sub_data.service_name,
        "price": sub_data.price,
        "renewal_date": sub_data.renewal_date,
        "start_date": sub_data.start_date,
        "category": sub_data.category,
        "notes": sub_data.notes,
        "created_at": datetime.utcnow()
    }
    
    result = await db.subscriptions.insert_one(subscription)
    subscription["_id"] = result.inserted_id
    
    metrics = calculate_subscription_metrics(subscription)
    
    return SubscriptionResponse(
        id=str(subscription["_id"]),
        service_name=subscription["service_name"],
        price=subscription["price"],
        renewal_date=subscription["renewal_date"],
        start_date=subscription["start_date"],
        category=subscription["category"],
        notes=subscription["notes"],
        monthly_cost=metrics["monthly_cost"],
        annual_cost=metrics["annual_cost"],
        days_until_renewal=metrics["days_until_renewal"],
        created_at=subscription["created_at"]
    )

@api_router.get("/subscriptions", response_model=List[SubscriptionResponse])
async def get_subscriptions(current_user: dict = Depends(get_current_user)):
    subscriptions = await db.subscriptions.find({"user_id": str(current_user["_id"])}).to_list(1000)
    
    result = []
    for sub in subscriptions:
        metrics = calculate_subscription_metrics(sub)
        result.append(SubscriptionResponse(
            id=str(sub["_id"]),
            service_name=sub["service_name"],
            price=sub["price"],
            renewal_date=sub["renewal_date"],
            start_date=sub.get("start_date"),
            category=sub.get("category"),
            notes=sub.get("notes"),
            monthly_cost=metrics["monthly_cost"],
            annual_cost=metrics["annual_cost"],
            days_until_renewal=metrics["days_until_renewal"],
            created_at=sub["created_at"]
        ))
    
    return result

@api_router.get("/subscriptions/{subscription_id}", response_model=SubscriptionResponse)
async def get_subscription(subscription_id: str, current_user: dict = Depends(get_current_user)):
    try:
        subscription = await db.subscriptions.find_one({
            "_id": ObjectId(subscription_id),
            "user_id": str(current_user["_id"])
        })
    except:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    metrics = calculate_subscription_metrics(subscription)
    
    return SubscriptionResponse(
        id=str(subscription["_id"]),
        service_name=subscription["service_name"],
        price=subscription["price"],
        renewal_date=subscription["renewal_date"],
        start_date=subscription.get("start_date"),
        category=subscription.get("category"),
        notes=subscription.get("notes"),
        monthly_cost=metrics["monthly_cost"],
        annual_cost=metrics["annual_cost"],
        days_until_renewal=metrics["days_until_renewal"],
        created_at=subscription["created_at"]
    )

@api_router.put("/subscriptions/{subscription_id}", response_model=SubscriptionResponse)
async def update_subscription(subscription_id: str, update_data: SubscriptionUpdate, current_user: dict = Depends(get_current_user)):
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    try:
        result = await db.subscriptions.update_one(
            {"_id": ObjectId(subscription_id), "user_id": str(current_user["_id"])},
            {"$set": update_dict}
        )
    except:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    subscription = await db.subscriptions.find_one({"_id": ObjectId(subscription_id)})
    metrics = calculate_subscription_metrics(subscription)
    
    return SubscriptionResponse(
        id=str(subscription["_id"]),
        service_name=subscription["service_name"],
        price=subscription["price"],
        renewal_date=subscription["renewal_date"],
        start_date=subscription.get("start_date"),
        category=subscription.get("category"),
        notes=subscription.get("notes"),
        monthly_cost=metrics["monthly_cost"],
        annual_cost=metrics["annual_cost"],
        days_until_renewal=metrics["days_until_renewal"],
        created_at=subscription["created_at"]
    )

@api_router.delete("/subscriptions/{subscription_id}")
async def delete_subscription(subscription_id: str, current_user: dict = Depends(get_current_user)):
    try:
        result = await db.subscriptions.delete_one({
            "_id": ObjectId(subscription_id),
            "user_id": str(current_user["_id"])
        })
    except:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    return {"message": "Subscription deleted successfully"}

@api_router.get("/subscriptions/analytics/dashboard", response_model=DashboardAnalytics)
async def get_dashboard_analytics(current_user: dict = Depends(get_current_user)):
    subscriptions = await db.subscriptions.find({" user_id": str(current_user["_id"])}).to_list(1000)
    
    total_subscriptions = len(subscriptions)
    monthly_spend = 0
    annual_spend = 0
    category_breakdown = {}
    next_renewal = None
    min_days = float('inf')
    
    for sub in subscriptions:
        metrics = calculate_subscription_metrics(sub)
        # Use user's share for calculations
        monthly_spend += metrics['user_share']
        annual_spend += metrics['user_share'] * 12
        
        # Category breakdown
        category = sub.get('category', 'Uncategorized')
        if category not in category_breakdown:
            category_breakdown[category] = 0
        category_breakdown[category] += metrics['user_share']
        
        # Find next renewal
        if metrics['days_until_renewal'] >= 0 and metrics['days_until_renewal'] < min_days:
            min_days = metrics['days_until_renewal']
            next_renewal = SubscriptionResponse(
                id=str(sub["_id"]),
                service_name=sub["service_name"],
                price=sub["price"],
                renewal_date=sub["renewal_date"],
                start_date=sub.get("start_date"),
                category=sub.get("category"),
                notes=sub.get("notes"),
                monthly_cost=metrics["monthly_cost"],
                annual_cost=metrics["annual_cost"],
                days_until_renewal=metrics["days_until_renewal"],
                created_at=sub["created_at"],
                shared_with=sub.get("shared_with"),
                split_count=sub.get("split_count", 1),
                user_share=metrics["user_share"]
            )
    
    return DashboardAnalytics(
        total_subscriptions=total_subscriptions,
        monthly_spend=round(monthly_spend, 2),
        annual_spend=round(annual_spend, 2),
        next_renewal=next_renewal,
        category_breakdown=category_breakdown
    )

# ==================== Template Routes ====================

@api_router.get("/templates", response_model=List[SubscriptionTemplate])
async def get_templates():
    \"\"\"Get list of common subscription templates\"\"\"
    return [SubscriptionTemplate(**template) for template in COMMON_TEMPLATES]

@api_router.get("/categories")
async def get_categories():
    \"\"\"Get list of subscription categories\"\"\"
    categories = list(set(template["category"] for template in COMMON_TEMPLATES))
    return sorted(categories)

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
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
