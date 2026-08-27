const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Garage Booking System backend is running",
  });
});

app.post("/api/bookings", async (req, res) => {
  const {
    name,
    phone,
    registration,
    service,
    date,
    time,
  } = req.body;

  if (!name || !phone || !registration || !service || !date || !time) {
    return res.status(400).json({
      success: false,
      message: "Please provide all booking details",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO bookings
       (name, phone, registration, service, appointment_date, appointment_time)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, phone, registration, service, date, time]
    );

    console.log("Booking saved to PostgreSQL:", result.rows[0]);

    res.status(201).json({
      success: true,
      message: "Booking saved successfully",
      booking: result.rows[0],
    });
  } catch (error) {
    console.error("Database insert failed:", error);

    res.status(500).json({
      success: false,
      message: "Unable to save booking to the database",
    });
  }
});

app.get("/api/bookings", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM bookings
       ORDER BY appointment_date ASC, appointment_time ASC`
    );

    res.json({
      success: true,
      bookings: result.rows,
    });
  } catch (error) {
    console.error("Failed to fetch bookings:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch bookings",
    });
  }
});

app.patch("/api/bookings/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["pending", "confirmed", "cancelled"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking status",
      });
    }

    const result = await pool.query(
      `UPDATE bookings
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.json({
      success: true,
      message: "Booking status updated successfully",
      booking: result.rows[0],
    });
  } catch (error) {
    console.error("Failed to update booking status:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update booking status",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});