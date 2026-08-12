// Mirrors Backend/utils/validators.js so client and server never disagree
// about what counts as a valid email or a strong-enough password. The one
// thing that can't be mirrored here is the backend's MX/DNS deliverability
// check (browsers can't do DNS lookups) — that's enforced server-side on
// registration and surfaces as a normal error message if it fails.

const EMAIL_PATTERN = /^([a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*)@([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,24})$/;

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "guerrillamail.info", "10minutemail.com",
  "10minutemail.net", "tempmail.com", "temp-mail.org", "yopmail.com", "yopmail.fr",
  "throwawaymail.com", "trashmail.com", "getnada.com", "fakeinbox.com",
  "sharklasers.com", "dispostable.com", "maildrop.cc", "mintemail.com",
  "mohmal.com", "moakt.com", "tempinbox.com", "emailondeck.com",
  "throwam.com", "spamgourmet.com", "mailnesia.com", "mytemp.email",
  "tempr.email", "discard.email", "spambog.com", "trbvm.com", "fakemail.net",
]);

// Structural check only — no business-rule filtering. Use this for
// login/forgot-password, where the goal is "does this look like an email"
// for a pre-existing account, not "would this pass signup today".
export const getEmailFormatError = (email) => {
  if (!email || !email.trim()) return "Email is required.";

  const trimmed = email.trim();
  if (trimmed.length > 254) return "That email address is too long.";

  const match = trimmed.match(EMAIL_PATTERN);
  if (!match) return "Please enter a valid email address (e.g. name@example.com).";

  const [, localPart] = match;
  if (localPart.length > 64) return "Please enter a valid email address.";

  return null;
};

export const isValidEmail = (email) => getEmailFormatError(email) === null;

// Signup-time check: format PLUS "is this an acceptable address to
// register with" (not a known disposable/throwaway domain). Use this on
// the Register page; use isValidEmail() on Login/ForgotPassword so a
// pre-existing account is never blocked by a policy that only makes
// sense at signup.
export const getEmailError = (email) => {
  const formatError = getEmailFormatError(email);
  if (formatError) return formatError;

  const domain = email.trim().split("@")[1];
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain.toLowerCase())) {
    return "Please use a real, permanent email address — temporary or disposable addresses aren't accepted.";
  }

  return null;
};

const COMMON_WEAK_PASSWORDS = new Set([
  "password", "password1", "password123", "password!", "password1!",
  "12345678", "123456789", "qwertyui", "qwerty123", "qwerty123!",
  "11111111", "00000000", "abcdefgh", "letmein1", "letmein1!",
  "iloveyou", "iloveyou1", "admin123", "admin123!", "welcome1",
  "welcome1!", "changeme", "changeme1", "trustno1", "monkey123",
]);

const SPECIAL_CHAR_PATTERN = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/;

// Returns null if the password is strong enough, otherwise a user-facing
// message describing what's missing. Rule: at least 8 characters,
// containing a letter, a number, AND a special character, and not one of
// the common throwaway passwords.
export const validatePasswordStrength = (password) => {
  if (!password) return "Password is required.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password.length > 128) return "Password is too long.";
  if (!/[a-zA-Z]/.test(password)) return "Password must contain at least one letter.";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number.";
  if (!SPECIAL_CHAR_PATTERN.test(password)) {
    return "Password must contain at least one special character (e.g. ! @ # $ % &).";
  }
  if (COMMON_WEAK_PASSWORDS.has(password.toLowerCase())) {
    return "This password is too common. Please choose a stronger one.";
  }
  return null;
};

// Per-rule pass/fail breakdown for a live "requirements checklist" UI —
// lets a form show all four rules at once with individual checkmarks,
// instead of one message at a time.
export const getPasswordChecklist = (password) => {
  const value = password || "";
  return [
    { label: "At least 8 characters", met: value.length >= 8 },
    { label: "Contains a letter", met: /[a-zA-Z]/.test(value) },
    { label: "Contains a number", met: /[0-9]/.test(value) },
    { label: "Contains a special character", met: SPECIAL_CHAR_PATTERN.test(value) },
  ];
};
