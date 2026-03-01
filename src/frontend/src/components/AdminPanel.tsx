import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  useDemoteUser,
  useKickUser,
  useMuteUser,
  usePromoteUser,
  useUnbanUser,
  useUnmuteUser,
} from "@/hooks/useQueries";
import {
  ArrowDown,
  ArrowUp,
  Ban,
  Loader2,
  RefreshCw,
  Shield,
  UserX,
  Volume2,
  VolumeX,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../backend.d";
import { UserRole } from "../backend.d";

interface AdminPanelProps {
  users: UserProfile[];
  myProfile: UserProfile | null;
  children: React.ReactNode;
}

export default function AdminPanel({
  users,
  myProfile,
  children,
}: AdminPanelProps) {
  const [open, setOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const banUser = useBanUser();
  const unbanUser = useUnbanUser();
  const muteUser = useMuteUser();
  const unmuteUser = useUnmuteUser();
  const kickUser = useKickUser();
  const promoteUser = usePromoteUser();
  const demoteUser = useDemoteUser();

  const isOwner = myProfile?.role === UserRole.owner;

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
        className="w-full sm:w-[600px] sm:max-w-[600px] border-l border-border p-0"
        style={{ backgroundColor: "oklch(var(--nexus-surface-1))" }}
      >
        <SheetHeader className="px-6 py-4 border-b border-border">
          <SheetTitle className="font-display flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Admin Panel
            {isOwner && (
              <Badge className="ml-2 text-owner border-owner bg-owner font-mono-custom text-[10px]">
                👑 OWNER
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="p-4">
          <Tabs defaultValue="users">
            <TabsList className="w-full bg-muted/50">
              <TabsTrigger
                value="users"
                className="flex-1 font-mono-custom text-xs"
              >
                User Management
              </TabsTrigger>
              <TabsTrigger
                value="info"
                className="flex-1 font-mono-custom text-xs"
              >
                Server Info
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="mt-4">
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow
                      style={{
                        backgroundColor: "oklch(var(--nexus-surface-2))",
                      }}
                    >
                      <TableHead className="font-mono-custom text-xs">
                        User
                      </TableHead>
                      <TableHead className="font-mono-custom text-xs">
                        Role
                      </TableHead>
                      <TableHead className="font-mono-custom text-xs">
                        Status
                      </TableHead>
                      <TableHead className="font-mono-custom text-xs text-right">
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
                          style={
                            isMe
                              ? {
                                  backgroundColor:
                                    "oklch(0.62 0.22 255 / 0.05)",
                                }
                              : {}
                          }
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
                                        ? "linear-gradient(135deg, oklch(0.62 0.22 255), oklch(0.52 0.22 295))"
                                        : "oklch(0.30 0.02 264)",
                                }}
                              >
                                {user.username[0]?.toUpperCase()}
                              </div>
                              <div>
                                <span className="font-mono-custom text-xs font-semibold">
                                  {user.role === UserRole.owner && "👑 "}
                                  {user.username}
                                  {isMe && (
                                    <span className="text-muted-foreground ml-1">
                                      (you)
                                    </span>
                                  )}
                                </span>
                                <p className="text-[10px] text-muted-foreground font-mono-custom truncate max-w-[100px]">
                                  {userId.slice(0, 12)}...
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`text-xs font-mono-custom font-semibold ${
                                user.role === UserRole.owner
                                  ? "text-owner"
                                  : user.role === UserRole.admin
                                    ? "text-admin-role"
                                    : "text-muted-foreground"
                              }`}
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
                                <Badge className="text-[9px] py-0 px-1 bg-muted text-muted-foreground">
                                  muted
                                </Badge>
                              )}
                              {!user.isBanned && !user.isMuted && (
                                <span
                                  className="text-[10px] font-mono-custom"
                                  style={{
                                    color: "oklch(var(--nexus-online))",
                                  }}
                                >
                                  active
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {!isMe && !isTargetOwner && (
                              <div className="flex items-center justify-end gap-1 flex-wrap">
                                {/* Ban/Unban */}
                                <ActionButton
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
                                    user.isBanned ? "secondary" : "destructive"
                                  }
                                />

                                {/* Mute/Unmute */}
                                <ActionButton
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

                                {/* Kick */}
                                <ActionButton
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
                                  variant="destructive"
                                />

                                {/* Promote/Demote (owner only) */}
                                {isOwner && (
                                  <>
                                    {user.role !== UserRole.admin && (
                                      <ActionButton
                                        onClick={() =>
                                          void runAction(
                                            () =>
                                              promoteUser.mutateAsync(userId),
                                            "Promote",
                                            userId,
                                          )
                                        }
                                        isPending={isPending("Promote", userId)}
                                        icon={<ArrowUp className="w-3 h-3" />}
                                        label="Promote"
                                        variant="outline"
                                      />
                                    )}
                                    {user.role === UserRole.admin && (
                                      <ActionButton
                                        onClick={() =>
                                          void runAction(
                                            () =>
                                              demoteUser.mutateAsync(userId),
                                            "Demote",
                                            userId,
                                          )
                                        }
                                        isPending={isPending("Demote", userId)}
                                        icon={<ArrowDown className="w-3 h-3" />}
                                        label="Demote"
                                        variant="outline"
                                      />
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                            {isTargetOwner && !isMe && (
                              <span className="text-[10px] text-owner font-mono-custom">
                                Owner — protected
                              </span>
                            )}
                            {isMe && (
                              <span className="text-[10px] text-muted-foreground font-mono-custom">
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
            </TabsContent>

            <TabsContent value="info" className="mt-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                <div
                  className="rounded-lg border border-border p-4 space-y-3"
                  style={{ backgroundColor: "oklch(var(--nexus-surface-2))" }}
                >
                  <p className="font-mono-custom text-xs text-muted-foreground uppercase tracking-widest">
                    Server Stats
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <StatCard label="Total Users" value={users.length} />
                    <StatCard
                      label="Admins"
                      value={
                        users.filter((u) => u.role === UserRole.admin).length
                      }
                    />
                    <StatCard
                      label="Banned"
                      value={users.filter((u) => u.isBanned).length}
                      highlight={users.filter((u) => u.isBanned).length > 0}
                    />
                    <StatCard
                      label="Muted"
                      value={users.filter((u) => u.isMuted).length}
                    />
                  </div>
                </div>

                <div
                  className="rounded-lg border border-border p-4"
                  style={{ backgroundColor: "oklch(var(--nexus-surface-2))" }}
                >
                  <p className="font-mono-custom text-xs text-muted-foreground uppercase tracking-widest mb-3">
                    Your Profile
                  </p>
                  {myProfile && (
                    <div className="space-y-2">
                      <InfoRow label="Username" value={myProfile.username} />
                      <InfoRow label="Role" value={myProfile.role} highlight />
                      <InfoRow
                        label="Principal"
                        value={`${myProfile.principal.toString().slice(0, 16)}...`}
                        mono
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ActionButton({
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
  variant?: "secondary" | "destructive" | "outline";
}) {
  return (
    <Button
      size="sm"
      variant={variant}
      onClick={onClick}
      disabled={isPending}
      className="h-6 px-2 text-[10px] font-mono-custom gap-1"
    >
      {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : icon}
      {label}
    </Button>
  );
}

function StatCard({
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
      className="rounded-md p-3 border border-border"
      style={{ backgroundColor: "oklch(var(--nexus-surface-1))" }}
    >
      <p className="text-[10px] text-muted-foreground font-mono-custom">
        {label}
      </p>
      <p
        className={`text-2xl font-display font-bold mt-1 ${highlight && value > 0 ? "text-destructive" : "text-foreground"}`}
      >
        {value}
      </p>
    </div>
  );
}

function InfoRow({
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
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground font-mono-custom">
        {label}
      </span>
      <span
        className={`text-xs font-semibold truncate ${
          mono ? "font-mono-custom" : ""
        } ${highlight ? "text-primary" : "text-foreground"}`}
      >
        {value}
      </span>
    </div>
  );
}
