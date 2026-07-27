import nodemailer from "nodemailer";

// Standard SMTP transporter — works with Gmail (using an App Password, not
// your regular password), or any other SMTP provider (Brevo, Mailgun, etc).
// Required env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FRONTEND_URL
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465, // true for port 465, false for 587/others
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const sendResetPasswordEmail = async (toEmail, resetToken) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    await transporter.sendMail({
        from: `"Saarthi" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject: "Reset your Saarthi password",
        html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                <h2 style="color: #0F172A;">Reset your password</h2>
                <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                    We received a request to reset your Saarthi password. This link expires in 1 hour.
                </p>
                <a href="${resetUrl}"
                   style="display: inline-block; margin: 16px 0; padding: 12px 28px; background: #2563EB; color: #fff; text-decoration: none; border-radius: 10px; font-weight: 600;">
                    Reset Password
                </a>
                <p style="color: #94A3B8; font-size: 12px;">
                    If you didn't request this, you can safely ignore this email.
                </p>
            </div>
        `,
    });
};
