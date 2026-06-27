
// lib/mailer.js
// Email sender using nodemailer
// Supports Gmail, Outlook, or any SMTP provider
// Set these in .env.local:
//   EMAIL_HOST=smtp.gmail.com
//   EMAIL_PORT=587
//   EMAIL_USER=your@gmail.com
//   EMAIL_PASS=your-app-password   (Gmail: use App Password, not your main password)
//   EMAIL_FROM="Rushes <your@gmail.com>"

import nodemailer from "nodemailer";

function getTransporter() {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || "smtp.gmail.com",
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
}

export async function sendVerificationEmail(to, name) {
    // Skip if email is not configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log("📧 Email not configured — skipping welcome email for:", to);
        return;
    }

    const transporter = getTransporter();

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || `"Rushes" <${process.env.EMAIL_USER}>`,
        to,
        subject: "Welcome to Rushes 🎬",
        html: `
      <div style="font-family:sans-serif;background:#0a0a0a;color:#fff;padding:40px;max-width:500px;margin:auto;border-radius:16px;">
        <h1 style="color:#e50914;margin-bottom:8px;">🎬 Rushes</h1>
        <h2 style="font-weight:600;margin-bottom:16px;">Welcome, ${name}!</h2>
        <p style="color:#aaa;line-height:1.7;">
          Your account has been created successfully.<br/>
          Start discovering top movies, series and anime — and save your favourites.
        </p>
        <div style="margin-top:32px;padding:16px;background:#1a1a1a;border-radius:12px;border:1px solid #333;">
          <p style="margin:0;color:#aaa;font-size:13px;">
            Go to your profile to pick favourite genres and get personalised recommendations.
          </p>
        </div>
        <p style="color:#555;font-size:11px;margin-top:32px;">
          This product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
      </div>
    `,
    });
}

export async function sendPasswordResetEmail(to, resetToken) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://rushes.theorbit.in")}/reset-password?token=${resetToken}`;
    const transporter = getTransporter();

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || `"Rushes" <${process.env.EMAIL_USER}>`,
        to,
        subject: "Reset your Rushes password",
        html: `
      <div style="font-family:sans-serif;background:#0a0a0a;color:#fff;padding:40px;max-width:500px;margin:auto;border-radius:16px;">
        <h1 style="color:#e50914;">🎬 Rushes</h1>
        <h2>Password Reset</h2>
        <p style="color:#aaa;">Click the button below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="display:inline-block;margin-top:20px;background:#e50914;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;">
          Reset Password
        </a>
        <p style="color:#555;font-size:11px;margin-top:32px;">If you didn't request this, ignore this email.</p>
      </div>
    `,
    });
}
