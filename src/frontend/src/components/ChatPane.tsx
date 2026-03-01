import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMessages, useSendMessage } from "@/hooks/useQueries";
import { Hash, Loader2, Send, Wifi, WifiOff } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Channel, UserProfile } from "../backend.d";
import MessageItem from "./MessageItem";

interface ChatPaneProps {
  channel: Channel | null;
  myProfile: UserProfile | null;
  users: UserProfile[];
}

export default function ChatPane({ channel, myProfile, users }: ChatPaneProps) {
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(0);
  const isAtBottomRef = useRef(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const messagesQuery = useMessages(channel?.id ?? null);
  const messages = messagesQuery.data ?? [];
  const sendMessage = useSendMessage(channel?.id ?? null);

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
    const newCount = messages.length;
    if (newCount > prevMessageCountRef.current && isAtBottomRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    prevMessageCountRef.current = newCount;
  }, [messages.length]);

  // Scroll to bottom on channel change
  const channelId = channel?.id?.toString() ?? "";
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional — scroll when channel changes
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    isAtBottomRef.current = true;
  }, [channelId]);

  const handleSend = async () => {
    const content = inputValue.trim();
    if (!content) return;
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
        ) : messages.length === 0 ? (
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
            {messages.map((msg, idx) => (
              <MessageItem
                key={msg.id.toString()}
                message={msg}
                myProfile={myProfile}
                users={users}
                isNew={idx === messages.length - 1}
              />
            ))}
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
                  : `Message #${channel.name}`
            }
            disabled={
              myProfile?.isBanned || myProfile?.isMuted || sendMessage.isPending
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
              myProfile?.isBanned ||
              myProfile?.isMuted
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
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
