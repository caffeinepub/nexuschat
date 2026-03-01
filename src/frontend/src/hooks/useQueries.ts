import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Channel,
  Message,
  ShutdownStatus,
  UserProfile,
} from "../backend.d";
import { useActor } from "./useActor";

// ── Channels ──────────────────────────────────────────────────────────────────

export function useChannels() {
  const { actor, isFetching } = useActor();
  return useQuery<Channel[]>({
    queryKey: ["channels"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listChannels();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10_000,
  });
}

// ── Users ─────────────────────────────────────────────────────────────────────

export function useUsers() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile[]>({
    queryKey: ["users"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listUsers();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 8_000,
  });
}

// ── My Profile ────────────────────────────────────────────────────────────────

export function useMyProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["myProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMyProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

// ── Messages ──────────────────────────────────────────────────────────────────

export function useMessages(channelId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Message[]>({
    queryKey: ["messages", channelId?.toString()],
    queryFn: async () => {
      if (!actor || channelId === null) return [];
      return actor.getMessages(channelId, null);
    },
    enabled: !!actor && !isFetching && channelId !== null,
    refetchInterval: 2_000,
    staleTime: 0,
  });
}

// ── Is Registered ─────────────────────────────────────────────────────────────

export function useIsRegistered() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isRegistered"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isRegistered();
    },
    enabled: !!actor && !isFetching,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useRegister() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (username: string) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.register(username);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["isRegistered"] });
      void queryClient.invalidateQueries({ queryKey: ["myProfile"] });
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useSendMessage(channelId: bigint | null) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      if (!actor || channelId === null) throw new Error("Not ready");
      const result = await actor.sendMessage(channelId, content);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["messages", channelId?.toString()],
      });
    },
  });
}

export function useCreateChannel() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.createChannel(name);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["channels"] });
    },
  });
}

export function useDeleteChannel() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (channelId: bigint) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.deleteChannel(channelId);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["channels"] });
    },
  });
}

export function useDeleteMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      channelId,
      messageId,
    }: {
      channelId: bigint;
      messageId: bigint;
    }) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.deleteMessage(channelId, messageId);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["messages", variables.channelId.toString()],
      });
    },
  });
}

export function useBanUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (target: string) => {
      if (!actor) throw new Error("Not connected");
      const { Principal } = await import("@icp-sdk/core/principal");
      const result = await actor.banUser(Principal.fromText(target));
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useUnbanUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (target: string) => {
      if (!actor) throw new Error("Not connected");
      const { Principal } = await import("@icp-sdk/core/principal");
      const result = await actor.unbanUser(Principal.fromText(target));
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useMuteUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (target: string) => {
      if (!actor) throw new Error("Not connected");
      const { Principal } = await import("@icp-sdk/core/principal");
      const result = await actor.muteUser(Principal.fromText(target));
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useUnmuteUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (target: string) => {
      if (!actor) throw new Error("Not connected");
      const { Principal } = await import("@icp-sdk/core/principal");
      const result = await actor.unmuteUser(Principal.fromText(target));
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useKickUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (target: string) => {
      if (!actor) throw new Error("Not connected");
      const { Principal } = await import("@icp-sdk/core/principal");
      const result = await actor.kickUser(Principal.fromText(target));
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function usePromoteUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (target: string) => {
      if (!actor) throw new Error("Not connected");
      const { Principal } = await import("@icp-sdk/core/principal");
      const result = await actor.promoteUser(Principal.fromText(target));
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useDemoteUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (target: string) => {
      if (!actor) throw new Error("Not connected");
      const { Principal } = await import("@icp-sdk/core/principal");
      const result = await actor.demoteUser(Principal.fromText(target));
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}

// ── Shutdown ──────────────────────────────────────────────────────────────────

export function useShutdownStatus() {
  const { actor, isFetching } = useActor();
  return useQuery<ShutdownStatus>({
    queryKey: ["shutdownStatus"],
    queryFn: async () => {
      if (!actor)
        return {
          active: false,
          reason: "",
          endsAt: 0n,
          startedAt: 0n,
          startedBy: "",
        };
      return actor.getShutdownStatus();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 3_000,
  });
}

export function useStartShutdown() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      reason,
      durationSeconds,
    }: {
      reason: string;
      durationSeconds: number;
    }) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.startShutdown(reason, BigInt(durationSeconds));
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["shutdownStatus"] }),
  });
}

export function useCancelShutdown() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.cancelShutdown();
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["shutdownStatus"] }),
  });
}
