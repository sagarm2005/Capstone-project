import { Router } from "express";
import { USERS, PATIENTS, DOCTORS, BLOOD_BANKS } from "../data/seed.js";

const router = Router();

router.post("/auth/login", (req, res) => {
  const { email, password } = req.body;
  const user = USERS.find((u) => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const { password: _, ...safeUser } = user;
  return res.json({ token: `demo-token-${user.id}`, user: safeUser });
});

router.post("/auth/signup", (req, res) => {
  const data = req.body;
  
  // Normalize role
  let role = String(data.role || "patient").toLowerCase();
  if (role === "lab tech") role = "lab";
  if (role === "blood bank") role = "blood_bank";
  
  const newUser = {
    id: USERS.length + 1,
    fullName: data.fullName,
    email: data.email,
    role: role,
    password: data.password,
    avatar: "",
  };
  USERS.push(newUser);
  
  // Create role-specific records
  if (role === "patient") {
    const newPatient = {
      id: PATIENTS.length + 1,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone || "",
      dateOfBirth: data.dateOfBirth || "",
      gender: data.gender || "",
      bloodGroup: data.bloodGroup || "",
      allergies: data.allergies ? String(data.allergies).split(",").map((a) => a.trim()) : [],
      existingConditions: data.existingConditions ? String(data.existingConditions).split(",").map((c) => c.trim()) : [],
      lastVisit: null,
      vaccinationStatus: "Pending verification",
    };
    PATIENTS.push(newPatient);
  } else if (role === "doctor") {
    const newDoctor = {
      id: DOCTORS.length + 1,
      fullName: data.fullName,
      email: data.email,
      specialty: data.specialty || "",
      degree: data.degree || "",
      registrationNumber: data.registrationNumber || "",
      hospital: data.hospital || "",
      location: data.location || "",
      experience: parseInt(data.experience) || 0,
      fee: parseInt(data.fee) || 0,
      activePatients: 0,
      status: "active",
      rating: 5.0,
    };
    DOCTORS.push(newDoctor);
  } else if (role === "blood_bank") {
    const newBloodBank = {
      id: BLOOD_BANKS.length + 1,
      name: data.labName || "",
      location: data.address || "",
      phone: data.phone || "",
      email: data.email,
      managerId: newUser.id,
      stock: {
        "O+": 30, "O-": 10, "A+": 25, "A-": 8,
        "B+": 35, "B-": 10, "AB+": 15, "AB-": 5,
      },
    };
    BLOOD_BANKS.push(newBloodBank);
  }
  
  const { password: _, ...safeUser } = newUser;
  return res.status(201).json({ token: `demo-token-${newUser.id}`, user: safeUser });
});

router.post("/auth/logout", (_req, res) => {
  return res.json({ message: "Logged out successfully" });
});

export default router;
