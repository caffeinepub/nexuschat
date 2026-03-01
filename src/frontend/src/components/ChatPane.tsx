import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useBanUser,
  useCancelShutdown,
  useDemoteUser,
  useKickUser,
  useMessages,
  useMuteUser,
  usePromoteUser,
  useSendMessage,
  useStartShutdown,
  useUnbanUser,
  useUnmuteUser,
} from "@/hooks/useQueries";
import { Bot, Hash, Loader2, Send, Wifi, WifiOff } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Channel, UserProfile } from "../backend.d";
import { UserRole } from "../backend.d";
import MessageItem from "./MessageItem";

// ── Bot Message Types ────────────────────────────────────────────────────────

interface BotMessage {
  id: string;
  content: string;
  timestamp: number;
  isError?: boolean;
}

// ── Help text ────────────────────────────────────────────────────────────────

const HELP_TEXT = `📋 **Available Commands:**
/mute @user · /unmute @user · /ban @user · /unban @user · /kick @user
/promote @user · /demote @user · /announce <message> · /stats · /help
👑 Owner only: /shutdown <reason> <minutes> · /cancelshutdown`;

const COMMAND_LIST = [
  "mute",
  "unmute",
  "ban",
  "unban",
  "kick",
  "promote",
  "demote",
  "help",
  "stats",
  "shutdown",
  "cancelshutdown",
  "clear",
  "announce",
  "slowmode",
  "lock",
  "unlock",
  "nick",
  "warn",
  "timeout",
  "role",
  "pin",
  "unpin",
];

// ── ChatPane Props ───────────────────────────────────────────────────────────

interface ChatPaneProps {
  channel: Channel | null;
  myProfile: UserProfile | null;
  users: UserProfile[];
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function ChatPane({ channel, myProfile, users }: ChatPaneProps) {
  const [inputValue, setInputValue] = useState("");
  const [botMessages, setBotMessages] = useState<BotMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(0);
  const isAtBottomRef = useRef(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const messagesQuery = useMessages(channel?.id ?? null);
  const messages = messagesQuery.data ?? [];
  const sendMessage = useSendMessage(channel?.id ?? null);

  // Admin hooks for bot commands
  const muteUser = useMuteUser();
  const unmuteUser = useUnmuteUser();
  const banUser = useBanUser();
  const unbanUser = useUnbanUser();
  const kickUser = useKickUser();
  const promoteUser = usePromoteUser();
  const demoteUser = useDemoteUser();
  const startShutdown = useStartShutdown();
  const cancelShutdown = useCancelShutdown();

  // Track if user is near bottom
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 80;
    isAtBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  };

  // Auto-scroll to bottom when new messages arrive (if near bottom)
  useEffect(() => {
    if (!scrollRef.current) return;
    const newCount = messages.length + botMessages.length;
    if (newCount > prevMessageCountRef.current && isAtBottomRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    prevMessageCountRef.current = newCount;
  }, [messages.length, botMessages.length]);

  // Scroll to bottom on channel change
  const channelId = channel?.id?.toString() ?? "";
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional — scroll when channel changes
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    isAtBottomRef.current = true;
  }, [channelId]);

  // Clear bot messages on channel change
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional — clear bot messages when channel changes
  useEffect(() => {
    setBotMessages([]);
  }, [channelId]);

  // ── Bot reply helper ─────────────────────────────────────────────────────

  const addBotMessage = (content: string, isError = false) => {
    const msg: BotMessage = {
      id: `bot-${Date.now()}-${Math.random()}`,
      content,
      timestamp: Date.now(),
      isError,
    };
    setBotMessages((prev) => [...prev, msg]);
    // Auto-scroll
    setTimeout(() => {
      if (scrollRef.current && isAtBottomRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 50);
  };

  // ── Slash command handler ─────────────────────────────────────────────────

  const handleSlashCommand = async (raw: string) => {
    const parts = raw.trim().split(/\s+/);
    const cmdName = parts[0]?.slice(1).toLowerCase(); // strip "/"
    const targetArg = parts[1]; // e.g. "@C.D"

    const isAdmin =
      myProfile?.role === UserRole.admin || myProfile?.role === UserRole.owner;

    // Unknown command
    if (!COMMAND_LIST.includes(cmdName)) {
      addBotMessage(
        `❌ Unknown command \`${parts[0]}\`. Type \`/help\` to see available commands.`,
        true,
      );
      return;
    }

    // /help
    if (cmdName === "help") {
      addBotMessage(HELP_TEXT);
      return;
    }

    // /stats
    if (cmdName === "stats") {
      const total = users.length;
      const admins = users.filter((u) => u.role === UserRole.admin).length;
      const banned = users.filter((u) => u.isBanned).length;
      const muted = users.filter((u) => u.isMuted).length;
      addBotMessage(
        `📊 **Server Stats**\n👥 Users: ${total} · 🛡️ Admins: ${admins} · 🚫 Banned: ${banned} · 🔇 Muted: ${muted}`,
      );
      return;
    }

    // /shutdown (owner only)
    if (cmdName === "shutdown") {
      if (myProfile?.role !== UserRole.owner) {
        addBotMessage("❌ Owner only command.", true);
        return;
      }
      // Parse: everything before last token is reason, last token is minutes
      if (parts.length < 3) {
        addBotMessage("❌ Usage: /shutdown <reason> <minutes>", true);
        return;
      }
      const durationStr = parts[parts.length - 1];
      const durationMinutes = Number(durationStr);
      if (Number.isNaN(durationMinutes) || durationMinutes <= 0) {
        addBotMessage(
          "❌ Usage: /shutdown <reason> <minutes> — minutes must be a positive number.",
          true,
        );
        return;
      }
      const reason = parts.slice(1, parts.length - 1).join(" ");
      if (!reason.trim()) {
        addBotMessage("❌ Usage: /shutdown <reason> <minutes>", true);
        return;
      }
      try {
        await startShutdown.mutateAsync({
          reason,
          durationSeconds: durationMinutes * 60,
        });
        addBotMessage(
          `🔴 **Server shutdown initiated** for ${durationMinutes} minute${durationMinutes === 1 ? "" : "s"}. Reason: ${reason}`,
        );
      } catch (err) {
        addBotMessage(
          `❌ Shutdown failed: ${err instanceof Error ? err.message : "Unknown error"}`,
          true,
        );
      }
      return;
    }

    // /cancelshutdown (owner only)
    if (cmdName === "cancelshutdown") {
      if (myProfile?.role !== UserRole.owner) {
        addBotMessage("❌ Owner only command.", true);
        return;
      }
      try {
        await cancelShutdown.mutateAsync();
        addBotMessage("✅ **Shutdown cancelled.** Server is back online.");
      } catch (err) {
        addBotMessage(
          `❌ Cancel failed: ${err instanceof Error ? err.message : "Unknown error"}`,
          true,
        );
      }
      return;
    }

    // Commands below require admin/owner
    if (!isAdmin) {
      addBotMessage("❌ You don't have permission to use that command.", true);
      return;
    }

    // Commands that need a target user
    const actionCmds = [
      "mute",
      "unmute",
      "ban",
      "unban",
      "kick",
      "promote",
      "demote",
    ];
    if (actionCmds.includes(cmdName)) {
      if (!targetArg) {
        addBotMessage(`❌ Usage: /${cmdName} @username`, true);
        return;
      }
      const username = targetArg.startsWith("@")
        ? targetArg.slice(1)
        : targetArg;
      const targetUser = users.find(
        (u) => u.username.toLowerCase() === username.toLowerCase(),
      );
      if (!targetUser) {
        addBotMessage(`❌ User '@${username}' not found.`, true);
        return;
      }
      const principalStr = targetUser.principal.toString();

      try {
        switch (cmdName) {
          case "mute":
            await muteUser.mutateAsync(principalStr);
            addBotMessage(`🔇 **${targetUser.username}** has been muted.`);
            break;
          case "unmute":
            await unmuteUser.mutateAsync(principalStr);
            addBotMessage(`🔊 **${targetUser.username}** has been unmuted.`);
            break;
          case "ban":
            await banUser.mutateAsync(principalStr);
            addBotMessage(`🚫 **${targetUser.username}** has been banned.`);
            break;
          case "unban":
            await unbanUser.mutateAsync(principalStr);
            addBotMessage(`✅ **${targetUser.username}** has been unbanned.`);
            break;
          case "kick":
            await kickUser.mutateAsync(principalStr);
            addBotMessage(`👢 **${targetUser.username}** has been kicked.`);
            break;
          case "promote":
            await promoteUser.mutateAsync(principalStr);
            addBotMessage(
              `⬆️ **${targetUser.username}** has been promoted to Admin.`,
            );
            break;
          case "demote":
            await demoteUser.mutateAsync(principalStr);
            addBotMessage(
              `⬇️ **${targetUser.username}** has been demoted to Member.`,
            );
            break;
        }
      } catch (err) {
        addBotMessage(
          `❌ Command failed: ${err instanceof Error ? err.message : "Unknown error"}`,
          true,
        );
      }
      return;
    }

    // /announce (admin/owner only)
    if (cmdName === "announce") {
      if (!isAdmin) {
        addBotMessage("❌ Admin or owner required for /announce.", true);
        return;
      }
      const text = parts.slice(1).join(" ").trim();
      if (!text) {
        addBotMessage("❌ Usage: /announce <message>", true);
        return;
      }
      try {
        await sendMessage.mutateAsync(`📢 **ANNOUNCEMENT** 📢\n${text}`);
        addBotMessage(
          `✅ Announcement sent to #${channel?.name ?? "channel"}.`,
        );
      } catch (err) {
        addBotMessage(
          `❌ Announce failed: ${err instanceof Error ? err.message : "Unknown error"}`,
          true,
        );
      }
      return;
    }

    // Informational-only commands (not yet implemented in backend)
    const infoOnlyCmds: Record<string, string> = {
      clear: "🗑️ /clear is owner-only. Use the admin panel to manage messages.",
      slowmode: "⏱️ /slowmode is not yet available in this version.",
      lock: "🔒 /lock is not yet available in this version.",
      unlock: "🔓 /unlock is not yet available in this version.",
      nick: "✏️ /nick is not yet available in this version.",
      warn: "⚠️ /warn is not yet available in this version.",
      timeout: "⏰ /timeout is not yet available in this version.",
      role: "🎭 /role is not yet available in this version.",
      pin: "📌 /pin is not yet available in this version.",
      unpin: "📌 /unpin is not yet available in this version.",
    };
    if (infoOnlyCmds[cmdName]) {
      addBotMessage(infoOnlyCmds[cmdName]);
    }
  };

  // ── Send handler ──────────────────────────────────────────────────────────

  const handleSend = async () => {
    const content = inputValue.trim();
    if (!content) return;

    // Slash command
    if (content.startsWith("/")) {
      setInputValue("");
      await handleSlashCommand(content);
      return;
    }

    if (myProfile?.isMuted) {
      toast.error("You are muted and cannot send messages");
      return;
    }
    if (myProfile?.isBanned) {
      toast.error("You are banned from this server");
      return;
    }
    setInputValue("");
    try {
      await sendMessage.mutateAsync(content);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
      setInputValue(content);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  if (!channel) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <Hash className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="text-muted-foreground font-mono-custom text-sm">
            Select a channel to start chatting
          </p>
        </div>
      </div>
    );
  }

  // ── Merge real messages with bot messages by timestamp ────────────────────
  // Bot messages use local ms timestamps; real messages use nanoseconds (bigint)
  const mergedItems: Array<
    | { type: "real"; msg: (typeof messages)[0]; key: string }
    | { type: "bot"; msg: BotMessage; key: string }
  > = [
    ...messages.map((m) => ({
      type: "real" as const,
      msg: m,
      key: m.id.toString(),
      sortTs: Number(m.timestamp) / 1_000_000, // ns → ms
    })),
    ...botMessages.map((b) => ({
      type: "bot" as const,
      msg: b,
      key: b.id,
      sortTs: b.timestamp,
    })),
  ].sort((a, b) => a.sortTs - b.sortTs);

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      {/* Channel header */}
      <div
        className="h-14 flex items-center justify-between px-4 border-b border-border flex-shrink-0"
        style={{ backgroundColor: "oklch(var(--nexus-surface-1))" }}
      >
        <div className="flex items-center gap-2">
          <Hash className="w-5 h-5 text-muted-foreground" />
          <span className="font-display font-semibold text-foreground">
            {channel.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {messagesQuery.isRefetching ? (
            <Wifi className="w-4 h-4 text-primary animate-pulse" />
          ) : messagesQuery.isError ? (
            <WifiOff className="w-4 h-4 text-destructive" />
          ) : (
            <div className="flex items-center gap-1.5">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: "oklch(var(--nexus-online))" }}
              />
              <span className="text-[10px] text-muted-foreground font-mono-custom">
                live
              </span>
            </div>
          )}
          <span className="text-xs text-muted-foreground font-mono-custom">
            {messages.length} messages
          </span>
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto py-4 space-y-1"
      >
        {messagesQuery.isLoading ? (
          <div className="space-y-3 px-4">
            {Array.from({ length: 6 }, (_, i) => `skel-${i}`).map((key) => (
              <div key={key} className="flex gap-3">
                <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </div>
            ))}
          </div>
        ) : mergedItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full gap-3"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: "oklch(var(--nexus-surface-2))" }}
            >
              <Hash className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-display font-semibold text-lg">
                #{channel.name}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Be the first to send a message in this channel!
              </p>
            </div>
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
            {mergedItems.map((item, idx) =>
              item.type === "bot" ? (
                <BotMessageItem key={item.key} message={item.msg} />
              ) : (
                <MessageItem
                  key={item.key}
                  message={item.msg}
                  myProfile={myProfile}
                  users={users}
                  isNew={idx === mergedItems.length - 1 && item.type === "real"}
                />
              ),
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Message input */}
      <div
        className="flex-shrink-0 px-4 pb-4"
        style={{ backgroundColor: "oklch(var(--background))" }}
      >
        {myProfile?.isBanned && (
          <div className="mb-2 px-3 py-2 rounded-md bg-destructive/10 border border-destructive/30">
            <p className="text-xs text-destructive font-mono-custom">
              You are banned from this server.
            </p>
          </div>
        )}
        {myProfile?.isMuted && (
          <div className="mb-2 px-3 py-2 rounded-md bg-muted border border-border">
            <p className="text-xs text-muted-foreground font-mono-custom">
              You are muted. You cannot send messages.
            </p>
          </div>
        )}
        <div
          className="flex items-end gap-2 rounded-xl border border-border px-3 py-2 focus-within:border-primary transition-colors"
          style={{ backgroundColor: "oklch(var(--nexus-surface-2))" }}
        >
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              myProfile?.isBanned
                ? "You are banned..."
                : myProfile?.isMuted
                  ? "You are muted..."
                  : `Message #${channel.name} · Type / for commands`
            }
            disabled={
              (myProfile?.isBanned || myProfile?.isMuted) &&
              !inputValue.startsWith("/")
            }
            rows={1}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none max-h-32 font-sans disabled:opacity-50 leading-relaxed"
            style={{ minHeight: "24px" }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
            }}
          />
          <Button
            onClick={() => void handleSend()}
            disabled={
              !inputValue.trim() ||
              sendMessage.isPending ||
              (myProfile?.isBanned && !inputValue.startsWith("/")) ||
              (myProfile?.isMuted && !inputValue.startsWith("/"))
            }
            size="icon"
            className="h-8 w-8 flex-shrink-0 rounded-lg transition-all"
            style={{
              background: inputValue.trim()
                ? "linear-gradient(135deg, oklch(0.62 0.22 255), oklch(0.52 0.22 295))"
                : undefined,
            }}
          >
            {sendMessage.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 px-1 font-mono-custom">
          Enter to send · Shift+Enter for new line · Type{" "}
          <span style={{ color: "oklch(0.70 0.14 220)" }}>/help</span> for
          commands
        </p>
      </div>
    </div>
  );
}

// ── BotMessageItem ────────────────────────────────────────────────────────────

function BotMessageItem({ message }: { message: BotMessage }) {
  const lines = message.content.split("\n");

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex gap-3 px-4 py-2 group"
    >
      {/* Bot avatar */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 self-start mt-0.5"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.52 0.22 230), oklch(0.45 0.20 260))",
          boxShadow: "0 0 10px oklch(0.62 0.22 220 / 0.4)",
        }}
      >
        <Bot className="w-4 h-4 text-white" />
      </div>

      <div className="flex-1 min-w-0">
        {/* Bot name + timestamp */}
        <div className="flex items-baseline gap-2 mb-0.5">
          <span
            className="text-sm font-semibold font-mono-custom"
            style={{
              color: "oklch(0.78 0.20 215)",
              textShadow: "0 0 8px oklch(0.62 0.22 215 / 0.5)",
            }}
          >
            NexusBot
          </span>
          <span className="text-[10px] text-muted-foreground font-mono-custom">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span
            className="text-[9px] font-mono-custom px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: "oklch(0.55 0.22 220 / 0.12)",
              color: "oklch(0.62 0.14 220)",
              border: "1px solid oklch(0.62 0.22 220 / 0.2)",
            }}
          >
            BOT
          </span>
        </div>

        {/* Message bubble */}
        <div
          className="rounded-r-lg rounded-bl-lg px-3 py-2 max-w-lg border-l-2"
          style={{
            backgroundColor: message.isError
              ? "oklch(0.62 0.22 22 / 0.07)"
              : "oklch(0.55 0.22 220 / 0.07)",
            borderLeftColor: message.isError
              ? "oklch(0.62 0.22 22 / 0.5)"
              : "oklch(0.62 0.22 220 / 0.5)",
          }}
        >
          {lines.map((line) => (
            <p
              key={
                line.length > 0 ? line.slice(0, 40) : `empty-${Math.random()}`
              }
              className="text-sm font-sans leading-relaxed"
              style={{
                color: message.isError
                  ? "oklch(0.78 0.16 22)"
                  : "oklch(0.85 0.05 220)",
              }}
            >
              {line}
            </p>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
