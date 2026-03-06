# AstroLaunch Core Engine - PRD

## Original Problem Statement
Build AstroLaunch Core Engine - a mobile-friendly astrology app with:
- Luck Score Algorithm (0-100) combining 4 metaphysical systems
- 8-step User Onboarding flow
- Daily Luck Dashboard with personalized insights
- JWT custom authentication
- Saved user profiles and daily scores history

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Framer Motion + Shadcn/UI
- **Backend**: FastAPI with Python
- **Database**: MongoDB (Motor async driver)
- **Authentication**: JWT with bcrypt password hashing

## User Personas
1. **Astrology Enthusiasts**: People seeking daily guidance based on cosmic alignments
2. **Business Decision Makers**: Users wanting optimal timing for business activities
3. **Self-Improvement Seekers**: Users interested in personal growth and compatibility

## Core Requirements (Static)
- [x] Luck Score Algorithm (0-100) with 4 systems
- [x] Western Astrology (40% weight)
- [x] Chinese Astrology (30% weight)
- [x] Numerology (20% weight)
- [x] Element Balance (10% weight)
- [x] 8-step onboarding wizard
- [x] Daily Luck Dashboard
- [x] User authentication (register/login)
- [x] Score history tracking
- [x] 7-day forecast
- [x] Mobile-responsive design

## What's Been Implemented (March 6, 2026)
### Backend (server.py)
- JWT authentication with bcrypt
- User registration & login endpoints
- Onboarding data storage
- Luck score calculation algorithm
- Daily, weekly, and historical score endpoints
- MongoDB integration

### Frontend
- Landing page with cosmic theme (Techno-Mage aesthetic)
- Login & Register pages with glass-card design
- 8-step onboarding wizard with animations
- Bento grid dashboard with:
  - Circular luck meter
  - Lucky color & number display
  - Profile summary (zodiac, element, life path)
  - Today's guidance (Good For / Avoid)
  - 7-day forecast
  - Score breakdown by system
- History page with trend indicators
- Fully mobile-responsive

## Prioritized Backlog

### P0 (Critical) - DONE
- [x] Core luck score algorithm
- [x] User authentication
- [x] Onboarding flow
- [x] Dashboard display

### P1 (High Priority)
- [ ] Premium subscription with Stripe
- [ ] Partner compatibility analysis
- [ ] Push notifications for daily score
- [ ] Advanced yearly forecasts

### P2 (Medium Priority)
- [ ] Email verification
- [ ] Password reset flow
- [ ] Social sharing of daily score
- [ ] Export score history

### P3 (Nice to Have)
- [ ] Dark/Light theme toggle
- [ ] Custom notification preferences
- [ ] Community features
- [ ] Detailed transit charts

## Next Tasks
1. Implement Stripe integration for $8.88/month premium tier
2. Add partner compatibility calculations
3. Set up email notifications for daily scores
4. Create yearly forecast feature

## Test Coverage
- Backend: 25 tests (100% pass)
- Frontend E2E: 24 tests (100% pass)
- Test specs in `/app/tests/e2e/` and `/app/backend/tests/`
