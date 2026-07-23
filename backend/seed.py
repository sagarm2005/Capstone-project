from db import get_db
import logging

USERS = [
    {"id": 1, "fullName": "Priya Sharma", "email": "patient@demo.com", "role": "patient", "password": "demo123", "avatar": ""},
    {"id": 2, "fullName": "Dr. Raj Mehta", "email": "doctor@demo.com", "role": "doctor", "password": "demo123", "avatar": ""},
    {"id": 3, "fullName": "Lab Tech Anita", "email": "lab@demo.com", "role": "lab", "password": "demo123", "avatar": ""},
    {"id": 4, "fullName": "Admin Kumar", "email": "admin@demo.com", "role": "admin", "password": "demo123", "avatar": ""},
    {"id": 5, "fullName": "Super Admin Suresh", "email": "superadmin@demo.com", "role": "superadmin", "password": "demo123", "avatar": ""},
]

PATIENTS = [
    {"id": 1, "fullName": "Priya Sharma", "email": "priya@example.com", "phone": "+91-9876543210", "dateOfBirth": "1990-05-14", "gender": "Female", "bloodGroup": "B+", "allergies": ["Penicillin", "NSAIDs"], "existingConditions": ["Hypertension", "Diabetes"], "lastVisit": "2026-03-15", "vaccinationStatus": "Up to date"},
    {"id": 2, "fullName": "Arjun Nair", "email": "arjun@example.com", "phone": "+91-9812345678", "dateOfBirth": "1985-11-20", "gender": "Male", "bloodGroup": "O+", "allergies": [], "existingConditions": ["Asthma"], "lastVisit": "2026-03-28", "vaccinationStatus": "Due: Flu shot"},
    {"id": 3, "fullName": "Meera Iyer", "email": "meera@example.com", "phone": "+91-9900112233", "dateOfBirth": "1978-07-03", "gender": "Female", "bloodGroup": "A-", "allergies": ["Sulfa"], "existingConditions": [], "lastVisit": "2026-04-01", "vaccinationStatus": "Up to date"},
    {"id": 4, "fullName": "Rohan Gupta", "email": "rohan@example.com", "phone": "+91-9123456789", "dateOfBirth": "1995-02-18", "gender": "Male", "bloodGroup": "AB+", "allergies": [], "existingConditions": ["Heart Disease"], "lastVisit": "2026-02-10", "vaccinationStatus": "Up to date"},
]

DOCTORS = [
    {"id": 1, "fullName": "Dr. Raj Mehta", "specialty": "Pulmonologist", "hospital": "Fortis Bannerghatta", "location": "BTM Layout", "activePatients": 89, "status": "active", "rating": 4.8, "experience": 12, "fee": 800},
    {"id": 2, "fullName": "Dr. Priya Sharma", "specialty": "General Practice", "hospital": "Apollo Jayanagar", "location": "Jayanagar", "activePatients": 145, "status": "active", "rating": 4.7, "experience": 8, "fee": 600},
    {"id": 3, "fullName": "Dr. Anita Desai", "specialty": "Pediatrician", "hospital": "Manipal Whitefield", "location": "Whitefield", "activePatients": 210, "status": "active", "rating": 4.9, "experience": 15, "fee": 900},
    {"id": 4, "fullName": "Dr. Vikram Singh", "specialty": "General Practice", "hospital": "City Clinic HSR", "location": "HSR Layout", "activePatients": 0, "status": "on_leave", "rating": 4.5, "experience": 6, "fee": 500},
    {"id": 5, "fullName": "Dr. Sunita Reddy", "specialty": "Infectious Disease", "hospital": "Apollo Koramangala", "location": "Sector 12 — Koramangala", "activePatients": 312, "status": "active", "rating": 4.9, "experience": 20, "fee": 1200},
    {"id": 6, "fullName": "Dr. Karthik Rao", "specialty": "General Practice", "hospital": "City Clinic BTM", "location": "BTM Layout", "activePatients": 178, "status": "active", "rating": 4.6, "experience": 9, "fee": 550},
]

APPOINTMENTS = []

PRESCRIPTIONS = []

LAB_REQUESTS = []

PAYMENTS = []

NOTIFICATIONS = [
    {"id": 1, "userId": 1, "type": "appointment", "title": "Appointment Confirmed", "message": "Your appointment with Dr. Raj Mehta on April 10 at 10:00 AM is confirmed.", "read": False, "createdAt": "2026-04-08T08:00:00Z"},
    {"id": 2, "userId": 1, "type": "lab_report", "title": "Lab Report Ready", "message": "Your chest X-ray report is ready. Please view it in your lab section.", "read": False, "createdAt": "2026-04-08T09:30:00Z"},
    {"id": 3, "userId": 1, "type": "followup", "title": "Follow-up Reminder", "message": "You have a follow-up due with Dr. Raj Mehta on July 10, 2026.", "read": False, "createdAt": "2026-04-07T08:00:00Z"},
    {"id": 4, "userId": 2, "type": "payment", "title": "Payment Received", "message": "Payment of ₹800 received for consultation. Invoice: INV-2026-001", "read": True, "createdAt": "2026-04-08T10:05:00Z"},
]

LOCATIONS = [
    {"id": 1, "name": "Sector 12 — Koramangala", "totalDoctors": 42, "activeDoctors": 38, "onLeave": 4, "activePatients": 2150, "facilities": 6, "breakdown": {"gp": 18, "specialists": 16, "surgeons": 8}},
    {"id": 2, "name": "HSR Layout", "totalDoctors": 35, "activeDoctors": 32, "onLeave": 3, "activePatients": 1840, "facilities": 5, "breakdown": {"gp": 15, "specialists": 13, "surgeons": 7}},
    {"id": 3, "name": "BTM Layout", "totalDoctors": 28, "activeDoctors": 26, "onLeave": 2, "activePatients": 1220, "facilities": 4, "breakdown": {"gp": 12, "specialists": 10, "surgeons": 6}},
    {"id": 4, "name": "Whitefield", "totalDoctors": 52, "activeDoctors": 50, "onLeave": 2, "activePatients": 3100, "facilities": 8, "breakdown": {"gp": 20, "specialists": 22, "surgeons": 10}},
    {"id": 5, "name": "Electronic City", "totalDoctors": 44, "activeDoctors": 41, "onLeave": 3, "activePatients": 2450, "facilities": 7, "breakdown": {"gp": 17, "specialists": 18, "surgeons": 9}},
    {"id": 6, "name": "Jayanagar", "totalDoctors": 47, "activeDoctors": 44, "onLeave": 3, "activePatients": 1980, "facilities": 4, "breakdown": {"gp": 19, "specialists": 18, "surgeons": 10}},
]

DISEASE_DATA = [
    {"id": 1, "name": "Dengue", "activeCases": 1284, "newCasesToday": 47, "trend": "rising", "severity": "high", "affectedAreas": ["Koramangala", "BTM Layout", "Electronic City"]},
    {"id": 2, "name": "Influenza", "activeCases": 3102, "newCasesToday": 112, "trend": "stable", "severity": "medium", "affectedAreas": ["All zones"]},
    {"id": 3, "name": "COVID-19", "activeCases": 89, "newCasesToday": 3, "trend": "declining", "severity": "low", "affectedAreas": ["Whitefield", "HSR Layout"]},
    {"id": 4, "name": "Cholera", "activeCases": 34, "newCasesToday": 8, "trend": "rising", "severity": "critical", "affectedAreas": ["Electronic City (isolated cluster)"]},
]

SPREAD_PREDICTIONS = [
    {"zone": "Koramangala", "risk": "high", "predictedCases": 180, "disease": "Dengue", "week": "Apr 14–20"},
    {"zone": "BTM Layout", "risk": "medium", "predictedCases": 95, "disease": "Dengue", "week": "Apr 14–20"},
    {"zone": "Electronic City", "risk": "critical", "predictedCases": 45, "disease": "Cholera", "week": "Apr 14–20"},
    {"zone": "Whitefield", "risk": "low", "predictedCases": 20, "disease": "COVID-19", "week": "Apr 14–20"},
]


LAB_TECHS = [
    {"id": 3, "fullName": "Lab Tech Anita", "email": "lab@demo.com", "labName": "City Diagnostics", "licenseNumber": "LAB-12345"},
    {"id": 6, "fullName": "Lab Tech Suresh", "email": "suresh@lab.com", "labName": "Metro Pathology", "licenseNumber": "LAB-67890"},
]

def seed_if_empty():
    db = get_db()
    collections = {
        "users": USERS,
        "patients": PATIENTS,
        "doctors": DOCTORS,
        "lab_techs": LAB_TECHS,
        "appointments": APPOINTMENTS,
        "prescriptions": PRESCRIPTIONS,
        "lab_requests": LAB_REQUESTS,
        "payments": PAYMENTS,
        "notifications": NOTIFICATIONS,
        "locations": LOCATIONS,
        "disease_data": DISEASE_DATA,
        "spread_predictions": SPREAD_PREDICTIONS,
    }
    for col_name, data in collections.items():
        col = db[col_name]
        if col.count_documents({}) == 0:
            if data:
                col.insert_many([dict(d) for d in data])
                logging.info(f"Seeded {len(data)} documents into '{col_name}'")
            else:
                logging.info(f"Collection '{col_name}' is empty and has no seed data, skipping.")
        else:
            logging.info(f"Collection '{col_name}' already has data, skipping seed")

    # Create indexes
    db.users.create_index("email", unique=True)
    db.appointments.create_index("patientId")
    db.appointments.create_index("doctorId")
    db.prescriptions.create_index("patientId")
    db.prescriptions.create_index("doctorId")
    db.lab_requests.create_index("status")
    db.lab_requests.create_index("labId")
    db.payments.create_index("patientId")
    db.notifications.create_index("userId")
    logging.info("MongoDB indexes ensured.")
