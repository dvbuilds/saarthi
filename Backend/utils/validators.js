// Shared validation rules for auth endpoints (register, login, reset-password).
// Kept in one place so the client and server can never drift on what counts
// as a "valid" email or a "strong enough" password.
import dns from "node:dns";

// Structural check only — doesn't (and can't, without sending mail) prove
// the inbox exists, but this rejects everything that obviously isn't a
// real address instead of just checking for an "@": a proper top-level
// domain is required, dots can't be doubled or lead/trail either part,
// and both halves stick to the characters real mail systems accept.
const EMAIL_PATTERN = /^([a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*)@([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,24})$/;

// Domains that hand out throwaway inboxes — not a real, ongoing address,
// so not acceptable for account registration. Not exhaustive (new ones
// pop up constantly), just catches the common ones people reach for.
const DISPOSABLE_EMAIL_DOMAINS = new Set([
    "mailinator.com", "guerrillamail.com", "guerrillamail.info", "10minutemail.com",
    "10minutemail.net", "tempmail.com", "temp-mail.org", "yopmail.com", "yopmail.fr",
    "throwawaymail.com", "trashmail.com", "getnada.com", "fakeinbox.com",
    "sharklasers.com", "dispostable.com", "maildrop.cc", "mintemail.com",
    "mohmal.com", "moakt.com", "tempinbox.com", "emailondeck.com",
    "throwam.com", "spamgourmet.com", "mailnesia.com", "mytemp.email",
    "tempr.email", "discard.email", "spambog.com", "trbvm.com", "fakemail.net",
]);

/**
 * Structural format check only — no business-rule filtering (disposable
 * domains, etc). This is what login/forgot-password should use: it must
 * keep accepting whatever a user's account was actually registered with,
 * even if that email would be rejected under today's *signup* rules.
 * Anything that fails this was never a valid address to begin with, so
 * no real account can ever be broken by tightening it.
 */
export const getEmailFormatError = (email) => {
    if (typeof email !== "string" || email.trim().length === 0) {
        return "Email is required.";
    }

    const trimmed = email.trim();

    if (trimmed.length > 254) {
        return "That email address is too long.";
    }

    const match = trimmed.match(EMAIL_PATTERN);
    if (!match) {
        return "Please enter a valid email address (e.g. name@example.com).";
    }

    const [, localPart] = match;
    if (localPart.length > 64) {
        return "Please enter a valid email address.";
    }

    return null;
};

export const isValidEmail = (email) => getEmailFormatError(email) === null;

/**
 * Signup-time check: format PLUS "is this actually an acceptable address
 * to register with" (not a known disposable/throwaway domain). Use this
 * — not isValidEmail() — anywhere a user is picking a NEW email for the
 * first time (registration). Login and forgot-password should keep using
 * isValidEmail(), not this, so a pre-existing account is never locked out
 * by a policy that only makes sense at signup.
 */
export const getEmailError = (email) => {
    const formatError = getEmailFormatError(email);
    if (formatError) return formatError;

    const domain = email.trim().split("@")[1];
    if (DISPOSABLE_EMAIL_DOMAINS.has(domain.toLowerCase())) {
        return "Please use a real, permanent email address — temporary or disposable addresses aren't accepted.";
    }

    return null;
};

const MX_LOOKUP_TIMEOUT_MS = 2500;

/**
 * Best-effort check that an email's domain can actually receive mail (it
 * has MX records, or at least an A record mail could fall back to per
 * RFC 5321). This is as close as a signup form can get to "this address
 * exists in real life" without actually sending a verification email —
 * it catches typo'd or made-up domains ("gmial.com", "yahooo.co") that
 * sail through regex validation untouched.
 *
 * Fails OPEN: any DNS error or timeout (offline resolver, a slow
 * registrar, a transient network blip) resolves true rather than
 * rejecting a real signup over infrastructure flakiness. This should
 * only ever narrow acceptance — pair it with getEmailError() above, never
 * use it alone.
 */
export const hasDeliverableDomain = (email) => {
    const domain = typeof email === "string" ? email.split("@")[1] : null;
    if (!domain) return Promise.resolve(true);

    return new Promise((resolve) => {
        let settled = false;
        const finish = (result) => {
            if (settled) return;
            settled = true;
            resolve(result);
        };

        const timer = setTimeout(() => finish(true), MX_LOOKUP_TIMEOUT_MS);

        dns.resolveMx(domain, (mxErr, mxRecords) => {
            if (!mxErr && mxRecords?.length > 0) {
                clearTimeout(timer);
                return finish(true);
            }
            // No MX records — some domains still accept mail via a plain
            // A record (implicit MX fallback), so check that before
            // giving up on the domain entirely.
            dns.resolve4(domain, (aErr, aRecords) => {
                clearTimeout(timer);
                finish(!aErr && aRecords?.length > 0);
            });
        });
    });
};

// Trivially-weak passwords that technically satisfy every rule below but
// provide no real protection. Not exhaustive — just catches the most
// common throwaway choices (including ones that now satisfy the special-
// character rule via an appended "!" or "1", the first thing most people
// try).
const COMMON_WEAK_PASSWORDS = new Set([
    "password", "password1", "password123", "password!", "password1!",
    "12345678", "123456789", "qwertyui", "qwerty123", "qwerty123!",
    "11111111", "00000000", "abcdefgh", "letmein1", "letmein1!",
    "iloveyou", "iloveyou1", "admin123", "admin123!", "welcome1",
    "welcome1!", "changeme", "changeme1", "trustno1", "monkey123",
]);

const SPECIAL_CHAR_PATTERN = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/;

/**
 * Returns null if the password meets the minimum-strength bar, or a
 * user-friendly message describing what's missing.
 *
 * Rule: at least 8 characters, containing a letter, a number, AND a
 * special character, and not one of the common throwaway passwords.
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
    if (!/[a-zA-Z]/.test(password)) {
        return "Password must contain at least one letter.";
    }
    if (!/[0-9]/.test(password)) {
        return "Password must contain at least one number.";
    }
    if (!SPECIAL_CHAR_PATTERN.test(password)) {
        return "Password must contain at least one special character (e.g. ! @ # $ % &).";
    }
    if (COMMON_WEAK_PASSWORDS.has(password.toLowerCase())) {
        return "This password is too common. Please choose a stronger one.";
    }
    return null;
};
