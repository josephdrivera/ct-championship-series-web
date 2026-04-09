import { NextRequest, NextResponse } from "next/server";

const MAX_PAYLOAD_BYTES = 100 * 1024; // 100 KB

/**
 * Returns an error response if the request payload exceeds the size limit.
 * Call at the top of POST handlers before reading the body.
 */
export function rejectOversizedPayload(
  request: NextRequest
): NextResponse | null {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_PAYLOAD_BYTES) {
    return NextResponse.json(
      { error: "Payload too large" },
      { status: 413 }
    );
  }
  return null;
}
