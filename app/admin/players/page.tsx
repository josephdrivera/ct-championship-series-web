"use client";

import { useState } from "react";
import Image from "next/image";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

function RoleBadge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}
    >
      {label}
    </span>
  );
}

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
        Send an email invitation to join the league.
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

export default function AdminPlayersPage() {
  const players = useQuery(api.players.getAllPlayers);
  const currentUser = useQuery(api.users.getCurrentUser);
  const updateUserRole = useMutation(api.users.updateUserRole);

  const isSuperAdmin = currentUser?.isSuperAdmin === true;

  async function handleToggleCommissioner(
    userId: Id<"users">,
    currentValue: boolean
  ) {
    try {
      await updateUserRole({ userId, isCommissioner: !currentValue });
      toast.success(
        !currentValue ? "Promoted to commissioner" : "Removed commissioner role"
      );
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
    try {
      await updateUserRole({
        userId,
        isSuperAdmin: !currentValue,
        // Super admins are also commissioners
        ...(!currentValue ? { isCommissioner: true } : {}),
      });
      toast.success(
        !currentValue
          ? "Promoted to super admin"
          : "Removed super admin role"
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update role"
      );
    }
  }

  return (
    <>
      <h1 className="font-serif text-3xl font-bold tracking-tight text-dark-green">
        Players
      </h1>
      <p className="mt-1 text-dark-green/60">
        Manage league members and roles.
      </p>

      {/* Invite form - super admins only */}
      {isSuperAdmin && (
        <div className="mt-8">
          <InviteForm />
        </div>
      )}

      {/* Players list */}
      <div className="mt-8">
        <h2 className="font-serif text-lg font-bold text-dark-green">
          All Players
        </h2>

        {players === undefined ? (
          <p className="mt-4 text-sm text-dark-green/60">Loading...</p>
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
              const initials = player.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              return (
                <div
                  key={player._id}
                  className="rounded-xl bg-white p-4 shadow-sm"
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
                        <div className="mt-0.5 flex items-center gap-2">
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
                          {player.handicap !== undefined && (
                            <span className="text-xs text-dark-green/50">
                              HCP {player.handicap}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Role controls - super admins only, can't edit self */}
                    {isSuperAdmin && !isCurrentUser && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            handleToggleCommissioner(
                              player._id,
                              player.isCommissioner
                            )
                          }
                          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                            player.isCommissioner
                              ? "bg-gold/20 text-gold-dark hover:bg-gold/30"
                              : "bg-sand text-dark-green/60 hover:bg-dark-green/10"
                          }`}
                        >
                          {player.isCommissioner
                            ? "Remove Commissioner"
                            : "Make Commissioner"}
                        </button>
                        <button
                          onClick={() =>
                            handleToggleSuperAdmin(
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
                          {player.isSuperAdmin
                            ? "Remove Super Admin"
                            : "Make Super Admin"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
