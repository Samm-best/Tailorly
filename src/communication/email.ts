import { getEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<void>;
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

class BrevoProvider implements EmailProvider {
  private readonly apiKey: string;
  private readonly sender: { email: string; name: string };

  constructor(apiKey: string, senderEmail: string, senderName: string) {
    this.apiKey = apiKey;
    this.sender = { email: senderEmail, name: senderName };
  }

  async send(message: EmailMessage): Promise<void> {
    let res: Response;
    try {
      res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": this.apiKey, "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          sender: this.sender,
          to: [{ email: message.to }],
          subject: message.subject,
          htmlContent: message.html,
        }),
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      throw new AppError("PROVIDER_FAILURE", "Email provider unreachable");
    }
    if (!res.ok) {
      logger.error("brevo send failed", { status: res.status });
      throw new AppError("PROVIDER_FAILURE", "Email provider rejected the message");
    }
  }
}

/** Development without Brevo: nothing is sent and the message content (which holds tokens) is never logged. */
class NoopProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<void> {
    logger.warn("email not sent: no provider configured (development)", { subject: message.subject });
  }
}

let provider: EmailProvider | undefined;

export function getEmailProvider(): EmailProvider {
  if (provider) return provider;
  const env = getEnv();
  if (env.BREVO_API_KEY && env.BREVO_SENDER_EMAIL) {
    provider = new BrevoProvider(env.BREVO_API_KEY, env.BREVO_SENDER_EMAIL, env.BREVO_SENDER_NAME);
  } else if (env.NODE_ENV === "production") {
    throw new AppError("EMAIL_NOT_CONFIGURED", "Email delivery is not configured");
  } else {
    provider = new NoopProvider();
  }
  return provider;
}

function layout(title: string, body: string): string {
  return `<div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:auto;padding:24px;color:#0f172a">
<h2 style="color:#173D78;margin:0 0 16px">${escapeHtml(title)}</h2>${body}
<p style="color:#64748b;font-size:12px;margin-top:32px">Tailorly - Powered by SammyNex Technology</p></div>`;
}

const button = (href: string, label: string) =>
  `<p><a href="${escapeHtml(href)}" style="background:#173D78;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">${escapeHtml(label)}</a></p>`;

export async function sendVerificationEmail(to: string, name: string, link: string): Promise<void> {
  await getEmailProvider().send({
    to,
    subject: "Verify your Tailorly email",
    html: layout("Verify your email", `<p>Hi ${escapeHtml(name)}, confirm your email to activate your account. This link expires in 24 hours.</p>${button(link, "Verify email")}`),
  });
}

export async function sendPasswordResetEmail(to: string, name: string, link: string): Promise<void> {
  await getEmailProvider().send({
    to,
    subject: "Reset your Tailorly password",
    html: layout("Reset your password", `<p>Hi ${escapeHtml(name)}, use the button below to choose a new password. The link expires in 1 hour. If you did not ask for this, ignore this email.</p>${button(link, "Reset password")}`),
  });
}

export async function sendAccountExistsEmail(to: string, name: string, loginLink: string): Promise<void> {
  await getEmailProvider().send({
    to,
    subject: "You already have a Tailorly account",
    html: layout("You already have an account", `<p>Hi ${escapeHtml(name)}, someone tried to register with this email. You can simply sign in; one Tailorly account works on every shop.</p>${button(loginLink, "Sign in")}`),
  });
}
