import brevo from "@getbrevo/brevo";

const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
    brevo.TransactionalEmailsApiApiKeys.apiKey,
    process.env.BREVO_API_KEY
);

export const sendResetPasswordEmail = async (toEmail, resetToken) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const email = new brevo.SendSmtpEmail();
    email.sender = { name: "Saarthi", email: process.env.BREVO_SENDER_EMAIL };
    email.to = [{ email: toEmail }];
    email.subject = "Reset your Saarthi password";
    email.htmlContent = `
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
    `;

    await apiInstance.sendTransacEmail(email);
};