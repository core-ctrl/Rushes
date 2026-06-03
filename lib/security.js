const SCANNER_USER_AGENTS = /(sqlmap|nikto|nessus|acunetix|nmap|masscan|zgrab|dirbuster|wpscan)/i;

export function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];

  if (Array.isArray(forwarded)) {
    return forwarded[0] || req.socket?.remoteAddress || "unknown";
  }

  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }

  return req.socket?.remoteAddress || "unknown";
}

export function sanitizeText(value, { maxLength = 200, preserveNewLines = false } = {}) {
  const input = typeof value === "string" ? value : String(value || "");
  const withoutTags = input.replace(/<[^>]*>?/g, "");
  const controlCharsPattern = preserveNewLines ? /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]+/g : /[\u0000-\u001F\u007F]+/g;
  const withoutControlChars = withoutTags.replace(controlCharsPattern, "");

  return withoutControlChars
    .replace(/[<>`$]/g, "")
    .replace(/\s+/g, preserveNewLines ? " " : " ")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeEmail(email) {
  return sanitizeText(email, { maxLength: 160 }).toLowerCase();
}

export function sanitizeSearchQuery(query) {
  return sanitizeText(query, { maxLength: 100 }).replace(/[{}[\]|\\]/g, "");
}

export function setPublicCache(res, value = "public, s-maxage=300, stale-while-revalidate=600") {
  res.setHeader("Cache-Control", value);
}

export function isLikelyScanner(userAgent = "") {
  return SCANNER_USER_AGENTS.test(userAgent);
}

export function createApiError(message, status = 400) {
  return { error: message, status };
}

// CSRF token generation
export function generateCsrfToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Validate CSRF token
export function validateCsrfToken(req, token) {
  const headerToken = req.headers['x-csrf-token'];
  return headerToken && headerToken === token;
}

// Sanitize MongoDB query to prevent NoSQL injection
export function sanitizeMongoQuery(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  const sanitized = {};
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$')) continue; // Strip MongoDB operators from user input
    const value = obj[key];
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeMongoQuery(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

// Deep sanitize text fields in an object
export function sanitizeObject(obj, options = {}) {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeText(value, { maxLength: options.maxLength || 5000, preserveNewLines: true });
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = sanitizeObject(value, options);
    } else {
      result[key] = value;
    }
  }
  return result;
}

// Validate and sanitize URL
export function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return '';
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return '';
    return parsed.toString();
  } catch {
    return '';
  }
}

// Bot detection via user agent
export function isBot(userAgent = '') {
  const botPatterns = /bot|crawler|spider|scraper|curl|wget|python-requests|httpie|postman/i;
  return botPatterns.test(userAgent) || isLikelyScanner(userAgent);
}
