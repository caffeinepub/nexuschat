import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useBanUser,
  useCancelShutdown,
  useDemoteUser,
  useKickUser,
  useMuteUser,
  usePromoteUser,
  useShutdownStatus,
  useStartShutdown,
  useUnbanUser,
  useUnmuteUser,
} from "@/hooks/useQueries";
import {
  ArrowDown,
  ArrowUp,
  Ban,
  Check,
  Copy,
  Loader2,
  PowerOff,
  Shield,
  UserX,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../backend.d";
import { UserRole } from "../backend.d";

interface AdminPanelProps {
  users: UserProfile[];
  myProfile: UserProfile | null;
  children: React.ReactNode;
}

// ── Command Reference List ──────────────────────────────────────────────────

const COMMANDS = [
  { cmd: "/mute", syntax: "/mute @username", desc: "Silence a user" },
  {
    cmd: "/unmute",
    syntax: "/unmute @username",
    desc: "Restore a user's voice",
  },
  { cmd: "/ban", syntax: "/ban @username", desc: "Permanently ban a user" },
  { cmd: "/unban", syntax: "/unban @username", desc: "Lift a ban from a user" },
  {
    cmd: "/kick",
    syntax: "/kick @username",
    desc: "Remove a user from the server",
  },
  {
    cmd: "/promote",
    syntax: "/promote @username",
    desc: "Promote user to admin",
  },
  {
    cmd: "/demote",
    syntax: "/demote @username",
    desc: "Demote admin to member",
  },
  { cmd: "/help", syntax: "/help", desc: "Show available commands" },
  { cmd: "/clear", syntax: "/clear", desc: "Clear chat (owner only)" },
  {
    cmd: "/announce",
    syntax: "/announce message",
    desc: "Send server announcement",
  },
  { cmd: "/slowmode", syntax: "/slowmode seconds", desc: "Enable slow mode" },
  { cmd: "/lock", syntax: "/lock #channel", desc: "Lock a channel" },
  { cmd: "/unlock", syntax: "/unlock #channel", desc: "Unlock a channel" },
  { cmd: "/nick", syntax: "/nick @username newname", desc: "Change nickname" },
  { cmd: "/warn", syntax: "/warn @username reason", desc: "Warn a user" },
  {
    cmd: "/timeout",
    syntax: "/timeout @username minutes",
    desc: "Temp mute for N minutes",
  },
  { cmd: "/role", syntax: "/role @username rolename", desc: "Assign a role" },
  { cmd: "/pin", syntax: "/pin messageID", desc: "Pin a message" },
  { cmd: "/unpin", syntax: "/unpin messageID", desc: "Unpin a message" },
  { cmd: "/stats", syntax: "/stats", desc: "Show server statistics" },
  {
    cmd: "/shutdown",
    syntax: "/shutdown <reason> <minutes>",
    desc: "Initiate server shutdown (owner only)",
  },
  {
    cmd: "/cancelshutdown",
    syntax: "/cancelshutdown",
    desc: "Cancel active shutdown (owner only)",
  },
];

// ── Main Component ─────────────────────────────────────────────────────────

export default function AdminPanel({
  users,
  myProfile,
  children,
}: AdminPanelProps) {
  const [open, setOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [shutdownReason, setShutdownReason] = useState("");
  const [shutdownDuration, setShutdownDuration] = useState(10);

  const banUser = useBanUser();
  const unbanUser = useUnbanUser();
  const muteUser = useMuteUser();
  const unmuteUser = useUnmuteUser();
  const kickUser = useKickUser();
  const promoteUser = usePromoteUser();
  const demoteUser = useDemoteUser();
  const startShutdown = useStartShutdown();
  const cancelShutdown = useCancelShutdown();
  const shutdownStatusQuery = useShutdownStatus();
  const shutdownStatus = shutdownStatusQuery.data;
  const isShutdownActive = shutdownStatus?.active === true;

  const isOwner = myProfile?.role === UserRole.owner;

  // Countdown timer for admin panel display
  const [shutdownCountdown, setShutdownCountdown] = useState("");
  useEffect(() => {
    if (!isShutdownActive || !shutdownStatus?.endsAt) {
      setShutdownCountdown("");
      return;
    }
    const update = () => {
      const endsAtMs = Number(shutdownStatus.endsAt) / 1_000_000;
      const remaining = Math.max(0, Math.floor((endsAtMs - Date.now()) / 1000));
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      setShutdownCountdown(`${m}m ${String(s).padStart(2, "0")}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [isShutdownActive, shutdownStatus?.endsAt]);

  const runAction = async (
    action: () => Promise<unknown>,
    label: string,
    userId: string,
  ) => {
    const key = `${label}-${userId}`;
    setPendingAction(key);
    try {
      await action();
      toast.success(`${label} successful`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `${label} failed`);
    } finally {
      setPendingAction(null);
    }
  };

  const isPending = (label: string, userId: string) =>
    pendingAction === `${label}-${userId}`;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        className="w-full sm:w-[640px] sm:max-w-[640px] p-0 border-l"
        style={{
          backgroundColor: "oklch(0.09 0.025 240)",
          borderLeftColor: "oklch(0.62 0.22 220 / 0.4)",
          boxShadow:
            "-4px 0 60px oklch(0.62 0.22 220 / 0.15), -1px 0 0 oklch(0.62 0.22 220 / 0.3)",
        }}
      >
        {/* ── Futuristic Header ── */}
        <SheetHeader
          className="px-6 py-4 border-b relative overflow-hidden"
          style={{
            backgroundColor: "oklch(0.11 0.030 240)",
            borderBottomColor: "oklch(0.62 0.22 220 / 0.35)",
            boxShadow:
              "0 1px 0 oklch(0.62 0.22 220 / 0.2), 0 4px 20px oklch(0.62 0.22 220 / 0.08)",
          }}
        >
          {/* Background grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(oklch(0.62 0.22 220) 1px, transparent 1px), linear-gradient(90deg, oklch(0.62 0.22 220) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          {/* Glow strip at top */}
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{
              background:
                "linear-gradient(90deg, transparent, oklch(0.72 0.22 220), oklch(0.82 0.18 195), oklch(0.72 0.22 220), transparent)",
            }}
          />

          <SheetTitle className="font-display flex items-center gap-3 relative z-10">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.52 0.22 240), oklch(0.42 0.22 260))",
                boxShadow: "0 0 12px oklch(0.62 0.22 220 / 0.5)",
              }}
            >
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <span
                className="font-display font-bold text-base tracking-wide"
                style={{
                  color: "oklch(0.88 0.12 220)",
                  textShadow: "0 0 20px oklch(0.62 0.22 220 / 0.5)",
                }}
              >
                ADMIN PANEL
              </span>
              <div
                className="text-[9px] font-mono-custom tracking-[0.2em] uppercase"
                style={{ color: "oklch(0.55 0.10 220)" }}
              >
                NexusChat Control Center
              </div>
            </div>
            {isOwner && (
              <Badge
                className="ml-auto font-mono-custom text-[10px] tracking-widest uppercase border animate-pulse"
                style={{
                  backgroundColor: "oklch(0.78 0.18 85 / 0.15)",
                  borderColor: "oklch(0.78 0.18 85 / 0.5)",
                  color: "oklch(0.88 0.18 85)",
                  boxShadow: "0 0 8px oklch(0.78 0.18 85 / 0.3)",
                }}
              >
                👑 OWNER
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="p-4 h-[calc(100vh-80px)]">
          <Tabs defaultValue="users" className="h-full flex flex-col">
            <TabsList
              className="w-full mb-4 flex-shrink-0 border"
              style={{
                backgroundColor: "oklch(0.12 0.020 240)",
                borderColor: "oklch(0.62 0.22 220 / 0.2)",
              }}
            >
              <TabsTrigger
                value="users"
                className="flex-1 font-mono-custom text-xs data-[state=active]:text-white transition-all"
                style={
                  {
                    "--tw-shadow": "none",
                  } as React.CSSProperties
                }
              >
                <Shield className="w-3 h-3 mr-1.5" />
                User Management
              </TabsTrigger>
              <TabsTrigger
                value="info"
                className="flex-1 font-mono-custom text-xs data-[state=active]:text-white transition-all"
              >
                <Zap className="w-3 h-3 mr-1.5" />
                Server Info
              </TabsTrigger>
              <TabsTrigger
                value="commands"
                className="flex-1 font-mono-custom text-xs data-[state=active]:text-white transition-all"
              >
                <Copy className="w-3 h-3 mr-1.5" />
                Commands
              </TabsTrigger>
            </TabsList>

            {/* ── User Management Tab ── */}
            <TabsContent value="users" className="mt-0 flex-1 min-h-0">
              <ScrollArea className="h-full">
                <div
                  className="rounded-lg overflow-hidden border"
                  style={{
                    borderColor: "oklch(0.62 0.22 220 / 0.2)",
                    boxShadow: "0 0 0 1px oklch(0.62 0.22 220 / 0.05) inset",
                  }}
                >
                  <Table>
                    <TableHeader>
                      <TableRow
                        style={{
                          backgroundColor: "oklch(0.13 0.025 240)",
                          borderBottomColor: "oklch(0.62 0.22 220 / 0.2)",
                        }}
                      >
                        <TableHead
                          className="font-mono-custom text-[10px] tracking-widest uppercase"
                          style={{ color: "oklch(0.65 0.12 220)" }}
                        >
                          User
                        </TableHead>
                        <TableHead
                          className="font-mono-custom text-[10px] tracking-widest uppercase"
                          style={{ color: "oklch(0.65 0.12 220)" }}
                        >
                          Role
                        </TableHead>
                        <TableHead
                          className="font-mono-custom text-[10px] tracking-widest uppercase"
                          style={{ color: "oklch(0.65 0.12 220)" }}
                        >
                          Status
                        </TableHead>
                        <TableHead
                          className="font-mono-custom text-[10px] tracking-widest uppercase text-right"
                          style={{ color: "oklch(0.65 0.12 220)" }}
                        >
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => {
                        const userId = user.principal.toString();
                        const isMe = myProfile?.principal.toString() === userId;
                        const isTargetOwner = user.role === UserRole.owner;

                        return (
                          <TableRow
                            key={userId}
                            className="transition-all group"
                            style={{
                              backgroundColor: isMe
                                ? "oklch(0.52 0.22 240 / 0.06)"
                                : "transparent",
                              borderBottomColor: "oklch(0.62 0.22 220 / 0.08)",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor =
                                "oklch(0.52 0.22 240 / 0.10)";
                              e.currentTarget.style.boxShadow =
                                "0 0 0 1px oklch(0.62 0.22 220 / 0.12) inset";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = isMe
                                ? "oklch(0.52 0.22 240 / 0.06)"
                                : "transparent";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                  style={{
                                    background:
                                      user.role === UserRole.owner
                                        ? "linear-gradient(135deg, oklch(0.78 0.18 85), oklch(0.68 0.16 65))"
                                        : user.role === UserRole.admin
                                          ? "linear-gradient(135deg, oklch(0.55 0.22 230), oklch(0.45 0.22 250))"
                                          : "oklch(0.20 0.015 240)",
                                    boxShadow:
                                      user.role === UserRole.owner
                                        ? "0 0 8px oklch(0.78 0.18 85 / 0.4)"
                                        : user.role === UserRole.admin
                                          ? "0 0 8px oklch(0.62 0.22 220 / 0.4)"
                                          : "none",
                                  }}
                                >
                                  {user.username[0]?.toUpperCase()}
                                </div>
                                <div>
                                  <span
                                    className="font-mono-custom text-xs font-semibold"
                                    style={{ color: "oklch(0.88 0.06 220)" }}
                                  >
                                    {user.role === UserRole.owner && "👑 "}
                                    {user.username}
                                    {isMe && (
                                      <span
                                        className="ml-1"
                                        style={{
                                          color: "oklch(0.55 0.10 220)",
                                        }}
                                      >
                                        (you)
                                      </span>
                                    )}
                                  </span>
                                  <p
                                    className="text-[10px] font-mono-custom truncate max-w-[100px]"
                                    style={{ color: "oklch(0.45 0.08 220)" }}
                                  >
                                    {userId.slice(0, 12)}...
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span
                                className="text-xs font-mono-custom font-semibold"
                                style={{
                                  color:
                                    user.role === UserRole.owner
                                      ? "oklch(0.85 0.18 85)"
                                      : user.role === UserRole.admin
                                        ? "oklch(0.75 0.18 220)"
                                        : "oklch(0.50 0.06 220)",
                                  textShadow:
                                    user.role === UserRole.owner
                                      ? "0 0 8px oklch(0.78 0.18 85 / 0.4)"
                                      : user.role === UserRole.admin
                                        ? "0 0 8px oklch(0.62 0.22 220 / 0.4)"
                                        : "none",
                                }}
                              >
                                {user.role}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1 flex-wrap">
                                {user.isBanned && (
                                  <Badge
                                    variant="destructive"
                                    className="text-[9px] py-0 px-1"
                                  >
                                    banned
                                  </Badge>
                                )}
                                {user.isMuted && (
                                  <Badge
                                    className="text-[9px] py-0 px-1"
                                    style={{
                                      backgroundColor:
                                        "oklch(0.62 0.22 220 / 0.12)",
                                      color: "oklch(0.62 0.12 220)",
                                      borderColor: "oklch(0.62 0.22 220 / 0.2)",
                                    }}
                                  >
                                    muted
                                  </Badge>
                                )}
                                {!user.isBanned && !user.isMuted && (
                                  <span
                                    className="text-[10px] font-mono-custom"
                                    style={{ color: "oklch(0.68 0.20 155)" }}
                                  >
                                    active
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {!isMe && !isTargetOwner && (
                                <div className="flex items-center justify-end gap-1 flex-wrap">
                                  <CyberButton
                                    onClick={() =>
                                      void runAction(
                                        () =>
                                          user.isBanned
                                            ? unbanUser.mutateAsync(userId)
                                            : banUser.mutateAsync(userId),
                                        user.isBanned ? "Unban" : "Ban",
                                        userId,
                                      )
                                    }
                                    isPending={
                                      isPending("Ban", userId) ||
                                      isPending("Unban", userId)
                                    }
                                    icon={<Ban className="w-3 h-3" />}
                                    label={user.isBanned ? "Unban" : "Ban"}
                                    variant={
                                      user.isBanned ? "secondary" : "danger"
                                    }
                                  />

                                  <CyberButton
                                    onClick={() =>
                                      void runAction(
                                        () =>
                                          user.isMuted
                                            ? unmuteUser.mutateAsync(userId)
                                            : muteUser.mutateAsync(userId),
                                        user.isMuted ? "Unmute" : "Mute",
                                        userId,
                                      )
                                    }
                                    isPending={
                                      isPending("Mute", userId) ||
                                      isPending("Unmute", userId)
                                    }
                                    icon={
                                      user.isMuted ? (
                                        <Volume2 className="w-3 h-3" />
                                      ) : (
                                        <VolumeX className="w-3 h-3" />
                                      )
                                    }
                                    label={user.isMuted ? "Unmute" : "Mute"}
                                    variant="secondary"
                                  />

                                  <CyberButton
                                    onClick={() =>
                                      void runAction(
                                        () => kickUser.mutateAsync(userId),
                                        "Kick",
                                        userId,
                                      )
                                    }
                                    isPending={isPending("Kick", userId)}
                                    icon={<UserX className="w-3 h-3" />}
                                    label="Kick"
                                    variant="danger"
                                  />

                                  {isOwner && (
                                    <>
                                      {user.role !== UserRole.admin && (
                                        <CyberButton
                                          onClick={() =>
                                            void runAction(
                                              () =>
                                                promoteUser.mutateAsync(userId),
                                              "Promote",
                                              userId,
                                            )
                                          }
                                          isPending={isPending(
                                            "Promote",
                                            userId,
                                          )}
                                          icon={<ArrowUp className="w-3 h-3" />}
                                          label="Promote"
                                          variant="blue"
                                        />
                                      )}
                                      {user.role === UserRole.admin && (
                                        <CyberButton
                                          onClick={() =>
                                            void runAction(
                                              () =>
                                                demoteUser.mutateAsync(userId),
                                              "Demote",
                                              userId,
                                            )
                                          }
                                          isPending={isPending(
                                            "Demote",
                                            userId,
                                          )}
                                          icon={
                                            <ArrowDown className="w-3 h-3" />
                                          }
                                          label="Demote"
                                          variant="secondary"
                                        />
                                      )}
                                    </>
                                  )}
                                </div>
                              )}
                              {isTargetOwner && !isMe && (
                                <span
                                  className="text-[10px] font-mono-custom"
                                  style={{ color: "oklch(0.78 0.18 85)" }}
                                >
                                  Owner — protected
                                </span>
                              )}
                              {isMe && (
                                <span
                                  className="text-[10px] font-mono-custom"
                                  style={{ color: "oklch(0.50 0.08 220)" }}
                                >
                                  (you)
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* ── Server Info Tab ── */}
            <TabsContent value="info" className="mt-0 flex-1 min-h-0">
              <ScrollArea className="h-full">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3 pr-2"
                >
                  <div
                    className="rounded-lg border p-4 space-y-3 relative overflow-hidden"
                    style={{
                      backgroundColor: "oklch(0.12 0.020 240)",
                      borderColor: "oklch(0.62 0.22 220 / 0.2)",
                    }}
                  >
                    <p
                      className="font-mono-custom text-[10px] uppercase tracking-[0.2em]"
                      style={{ color: "oklch(0.60 0.12 220)" }}
                    >
                      ◈ Server Stats
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <CyberStatCard label="Total Users" value={users.length} />
                      <CyberStatCard
                        label="Admins"
                        value={
                          users.filter((u) => u.role === UserRole.admin).length
                        }
                      />
                      <CyberStatCard
                        label="Banned"
                        value={users.filter((u) => u.isBanned).length}
                        highlight={users.filter((u) => u.isBanned).length > 0}
                      />
                      <CyberStatCard
                        label="Muted"
                        value={users.filter((u) => u.isMuted).length}
                      />
                    </div>
                  </div>

                  <div
                    className="rounded-lg border p-4"
                    style={{
                      backgroundColor: "oklch(0.12 0.020 240)",
                      borderColor: "oklch(0.62 0.22 220 / 0.2)",
                    }}
                  >
                    <p
                      className="font-mono-custom text-[10px] uppercase tracking-[0.2em] mb-3"
                      style={{ color: "oklch(0.60 0.12 220)" }}
                    >
                      ◈ Your Profile
                    </p>
                    {myProfile && (
                      <div className="space-y-2">
                        <CyberInfoRow
                          label="Username"
                          value={myProfile.username}
                        />
                        <CyberInfoRow
                          label="Role"
                          value={myProfile.role}
                          highlight
                        />
                        <CyberInfoRow
                          label="Principal"
                          value={`${myProfile.principal.toString().slice(0, 16)}...`}
                          mono
                        />
                      </div>
                    )}
                  </div>

                  {/* ── Server Shutdown (Owner Only) ── */}
                  {isOwner && (
                    <div
                      className="rounded-lg border p-4 space-y-4 relative overflow-hidden"
                      style={{
                        backgroundColor: "oklch(0.10 0.018 22)",
                        borderColor: isShutdownActive
                          ? "oklch(0.62 0.22 22 / 0.5)"
                          : "oklch(0.62 0.22 22 / 0.25)",
                        boxShadow: isShutdownActive
                          ? "0 0 20px oklch(0.62 0.22 22 / 0.15)"
                          : "none",
                      }}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <PowerOff
                            className="w-4 h-4"
                            style={{ color: "oklch(0.72 0.22 22)" }}
                          />
                          <p
                            className="font-mono-custom text-[10px] uppercase tracking-[0.2em]"
                            style={{ color: "oklch(0.68 0.14 22)" }}
                          >
                            ◈ Server Shutdown
                          </p>
                        </div>
                        {/* Status badge */}
                        <div
                          className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono-custom"
                          style={{
                            backgroundColor: isShutdownActive
                              ? "oklch(0.62 0.22 22 / 0.15)"
                              : "oklch(0.55 0.18 145 / 0.12)",
                            border: `1px solid ${isShutdownActive ? "oklch(0.62 0.22 22 / 0.35)" : "oklch(0.55 0.18 145 / 0.3)"}`,
                            color: isShutdownActive
                              ? "oklch(0.78 0.22 22)"
                              : "oklch(0.68 0.18 145)",
                          }}
                        >
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              backgroundColor: isShutdownActive
                                ? "oklch(0.78 0.22 22)"
                                : "oklch(0.68 0.18 145)",
                            }}
                          />
                          {isShutdownActive
                            ? `Active — ends in ${shutdownCountdown}`
                            : "Inactive"}
                        </div>
                      </div>

                      {/* Active shutdown info */}
                      {isShutdownActive && shutdownStatus && (
                        <div
                          className="rounded p-3 space-y-1 border"
                          style={{
                            backgroundColor: "oklch(0.12 0.06 22 / 0.5)",
                            borderColor: "oklch(0.62 0.22 22 / 0.2)",
                          }}
                        >
                          <p
                            className="text-[10px] font-mono-custom"
                            style={{ color: "oklch(0.50 0.10 22)" }}
                          >
                            Reason:{" "}
                            <span style={{ color: "oklch(0.80 0.10 22)" }}>
                              {shutdownStatus.reason || "—"}
                            </span>
                          </p>
                          <p
                            className="text-[10px] font-mono-custom"
                            style={{ color: "oklch(0.50 0.10 22)" }}
                          >
                            Started by:{" "}
                            <span style={{ color: "oklch(0.80 0.10 22)" }}>
                              {shutdownStatus.startedBy || "—"}
                            </span>
                          </p>
                        </div>
                      )}

                      {/* Cancel button (if active) */}
                      {isShutdownActive && (
                        <button
                          type="button"
                          onClick={() => {
                            cancelShutdown.mutate(undefined, {
                              onSuccess: () =>
                                toast.success("Shutdown cancelled"),
                              onError: (err) =>
                                toast.error(
                                  err instanceof Error
                                    ? err.message
                                    : "Failed to cancel shutdown",
                                ),
                            });
                          }}
                          disabled={cancelShutdown.isPending}
                          className="w-full flex items-center justify-center gap-2 rounded-md py-2 text-sm font-mono-custom font-semibold transition-all disabled:opacity-40"
                          style={{
                            backgroundColor: "oklch(0.45 0.18 145 / 0.15)",
                            border: "1px solid oklch(0.55 0.18 145 / 0.4)",
                            color: "oklch(0.72 0.18 145)",
                          }}
                        >
                          {cancelShutdown.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                          Cancel Shutdown
                        </button>
                      )}

                      {/* Shutdown form */}
                      {!isShutdownActive && (
                        <div className="space-y-3">
                          <div>
                            <label
                              htmlFor="shutdown-reason"
                              className="block text-[10px] font-mono-custom uppercase tracking-widest mb-1"
                              style={{ color: "oklch(0.50 0.08 22)" }}
                            >
                              Reason
                            </label>
                            <input
                              id="shutdown-reason"
                              type="text"
                              value={shutdownReason}
                              onChange={(e) =>
                                setShutdownReason(e.target.value)
                              }
                              placeholder="e.g. scheduled maintenance"
                              className="w-full rounded-md px-3 py-1.5 text-xs font-mono-custom outline-none transition-colors placeholder:opacity-40"
                              style={{
                                backgroundColor: "oklch(0.08 0.010 22)",
                                border: "1px solid oklch(0.62 0.22 22 / 0.2)",
                                color: "oklch(0.85 0.06 22)",
                              }}
                              onFocus={(e) => {
                                e.currentTarget.style.borderColor =
                                  "oklch(0.62 0.22 22 / 0.5)";
                              }}
                              onBlur={(e) => {
                                e.currentTarget.style.borderColor =
                                  "oklch(0.62 0.22 22 / 0.2)";
                              }}
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="shutdown-duration"
                              className="block text-[10px] font-mono-custom uppercase tracking-widest mb-1"
                              style={{ color: "oklch(0.50 0.08 22)" }}
                            >
                              Duration (minutes)
                            </label>
                            <input
                              id="shutdown-duration"
                              type="number"
                              min={1}
                              max={1440}
                              value={shutdownDuration}
                              onChange={(e) =>
                                setShutdownDuration(
                                  Math.min(
                                    1440,
                                    Math.max(1, Number(e.target.value)),
                                  ),
                                )
                              }
                              className="w-full rounded-md px-3 py-1.5 text-xs font-mono-custom outline-none transition-colors"
                              style={{
                                backgroundColor: "oklch(0.08 0.010 22)",
                                border: "1px solid oklch(0.62 0.22 22 / 0.2)",
                                color: "oklch(0.85 0.06 22)",
                              }}
                              onFocus={(e) => {
                                e.currentTarget.style.borderColor =
                                  "oklch(0.62 0.22 22 / 0.5)";
                              }}
                              onBlur={(e) => {
                                e.currentTarget.style.borderColor =
                                  "oklch(0.62 0.22 22 / 0.2)";
                              }}
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (!shutdownReason.trim()) {
                                toast.error("Please enter a reason");
                                return;
                              }
                              startShutdown.mutate(
                                {
                                  reason: shutdownReason.trim(),
                                  durationSeconds: shutdownDuration * 60,
                                },
                                {
                                  onSuccess: () => {
                                    toast.success(
                                      `Shutdown initiated for ${shutdownDuration}m`,
                                    );
                                    setShutdownReason("");
                                    setShutdownDuration(10);
                                  },
                                  onError: (err) =>
                                    toast.error(
                                      err instanceof Error
                                        ? err.message
                                        : "Failed to start shutdown",
                                    ),
                                },
                              );
                            }}
                            disabled={
                              startShutdown.isPending ||
                              !shutdownReason.trim() ||
                              shutdownDuration < 1
                            }
                            className="w-full flex items-center justify-center gap-2 rounded-md py-2 text-sm font-mono-custom font-semibold transition-all disabled:opacity-40"
                            style={{
                              backgroundColor: "oklch(0.45 0.22 22 / 0.18)",
                              border: "1px solid oklch(0.62 0.22 22 / 0.45)",
                              color: "oklch(0.78 0.22 22)",
                            }}
                          >
                            {startShutdown.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <PowerOff className="w-4 h-4" />
                            )}
                            Initiate Shutdown
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </ScrollArea>
            </TabsContent>

            {/* ── Commands Tab ── */}
            <TabsContent value="commands" className="mt-0 flex-1 min-h-0">
              <ScrollArea className="h-full">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2 pr-2"
                >
                  {/* Header */}
                  <div
                    className="rounded-lg border p-3 mb-3"
                    style={{
                      backgroundColor: "oklch(0.12 0.020 240)",
                      borderColor: "oklch(0.62 0.22 220 / 0.2)",
                    }}
                  >
                    <p
                      className="font-mono-custom text-[10px] uppercase tracking-[0.2em] mb-1"
                      style={{ color: "oklch(0.60 0.12 220)" }}
                    >
                      ◈ Command Reference
                    </p>
                    <p
                      className="text-xs font-mono-custom"
                      style={{ color: "oklch(0.50 0.08 220)" }}
                    >
                      Type commands in chat, or click Copy to paste into the
                      input.
                    </p>
                  </div>

                  {COMMANDS.map((item, i) => (
                    <CommandRow
                      key={item.cmd}
                      cmd={item.cmd}
                      syntax={item.syntax}
                      desc={item.desc}
                      index={i}
                    />
                  ))}
                </motion.div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── CommandRow ──────────────────────────────────────────────────────────────

function CommandRow({
  cmd,
  syntax,
  desc,
  index,
}: {
  cmd: string;
  syntax: string;
  desc: string;
  index: number;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(syntax);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      className="rounded-lg border flex items-center gap-3 px-3 py-2.5 transition-all group"
      style={{
        backgroundColor: "oklch(0.11 0.018 240)",
        borderColor: "oklch(0.62 0.22 220 / 0.12)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.backgroundColor =
          "oklch(0.13 0.022 240)";
        (e.currentTarget as HTMLDivElement).style.borderColor =
          "oklch(0.62 0.22 220 / 0.28)";
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 0 12px oklch(0.62 0.22 220 / 0.08)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.backgroundColor =
          "oklch(0.11 0.018 240)";
        (e.currentTarget as HTMLDivElement).style.borderColor =
          "oklch(0.62 0.22 220 / 0.12)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      {/* Command name */}
      <span
        className="font-mono-custom text-xs font-bold w-24 flex-shrink-0"
        style={{
          color: "oklch(0.78 0.20 215)",
          textShadow: "0 0 8px oklch(0.62 0.22 215 / 0.4)",
        }}
      >
        {cmd}
      </span>

      {/* Syntax */}
      <div
        className="rounded px-2 py-0.5 font-mono-custom text-[11px] flex-shrink-0 hidden sm:block"
        style={{
          backgroundColor: "oklch(0.62 0.22 220 / 0.08)",
          color: "oklch(0.70 0.12 220)",
          border: "1px solid oklch(0.62 0.22 220 / 0.15)",
          minWidth: "140px",
        }}
      >
        {syntax}
      </div>

      {/* Description */}
      <span
        className="flex-1 text-xs font-mono-custom truncate"
        style={{ color: "oklch(0.52 0.06 220)" }}
      >
        {desc}
      </span>

      {/* Copy button */}
      <Button
        size="sm"
        onClick={() => void handleCopy()}
        className="h-6 w-6 p-0 flex-shrink-0 rounded transition-all"
        style={{
          backgroundColor: copied
            ? "oklch(0.55 0.18 145 / 0.15)"
            : "oklch(0.62 0.22 220 / 0.10)",
          borderColor: copied
            ? "oklch(0.55 0.18 145 / 0.4)"
            : "oklch(0.62 0.22 220 / 0.25)",
          color: copied ? "oklch(0.72 0.18 145)" : "oklch(0.70 0.12 220)",
          border: "1px solid",
          boxShadow: copied ? "0 0 8px oklch(0.55 0.18 145 / 0.3)" : "none",
        }}
      >
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      </Button>
    </motion.div>
  );
}

// ── CyberButton ─────────────────────────────────────────────────────────────

function CyberButton({
  onClick,
  isPending,
  icon,
  label,
  variant = "secondary",
}: {
  onClick: () => void;
  isPending: boolean;
  icon: React.ReactNode;
  label: string;
  variant?: "secondary" | "danger" | "blue" | "outline";
}) {
  const styles: Record<string, React.CSSProperties> = {
    danger: {
      backgroundColor: "oklch(0.62 0.22 22 / 0.12)",
      borderColor: "oklch(0.62 0.22 22 / 0.35)",
      color: "oklch(0.72 0.18 22)",
      border: "1px solid",
    },
    blue: {
      backgroundColor: "oklch(0.55 0.22 230 / 0.12)",
      borderColor: "oklch(0.62 0.22 220 / 0.35)",
      color: "oklch(0.75 0.18 220)",
      border: "1px solid",
    },
    secondary: {
      backgroundColor: "oklch(0.62 0.22 220 / 0.08)",
      borderColor: "oklch(0.62 0.22 220 / 0.20)",
      color: "oklch(0.65 0.12 220)",
      border: "1px solid",
    },
    outline: {
      backgroundColor: "transparent",
      borderColor: "oklch(0.62 0.22 220 / 0.25)",
      color: "oklch(0.62 0.12 220)",
      border: "1px solid",
    },
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      className="h-6 px-2 text-[10px] font-mono-custom gap-1 flex items-center rounded transition-all disabled:opacity-40 hover:brightness-125"
      style={styles[variant]}
    >
      {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : icon}
      {label}
    </button>
  );
}

// ── CyberStatCard ───────────────────────────────────────────────────────────

function CyberStatCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className="rounded-md p-3 border relative overflow-hidden"
      style={{
        backgroundColor: "oklch(0.10 0.018 240)",
        borderColor:
          highlight && value > 0
            ? "oklch(0.62 0.22 22 / 0.3)"
            : "oklch(0.62 0.22 220 / 0.15)",
        boxShadow:
          highlight && value > 0 ? "0 0 8px oklch(0.62 0.22 22 / 0.1)" : "none",
      }}
    >
      <p
        className="text-[10px] font-mono-custom uppercase tracking-widest"
        style={{ color: "oklch(0.50 0.08 220)" }}
      >
        {label}
      </p>
      <p
        className="text-2xl font-display font-bold mt-1"
        style={{
          color:
            highlight && value > 0
              ? "oklch(0.72 0.22 22)"
              : "oklch(0.82 0.18 220)",
          textShadow:
            highlight && value > 0
              ? "0 0 12px oklch(0.62 0.22 22 / 0.4)"
              : "0 0 12px oklch(0.62 0.22 220 / 0.3)",
        }}
      >
        {value}
      </p>
    </div>
  );
}

// ── CyberInfoRow ─────────────────────────────────────────────────────────────

function CyberInfoRow({
  label,
  value,
  highlight = false,
  mono = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  mono?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between gap-2 py-1.5 border-b"
      style={{ borderBottomColor: "oklch(0.62 0.22 220 / 0.08)" }}
    >
      <span
        className="text-xs font-mono-custom"
        style={{ color: "oklch(0.50 0.08 220)" }}
      >
        {label}
      </span>
      <span
        className={`text-xs font-semibold truncate ${mono ? "font-mono-custom" : ""}`}
        style={{
          color: highlight ? "oklch(0.78 0.18 220)" : "oklch(0.82 0.06 220)",
          textShadow: highlight ? "0 0 8px oklch(0.62 0.22 220 / 0.4)" : "none",
        }}
      >
        {value}
      </span>
    </div>
  );
}
