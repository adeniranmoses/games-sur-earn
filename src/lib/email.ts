/**
 * Transactional Email Service
 * Supports Resend API out of the box with zero third-party SDK dependencies (uses native fetch).
 * In development or when no API key is provided, logs a rich preview with the clickable link to the console.
 */

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<{ success: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "RewardPlatform <noreply@rewardplatform.com>";

  if (!apiKey) {
    // Development / Sandbox mode: Log cleanly to console so developer is never blocked
    console.log("\n=======================================================");
    console.log("📨 [MOCK EMAIL DISPATCH] (No RESEND_API_KEY configured)");
    console.log(`➡️  To: ${to}`);
    console.log(`📌 Subject: ${subject}`);
    console.log("-------------------------------------------------------");
    if (text) {
      console.log(text);
    } else {
      // Strip basic HTML tags for console readability
      const plain = html.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
      console.log(plain);
    }
    console.log("=======================================================\n");

    return { success: true, id: `mock-${Date.now()}` };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject,
        html,
        text,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Resend API error:", data);
      return { success: false, error: data?.message || "Failed to send email" };
    }

    return { success: true, id: data.id };
  } catch (error: any) {
    console.error("Email dispatch failed:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Sends an email verification link
 */
export async function sendVerificationEmail(email: string, name: string, token: string): Promise<boolean> {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/verify-email?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Verify your email - RewardPlatform</title>
      </head>
      <body style="background-color: #09090b; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px 20px; margin: 0;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" style="max-width: 560px; width: 100%; background-color: #12141a; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; padding: 32px;">
          <tr>
            <td style="text-align: center; padding-bottom: 24px;">
              <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 12px; background: linear-gradient(135deg, #6366f1, #a855f7); color: #ffffff; font-weight: bold; font-size: 22px;">R</div>
              <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 16px 0 6px 0; letter-spacing: -0.5px;">Confirm Your Email</h1>
              <p style="color: #a1a1aa; font-size: 14px; margin: 0;">Welcome to RewardPlatform, ${name}!</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0 24px 0; color: #d4d4d8; font-size: 14px; line-height: 24px;">
              Please verify your email address to unlock instant coin redemptions, gift card payouts, and daily streak rewards.
            </td>
          </tr>
          <tr>
            <td style="text-align: center; padding: 12px 0 28px 0;">
              <a href="${verifyUrl}" style="background-color: #6366f1; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 9999px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);">
                Verify My Email Address
              </a>
            </td>
          </tr>
          <tr>
            <td style="border-top: 1px solid #27272a; padding-top: 20px; color: #71717a; font-size: 12px; line-height: 18px;">
              If the button doesn't work, copy and paste this link in your browser:<br>
              <a href="${verifyUrl}" style="color: #818cf8; word-break: break-all;">${verifyUrl}</a>
              <br><br>
              This link will expire in <strong>24 hours</strong>. If you did not create an account, you can safely ignore this email.
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const text = `Hi ${name},\n\nPlease verify your email for RewardPlatform by visiting this link:\n${verifyUrl}\n\nThis link will expire in 24 hours.`;

  const result = await sendEmail({
    to: email,
    subject: "Verify your RewardPlatform account",
    html,
    text,
  });

  return result.success;
}

/**
 * Sends a 6-digit password reset verification code (OTP)
 */
export async function sendPasswordResetOtp(email: string, name: string, code: string): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset Code - RewardPlatform</title>
      </head>
      <body style="background-color: #09090b; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px 20px; margin: 0;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" style="max-width: 520px; width: 100%; background-color: #12141a; border: 1px solid #27272a; border-radius: 20px; overflow: hidden; padding: 36px;">
          <tr>
            <td style="text-align: center; padding-bottom: 20px;">
              <div style="display: inline-block; width: 50px; height: 50px; line-height: 50px; border-radius: 14px; background: linear-gradient(135deg, #6366f1, #a855f7); color: #ffffff; font-weight: bold; font-size: 24px;">🔑</div>
              <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 18px 0 6px 0; letter-spacing: -0.5px;">Password Reset Code</h1>
              <p style="color: #a1a1aa; font-size: 14px; margin: 0;">Hi ${name || "there"},</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0 20px 0; color: #d4d4d8; font-size: 14px; line-height: 22px; text-align: center;">
              Use the 6-digit verification code below to reset your password:
            </td>
          </tr>
          <tr>
            <td style="text-align: center; padding: 10px 0 28px 0;">
              <div style="display: inline-block; background-color: #1a1d26; border: 2px dashed #6366f1; border-radius: 14px; padding: 16px 36px;">
                <span style="font-size: 34px; font-weight: 900; letter-spacing: 10px; color: #818cf8; font-family: 'Courier New', Courier, monospace;">
                  ${code}
                </span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="border-top: 1px solid #27272a; padding-top: 20px; color: #71717a; font-size: 12px; line-height: 18px; text-align: center;">
              This code will expire in <strong>15 minutes</strong>.<br>
              If you didn't request a password reset, you can safely ignore this email.
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const text = `Hi ${name || "there"},\n\nYour password reset code is: ${code}\n\nThis code will expire in 15 minutes. If you did not request this, you can safely ignore this email.`;

  const result = await sendEmail({
    to: email,
    subject: `${code} is your password reset code`,
    html,
    text,
  });

  return result.success;
}

/**
 * Sends a password reset link (legacy fallback)
 */
export async function sendPasswordResetEmail(email: string, name: string, token: string): Promise<boolean> {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Reset your password - RewardPlatform</title>
      </head>
      <body style="background-color: #09090b; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px 20px; margin: 0;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" style="max-width: 560px; width: 100%; background-color: #12141a; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; padding: 32px;">
          <tr>
            <td style="text-align: center; padding-bottom: 24px;">
              <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 12px; background: linear-gradient(135deg, #f43f5e, #fb923c); color: #ffffff; font-weight: bold; font-size: 22px;">🔒</div>
              <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 16px 0 6px 0; letter-spacing: -0.5px;">Password Reset Request</h1>
              <p style="color: #a1a1aa; font-size: 14px; margin: 0;">Hi ${name || "there"},</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0 24px 0; color: #d4d4d8; font-size: 14px; line-height: 24px;">
              We received a request to reset your password for your RewardPlatform account. Click the button below to choose a new password:
            </td>
          </tr>
          <tr>
            <td style="text-align: center; padding: 12px 0 28px 0;">
              <a href="${resetUrl}" style="background-color: #f43f5e; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 9999px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 14px rgba(244, 63, 94, 0.35);">
                Reset Password
              </a>
            </td>
          </tr>
          <tr>
            <td style="border-top: 1px solid #27272a; padding-top: 20px; color: #71717a; font-size: 12px; line-height: 18px;">
              If you didn't ask to reset your password, no action is needed. Your account remains completely secure.<br><br>
              Or copy and paste this URL into your browser:<br>
              <a href="${resetUrl}" style="color: #fb7185; word-break: break-all;">${resetUrl}</a>
              <br><br>
              This link is single-use and will expire in <strong>1 hour</strong>.
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const text = `Hi ${name || "there"},\n\nWe received a request to reset your RewardPlatform password. Visit this link to set a new password:\n${resetUrl}\n\nThis link will expire in 1 hour. If you didn't request this, you can ignore this email.`;

  const result = await sendEmail({
    to: email,
    subject: "Reset your RewardPlatform password",
    html,
    text,
  });

  return result.success;
}
