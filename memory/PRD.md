# AstroLaunch Core Engine - PRD

## Original Problem Statement
Build AstroLaunch Core Engine - a mobile-friendly astrology app with:
- Luck Score Algorithm (0-100) combining 4 metaphysical systems
- 8-step User Onboarding flow
- Daily Luck Dashboard with personalized insights
- JWT custom authentication
- Saved user profiles and daily scores history
- Chinese Metaphysical Calendar with Day Officers and business timing

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
- [x] Chinese Astrology (30% weight) - Enhanced with Day Officers
- [x] Numerology (20% weight)
- [x] Element Balance (10% weight)
- [x] 8-step onboarding wizard
- [x] Daily Luck Dashboard
- [x] User authentication (register/login)
- [x] Score history tracking
- [x] 7-day forecast with business quality
- [x] Mobile-responsive design
- [x] Chinese Metaphysical Calendar (Day Officers, Business Quality)

## What's Been Implemented

### March 6, 2026 - Initial MVP
- JWT authentication with bcrypt
- User registration & login endpoints
- Onboarding data storage
- Luck score calculation algorithm
- Daily, weekly, and historical score endpoints
- MongoDB integration
- Landing page with cosmic theme
- Login & Register pages with glass-card design
- 8-step onboarding wizard with animations
- Bento grid dashboard
- History page with trend indicators

### March 6, 2026 - Chinese Calendar Enhancement
- 12 Day Officers (建除十二神) - Jian Chu system
- Earthly Branches (地支) calculation
- Heavenly Stems (天干) calculation  
- Day Forgiveness Days (天赦日) detection
- Business quality ratings (Excellent/Good/Moderate/Caution/Unfavorable)
- Day-specific activity recommendations
- Week forecast with business indicators
- Chinese Calendar dashboard card

## Chinese Metaphysical Calendar System

### 12 Day Officers (建除十二神)
| Officer | Chinese | Business Score | Best For |
|---------|---------|----------------|----------|
| Establish | 建 Jian | 8 | Starting projects, proposals |
| Remove | 除 Chu | 6 | Cleansing, sales |
| Full | 满 Man | 9 | Grand openings, celebrations |
| Balance | 平 Ping | 5 | Negotiations, repairs |
| Stable | 定 Ding | 7 | Long-term projects, contracts |
| Initiate | 执 Zhi | 8 | New beginnings, contracts |
| Destruction | 破 Po | 2 | Avoid major activities |
| Danger | 危 Wei | 3 | Risk assessment only |
| Success | 成 Cheng | 10 | Completing projects, deals |
| Receive | 收 Shou | 8 | Closing deals, payments |
| Open | 开 Kai | 10 | Grand openings, new ventures |
| Close | 闭 Bi | 1 | Rest, meditation |

## Prioritized Backlog

### P0 (Critical) - DONE
- [x] Core luck score algorithm
- [x] User authentication
- [x] Onboarding flow
- [x] Dashboard display
- [x] Chinese calendar integration

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
- Backend: 29 tests (100% pass)
- Frontend E2E: 35 tests (100% pass)
- Test specs in `/app/tests/e2e/` and `/app/backend/tests/`
