/**
 * Transactional email for Next.js API routes (Vercel). Requires RESEND_API_KEY and a verified EMAIL_FROM domain in Resend.
 * Instantiation is lazy so `next build` does not require a key at module load time.
 */
import { Resend } from "resend";

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  return new Resend(key);
}

interface SendInviteEmailOptions {
  to: string;
  signInUrl: string;
}

export async function sendInviteEmail({ to, signInUrl }: SendInviteEmailOptions) {
  const resend = getResend();
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || "CT Championship Series <noreply@ctchampionshipseries.com>",
    to,
    subject: "You're Invited to the CT Championship Series",
    html: buildInviteHtml(signInUrl),
  });

  if (error) {
    console.error("Failed to send invite email:", error);
    throw new Error(error.message);
  }
}

function buildInviteHtml(signInUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to CT Championship Series</title>
</head>
<body style="margin:0;padding:0;background-color:#FDF8F0;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FDF8F0;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background-color:#002E1F;border-radius:12px 12px 0 0;padding:48px 40px;text-align:center;">
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:56px;font-weight:bold;color:#F2C75C;letter-spacing:4px;">
                CS
              </div>
              <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11px;color:#FDF8F0;text-transform:uppercase;letter-spacing:4px;margin-top:8px;opacity:0.85;">
                Championship Series
              </div>
            </td>
          </tr>

          <!-- Gold Accent Bar -->
          <tr>
            <td style="background-color:#F2C75C;height:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#FFFFFF;padding:48px 40px;">
              <h1 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:28px;color:#002E1F;font-weight:700;">
                Welcome to CT Championship Series!
              </h1>
              <div style="width:48px;height:3px;background-color:#F2C75C;margin:0 0 24px;border-radius:2px;"></div>
              <p style="margin:0 0 20px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:16px;line-height:26px;color:#333333;">
                You've been personally invited by the Commissioner to join Connecticut's premier golf league. This is your chance to compete, track your stats, and make your mark on the leaderboard.
              </p>
              <p style="margin:0 0 32px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:16px;line-height:26px;color:#333333;">
                Create your account to get started. We'll see you on the course.
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="border-radius:8px;background-color:#006747;">
                    <a href="${signInUrl}" target="_blank" style="display:inline-block;padding:16px 48px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:16px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:8px;letter-spacing:0.5px;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:32px 0 0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;line-height:20px;color:#999999;text-align:center;">
                If the button doesn't work, copy and paste this link into your browser:<br />
                <a href="${signInUrl}" style="color:#006747;word-break:break-all;">${signInUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#002E1F;border-radius:0 0 12px 12px;padding:32px 40px;text-align:center;">
              <p style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:bold;color:#F2C75C;">
                CT Championship Series
              </p>
              <p style="margin:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;color:#FDF8F0;opacity:0.6;">
                Connecticut's Premier Golf League
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}
