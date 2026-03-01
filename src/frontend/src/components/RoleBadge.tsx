import { UserRole } from "../backend.d";

interface RoleBadgeProps {
  role: UserRole;
  size?: "sm" | "md";
}

export default function RoleBadge({ role, size = "sm" }: RoleBadgeProps) {
  const cls = size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-1";

  if (role === UserRole.owner) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded font-mono-custom font-bold border bg-owner border-owner text-owner ${cls}`}
      >
        <span>👑</span> OWNER
      </span>
    );
  }
  if (role === UserRole.admin) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded font-mono-custom font-bold border bg-admin-role border-admin-role text-admin-role ${cls}`}
      >
        ADMIN
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center rounded font-mono-custom border border-border/50 text-muted-foreground ${cls}`}
    >
      member
    </span>
  );
}
