# 8StarLuck - Product Requirements Document

## Overview
8StarLuck is a daily luck score calculator combining Western Astrology, Chinese Astrology, Numerology, and Element Balance to provide users with personalized cosmic guidance.

## Live URLs
- **Frontend:** https://8starluck.com
- **Backend:** https://api.8starluck.com
- **GitHub:** https://github.com/tajamills/AstroDude

## Core Features

### Implemented ✅
1. **Luck Score Algorithm** - Weighted combination of:
   - Western Astrology (40%)
   - Chinese Astrology (30%) with Day Officers, Business Days
   - Numerology (20%) - GG33 style, Lo Shu Grid, Master Numbers
   - Element Balance (10%)

2. **User Authentication** - JWT-based auth with registration/login

3. **Dashboard** - Daily luck score, lucky color/number, guidance, weekly forecast

4. **Decode Any Date** (Founder-focused redesign):
   - "Is This a Good Day to Launch?" positioning
   - Hero score display (3-4x larger)
   - Signals Today (quick scannable bullets)
   - Launch/Risk/Business Signal cards
   - Date Battle comparison feature
   - Shareable result cards
   - Exploration prompts

5. **Lucky Locations** - Find ideal locations for:
   - Love & Romance
   - Money & Career
   - Spiritual Growth
   - Partner Compatibility (Premium)

6. **Premium Subscription** - $8.88/mo via Stripe
   - Removes ads
   - Full location access
   - Partner compatibility analysis

7. **Branding** - 8StarLuck with custom logo and 888 favicon

### Tech Stack
- **Frontend:** React, TailwindCSS, Shadcn UI, Framer Motion
- **Backend:** FastAPI, Python, Motor (async MongoDB)
- **Database:** MongoDB Atlas
- **Payments:** Stripe Subscriptions
- **Hosting:** Render

### Key Files
- `backend/server.py` - All backend logic
- `frontend/src/pages/Dashboard.jsx` - Main dashboard
- `frontend/src/pages/DecodePage.jsx` - Date decoder (founder-focused)
- `frontend/src/pages/LocationsPage.jsx` - Lucky locations
- `frontend/src/lib/api.js` - API functions
- `frontend/src/lib/utils.js` - Utility functions
- `frontend/public/index.html` - Meta tags, AdSense, favicon

### Environment Variables (Render)
**Backend:**
- `MONGO_URL` - MongoDB Atlas connection string
- `DB_NAME` - astrodude
- `CORS_ORIGINS` - https://8starluck.com,https://www.8starluck.com
- `STRIPE_API_KEY` - Live Stripe key
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret

**Frontend:**
- `REACT_APP_BACKEND_URL` - https://api.8starluck.com

### DNS Setup (Namecheap)
- A @ → 216.24.57.1
- CNAME www → astrodude-front.onrender.com
- CNAME api → astro-73qw.onrender.com

## Backlog / Future Features
- Email notifications for daily luck scores
- Social login (Google Auth)
- Mobile app version
- More share formats (images, social cards)
