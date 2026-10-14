const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const emailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.staff = decoded;

    next();
  } catch (error) {
    console.error("JWT verification failed:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
}

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Garage Booking System backend is running",
  });
});

app.post("/api/auth/register", async (req, res) => {
  const { full_name, email, password } = req.body || {};

  if (!full_name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Full name, email and password are required",
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters long",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const existingUser = await pool.query(
      `SELECT id, email_verified
       FROM staff_users
       WHERE email = $1`,
      [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const verificationToken = crypto.randomBytes(32).toString("hex");

    const verificationTokenExpiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    );

    const result = await pool.query(
      `INSERT INTO staff_users
       (full_name, email, password_hash, role, is_active, email_verified,
        verification_token, verification_token_expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, full_name, email, role, is_active, email_verified, created_at`,
      [
        full_name.trim(),
        normalizedEmail,
        passwordHash,
        "staff",
        true,
        false,
        verificationToken,
        verificationTokenExpiresAt,
      ]
    );

    const verificationUrl =
      `http://localhost:5173/verify-email?token=${verificationToken}`;

    await emailTransporter.sendMail({
      from: process.env.EMAIL_USER,
      to: normalizedEmail,
      subject: "Verify Your Garage Booking System Staff Account",

      text:
        `Hello ${full_name.trim()},\n\n` +
        `Thank you for registering as a staff member with Garage Booking System.\n\n` +
        `Please verify your email address by opening this link:\n\n` +
        `${verificationUrl}\n\n` +
        `This verification link will expire in 24 hours.\n\n` +
        `If you did not create this account, you can safely ignore this email.\n\n` +
        `Regards,\n` +
        `Garage Booking System`,

      html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Staff Account</title>
    </head>

    <body style="
      margin: 0;
      padding: 0;
      background-color: #f4f6f8;
      font-family: Arial, Helvetica, sans-serif;
      color: #1f2937;
    ">

      <div style="
        max-width: 600px;
        margin: 40px auto;
        padding: 0 20px;
      ">

        <div style="
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
        ">

          <div style="
            background-color: #111827;
            padding: 28px 30px;
            text-align: center;
          ">
            <h1 style="
              margin: 0;
              color: #ffffff;
              font-size: 24px;
            ">
              Garage Booking System
            </h1>

            <p style="
              margin: 8px 0 0;
              color: #d1d5db;
              font-size: 14px;
            ">
              Staff Account Verification
            </p>
          </div>

          <div style="
            padding: 35px 30px;
          ">

            <h2 style="
              margin-top: 0;
              font-size: 22px;
              color: #111827;
            ">
              Verify your email address
            </h2>

            <p style="
              font-size: 16px;
              line-height: 1.6;
            ">
              Hello <strong>${full_name.trim()}</strong>,
            </p>

            <p style="
              font-size: 16px;
              line-height: 1.6;
            ">
              Thank you for registering as a staff member with
              Garage Booking System.
            </p>

            <p style="
              font-size: 16px;
              line-height: 1.6;
            ">
              Please verify your email address by clicking the button below.
            </p>

            <div style="
              text-align: center;
              margin: 30px 0;
            ">
              <a
                href="${verificationUrl}"
                style="
                  display: inline-block;
                  padding: 14px 28px;
                  background-color: #2563eb;
                  color: #ffffff;
                  text-decoration: none;
                  border-radius: 8px;
                  font-size: 16px;
                  font-weight: bold;
                "
              >
                Verify My Email
              </a>
            </div>

            <div style="
              background-color: #f9fafb;
              border-radius: 8px;
              padding: 16px;
              margin-top: 25px;
            ">

              <p style="
                margin: 0;
                font-size: 14px;
                line-height: 1.5;
                color: #4b5563;
              ">
                <strong>Important:</strong>
                This verification link will expire in 24 hours.
              </p>

            </div>

            <p style="
              margin-top: 25px;
              font-size: 14px;
              line-height: 1.5;
              color: #6b7280;
            ">
              If you did not create this staff account, you can safely
              ignore this email.
            </p>

            <p style="
              margin-top: 30px;
              font-size: 15px;
              line-height: 1.5;
            ">
              Regards,<br>
              <strong>Garage Booking System</strong>
            </p>

          </div>

          <div style="
            background-color: #f9fafb;
            padding: 18px 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
          ">
            <p style="
              margin: 0;
              font-size: 12px;
              color: #9ca3af;
            ">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>

        </div>

      </div>

    </body>
    </html>
  `,
    });

    res.status(201).json({
      success: true,
      message:
        "Registration successful. Please check your email to verify your account.",
      staff: result.rows[0],
    });
  } catch (error) {
    console.error("Staff registration failed:", error);

    res.status(500).json({
      success: false,
      message: "Unable to complete staff registration",
    });
  }
});

app.get("/api/auth/verify-email", async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: "Verification token is required",
    });
  }

  try {
    const result = await pool.query(
      `SELECT id, full_name, email, email_verified,
              verification_token_expires_at
       FROM staff_users
       WHERE verification_token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification link",
      });
    }

    const staff = result.rows[0];

    if (staff.email_verified) {
      return res.json({
        success: true,
        message: "Your email address has already been verified.",
      });
    }

    if (
      !staff.verification_token_expires_at ||
      new Date(staff.verification_token_expires_at) < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This verification link has expired. Please request a new verification email.",
      });
    }

    const updateResult = await pool.query(
      `UPDATE staff_users
       SET email_verified = TRUE,
           verification_token = NULL,
           verification_token_expires_at = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, full_name, email, role, is_active, email_verified`,
      [staff.id]
    );

    return res.json({
      success: true,
      message:
        "Email verified successfully. Your staff account is now active.",
      staff: updateResult.rows[0],
    });

  } catch (error) {
    console.error("Email verification failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify email address",
    });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const result = await pool.query(
      `SELECT
         id,
         full_name,
         email,
         password_hash,
         role,
         is_active,
         email_verified
       FROM staff_users
       WHERE email = $1`,
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const staff = result.rows[0];

    if (!staff.is_active) {
      return res.status(403).json({
        success: false,
        message: "This staff account is inactive",
      });
    }

    if (!staff.email_verified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email address before logging in",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      staff.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        id: staff.id,
        email: staff.email,
        role: staff.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "8h",
      }
    );

    return res.json({
      success: true,
      message: "Login successful",
      token,
      staff: {
        id: staff.id,
        full_name: staff.full_name,
        email: staff.email,
        role: staff.role,
      },
    });
  } catch (error) {
    console.error("Staff login failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to process login",
    });
  }
});

app.post("/api/bookings", async (req, res) => {
  const {
    name,
    email,
    phone,
    registration,
    service,
    date,
    time,
  } = req.body;

  if (!name || !email || !phone || !registration || !service || !date || !time) {
    return res.status(400).json({
      success: false,
      message: "Please provide all booking details including email",
    });
  }

  try {
    // Check whether the requested appointment slot is already occupied.
    // Cancelled bookings do not block the slot.
    const availabilityResult = await pool.query(
      `SELECT id
       FROM bookings
       WHERE appointment_date = $1
         AND appointment_time = $2
         AND status <> 'cancelled'
       LIMIT 1`,
      [date, time]
    );

    if (availabilityResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "This appointment time is no longer available. Please choose another date or time.",
      });
    }

    const result = await pool.query(
      `INSERT INTO bookings
   (name, email, phone, registration, service, appointment_date, appointment_time)
   VALUES ($1, $2, $3, $4, $5, $6, $7)
   RETURNING *`,
      [name, email, phone, registration, service, date, time]
    );

    const booking = result.rows[0];

    console.log("Booking saved to PostgreSQL:", booking);

    try {
      await emailTransporter.sendMail({
        from: process.env.EMAIL_USER,
        to: booking.email,
        subject: "Booking Confirmation - Garage Booking System",

        text:
          `Hello ${booking.name},\n\n` +
          `Thank you for booking a service with Garage Booking System.\n\n` +
          `Your appointment details are:\n\n` +
          `Service: ${booking.service}\n` +
          `Vehicle Registration: ${booking.registration}\n` +
          `Date: ${booking.appointment_date}\n` +
          `Time: ${booking.appointment_time}\n\n` +
          `Your booking has been received successfully and is currently pending confirmation by our staff.\n\n` +
          `Regards,\n` +
          `Garage Booking System`,

        html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Confirmation</title>
      </head>

      <body style="
        margin: 0;
        padding: 0;
        background-color: #f4f6f8;
        font-family: Arial, Helvetica, sans-serif;
        color: #1f2937;
      ">

        <div style="
          max-width: 600px;
          margin: 40px auto;
          padding: 0 20px;
        ">

          <div style="
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 16px rgba(0,0,0,0.08);
          ">

            <div style="
              background-color: #111827;
              padding: 28px 30px;
              text-align: center;
            ">
              <h1 style="
                margin: 0;
                color: #ffffff;
                font-size: 24px;
              ">
                Garage Booking System
              </h1>

              <p style="
                margin: 8px 0 0;
                color: #d1d5db;
                font-size: 14px;
              ">
                Booking Confirmation
              </p>
            </div>

            <div style="
              padding: 35px 30px;
            ">

              <h2 style="
                margin-top: 0;
                font-size: 22px;
                color: #111827;
              ">
                Your booking has been received
              </h2>

              <p style="
                font-size: 16px;
                line-height: 1.6;
              ">
                Hello <strong>${booking.name}</strong>,
              </p>

              <p style="
                font-size: 16px;
                line-height: 1.6;
              ">
                Thank you for booking a service with Garage Booking System.
                Your appointment request has been received successfully.
              </p>

              <div style="
                background-color: #f9fafb;
                border-radius: 8px;
                padding: 20px;
                margin: 25px 0;
              ">

                <p style="margin: 0 0 10px;">
                  <strong>Service:</strong> ${booking.service}
                </p>

                <p style="margin: 0 0 10px;">
                  <strong>Vehicle Registration:</strong> ${booking.registration}
                </p>

                <p style="margin: 0 0 10px;">
                  <strong>Date:</strong> ${booking.appointment_date}
                </p>

                <p style="margin: 0;">
                  <strong>Time:</strong> ${booking.appointment_time}
                </p>

              </div>

              <p style="
                font-size: 15px;
                line-height: 1.6;
                color: #4b5563;
              ">
                Your booking is currently <strong>pending confirmation</strong>.
                Our staff will review the appointment and update its status.
              </p>

              <p style="
                margin-top: 30px;
                font-size: 15px;
                line-height: 1.5;
              ">
                Regards,<br>
                <strong>Garage Booking System</strong>
              </p>

            </div>

            <div style="
              background-color: #f9fafb;
              padding: 18px 30px;
              text-align: center;
              border-top: 1px solid #e5e7eb;
            ">
              <p style="
                margin: 0;
                font-size: 12px;
                color: #9ca3af;
              ">
                This is an automated message. Please do not reply to this email.
              </p>
            </div>

          </div>

        </div>

      </body>
      </html>
    `,
      });

      console.log("Booking confirmation email sent:", booking.email);

      return res.status(201).json({
        success: true,
        message: "Booking saved successfully and confirmation email sent",
        booking,
      });
    } catch (emailError) {
      console.error("Booking confirmation email failed:", emailError);

      return res.status(201).json({
        success: true,
        message:
          "Booking saved successfully, but the confirmation email could not be sent",
        booking,
      });
    }
  } catch (error) {
    console.error("Database insert failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to save booking to the database",
    });
  }
});

app.get("/api/bookings", authenticateToken, async (req, res) => {
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

app.patch(
  "/api/bookings/:id/status",
  authenticateToken,
  async (req, res) => {
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