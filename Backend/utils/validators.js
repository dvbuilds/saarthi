// Shared validation rules for auth endpoints (register, login, reset-password).
// Kept in one place so the client and server can never drift on what counts
// as a "valid" email or a "strong enough" password.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (email) => {
    return typeof email === "string" && EMAIL_PATTERN.test(email.trim());
};

// Trivially-weak passwords that technically satisfy "8+ characters" but
// provide no real protection. Not exhaustive — just catches the most
// common throwaway choices.
const COMMON_WEAK_PASSWORDS = new Set([
    "password", "password1", "password123", "12345678", "123456789",
    "qwertyui", "qwerty123", "11111111", "00000000", "abcdefgh",
    "letmein1", "iloveyou", "admin123", "welcome1", "changeme",
]);

/**
 * Returns null if the password meets the minimum-strength bar, or a
 * user-friendly message describing what's missing.
 *
 * Rule: at least 8 characters, containing both a letter and a number,
 * and not one of the common throwaway passwords. Deliberately not
 * requiring special characters/mixed case — that tends to push real
 * users toward "Password1!" patterns without meaningfully raising
 * security, while annoying more people than it protects.
 */
export const validatePasswordStrength = (password) => {
    if (typeof password !== "string" || password.length === 0) {
        return "Password is required.";
    }
    if (password.length < 8) {
        return "Password must be at least 8 characters.";
    }
    if (password.length > 128) {
        return "Password is too long.";
    }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
        return "Password must contain at least one letter and one number.";
    }
    if (COMMON_WEAK_PASSWORDS.has(password.toLowerCase())) {
        return "This password is too common. Please choose a stronger one.";
    }
    return null;
};
