# ClassBank — Product Requirements Document

## Original problem statement
Classroom economy app. Students earn, save, spend, and manage "classroom dollars."
Features: bank accounts, jobs (with salary), bonuses (PBIS), bills/rent, classroom store, optional fines.

## User personas
- **Teacher**: signs in with Google, runs the classroom (single classroom per teacher).
- **Student**: signs in with classroom code + name + 4-digit PIN.

## Architecture
- Backend: FastAPI (server.py), MongoDB (motor), Emergent Object Storage for store images.
- Frontend: React 19 + react-router 7 + Tailwind. Dual-persona styling: teacher = professional fintech (Outfit / IBM Plex Sans), student = neo-brutalist arcade (Fredoka, hard shadows, yellow/green pastels).
- Auth: Emergent Google OAuth for teachers (cookie session_token), bespoke cookie session for students.

## Core requirements (static)
1. Teacher Google login → set classroom_username + classroom name.
2. Teacher CRUD: students, jobs, bills, store items, applications.
3. Mass actions: "Pay Weekly Salaries", "Pay All" modal (category dropdown, select-all, bonus/fine).
4. Student PIN login → home (balance hero), jobs (apply w/ optional questions), store, profile.
5. Image uploads for store items.

## What's been implemented (Feb 2026)
- [x] All endpoints listed in problem (auth, classroom, students, jobs, applications, store, bills, transactions, pay-all, file upload).
- [x] Object storage integration for store product images.
- [x] Student multi-step PIN login with on-screen keypad.
- [x] Pay All modal with select-all + reason dropdown + bonus/fine toggle.
- [x] Pay Weekly Salaries one-click button.
- [x] Job icon picker (23 lucide icons), color presets.
- [x] Job applications with custom questions; teacher reviews responses inline.
- [x] Student profile page with job history.
- [x] 18/18 backend tests passing.

## Backlog / next tasks
- P1: Class roster import via CSV.
- P1: Auction / wish-list for store items.
- P2: Admin dashboard for schoolwide aggregate stats.
- P2: PDF receipt / weekly summary emails.
- P2: Goal-based saving challenges + achievement badges for students.
- P2: Student-to-student transfers (with teacher approval).
