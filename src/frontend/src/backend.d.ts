import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Result_2 = {
    __kind__: "ok";
    ok: UserProfile;
} | {
    __kind__: "err";
    err: string;
};
export type Result = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: string;
};
export type Result_3 = {
    __kind__: "ok";
    ok: Channel;
} | {
    __kind__: "err";
    err: string;
};
export interface Message {
    id: bigint;
    authorUsername: string;
    content: string;
    channelId: bigint;
    timestamp: bigint;
    authorPrincipal: Principal;
}
export interface Channel {
    id: bigint;
    name: string;
    createdAt: bigint;
    createdBy: string;
}
export type Result_1 = {
    __kind__: "ok";
    ok: Message;
} | {
    __kind__: "err";
    err: string;
};
export interface UserProfile {
    principal: Principal;
    username: string;
    joinedAt: bigint;
    role: UserRole;
    isBanned: boolean;
    isMuted: boolean;
}
export enum UserRole {
    member = "member",
    admin = "admin",
    owner = "owner"
}
export enum UserRole__1 {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface mainInterface {
    assignCallerUserRole(user: Principal, role: UserRole__1): Promise<void>;
    banUser(target: Principal): Promise<Result>;
    createChannel(name: string): Promise<Result_3>;
    deleteChannel(channelId: bigint): Promise<Result>;
    deleteMessage(channelId: bigint, messageId: bigint): Promise<Result>;
    demoteUser(target: Principal): Promise<Result>;
    getCallerUserRole(): Promise<UserRole__1>;
    getMessages(channelId: bigint, since: bigint | null): Promise<Array<Message>>;
    getMyProfile(): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isRegistered(): Promise<boolean>;
    kickUser(target: Principal): Promise<Result>;
    listChannels(): Promise<Array<Channel>>;
    listUsers(): Promise<Array<UserProfile>>;
    muteUser(target: Principal): Promise<Result>;
    promoteUser(target: Principal): Promise<Result>;
    register(username: string): Promise<Result_2>;
    sendMessage(channelId: bigint, content: string): Promise<Result_1>;
    unbanUser(target: Principal): Promise<Result>;
    unmuteUser(target: Principal): Promise<Result>;
}

export type backendInterface = mainInterface;
export type CreateActorOptions = import("./backend").CreateActorOptions;
