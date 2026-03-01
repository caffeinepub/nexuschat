import AdminPanel from "@/components/AdminPanel";
import AuthScreen from "@/components/AuthScreen";
import ChannelSidebar from "@/components/ChannelSidebar";
import ChatPane from "@/components/ChatPane";
import ShutdownOverlay from "@/components/ShutdownOverlay";
import UsersSidebar from "@/components/UsersSidebar";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { useActor } from "@/hooks/useActor";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import {
  useChannels,
  useIsRegistered,
  useMyProfile,
  useShutdownStatus,
  useUsers,
} from "@/hooks/useQueries";
import { Loader2, LogOut, Shield, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { UserRole } from "./backend.d";
import type { Channel } from "./backend.d";

export default function App() {
  const { identity, clear, isInitializing } = useInternetIdentity();
  const { isFetching: actorFetching } = useActor();
  const [selectedChannelId, setSelectedChannelId] = useState<bigint | null>(
    null,
  );
  const [registeredFlag, setRegisteredFlag] = useState(false);

  const isRegisteredQuery = useIsRegistered();
  const myProfileQuery = useMyProfile();
  const channelsQuery = useChannels();
  const usersQuery = useUsers();
  const shutdownQuery = useShutdownStatus();

  const isLoggedIn = !!identity;
  const isRegistered = isRegisteredQuery.data === true || registeredFlag;

  const myProfile = myProfileQuery.data ?? null;
  const channels = channelsQuery.data ?? [];
  const users = usersQuery.data ?? [];

  // Auto-select first channel
  useEffect(() => {
    if (channels.length > 0 && selectedChannelId === null) {
      setSelectedChannelId(channels[0].id);
    }
  }, [channels, selectedChannelId]);

  const selectedChannel: Channel | null =
    channels.find((c) => c.id === selectedChannelId) ?? null;

  const isAdmin =
    myProfile?.role === UserRole.admin || myProfile?.role === UserRole.owner;
  const isOwner = myProfile?.role === UserRole.owner;

  const shutdownStatus = shutdownQuery.data;
  const isShutdownActive = shutdownStatus?.active === true;
  const showShutdownOverlay = isShutdownActive && !isOwner;

  // Loading state
  if (
    isInitializing ||
    (isLoggedIn &&
      actorFetching &&
      !myProfileQuery.data &&
      !isRegisteredQuery.data)
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center nexus-glow"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.62 0.22 255), oklch(0.52 0.22 295))",
            }}
          >
            <Zap className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="font-mono-custom text-sm text-muted-foreground">
              Connecting to network...
            </span>
          </div>
        </motion.div>
      </div>
    );
  }

  // Show auth screen if not logged in or not registered
  if (!isLoggedIn || !isRegistered) {
    return (
      <>
        <AuthScreen
          isRegistered={isRegistered}
          onRegistered={() => setRegisteredFlag(true)}
        />
        <Toaster richColors theme="dark" position="top-right" />
      </>
    );
  }

  // Main app
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Toaster richColors theme="dark" position="top-right" />

      {/* Shutdown overlay for non-owner users */}
      <ShutdownOverlay
        active={showShutdownOverlay}
        reason={shutdownStatus?.reason ?? ""}
        endsAt={shutdownStatus?.endsAt ?? 0n}
        startedBy={shutdownStatus?.startedBy ?? ""}
      />

      {/* Top bar */}
      <header
        className="h-10 flex items-center justify-between px-4 border-b border-border flex-shrink-0 z-10"
        style={{
          backgroundColor: "oklch(0.09 0.006 264)",
          boxShadow: "0 1px 0 oklch(var(--border))",
        }}
      >
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" strokeWidth={2.5} />
          <span className="font-display font-bold text-sm nexus-text-glow">
            NexusChat
          </span>
          <span className="font-mono-custom text-[10px] text-muted-foreground">
            {/* v2.0 */}
            v2.0
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <AdminPanel users={users} myProfile={myProfile}>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs font-mono-custom text-muted-foreground hover:text-foreground"
              >
                <Shield className="w-3.5 h-3.5 mr-1.5" />
                Admin
              </Button>
            </AdminPanel>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={clear}
            className="h-7 px-2 text-xs font-mono-custom text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-3.5 h-3.5 mr-1.5" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Channel sidebar */}
        <AnimatePresence>
          <motion.div
            initial={{ x: -240, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-56 flex-shrink-0 border-r border-border"
          >
            <ChannelSidebar
              channels={channels}
              selectedChannelId={selectedChannelId}
              onSelectChannel={setSelectedChannelId}
              myProfile={myProfile}
            />
          </motion.div>
        </AnimatePresence>

        {/* Chat pane */}
        <main className="flex-1 flex overflow-hidden">
          <ChatPane
            channel={selectedChannel}
            myProfile={myProfile}
            users={users}
          />
        </main>

        {/* Users sidebar */}
        <AnimatePresence>
          <motion.div
            initial={{ x: 208, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeOut", delay: 0.1 }}
            className="hidden lg:block"
          >
            <UsersSidebar users={users} myProfile={myProfile} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
