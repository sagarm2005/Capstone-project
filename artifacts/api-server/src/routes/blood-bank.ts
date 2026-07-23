import { Router } from "express";
import { BLOOD_BANKS, BLOOD_RESERVATIONS, PATIENTS } from "../data/seed.js";

const router = Router();

// Get all blood banks with their stock
router.get("/blood-banks", (req, res) => {
  const banks = BLOOD_BANKS.map((bank) => ({
    id: bank.id,
    name: bank.name,
    location: bank.location,
    phone: bank.phone,
    email: bank.email,
    stock: bank.stock,
  }));
  return res.json(banks);
});

// Get specific blood bank details
router.get("/blood-banks/:id", (req, res) => {
  const bank = BLOOD_BANKS.find((b) => b.id === parseInt(req.params.id));
  if (!bank) return res.status(404).json({ error: "Blood bank not found" });
  return res.json(bank);
});

// Get blood bank dashboard (for blood bank staff)
router.get("/blood-banks/:id/dashboard", (req, res) => {
  const bank = BLOOD_BANKS.find((b) => b.id === parseInt(req.params.id));
  if (!bank) return res.status(404).json({ error: "Blood bank not found" });

  const reservations = BLOOD_RESERVATIONS.filter(
    (r) => r.bloodBankId === bank.id
  );

  return res.json({
    bank,
    stock: bank.stock,
    reservations,
    totalReservations: reservations.length,
  });
});

// Update blood stock (add or subtract)
router.patch("/blood-banks/:id/stock", (req, res) => {
  const { bloodGroup, quantity, action } = req.body; // action: "add" or "subtract"

  const bank = BLOOD_BANKS.find((b) => b.id === parseInt(req.params.id));
  if (!bank) return res.status(404).json({ error: "Blood bank not found" });

  if (!bank.stock[bloodGroup]) {
    return res.status(400).json({ error: "Invalid blood group" });
  }

  if (action === "add") {
    bank.stock[bloodGroup] += quantity;
  } else if (action === "subtract") {
    if (bank.stock[bloodGroup] < quantity) {
      return res.status(400).json({ error: "Insufficient stock" });
    }
    bank.stock[bloodGroup] -= quantity;
  } else {
    return res.status(400).json({ error: "Invalid action" });
  }

  return res.json({
    message: "Stock updated",
    bloodGroup,
    newStock: bank.stock[bloodGroup],
  });
});

// Doctor requests blood reservation
router.post("/blood-banks/:id/reserve", (req, res) => {
  const { doctorId, doctorName, patientId, patientName, bloodGroup, units } =
    req.body;

  const bank = BLOOD_BANKS.find((b) => b.id === parseInt(req.params.id));
  if (!bank) return res.status(404).json({ error: "Blood bank not found" });

  if (!bank.stock[bloodGroup]) {
    return res.status(400).json({ error: "Invalid blood group" });
  }

  if (bank.stock[bloodGroup] < units) {
    return res.status(400).json({
      error: `Insufficient stock. Available: ${bank.stock[bloodGroup]} units`,
    });
  }

  // Create reservation
  const newReservation = {
    id: BLOOD_RESERVATIONS.length + 1,
    bloodBankId: bank.id,
    doctorId,
    doctorName,
    patientId,
    patientName,
    bloodGroup,
    units,
    status: "reserved",
    reservedDate: new Date().toISOString().split("T")[0],
    expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0], // 3 days expiry
    createdAt: new Date().toISOString(),
  };

  // Deduct from stock
  bank.stock[bloodGroup] -= units;

  BLOOD_RESERVATIONS.push(newReservation);

  return res.status(201).json(newReservation);
});

// Get blood reservations for a doctor
router.get("/blood-reservations", (req, res) => {
  const { doctorId, bloodBankId } = req.query;
  let reservations = [...BLOOD_RESERVATIONS];

  if (doctorId) {
    reservations = reservations.filter((r) => r.doctorId === parseInt(doctorId as string));
  }
  if (bloodBankId) {
    reservations = reservations.filter((r) => r.bloodBankId === parseInt(bloodBankId as string));
  }

  return res.json(reservations);
});

// Update reservation status
router.patch("/blood-reservations/:id", (req, res) => {
  const { status } = req.body; // "reserved" | "collected" | "cancelled"

  const reservation = BLOOD_RESERVATIONS.find(
    (r) => r.id === parseInt(req.params.id)
  );
  if (!reservation) return res.status(404).json({ error: "Reservation not found" });

  const oldStatus = reservation.status;
  reservation.status = status;

  // If cancelled, return stock
  if (status === "cancelled" && oldStatus === "reserved") {
    const bank = BLOOD_BANKS.find((b) => b.id === reservation.bloodBankId);
    if (bank) {
      bank.stock[reservation.bloodGroup] += reservation.units;
    }
  }

  return res.json(reservation);
});

export default router;
