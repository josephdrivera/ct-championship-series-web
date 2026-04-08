"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { RoleBadge } from "@/components/admin/RoleBadge";
import { PlayerRoleControls } from "@/components/admin/PlayerRoleControls";

/**
 * Super-admin dashboard block: promote members to commissioner or super admin.
 */
export function RoleManagementSection() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const players = useQuery(
    api.players.getPlayersWithStatsForAdmin,
    currentUser?.isSuperAdmin === true ? {} : "skip"
  );

  if (!currentUser?.isSuperAdmin) {
    return null;
  }

  return (
    <div className="mt-10">
      <h2 className="font-serif text-xl font-bold text-dark-green">
        League roles
      </h2>
      <p className="mt-1 text-sm text-dark-green/60">
        Promote members to commissioner (manage events, scores, players) or super
        admin (full access including invites and role changes). You cannot change
        your own roles here — use the Clerk dashboard or another super admin if
        needed.
      </p>

      {players === undefined ? (
        <div className="mt-4 space-y-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-lg bg-augusta/10"
            />
          ))}
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-sand/50 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-sand text-left">
                <th className="px-4 py-3 font-semibold text-dark-green">
                  Member
                </th>
                <th className="px-4 py-3 font-semibold text-dark-green">
                  Current role
                </th>
                <th className="px-4 py-3 font-semibold text-dark-green">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {players.map((player, idx) => (
                <tr
                  key={player._id}
                  className={`border-b border-sand/50 last:border-0 ${
                    idx % 2 === 0 ? "bg-cream/30" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-dark-green">
                    {player.name}
                    {player._id === currentUser._id && (
                      <span className="ml-2 text-xs font-normal text-dark-green/40">
                        (you)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
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
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <PlayerRoleControls
                      player={player}
                      currentUserId={currentUser._id}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-dark-green/40">
        Full player management (suspend, delete, handicaps) is on{" "}
        <Link
          href="/admin/players"
          className="font-medium text-augusta underline hover:text-deep-green"
        >
          Players
        </Link>
        .
      </p>
    </div>
  );
}
