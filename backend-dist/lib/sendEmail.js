const nodemailer = require("nodemailer");

const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587", 10),
  secure: false,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

transporter.verify((error) => {
  if (error) {
    console.error("SMTP connection failed:", error.message);
  } else {
    console.log("SMTP ready to send emails");
  }
});

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

function fromAddress() {
  return `"Rushes" <${smtpUser}>`;
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function baseTemplate(content) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background:#0d0d0d;font-family:'Segoe UI',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:500px;background:#161616;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);box-shadow:0 24px 64px rgba(0,0,0,0.6);">

              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#1a0000 0%,#0d0d0d 100%);padding:36px 40px;text-align:center;border-bottom:1px solid rgba(230,57,70,0.3);">
                  <div style="margin-bottom:16px;">
                    <img src="https://res.cloudinary.com/dkrvtfbor/image/upload/e_make_transparent/v1782761174/RUSHES_uupcnx.png" alt="Rushes" style="height:50px;width:auto;" />
                  </div>
                  <p style="margin:6px 0 0;color:rgba(255,255,255,0.35);font-size:11px;letter-spacing:3px;text-transform:uppercase;font-weight:500;">
                    Discover & Connect
                  </p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:40px 40px 32px;">
                  ${content}
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#0f0f0f;padding:24px 40px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);">
                  <p style="margin:0 0 4px;color:rgba(255,255,255,0.2);font-size:11px;line-height:1.7;">
                    Sent by Rushes · <a href="${appUrl()}" style="color:#E63946;text-decoration:none;">${process.env.NEXT_PUBLIC_SITE_URL || 'rushes.theorbit.in'}</a>
                  </p>
                  <p style="margin:0;color:rgba(255,255,255,0.15);font-size:11px;">
                    If you didn't request this, you can safely ignore it.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

const btnStyle = `display:inline-block;background:linear-gradient(135deg,#E63946,#c1121f);color:#ffffff;text-decoration:none;padding:15px 40px;border-radius:12px;font-size:15px;font-weight:700;letter-spacing:0.3px;box-shadow:0 8px 24px rgba(230,57,70,0.35);`;
const headingStyle = `margin:0 0 10px;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;`;
const bodyTextStyle = `margin:0 0 28px;color:rgba(255,255,255,0.55);font-size:15px;line-height:1.7;`;

async function sendVerificationEmail(email, code, username = "there") {
  const content = `
    <h2 style="${headingStyle}">Verify your email</h2>
    <p style="${bodyTextStyle}">
      Hey <strong style="color:#fff;">@${username}</strong>! Use the verification code below to activate your account.
      It expires in <strong style="color:#fff;">10 minutes</strong>.
    </p>

    <div style="text-align:center;margin:0 0 28px;">
      <div style="display:inline-block;background:linear-gradient(135deg,rgba(230,57,70,0.15),rgba(230,57,70,0.05));border:2px solid rgba(230,57,70,0.5);border-radius:16px;padding:24px 48px;">
        <span style="font-size:48px;font-weight:900;color:#E63946;letter-spacing:12px;font-family:monospace;">
          ${code}
        </span>
      </div>
    </div>

    <p style="margin:0;color:rgba(255,255,255,0.25);font-size:12px;text-align:center;">
      🔒 Do not share this code with anyone.
    </p>
  `;

  await transporter.sendMail({
    from: fromAddress(),
    to: email,
    subject: "Verify your Rushes account",
    html: baseTemplate(content),
  });

  console.log(`Verification email sent to ${email}`);
}

async function sendPasswordResetEmail(email, token, username = "there") {
  const resetUrl = `${appUrl()}/reset-password?token=${token}`;

  const content = `
    <h2 style="${headingStyle}">Reset your password</h2>
    <p style="${bodyTextStyle}">
      Hey <strong style="color:#fff;">@${username}</strong>, we received a password reset request.
      Click below — this link expires in <strong style="color:#fff;">1 hour</strong>.
    </p>

    <div style="text-align:center;margin:0 0 28px;">
      <a href="${resetUrl}" style="${btnStyle}">
        🔑 &nbsp;Reset Password
      </a>
    </div>

    <p style="margin:0;color:rgba(255,255,255,0.25);font-size:12px;text-align:center;">
      Didn't request this? Your password is safe — just ignore this email.
    </p>
  `;

  await transporter.sendMail({
    from: fromAddress(),
    to: email,
    subject: "Reset your Rushes password",
    html: baseTemplate(content),
  });

  console.log(`Password reset email sent to ${email}`);
}

async function sendWelcomeEmail(email, username = "there") {
  const content = `
    <h2 style="${headingStyle}">Welcome to Rushes 🎬</h2>
    <p style="${bodyTextStyle}">
      Hey <strong style="color:#fff;">@${username}</strong>, you're officially in.
      Post your takes, find your movie people, and discover cinema that moves you.
    </p>

    <div style="background:rgba(230,57,70,0.06);border:1px solid rgba(230,57,70,0.15);border-radius:12px;padding:20px 24px;margin:0 0 28px;">
      <p style="margin:0 0 10px;color:#fff;font-weight:700;font-size:13px;">🚀 Get started:</p>
      <p style="margin:4px 0;color:rgba(255,255,255,0.5);font-size:13px;">🎯 Complete your taste profile</p>
      <p style="margin:4px 0;color:rgba(255,255,255,0.5);font-size:13px;">🎬 Post your first Take on a movie</p>
      <p style="margin:4px 0;color:rgba(255,255,255,0.5);font-size:13px;">🤝 Find people with your taste</p>
    </div>

    <div style="text-align:center;">
      <a href="${appUrl()}" style="${btnStyle}">
        🎬 &nbsp;Open Rushes
      </a>
    </div>
  `;

  await transporter.sendMail({
    from: fromAddress(),
    to: email,
    subject: "Welcome to Rushes 🎬",
    html: baseTemplate(content),
  });

  console.log(`Welcome email sent to ${email}`);
}

async function sendOTPEmail(email, username = "there") {
  const otp = generateOTP();
  const expiry = new Date(Date.now() + 10 * 60 * 1000);

  const content = `
    <h2 style="${headingStyle}">Your verification code</h2>
    <p style="${bodyTextStyle}">
      Hey <strong style="color:#fff;">@${username}</strong>! Use the code below to verify your account.
      It expires in <strong style="color:#fff;">10 minutes</strong>.
    </p>

    <div style="text-align:center;margin:0 0 28px;">
      <div style="display:inline-block;background:linear-gradient(135deg,rgba(230,57,70,0.15),rgba(230,57,70,0.05));border:2px solid rgba(230,57,70,0.5);border-radius:16px;padding:24px 48px;">
        <span style="font-size:48px;font-weight:900;color:#E63946;letter-spacing:12px;font-family:monospace;">
          ${otp}
        </span>
      </div>
    </div>

    <p style="margin:0;color:rgba(255,255,255,0.25);font-size:12px;text-align:center;">
      🔒 Do not share this code with anyone.
    </p>
  `;

  await transporter.sendMail({
    from: fromAddress(),
    to: email,
    subject: "Your Rushes verification code",
    html: baseTemplate(content),
  });

  console.log(`OTP email sent to ${email}`);
  return { otp, expiry };
}

async function sendLoginThankYouEmail(email, username = "there") {
  const content = `
    <h2 style="${headingStyle}">New sign-in detected</h2>
    <p style="margin:0;color:rgba(255,255,255,0.55);font-size:15px;line-height:1.7;">
      Hey <strong style="color:#fff;">@${username}</strong>, your Rushes account was just used to sign in.
      If that was you — enjoy the movies! 🎬<br><br>
      If it wasn't you, please reset your password immediately.
    </p>
  `;

  await transporter.sendMail({
    from: fromAddress(),
    to: email,
    subject: "New Rushes sign-in",
    html: baseTemplate(content),
  });
}

async function sendDecisionAlertEmail(email, username = "there", message = "", subject = "Rushes alert") {
  const content = `
    <h2 style="${headingStyle}">${subject}</h2>
    <p style="${bodyTextStyle}">
      Hey <strong style="color:#fff;">@${username}</strong>, ${message}
    </p>

    <div style="text-align:center;">
      <a href="${appUrl()}" style="${btnStyle}">
        🎬 &nbsp;Open Rushes
      </a>
    </div>
  `;

  await transporter.sendMail({
    from: fromAddress(),
    to: email,
    subject,
    html: baseTemplate(content),
  });
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendOTPEmail,
  sendLoginThankYouEmail,
  sendDecisionAlertEmail
};
