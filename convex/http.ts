/**
 * Convex HTTP routes. Clerk webhooks are verified here (not on Vercel).
 * Set CLERK_WEBHOOK_SECRET in the Convex dashboard (production); point Clerk’s webhook URL to
 * https://<deployment>.convex.site/clerk-webhook
 */
import { httpAction } from "./_generated/server";
import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { Webhook } from "svix";

type ClerkUserWebhookEvent = {
  type: string;
  data: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    image_url?: string | null;
    primary_email_address_id?: string | null;
    email_addresses?: { id: string; email_address: string }[];
  };
};

const http = httpRouter();

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("Missing CLERK_WEBHOOK_SECRET environment variable");
      return new Response("Server configuration error", { status: 500 });
    }

    const svixId = request.headers.get("svix-id");
    const svixTimestamp = request.headers.get("svix-timestamp");
    const svixSignature = request.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response("Missing svix headers", { status: 400 });
    }

    const body = await request.text();

    const wh = new Webhook(webhookSecret);
    let event: ClerkUserWebhookEvent;
    try {
      event = wh.verify(body, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as ClerkUserWebhookEvent;
    } catch (err) {
      console.error("Webhook verification failed:", err);
      return new Response("Invalid webhook signature", { status: 400 });
    }

    const eventType = event.type;

    if (eventType === "user.created" || eventType === "user.updated") {
      const { id, first_name, last_name, image_url, email_addresses, primary_email_address_id } =
        event.data;
      const name =
        [first_name, last_name].filter(Boolean).join(" ") || "Unknown";

      let primaryEmail: string | undefined;
      if (email_addresses && email_addresses.length > 0) {
        const primary =
          primary_email_address_id !== undefined &&
          primary_email_address_id !== null
            ? email_addresses.find((e) => e.id === primary_email_address_id)
            : undefined;
        primaryEmail = primary?.email_address ?? email_addresses[0].email_address;
      }

      await ctx.runMutation(internal.users.upsertFromClerk, {
        clerkId: id,
        name,
        photo: image_url ?? undefined,
        email: primaryEmail,
      });
    }

    return new Response("OK", { status: 200 });
  }),
});

export default http;
