import { Users } from "lucide-react";
import { motion } from "motion/react";
import type { UserProfile } from "../backend.d";
import { UserRole } from "../backend.d";
import RoleBadge from "./RoleBadge";

interface UsersSidebarProps {
  users: UserProfile[];
  myProfile: UserProfile | null;
}

export default function UsersSidebar({ users, myProfile }: UsersSidebarProps) {
  const owners = users.filter((u) => u.role === UserRole.owner);
  const admins = users.filter((u) => u.role === UserRole.admin);
  const members = users.filter((u) => u.role === UserRole.member);

  const UserEntry = ({ user }: { user: UserProfile }) => {
    const isMe = myProfile?.principal.toString() === user.principal.toString();
    return (
      <motion.div
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors ${
          isMe ? "bg-accent/30" : "hover:bg-accent/20"
        } ${user.isBanned ? "opacity-40" : ""}`}
      >
        <div className="relative flex-shrink-0">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{
              background:
                user.role === UserRole.owner
                  ? "linear-gradient(135deg, oklch(0.78 0.18 85), oklch(0.68 0.16 65))"
                  : user.role === UserRole.admin
                    ? "linear-gradient(135deg, oklch(0.62 0.22 255), oklch(0.52 0.22 295))"
                    : "oklch(0.30 0.02 264)",
            }}
          >
            {user.username[0]?.toUpperCase()}
          </div>
          {/* Online dot */}
          {!user.isBanned && (
            <div
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-sidebar"
              style={{ backgroundColor: "oklch(var(--nexus-online))" }}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div
            className={`text-xs font-mono-custom truncate flex items-center gap-1 ${
              user.role === UserRole.owner
                ? "text-owner font-semibold"
                : user.role === UserRole.admin
                  ? "text-admin-role font-semibold"
                  : "text-foreground/80"
            }`}
          >
            {user.role === UserRole.owner && <span>👑</span>}
            {user.username}
            {isMe && (
              <span className="text-[9px] text-muted-foreground">(you)</span>
            )}
          </div>
          {(user.isMuted || user.isBanned) && (
            <div className="text-[9px] text-destructive font-mono-custom">
              {user.isBanned ? "banned" : "muted"}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  const SectionHeader = ({
    label,
    count,
  }: {
    label: string;
    count: number;
  }) => (
    <div className="px-2 pt-3 pb-1">
      <span className="font-mono-custom text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
        {label} — {count}
      </span>
    </div>
  );

  return (
    <div
      className="w-52 flex-shrink-0 flex flex-col border-l border-border"
      style={{ backgroundColor: "oklch(var(--sidebar))" }}
    >
      {/* Header */}
      <div
        className="h-14 flex items-center px-3 gap-2 border-b border-border"
        style={{ backgroundColor: "oklch(0.10 0.008 264)" }}
      >
        <Users className="w-4 h-4 text-muted-foreground" />
        <span className="font-mono-custom text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Members
        </span>
        <span
          className="ml-auto text-[10px] font-mono-custom px-1.5 py-0.5 rounded"
          style={{ backgroundColor: "oklch(var(--muted))" }}
        >
          {users.length}
        </span>
      </div>

      {/* Users list */}
      <div className="flex-1 overflow-y-auto py-1">
        {owners.length > 0 && (
          <>
            <SectionHeader label="Owner" count={owners.length} />
            {owners.map((u) => (
              <UserEntry key={u.principal.toString()} user={u} />
            ))}
          </>
        )}

        {admins.length > 0 && (
          <>
            <SectionHeader label="Admins" count={admins.length} />
            {admins.map((u) => (
              <UserEntry key={u.principal.toString()} user={u} />
            ))}
          </>
        )}

        {members.length > 0 && (
          <>
            <SectionHeader label="Members" count={members.length} />
            {members.map((u) => (
              <UserEntry key={u.principal.toString()} user={u} />
            ))}
          </>
        )}

        {users.length === 0 && (
          <div className="flex flex-col items-center py-8 gap-2">
            <Users className="w-8 h-8 text-muted-foreground opacity-30" />
            <p className="text-xs text-muted-foreground font-mono-custom">
              No users yet
            </p>
          </div>
        )}
      </div>

      {/* Role legend */}
      <div
        className="p-3 border-t border-border space-y-1.5"
        style={{ backgroundColor: "oklch(0.10 0.008 264)" }}
      >
        <p className="text-[9px] text-muted-foreground font-mono-custom uppercase tracking-widest mb-2">
          Role Legend
        </p>
        <div className="flex flex-col gap-1.5">
          <RoleBadge role={UserRole.owner} size="sm" />
          <RoleBadge role={UserRole.admin} size="sm" />
          <RoleBadge role={UserRole.member} size="sm" />
        </div>
      </div>
    </div>
  );
}
