from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, date, timedelta
import jwt
import bcrypt
import math

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'astrolaunch-secret-key-2026')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days

# Create the main app
app = FastAPI(title="AstroLaunch Core Engine")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

security = HTTPBearer()

# ============ MODELS ============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    onboarding_complete: bool = False
    created_at: str

class OnboardingData(BaseModel):
    goals: List[str] = []  # Step 1: What they want help with
    birth_date: str  # Step 2: Birth date (YYYY-MM-DD)
    birth_time: Optional[str] = None  # Step 2: Birth time (HH:MM or "unknown")
    birth_location: str = ""  # Step 3: City, Country
    career_interests: List[str] = []  # Step 4
    life_focus: List[str] = []  # Step 5
    has_partner: bool = False  # Step 6
    partner_birth_date: Optional[str] = None  # Step 6

class OnboardingUpdate(BaseModel):
    onboarding: OnboardingData

class LuckScoreResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    date: str
    total_score: int
    western_score: int
    chinese_score: int
    numerology_score: int
    element_score: int
    lucky_color: str
    lucky_number: int
    recommended_activities: List[str]
    avoid_activities: List[str]
    interpretation: str
    zodiac_sign: str
    chinese_zodiac: str
    life_path_number: int
    dominant_element: str
    # Chinese Metaphysical Calendar fields
    day_officer: Optional[str] = None
    day_officer_chinese: Optional[str] = None
    day_stem_branch: Optional[str] = None
    day_zodiac: Optional[str] = None
    is_forgiveness_day: Optional[bool] = False
    business_quality: Optional[str] = None
    business_description: Optional[str] = None
    officer_good_for: Optional[List[str]] = None
    officer_avoid: Optional[List[str]] = None
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# ============ AUTH HELPERS ============

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode(), salt).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============ LUCK SCORE ALGORITHM ============

ZODIAC_SIGNS = [
    ("Capricorn", (1, 1), (1, 19)),
    ("Aquarius", (1, 20), (2, 18)),
    ("Pisces", (2, 19), (3, 20)),
    ("Aries", (3, 21), (4, 19)),
    ("Taurus", (4, 20), (5, 20)),
    ("Gemini", (5, 21), (6, 20)),
    ("Cancer", (6, 21), (7, 22)),
    ("Leo", (7, 23), (8, 22)),
    ("Virgo", (8, 23), (9, 22)),
    ("Libra", (9, 23), (10, 22)),
    ("Scorpio", (10, 23), (11, 21)),
    ("Sagittarius", (11, 22), (12, 21)),
    ("Capricorn", (12, 22), (12, 31)),
]

CHINESE_ZODIAC = ["Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake", "Horse", "Goat", "Monkey", "Rooster", "Dog", "Pig"]

ELEMENTS = ["Wood", "Fire", "Earth", "Metal", "Water"]

# ============ CHINESE METAPHYSICAL CALENDAR ============

# 12 Earthly Branches (地支) - corresponds to Chinese Zodiac
EARTHLY_BRANCHES = ["Zi", "Chou", "Yin", "Mao", "Chen", "Si", "Wu", "Wei", "Shen", "You", "Xu", "Hai"]
BRANCH_TO_ZODIAC = dict(zip(EARTHLY_BRANCHES, CHINESE_ZODIAC))

# 10 Heavenly Stems (天干)
HEAVENLY_STEMS = ["Jia", "Yi", "Bing", "Ding", "Wu", "Ji", "Geng", "Xin", "Ren", "Gui"]

# 12 Day Officers (建除十二神) - Jian Chu system
DAY_OFFICERS = [
    {"name": "Establish", "chinese": "建", "pinyin": "Jian", 
     "good_for": ["Starting new projects", "Business travel", "Prayers", "Proposals"],
     "avoid": ["Major construction", "Lawsuits"],
     "business_score": 8},
    {"name": "Remove", "chinese": "除", "pinyin": "Chu",
     "good_for": ["Cleansing", "Clearing debts", "Sales", "Medical treatments"],
     "avoid": ["Weddings", "Moving house"],
     "business_score": 6},
    {"name": "Full", "chinese": "满", "pinyin": "Man",
     "good_for": ["Grand openings", "Agreements", "Celebrations", "Gatherings"],
     "avoid": ["Burials", "Construction starts"],
     "business_score": 9},
    {"name": "Balance", "chinese": "平", "pinyin": "Ping",
     "good_for": ["Negotiations", "Repairs", "Road building", "Mediation"],
     "avoid": ["Major investments", "Weddings"],
     "business_score": 5},
    {"name": "Stable", "chinese": "定", "pinyin": "Ding",
     "good_for": ["Long-term projects", "Contracts", "Engagements", "Medical"],
     "avoid": ["Travel", "Litigation"],
     "business_score": 7},
    {"name": "Initiate", "chinese": "执", "pinyin": "Zhi",
     "good_for": ["New beginnings", "Signing contracts", "Collecting debts", "Construction"],
     "avoid": ["Moving house", "Relocating business"],
     "business_score": 8},
    {"name": "Destruction", "chinese": "破", "pinyin": "Po",
     "good_for": ["Demolition", "Breaking bad habits", "Medical procedures"],
     "avoid": ["All major activities", "Business launches", "Weddings"],
     "business_score": 2},
    {"name": "Danger", "chinese": "危", "pinyin": "Wei",
     "good_for": ["Risk assessment", "Security matters", "Prayers"],
     "avoid": ["Travel", "Major decisions", "High-risk activities"],
     "business_score": 3},
    {"name": "Success", "chinese": "成", "pinyin": "Cheng",
     "good_for": ["Completing projects", "Celebrations", "Weddings", "Business deals"],
     "avoid": ["Lawsuits", "Demolition"],
     "business_score": 10},
    {"name": "Receive", "chinese": "收", "pinyin": "Shou",
     "good_for": ["Collecting payments", "Closing deals", "Harvesting", "Starting school"],
     "avoid": ["Burials", "Medical procedures"],
     "business_score": 8},
    {"name": "Open", "chinese": "开", "pinyin": "Kai",
     "good_for": ["Grand openings", "New ventures", "Moving in", "Celebrations"],
     "avoid": ["Burials", "Funerals"],
     "business_score": 10},
    {"name": "Close", "chinese": "闭", "pinyin": "Bi",
     "good_for": ["Rest", "Meditation", "Closing accounts", "Endings"],
     "avoid": ["All major activities", "New projects", "Travel"],
     "business_score": 1}
]

# Day Forgiveness Days (天赦日) - Heavenly Pardon Days
# These are special auspicious days when Heaven forgives all transgressions
# Calculated based on specific Stem-Branch combinations per season
TIAN_SHE_DAYS = {
    "spring": [("Wu", "Yin")],   # 戊寅 in Spring (Feb-Apr)
    "summer": [("Jia", "Wu")],   # 甲午 in Summer (May-Jul)
    "autumn": [("Wu", "Shen")],  # 戊申 in Autumn (Aug-Oct)
    "winter": [("Jia", "Zi")]    # 甲子 in Winter (Nov-Jan)
}

def get_season(month: int) -> str:
    """Get season from month"""
    if month in [2, 3, 4]:
        return "spring"
    elif month in [5, 6, 7]:
        return "summer"
    elif month in [8, 9, 10]:
        return "autumn"
    else:
        return "winter"

def get_day_stem_branch(target_date: date) -> tuple:
    """Calculate the Heavenly Stem and Earthly Branch for a given date
    Using the 60 Jia Zi (甲子) cycle"""
    # Reference date: January 1, 1900 was Jia Chen (甲辰) day
    # Stem index 0 (Jia), Branch index 4 (Chen)
    reference_date = date(1900, 1, 1)
    days_diff = (target_date - reference_date).days
    
    stem_index = (days_diff + 0) % 10  # Jia is index 0
    branch_index = (days_diff + 4) % 12  # Chen is index 4
    
    return (HEAVENLY_STEMS[stem_index], EARTHLY_BRANCHES[branch_index])

def get_month_branch(month: int) -> str:
    """Get the Earthly Branch for a lunar month (approximated from solar month)
    Month 1 (Feb) = Yin, Month 2 (Mar) = Mao, etc."""
    # Solar months roughly correspond: Feb=Yin, Mar=Mao...
    branch_index = (month + 1) % 12  # Adjust so Feb (month 2) -> Yin (index 2)
    return EARTHLY_BRANCHES[branch_index]

def get_day_officer(target_date: date) -> dict:
    """Calculate the Day Officer (建除十二神) for a given date"""
    day_stem, day_branch = get_day_stem_branch(target_date)
    month_branch = get_month_branch(target_date.month)
    
    # Find the branch indices
    day_branch_idx = EARTHLY_BRANCHES.index(day_branch)
    month_branch_idx = EARTHLY_BRANCHES.index(month_branch)
    
    # The day whose branch matches the month branch is "Establish" (Jian)
    # Then cycle through the 12 officers
    officer_idx = (day_branch_idx - month_branch_idx) % 12
    
    officer = DAY_OFFICERS[officer_idx].copy()
    officer["day_stem"] = day_stem
    officer["day_branch"] = day_branch
    officer["day_zodiac"] = BRANCH_TO_ZODIAC[day_branch]
    
    return officer

def is_tian_she_day(target_date: date) -> bool:
    """Check if the date is a Day Forgiveness (天赦日)"""
    season = get_season(target_date.month)
    day_stem, day_branch = get_day_stem_branch(target_date)
    
    for stem, branch in TIAN_SHE_DAYS[season]:
        if day_stem == stem and day_branch == branch:
            return True
    return False

def get_business_day_quality(officer: dict, is_forgiveness_day: bool) -> dict:
    """Evaluate the day's quality for business activities"""
    base_score = officer["business_score"]
    
    # Bonus for Day Forgiveness
    if is_forgiveness_day:
        base_score = min(10, base_score + 3)
    
    # Determine quality level
    if base_score >= 9:
        quality = "Excellent"
        description = "Highly auspicious for major business activities, launches, and deals"
    elif base_score >= 7:
        quality = "Good"
        description = "Favorable for business meetings, contracts, and progress"
    elif base_score >= 5:
        quality = "Moderate"
        description = "Suitable for routine business, avoid major decisions"
    elif base_score >= 3:
        quality = "Caution"
        description = "Exercise caution, focus on planning rather than action"
    else:
        quality = "Unfavorable"
        description = "Avoid major business activities, good for rest and reflection"
    
    return {
        "score": base_score,
        "quality": quality,
        "description": description
    }

ELEMENT_COLORS = {
    "Wood": ["Green", "Teal", "Brown"],
    "Fire": ["Red", "Orange", "Pink", "Purple"],
    "Earth": ["Yellow", "Beige", "Terracotta"],
    "Metal": ["White", "Silver", "Gold"],
    "Water": ["Blue", "Black", "Navy"]
}

ZODIAC_COMPATIBILITY = {
    "Rat": {"best": ["Dragon", "Monkey", "Ox"], "worst": ["Horse", "Rooster"]},
    "Ox": {"best": ["Rat", "Snake", "Rooster"], "worst": ["Goat", "Horse"]},
    "Tiger": {"best": ["Horse", "Dog", "Pig"], "worst": ["Monkey", "Snake"]},
    "Rabbit": {"best": ["Goat", "Dog", "Pig"], "worst": ["Rooster", "Dragon"]},
    "Dragon": {"best": ["Rat", "Monkey", "Rooster"], "worst": ["Dog", "Rabbit"]},
    "Snake": {"best": ["Ox", "Rooster", "Dragon"], "worst": ["Pig", "Tiger"]},
    "Horse": {"best": ["Tiger", "Goat", "Dog"], "worst": ["Rat", "Ox"]},
    "Goat": {"best": ["Rabbit", "Horse", "Pig"], "worst": ["Ox", "Dog"]},
    "Monkey": {"best": ["Rat", "Dragon", "Snake"], "worst": ["Tiger", "Pig"]},
    "Rooster": {"best": ["Ox", "Snake", "Dragon"], "worst": ["Rabbit", "Rat"]},
    "Dog": {"best": ["Tiger", "Rabbit", "Horse"], "worst": ["Dragon", "Goat"]},
    "Pig": {"best": ["Tiger", "Rabbit", "Goat"], "worst": ["Snake", "Monkey"]}
}

def get_zodiac_sign(month: int, day: int) -> str:
    for sign, (start_m, start_d), (end_m, end_d) in ZODIAC_SIGNS:
        if (month == start_m and day >= start_d) or (month == end_m and day <= end_d):
            return sign
    return "Capricorn"

def get_chinese_zodiac(year: int) -> str:
    return CHINESE_ZODIAC[(year - 1900) % 12]

def get_life_path_number(birth_date: str) -> int:
    digits = [int(d) for d in birth_date.replace("-", "") if d.isdigit()]
    total = sum(digits)
    while total > 9 and total not in [11, 22, 33]:  # Master numbers
        total = sum(int(d) for d in str(total))
    return total

def get_date_number(date_str: str) -> int:
    digits = [int(d) for d in date_str.replace("-", "") if d.isdigit()]
    total = sum(digits)
    while total > 9:
        total = sum(int(d) for d in str(total))
    return total

def get_element_from_year(year: int) -> str:
    return ELEMENTS[((year - 4) // 2) % 5]

def calculate_western_score(target_date: date, birth_date: date) -> int:
    """Calculate Western Astrology score based on planetary positions simulation"""
    day_of_year = target_date.timetuple().tm_yday
    birth_day = birth_date.timetuple().tm_yday
    
    # Jupiter cycle (12 years)
    jupiter_pos = (target_date.year + day_of_year / 365) % 12
    birth_jupiter = (birth_date.year + birth_day / 365) % 12
    jupiter_aspect = abs(jupiter_pos - birth_jupiter)
    jupiter_score = 20 - min(jupiter_aspect, 12 - jupiter_aspect) * 1.5
    
    # Venus cycle (225 days)
    venus_pos = (day_of_year % 225) / 225 * 12
    birth_venus = (birth_day % 225) / 225 * 12
    venus_aspect = abs(venus_pos - birth_venus)
    venus_score = 10 - min(venus_aspect, 12 - venus_aspect)
    
    # Mercury cycle (88 days) - communication
    mercury_pos = (day_of_year % 88) / 88 * 12
    mercury_score = 5 + math.sin(mercury_pos * math.pi / 6) * 5
    
    # Mars cycle (687 days) - action
    mars_cycle = (day_of_year % 687) / 687
    mars_score = 5 if mars_cycle > 0.3 and mars_cycle < 0.7 else 0
    
    total = int(max(0, min(40, jupiter_score + venus_score + mercury_score + mars_score)))
    return total

def calculate_chinese_score(user_animal: str, day_animal: str) -> int:
    """Calculate Chinese Astrology compatibility score"""
    if day_animal in ZODIAC_COMPATIBILITY[user_animal]["best"]:
        return 30
    elif day_animal in ZODIAC_COMPATIBILITY[user_animal]["worst"]:
        return 5
    elif day_animal == user_animal:
        return 20
    else:
        return 15

def calculate_numerology_score(life_path: int, date_number: int) -> int:
    """Calculate numerology compatibility score"""
    compatible_pairs = {
        1: [1, 3, 5, 9], 2: [2, 4, 6, 8], 3: [1, 3, 5, 9],
        4: [2, 4, 6, 8], 5: [1, 3, 5, 7, 9], 6: [2, 4, 6, 8],
        7: [5, 7], 8: [2, 4, 6, 8], 9: [1, 3, 5, 9]
    }
    
    if date_number in compatible_pairs.get(life_path, []):
        return 20
    elif abs(life_path - date_number) <= 2:
        return 15
    else:
        return 8

def calculate_element_score(user_element: str, day_element: str) -> int:
    """Calculate element balance score based on Wu Xing"""
    # Generating cycle: Wood -> Fire -> Earth -> Metal -> Water -> Wood
    generating = {"Wood": "Fire", "Fire": "Earth", "Earth": "Metal", "Metal": "Water", "Water": "Wood"}
    # Controlling cycle
    controlling = {"Wood": "Earth", "Fire": "Metal", "Earth": "Water", "Metal": "Wood", "Water": "Fire"}
    
    if generating.get(day_element) == user_element:
        return 10  # Day supports user
    elif generating.get(user_element) == day_element:
        return 8  # User generates day (energy drain)
    elif controlling.get(day_element) == user_element:
        return 3  # Day controls user
    elif day_element == user_element:
        return 7  # Same element
    else:
        return 5  # Neutral

def get_lucky_color(element: str, score: int) -> str:
    colors = ELEMENT_COLORS.get(element, ["Gold"])
    index = score % len(colors)
    return colors[index]

def get_lucky_number(life_path: int, date_number: int) -> int:
    return ((life_path * 3 + date_number * 2) % 9) + 1

def get_activities(score: int, zodiac: str) -> tuple:
    """Get recommended and avoid activities based on score"""
    if score >= 81:
        recommended = ["Major investments", "Business launches", "Important meetings", "Signing contracts", "Starting new ventures"]
        avoid = ["None - highly favorable day"]
    elif score >= 61:
        recommended = ["Networking", "Planning", "Team meetings", "Creative projects", "Learning new skills"]
        avoid = ["High-risk investments", "Major legal decisions"]
    elif score >= 41:
        recommended = ["Routine work", "Organization", "Research", "Self-care", "Review existing plans"]
        avoid = ["Big launches", "Important negotiations", "Risky decisions"]
    else:
        recommended = ["Rest and reflection", "Meditation", "Planning (not executing)", "Self-improvement"]
        avoid = ["Major decisions", "Investments", "New commitments", "Important meetings"]
    
    return recommended[:4], avoid[:3]

def get_interpretation(score: int) -> str:
    if score >= 81:
        return "High opportunity day! Ideal for launches, investments, or major decisions. The cosmic energy strongly supports bold moves."
    elif score >= 61:
        return "Good opportunity day. Productive for business, planning, and networking. Favorable energy for progress."
    elif score >= 41:
        return "Neutral day. Focus on routine activities and preparation. Avoid major decisions but maintain momentum."
    else:
        return "Low energy day. Best for rest, reflection, and avoiding major decisions. Use this time for planning future moves."

def calculate_luck_score(birth_date_str: str, target_date_str: str) -> dict:
    """Main function to calculate complete luck score"""
    birth_date = datetime.strptime(birth_date_str, "%Y-%m-%d").date()
    target_date = datetime.strptime(target_date_str, "%Y-%m-%d").date()
    
    # User's astrological profile
    zodiac_sign = get_zodiac_sign(birth_date.month, birth_date.day)
    chinese_zodiac = get_chinese_zodiac(birth_date.year)
    life_path = get_life_path_number(birth_date_str)
    user_element = get_element_from_year(birth_date.year)
    
    # Day's astrological profile
    day_chinese_zodiac = get_chinese_zodiac(target_date.year)
    date_number = get_date_number(target_date_str)
    day_element = get_element_from_year(target_date.year)
    
    # Chinese Metaphysical Calendar calculations
    day_officer = get_day_officer(target_date)
    forgiveness_day = is_tian_she_day(target_date)
    business_quality = get_business_day_quality(day_officer, forgiveness_day)
    
    # Calculate component scores (weighted)
    western_raw = calculate_western_score(target_date, birth_date)
    chinese_raw = calculate_chinese_score(chinese_zodiac, day_chinese_zodiac)
    numerology_raw = calculate_numerology_score(life_path, date_number)
    element_raw = calculate_element_score(user_element, day_element)
    
    # Adjust Chinese score based on Day Officer
    officer_bonus = (business_quality["score"] - 5) * 2  # -8 to +10
    chinese_raw = max(0, min(30, chinese_raw + officer_bonus))
    
    # Bonus for Day Forgiveness
    if forgiveness_day:
        chinese_raw = min(30, chinese_raw + 5)
    
    # Total score (already weighted in component functions)
    total = western_raw + chinese_raw + numerology_raw + element_raw
    total = max(0, min(100, total))
    
    recommended, avoid = get_activities(total, zodiac_sign)
    
    # Enhance recommendations with Day Officer guidance
    if business_quality["quality"] in ["Excellent", "Good"]:
        recommended = day_officer["good_for"][:2] + recommended[:2]
    else:
        avoid = day_officer["avoid"][:2] + avoid[:1]
    
    return {
        "total_score": total,
        "western_score": western_raw,
        "chinese_score": chinese_raw,
        "numerology_score": numerology_raw,
        "element_score": element_raw,
        "lucky_color": get_lucky_color(user_element, total),
        "lucky_number": get_lucky_number(life_path, date_number),
        "recommended_activities": recommended[:4],
        "avoid_activities": avoid[:3],
        "interpretation": get_interpretation(total),
        "zodiac_sign": zodiac_sign,
        "chinese_zodiac": chinese_zodiac,
        "life_path_number": life_path,
        "dominant_element": user_element,
        # Chinese Metaphysical Calendar data
        "day_officer": day_officer["name"],
        "day_officer_chinese": f"{day_officer['chinese']} ({day_officer['pinyin']})",
        "day_stem_branch": f"{day_officer['day_stem']}-{day_officer['day_branch']}",
        "day_zodiac": day_officer["day_zodiac"],
        "is_forgiveness_day": forgiveness_day,
        "business_quality": business_quality["quality"],
        "business_description": business_quality["description"],
        "officer_good_for": day_officer["good_for"],
        "officer_avoid": day_officer["avoid"]
    }

# ============ AUTH ENDPOINTS ============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": hash_password(user_data.password),
        "onboarding_complete": False,
        "onboarding": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    token = create_token(user_id, user_data.email)
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            email=user_data.email,
            name=user_data.name,
            onboarding_complete=False,
            created_at=user_doc["created_at"]
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_token(user["id"], user["email"])
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            onboarding_complete=user.get("onboarding_complete", False),
            created_at=user["created_at"]
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        onboarding_complete=current_user.get("onboarding_complete", False),
        created_at=current_user["created_at"]
    )

# ============ ONBOARDING ENDPOINTS ============

@api_router.put("/users/onboarding")
async def update_onboarding(data: OnboardingUpdate, current_user: dict = Depends(get_current_user)):
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {
            "onboarding": data.onboarding.model_dump(),
            "onboarding_complete": True
        }}
    )
    return {"success": True, "message": "Onboarding completed"}

@api_router.get("/users/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0, "password_hash": 0})
    return user

# ============ LUCK SCORE ENDPOINTS ============

@api_router.get("/luck/today", response_model=LuckScoreResponse)
async def get_today_luck(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    
    if not user.get("onboarding") or not user["onboarding"].get("birth_date"):
        raise HTTPException(status_code=400, detail="Complete onboarding first")
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Check if we already calculated today's score
    existing = await db.luck_scores.find_one(
        {"user_id": current_user["id"], "date": today},
        {"_id": 0}
    )
    
    if existing:
        return LuckScoreResponse(**existing)
    
    # Calculate new score
    birth_date = user["onboarding"]["birth_date"]
    score_data = calculate_luck_score(birth_date, today)
    
    score_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "date": today,
        **score_data,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.luck_scores.insert_one(score_doc)
    
    return LuckScoreResponse(**score_doc)

@api_router.get("/luck/date/{date_str}", response_model=LuckScoreResponse)
async def get_luck_for_date(date_str: str, current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    
    if not user.get("onboarding") or not user["onboarding"].get("birth_date"):
        raise HTTPException(status_code=400, detail="Complete onboarding first")
    
    # Validate date format
    try:
        datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Check existing
    existing = await db.luck_scores.find_one(
        {"user_id": current_user["id"], "date": date_str},
        {"_id": 0}
    )
    
    if existing:
        return LuckScoreResponse(**existing)
    
    # Calculate
    birth_date = user["onboarding"]["birth_date"]
    score_data = calculate_luck_score(birth_date, date_str)
    
    score_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "date": date_str,
        **score_data,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.luck_scores.insert_one(score_doc)
    
    return LuckScoreResponse(**score_doc)

@api_router.get("/luck/history", response_model=List[LuckScoreResponse])
async def get_luck_history(limit: int = 30, current_user: dict = Depends(get_current_user)):
    scores = await db.luck_scores.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("date", -1).limit(limit).to_list(limit)
    
    return [LuckScoreResponse(**s) for s in scores]

@api_router.get("/luck/week")
async def get_week_forecast(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    
    if not user.get("onboarding") or not user["onboarding"].get("birth_date"):
        raise HTTPException(status_code=400, detail="Complete onboarding first")
    
    birth_date = user["onboarding"]["birth_date"]
    today = datetime.now(timezone.utc).date()
    
    forecast = []
    for i in range(7):
        target_date = today + timedelta(days=i)
        date_str = target_date.strftime("%Y-%m-%d")
        score_data = calculate_luck_score(birth_date, date_str)
        forecast.append({
            "date": date_str,
            "day_name": target_date.strftime("%A"),
            "score": score_data["total_score"],
            "lucky_color": score_data["lucky_color"],
            "lucky_number": score_data["lucky_number"],
            "day_officer": score_data["day_officer"],
            "day_officer_chinese": score_data["day_officer_chinese"],
            "business_quality": score_data["business_quality"],
            "is_forgiveness_day": score_data["is_forgiveness_day"]
        })
    
    return forecast

# ============ BASIC ENDPOINTS ============

@api_router.get("/")
async def root():
    return {"message": "AstroLaunch Core Engine API", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
