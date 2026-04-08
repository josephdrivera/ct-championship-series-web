/**
 * Transactional email via Resend. Templates live in `templates/emails/*.html` with `{{PLACEHOLDER}}` syntax.
 * Lazy Resend init so `next build` does not require RESEND_API_KEY at compile time.
 */
import fs from "node:fs";
import path from "node:path";
import { Resend } from "resend";

const TEMPLATES_DIR = path.join(process.cwd(), "templates", "emails");

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  return new Resend(key);
}

function loadTemplate(name: string): string {
  const file = path.join(TEMPLATES_DIR, `${name}.html`);
  return fs.readFileSync(file, "utf8");
}

function renderTemplate(template: string, vars: Record<string, string>): string {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{{${k}}}`, v);
  }
  return out;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function appName(): string {
  return process.env.EMAIL_APP_NAME ?? "CT Championship Series";
}

function fromAddress(): string {
  return (
    process.env.EMAIL_FROM ??
    "CT Championship Series <noreply@ctchampionshipseries.com>"
  );
}

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

/** Clerk application invitation — uses `invitation.html`. */
export async function sendInvitationEmail(params: {
  to: string;
  invitationUrl: string;
}): Promise<void> {
  const html = renderTemplate(loadTemplate("invitation"), {
    APP_NAME: appName(),
    INVITATION_URL: params.invitationUrl,
  });
  const resend = getResend();
  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: params.to,
    subject: `You're Invited to the ${appName()} Tournament`,
    html,
  });
  if (error) {
    throw new Error(error.message);
  }
}

/** League broadcast — uses `announcement.html`. Call from a Convex action or API when you add email fan-out. */
export async function sendAnnouncementEmail(params: {
  to: string;
  title: string;
  body: string;
  siteUrl: string;
}): Promise<void> {
  const bodyHtml = escapeHtml(params.body).replace(/\n/g, "<br />\n");
  const html = renderTemplate(loadTemplate("announcement"), {
    APP_NAME: appName(),
    TITLE: escapeHtml(params.title),
    BODY_HTML: bodyHtml,
    SITE_URL: params.siteUrl,
  });
  const resend = getResend();
  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: params.to,
    subject: `${params.title} — ${appName()}`,
    html,
  });
  if (error) {
    throw new Error(error.message);
  }
}

/** Event reminder — uses `reminder.html`. Primary CTA is check-in; secondary link is the public event page. */
export async function sendReminderEmail(params: {
  to: string;
  eventTitle: string;
  eventWhen: string;
  details: string;
  /** URL for the “Check in to play” button (typically `/events/[id]/check-in`). */
  checkInUrl: string;
  /** Public event detail page for “view the event page”. */
  eventPageUrl: string;
  siteUrl: string;
}): Promise<void> {
  const detailsHtml = escapeHtml(params.details).replace(/\n/g, "<br />\n");
  const html = renderTemplate(loadTemplate("reminder"), {
    APP_NAME: appName(),
    EVENT_TITLE: escapeHtml(params.eventTitle),
    EVENT_WHEN: escapeHtml(params.eventWhen),
    DETAILS_HTML: detailsHtml,
    CHECK_IN_URL: params.checkInUrl,
    EVENT_PAGE_URL: params.eventPageUrl,
    SITE_URL: params.siteUrl,
  });
  const resend = getResend();
  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: params.to,
    subject: `Reminder: ${params.eventTitle} — ${appName()}`,
    html,
  });
  if (error) {
    throw new Error(error.message);
  }
}

/** Optional post-sign-up welcome — uses `welcome.html` (not wired to Clerk by default). */
export async function sendWelcomeEmail(params: {
  to: string;
  userName: string;
  signInUrl: string;
}): Promise<void> {
  const html = renderTemplate(loadTemplate("welcome"), {
    APP_NAME: appName(),
    USER_NAME: escapeHtml(params.userName),
    SIGN_IN_URL: params.signInUrl,
  });
  const resend = getResend();
  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: params.to,
    subject: `Welcome to ${appName()}`,
    html,
  });
  if (error) {
    throw new Error(error.message);
  }
}
