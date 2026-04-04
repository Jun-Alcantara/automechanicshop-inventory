# AMSPOS-101: Create README

**Sprint**: Sprint 16 — Final QA & Documentation
**Effort**: 0.5 day
**Dependencies**: Tech stack finalized, build process confirmed
**Phase**: Polish

---

## Overview

Create `README.md` at the project root.

---

## Content

```markdown
# AutoShop POS

Android POS application for vehicle service shops.

## Tech Stack
- Expo (managed, Android only)
- TypeScript (strict)
- WatermelonDB (offline-first SQLite)
- Zustand (state management)
- React Navigation v6

## Getting Started
1. `npm install`
2. `npm run build:dev` (build EAS dev client APK)
3. Install APK on Android device
4. `npm run start:dev`

## Architecture
See `documents/architecture.md`

## Data Model
See `documents/data_model.md`

## Sprint Plan
See `implementation/sprints/`
```

---

## Acceptance Criteria

- [ ] `README.md` exists at project root
- [ ] Tech stack section is accurate
- [ ] Getting Started steps are correct and tested
- [ ] Links to architecture and data model docs are valid

## Definition of Done

- All acceptance criteria are met
- `README.md` committed to `main`
