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
import cloudinary
import cloudinary.uploader
import cloudinary.utils

logging.basicConfig(level=logging.INFO)

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
            file.stream,
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
    new_appt = {
        "id": next_id("appointments"), "patientId": data["patientId"],
        "patientName": patient["fullName"] if patient else "",
        "doctorId": data["doctorId"], "doctorName": doctor["fullName"] if doctor else "",
        "date": data["date"], "time": data["time"], "type": data.get("type", "normal"),
        "status": "pending", "fee": doctor["fee"] if doctor else 600, "notes": data.get("notes", ""),
    }
    db.appointments.insert_one(new_appt)
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
    
    # Validation logic
    allergies = patient.get("allergies", []) if patient else []
    validations = []
    for med in data.get("medicines", []):
        name_first = med["name"].lower().split()[0] if med.get("name") else ""
        conflict = any(name_first in a.lower() for a in allergies)
        validations.append({
            "type": "error" if conflict else "success",
            "message": f"{med['name']} — {'allergy conflict detected' if conflict else 'no allergy conflict detected'}",
        })
    
    # Drug-Drug Interaction validation
    validations.extend(check_drug_interactions(data.get("medicines", [])))
        
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
        "medicines": data.get("medicines", []),
        "labTests": data.get("labTests", []),
        "selectedLabId": data.get("selectedLabId"),
        "followupDate": data.get("followupDate"),
        "validations": validations,
        "createdAt": datetime.utcnow().isoformat() + "Z"
    }
    db.prescriptions.insert_one(new_rx)

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
    validations = []
    for med in data.get("medicines", []):
        name_first = med.get("name", "").lower().split()[0] if med.get("name") else ""
        conflict = any(name_first in a.lower() for a in allergies)
        validations.append({
            "type": "error" if conflict else "success",
            "message": f"{med.get('name', 'Medicine')} — {'allergy conflict detected' if conflict else 'no allergy conflict detected'}",
        })

    # Drug-Drug Interaction validation
    validations.extend(check_drug_interactions(data.get("medicines", [])))

    if not validations:
        validations.append({
            "type": "warning",
            "message": "No medicines provided to validate. Add at least one drug to run AI validation.",
        })

    return jsonify({"validations": validations}), 200

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

@app.route("/api/profile", methods=["GET"])
@jwt_required()
def get_profile():
    db = get_db()
    user_id = int(get_jwt_identity())
    user = db.users.find_one({"id": user_id})
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    role = user.get("role")
    profile_data = serialize(user)
    if "password" in profile_data:
        del profile_data["password"]
        
    if role == "patient":
        ext = db.patients.find_one({"id": user_id})
        if ext: profile_data.update(serialize(ext))
    elif role == "doctor":
        ext = db.doctors.find_one({"id": user_id})
        if ext: profile_data.update(serialize(ext))
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

@app.route("/api/doctors", methods=["GET"])
def doctors():
    db = get_db()
    query = {}
    if request.args.get("specialty"):
        import re
        query["specialty"] = {"$regex": re.escape(request.args["specialty"]), "$options": "i"}
    if request.args.get("location"):
        import re
        query["location"] = {"$regex": re.escape(request.args["location"]), "$options": "i"}
    return jsonify(serialize_list(db.doctors.find(query)))

@app.route("/api/doctors/<int:doctor_id>", methods=["GET"])
def doctor_detail(doctor_id):
    db = get_db()
    doctor = db.doctors.find_one({"id": doctor_id})
    if not doctor:
        return jsonify({"error": "Not found"}), 404
    return jsonify(serialize(doctor))

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

    return jsonify({
        "upcomingAppointments": upcomingAppointments,
        "pendingLabReports": pendingLabReports,
        "activePrescriptions": activePrescriptions,
        "unreadNotifications": unreadNotifications,
        "nextAppointment": nextAppointment,
        "recentActivity": recentActivity,
        "vaccinationStatus": patient_profile.get("vaccinationStatus", "Pending verification"),
        "vaccinations": patient_vaccinations
    })

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
