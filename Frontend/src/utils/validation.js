// Mirrors Backend/utils/validators.js so client and server never disagree
// about what counts as a valid email or a strong-enough password.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (email) => EMAIL_PATTERN.test((email || "").trim());

const COMMON_WEAK_PASSWORDS = new Set([
  "password", "password1", "password123", "12345678", "123456789",
  "qwertyui", "qwerty123", "11111111", "00000000", "abcdefgh",
  "letmein1", "iloveyou", "admin123", "welcome1", "changeme",
]);

// Returns null if the password is strong enough, otherwise a user-facing
// message describing what's missing.
export const validatePasswordStrength = (password) => {
  if (!password) return "Password is required.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password.length > 128) return "Password is too long.";
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must contain at least one letter and one number.";
  }
  if (COMMON_WEAK_PASSWORDS.has(password.toLowerCase())) {
    return "This password is too common. Please choose a stronger one.";
  }
  return null;
};
