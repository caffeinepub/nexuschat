import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCreateChannel, useDeleteChannel } from "@/hooks/useQueries";
import { Hash, Loader2, Plus, Trash2, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Channel, UserProfile } from "../backend.d";
import { UserRole } from "../backend.d";

interface ChannelSidebarProps {
  channels: Channel[];
  selectedChannelId: bigint | null;
  onSelectChannel: (id: bigint) => void;
  myProfile: UserProfile | null;
}

export default function ChannelSidebar({
  channels,
  selectedChannelId,
  onSelectChannel,
  myProfile,
}: ChannelSidebarProps) {
  const [newChannelName, setNewChannelName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const createChannel = useCreateChannel();
  const deleteChannel = useDeleteChannel();

  const isAdmin =
    myProfile?.role === UserRole.admin || myProfile?.role === UserRole.owner;
  const isOwner = myProfile?.role === UserRole.owner;

  const handleCreate = async () => {
    const name = newChannelName.trim().toLowerCase().replace(/\s+/g, "-");
    if (!name) {
      toast.error("Channel name cannot be empty");
      return;
    }
    try {
      const channel = await createChannel.mutateAsync(name);
      toast.success(`#${channel.name} created`);
      setNewChannelName("");
      setDialogOpen(false);
      onSelectChannel(channel.id);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create channel",
      );
    }
  };

  const handleDelete = async (e: React.MouseEvent, channelId: bigint) => {
    e.stopPropagation();
    try {
      await deleteChannel.mutateAsync(channelId);
      toast.success("Channel deleted");
      if (selectedChannelId === channelId && channels.length > 1) {
        const next = channels.find((c) => c.id !== channelId);
        if (next) onSelectChannel(next.id);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  return (
    <div
      className="flex flex-col h-full"
      style={{ backgroundColor: "oklch(var(--sidebar))" }}
    >
      {/* Server header */}
      <div
        className="h-14 flex items-center px-4 border-b border-border"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.14 0.02 264), oklch(0.12 0.02 264))",
        }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.62 0.22 255), oklch(0.52 0.22 295))",
            }}
          >
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-sm text-foreground truncate">
            NexusChat
          </span>
        </div>
      </div>

      {/* Channels section */}
      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-3 mb-1">
          <div className="flex items-center justify-between py-1">
            <span className="font-mono-custom text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
              Channels
            </span>
            {isAdmin && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </DialogTrigger>
                <DialogContent
                  className="border-border"
                  style={{ backgroundColor: "oklch(var(--nexus-surface-2))" }}
                >
                  <DialogHeader>
                    <DialogTitle className="font-display">
                      Create Channel
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Channel name (lowercase, no spaces)
                      </p>
                      <Input
                        value={newChannelName}
                        onChange={(e) => setNewChannelName(e.target.value)}
                        placeholder="general"
                        className="font-mono-custom"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void handleCreate();
                        }}
                        autoFocus
                      />
                    </div>
                    <Button
                      onClick={() => void handleCreate()}
                      disabled={
                        createChannel.isPending || !newChannelName.trim()
                      }
                      className="w-full"
                      style={{
                        background:
                          "linear-gradient(135deg, oklch(0.62 0.22 255), oklch(0.52 0.22 295))",
                        color: "white",
                      }}
                    >
                      {createChannel.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Create Channel
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <div className="space-y-0.5 px-2">
          <AnimatePresence>
            {channels.map((channel) => (
              <motion.div
                key={channel.id.toString()}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
              >
                <button
                  type="button"
                  onClick={() => onSelectChannel(channel.id)}
                  className={`group w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-sm transition-all ${
                    selectedChannelId === channel.id
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                  style={
                    selectedChannelId === channel.id
                      ? {
                          backgroundColor: "oklch(0.62 0.22 255 / 0.15)",
                          boxShadow: "inset 3px 0 0 oklch(0.62 0.22 255)",
                        }
                      : {}
                  }
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Hash className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                    <span className="truncate font-mono-custom text-xs">
                      {channel.name}
                    </span>
                  </div>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={(e) => void handleDelete(e, channel.id)}
                      className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded hover:bg-destructive/20 hover:text-destructive transition-all flex-shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {channels.length === 0 && (
            <p className="text-xs text-muted-foreground px-2 py-2 font-mono-custom">
              No channels yet
            </p>
          )}
        </div>
      </div>

      {/* User info at bottom */}
      {myProfile && (
        <div
          className="h-14 flex items-center px-3 gap-2 border-t border-border"
          style={{ backgroundColor: "oklch(0.10 0.008 264)" }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
            style={{
              background:
                myProfile.role === UserRole.owner
                  ? "linear-gradient(135deg, oklch(0.78 0.18 85), oklch(0.68 0.16 65))"
                  : myProfile.role === UserRole.admin
                    ? "linear-gradient(135deg, oklch(0.62 0.22 255), oklch(0.52 0.22 295))"
                    : "oklch(0.30 0.02 264)",
            }}
          >
            {myProfile.username[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold font-mono-custom truncate flex items-center gap-1">
              {myProfile.role === UserRole.owner && (
                <span className="text-owner">👑</span>
              )}
              {myProfile.username}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {myProfile.role === UserRole.owner
                ? "Owner"
                : myProfile.role === UserRole.admin
                  ? "Admin"
                  : "Member"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
