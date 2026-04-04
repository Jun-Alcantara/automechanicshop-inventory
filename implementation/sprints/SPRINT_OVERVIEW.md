# AutoShop POS — Sprint Overview

**Total Sprints**: 17 (Sprint 0 through Sprint 16)
**Total Tasks**: 102
**Sprint Cadence**: 2 weeks per sprint
**Team**: 1 senior React Native developer
**Capacity per sprint**: ~7 effective dev days

---

## Sprint Map

| Sprint | Theme | Tasks | Capacity | Duration |
|--------|-------|-------|----------|----------|
| Sprint 0 | Foundation Infrastructure | 1,2,3,4,5,6,7,8,28,29 | 7d | Weeks 1–2 |
| Sprint 1 | Auth Services & Utilities | 9,10,11,12,18,46,47,48,30 | 7d | Weeks 3–4 |
| Sprint 2 | Auth Screens & Components | 13,14,15,16,17,19,49,31,32 | 7d | Weeks 5–6 |
| Sprint 3 | Navigation Setup | 20,21,22,23,24,25,27 | 6.5d | Weeks 7–8 |
| Sprint 4 | Admin Stack & Settings Infrastructure | 26,39,40,43,80,82 | 6.5d | Weeks 9–10 |
| Sprint 5 | Core Services (All tables) | 33,34,35,36,37,38 | 5.5d | Weeks 11–12 |
| Sprint 6 | Zustand Stores | 41,42,44,45,86 | 6d | Weeks 13–14 |
| Sprint 7 | Dashboard, Reports & User Screens | 50,51,52,78,85 | 6.5d | Weeks 15–16 |
| Sprint 8 | User Form & Inventory Screens | 79,53,56,57,58 | 6.5d | Weeks 17–18 |
| Sprint 9 | Product/Service Forms, CustomerList, Barcode | 54,55,59,72 | 6.5d | Weeks 19–20 |
| Sprint 10 | Customer & Vehicle Screens | 60,61,62,63,75 | 7d | Weeks 21–22 |
| Sprint 11 | Transaction Core Screens & Modals | 64,65,73,74,87 | 6d | Weeks 23–24 |
| Sprint 12 | TransactionDetailScreen (Complex) | 66,76,77,69,88 | 6d | Weeks 25–26 |
| Sprint 13 | Payment & Post-Transaction Flows | 67,68,70,71,89 | 6d | Weeks 27–28 |
| Sprint 14 | Settings, Printer Integration & Unit Tests | 81,83,84,90 | 6.5d | Weeks 29–30 |
| Sprint 15 | Testing (Stores, Integration, Services, Auth) | 91,92,93,94 | 6d | Weeks 31–32 |
| Sprint 16 | Final QA & Documentation | 95,96,97,98,99,100,101,102 | 7d | Weeks 33–34 |

---

## Milestones

| After Sprint | Deliverable |
|---|---|
| Sprint 0 | Project compiles, DB schema defined, all placeholder folders/files present |
| Sprint 2 | PIN authentication fully functional (login, lock, unlock) |
| Sprint 3 | Full navigation skeleton — all tabs and screens reachable |
| Sprint 5 | All database reads/writes possible (all services implemented) |
| Sprint 6 | All stores reactive — data flows from DB to UI |
| Sprint 8 | Inventory management fully functional |
| Sprint 10 | Customer and vehicle management fully functional |
| Sprint 12 | Transactions can be created, items added, and transaction detail viewed |
| Sprint 13 | Full transaction lifecycle: create → pay → finalize → void → return |
| Sprint 14 | Receipt printing (thermal + PDF) functional |
| Sprint 16 | App ready for internal release |

---

## Task Files

Each sprint directory contains `.md` files named `amspos-{N}-{description}.md`.
Each task file includes:
- **Effort** — estimated developer days
- **Dependencies** — prerequisite tasks (by AMSPOS number)
- **Instructions** — step-by-step implementation guide with code snippets
- **Acceptance Criteria** — checkboxes to verify before marking done
- **Definition of Done** — final conditions for task completion

---

## References

- Architecture: `documents/architecture.md`
- Data Model: `documents/data_model.md`
- Functional Requirements: `documents/functional_requirements.md`
- Coding Standards: `documents/coding_standards.md`
