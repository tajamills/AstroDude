# AstroLaunch Core Engine - PRD

## Original Problem Statement
Build AstroLaunch Core Engine - a mobile-friendly astrology app with:
- Luck Score Algorithm (0-100) combining 4 metaphysical systems
- 8-step User Onboarding flow
- Daily Luck Dashboard with personalized insights
- JWT custom authentication
- Saved user profiles and daily scores history
- Chinese Metaphysical Calendar with Day Officers and business timing
- GG33 Numerology with Master Numbers and Chinese lucky numbers

## Influencer Methodologies Incorporated
1. **Gary GG33** - Life Path calculations, Master Numbers 11/22/33, number energies & traits, friendly/challenging numbers
2. **Chinese Numerology** - Lucky numbers based on pronunciation (8=发 prosperity, 6=流 smooth, 4=死 death avoided)
3. **Joey Yap** - BaZi Day Master, Heavenly Stems, Earthly Branches
4. **Yi Nan** - Chinese metaphysics principles
5. **Phaedra** - Spiritual numerology integration
6. **Lillian Too & Raymond Lo** - Flying Stars, Four Pillars concepts

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Framer Motion + Shadcn/UI
- **Backend**: FastAPI with Python
- **Database**: MongoDB (Motor async driver)
- **Authentication**: JWT with bcrypt password hashing

## Core Requirements (Static)
- [x] Luck Score Algorithm (0-100) with 4 systems
- [x] Western Astrology (40% weight)
- [x] Chinese Astrology (30% weight) - Enhanced with Day Officers
- [x] Numerology (20% weight) - GG33 system
- [x] Element Balance (10% weight)
- [x] 8-step onboarding wizard
- [x] Daily Luck Dashboard
- [x] User authentication (register/login)
- [x] Score history tracking
- [x] 7-day forecast with business quality
- [x] Mobile-responsive design
- [x] Chinese Metaphysical Calendar (Day Officers, Business Quality)
- [x] GG33 Master Numbers (11, 22, 33)
- [x] Chinese Lucky Numbers with meanings
- [x] Lo Shu Grid analysis

## GG33 Number System (Gary the Numbers Guy)
| Number | Energy | Traits | Friendly | Challenging |
|--------|--------|--------|----------|-------------|
| 1 | Yang/Male | Leadership, independence | 3, 5, 9 | 4, 8 |
| 2 | Yin/Female | Cooperation, peace | 6, 8, 9 | 5, 7 |
| 3 | Creative | Communication, luck, comedy | 1, 5, 9 | 4, 8 |
| 4 | Builder | Work, structure, discipline | 2, 6, 8 | 1, 3, 5 |
| 5 | Change | Travel, freedom, adventure | 1, 3, 7, 9 | 2, 4, 6 |
| 6 | Harmony | Home, family, nurturing | 2, 4, 8, 9 | 1, 5 |
| 7 | Genius | Intelligence, spirituality | 3, 5 | 2, 8, 9 |
| 8 | Power | Money, success, authority | 2, 4, 6 | 1, 3, 7 |
| 9 | Wisdom | Completion, humanitarian | 1, 3, 5, 6 | 4, 8 |
| 11 | Master Intuition | Awareness, illumination | 2, 4, 6 | 5, 7 |
| 22 | Master Builder | Manifesting dreams | 4, 6, 8 | 5, 7 |
| 33 | Master Teacher | Enlightenment, blessing | 3, 6, 9 | 1, 5 |

## Chinese Lucky Numbers
| Number | Luck | Meaning |
|--------|------|---------|
| 8 | 极吉 | Prosperity (八 sounds like 发) |
| 6 | 吉 | Smooth & flowing (六 sounds like 流) |
| 9 | 吉 | Longevity (九 sounds like 久) |
| 2 | 吉 | Pairs & harmony |
| 3 | 吉 | Life & growth (三 sounds like 生) |
| 4 | 大凶 | AVOIDED - Death (四 sounds like 死) |
| 7 | 凶 | Gone/departed (七 sounds like 去) |

## Test Coverage
- Backend: 36 tests (100% pass)
- Frontend E2E: 38 tests (100% pass)

## Next Tasks
1. Implement Stripe integration for premium tier
2. Add partner compatibility using BaZi
3. Set up push notifications for daily scores
4. Create detailed BaZi chart display
