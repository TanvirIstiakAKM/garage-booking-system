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


app.post("/api/contact", async (req, res) => {
  const { name, email, message } = req.body || {};

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof message !== "string" ||
    !name.trim() ||
    !email.trim() ||
    !message.trim()
  ) {
    return res.status(400).json({
      success: false,
      message: "Name, email and message are required.",
    });
  }

  if (name.trim().length > 100 ||
    email.trim().length > 254 ||
    message.trim().length > 3000) {
    return res.status(400).json({
      success: false,
      message: "Please shorten your enquiry and try again.",
    });
  }

  try {
    await emailTransporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      replyTo: email.trim(),
      subject: "New Website Enquiry - Garage Booking System",
      text:
        `New customer enquiry\n\n` +
        `Name: ${name.trim()}\n` +
        `Email: ${email.trim()}\n\n` +
        `Message:\n${message.trim()}`,
    });

    return res.status(200).json({
      success: true,
      message: "Your enquiry has been sent successfully.",
    });
  } catch (error) {
    console.error("Contact enquiry email failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to send your enquiry right now. Please try again later.",
    });
  }
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


app.post(
  "/api/bookings/:id/invoice",
  authenticateToken,
  async (req, res) => {
    const client = await pool.connect();
    let invoiceId;

    try {
      const { id } = req.params;

      const bookingResult = await client.query(
        "SELECT * FROM bookings WHERE id = $1",
        [id]
      );

      if (bookingResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Booking not found.",
        });
      }

      const booking = bookingResult.rows[0];

      if (booking.status !== "completed") {
        return res.status(400).json({
          success: false,
          message: "Only completed bookings can be invoiced.",
        });
      }

      const prices = {
        "General Service": 18900,
        "Tyres & Wheels": 11000,
        "Mechanical Repairs": 9900,
      };

      const totalCents = prices[booking.service];

      if (!totalCents) {
        return res.status(400).json({
          success: false,
          message: "No provisional price is configured for this service.",
        });
      }

      await client.query("BEGIN");

      await client.query(`
        CREATE TABLE IF NOT EXISTS booking_invoices (
          id BIGSERIAL PRIMARY KEY,
          booking_id INTEGER NOT NULL UNIQUE REFERENCES bookings(id),
          invoice_number VARCHAR(50) NOT NULL UNIQUE,
          total_cents INTEGER NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          sent_at TIMESTAMPTZ
        )
      `);

      const existing = await client.query(
        "SELECT id, status FROM booking_invoices WHERE booking_id = $1",
        [booking.id]
      );

      if (existing.rows.length > 0) {
        await client.query("ROLLBACK");

        return res.status(409).json({
          success: false,
          message:
            "An invoice record already exists for this booking. Duplicate invoices are not generated.",
        });
      }

      const invoiceNumber =
        "AA-" +
        new Date().toISOString().slice(0, 10).replace(/-/g, "") +
        "-" +
        crypto.randomBytes(3).toString("hex").toUpperCase();

      const invoiceResult = await client.query(
        `INSERT INTO booking_invoices
          (booking_id, invoice_number, total_cents, status)
         VALUES ($1, $2, $3, 'pending')
         RETURNING id`,
        [booking.id, invoiceNumber, totalCents]
      );

      invoiceId = invoiceResult.rows[0].id;

      await client.query("COMMIT");

      const money = (cents) =>
        (cents / 100).toLocaleString("en-AU", {
          style: "currency",
          currency: "AUD",
        });

      const escapeHtml = (value) =>
        String(value ?? "").replace(/[&<>"']/g, (character) => ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[character]);

      const serviceDescription =
        booking.service === "Mechanical Repairs"
          ? "Initial mechanical inspection (provisional)"
          : booking.service === "Tyres & Wheels"
            ? "One tyre — provisional fitted-tyre allowance"
            : "Standard vehicle service (provisional)";

      const gstCents = Math.round(totalCents / 11);
      const subtotalCents = totalCents - gstCents;

      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Invoice ${escapeHtml(invoiceNumber)}</title>
        </head>
        <body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#172033;padding:24px 10px;">
          <div style="max-width:650px;margin:auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0;">
            <div style="background:#111827;padding:28px 32px;color:#ffffff;">
              <p style="margin:0 0 8px;color:#93c5fd;font-size:12px;letter-spacing:2px;">ADELAIDE AUTOMOTIVE</p>
              <h1 style="margin:0;font-size:28px;">Service invoice</h1>
              <p style="margin:10px 0 0;color:#d1d5db;">Prototype invoice — provisional pricing</p>
            </div>
            <div style="padding:28px 32px;">
              <p>Hello ${escapeHtml(booking.name)},</p>
              <p>Your completed service has an invoice record. Please review the provisional charge below and contact the garage to confirm the final amount and payment arrangements.</p>
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:18px;margin:22px 0;">
                <p style="margin:0 0 8px;"><strong>Invoice reference:</strong> ${escapeHtml(invoiceNumber)}</p>
                <p style="margin:0 0 8px;"><strong>Booking reference:</strong> ${escapeHtml(booking.id)}</p>
                <p style="margin:0 0 8px;"><strong>Vehicle:</strong> ${escapeHtml(booking.registration)}</p>
                <p style="margin:0;"><strong>Service date:</strong> ${escapeHtml(booking.appointment_date)}</p>
              </div>
              <table style="width:100%;border-collapse:collapse;font-size:14px;">
                <thead>
                  <tr style="background:#f1f5f9;text-align:left;">
                    <th style="padding:12px 8px;">Description</th>
                    <th style="padding:12px 8px;text-align:right;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="padding:16px 8px;border-bottom:1px solid #e2e8f0;">${escapeHtml(serviceDescription)}</td>
                    <td style="padding:16px 8px;text-align:right;border-bottom:1px solid #e2e8f0;">${money(totalCents)}</td>
                  </tr>
                </tbody>
              </table>
              <div style="margin-top:18px;text-align:right;line-height:1.9;">
                <div>Illustrative GST component: ${money(gstCents)}</div>
                <div style="font-size:22px;font-weight:bold;color:#111827;">Provisional total: ${money(totalCents)}</div>
              </div>
              <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:14px;margin-top:24px;font-size:13px;line-height:1.6;">
                <strong>Important:</strong> This is a prototype invoice using hypothetical market-based prices. It is not confirmation of an amount owed or proof of payment. GST treatment and the final charge must be verified by the garage before real-world use.
              </div>
              <p style="margin-top:28px;">Regards,<br><strong>Adelaide Automotive</strong></p>
            </div>
          </div>
        </body>
        </html>
      `;

      const text =
        `Adelaide Automotive — Provisional Service Invoice\n\n` +
        `Invoice reference: ${invoiceNumber}\n` +
        `Booking reference: ${booking.id}\n` +
        `Customer: ${booking.name}\n` +
        `Vehicle: ${booking.registration}\n` +
        `Service: ${serviceDescription}\n` +
        `Illustrative GST component: ${money(gstCents)}\n` +
        `Provisional total: ${money(totalCents)}\n\n` +
        "Prototype pricing only. Confirm the final amount and GST treatment with the garage. This email is not proof of payment.";

      await emailTransporter.sendMail({
        from: process.env.EMAIL_USER,
        to: booking.email,
        subject: `Provisional Service Invoice ${invoiceNumber} - Adelaide Automotive`,
        text,
        html,
      });

      await pool.query(
        `UPDATE booking_invoices
         SET status = 'sent', sent_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [invoiceId]
      );

      return res.status(200).json({
        success: true,
        message: "Provisional invoice email sent successfully.",
        invoiceNumber,
      });
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Invoice transaction rollback failed:", rollbackError);
      }

      console.error("Invoice generation or email failed:", error);

      if (invoiceId) {
        try {
          await pool.query(
            `UPDATE booking_invoices SET status = 'failed' WHERE id = $1`,
            [invoiceId]
          );
        } catch (updateError) {
          console.error("Invoice failure status update failed:", updateError);
        }
      }

      return res.status(500).json({
        success: false,
        message:
          "Invoice email could not be completed. Check the server log before retrying.",
      });
    } finally {
      client.release();
    }
  }
);

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

      const allowedStatuses = [
        "pending",
        "confirmed",
        "cancelled",
        "completed",
      ];

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

      const booking = result.rows[0];

      if (status === "cancelled" || status === "completed") {
        try {
          const isCancelled = status === "cancelled";

          await emailTransporter.sendMail({
            from: process.env.EMAIL_USER,
            to: booking.email,
            subject: isCancelled
              ? "Appointment Cancellation - Garage Booking System"
              : "Service Completed - Garage Booking System",

            text:
              `Hello ${booking.name},\n\n` +
              (isCancelled
                ? "Your appointment has been cancelled."
                : "Your vehicle service has been marked as completed.") +
              `\n\nService: ${booking.service}\n` +
              `Vehicle Registration: ${booking.registration}\n` +
              `Date: ${booking.appointment_date}\n` +
              `Time: ${booking.appointment_time}\n\n` +
              "Regards,\nGarage Booking System",

            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 30px auto; padding: 24px; color: #1f2937;">
          <h2 style="color: #111827;">
            ${isCancelled ? "Appointment Cancelled" : "Service Completed"}
          </h2>
          <p>Hello ${booking.name},</p>
          <p>
            ${isCancelled
                ? "Your appointment has been cancelled."
                : "Your vehicle service has been marked as completed."
              }
          </p>
          <p><strong>Service:</strong> ${booking.service}</p>
          <p><strong>Vehicle Registration:</strong> ${booking.registration}</p>
          <p><strong>Date:</strong> ${booking.appointment_date}</p>
          <p><strong>Time:</strong> ${booking.appointment_time}</p>
          <p>Regards,<br>Garage Booking System</p>
        </div>
      `,
          });

          console.log(`${status} notification email sent:`, booking.email);
        } catch (emailError) {
          console.error(`${status} notification email failed:`, emailError);
        }
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