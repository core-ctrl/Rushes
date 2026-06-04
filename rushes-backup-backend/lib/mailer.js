const {
  sendLoginThankYouEmail,
  sendDecisionAlertEmail,
  sendOTPEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} = require("./sendEmail");

async function sendPasswordChangedEmail(email, username) {
  return undefined;
}

module.exports = {
  sendLoginThankYouEmail,
  sendDecisionAlertEmail,
  sendOTPEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordChangedEmail
};
