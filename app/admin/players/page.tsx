"use client";

import { useState } from "react";
import Image from "next/image";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { RoleBadge } from "@/components/admin/RoleBadge";
import { PlayerRoleControls } from "@/components/admin/PlayerRoleControls";

function InviteForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailAddress: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to send invitation");
      } else {
        toast.success(`Invitation sent to ${email}`);
        setEmail("");
      }
    } catch {
      toast.error("Failed to send invitation");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="font-serif text-lg font-bold text-dark-green">
        Invite Player
      </h2>
      <p className="mt-1 text-sm text-dark-green/60">
        Send an email invitation to join the league. Pending and accepted invites
        appear in the table below.
      </p>
      <form onSubmit={handleInvite} className="mt-4 flex gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="player@example.com"
          className="flex-1 rounded-lg border border-sand bg-white px-4 py-2.5 text-sm text-dark-green placeholder:text-dark-green/40 focus:border-augusta focus:outline-none focus:ring-1 focus:ring-augusta"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-augusta px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-deep-green disabled:opacity-50"
        >
          {submitting ? "Sending..." : "Send Invite"}
        </button>
      </form>
    </div>
  );
}

function EditPlayerForm({
  player,
  isSuperAdmin,
  isCurrentUser,
  onClose,
}: {
  player: {
    _id: Id<"users">;
    name: string;
    handicap?: number;
    isCommissioner: boolean;
  };
  isSuperAdmin: boolean;
  isCurrentUser: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState(player.name);
  const [handicap, setHandicap] = useState(
    player.handicap !== undefined ? String(player.handicap) : ""
  );
  const [isCommissioner, setIsCommissioner] = useState(player.isCommissioner);
  const [submitting, setSubmitting] = useState(false);

  const updatePlayer = useMutation(api.users.updatePlayer);
  const updateUserRole = useMutation(api.users.updateUserRole);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    setSubmitting(true);
    try {
      await updatePlayer({
        userId: player._id,
        name: name.trim(),
        ...(handicap !== "" ? { handicap: parseInt(handicap, 10) || 0 } : {}),
      });

      // Update role if super admin changed it (and not editing self)
      if (
        isSuperAdmin &&
        !isCurrentUser &&
        isCommissioner !== player.isCommissioner
      ) {
        await updateUserRole({
          userId: player._id,
          isCommissioner,
        });
      }

      toast.success("Player updated");
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update player"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSave}
      className="mt-4 border-t border-sand/50 pt-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-dark-green">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-sand bg-white px-4 py-2.5 text-sm text-dark-green placeholder:text-dark-green/40 focus:border-augusta focus:outline-none focus:ring-1 focus:ring-augusta"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark-green">
            Handicap
          </label>
          <input
            type="number"
            value={handicap}
            onChange={(e) => setHandicap(e.target.value)}
            placeholder="Not set"
            className="mt-1 w-full rounded-lg border border-sand bg-white px-4 py-2.5 text-sm text-dark-green placeholder:text-dark-green/40 focus:border-augusta focus:outline-none focus:ring-1 focus:ring-augusta"
          />
        </div>
      </div>

      {isSuperAdmin && !isCurrentUser && (
        <label className="mt-4 flex items-center gap-3 rounded-lg border border-sand px-4 py-2.5">
          <input
            type="checkbox"
            checked={isCommissioner}
            onChange={(e) => setIsCommissioner(e.target.checked)}
            className="h-4 w-4 rounded border-sand text-augusta focus:ring-augusta"
          />
          <span className="text-sm font-medium text-dark-green">
            Commissioner
          </span>
        </label>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-augusta px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-deep-green disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-sand px-5 py-2.5 text-sm font-semibold text-dark-green/70 transition-colors hover:bg-sand/80"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

type LeagueInvitationId = Id<"leagueInvitations">;

function InvitationList({ enabled }: { enabled: boolean }) {
  const invitations = useQuery(
    api.invitations.listForAdmin,
    enabled ? {} : "skip"
  );
  const forceDeleteInvitation = useMutation(
    api.invitations.superAdminForceDeleteInvitationRow
  );
  const [cancellingClerkId, setCancellingClerkId] = useState<string | null>(
    null
  );
  const [clearingId, setClearingId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<{
    _id: LeagueInvitationId;
    email: string;
    displayName: string;
  } | null>(null);
  const [removing, setRemoving] = useState(false);

  async function handleCancelInvitation(clerkInvitationId: string) {
    setCancellingClerkId(clerkInvitationId);
    try {
      const res = await fetch("/api/invite/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerkInvitationId }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error || "Failed to cancel invitation");
      } else {
        toast.success("Invitation cancelled");
      }
    } catch {
      toast.error("Failed to cancel invitation");
    } finally {
      setCancellingClerkId(null);
    }
  }

  async function handleClearPendingRow(invitationId: LeagueInvitationId) {
    setClearingId(invitationId as string);
    try {
      await forceDeleteInvitation({ invitationId });
      toast.success("Row removed from the list");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to clear invitation row"
      );
    } finally {
      setClearingId(null);
    }
  }

  async function handleRemoveAcceptedMember() {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      const res = await fetch("/api/invite/remove-accepted", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId: removeTarget._id }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error || "Failed to remove member");
      } else {
        toast.success("Member removed; they were sent an email.");
        setRemoveTarget(null);
      }
    } catch {
      toast.error("Failed to remove member");
    } finally {
      setRemoving(false);
    }
  }

  if (!enabled) return null;

  if (invitations === undefined) {
    return (
      <div className="mt-4 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="font-serif text-lg font-bold text-dark-green">
          Invitations &amp; contacts
        </h2>
        <div className="mt-4 space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-8 animate-pulse rounded bg-augusta/10" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl bg-white p-6 shadow-sm">
      <h2 className="font-serif text-lg font-bold text-dark-green">
        Invitations &amp; contacts
      </h2>
      <p className="mt-1 max-w-3xl text-sm text-dark-green/60">
        Pending invites can be cancelled (revokes the Clerk link) or cleared from
        this list if the link was already revoked elsewhere. For members who
        already joined, use{" "}
        <span className="font-medium text-dark-green">Remove from league</span>{" "}
        to email them, delete their login, and remove their league data.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-sand text-left">
              <th className="px-3 py-2 font-semibold text-dark-green">Email</th>
              <th className="px-3 py-2 font-semibold text-dark-green">
                Status
              </th>
              <th className="px-3 py-2 font-semibold text-dark-green">Sent</th>
              <th className="px-3 py-2 font-semibold text-dark-green">
                Invited by
              </th>
              <th className="px-3 py-2 font-semibold text-dark-green">
                Member
              </th>
              <th className="px-3 py-2 font-semibold text-dark-green">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {invitations.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-8 text-center text-dark-green/50"
                >
                  No invitations yet. Send one with the form above.
                </td>
              </tr>
            ) : (
              invitations.map((inv) => (
                <tr key={inv._id} className="border-b border-sand/50">
                  <td className="px-3 py-2 text-dark-green">{inv.email}</td>
                  <td className="px-3 py-2">
                    {inv.status === "pending" ? (
                      <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                        Pending
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        Accepted
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-dark-green/60">
                    {new Date(inv.sentAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 text-dark-green/70">
                    {inv.invitedByName ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-dark-green">
                    {inv.acceptedUserName ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {inv.status === "pending" && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              void handleCancelInvitation(inv.clerkInvitationId)
                            }
                            disabled={
                              cancellingClerkId === inv.clerkInvitationId
                            }
                            className="rounded-full bg-sand px-3 py-1 text-xs font-medium text-dark-green/70 transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                          >
                            {cancellingClerkId === inv.clerkInvitationId
                              ? "Cancelling…"
                              : "Cancel invite"}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              void handleClearPendingRow(inv._id)
                            }
                            disabled={clearingId === (inv._id as string)}
                            className="rounded-full border border-sand px-3 py-1 text-xs font-medium text-dark-green/50 transition-colors hover:bg-cream disabled:opacity-50"
                            title="Removes this row only. Use if the invite was already revoked in Clerk but still appears here."
                          >
                            {clearingId === (inv._id as string)
                              ? "Clearing…"
                              : "Clear from list"}
                          </button>
                        </>
                      )}
                      {inv.status === "accepted" && (
                        <button
                          type="button"
                          onClick={() =>
                            setRemoveTarget({
                              _id: inv._id,
                              email: inv.email,
                              displayName:
                                inv.acceptedUserName?.trim() || inv.email,
                            })
                          }
                          className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-800 transition-colors hover:bg-red-100"
                        >
                          Remove from league
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {removeTarget && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-dark-green">
            Remove{" "}
            <span className="font-semibold">{removeTarget.displayName}</span>{" "}
            <span className="text-dark-green/60">({removeTarget.email})</span>{" "}
            from the league? They will receive an email that their membership was
            canceled. Their Clerk login and all league data for this account will
            be deleted. This cannot be undone.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setRemoveTarget(null)}
              disabled={removing}
              className="rounded-full px-4 py-1.5 text-sm font-medium text-dark-green/60 transition-colors hover:text-dark-green"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => void handleRemoveAcceptedMember()}
              disabled={removing}
              className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {removing ? "Removing…" : "Remove member & send email"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function BulkHandicapTable({
  players,
  onClose,
}: {
  players: { _id: Id<"users">; name: string; handicap?: number }[];
  onClose: () => void;
}) {
  const [handicaps, setHandicaps] = useState<Map<string, string>>(() => {
    const map = new Map<string, string>();
    for (const p of players) {
      map.set(
        p._id as string,
        p.handicap !== undefined ? String(p.handicap) : ""
      );
    }
    return map;
  });
  const [submitting, setSubmitting] = useState(false);

  const bulkUpdateHandicaps = useMutation(api.users.bulkUpdateHandicaps);

  async function handleSave() {
    const updates: { userId: Id<"users">; handicap: number }[] = [];
    for (const player of players) {
      const val = handicaps.get(player._id as string) ?? "";
      const newHandicap = parseInt(val, 10);
      if (!isNaN(newHandicap) && newHandicap !== (player.handicap ?? -1)) {
        updates.push({ userId: player._id, handicap: newHandicap });
      }
    }

    if (updates.length === 0) {
      toast("No handicap changes to save");
      return;
    }

    setSubmitting(true);
    try {
      await bulkUpdateHandicaps({ updates });
      toast.success(`Updated handicaps for ${updates.length} player(s)`);
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update handicaps"
      );
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-20 rounded-lg border border-sand bg-white px-3 py-1.5 text-center text-sm text-dark-green focus:border-augusta focus:outline-none focus:ring-1 focus:ring-augusta";

  return (
    <div className="mt-4 rounded-xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg font-bold text-dark-green">
          Update All Handicaps
        </h2>
        <button
          onClick={onClose}
          className="rounded-full bg-sand px-4 py-2 text-xs font-medium text-dark-green/70 transition-colors hover:bg-sand/80"
        >
          Cancel
        </button>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sand text-left">
              <th className="px-3 py-2 font-semibold text-dark-green">
                Player
              </th>
              <th className="px-3 py-2 text-center font-semibold text-dark-green">
                Current HCP
              </th>
              <th className="px-3 py-2 text-center font-semibold text-dark-green">
                New HCP
              </th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, idx) => (
              <tr
                key={player._id}
                className={`border-b border-sand/50 ${
                  idx % 2 === 0 ? "bg-cream/50" : ""
                }`}
              >
                <td className="px-3 py-2 font-medium text-dark-green">
                  {player.name}
                </td>
                <td className="px-3 py-2 text-center text-dark-green/60">
                  {player.handicap ?? "—"}
                </td>
                <td className="px-3 py-2 text-center">
                  <input
                    type="number"
                    value={handicaps.get(player._id as string) ?? ""}
                    onChange={(e) =>
                      setHandicaps((prev) => {
                        const copy = new Map(prev);
                        copy.set(player._id as string, e.target.value);
                        return copy;
                      })
                    }
                    placeholder="—"
                    className={inputClass}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4">
        <button
          onClick={handleSave}
          disabled={submitting}
          className="rounded-full bg-augusta px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-deep-green disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Save All Handicaps"}
        </button>
      </div>
    </div>
  );
}

export default function AdminPlayersPage() {
  const players = useQuery(api.players.getPlayersWithStatsForAdmin);
  const currentUser = useQuery(api.users.getCurrentUser);
  const suspendPlayer = useMutation(api.users.suspendPlayer);
  const unsuspendPlayer = useMutation(api.users.unsuspendPlayer);
  const deletePlayerMutation = useMutation(api.users.deletePlayer);
  const setPlayerVisibility = useMutation(api.users.setPlayerVisibility);

  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [bulkHandicapMode, setBulkHandicapMode] = useState(false);
  const [confirmSuspendId, setConfirmSuspendId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isSuperAdmin = currentUser?.isSuperAdmin === true;

  async function handleSuspend(userId: Id<"users">) {
    setActionLoading(userId as string);
    try {
      await suspendPlayer({ userId });
      toast.success("Player suspended");
      setConfirmSuspendId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to suspend player");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleUnsuspend(userId: Id<"users">) {
    setActionLoading(userId as string);
    try {
      await unsuspendPlayer({ userId });
      toast.success("Player reinstated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to unsuspend player");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(userId: Id<"users">) {
    setActionLoading(userId as string);
    try {
      await deletePlayerMutation({ userId });
      toast.success("Player and all associated data deleted");
      setConfirmDeleteId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete player");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <>
      <h1 className="font-serif text-3xl font-bold tracking-tight text-dark-green">
        Players
      </h1>
      <p className="mt-1 text-dark-green/60">
        Manage league members, handicaps, and roles.
      </p>

      {/* Invite form - super admins only; invitation list uses skip until enabled */}
      {isSuperAdmin && (
        <div className="mt-8">
          <InviteForm />
        </div>
      )}
      <InvitationList enabled={isSuperAdmin === true} />

      {/* Bulk handicap mode */}
      {bulkHandicapMode && players && (
        <div className="mt-8">
          <BulkHandicapTable
            players={players}
            onClose={() => setBulkHandicapMode(false)}
          />
        </div>
      )}

      {/* Players list */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold text-dark-green">
            All Players
          </h2>
          {!bulkHandicapMode && players && players.length > 0 && (
            <button
              onClick={() => setBulkHandicapMode(true)}
              className="rounded-full bg-sand px-4 py-2 text-xs font-medium text-dark-green/70 transition-colors hover:bg-dark-green/10"
            >
              Update All Handicaps
            </button>
          )}
        </div>

        {players === undefined ? (
          <div className="mt-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
                <div className="h-10 w-10 animate-pulse rounded-full bg-augusta/10" />
                <div className="flex-1">
                  <div className="h-4 w-32 animate-pulse rounded bg-augusta/10" />
                  <div className="mt-2 h-3 w-48 animate-pulse rounded bg-augusta/10" />
                </div>
              </div>
            ))}
          </div>
        ) : players.length === 0 ? (
          <div className="mt-4 rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="text-dark-green/60">
              No players yet. Invite members to join the league.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {players.map((player) => {
              const isCurrentUser = player._id === currentUser?._id;
              const isEditing = editingPlayerId === (player._id as string);
              const initials = player.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              return (
                <div
                  key={player._id}
                  className={`rounded-xl bg-white p-4 shadow-sm ${player.isSuspended ? "opacity-60" : ""}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Player info */}
                    <div className="flex items-center gap-3">
                      {player.photo ? (
                        <Image
                          src={player.photo}
                          alt={player.name}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-augusta text-sm font-semibold text-cream">
                          {initials}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-dark-green">
                            {player.name}
                          </p>
                          {isCurrentUser && (
                            <span className="text-xs text-dark-green/40">
                              (you)
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2">
                          {player.isSuperAdmin && (
                            <RoleBadge
                              label="Super Admin"
                              color="bg-azalea/10 text-azalea"
                            />
                          )}
                          {player.isCommissioner && !player.isSuperAdmin && (
                            <RoleBadge
                              label="Commissioner"
                              color="bg-gold/10 text-gold-dark"
                            />
                          )}
                          {!player.isCommissioner && !player.isSuperAdmin && (
                            <RoleBadge
                              label="Member"
                              color="bg-sand text-dark-green/60"
                            />
                          )}
                          {player.isSuspended && (
                            <RoleBadge
                              label="Suspended"
                              color="bg-red-100 text-red-600"
                            />
                          )}
                          {player.hiddenFromDirectory && (
                            <RoleBadge
                              label="Hidden"
                              color="bg-dark-green/10 text-dark-green/60"
                            />
                          )}
                          {player.handicap !== undefined && (
                            <span className="text-xs text-dark-green/50">
                              HCP {player.handicap}
                            </span>
                          )}
                          <span className="text-xs text-dark-green/50">
                            Joined {player.joinedYear}
                          </span>
                          <span className="text-xs text-dark-green/50">
                            {player.eventsPlayed} event{player.eventsPlayed !== 1 ? "s" : ""} played
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {/* Role controls - super admins only */}
                      {isSuperAdmin && (
                        <PlayerRoleControls
                          player={player}
                          currentUserId={currentUser?._id}
                        />
                      )}
                      {/* Suspend/Unsuspend - commissioners and super admins, not self */}
                      {!isCurrentUser && (
                        player.isSuspended ? (
                          <button
                            onClick={() => handleUnsuspend(player._id)}
                            disabled={actionLoading === (player._id as string)}
                            className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50"
                          >
                            {actionLoading === (player._id as string) ? "..." : "Unsuspend"}
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirmSuspendId(player._id as string)}
                            className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100"
                          >
                            Suspend
                          </button>
                        )
                      )}
                      {/* Delete - super admins only, not self */}
                      {isSuperAdmin && !isCurrentUser && (
                        <button
                          onClick={() => setConfirmDeleteId(player._id as string)}
                          className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
                        >
                          Delete
                        </button>
                      )}
                      {!isCurrentUser && (
                        <button
                          onClick={async () => {
                            try {
                              await setPlayerVisibility({
                                userId: player._id,
                                hidden: !player.hiddenFromDirectory,
                              });
                              toast.success(
                                player.hiddenFromDirectory
                                  ? `${player.name} is now visible`
                                  : `${player.name} is now hidden`
                              );
                            } catch (err) {
                              toast.error(
                                err instanceof Error
                                  ? err.message
                                  : "Failed to update visibility"
                              );
                            }
                          }}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                            player.hiddenFromDirectory
                              ? "bg-dark-green/10 text-dark-green/60 hover:bg-dark-green/20"
                              : "bg-sand text-dark-green/60 hover:bg-dark-green/10"
                          }`}
                        >
                          {player.hiddenFromDirectory ? "Show" : "Hide"}
                        </button>
                      )}
                      <button
                        onClick={() =>
                          setEditingPlayerId(
                            isEditing ? null : (player._id as string)
                          )
                        }
                        className="rounded-full bg-dark-green/10 px-3 py-1.5 text-xs font-medium text-dark-green hover:bg-dark-green/20"
                      >
                        {isEditing ? "Close" : "Edit"}
                      </button>
                    </div>
                  </div>

                  {/* Suspend confirmation */}
                  {confirmSuspendId === (player._id as string) && (
                    <div className="mt-3 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                      <p className="flex-1 text-sm text-dark-green">
                        Suspend <span className="font-semibold">{player.name}</span>? They won&apos;t be able to submit scores or participate in events.
                      </p>
                      <button
                        onClick={() => setConfirmSuspendId(null)}
                        disabled={actionLoading === (player._id as string)}
                        className="rounded-full px-4 py-1.5 text-sm font-medium text-dark-green/60 transition-colors hover:text-dark-green"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSuspend(player._id)}
                        disabled={actionLoading === (player._id as string)}
                        className="rounded-full bg-amber-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
                      >
                        {actionLoading === (player._id as string) ? "Suspending..." : "Confirm Suspend"}
                      </button>
                    </div>
                  )}

                  {/* Delete confirmation */}
                  {confirmDeleteId === (player._id as string) && (
                    <div className="mt-3 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                      <p className="flex-1 text-sm text-dark-green">
                        Permanently delete <span className="font-semibold">{player.name}</span> and all their data (scores, standings, achievements)? This cannot be undone.
                      </p>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        disabled={actionLoading === (player._id as string)}
                        className="rounded-full px-4 py-1.5 text-sm font-medium text-dark-green/60 transition-colors hover:text-dark-green"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDelete(player._id)}
                        disabled={actionLoading === (player._id as string)}
                        className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                      >
                        {actionLoading === (player._id as string) ? "Deleting..." : "Confirm Delete"}
                      </button>
                    </div>
                  )}

                  {/* Inline edit form */}
                  {isEditing && (
                    <EditPlayerForm
                      player={player}
                      isSuperAdmin={isSuperAdmin}
                      isCurrentUser={isCurrentUser}
                      onClose={() => setEditingPlayerId(null)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
