from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, date, timedelta
import jwt
import bcrypt
import math
import stripe

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

# Configure logging FIRST
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# CORS must be configured BEFORE routes are added
cors_origins = os.environ.get('CORS_ORIGINS', '*')
logger.info(f"Configuring CORS with origins: {cors_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins.split(',') if cors_origins != '*' else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    lucky_number_meaning: Optional[str] = None
    recommended_activities: List[str]
    avoid_activities: List[str]
    interpretation: str
    zodiac_sign: str
    chinese_zodiac: str
    life_path_number: int
    is_master_number: Optional[bool] = False
    life_path_energy: Optional[str] = None
    life_path_traits: Optional[str] = None
    friendly_numbers: Optional[List[int]] = None
    challenging_numbers: Optional[List[int]] = None
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
    # Lo Shu Grid (Chinese Numerology)
    lo_shu_missing: Optional[List[int]] = None
    lo_shu_strengths: Optional[List[str]] = None
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

# ============ CHINESE NUMEROLOGY & GG33 SYSTEM ============

# Chinese Lucky/Unlucky Numbers (based on pronunciation)
CHINESE_LUCKY_NUMBERS = {
    8: {"luck": "极吉", "meaning": "Prosperity & wealth (八 sounds like 发)", "score": 10},
    6: {"luck": "吉", "meaning": "Smooth & flowing (六 sounds like 流)", "score": 8},
    9: {"luck": "吉", "meaning": "Longevity & eternity (九 sounds like 久)", "score": 8},
    2: {"luck": "吉", "meaning": "Pairs & harmony (好事成双)", "score": 6},
    3: {"luck": "吉", "meaning": "Life & growth (三 sounds like 生)", "score": 6},
    1: {"luck": "中", "meaning": "Unity & beginning", "score": 5},
    5: {"luck": "中", "meaning": "Balance (Five Elements center)", "score": 5},
    7: {"luck": "凶", "meaning": "Gone/departed (七 sounds like 去)", "score": 3},
    4: {"luck": "大凶", "meaning": "Death (四 sounds like 死)", "score": 1},
}

# GG33 Number Meanings (Gary the Numbers Guy)
GG33_MEANINGS = {
    1: {"energy": "Yang/Male", "traits": "Leadership, independence, pioneer", "friendly": [3, 5, 9], "challenging": [4, 8]},
    2: {"energy": "Yin/Female", "traits": "Cooperation, peace, diplomacy", "friendly": [6, 8, 9], "challenging": [5, 7]},
    3: {"energy": "Creative", "traits": "Communication, luck, comedy, expression", "friendly": [1, 5, 9], "challenging": [4, 8]},
    4: {"energy": "Builder", "traits": "Work, structure, foundation, discipline", "friendly": [2, 6, 8], "challenging": [1, 3, 5]},
    5: {"energy": "Change", "traits": "Travel, freedom, adventure, sensuality", "friendly": [1, 3, 7, 9], "challenging": [2, 4, 6]},
    6: {"energy": "Harmony", "traits": "Home, family, nurturing, responsibility", "friendly": [2, 4, 8, 9], "challenging": [1, 5]},
    7: {"energy": "Genius", "traits": "Intelligence, spirituality, analysis, introspection", "friendly": [3, 5], "challenging": [2, 8, 9]},
    8: {"energy": "Power", "traits": "Money, success, authority, karma", "friendly": [2, 4, 6], "challenging": [1, 3, 7]},
    9: {"energy": "Wisdom", "traits": "Completion, humanitarian, universal love", "friendly": [1, 3, 5, 6], "challenging": [4, 8]},
    11: {"energy": "Master Intuition", "traits": "Awareness, illumination, visionary, spiritual messenger", "friendly": [2, 4, 6], "challenging": [5, 7]},
    22: {"energy": "Master Builder", "traits": "Manifesting dreams, practical idealism, large-scale creation", "friendly": [4, 6, 8], "challenging": [5, 7]},
    33: {"energy": "Master Teacher", "traits": "Enlightenment, blessing others, selfless service", "friendly": [3, 6, 9], "challenging": [1, 5]},
}

# Lo Shu Grid positions (Magic Square)
LO_SHU_GRID = {
    4: (0, 0), 9: (0, 1), 2: (0, 2),
    3: (1, 0), 5: (1, 1), 7: (1, 2),
    8: (2, 0), 1: (2, 1), 6: (2, 2)
}

LO_SHU_PLANES = {
    "mental": [4, 9, 2],      # Top row - thinking, analysis
    "emotional": [3, 5, 7],   # Middle row - creativity, spirituality  
    "practical": [8, 1, 6],   # Bottom row - wealth, action
    "thought": [4, 3, 8],     # Left column - memory, planning
    "will": [9, 5, 1],        # Center column - determination
    "action": [2, 7, 6],      # Right column - execution
    "spiritual": [4, 5, 6],   # Diagonal - purpose
    "success": [2, 5, 8],     # Diagonal - prosperity from ancestors
}

def calculate_lo_shu_grid(birth_date_str: str) -> dict:
    """Calculate Lo Shu Grid from birth date (Chinese numerology)"""
    # Extract digits (ignore 0s per Lo Shu tradition)
    digits = [int(d) for d in birth_date_str.replace("-", "") if d.isdigit() and d != '0']
    
    # Count occurrences
    grid_counts = {i: digits.count(i) for i in range(1, 10)}
    
    # Find missing and repeated numbers
    missing = [n for n in range(1, 10) if grid_counts[n] == 0]
    repeated = [n for n in range(1, 10) if grid_counts[n] > 1]
    
    # Check planes (complete if all numbers present)
    complete_planes = []
    missing_planes = []
    for plane_name, numbers in LO_SHU_PLANES.items():
        if all(grid_counts[n] > 0 for n in numbers):
            complete_planes.append(plane_name)
        elif all(grid_counts[n] == 0 for n in numbers):
            missing_planes.append(plane_name)
    
    # Strengths based on repeated numbers
    strengths = []
    for n, count in grid_counts.items():
        if count >= 2:
            meaning = GG33_MEANINGS.get(n, {}).get("traits", "")
            strengths.append(f"{n} ({count}x): {meaning.split(',')[0]}")
    
    return {
        "grid_counts": grid_counts,
        "missing_numbers": missing,
        "repeated_numbers": repeated,
        "complete_planes": complete_planes,
        "missing_planes": missing_planes,
        "strengths": strengths[:3]
    }

def get_gg33_life_path(birth_date_str: str) -> dict:
    """Calculate Life Path number using GG33 method with Master Numbers"""
    digits = [int(d) for d in birth_date_str.replace("-", "") if d.isdigit()]
    total = sum(digits)
    
    # Keep reducing but preserve Master Numbers 11, 22, 33
    while total > 9 and total not in [11, 22, 33]:
        total = sum(int(d) for d in str(total))
    
    # Get GG33 meaning
    meaning = GG33_MEANINGS.get(total, GG33_MEANINGS.get(total % 10, {}))
    is_master = total in [11, 22, 33]
    
    return {
        "number": total,
        "is_master_number": is_master,
        "energy": meaning.get("energy", ""),
        "traits": meaning.get("traits", ""),
        "friendly_numbers": meaning.get("friendly", []),
        "challenging_numbers": meaning.get("challenging", [])
    }

def get_chinese_lucky_number(birth_date_str: str, target_date_str: str) -> dict:
    """Generate lucky number based on Chinese numerology"""
    life_path = get_gg33_life_path(birth_date_str)
    date_digits = [int(d) for d in target_date_str.replace("-", "") if d.isdigit()]
    date_sum = sum(date_digits)
    while date_sum > 9:
        date_sum = sum(int(d) for d in str(date_sum))
    
    # Prefer 8, 6, 9 as lucky; avoid 4, 7
    candidates = [8, 6, 9, 3, 2, 1, 5]
    
    # Calculate based on life path and date energy
    base = (life_path["number"] + date_sum) % 9
    if base == 0:
        base = 9
    
    # Adjust to favor Chinese lucky numbers
    if base == 4:  # Avoid 4
        base = 8
    elif base == 7:  # Avoid 7
        base = 6
    
    lucky_info = CHINESE_LUCKY_NUMBERS.get(base, CHINESE_LUCKY_NUMBERS[8])
    
    return {
        "number": base,
        "chinese_luck": lucky_info["luck"],
        "meaning": lucky_info["meaning"]
    }

def calculate_numerology_score_gg33(life_path: dict, date_number: int) -> int:
    """Calculate numerology score using GG33 friendly/challenging numbers"""
    lp_num = life_path["number"]
    
    # Master numbers get bonus
    base_score = 5 if life_path["is_master_number"] else 0
    
    # Check if date number is friendly or challenging
    if date_number in life_path.get("friendly_numbers", []):
        base_score += 15
    elif date_number in life_path.get("challenging_numbers", []):
        base_score += 5
    else:
        base_score += 10
    
    # Chinese numerology bonus for lucky numbers (8, 6, 9)
    chinese_luck = CHINESE_LUCKY_NUMBERS.get(date_number, {}).get("score", 5)
    base_score += chinese_luck // 2
    
    return min(20, base_score)

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
    """Main function to calculate complete luck score using GG33, Chinese Numerology, and Joey Yap methods"""
    birth_date = datetime.strptime(birth_date_str, "%Y-%m-%d").date()
    target_date = datetime.strptime(target_date_str, "%Y-%m-%d").date()
    
    # User's astrological profile
    zodiac_sign = get_zodiac_sign(birth_date.month, birth_date.day)
    chinese_zodiac = get_chinese_zodiac(birth_date.year)
    user_element = get_element_from_year(birth_date.year)
    
    # GG33 Life Path calculation with Master Numbers
    life_path_data = get_gg33_life_path(birth_date_str)
    life_path = life_path_data["number"]
    
    # Lo Shu Grid (Chinese Numerology)
    lo_shu = calculate_lo_shu_grid(birth_date_str)
    
    # Day's astrological profile
    day_chinese_zodiac = get_chinese_zodiac(target_date.year)
    date_number = get_date_number(target_date_str)
    day_element = get_element_from_year(target_date.year)
    
    # Chinese Metaphysical Calendar calculations (Joey Yap style)
    day_officer = get_day_officer(target_date)
    forgiveness_day = is_tian_she_day(target_date)
    business_quality = get_business_day_quality(day_officer, forgiveness_day)
    
    # Chinese Lucky Number
    lucky_num_data = get_chinese_lucky_number(birth_date_str, target_date_str)
    
    # Calculate component scores (weighted)
    western_raw = calculate_western_score(target_date, birth_date)
    chinese_raw = calculate_chinese_score(chinese_zodiac, day_chinese_zodiac)
    numerology_raw = calculate_numerology_score_gg33(life_path_data, date_number)
    element_raw = calculate_element_score(user_element, day_element)
    
    # Adjust Chinese score based on Day Officer
    officer_bonus = (business_quality["score"] - 5) * 2  # -8 to +10
    chinese_raw = max(0, min(30, chinese_raw + officer_bonus))
    
    # Bonus for Day Forgiveness (天赦日)
    if forgiveness_day:
        chinese_raw = min(30, chinese_raw + 5)
    
    # Master Number bonus
    if life_path_data["is_master_number"]:
        numerology_raw = min(20, numerology_raw + 3)
    
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
        "lucky_number": lucky_num_data["number"],
        "lucky_number_meaning": lucky_num_data["meaning"],
        "recommended_activities": recommended[:4],
        "avoid_activities": avoid[:3],
        "interpretation": get_interpretation(total),
        "zodiac_sign": zodiac_sign,
        "chinese_zodiac": chinese_zodiac,
        "life_path_number": life_path,
        "is_master_number": life_path_data["is_master_number"],
        "life_path_energy": life_path_data["energy"],
        "life_path_traits": life_path_data["traits"],
        "friendly_numbers": life_path_data["friendly_numbers"],
        "challenging_numbers": life_path_data["challenging_numbers"],
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
        "officer_avoid": day_officer["avoid"],
        # Lo Shu Grid
        "lo_shu_missing": lo_shu["missing_numbers"],
        "lo_shu_strengths": lo_shu["strengths"]
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
    birth_date = user["onboarding"]["birth_date"]
    
    # Check if we already calculated today's score
    existing = await db.luck_scores.find_one(
        {"user_id": current_user["id"], "date": today},
        {"_id": 0}
    )
    
    # Check if cached score has new GG33 fields, if not recalculate
    if existing and existing.get("life_path_energy") is not None:
        return LuckScoreResponse(**existing)
    
    # Calculate new score (or recalculate for stale cache)
    score_data = calculate_luck_score(birth_date, today)
    
    score_doc = {
        "id": existing.get("id") if existing else str(uuid.uuid4()),
        "user_id": current_user["id"],
        "date": today,
        **score_data,
        "created_at": existing.get("created_at") if existing else datetime.now(timezone.utc).isoformat()
    }
    
    if existing:
        # Update stale cached score with new GG33 fields
        await db.luck_scores.update_one(
            {"user_id": current_user["id"], "date": today},
            {"$set": score_doc}
        )
    else:
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
    
    birth_date = user["onboarding"]["birth_date"]
    
    # Check if cached score has new GG33 fields, if not recalculate
    if existing and existing.get("life_path_energy") is not None:
        return LuckScoreResponse(**existing)
    
    # Calculate (or recalculate for stale cache)
    score_data = calculate_luck_score(birth_date, date_str)
    
    score_doc = {
        "id": existing.get("id") if existing else str(uuid.uuid4()),
        "user_id": current_user["id"],
        "date": date_str,
        **score_data,
        "created_at": existing.get("created_at") if existing else datetime.now(timezone.utc).isoformat()
    }
    
    if existing:
        await db.luck_scores.update_one(
            {"user_id": current_user["id"], "date": date_str},
            {"$set": score_doc}
        )
    else:
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

# ============ STRIPE PAYMENT ENDPOINTS ============

PREMIUM_PRICE_ID = "price_1T86JpAXuTzNcQX7JFifyxSN"
PREMIUM_AMOUNT = 8.88

class CheckoutRequest(BaseModel):
    origin_url: str

class CheckoutResponse(BaseModel):
    url: str
    session_id: str

@api_router.post("/payments/checkout", response_model=CheckoutResponse)
async def create_checkout_session(
    request: Request,
    checkout_req: CheckoutRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create Stripe checkout session for premium subscription"""
    stripe_api_key = os.environ.get("STRIPE_API_KEY")
    if not stripe_api_key:
        logger.error("STRIPE_API_KEY not found in environment")
        raise HTTPException(status_code=500, detail="Payment system not configured - missing API key")
    
    stripe.api_key = stripe_api_key
    
    # Build URLs from frontend origin
    origin_url = checkout_req.origin_url.rstrip('/')
    success_url = f"{origin_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/dashboard"
    
    logger.info(f"Creating checkout for user {current_user['email']} with origin {origin_url}")
    
    try:
        # Create checkout session with subscription mode for recurring price
        session = stripe.checkout.Session.create(
            mode="subscription",
            payment_method_types=["card"],
            line_items=[{
                "price": PREMIUM_PRICE_ID,
                "quantity": 1,
            }],
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "user_id": current_user["id"],
                "user_email": current_user["email"],
                "product": "premium_subscription"
            },
            customer_email=current_user["email"]
        )
        
        logger.info(f"Checkout session created: {session.id}")
        
        # Create payment transaction record
        transaction = {
            "id": str(uuid.uuid4()),
            "session_id": session.id,
            "user_id": current_user["id"],
            "user_email": current_user["email"],
            "amount": PREMIUM_AMOUNT,
            "currency": "usd",
            "product": "premium_subscription",
            "status": "pending",
            "payment_status": "initiated",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.payment_transactions.insert_one(transaction)
        
        return CheckoutResponse(url=session.url, session_id=session.id)
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(status_code=400, detail=f"Payment error: {str(e)}")
    except Exception as e:
        logger.error(f"Checkout error: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to create checkout: {str(e)}")

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(
    request: Request,
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Check payment status and update user subscription"""
    stripe_api_key = os.environ.get("STRIPE_API_KEY")
    if not stripe_api_key:
        raise HTTPException(status_code=500, detail="Payment system not configured")
    
    stripe.api_key = stripe_api_key
    
    try:
        # Get session from Stripe
        session = stripe.checkout.Session.retrieve(session_id)
        
        # Update transaction in database
        transaction = await db.payment_transactions.find_one({"session_id": session_id})
        
        payment_status = "paid" if session.payment_status == "paid" else session.payment_status
        
        if transaction:
            update_data = {
                "status": session.status,
                "payment_status": payment_status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
            # If paid and not already processed, upgrade user to premium
            if payment_status == "paid" and transaction.get("payment_status") != "paid":
                await db.users.update_one(
                    {"id": current_user["id"]},
                    {"$set": {
                        "is_premium": True,
                        "premium_since": datetime.now(timezone.utc).isoformat(),
                        "stripe_customer_id": session.customer,
                        "stripe_subscription_id": session.subscription
                    }}
                )
                update_data["processed"] = True
            
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": update_data}
            )
        
        return {
            "status": session.status,
            "payment_status": payment_status,
            "amount_total": session.amount_total,
            "currency": session.currency
        }
    except stripe.error.StripeError as e:
        logger.error(f"Stripe status error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    stripe_api_key = os.environ.get("STRIPE_API_KEY")
    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET")
    
    if not stripe_api_key:
        raise HTTPException(status_code=500, detail="Payment system not configured")
    
    stripe.api_key = stripe_api_key
    
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    try:
        if webhook_secret:
            event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
        else:
            event = stripe.Event.construct_from(
                stripe.util.convert_to_stripe_object(payload),
                stripe.api_key
            )
        
        # Handle the event
        if event.type == "checkout.session.completed":
            session = event.data.object
            
            # Update transaction
            await db.payment_transactions.update_one(
                {"session_id": session.id},
                {"$set": {
                    "status": "complete",
                    "payment_status": "paid",
                    "webhook_processed": True,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            # Upgrade user
            user_id = session.metadata.get("user_id")
            if user_id:
                await db.users.update_one(
                    {"id": user_id},
                    {"$set": {
                        "is_premium": True,
                        "premium_since": datetime.now(timezone.utc).isoformat(),
                        "stripe_customer_id": session.customer,
                        "stripe_subscription_id": session.subscription
                    }}
                )
        
        elif event.type == "customer.subscription.deleted":
            subscription = event.data.object
            # Handle subscription cancellation
            await db.users.update_one(
                {"stripe_subscription_id": subscription.id},
                {"$set": {
                    "is_premium": False,
                    "premium_ended": datetime.now(timezone.utc).isoformat()
                }}
            )
        
        return {"status": "success"}
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Webhook signature error: {e}")
        raise HTTPException(status_code=400, detail="Invalid signature")
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/user/premium-status")
async def get_premium_status(current_user: dict = Depends(get_current_user)):
    """Check if user has premium subscription"""
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    return {
        "is_premium": user.get("is_premium", False),
        "premium_since": user.get("premium_since")
    }

# Include the router
app.include_router(api_router)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
