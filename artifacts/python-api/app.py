"""
MediCore HMS - Python Flask Backend
AI-Powered Doctor Assistance and Smart Healthcare Management System
"""

import os
import json
from datetime import datetime, timedelta
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

PORT = int(os.environ.get("PORT", 8080))

# ─────────────────────────────────────────────────────────────────────────────
# In-memory seed data
# ─────────────────────────────────────────────────────────────────────────────

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

APPOINTMENTS = [
    {"id": 1, "patientId": 1, "patientName": "Priya Sharma", "doctorId": 1, "doctorName": "Dr. Raj Mehta", "date": "2026-04-10", "time": "10:00 AM", "type": "normal", "status": "confirmed", "fee": 800, "notes": "Regular checkup"},
    {"id": 2, "patientId": 2, "patientName": "Arjun Nair", "doctorId": 3, "doctorName": "Dr. Anita Desai", "date": "2026-04-10", "time": "11:30 AM", "type": "followup", "status": "pending", "fee": 900, "notes": "Follow-up for asthma"},
    {"id": 3, "patientId": 3, "patientName": "Meera Iyer", "doctorId": 5, "doctorName": "Dr. Sunita Reddy", "date": "2026-04-11", "time": "09:00 AM", "type": "emergency", "status": "confirmed", "fee": 1500, "notes": "High fever"},
    {"id": 4, "patientId": 4, "patientName": "Rohan Gupta", "doctorId": 2, "doctorName": "Dr. Priya Sharma", "date": "2026-04-12", "time": "02:00 PM", "type": "normal", "status": "completed", "fee": 600, "notes": "Cardiac review"},
]

PRESCRIPTIONS = [
    {
        "id": 1, "patientId": 1, "patientName": "Priya Sharma", "doctorId": 1, "doctorName": "Dr. Raj Mehta",
        "doctorLicense": "MCI-KA-12345", "hospital": "Fortis Bannerghatta",
        "diagnosis": "Type 2 Diabetes Mellitus with Hypertension",
        "medicines": [
            {"name": "Metformin", "dosage": "500mg", "frequency": "Twice daily", "duration": "90 days", "route": "Oral"},
            {"name": "Lisinopril", "dosage": "10mg", "frequency": "Once daily", "duration": "90 days", "route": "Oral"},
            {"name": "Atorvastatin", "dosage": "20mg", "frequency": "Once at night", "duration": "90 days", "route": "Oral"},
        ],
        "labTests": ["HbA1c", "Lipid Panel", "Kidney Function Test"],
        "followupDate": "2026-07-10",
        "validations": [
            {"type": "success", "message": "No allergy conflicts detected"},
            {"type": "warning", "message": "Monitor kidney function — Metformin + Lisinopril combination"},
            {"type": "error", "message": "Aspirin avoided — patient allergic to NSAIDs"},
        ],
        "createdAt": "2026-03-15T10:30:00Z"
    },
]

LAB_REQUESTS = [
    {"id": 1, "patientId": 1, "patientName": "Priya Sharma", "doctorId": 1, "doctorName": "Dr. Raj Mehta", "testType": "Chest X-Ray", "priority": "urgent", "status": "ready", "reportUrl": "/reports/xray_001.pdf",
     "aiAnalysis": {"primaryCondition": "Pneumonia", "confidence": 0.87, "secondaryConditions": [{"condition": "Normal", "confidence": 0.09}, {"condition": "Pleural Effusion", "confidence": 0.04}], "disclaimer": "AI analysis is assistive only. Clinical judgment required."}, "createdAt": "2026-04-08T08:00:00Z"},
    {"id": 2, "patientId": 2, "patientName": "Arjun Nair", "doctorId": 3, "doctorName": "Dr. Anita Desai", "testType": "CBC", "priority": "normal", "status": "pending", "reportUrl": None, "aiAnalysis": None, "createdAt": "2026-04-08T09:00:00Z"},
    {"id": 3, "patientId": 3, "patientName": "Meera Iyer", "doctorId": 5, "doctorName": "Dr. Sunita Reddy", "testType": "Dengue NS1 Antigen", "priority": "urgent", "status": "processing", "reportUrl": None, "aiAnalysis": None, "createdAt": "2026-04-08T10:00:00Z"},
]

PAYMENTS = [
    {"id": 1, "patientId": 1, "patientName": "Priya Sharma", "appointmentId": 1, "amount": 800, "category": "consultation", "method": "upi", "status": "completed", "invoiceId": "INV-2026-001", "createdAt": "2026-04-08T10:00:00Z"},
    {"id": 2, "patientId": 3, "patientName": "Meera Iyer", "appointmentId": 3, "amount": 1500, "category": "emergency", "method": "card", "status": "completed", "invoiceId": "INV-2026-002", "createdAt": "2026-04-08T09:15:00Z"},
]

NOTIFICATIONS = [
    {"id": 1, "userId": 1, "type": "appointment", "title": "Appointment Confirmed", "message": "Your appointment with Dr. Raj Mehta on April 10 at 10:00 AM is confirmed.", "read": False, "createdAt": "2026-04-08T08:00:00Z"},
    {"id": 2, "userId": 1, "type": "lab_report", "title": "Lab Report Ready", "message": "Your chest X-ray report is ready. Please view it in your lab section.", "read": False, "createdAt": "2026-04-08T09:30:00Z"},
    {"id": 3, "userId": 1, "type": "followup", "title": "Follow-up Reminder", "message": "You have a follow-up due with Dr. Raj Mehta on July 10, 2026.", "read": False, "createdAt": "2026-04-07T08:00:00Z"},
    {"id": 4, "userId": 2, "type": "payment", "title": "Payment Received", "message": "Payment of ₹800 received for consultation. Invoice: INV-2026-001", "read": True, "createdAt": "2026-04-08T10:05:00Z"},
]

FOLLOWUPS = [
    {"id": 1, "patientId": 1, "doctorId": 1, "doctorName": "Dr. Raj Mehta", "dueDate": "2026-07-10", "status": "pending", "reason": "Diabetes management review"},
    {"id": 2, "patientId": 2, "doctorId": 3, "doctorName": "Dr. Anita Desai", "dueDate": "2026-04-20", "status": "pending", "reason": "Asthma follow-up"},
]

VACCINATIONS = [
    {"id": 1, "patientId": 1, "patientName": "Priya Sharma", "vaccineName": "Covaxin", "company": "Bharat Biotech", "batchNo": "BV12345", "administeredBy": "Dr. Raj Mehta", "type": "Injection", "date": "2024-01-15", "createdAt": "2024-01-15T10:00:00Z"},
    {"id": 2, "patientId": 1, "patientName": "Priya Sharma", "vaccineName": "Flu Shot", "company": "Sanofi", "batchNo": "FL98765", "administeredBy": "Dr. Raj Mehta", "type": "Injection", "date": "2025-11-20", "createdAt": "2025-11-20T10:00:00Z"},
]

LOCATIONS = [
    {"id": 1, "name": "Sector 12 — Koramangala", "totalDoctors": 42, "activeDoctors": 38, "onLeave": 4, "activePatients": 2150, "facilities": 6, "breakdown": {"gp": 18, "specialists": 16, "surgeons": 8}},
    {"id": 2, "name": "HSR Layout", "totalDoctors": 35, "activeDoctors": 32, "onLeave": 3, "activePatients": 1840, "facilities": 5, "breakdown": {"gp": 15, "specialists": 13, "surgeons": 7}},
    {"id": 3, "name": "BTM Layout", "totalDoctors": 28, "activeDoctors": 26, "onLeave": 2, "activePatients": 1220, "facilities": 4, "breakdown": {"gp": 12, "specialists": 10, "surgeons": 6}},
    {"id": 4, "name": "Whitefield", "totalDoctors": 52, "activeDoctors": 50, "onLeave": 2, "activePatients": 3100, "facilities": 8, "breakdown": {"gp": 20, "specialists": 22, "surgeons": 10}},
    {"id": 5, "name": "Electronic City", "totalDoctors": 44, "activeDoctors": 41, "onLeave": 3, "activePatients": 2450, "facilities": 7, "breakdown": {"gp": 17, "specialists": 18, "surgeons": 9}},
    {"id": 6, "name": "Jayanagar", "totalDoctors": 47, "activeDoctors": 44, "onLeave": 3, "activePatients": 1980, "facilities": 4, "breakdown": {"gp": 19, "specialists": 18, "surgeons": 10}},
]

CHATBOT_INTENTS = {
    "availability": ["available", "availability", "when", "slot", "schedule", "open", "free"],
    "booking": ["book", "appointment", "schedule", "reserve"],
    "vaccination": ["vaccine", "vaccination", "immunization", "shot"],
    "lab": ["lab", "report", "test", "result", "x-ray", "scan"],
    "followup": ["follow", "followup", "follow-up", "revisit"],
    "greeting": ["hi", "hello", "hey", "good morning", "good afternoon"],
}

def detect_intent(message):
    msg = message.lower()
    for intent, keywords in CHATBOT_INTENTS.items():
        if any(k in msg for k in keywords):
            return intent
    return "general"

def chatbot_reply(message, intent, patient_id=1):
    """Generates a reply based on intent and simulated patient data."""
    patient = next((p for p in PATIENTS if p["id"] == patient_id), {})
    
    replies = {
        "greeting": ("Hello! I'm MediCore Assistant. How can I help you today?", ["Check Availability", "Book Appointment", "Lab Results", "Vaccination Status"]),
        "availability": ("Dr. Raj Mehta has slots at 10:00 AM and 3:00 PM tomorrow. Would you like to book one?", ["Book 10:00 AM", "Book 3:00 PM", "See Other Doctors"]),
        "booking": ("I'll help you book an appointment. Please choose a doctor and time slot.", ["Dr. Raj Mehta", "Dr. Anita Desai", "Dr. Sunita Reddy"]),
        "lab": ("Your chest X-ray report is ready. The AI analysis suggests Pneumonia (87% confidence) — please consult your doctor.", ["View Report", "Contact Doctor"]),
        "followup": ("You have a follow-up due with Dr. Raj Mehta on July 10, 2026.", ["Book Follow-up", "Remind Me Later"]),
        "general": ("I can help you check doctor availability, book appointments, view lab results, or check your vaccination status. What would you like to do?", ["Book Appointment", "Check Availability", "Lab Results", "Vaccination Status"]),
    }

    if intent == "vaccination":
        history = [v for v in VACCINATIONS if v["patientId"] == patient_id]
        vax_text = f"Status: {patient.get('vaccinationStatus', 'Verification Pending')}."
        if history:
            vax_text += f" Your last vaccine was {history[-1]['vaccineName']} ({history[-1]['type']}) on {history[-1]['date']}."
        return vax_text, ["View History", "Schedule Vaccine"]

    reply, suggestions = replies.get(intent, replies["general"])
    return reply, suggestions

# ─────────────────────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/api/healthz")
def health_check():
    return jsonify({"status": "ok"})

# Auth
@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json()
    user = next((u for u in USERS if u["email"] == data.get("email") and u["password"] == data.get("password")), None)
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401
    return jsonify({"token": f"demo-token-{user['id']}", "user": {k: v for k, v in user.items() if k != "password"}})

@app.route("/api/auth/signup", methods=["POST"])
def signup():
    data = request.get_json()
    new_user = {
        "id": len(USERS) + 1,
        "fullName": data.get("fullName"),
        "email": data.get("email"),
        "role": data.get("role", "patient").lower().replace(" ", "_"),
        "password": data.get("password"),
        "avatar": ""
    }
    USERS.append(new_user)
    new_patient = {
        "id": len(PATIENTS) + 1,
        "fullName": data.get("fullName"),
        "email": data.get("email"),
        "phone": data.get("phone", ""),
        "dateOfBirth": data.get("dateOfBirth", ""),
        "gender": data.get("gender", ""),
        "bloodGroup": data.get("bloodGroup", ""),
        "allergies": data.get("allergies", []),
        "existingConditions": data.get("existingConditions", []),
        "lastVisit": None,
        "vaccinationStatus": "Pending verification"
    }
    PATIENTS.append(new_patient)
    return jsonify({"token": f"demo-token-{new_user['id']}", "user": {k: v for k, v in new_user.items() if k != "password"}}), 201

@app.route("/api/auth/logout", methods=["POST"])
def logout():
    return jsonify({"message": "Logged out successfully"})

# Patients
@app.route("/api/patients")
def list_patients():
    search = request.args.get("search", "").lower()
    filtered = [p for p in PATIENTS if not search or search in p["fullName"].lower() or search in p["email"].lower()]
    limit = int(request.args.get("limit", 20))
    offset = int(request.args.get("offset", 0))
    return jsonify({"patients": filtered[offset:offset+limit], "total": len(filtered)})

@app.route("/api/patients/<int:id>")
def get_patient(id):
    patient = next((p for p in PATIENTS if p["id"] == id), None)
    if not patient:
        return jsonify({"error": "Not found"}), 404
    
    # Include vaccinations in the detailed patient view for the Doctor
    res = dict(patient)
    res["vaccinations"] = [v for v in VACCINATIONS if v["patientId"] == id]
    return jsonify(res)

@app.route("/api/patients/<int:id>/history")
def get_patient_history(id):
    visits = [
        {"id": 1, "date": "2026-03-15", "doctorName": "Dr. Raj Mehta", "diagnosis": "Type 2 Diabetes review", "notes": "BP controlled, adjust Metformin"},
        {"id": 2, "date": "2026-01-10", "doctorName": "Dr. Raj Mehta", "diagnosis": "Hypertension follow-up", "notes": "Continue Lisinopril 10mg"},
        {"id": 3, "date": "2025-11-20", "doctorName": "Dr. Anita Desai", "diagnosis": "Seasonal flu", "notes": "Rest and fluids prescribed"},
    ]
    return jsonify({"visits": visits})

@app.route("/api/patients/<int:id>/followups")
def get_patient_followups(id):
    patient_followups = [f for f in FOLLOWUPS if f["patientId"] == id]
    return jsonify(patient_followups)

# Doctors
@app.route("/api/doctors")
def list_doctors():
    specialty = request.args.get("specialty", "").lower()
    location = request.args.get("location", "").lower()
    filtered = DOCTORS
    if specialty:
        filtered = [d for d in filtered if specialty in d["specialty"].lower()]
    if location:
        filtered = [d for d in filtered if location in d["location"].lower()]
    return jsonify(filtered)

@app.route("/api/doctors/<int:id>")
def get_doctor(id):
    doctor = next((d for d in DOCTORS if d["id"] == id), None)
    if not doctor:
        return jsonify({"error": "Not found"}), 404
    return jsonify(doctor)

@app.route("/api/doctors/<int:id>/slots")
def get_doctor_slots(id):
    date = request.args.get("date", "")
    slots = [
        {"time": "09:00 AM", "available": True},
        {"time": "09:30 AM", "available": False},
        {"time": "10:00 AM", "available": True},
        {"time": "10:30 AM", "available": True},
        {"time": "11:00 AM", "available": False},
        {"time": "11:30 AM", "available": True},
        {"time": "02:00 PM", "available": True},
        {"time": "02:30 PM", "available": True},
        {"time": "03:00 PM", "available": False},
        {"time": "03:30 PM", "available": True},
    ]
    return jsonify(slots)

# Appointments
@app.route("/api/appointments")
def list_appointments():
    patient_id = request.args.get("patientId")
    doctor_id = request.args.get("doctorId")
    status = request.args.get("status")
    filtered = APPOINTMENTS
    if patient_id:
        filtered = [a for a in filtered if a["patientId"] == int(patient_id)]
    if doctor_id:
        filtered = [a for a in filtered if a["doctorId"] == int(doctor_id)]
    if status:
        filtered = [a for a in filtered if a["status"] == status]
    return jsonify(filtered)

@app.route("/api/appointments", methods=["POST"])
def create_appointment():
    data = request.get_json()
    patient = next((p for p in PATIENTS if p["id"] == data["patientId"]), {})
    doctor = next((d for d in DOCTORS if d["id"] == data["doctorId"]), {})
    new_appt = {
        "id": len(APPOINTMENTS) + 1,
        "patientId": data["patientId"],
        "patientName": patient.get("fullName", ""),
        "doctorId": data["doctorId"],
        "doctorName": doctor.get("fullName", ""),
        "date": data["date"],
        "time": data["time"],
        "type": data["type"],
        "status": "pending",
        "fee": doctor.get("fee", 600),
        "notes": data.get("notes", ""),
    }
    APPOINTMENTS.append(new_appt)
    return jsonify(new_appt), 201

@app.route("/api/appointments/<int:id>")
def get_appointment(id):
    appt = next((a for a in APPOINTMENTS if a["id"] == id), None)
    if not appt:
        return jsonify({"error": "Not found"}), 404
    return jsonify(appt)

@app.route("/api/appointments/<int:id>", methods=["PATCH"])
def update_appointment(id):
    data = request.get_json()
    appt = next((a for a in APPOINTMENTS if a["id"] == id), None)
    if not appt:
        return jsonify({"error": "Not found"}), 404
    appt.update({k: v for k, v in data.items() if v is not None})
    return jsonify(appt)

# Prescriptions
@app.route("/api/prescriptions")
def list_prescriptions():
    patient_id = request.args.get("patientId")
    doctor_id = request.args.get("doctorId")
    filtered = PRESCRIPTIONS
    if patient_id:
        filtered = [p for p in filtered if p["patientId"] == int(patient_id)]
    if doctor_id:
        filtered = [p for p in filtered if p["doctorId"] == int(doctor_id)]
    return jsonify(filtered)

@app.route("/api/prescriptions", methods=["POST"])
def create_prescription():
    data = request.get_json()
    patient = next((p for p in PATIENTS if p["id"] == data["patientId"]), {})
    doctor = next((d for d in DOCTORS if d["id"] == data["doctorId"]), {})

    # Basic validation
    validations = []
    allergies = patient.get("allergies", [])
    for med in data.get("medicines", []):
        if any(a.lower() in med["name"].lower() for a in allergies):
            validations.append({"type": "error", "message": f"{med['name']} — patient has known allergy conflict"})
        else:
            validations.append({"type": "success", "message": f"{med['name']} — no allergy conflict detected"})

    new_rx = {
        "id": len(PRESCRIPTIONS) + 1,
        "patientId": data["patientId"],
        "patientName": patient.get("fullName", ""),
        "doctorId": data["doctorId"],
        "doctorName": doctor.get("fullName", ""),
        "doctorLicense": "MCI-KA-12345",
        "hospital": doctor.get("hospital", ""),
        "diagnosis": data["diagnosis"],
        "medicines": data.get("medicines", []),
        "labTests": data.get("labTests", []),
        "followupDate": data.get("followupDate"),
        "validations": validations,
        "createdAt": datetime.utcnow().isoformat() + "Z"
    }
    PRESCRIPTIONS.append(new_rx)
    return jsonify(new_rx), 201

@app.route("/api/prescriptions/<int:id>")
def get_prescription(id):
    rx = next((p for p in PRESCRIPTIONS if p["id"] == id), None)
    if not rx:
        return jsonify({"error": "Not found"}), 404
    return jsonify(rx)

# Lab
@app.route("/api/lab/requests")
def list_lab_requests():
    status = request.args.get("status")
    filtered = LAB_REQUESTS if not status else [r for r in LAB_REQUESTS if r["status"] == status]
    return jsonify(filtered)

@app.route("/api/lab/requests", methods=["POST"])
def create_lab_request():
    data = request.get_json()
    patient = next((p for p in PATIENTS if p["id"] == data["patientId"]), {})
    doctor = next((d for d in DOCTORS if d["id"] == data["doctorId"]), {})
    new_req = {
        "id": len(LAB_REQUESTS) + 1,
        "patientId": data["patientId"],
        "patientName": patient.get("fullName", ""),
        "doctorId": data["doctorId"],
        "doctorName": doctor.get("fullName", ""),
        "testType": data["testType"],
        "priority": data["priority"],
        "status": "pending",
        "reportUrl": None,
        "aiAnalysis": None,
        "createdAt": datetime.utcnow().isoformat() + "Z"
    }
    LAB_REQUESTS.append(new_req)
    return jsonify(new_req), 201

@app.route("/api/lab/requests/<int:id>/report", methods=["POST"])
def upload_lab_report(id):
    data = request.get_json()
    req = next((r for r in LAB_REQUESTS if r["id"] == id), None)
    if not req:
        return jsonify({"error": "Not found"}), 404
    req["reportUrl"] = data.get("reportUrl")
    req["status"] = "ready"
    req["aiAnalysis"] = {
        "primaryCondition": "Pneumonia",
        "confidence": 0.87,
        "secondaryConditions": [{"condition": "Normal", "confidence": 0.09}],
        "disclaimer": "AI analysis is assistive only. Clinical judgment required."
    }
    return jsonify(req)

# Payments
@app.route("/api/payments")
def list_payments():
    patient_id = request.args.get("patientId")
    filtered = PAYMENTS if not patient_id else [p for p in PAYMENTS if p["patientId"] == int(patient_id)]
    return jsonify(filtered)

@app.route("/api/payments", methods=["POST"])
def create_payment():
    data = request.get_json()
    patient = next((p for p in PATIENTS if p["id"] == data["patientId"]), {})
    new_payment = {
        "id": len(PAYMENTS) + 1,
        "patientId": data["patientId"],
        "patientName": patient.get("fullName", ""),
        "appointmentId": data.get("appointmentId"),
        "amount": data["amount"],
        "category": data["category"],
        "method": data["method"],
        "status": "completed",
        "invoiceId": f"INV-2026-{len(PAYMENTS)+1:03d}",
        "createdAt": datetime.utcnow().isoformat() + "Z"
    }
    PAYMENTS.append(new_payment)
    return jsonify(new_payment), 201

# Notifications
@app.route("/api/notifications")
def list_notifications():
    user_id = request.args.get("userId")
    filtered = NOTIFICATIONS if not user_id else [n for n in NOTIFICATIONS if n["userId"] == int(user_id)]
    return jsonify(filtered)

@app.route("/api/notifications/<int:id>/read", methods=["POST"])
def mark_notification_read(id):
    notif = next((n for n in NOTIFICATIONS if n["id"] == id), None)
    if notif:
        notif["read"] = True
    return jsonify({"message": "Marked as read"})

# Vaccinations
@app.route("/api/vaccinations", methods=["GET"])
def list_vaccinations():
    patient_id = request.args.get("patientId")
    filtered = VACCINATIONS if not patient_id else [v for v in VACCINATIONS if v["patientId"] == int(patient_id)]
    return jsonify(filtered)

@app.route("/api/vaccinations", methods=["POST"])
def create_vaccination():
    data = request.get_json()
    patient = next((p for p in PATIENTS if p["id"] == data["patientId"]), None)
    new_vax = {
        "id": len(VACCINATIONS) + 1,
        "patientId": data["patientId"],
        "patientName": data.get("patientName", patient.get("fullName") if patient else ""),
        "vaccineName": data["vaccineName"],
        "company": data.get("company", ""),
        "batchNo": data["batchNo"],
        "administeredBy": data["administeredBy"],
        "type": data["type"], # Oral or Injection
        "date": data.get("date", datetime.utcnow().strftime("%Y-%m-%d")),
        "createdAt": datetime.utcnow().isoformat() + "Z"
    }
    VACCINATIONS.append(new_vax)
    if patient:
        patient["vaccinationStatus"] = f"Administered {data['vaccineName']}"
    return jsonify(new_vax), 201

# Admin
@app.route("/api/admin/stats")
def get_admin_stats():
    return jsonify({
        "totalDoctors": 248,
        "activeDoctors": 231,
        "totalPatients": 12847,
        "totalFacilities": 34,
        "criticalAlerts": 7,
        "appointmentsToday": 12,
        "prescriptionsToday": 8,
        "pendingLabReports": 3,
    })

@app.route("/api/admin/locations")
def get_location_stats():
    return jsonify(LOCATIONS)

@app.route("/api/admin/disease-data")
def get_disease_data():
    location = request.args.get("location", "Sector 12 — Koramangala")
    disease = request.args.get("disease", "dengue")
    return jsonify({
        "location": location,
        "disease": disease,
        "activeCases": 412,
        "severity": "critical",
        "weeklyTrend": 24.0,
        "breakdown": [
            {"disease": "Dengue", "count": 412},
            {"disease": "Malaria", "count": 34},
            {"disease": "Cholera", "count": 5},
            {"disease": "Typhoid", "count": 12},
        ]
    })

@app.route("/api/admin/spread-prediction")
def get_spread_prediction():
    return jsonify({
        "disease": "Dengue",
        "location": "Koramangala",
        "confidence": 0.91,
        "historicalData": [
            {"day": "Apr 1", "cases": 180}, {"day": "Apr 2", "cases": 195},
            {"day": "Apr 3", "cases": 220}, {"day": "Apr 4", "cases": 260},
            {"day": "Apr 5", "cases": 300}, {"day": "Apr 6", "cases": 355},
            {"day": "Apr 7", "cases": 412},
        ],
        "predictedData": [
            {"day": "Apr 8", "cases": 445}, {"day": "Apr 9", "cases": 470},
            {"day": "Apr 10", "cases": 510}, {"day": "Apr 11", "cases": 490},
            {"day": "Apr 12", "cases": 530}, {"day": "Apr 13", "cases": 555},
            {"day": "Apr 14", "cases": 520}, {"day": "Apr 15", "cases": 500},
            {"day": "Apr 16", "cases": 540}, {"day": "Apr 17", "cases": 570},
            {"day": "Apr 18", "cases": 520}, {"day": "Apr 19", "cases": 490},
            {"day": "Apr 20", "cases": 460}, {"day": "Apr 21", "cases": 430},
        ],
        "riskAlert": "Koramangala sector predicted to exceed 500 cases by Day 10. Recommend deploying 2 additional medical camps."
    })

# Chatbot
@app.route("/api/chatbot/query", methods=["POST"])
def chatbot_query():
    data = request.get_json()
    patient_id = data.get("patientId", 1) # Default to demo patient
    message = data.get("message", "")
    intent = detect_intent(message)
    reply, suggestions = chatbot_reply(message, intent, patient_id)
    return jsonify({"reply": reply, "intent": intent, "suggestions": suggestions})

# Dashboard summaries
@app.route("/api/dashboard/patient")
def get_patient_dashboard_summary():
    patient_id = int(request.args.get("patientId", 1))
    upcoming = [a for a in APPOINTMENTS if a["patientId"] == patient_id and a["status"] in ("pending", "confirmed")]
    pending_followups = [f for f in FOLLOWUPS if f["patientId"] == patient_id and f["status"] == "pending"]
    recent_rx = [p for p in PRESCRIPTIONS if p["patientId"] == patient_id][:3]
    unread = len([n for n in NOTIFICATIONS if n["userId"] == patient_id and not n["read"]])
    patient = next((p for p in PATIENTS if p["id"] == patient_id), {})
    patient_vaccinations = [v for v in VACCINATIONS if v["patientId"] == patient_id]
    return jsonify({
        "patientId": patient_id,
        "upcomingAppointments": upcoming,
        "pendingFollowups": pending_followups,
        "recentPrescriptions": recent_rx,
        "unreadNotifications": unread,
        "vaccinationStatus": patient.get("vaccinationStatus", ""),
        "vaccinations": patient_vaccinations,
    })

@app.route("/api/dashboard/doctor")
def get_doctor_dashboard_summary():
    doctor_id = int(request.args.get("doctorId", 1))
    today = [a for a in APPOINTMENTS if a["doctorId"] == doctor_id and a["status"] == "confirmed"]
    pending_requests = [a for a in APPOINTMENTS if a["doctorId"] == doctor_id and a["status"] == "pending"]
    followup_queue = [f for f in FOLLOWUPS if f["doctorId"] == doctor_id and f["status"] == "pending"]
    return jsonify({
        "doctorId": doctor_id,
        "todayAppointments": today,
        "pendingRequests": pending_requests,
        "pendingLabReports": 3,
        "prescriptionsToday": 8,
        "followupQueue": followup_queue,
    })


if __name__ == "__main__":
    print(f"MediCore HMS Python API starting on port {PORT}")
    app.run(host="0.0.0.0", port=PORT, debug=False)
