import { sendVerificationEmail } from "../../../lib/sendEmail";

export default async function handler(req, res) {
  if (process.env.NODE_ENV === "production") return res.status(404).end();

  try {
    await sendVerificationEmail(
      req.query.email || process.env.SMTP_USER || process.env.GMAIL_USER,
      "test-token-123",
      "testuser"
    );
    res.json({ success: true, message: "Test email sent - check inbox" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
