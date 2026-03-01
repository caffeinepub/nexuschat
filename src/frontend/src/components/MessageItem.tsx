import { useDeleteMessage } from "@/hooks/useQueries";
import { Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Message, UserProfile } from "../backend.d";
import { UserRole } from "../backend.d";
import RoleBadge from "./RoleBadge";

interface MessageItemProps {
  message: Message;
  myProfile: UserProfile | null;
  users: UserProfile[];
  isNew?: boolean;
}

function formatTime(ts: bigint): string {
  const ms = Number(ts / BigInt(1_000_000));
  const date = new Date(ms);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return `${date.toLocaleDateString([], { month: "short", day: "numeric" })} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

export default function MessageItem({
  message,
  myProfile,
  users,
  isNew = false,
}: MessageItemProps) {
  const [hovered, setHovered] = useState(false);
  const deleteMessage = useDeleteMessage();

  const author = users.find(
    (u) => u.principal.toString() === message.authorPrincipal.toString(),
  );
  const authorRole = author?.role ?? UserRole.member;

  const canDelete =
    myProfile?.role === UserRole.admin ||
    myProfile?.role === UserRole.owner ||
    myProfile?.principal.toString() === message.authorPrincipal.toString();

  const handleDelete = async () => {
    try {
      await deleteMessage.mutateAsync({
        channelId: message.channelId,
        messageId: message.id,
      });
      toast.success("Message deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: 8 } : { opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative flex items-start gap-3 px-4 py-2 hover:bg-accent/20 rounded-lg mx-2 transition-colors"
    >
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5 text-white"
        style={{
          background:
            authorRole === UserRole.owner
              ? "linear-gradient(135deg, oklch(0.78 0.18 85), oklch(0.68 0.16 65))"
              : authorRole === UserRole.admin
                ? "linear-gradient(135deg, oklch(0.62 0.22 255), oklch(0.52 0.22 295))"
                : "oklch(0.30 0.02 264)",
        }}
      >
        {message.authorUsername[0]?.toUpperCase() ?? "?"}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span
            className={`font-semibold text-sm font-mono-custom ${
              authorRole === UserRole.owner
                ? "text-owner"
                : authorRole === UserRole.admin
                  ? "text-admin-role"
                  : "text-foreground"
            }`}
          >
            {authorRole === UserRole.owner && <span className="mr-1">👑</span>}
            {message.authorUsername}
          </span>
          <RoleBadge role={authorRole} size="sm" />
          <span className="text-[10px] text-muted-foreground font-mono-custom">
            {formatTime(message.timestamp)}
          </span>
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed break-words whitespace-pre-wrap">
          {message.content}
        </p>
      </div>

      {/* Delete button */}
      {canDelete && hovered && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => void handleDelete()}
          disabled={deleteMessage.isPending}
          className="absolute right-2 top-2 w-7 h-7 flex items-center justify-center rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
          title="Delete message"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </motion.button>
      )}
    </motion.div>
  );
}
