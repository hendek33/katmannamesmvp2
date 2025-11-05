/**
 * XSS Protection and Input Sanitization Utilities
 */

/**
 * Escape HTML special characters to prevent XSS attacks
 */
export function escapeHtml(str: string): string {
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };
  
  return String(str).replace(/[&<>"'`=\/]/g, (char) => htmlEscapeMap[char]);
}

/**
 * Strip HTML tags and script content from input
 */
export function stripHtml(str: string): string {
  // Remove script tags and their content
  let cleaned = String(str).replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove all HTML tags
  cleaned = cleaned.replace(/<[^>]*>/g, '');
  
  // Remove javascript: and data: protocols
  cleaned = cleaned.replace(/javascript:/gi, '');
  cleaned = cleaned.replace(/data:/gi, '');
  
  // Remove event handlers
  cleaned = cleaned.replace(/on\w+\s*=/gi, '');
  
  return cleaned.trim();
}

/**
 * Sanitize username input
 * - Strips HTML/scripts
 * - Limits to alphanumeric, spaces, underscores, and dashes
 * - Trims whitespace
 * - Enforces length limits
 */
export function sanitizeUsername(username: string): string {
  if (!username || typeof username !== 'string') {
    return '';
  }
  
  // First strip any HTML/scripts
  let sanitized = stripHtml(username);
  
  // Allow only alphanumeric, spaces, underscores, dashes, and Turkish characters
  sanitized = sanitized.replace(/[^a-zA-Z0-9\s_\-ğĞüÜşŞıİöÖçÇ]/g, '');
  
  // Trim and limit length
  sanitized = sanitized.trim().substring(0, 20);
  
  return sanitized;
}

/**
 * Sanitize password input
 * - Passwords are never displayed, but we still sanitize for safety
 * - Strips HTML tags to prevent stored XSS
 */
export function sanitizePassword(password: string): string {
  if (!password || typeof password !== 'string') {
    return '';
  }
  
  // Strip HTML tags but allow all other characters for password complexity
  let sanitized = stripHtml(password);
  
  // Limit length for safety
  sanitized = sanitized.substring(0, 100);
  
  return sanitized;
}

/**
 * Sanitize room code
 * - Only alphanumeric characters allowed
 */
export function sanitizeRoomCode(roomCode: string): string {
  if (!roomCode || typeof roomCode !== 'string') {
    return '';
  }
  
  // Only allow alphanumeric characters
  let sanitized = roomCode.replace(/[^a-zA-Z0-9]/g, '');
  
  // Convert to uppercase and limit length
  sanitized = sanitized.toUpperCase().substring(0, 6);
  
  return sanitized;
}

/**
 * Validate that a string doesn't contain XSS payloads
 * Returns true if the string is safe, false if it contains potential XSS
 */
export function isXssSafe(str: string): boolean {
  if (!str || typeof str !== 'string') {
    return true;
  }
  
  const xssPatterns = [
    /<script/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<applet/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers like onclick=
    /<img[^>]+src[\\s]*=[\\s]*["\']javascript:/i,
    /data:text\/html/i,
    /<svg/i,
    /<math/i,
    /expression\s*\(/i, // CSS expression
    /import\s*\(/i, // CSS import
    /vbscript:/i,
    /alert\s*\(/i,
    /document\./i,
    /window\./i,
    /eval\s*\(/i
  ];
  
  return !xssPatterns.some(pattern => pattern.test(str));
}