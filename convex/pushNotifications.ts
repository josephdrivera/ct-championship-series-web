"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import webpush from "web-push";

export const sendPushToAll = internalAction({
  args: {
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT;

    if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
      // VAPID keys not configured — skip push silently
      return;
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const subscriptions = await ctx.runQuery(
      internal.pushNotificationsHelpers.fetchAllSubscriptions,
      {}
    );

    const payload = JSON.stringify({
      title: args.title,
      body: args.body,
      url: args.url ?? "/",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
    });

    const staleEndpoints: string[] = [];

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        );
      } catch (err: unknown) {
        const error = err as { statusCode?: number };
        if (error.statusCode === 410 || error.statusCode === 404) {
          staleEndpoints.push(sub.endpoint);
        }
      }
    }

    // Clean up stale subscriptions
    for (const endpoint of staleEndpoints) {
      await ctx.runMutation(
        internal.pushNotificationsHelpers.removeStaleSubscription,
        { endpoint }
      );
    }
  },
});
