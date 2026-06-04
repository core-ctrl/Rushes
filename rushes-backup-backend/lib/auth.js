const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = "7d";

if (!JWT_SECRET) {
  // Use a fallback for build time/pre-env checks
  console.warn("WARNING: JWT_SECRET is not set in environment variables");
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET || "temp_secret", { expiresIn: JWT_EXPIRES });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET || "temp_secret");
  } catch {
    return null;
  }
}

function getUserFromRequest(req) {
  // Support both cookie and Authorization header token resolution
  let token = null;
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }
  
  if (!token) return null;
  return verifyToken(token);
}

module.exports = {
  signToken,
  verifyToken,
  getUserFromRequest
};
