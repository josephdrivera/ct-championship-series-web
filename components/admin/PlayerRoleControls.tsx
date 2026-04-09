"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { notifyCommissionerAppointed } from "@/lib/notify-commissioner-appointed";
import { toast } from "sonner";

export type PlayerRoleTarget = {
  _id: Id<"users">;
  isCommissioner: boolean;
  isSuperAdmin?: boolean;
};

/**
 * Super-admin only: promote/demote commissioner and super admin (not for self).
 */
export function PlayerRoleControls({
  player,
  currentUserId,
}: {
  player: PlayerRoleTarget;
  currentUserId: Id<"users"> | undefined;
}) {
  const updateUserRole = useMutation(api.users.updateUserRole);

  if (currentUserId !== undefined && player._id === currentUserId) {
    return (
      <span className="text-xs text-dark-green/40">—</span>
    );
  }

  async function handleToggleCommissioner(
    userId: Id<"users">,
    currentValue: boolean
  ) {
    const becomingCommissioner = !currentValue;
    try {
      await updateUserRole({ userId, isCommissioner: !currentValue });
      toast.success(
        becomingCommissioner
          ? "Promoted to commissioner"
          : "Removed commissioner role"
      );
      if (becomingCommissioner) {
        void notifyCommissionerAppointed(userId as string).then((r) => {
          if (r.ok && r.emailed) {
            toast.success("Congratulations email sent");
          } else if (r.ok && !r.emailed) {
            toast.message(
              "Commissioner updated. No email on file for this player — add one in Clerk so we can send notices."
            );
          } else if (!r.ok) {
            toast.message(r.error);
          }
        });
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update role"
      );
    }
  }

  async function handleToggleSuperAdmin(
    userId: Id<"users">,
    currentValue: boolean
  ) {
    const becomingSuperAdmin = !currentValue;
    try {
      await updateUserRole({
        userId,
        isSuperAdmin: !currentValue,
        ...(becomingSuperAdmin ? { isCommissioner: true } : {}),
      });
      toast.success(
        becomingSuperAdmin
          ? "Promoted to super admin"
          : "Removed super admin role"
      );
      // Super admin implies commissioner; email only if they weren't already a commissioner.
      if (becomingSuperAdmin && !player.isCommissioner) {
        void notifyCommissionerAppointed(userId as string).then((r) => {
          if (r.ok && r.emailed) {
            toast.success("Welcome email sent (new commissioner)");
          } else if (r.ok && !r.emailed) {
            toast.message(
              "Super admin updated. No email on file — add one in Clerk to send welcome emails."
            );
          } else if (!r.ok) {
            toast.message(r.error);
          }
        });
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update role"
      );
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() =>
          void handleToggleCommissioner(player._id, player.isCommissioner)
        }
        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
          player.isCommissioner
            ? "bg-gold/20 text-gold-dark hover:bg-gold/30"
            : "bg-sand text-dark-green/60 hover:bg-dark-green/10"
        }`}
      >
        {player.isCommissioner ? "Remove Commissioner" : "Make Commissioner"}
      </button>
      <button
        type="button"
        onClick={() =>
          void handleToggleSuperAdmin(
            player._id,
            player.isSuperAdmin === true
          )
        }
        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
          player.isSuperAdmin
            ? "bg-azalea/20 text-azalea hover:bg-azalea/30"
            : "bg-sand text-dark-green/60 hover:bg-dark-green/10"
        }`}
      >
        {player.isSuperAdmin ? "Remove Super Admin" : "Make Super Admin"}
      </button>
    </div>
  );
}
