/**
 * Client helper: asks the server to send the commissioner congratulations email.
 * Call only after a successful promotion to commissioner (or super admin, which includes commissioner).
 */

export type CommissionerNotifyResult =
  | { ok: true; emailed: true }
  | { ok: true; emailed: false; reason: "no_email" }
  | { ok: false; error: string };

export async function notifyCommissionerAppointed(
  userId: string
): Promise<CommissionerNotifyResult> {
  const res = await fetch("/api/admin/commissioner-appointed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  const data = (await res.json()) as {
    error?: string;
    emailed?: boolean;
    reason?: string;
  };

  if (!res.ok) {
    return { ok: false, error: data.error ?? "Failed to send email" };
  }

  if (data.emailed === false) {
    return {
      ok: true,
      emailed: false,
      reason: "no_email",
    };
  }

  return { ok: true, emailed: true };
}
