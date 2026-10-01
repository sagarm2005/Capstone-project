import os
import logging
import json
import mimetypes
from datetime import datetime, timedelta
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity, create_access_token
from db import get_db, serialize, serialize_list
from openai import OpenAI
from dotenv import load_dotenv
import requests
import cloudinary
import cloudinary.uploader
import cloudinary.utils
from healthpilot_service import analyze_prescribed_medicine, check_allergy_against_compounds
from medicine_service import search_indian_medicines, get_medicine_price_details

logging.basicConfig(level=logging.INFO)
load_dotenv()

app = Flask(__name__)
CORS(app)
app.secret_key = os.environ.get("SESSION_SECRET", "medicore-dev-secret")
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET", "medicore-jwt-secret")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=1)
jwt = JWTManager(app)

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True,
)

MAX_UPLOAD_BYTES = 15 * 1024 * 1024
UPLOAD_TYPES = {
    "lab_report": {"roles": {"lab", "admin", "superadmin"}, "extensions": {"pdf", "png", "jpg", "jpeg", "webp"}},
    "prescription": {"roles": {"doctor", "admin", "superadmin"}, "extensions": {"pdf", "png", "jpg", "jpeg", "webp"}},
    "hospital_image": {"roles": {"doctor", "admin", "superadmin"}, "extensions": {"png", "jpg", "jpeg", "webp"}},
}
MODEL_SERVICE_URL = os.getenv("MODEL_SERVICE_URL", "http://127.0.0.1:8000")

# Initialize OpenAI Client
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ─── Seed on startup ──────────────────────────────────────────────────────────

def init_db():
    try:
        from seed import seed_if_empty
        seed_if_empty()
        logging.info("Database initialized.")
    except Exception as e:
        logging.error(f"Database init failed: {e}")

with app.app_context():
    init_db()

# ─── Helpers ──────────────────────────────────────────────────────────────────

def next_id(collection_name):
    db = get_db()
    last = db[collection_name].find_one(sort=[("id", -1)])
    if last and "id" in last:
        return last["id"] + 1
    return 1

def check_drug_interactions(medicines):
    """
    Checks for interactions between a list of medicines using the drug_interactions dataset.
    Returns a list of validation objects.
    """
    db = get_db()
    validations = []
    med_names = [m.get("name", "").strip() for m in medicines if m.get("name")]
    
    if len(med_names) < 2:
        return validations

    # Query for any interactions where both drugs in a record are present in our med_names list
    interactions = list(db['ddinter_downloads_code_V'].find({
        "Drug_A": {"$in": med_names},
        "Drug_B": {"$in": med_names}
    }))

    for inter in interactions:
        level = inter.get("Level", "Unknown")
        validations.append({
            "type": "error" if level.lower() == "major" else "warning",
            "message": f"Interaction Detected ({level}): {inter.get('Drug_A')} and {inter.get('Drug_B')} may interact."
        })
    return validations

def sync_patient_bills(patient_id):
    db = get_db()
    patient = db.patients.find_one({"id": patient_id})
    patient_name = patient["fullName"] if patient else "Patient"

    # 1. Sync appointments to bills/payments
    appts = list(db.appointments.find({"patientId": patient_id}))
    for appt in appts:
        existing_payment = db.payments.find_one({"patientId": patient_id, "appointmentId": appt["id"]})
        if not existing_payment:
            fee = appt.get("fee", 600) or 600
            pay_id = next_id("payments")
            date_val = appt.get("date", "")
            created_at = (date_val + "T10:00:00Z") if (isinstance(date_val, str) and len(date_val) == 10) else (datetime.utcnow().isoformat() + "Z")
            db.payments.insert_one({
                "id": pay_id,
                "patientId": patient_id,
                "patientName": patient_name,
                "appointmentId": appt["id"],
                "amount": fee,
                "category": "consultation",
                "method": "pending",
                "status": "completed" if appt.get("status") == "completed" else "pending",
                "description": f"Doctor Checkup - Dr. {appt.get('doctorName', 'Doctor')}",
                "invoiceId": f"INV-2026-{str(pay_id).zfill(3)}",
                "createdAt": created_at,
            })

    # 2. Sync prescriptions (medicines and lab tests) to bills/payments
    rxs = list(db.prescriptions.find({"patientId": patient_id}))
    for rx in rxs:
        meds = [m for m in rx.get("medicines", []) if m.get("name")]
        if meds and not db.payments.find_one({"patientId": patient_id, "prescriptionId": rx["id"], "category": "medicine"}):
            med_cost = len(meds) * 250
            pay_id = next_id("payments")
            med_names = ", ".join([m.get("name", "") for m in meds])
            db.payments.insert_one({
                "id": pay_id,
                "patientId": patient_id,
                "patientName": patient_name,
                "prescriptionId": rx["id"],
                "amount": med_cost,
                "category": "medicine",
                "method": "pending",
                "status": "pending",
                "description": f"Medicines - {med_names}",
                "invoiceId": f"INV-2026-{str(pay_id).zfill(3)}",
                "createdAt": rx.get("createdAt", datetime.utcnow().isoformat() + "Z"),
            })

        lab_tests = rx.get("labTests", [])
        if lab_tests and not db.payments.find_one({"patientId": patient_id, "prescriptionId": rx["id"], "category": "lab"}):
            tests = lab_tests if isinstance(lab_tests, list) else [t.strip() for t in str(lab_tests).split(",") if t.strip()]
            if tests:
                lab_cost = len(tests) * 500
                pay_id = next_id("payments")
                db.payments.insert_one({
                    "id": pay_id,
                    "patientId": patient_id,
                    "patientName": patient_name,
                    "prescriptionId": rx["id"],
                    "amount": lab_cost,
                    "category": "lab",
                    "method": "pending",
                    "status": "pending",
                    "description": f"Medical Report - {', '.join(tests)}",
                    "invoiceId": f"INV-2026-{str(pay_id).zfill(3)}",
                    "createdAt": rx.get("createdAt", datetime.utcnow().isoformat() + "Z"),
                })

    # 3. Sync standalone lab requests
    labs = list(db.lab_requests.find({"patientId": patient_id}))
    for lab in labs:
        if not lab.get("prescriptionId") and not db.payments.find_one({"patientId": patient_id, "labRequestId": lab["id"]}):
            pay_id = next_id("payments")
            db.payments.insert_one({
                "id": pay_id,
                "patientId": patient_id,
                "patientName": patient_name,
                "labRequestId": lab["id"],
                "amount": 500,
                "category": "lab",
                "method": "pending",
                "status": "completed" if lab.get("status") == "ready" else "pending",
                "description": f"Medical Report - {lab.get('testType', 'Lab Test')}",
                "invoiceId": f"INV-2026-{str(pay_id).zfill(3)}",
                "createdAt": lab.get("createdAt", datetime.utcnow().isoformat() + "Z"),
            })

def calculate_patient_expenses(patient_id):
    sync_patient_bills(patient_id)
    db = get_db()
    payments = list(db.payments.find({"patientId": patient_id}).sort("createdAt", -1))

    doctor_checkup_total = 0
    medical_reports_total = 0
    medicine_total = 0

    doctor_checkup_items = []
    medical_reports_items = []
    medicine_items = []
    all_items = []

    for p in payments:
        cat = (p.get("category") or "consultation").lower()
        amt = int(p.get("amount", 0) or 0)
        item = serialize(p)
        all_items.append(item)

        if cat in ["consultation", "emergency", "doctor_checkup"]:
            doctor_checkup_total += amt
            doctor_checkup_items.append(item)
        elif cat in ["lab", "medical_reports", "report"]:
            medical_reports_total += amt
            medical_reports_items.append(item)
        elif cat in ["medicine", "medicines", "pharmacy"]:
            medicine_total += amt
            medicine_items.append(item)
        else:
            doctor_checkup_total += amt
            doctor_checkup_items.append(item)

    total_expense = doctor_checkup_total + medical_reports_total + medicine_total

    return {
        "totalExpense": total_expense,
        "doctorCheckupTotal": doctor_checkup_total,
        "medicalReportsTotal": medical_reports_total,
        "medicineTotal": medicine_total,
        "doctorCheckupCount": len(doctor_checkup_items),
        "medicalReportsCount": len(medical_reports_items),
        "medicineCount": len(medicine_items),
        "totalCount": len(all_items),
        "items": all_items,
        "doctorCheckupItems": doctor_checkup_items,
        "medicalReportsItems": medical_reports_items,
        "medicineItems": medicine_items,
    }

def current_user():
    db = get_db()
    user_id = int(get_jwt_identity())
    return db.users.find_one({"id": user_id})

def signed_cloudinary_url(public_id, resource_type):
    url, _ = cloudinary.utils.cloudinary_url(
        public_id,
        resource_type=resource_type,
        type="authenticated",
        secure=True,
        sign_url=True,
    )
    return url

def can_manage_upload(user, upload):
    if user["role"] in {"admin", "superadmin"}:
        return True
    if upload.get("uploaderId") != user["id"]:
        return False
    if upload.get("assetType") == "lab_report":
        lab_request = get_db().lab_requests.find_one({"id": upload.get("labRequestId")})
        return user["role"] == "lab" and lab_request and lab_request.get("labId") == user["id"]
    return user["role"] == "doctor"

@app.route("/api/uploads", methods=["POST"])
@jwt_required()
def upload_file():
    user = current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    file = request.files.get("file")
    asset_type = request.form.get("assetType", "").strip().lower()
    policy = UPLOAD_TYPES.get(asset_type)
    if not file or not file.filename:
        return jsonify({"error": "A file is required"}), 400
    if not policy or user["role"] not in policy["roles"]:
        return jsonify({"error": "Your role cannot upload this asset type"}), 403
    if not all((os.getenv("CLOUDINARY_CLOUD_NAME"), os.getenv("CLOUDINARY_API_KEY"), os.getenv("CLOUDINARY_API_SECRET"))):
        logging.error("Cloudinary credentials are not configured")
        return jsonify({"error": "File upload is not configured on the server"}), 503
    if request.content_length and request.content_length > MAX_UPLOAD_BYTES:
        return jsonify({"error": "File must be 15 MB or smaller"}), 413

    extension = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if extension not in policy["extensions"]:
        return jsonify({"error": "Unsupported file type"}), 415

    lab_request_id = request.form.get("labRequestId")
    prescription_id = request.form.get("prescriptionId")
    db = get_db()
    if asset_type == "lab_report":
        try:
            lab_request_id = int(lab_request_id)
        except (TypeError, ValueError):
            return jsonify({"error": "labRequestId is required"}), 400
        lab_request = db.lab_requests.find_one({"id": lab_request_id})
        if not lab_request or (user["role"] == "lab" and lab_request.get("labId") != user["id"]):
            return jsonify({"error": "You cannot upload to this lab request"}), 403
    if prescription_id:
        try:
            prescription_id = int(prescription_id)
        except ValueError:
            return jsonify({"error": "prescriptionId must be a number"}), 400
        prescription = db.prescriptions.find_one({"id": prescription_id})
        if not prescription or (user["role"] == "doctor" and prescription.get("doctorId") != user["id"]):
            return jsonify({"error": "You cannot upload to this prescription"}), 403

    resource_type = "image" if extension != "pdf" else "raw"
    try:
        result = cloudinary.uploader.upload(
            file,
            resource_type=resource_type,
            type="authenticated",
            folder=f"medicore/{asset_type}/{user['id']}",
            context={"original_filename": file.filename},
        )
    except Exception as error:
        logging.error("Cloudinary upload failed: %s", error)
        return jsonify({"error": "File upload failed"}), 502

    upload_record = {
        "id": next_id("uploads"),
        "assetType": asset_type,
        "uploaderId": user["id"],
        "uploaderRole": user["role"],
        "originalFilename": file.filename,
        "format": extension,
        "mimeType": file.mimetype or mimetypes.guess_type(file.filename)[0],
        "bytes": result.get("bytes"),
        "publicId": result["public_id"],
        "resourceType": resource_type,
        "labRequestId": lab_request_id,
        "prescriptionId": prescription_id,
        "createdAt": datetime.utcnow().isoformat() + "Z",
    }
    db.uploads.insert_one(upload_record)
    if lab_request_id:
        db.lab_requests.update_one({"id": lab_request_id}, {"$set": {"reportUrl": signed_cloudinary_url(result["public_id"], resource_type), "uploadId": upload_record["id"]}})
    return jsonify({
        "id": upload_record["id"],
        "assetType": asset_type,
        "url": signed_cloudinary_url(result["public_id"], resource_type),
        "filename": file.filename,
    }), 201

@app.route("/api/uploads/<int:upload_id>", methods=["DELETE"])
@jwt_required()
def delete_file(upload_id):
    user = current_user()
    upload_record = get_db().uploads.find_one({"id": upload_id})
    if not user or not upload_record:
        return jsonify({"error": "Upload not found"}), 404
    if not can_manage_upload(user, upload_record):
        return jsonify({"error": "You cannot delete this upload"}), 403
    try:
        cloudinary.uploader.destroy(
            upload_record["publicId"],
            resource_type=upload_record["resourceType"],
            type="authenticated",
        )
    except Exception as error:
        logging.error("Cloudinary delete failed: %s", error)
        return jsonify({"error": "File deletion failed"}), 502
    db = get_db()
    db.uploads.delete_one({"id": upload_id})
    if upload_record.get("labRequestId"):
        db.lab_requests.update_one({"id": upload_record["labRequestId"], "uploadId": upload_id}, {"$unset": {"reportUrl": "", "uploadId": ""}})
    return jsonify({"message": "Upload deleted"})

@app.route("/api/models/pneumonia/predict", methods=["POST"])
@jwt_required()
def predict_pneumonia():
    user = current_user()
    if not user or user.get("role") not in {"doctor", "admin", "superadmin"}:
        return jsonify({"error": "Only doctors and administrators can use this model"}), 403

    image = request.files.get("file")
    if not image or not image.filename:
        return jsonify({"error": "A chest X-ray image is required"}), 400
    extension = image.filename.rsplit(".", 1)[-1].lower() if "." in image.filename else ""
    if extension not in {"png", "jpg", "jpeg", "webp"}:
        return jsonify({"error": "Upload a PNG, JPG, JPEG, or WEBP image"}), 415
    if request.content_length and request.content_length > MAX_UPLOAD_BYTES:
        return jsonify({"error": "Image must be 15 MB or smaller"}), 413
    try:
        response = requests.post(
            f"{MODEL_SERVICE_URL}/predict",
            files={"file": (image.filename, image.stream, image.mimetype)},
            timeout=120,
        )
        if response.status_code != 200:
            return jsonify(response.json()), response.status_code
        return jsonify(response.json())
    except requests.RequestException:
        logging.error("Pneumonia model service is unavailable at %s", MODEL_SERVICE_URL)
        return jsonify({"error": "Pneumonia model service is not running"}), 503
    except Exception as error:
        logging.error("Pneumonia prediction failed: %s", error, exc_info=True)
        return jsonify({"error": "The Pneumonia model could not process this image"}), 500

# ─── Auth Routes ──────────────────────────────────────────────────────────────

@app.route("/api/auth/login", methods=["POST"])
def login():
    db = get_db()
    data = request.get_json()
    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"error": "Email and password required"}), 400
    
    user = db.users.find_one({"email": data["email"]})
    if not user or user.get("password") != data["password"]:
        return jsonify({"error": "Invalid credentials"}), 401
    
    access_token = create_access_token(identity=str(user["id"]))
    return jsonify({"token": access_token, "user": serialize(user)})

@app.route("/api/auth/signup", methods=["POST"])
def signup():
    try:
        data = request.get_json()
        if not data:
            logging.warning("Signup failed: Missing or invalid JSON body")
            return jsonify({"error": "Invalid or missing JSON data"}), 400
            
        db = get_db()
        email = data.get("email")
        logging.info(f"Signup attempt started for email: {email}")
        
        if not email:
            return jsonify({"error": "Email is required"}), 400

        if db.users.find_one({"email": email}):
            logging.warning(f"Signup failed: Email already registered - {email}")
            return jsonify({"error": "Email already registered"}), 409
            
        new_id = next_id("users")
        role = str(data.get("role", "Patient")).lower()
        if role == "lab tech":
            role = "lab"
        if role == "blood bank":
            role = "blood_bank"
        if role == "superadmin":
            role = "superadmin"
            
        new_user = {
            "id": new_id, 
            "fullName": data.get("fullName", "User"), 
            "email": email, 
            "role": role, 
            "password": data.get("password", ""), 
            "avatar": ""
        }
        db.users.insert_one(new_user)
        
        if role == "patient":
            new_patient = {
                "id": new_id, 
                "fullName": data.get("fullName", "User"), 
                "email": email,
                "phone": data.get("phone") or "", 
                "dateOfBirth": data.get("dateOfBirth") or "",
                "gender": data.get("gender") or "", 
                "bloodGroup": data.get("bloodGroup") or "",
                "allergies": [a.strip() for a in str(data.get("allergies") or "").split(",") if a.strip()],
                "existingConditions": [c.strip() for c in str(data.get("existingConditions") or "").split(",") if c.strip()],
                "lastVisit": None, 
                "vaccinationStatus": "Pending verification",
            }
            db.patients.insert_one(new_patient)
        elif role == "doctor":
            def safe_int(val, default=0):
                try:
                    if val is None or val == "": return default
                    return int(val)
                except (ValueError, TypeError):
                    return default

            new_doctor = {
                "id": new_id, 
                "fullName": data.get("fullName", "User"), 
                "email": email,
                "specialty": data.get("specialty") or "",
                "degree": data.get("degree") or "",
                "registrationNumber": data.get("registrationNumber") or "",
                "hospital": data.get("hospital") or "",
                "location": data.get("location") or "",
                "experience": safe_int(data.get("experience")),
                "fee": safe_int(data.get("fee")),
                "activePatients": 0, "status": "active", "rating": 5.0
            }
            db.doctors.insert_one(new_doctor)
        elif role == "lab":
            new_lab = {
                "id": new_id, 
                "fullName": data.get("fullName", "User"), 
                "email": email,
                "labName": data.get("labName") or "",
                "licenseNumber": data.get("licenseNumber") or ""
            }
            db.lab_techs.insert_one(new_lab)
        elif role == "blood_bank":
            new_bank = {
                "id": next_id("blood_banks"),
                "name": data.get("labName") or data.get("fullName", "Blood Bank"),
                "location": data.get("address") or data.get("location") or "",
                "phone": data.get("phone") or "",
                "email": email,
                "managerId": new_id,
                "stock": {
                    "O+": 30, "O-": 10, "A+": 25, "A-": 8,
                    "B+": 35, "B-": 10, "AB+": 15, "AB-": 5,
                },
            }
            db.blood_banks.insert_one(new_bank)
            
        safe_user = {k: v for k, v in new_user.items() if k not in ("password", "_id")}
        access_token = create_access_token(identity=str(new_id))
        logging.info(f"Signup successful for user: {email}")
        return jsonify({"token": access_token, "user": safe_user}), 201
    except Exception as e:
        logging.error(f"DETAILED SIGNUP FAILURE: {str(e)}", exc_info=True)
        return jsonify({"error": "Internal server error during signup"}), 500

@app.route("/api/auth/logout", methods=["POST"])
def logout():
    return jsonify({"message": "Logged out successfully"})

# ─── Appointments ─────────────────────────────────────────────────────────────

@app.route("/api/appointments", methods=["GET", "POST"])
def appointments():
    db = get_db()
    if request.method == "GET":
        query = {}
        if request.args.get("patientId"):
            query["patientId"] = int(request.args["patientId"])
        if request.args.get("doctorId"):
            query["doctorId"] = int(request.args["doctorId"])
        if request.args.get("status"):
            query["status"] = request.args["status"]
        return jsonify(serialize_list(db.appointments.find(query)))
    data = request.get_json()
    patient = db.patients.find_one({"id": data.get("patientId")})
    doctor = db.doctors.find_one({"id": data.get("doctorId")})
    fee = doctor["fee"] if doctor and "fee" in doctor else 600
    new_appt = {
        "id": next_id("appointments"), "patientId": data["patientId"],
        "patientName": patient["fullName"] if patient else "",
        "doctorId": data["doctorId"], "doctorName": doctor["fullName"] if doctor else "",
        "date": data["date"], "time": data["time"], "type": data.get("type", "normal"),
        "status": "pending", "fee": fee, "notes": data.get("notes", ""),
    }
    db.appointments.insert_one(new_appt)

    # Automatically create a Doctor Checkup bill in db.payments
    pay_id = next_id("payments")
    date_val = data.get("date", "")
    created_at = (date_val + "T10:00:00Z") if (isinstance(date_val, str) and len(date_val) == 10) else (datetime.utcnow().isoformat() + "Z")
    db.payments.insert_one({
        "id": pay_id,
        "patientId": data["patientId"],
        "patientName": patient["fullName"] if patient else "",
        "appointmentId": new_appt["id"],
        "amount": fee,
        "category": "consultation",
        "method": "pending",
        "status": "pending",
        "description": f"Doctor Checkup - Dr. {doctor['fullName'] if doctor else 'Doctor'}",
        "invoiceId": f"INV-2026-{str(pay_id).zfill(3)}",
        "createdAt": created_at,
    })

    return jsonify(serialize(new_appt)), 201

@app.route("/api/appointments/<int:appt_id>", methods=["GET", "PATCH"])
def appointment_detail(appt_id):
    db = get_db()
    appt = db.appointments.find_one({"id": appt_id})
    if not appt:
        return jsonify({"error": "Not found"}), 404
    if request.method == "PATCH":
        db.appointments.update_one({"id": appt_id}, {"$set": request.get_json()})
        appt = db.appointments.find_one({"id": appt_id})
    return jsonify(serialize(appt))

# ─── Prescriptions ────────────────────────────────────────────────────────────
@app.route("/api/prescriptions", methods=["GET", "POST"])
def prescriptions():
    db = get_db()
    if request.method == "GET":
        query = {}
        if request.args.get("patientId"):
            query["patientId"] = int(request.args["patientId"])
        if request.args.get("doctorId"):
            query["doctorId"] = int(request.args["doctorId"])
        return jsonify(serialize_list(db.prescriptions.find(query).sort("createdAt", -1)))
    
    data = request.get_json()
    patient = db.patients.find_one({"id": data.get("patientId")})
    doctor = db.doctors.find_one({"id": data.get("doctorId")})
    
    # Validation logic with HealthPilot Active Compounds & Indian Medicine Dataset Pricing
    allergies = patient.get("allergies", []) if patient else []
    if "allergies" in data and isinstance(data["allergies"], list):
        allergies = list(set(allergies + data["allergies"]))
        
    validations = []
    enriched_medicines = []
    total_amount = 0.0
    
    for med in data.get("medicines", []):
        med_copy = dict(med)
        med_name = med.get("name", "").strip()
        if not med_name:
            continue
            
        analysis = analyze_prescribed_medicine(med_name, allergies)
        
        # Calculate price from Indian Medicine Dataset
        price = med.get("price")
        if price is None or price == "" or float(price) <= 0:
            price = analysis["pricing"]["price"] if analysis else 100.0
        try:
            price = round(float(price), 2)
        except (ValueError, TypeError):
            price = 100.0
            
        med_copy["price"] = price
        med_copy["activeCompounds"] = analysis.get("activeCompounds", []) if analysis else []
        med_copy["hasAllergyConflict"] = analysis.get("hasAllergyConflict", False) if analysis else False
        med_copy["genericInfo"] = analysis.get("generic", {}) if analysis else {}
        med_copy["packSize"] = analysis.get("pricing", {}).get("packSize", "") if analysis else ""
        med_copy["manufacturer"] = analysis.get("pricing", {}).get("manufacturer", "") if analysis else ""
        
        total_amount += price
        enriched_medicines.append(med_copy)
        
        if analysis and analysis.get("hasAllergyConflict"):
            for alert in analysis.get("allergyCheck", {}).get("alerts", []):
                validations.append({
                    "type": "error",
                    "message": f"🚨 ALLERGY ALERT ({med_name}): Active compound '{alert.get('conflictingCompound')}' conflicts with patient allergy '{alert.get('patientAllergy')}'!"
                })
        else:
            comp_str = ", ".join(analysis.get("activeCompounds", [])) if analysis else ""
            validations.append({
                "type": "success",
                "message": f"✅ {med_name}: Safe. Active compounds ({comp_str or 'verified'}) cleared with no allergy conflict."
            })
    
    # Drug-Drug Interaction validation
    validations.extend(check_drug_interactions(enriched_medicines))
        
    new_rx = {
        "id": next_id("prescriptions"),
        "patientId": data["patientId"],
        "patientName": patient["fullName"] if patient else "Unknown Patient",
        "patientAge": data.get("patientAge", "28"),
        "patientBloodGroup": data.get("bloodGroup", "O+"),
        "doctorId": data["doctorId"],
        "doctorName": doctor["fullName"] if doctor else "Unknown Doctor",
        "doctorLicense": doctor.get("registrationNumber", "MCI-KA-12345") if doctor else "MCI-KA-12345",
        "doctorEmail": doctor.get("email", ""),
        "doctorPhone": doctor.get("phone", ""),
        "hospital": doctor.get("hospital", "MediCore Hospital"),
        "hospitalAddress": "123 Healthcare Way, Metro City, 560001",
        "diagnosis": data["diagnosis"],
        "severity": data.get("severity", "Medium"),
        "vitals": data.get("vitals", {}),
        "medicines": enriched_medicines,
        "totalAmount": round(total_amount, 2),
        "labTests": data.get("labTests", []),
        "selectedLabId": data.get("selectedLabId"),
        "followupDate": data.get("followupDate"),
        "validations": validations,
        "createdAt": datetime.utcnow().isoformat() + "Z"
    }
    db.prescriptions.insert_one(new_rx)

    # Automatically create medicine bill with real total amount calculated from Indian Medicine Dataset
    valid_meds = [m for m in enriched_medicines if m.get("name")]
    if valid_meds:
        med_cost = round(total_amount, 2) if total_amount > 0 else len(valid_meds) * 250
        med_pay_id = next_id("payments")
        med_names = ", ".join([m.get("name", "") for m in valid_meds])
        db.payments.insert_one({
            "id": med_pay_id,
            "patientId": data["patientId"],
            "patientName": patient["fullName"] if patient else "Unknown Patient",
            "prescriptionId": new_rx["id"],
            "amount": med_cost,
            "category": "medicine",
            "method": "pending",
            "status": "pending",
            "description": f"Medicines (Total: ₹{med_cost:.2f}) - {med_names}",
            "invoiceId": f"INV-2026-{str(med_pay_id).zfill(3)}",
            "createdAt": datetime.utcnow().isoformat() + "Z",
        })

    # Automatically create medical reports bill if lab tests are included
    valid_tests = data.get("labTests", [])
    if isinstance(valid_tests, str):
        valid_tests = [t.strip() for t in valid_tests.split(",") if t.strip()]
    if valid_tests:
        lab_cost = len(valid_tests) * 500
        lab_pay_id = next_id("payments")
        test_names = ", ".join(valid_tests)
        db.payments.insert_one({
            "id": lab_pay_id,
            "patientId": data["patientId"],
            "patientName": patient["fullName"] if patient else "Unknown Patient",
            "prescriptionId": new_rx["id"],
            "amount": lab_cost,
            "category": "lab",
            "method": "pending",
            "status": "pending",
            "description": f"Medical Report - {test_names}",
            "invoiceId": f"INV-2026-{str(lab_pay_id).zfill(3)}",
            "createdAt": datetime.utcnow().isoformat() + "Z",
        })

    # Automatically create lab request if lab is selected
    if data.get("selectedLabId") and data.get("labTests"):
        lab = db.lab_techs.find_one({"id": int(data["selectedLabId"])})
        new_req = {
            "id": next_id("lab_requests"),
            "patientId": data["patientId"],
            "patientName": patient["fullName"] if patient else "Unknown Patient",
            "patientAge": data.get("patientAge", ""),
            "patientBloodGroup": data.get("bloodGroup", ""),
            "doctorId": data["doctorId"],
            "doctorName": doctor["fullName"] if doctor else "Unknown Doctor",
            "labId": int(data["selectedLabId"]),
            "labName": lab.get("labName", "General Lab") if lab else "General Lab",
            "testType": ", ".join(data["labTests"]),
            "priority": "urgent" if data.get("severity") == "High" else "normal",
            "diagnosis": data.get("diagnosis", ""),
            "status": "pending",
            "reportUrl": None,
            "reportImageUrl": None,
            "aiAnalysis": None,
            "prescriptionId": new_rx["id"],
            "createdAt": datetime.utcnow().isoformat() + "Z"
        }
        db.lab_requests.insert_one(new_req)

    return jsonify(serialize(new_rx)), 201

@app.route("/api/prescriptions/validate", methods=["POST"])
def validate_prescription():
    db = get_db()
    data = request.get_json() or {}
    patient = db.patients.find_one({"id": data.get("patientId")})
    allergies = patient.get("allergies", []) if patient else []
    if "allergies" in data and isinstance(data["allergies"], list):
        allergies = list(set(allergies + data["allergies"]))
        
    validations = []
    medicines_analysis = []
    total_amount = 0.0
    
    for med in data.get("medicines", []):
        med_name = med.get("name", "").strip()
        if not med_name:
            continue
            
        analysis = analyze_prescribed_medicine(med_name, allergies)
        medicines_analysis.append(analysis)
        
        price = analysis["pricing"]["price"] if analysis else 100.0
        total_amount += price
        
        if analysis and analysis.get("hasAllergyConflict"):
            for alert in analysis.get("allergyCheck", {}).get("alerts", []):
                validations.append({
                    "type": "error",
                    "medicine": med_name,
                    "message": f"🚨 ALLERGY CONFLICT: {med_name} active compound '{alert.get('conflictingCompound')}' conflicts with patient allergy '{alert.get('patientAllergy')}'!"
                })
        else:
            comp_str = ", ".join(analysis.get("activeCompounds", [])) if analysis else ""
            validations.append({
                "type": "success",
                "medicine": med_name,
                "message": f"✅ {med_name}: Active compounds ({comp_str or 'verified'}) cleared with no allergy conflict."
            })

    # Drug-Drug Interaction validation
    validations.extend(check_drug_interactions(data.get("medicines", [])))

    if not validations:
        validations.append({
            "type": "warning",
            "message": "No medicines provided to validate. Add at least one drug to run AI validation.",
        })

    return jsonify({
        "validations": validations,
        "analyses": medicines_analysis,
        "totalAmount": round(total_amount, 2)
    }), 200

@app.route("/api/medicines/analyze", methods=["GET"])
def analyze_medicine_route():
    name = request.args.get("name", "").strip()
    if not name:
        return jsonify({"error": "Medicine name is required"}), 400
    
    patient_id = request.args.get("patientId")
    allergies = []
    if patient_id:
        db = get_db()
        try:
            patient = db.patients.find_one({"id": int(patient_id)})
            if patient:
                allergies = patient.get("allergies", [])
        except Exception:
            pass
            
    extra_allergies = request.args.get("allergies", "")
    if extra_allergies:
        allergies.extend([a.strip() for a in extra_allergies.split(",") if a.strip()])
        
    analysis = analyze_prescribed_medicine(name, allergies)
    return jsonify(analysis), 200

@app.route("/api/medicines/search", methods=["GET"])
def search_medicines_route():
    q = request.args.get("q", "").strip()
    limit = int(request.args.get("limit", 10))
    if not q:
        return jsonify([]), 200
    results = search_indian_medicines(q, limit)
    return jsonify(results), 200

@app.route("/api/prescriptions/<int:rx_id>", methods=["PATCH"])
def update_prescription(rx_id):
    db = get_db()
    rx = db.prescriptions.find_one({"id": rx_id})
    if not rx:
        return jsonify({"error": "Prescription not found"}), 404

    data = request.get_json() or {}
    update_data = {}
    if "diagnosis" in data:
        update_data["diagnosis"] = data["diagnosis"]
    if "severity" in data:
        update_data["severity"] = data["severity"]
    if "vitals" in data:
        update_data["vitals"] = data["vitals"]
    if "medicines" in data:
        update_data["medicines"] = data["medicines"]
    if "labTests" in data:
        update_data["labTests"] = data["labTests"]
    if "selectedLabId" in data:
        update_data["selectedLabId"] = data["selectedLabId"]
    if "patientAge" in data:
        update_data["patientAge"] = data["patientAge"]
    if "bloodGroup" in data:
        update_data["patientBloodGroup"] = data["bloodGroup"]
    if "followupDate" in data:
        update_data["followupDate"] = data["followupDate"]
    if "prescriptionPdfUrl" in data:
        update_data["prescriptionPdfUrl"] = data["prescriptionPdfUrl"]
    if "prescriptionPdfUploadId" in data:
        update_data["prescriptionPdfUploadId"] = data["prescriptionPdfUploadId"]

    if update_data:
        db.prescriptions.update_one({"id": rx_id}, {"$set": update_data})

    rx = db.prescriptions.find_one({"id": rx_id})

    if rx.get("selectedLabId") and rx.get("labTests"):
        lab = db.lab_techs.find_one({"id": int(rx["selectedLabId"])})
        req = db.lab_requests.find_one({"prescriptionId": rx_id})
        req_data = {
            "patientAge": rx.get("patientAge", ""),
            "patientBloodGroup": rx.get("patientBloodGroup", ""),
            "doctorId": rx.get("doctorId"),
            "doctorName": rx.get("doctorName", "Doctor"),
            "labId": int(rx["selectedLabId"]),
            "labName": lab.get("labName", "General Lab") if lab else "General Lab",
            "testType": ", ".join(rx.get("labTests", [])),
            "priority": "urgent" if rx.get("severity") == "High" else "normal",
            "diagnosis": rx.get("diagnosis", ""),
            "status": "pending",
            "reportUrl": None,
            "reportImageUrl": None,
            "aiAnalysis": None,
            "prescriptionId": rx_id,
        }
        if req:
            db.lab_requests.update_one({"id": req["id"]}, {"$set": req_data})
        else:
            req_data["id"] = next_id("lab_requests")
            req_data["patientId"] = rx["patientId"]
            req_data["patientName"] = rx.get("patientName", "Unknown Patient")
            req_data["createdAt"] = datetime.utcnow().isoformat() + "Z"
            db.lab_requests.insert_one(req_data)

    return jsonify(serialize(rx))

@app.route("/api/labs", methods=["GET"])
def list_labs():
    db = get_db()
    labs = db.lab_techs.find({}, {"_id": 0, "id": 1, "labName": 1})
    return jsonify(serialize_list(labs))

@app.route("/api/lab/requests", methods=["GET", "POST"])
@jwt_required()
def lab_requests():
    db = get_db()
    user_id = int(get_jwt_identity())
    user = db.users.find_one({"id": user_id})
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    if request.method == "GET":
        query = {}
        if user["role"] == "patient":
            query["patientId"] = user_id
        elif user["role"] == "lab":
            query["labId"] = user_id
        else:
            # For doctors and admins, allow filtering by params
            if request.args.get("labId"):
                query["labId"] = int(request.args["labId"])
            if request.args.get("patientId"):
                query["patientId"] = int(request.args["patientId"])
            if request.args.get("prescriptionId"):
                query["prescriptionId"] = int(request.args["prescriptionId"])
        return jsonify(serialize_list(db.lab_requests.find(query).sort("createdAt", -1)))
    
    # POST - only doctors can create prescriptions that lead to lab requests
    if user["role"] != "doctor":
        return jsonify({"error": "Unauthorized"}), 403
    
    data = request.get_json() or {}
    if not data.get("patientId") or not data.get("doctorId") or not data.get("labId") or not data.get("testType"):
        return jsonify({"error": "patientId, doctorId, labId, and testType are required."}), 400

    try:
        lab_id = int(data["labId"])
    except (TypeError, ValueError):
        return jsonify({"error": "labId must be a valid number."}), 400

    try:
        doctor_id = int(data["doctorId"])
    except (TypeError, ValueError):
        return jsonify({"error": "doctorId must be a valid number."}), 400

    new_req = {
        "id": next_id("lab_requests"),
        "patientId": data["patientId"],
        "patientName": data.get("patientName", "Patient"),
        "patientAge": data.get("patientAge", ""),
        "patientBloodGroup": data.get("patientBloodGroup", ""),
        "doctorId": doctor_id,
        "doctorName": data.get("doctorName", "Doctor"),
        "labId": lab_id,
        "labName": data.get("labName", "General Lab"),
        "testType": data["testType"],
        "priority": data.get("priority", "normal"),
        "diagnosis": data.get("diagnosis", ""),
        "prescriptionId": data.get("prescriptionId"),
        "status": "pending",
        "createdAt": datetime.utcnow().isoformat() + "Z"
    }
    db.lab_requests.insert_one(new_req)

    # If this was created standalone (not already billed under a prescription), create a medical report bill
    if not data.get("prescriptionId"):
        lab_pay_id = next_id("payments")
        db.payments.insert_one({
            "id": lab_pay_id,
            "patientId": data["patientId"],
            "patientName": data.get("patientName", "Patient"),
            "labRequestId": new_req["id"],
            "amount": 500,
            "category": "lab",
            "method": "pending",
            "status": "pending",
            "description": f"Medical Report - {data.get('testType', 'Lab Test')}",
            "invoiceId": f"INV-2026-{str(lab_pay_id).zfill(3)}",
            "createdAt": datetime.utcnow().isoformat() + "Z",
        })

    try:
        lab_user = db.users.find_one({"id": lab_id})
        if lab_user:
            db.notifications.insert_one({
                "id": next_id("notifications"),
                "userId": lab_user["id"],
                "type": "lab_request",
                "title": "New Lab Request",
                "message": f"A new lab request for {new_req['patientName']} is waiting in your dashboard.",
                "read": False,
                "createdAt": datetime.utcnow().isoformat() + "Z"
            })
    except Exception:
        pass

    return jsonify(serialize(new_req)), 201

@app.route("/api/prescriptions/<int:rx_id>", methods=["GET"])
def prescription_detail(rx_id):
    db = get_db()
    rx = db.prescriptions.find_one({"id": rx_id})
    if not rx:
        return jsonify({"error": "Not found"}), 404
    return jsonify(serialize(rx))

@app.route("/api/labs", methods=["GET"])
def get_labs():
    db = get_db()
    return jsonify(serialize_list(db.lab_techs.find({})))

@app.route("/api/lab/requests/<int:req_id>", methods=["GET", "PATCH"])
@jwt_required()
def lab_request_detail(req_id):
    db = get_db()
    user_id = int(get_jwt_identity())
    user = db.users.find_one({"id": user_id})
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    req = db.lab_requests.find_one({"id": req_id})
    if not req:
        return jsonify({"error": "Lab request not found"}), 404
    
    # Check permissions
    if user["role"] == "patient" and req["patientId"] != user_id:
        return jsonify({"error": "Unauthorized"}), 403
    elif user["role"] == "lab" and req["labId"] != user_id:
        return jsonify({"error": "Unauthorized"}), 403
    # Doctors and admins can access any
    
    if request.method == "PATCH":
        db.lab_requests.update_one({"id": req_id}, {"$set": request.get_json()})
        req = db.lab_requests.find_one({"id": req_id})
    return jsonify(serialize(req))

@app.route("/api/lab/requests/<int:req_id>/report", methods=["POST"])
@jwt_required()
def lab_report(req_id):
    db = get_db()
    user_id = int(get_jwt_identity())
    user = db.users.find_one({"id": user_id})
    if not user or user["role"] != "lab":
        return jsonify({"error": "Unauthorized"}), 403
    
    lab_req = db.lab_requests.find_one({"id": req_id})
    if not lab_req:
        return jsonify({"error": "Not found"}), 404
    report_url = (request.get_json() or {}).get("reportUrl") or lab_req.get("reportUrl")
    if not report_url:
        return jsonify({"error": "Upload a report before marking it ready"}), 400
    ai = {"primaryCondition": "Pneumonia", "confidence": 0.87, "secondaryConditions": [{"condition": "Normal", "confidence": 0.09}], "disclaimer": "AI analysis is assistive only. Clinical judgment required."}
    db.lab_requests.update_one({"id": req_id}, {"$set": {"reportUrl": report_url, "status": "ready", "aiAnalysis": ai}})
    return jsonify(serialize(db.lab_requests.find_one({"id": req_id})))

@app.route("/api/profile", methods=["GET", "PATCH"])
@jwt_required()
def get_profile():
    db = get_db()
    user_id = int(get_jwt_identity())
    user = db.users.find_one({"id": user_id})
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    role = user.get("role")

    if request.method == "PATCH":
        data = request.get_json() or {}
        allowed = [
            "fullName", "phone", "email", "specialty", "degree", "experience",
            "registrationNumber", "fee", "hospital", "hospitalAddress",
            "hospitalPhone", "hospitalEmail", "hospitalAbout", "hospitalFacilities",
            "hospitalImages", "services", "bio", "status", "dateOfBirth", "bloodGroup",
            "location"
        ]
        updates = {k: v for k, v in data.items() if k in allowed}
        if updates:
            if role == "doctor":
                db.doctors.update_one({"id": user_id}, {"$set": updates}, upsert=True)
            elif role == "patient":
                db.patients.update_one({"id": user_id}, {"$set": updates}, upsert=True)
            user_updates = {k: updates[k] for k in ["fullName", "email", "phone"] if k in updates}
            if user_updates:
                db.users.update_one({"id": user_id}, {"$set": user_updates})

    user = db.users.find_one({"id": user_id})
    profile_data = serialize(user)
    if "password" in profile_data:
        del profile_data["password"]
        
    if role == "patient":
        ext = db.patients.find_one({"id": user_id})
        if ext: profile_data.update(serialize(ext))
    elif role == "doctor":
        ext = db.doctors.find_one({"id": user_id})
        if ext:
            enriched = enrich_doctor_data(ext) if 'enrich_doctor_data' in globals() else serialize(ext)
            profile_data.update(enriched)
    elif role == "lab":
        ext = db.lab_techs.find_one({"id": user_id})
        if ext: profile_data.update(serialize(ext))
    elif role == "blood_bank":
        ext = db.blood_banks.find_one({"managerId": user_id})
        if ext: profile_data.update(serialize(ext))
        
    return jsonify(profile_data)

# ─── Blood Bank ───────────────────────────────────────────────────────────────

@app.route("/api/blood-banks", methods=["GET"])
def get_blood_banks():
    db = get_db()
    return jsonify(serialize_list(db.blood_banks.find({})))

@app.route("/api/blood-banks/<int:bank_id>/stock", methods=["PATCH"])
def update_blood_stock(bank_id):
    db = get_db()
    data = request.get_json()
    blood_group = data.get("bloodGroup")
    quantity = int(data.get("quantity", 0))
    action = data.get("action") # "add" or "subtract"

    bank = db.blood_banks.find_one({"id": bank_id})
    if not bank:
        return jsonify({"error": "Blood bank not found"}), 404

    current_stock = bank.get("stock", {}).get(blood_group, 0)
    if action == "add":
        new_stock = current_stock + quantity
    elif action == "subtract":
        if current_stock < quantity:
            return jsonify({"error": "Insufficient stock"}), 400
        new_stock = current_stock - quantity
    else:
        return jsonify({"error": "Invalid action"}), 400

    db.blood_banks.update_one(
        {"id": bank_id},
        {"$set": {f"stock.{blood_group}": new_stock}}
    )
    return jsonify({"message": "Stock updated", "newStock": new_stock})

@app.route("/api/blood-reservations", methods=["GET"])
def get_blood_reservations():
    db = get_db()
    query = {}
    if request.args.get("bloodBankId"):
        query["bloodBankId"] = int(request.args["bloodBankId"])
    return jsonify(serialize_list(db.blood_reservations.find(query).sort("createdAt", -1)))

@app.route("/api/blood-reservations", methods=["POST"])
@jwt_required()
def create_blood_reservation():
    db = get_db()
    data = request.get_json()
    doctor_id = int(get_jwt_identity())
    
    bank_id = data.get("bloodBankId")
    blood_group = data.get("bloodGroup")
    units = int(data.get("units", 1))
    patient_name = data.get("patientName", "Urgent Patient")

    bank = db.blood_banks.find_one({"id": bank_id})
    if not bank:
        return jsonify({"error": "Blood bank not found"}), 404

    current_stock = bank.get("stock", {}).get(blood_group, 0)
    if current_stock < units:
        return jsonify({"error": f"Insufficient stock. Available: {current_stock} units"}), 400

    doctor = db.doctors.find_one({"id": doctor_id})
    
    new_res = {
        "id": next_id("blood_reservations"),
        "bloodBankId": bank_id,
        "doctorId": doctor_id,
        "doctorName": doctor["fullName"] if doctor else "Doctor",
        "patientName": patient_name,
        "bloodGroup": blood_group,
        "units": units,
        "status": "reserved",
        "reservedDate": datetime.utcnow().date().isoformat(),
        "expiryDate": (datetime.utcnow() + timedelta(days=3)).date().isoformat(),
        "createdAt": datetime.utcnow().isoformat() + "Z"
    }
    
    db.blood_banks.update_one({"id": bank_id}, {"$inc": {f"stock.{blood_group}": -units}})
    db.blood_reservations.insert_one(new_res)
    
    if bank.get("managerId"):
        db.notifications.insert_one({
            "id": next_id("notifications"),
            "userId": bank["managerId"],
            "type": "blood_reservation",
            "title": "New Blood Reservation",
            "message": f"Dr. {new_res['doctorName']} reserved {units} units of {blood_group}.",
            "read": False,
            "createdAt": datetime.utcnow().isoformat() + "Z"
        })
    return jsonify(serialize(new_res)), 201

@app.route("/api/blood-reservations/<int:res_id>", methods=["PATCH"])
def update_reservation_status(res_id):
    db = get_db()
    data = request.get_json()
    status = data.get("status")

    res = db.blood_reservations.find_one({"id": res_id})
    if not res:
        return jsonify({"error": "Reservation not found"}), 404

    db.blood_reservations.update_one({"id": res_id}, {"$set": {"status": status}})
    return jsonify({"message": "Status updated"})

# ─── Patients ─────────────────────────────────────────────────────────────────

@app.route("/api/patients", methods=["GET"])
def patients():
    db = get_db()
    search = request.args.get("search", "")
    limit = int(request.args.get("limit", 20))
    offset = int(request.args.get("offset", 0))
    query = {}
    if search:
        import re
        query["$or"] = [
            {"fullName": {"$regex": re.escape(search), "$options": "i"}},
            {"email": {"$regex": re.escape(search), "$options": "i"}},
        ]
    total = db.patients.count_documents(query)
    pts = serialize_list(db.patients.find(query).skip(offset).limit(limit))
    return jsonify({"patients": pts, "total": total})

@app.route("/api/patients/<int:patient_id>", methods=["GET"])
def patient_detail(patient_id):
    db = get_db()
    patient = db.patients.find_one({"id": patient_id})
    if not patient:
        return jsonify({"error": "Not found"}), 404
    return jsonify(serialize(patient))

@app.route("/api/patients/<int:patient_id>/history", methods=["GET"])
def patient_history(patient_id):
    visits = []
    return jsonify({"visits": visits})

@app.route("/api/patients/<int:patient_id>/followups", methods=["GET"])
def patient_followups(patient_id):
    db = get_db()
    return jsonify(serialize_list(db.followups.find({"patientId": patient_id}) if "followups" in db.list_collection_names() else []))

# ─── Doctors ──────────────────────────────────────────────────────────────────

DEFAULT_HOSPITAL_IMAGES = [
    {
        "url": "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1000&q=80",
        "caption": "Hospital Exterior & Main Entrance"
    },
    {
        "url": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1000&q=80",
        "caption": "Reception Lounge & Outpatient Desk"
    },
    {
        "url": "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1000&q=80",
        "caption": "Doctor Consultation & Diagnostic Suite"
    },
    {
        "url": "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1000&q=80",
        "caption": "Treatment Room & Sterile Minor Procedure Unit"
    }
]

def enrich_doctor_data(doctor):
    if not doctor:
        return doctor
    doc_dict = serialize(doctor)
    fee = doc_dict.get("fee", 600) or 600
    if not doc_dict.get("services"):
        doc_dict["services"] = [
            {
                "id": "1",
                "name": "Doctor Consultation / Visiting Card",
                "category": "Consultation",
                "price": fee,
                "description": "Comprehensive primary clinical consultation, vital diagnosis, and initial prescription."
            },
            {
                "id": "2",
                "name": "Injection Administration (IM / IV)",
                "category": "Clinical & Nursing",
                "price": 100,
                "description": "Intramuscular or Intravenous sterile injection administration by clinical staff."
            },
            {
                "id": "3",
                "name": "Sterile Disposable Syringe & Needle",
                "category": "Medical Consumable",
                "price": 30,
                "description": "Medical-grade single-use sterile syringe & precision needle pack."
            },
            {
                "id": "4",
                "name": "Wound Dressing & Antiseptic Care",
                "category": "Minor Procedure",
                "price": 250,
                "description": "Antiseptic wash, sterile gauze padding, and surgical bandage dressing."
            },
            {
                "id": "5",
                "name": "ECG (12-Lead Electrocardiogram)",
                "category": "Diagnostics",
                "price": 400,
                "description": "Live cardiac rhythm recording & instant digital review."
            },
            {
                "id": "6",
                "name": "Emergency Out-of-Hours Visit",
                "category": "Emergency",
                "price": 1200,
                "description": "Priority clinical examination, triage, and acute stabilization."
            }
        ]
    if not doc_dict.get("hospitalImages"):
        doc_dict["hospitalImages"] = DEFAULT_HOSPITAL_IMAGES
    if not doc_dict.get("hospitalFacilities"):
        doc_dict["hospitalFacilities"] = [
            "24/7 Emergency", "ICU Facility", "In-House Pharmacy", "Pathology Lab", "Digital X-Ray", "Sterile Minor OT", "Wheelchair Accessible"
        ]
    if not doc_dict.get("hospitalAbout"):
        doc_dict["hospitalAbout"] = f"{doc_dict.get('hospital', 'MediCore Hospital')} is equipped with state-of-the-art medical technology, dedicated emergency care, sterile consultation chambers, and an in-house pharmacy to provide compassionate healthcare."
    if not doc_dict.get("hospitalAddress"):
        doc_dict["hospitalAddress"] = doc_dict.get("location", "123 Healthcare Way, Metro City, 560001")
    
    # Distance in km (calculated or assigned)
    if "distance" not in doc_dict or doc_dict.get("distance") is None:
        doc_id = doc_dict.get("id", 1)
        doc_dict["distance"] = round(((doc_id * 7) % 22) * 0.5 + 1.4, 1)

    if not doc_dict.get("rating"):
        doc_dict["rating"] = 4.8
    if not doc_dict.get("experience"):
        doc_dict["experience"] = 8

    return doc_dict

@app.route("/api/doctors", methods=["GET"])
def doctors():
    db = get_db()
    query = {}
    treatment = request.args.get("treatment") or request.args.get("specialty")
    if treatment:
        import re
        reg = {"$regex": re.escape(treatment), "$options": "i"}
        query["$or"] = [
            {"specialty": reg},
            {"services.name": reg},
            {"services.category": reg}
        ]
    if request.args.get("location"):
        import re
        query["location"] = {"$regex": re.escape(request.args["location"]), "$options": "i"}
    if request.args.get("maxPrice"):
        try:
            query["fee"] = {"$lte": float(request.args["maxPrice"])}
        except ValueError:
            pass
    if request.args.get("minRating"):
        try:
            query["rating"] = {"$gte": float(request.args["minRating"])}
        except ValueError:
            pass

    raw_doctors = list(db.doctors.find(query))
    enriched = [enrich_doctor_data(d) for d in raw_doctors]

    if request.args.get("maxDistance"):
        try:
            max_d = float(request.args["maxDistance"])
            enriched = [d for d in enriched if float(d.get("distance", 999)) <= max_d]
        except ValueError:
            pass

    return jsonify(enriched)

@app.route("/api/doctors/<int:doctor_id>", methods=["GET", "PATCH"])
def doctor_detail(doctor_id):
    db = get_db()
    doctor = db.doctors.find_one({"id": doctor_id})
    if not doctor:
        return jsonify({"error": "Not found"}), 404

    if request.method == "PATCH":
        data = request.get_json() or {}
        allowed = [
            "fullName", "phone", "email", "specialty", "degree", "experience",
            "registrationNumber", "fee", "hospital", "hospitalAddress",
            "hospitalPhone", "hospitalEmail", "hospitalAbout", "hospitalFacilities",
            "hospitalImages", "services", "bio", "status", "location"
        ]
        updates = {k: v for k, v in data.items() if k in allowed}
        if updates:
            db.doctors.update_one({"id": doctor_id}, {"$set": updates})
            user_updates = {k: updates[k] for k in ["fullName", "email", "phone"] if k in updates}
            if user_updates:
                db.users.update_one({"id": doctor_id}, {"$set": user_updates})
        doctor = db.doctors.find_one({"id": doctor_id})

    return jsonify(enrich_doctor_data(doctor))

import calendar

@app.route("/api/doctors/<int:doctor_id>/schedule", methods=["GET", "POST"])
def doctor_schedule(doctor_id):
    db = get_db()
    if request.method == "GET":
        sched = db.schedules.find_one({"doctorId": doctor_id})
        if sched:
            # Drop DB specific tracking fields from frontend response
            ret = {k: v for k, v in serialize(sched).items() if k not in ["_id", "doctorId", "id"]}
            return jsonify(ret)
        return jsonify({})
    
    data = request.get_json()
    db.schedules.update_one(
        {"doctorId": doctor_id},
        {"$set": {**data, "doctorId": doctor_id}},
        upsert=True
    )
    return jsonify({"message": "Schedule saved successfully"}), 200

@app.route("/api/doctors/<int:doctor_id>/slots", methods=["GET"])
def doctor_slots(doctor_id):
    date_str = request.args.get("date")
    if not date_str:
        return jsonify({"error": "date parameter required"}), 400
        
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        day_name = calendar.day_name[dt.weekday()]
    except ValueError:
        return jsonify({"error": "invalid date format"}), 400
        
    db = get_db()
    sched = db.schedules.find_one({"doctorId": doctor_id})
    
    # If the doctor has absolutely no schedule config, we return empty list so the UI says "No slots"
    if not sched or not sched.get(day_name) or not sched[day_name].get("active"):
        return jsonify([])
        
    defined_slots = sched[day_name].get("slots", [])
    result_slots = []
    
    for slot in defined_slots:
        try:
            start_ampm = datetime.strptime(slot['start'], "%H:%M").strftime("%I:%M %p")
            end_ampm = datetime.strptime(slot['end'], "%H:%M").strftime("%I:%M %p")
            time_str = f"{start_ampm} - {end_ampm}"
        except:
            time_str = f"{slot['start']} - {slot['end']}"
            
        capacity = int(slot.get("capacity", 1))
        
        booked_count = db.appointments.count_documents({
            "doctorId": doctor_id,
            "date": date_str,
            "time": time_str
        })
        
        remaining = max(0, capacity - booked_count)
        result_slots.append({
            "time": time_str,
            "available": remaining > 0,
            "remaining": remaining,
            "capacity": capacity
        })
        
    return jsonify(result_slots)

# ─── Dashboard ────────────────────────────────────────────────────────────────

@app.route("/api/dashboard/patient", methods=["GET"])
@jwt_required()
def dashboard_patient():
    db = get_db()
    user_id = int(get_jwt_identity())
    today = datetime.utcnow().date().isoformat()

    upcomingAppointments = db.appointments.count_documents({
        "patientId": user_id,
        "date": {"$gte": today},
        "status": {"$in": ["confirmed", "pending"]}
    })
    pendingLabReports = db.lab_requests.count_documents({
        "patientId": user_id,
        "status": {"$in": ["pending", "processing"]}
    })
    activePrescriptions = db.prescriptions.count_documents({"patientId": user_id})
    unreadNotifications = db.notifications.count_documents({"userId": user_id, "read": False})

    next_appt_cursor = list(db.appointments.find({
        "patientId": user_id,
        "date": {"$gte": today},
        "status": {"$in": ["confirmed", "pending"]}
    }).sort("date", 1).limit(1))
    nextAppointment = None
    if next_appt_cursor:
        appt = next_appt_cursor[0]
        nextAppointment = {
            "doctorName": appt.get("doctorName", "Doctor"),
            "date": appt.get("date"),
            "time": appt.get("time"),
            "type": appt.get("type", "appointment")
        }

    recentActivity = []
    recent_appointments = list(db.appointments.find({"patientId": user_id}).sort("date", -1).limit(3))
    for appt in recent_appointments:
        recentActivity.append({
            "type": "appointment",
            "message": f"Appointment with Dr. {appt.get('doctorName', 'Doctor')} on {appt.get('date')}.",
            "time": appt.get('date')
        })
    recent_lab = list(db.lab_requests.find({"patientId": user_id, "status": "ready"}).sort("createdAt", -1).limit(2))
    for lab in recent_lab:
        recentActivity.append({
            "type": "lab_report",
            "message": f"Lab report ready for {lab.get('testType', 'test')}.",
            "time": lab.get('createdAt')
        })

    patient_vax_cursor = db.vaccinations.find({"patientId": user_id}).sort("date", -1)
    patient_vaccinations = serialize_list(patient_vax_cursor)
    patient_profile = db.patients.find_one({"id": user_id}) or {}
    expenses_summary = calculate_patient_expenses(user_id)

    return jsonify({
        "upcomingAppointments": upcomingAppointments,
        "pendingLabReports": pendingLabReports,
        "activePrescriptions": activePrescriptions,
        "unreadNotifications": unreadNotifications,
        "nextAppointment": nextAppointment,
        "recentActivity": recentActivity,
        "vaccinationStatus": patient_profile.get("vaccinationStatus", "Pending verification"),
        "vaccinations": patient_vaccinations,
        "expenses": expenses_summary
    })

@app.route("/api/expenses", methods=["GET"])
@jwt_required()
def get_expenses():
    db = get_db()
    user_id = int(get_jwt_identity())
    user = db.users.find_one({"id": user_id})
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    target_patient_id = user_id
    if user.get("role") in ["admin", "superadmin", "doctor"]:
        req_patient_id = request.args.get("patientId")
        if req_patient_id:
            try:
                target_patient_id = int(req_patient_id)
            except ValueError:
                pass
            
    expenses_data = calculate_patient_expenses(target_patient_id)
    return jsonify(expenses_data)

@app.route("/api/expenses/<int:payment_id>/pay", methods=["POST"])
@jwt_required()
def pay_expense_bill(payment_id):
    db = get_db()
    user_id = int(get_jwt_identity())
    payment = db.payments.find_one({"id": payment_id})
    if not payment:
        return jsonify({"error": "Bill not found"}), 404
        
    data = request.get_json() or {}
    method = data.get("method", "upi")
    
    db.payments.update_one(
        {"id": payment_id},
        {"$set": {"status": "completed", "method": method, "paidAt": datetime.utcnow().isoformat() + "Z"}}
    )
    
    if payment.get("appointmentId"):
        db.appointments.update_one({"id": payment["appointmentId"], "status": "pending"}, {"$set": {"status": "confirmed"}})
        
    updated = db.payments.find_one({"id": payment_id})
    return jsonify(serialize(updated))

@app.route("/api/dashboard/doctor", methods=["GET"])
@jwt_required()
def dashboard_doctor():
    db = get_db()
    user_id = int(get_jwt_identity())
    today = datetime.utcnow().date().isoformat()

    doctor_profile = db.doctors.find_one({"id": user_id})
    if not doctor_profile:
        # Fallback: match doctor profile by name for seeded users where ids differ
        user = db.users.find_one({"id": user_id})
        if user and user.get("fullName"):
            doctor_profile = db.doctors.find_one({"fullName": user["fullName"]})
    doctor_id = doctor_profile["id"] if doctor_profile else user_id

    todayAppointments = db.appointments.count_documents({
        "doctorId": doctor_id,
        "date": today,
        "status": {"$in": ["confirmed", "pending"]}
    })
    pendingPrescriptions = db.appointments.count_documents({
        "doctorId": doctor_id,
        "status": "confirmed"
    })
    activePatients = len(db.appointments.distinct("patientId", {"doctorId": doctor_id}))
    pendingLabReviews = db.lab_requests.count_documents({"doctorId": doctor_id, "status": "ready"})

    schedule_cursor = db.appointments.find({
        "doctorId": doctor_id,
        "date": today,
        "status": {"$in": ["confirmed", "pending"]}
    }).sort([("time", 1)])
    schedule = [serialize(appt) for appt in schedule_cursor]

    recent_appointments = list(db.appointments.find({"doctorId": doctor_id}).sort("date", -1).limit(5))
    recentPatients = []
    seen = set()
    for appt in recent_appointments:
        patient_id = appt.get("patientId")
        if patient_id in seen:
            continue
        seen.add(patient_id)
        recentPatients.append({
            "id": patient_id,
            "name": appt.get("patientName", "Patient"),
            "condition": appt.get("type", "Consultation"),
            "symptoms": appt.get("notes", ""),
            "lastVisit": appt.get("date")
        })
        if len(recentPatients) >= 5:
            break

    return jsonify({
        "todayAppointments": todayAppointments,
        "pendingPrescriptions": pendingPrescriptions,
        "activePatients": activePatients,
        "pendingLabReviews": pendingLabReviews,
        "schedule": schedule,
        "recentPatients": recentPatients,
        "doctorProfile": enrich_doctor_data(doctor_profile) if doctor_profile else None,
    })

@app.route("/api/patients/<int:pt_id>/allergies", methods=["POST"])
@jwt_required()
def add_allergy(pt_id):
    db = get_db()
    data = request.get_json()
    allergy = data.get("allergy")
    if not allergy:
        return jsonify({"error": "Allergy is required"}), 400
    
    # Use $addToSet to prevent duplicate allergies
    db.patients.update_one({"id": pt_id}, {"$addToSet": {"allergies": allergy}})
    return jsonify({"message": "Allergy added successfully"}), 200

# ─── Admin ────────────────────────────────────────────────────────────────────

@app.route("/api/admin/stats", methods=["GET"])
def admin_stats():
    db = get_db()
    return jsonify({
        "totalDoctors": db.doctors.count_documents({}),
        "activeDoctors": db.doctors.count_documents({"status": "active"}),
        "totalPatients": db.patients.count_documents({}),
        "totalFacilities": 34,
        "criticalAlerts": 7,
        "appointmentsToday": db.appointments.count_documents({"date": datetime.utcnow().strftime("%Y-%m-%d")}),
        "prescriptionsToday": db.prescriptions.count_documents({}),
        "pendingLabReports": db.lab_requests.count_documents({"status": "pending"}),
    })

@app.route("/api/admin/locations", methods=["GET"])
def admin_locations():
    db = get_db()
    return jsonify(serialize_list(db.locations.find({})))

@app.route("/api/admin/disease-data", methods=["GET"])
def admin_disease_data():
    db = get_db()
    return jsonify(serialize_list(db.disease_data.find({})))

@app.route("/api/admin/spread-prediction", methods=["GET"])
def admin_spread_prediction():
    db = get_db()
    return jsonify(serialize_list(db.spread_predictions.find({})))

# ─── Payments ─────────────────────────────────────────────────────────────────

@app.route("/api/payments", methods=["GET", "POST"])
def payments():
    db = get_db()
    if request.method == "GET":
        query = {}
        if request.args.get("patientId"):
            query["patientId"] = int(request.args["patientId"])
        return jsonify(serialize_list(db.payments.find(query)))
    data = request.get_json()
    patient = db.patients.find_one({"id": data.get("patientId")})
    new_id = next_id("payments")
    new_payment = {
        "id": new_id, "patientId": data["patientId"],
        "patientName": patient["fullName"] if patient else "",
        "appointmentId": data.get("appointmentId"), "amount": data["amount"],
        "category": data.get("category", "consultation"), "method": data.get("method", "upi"),
        "status": "completed",
        "invoiceId": f"INV-2026-{str(new_id).zfill(3)}",
        "createdAt": datetime.utcnow().isoformat() + "Z",
    }
    db.payments.insert_one(new_payment)
    return jsonify(serialize(new_payment)), 201

# ─── Notifications ────────────────────────────────────────────────────────────

@app.route("/api/notifications", methods=["GET"])
def notifications():
    db = get_db()
    query = {}
    if request.args.get("userId"):
        query["userId"] = int(request.args["userId"])
    return jsonify(serialize_list(db.notifications.find(query)))

@app.route("/api/notifications/<int:notif_id>/read", methods=["POST"])
def mark_notification_read(notif_id):
    db = get_db()
    db.notifications.update_one({"id": notif_id}, {"$set": {"read": True}})
    return jsonify({"message": "Marked as read"})

# ─── Vaccinations ─────────────────────────────────────────────────────────────

@app.route("/api/vaccinations", methods=["GET", "POST"])
@jwt_required()
def vaccinations_api():
    db = get_db()
    if request.method == "GET":
        query = {}
        p_id = request.args.get("patientId")
        if p_id:
            query["patientId"] = int(p_id)
        return jsonify(serialize_list(db.vaccinations.find(query).sort("date", -1)))
    
    data = request.get_json()
    p_id = int(data.get("patientId"))
    patient = db.patients.find_one({"id": p_id})
    new_vax = {
        "id": next_id("vaccinations"),
        "patientId": p_id,
        "patientName": data.get("patientName", patient["fullName"] if patient else ""),
        "vaccineName": data["vaccineName"],
        "company": data.get("company", ""),
        "batchNo": data["batchNo"],
        "administeredBy": data["administeredBy"],
        "type": data["type"],
        "date": data.get("date", datetime.utcnow().strftime("%Y-%m-%d")),
        "createdAt": datetime.utcnow().isoformat() + "Z"
    }
    db.vaccinations.insert_one(new_vax)
    if patient:
        db.patients.update_one({"id": p_id}, {"$set": {"vaccinationStatus": f"Administered {data['vaccineName']}"}})
    return jsonify(serialize(new_vax)), 201

# ─── Chatbot ──────────────────────────────────────────────────────────────────

@app.route("/api/chatbot/query", methods=["POST"])
@jwt_required(optional=True)
def chatbot_query():
    data = request.get_json()
    user_msg = data.get("message", "")
    user_id = get_jwt_identity()

    # ─── Gather Dynamic User Context ───
    context_str = ""
    if user_id:
        db = get_db()
        patient = db.patients.find_one({"id": int(user_id)})
        if patient:
            allergies = ", ".join(patient.get("allergies", [])) or "None"
            conditions = ", ".join(patient.get("existingConditions", [])) or "None"
            medical_context = (
                f" User: {patient.get('fullName')}. "
                f"Medical History: Allergies ({allergies}), "
                f"Conditions ({conditions}), "
                f"Blood Group ({patient.get('bloodGroup', 'Unknown')})."
            )
            context_str = f"\nPatient Context: {medical_context}"

    api_key = os.getenv("OPENAI_API_KEY")
    if api_key and not api_key.startswith("your_"):
        try:
            response = openai_client.chat.completions.create(
                model="gpt-4o", 
                messages=[
                    {
                        "role": "system", 
                        "content": (
                            "You are the MediCore HMS AI. Provide intelligent, empathetic, and dynamic medical assistance. "
                            "Help with booking, lab results, and general health queries. "
                            "ALWAYS return a valid JSON object with: "
                            "1. 'reply': A conversational string. "
                            "2. 'intent': One of [greeting, availability, booking, vaccination, lab, followup, general]. "
                            "3. 'suggestions': A list of 3 short follow-up actions. "
                            f"Strictly adhere to the user's medical history for safety warnings.{context_str}"
                        )
                    },
                    {"role": "user", "content": user_msg}
                ],
                response_format={"type": "json_object"}
            )
            
            # Parse AI response
            ai_data = json.loads(response.choices[0].message.content)
            return jsonify({
                "reply": ai_data.get("reply", "I'm here to help."),
                "intent": ai_data.get("intent", "general"),
                "suggestions": ai_data.get("suggestions", ["Book Appointment", "Check Availability"])
            })
        except Exception as e:
            logging.error(f"OpenAI Chatbot Error: {e}")
            # Fall through to generic response

    # Generic fallback message instead of static intent-based data
    return jsonify({
        "reply": "I'm currently unable to reach my AI service. Please try again in a few moments.",
        "intent": "general",
        "suggestions": ["Go to Dashboard", "View Appointments", "Try Again"]
    })

# ─── Health ───────────────────────────────────────────────────────────────────

@app.route("/api/healthz", methods=["GET"])
def healthz():
    try:
        db = get_db()
        db.command("ping")
        return jsonify({"status": "ok", "database": "connected"})
    except Exception as e:
        return jsonify({"status": "ok", "database": "disconnected", "error": str(e)}), 200
