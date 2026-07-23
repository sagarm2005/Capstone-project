# MediCore HMS

## Overview

Healthcare Management System with a Python Flask backend and React JSX frontend.

## Project Structure

```
frontend/       — React 19 + Vite + Tailwind v4 (JSX, no TypeScript)
backend/        — Python Flask REST API (in-memory data, no database)
```

## Stack

### Frontend (`frontend/`)
- **Framework**: React 19 + Vite 7
- **Styling**: Tailwind CSS v4 (via @tailwindcss/vite)
- **Routing**: wouter
- **Data fetching**: @tanstack/react-query
- **Icons**: lucide-react
- **Language**: JavaScript/JSX (no TypeScript)

### Backend (`backend/`)
- **Framework**: Python Flask
- **CORS**: flask-cors
- **Data**: In-memory seed data (no database required)
- **Port**: 8080

## Running the App

- **Backend**: `PORT=8080 python backend/main.py`  
- **Frontend**: `PORT=3000 pnpm --filter @workspace/frontend run dev`  

The frontend proxies `/api` requests to `http://localhost:8080`.

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/login | Login |
| POST | /api/auth/signup | Register |
| GET/POST | /api/appointments | Appointments |
| GET/POST | /api/vaccinations | Vaccination records |
| GET/POST | /api/prescriptions | Prescriptions (AI-validated) |
| GET/POST | /api/lab/requests | Lab requests |
| GET | /api/patients | Patient list |
| GET | /api/doctors | Doctor list |
| GET | /api/dashboard/patient | Patient dashboard data |
| GET | /api/dashboard/doctor | Doctor dashboard data |
| GET | /api/admin/stats | Admin statistics |
| GET | /api/admin/locations | Location stats |
| GET | /api/admin/disease-data | Disease monitoring data |
| GET | /api/admin/spread-prediction | AI spread predictions |
| GET/POST | /api/payments | Payments |
| GET | /api/notifications | Notifications |
| POST | /api/chatbot/query | AI chatbot |

## Demo Accounts

All use password `demo123`:
- `patient@demo.com` — Patient role
- `doctor@demo.com` — Doctor role
- `lab@demo.com` — Lab Tech role
- `admin@demo.com` — Admin role
- `superadmin@demo.com` — Super Admin role

## Features by Role

- **Patient**: Dashboard, appointments (book), prescriptions (view), lab reports, payments, notifications, AI chatbot
- **Doctor**: Dashboard, appointments, prescriptions (create), lab reports, patient list
- **Lab**: Lab requests (view, mark ready), dashboard
- **Admin**: Dashboard, appointments, patients, payments, disease monitoring, location stats
- **Super Admin**: All features + location statistics
