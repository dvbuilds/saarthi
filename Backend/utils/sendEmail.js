const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export const sendResetPasswordEmail = async (toEmail, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: "Saarthi",
        email: process.env.BREVO_SENDER_EMAIL,
      },
      to: [{ email: toEmail }],
      subject: "Reset your Saarthi password",
      htmlContent: `
        <div style="font-family:sans-serif;max-width:500px;margin:auto;">
          <h2>Reset your password</h2>
          <p>Your password reset link is valid for 1 hour.</p>

          <a href="${resetUrl}"
            style="padding:12px 24px;
                   background:#2563EB;
                   color:white;
                   text-decoration:none;
                   border-radius:8px;">
            Reset Password
          </a>

          <p>If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(data);
    throw new Error(data.message || "Failed to send email");
  }

  return data;
};