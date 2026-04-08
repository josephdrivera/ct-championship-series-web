import "server-only";
import type { ClerkClient } from "@clerk/backend";

type ClerkErr = {
  errors?: Array<{
    code?: string;
    message?: string;
    longMessage?: string;
    long_message?: string;
  }>;
};

function unwrapErrors(err: unknown): ClerkErr["errors"] | undefined {
  let current: unknown = err;
  for (let d = 0; d < 8; d++) {
    if (!current || typeof current !== "object") return undefined;
    const o = current as ClerkErr;
    if (Array.isArray(o.errors) && o.errors.length > 0) return o.errors;
    const cause = (o as { cause?: unknown }).cause;
    if (cause) {
      current = cause;
      continue;
    }
    break;
  }
  return undefined;
}

export function getClerkErrorMessage(err: unknown): string {
  const list = unwrapErrors(err);
  const first = list?.[0];
  if (!first) return err instanceof Error ? err.message : "Clerk request failed";
  return (
    first.longMessage ??
    first.long_message ??
    first.message ??
    "Clerk request failed"
  );
}

/** True when invitation is already revoked / inactive — safe to sync DB only. */
export function isBenignClerkRevokeFailure(err: unknown): boolean {
  const list = unwrapErrors(err);
  const code = list?.[0]?.code ?? "";
  const msg = (
    list?.[0]?.longMessage ??
    list?.[0]?.long_message ??
    list?.[0]?.message ??
    ""
  ).toLowerCase();
  if (/already|revoked|inactive|expired/i.test(code)) return true;
  if (
    /already\s*revoked|was\s*revoked|no\s*longer\s*valid/i.test(msg)
  ) {
    return true;
  }
  return false;
}

/**
 * Revoke a pending invitation. Tries SDK (string + object param), then Clerk BAPI POST.
 */
export async function revokeClerkInvitation(
  client: ClerkClient,
  invitationId: string
): Promise<void> {
  const invApi = client.invitations as {
    revokeInvitation: (
      arg: string | { invitationId: string }
    ) => Promise<unknown>;
  };

  let lastErr: unknown;
  try {
    await invApi.revokeInvitation(invitationId);
    return;
  } catch (e) {
    lastErr = e;
  }

  try {
    await invApi.revokeInvitation({ invitationId });
    return;
  } catch (e) {
    lastErr = e;
  }

  const secret = process.env.CLERK_SECRET_KEY?.trim();
  if (!secret) {
    throw new Error(
      `Could not revoke invitation: ${getClerkErrorMessage(lastErr)} (also set CLERK_SECRET_KEY for API fallback)`
    );
  }

  const url = `https://api.clerk.com/v1/invitations/${encodeURIComponent(invitationId)}/revoke`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
  });

  if (res.ok) return;

  const raw = await res.text();
  let parsed: { errors?: ClerkErr["errors"] } = {};
  try {
    parsed = JSON.parse(raw) as { errors?: ClerkErr["errors"] };
  } catch {
    /* ignore */
  }
  const synthetic: ClerkErr = {
    errors:
      parsed.errors ??
      ([
        {
          message: raw || res.statusText,
          code: `http_${res.status}`,
        },
      ] as NonNullable<ClerkErr["errors"]>),
  };
  const err = new Error(getClerkErrorMessage(synthetic));
  (err as { cause?: unknown }).cause = synthetic;
  throw err;
}
