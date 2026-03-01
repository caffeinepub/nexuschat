# NexusChat

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- User authentication (login/register with Internet Identity or username/password)
- User "C.D" is the hardcoded owner with full admin privileges
- Discord-like chat UI with multiple channels
- Real-time chat viewing: messages auto-refresh/poll so all users see new messages without manual reload
- Admin panel for managing users, channels, and messages
- Admin commands (ban, kick, mute, delete message, promote/demote)
- Channel management (create, rename, delete channels)
- Message history per channel
- Online user list / presence indicator
- User profiles with display names and roles (owner, admin, member)

### Modify
- N/A (new project)

### Remove
- N/A (new project)

## Implementation Plan
1. Backend (Motoko):
   - User store: principal -> { username, role: #owner | #admin | #member, isBanned, isMuted }
   - Seed owner: username "C.D" with role #owner
   - Channel store: channelId -> { name, createdBy, createdAt }
   - Message store: channelId -> [{ id, author, content, timestamp }]
   - APIs: register, login check, getProfile, listUsers, listChannels, createChannel, deleteChannel, sendMessage, getMessages, banUser, muteUser, kickUser, deleteMessage, promoteUser, demoteUser
   - Authorization checks on admin actions (only owner/admin can perform)

2. Frontend (React):
   - Auth screen: username registration / login
   - Main layout: sidebar (channels list + online users), main chat pane, admin panel toggle
   - Chat pane: message list with auto-polling (every 2s) for real-time viewing, message input
   - Admin panel: user management table, channel management, moderation commands
   - Role badges: Owner (gold), Admin (blue), Member (gray)
   - Owner "C.D" gets special crown indicator
