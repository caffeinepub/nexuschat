# NexusChat

## Current State
Full-featured Discord-like chat app with auth, channels, real-time messages, admin panel, NexusBot slash commands, shutdown overlay, and role-based permissions. Loading screen shows "Connecting to network..." while `isInitializing` is true (can feel slow due to AuthClient initialization). ChatPane has a slash command handler with ~20 commands including /announce, /shutdown, /help, /stats, etc.

## Requested Changes (Diff)

### Add
1. **Faster loading screen** — Reduce perceived load time by removing the gate on `actorFetching && !myProfileQuery.data && !isRegisteredQuery.data`. Show loading only during `isInitializing` (identity check). The actor/profile fetch should happen in the background after the auth screen shows, not block the loading spinner.
2. **5 new fun slash commands** (available to all users, not admin-only):
   - `/party` — Triggers a full-screen sparkle/confetti rain effect that plays for ~3 seconds. Bot confirms "🎉 Party time!".
   - `/foodparty` — Rains emoji food items (🍣 🍕 🍔 🌮 🍜 🍩 🍦 🥪 🍗 🥐) all over the screen for ~4 seconds.
   - `/uwu` — Makes NexusBot "force" all visible users to say "uwu" by posting a fake-forced message in chat via the bot. Bot posts a message like: "UwU mode activated~ Everyone is now saying uwu OwO".
   - `/fakeban` — Shows the current user a fake "You have been banned" full-screen overlay that lasts 5 seconds then disappears. Looks very real (red, scary), with a countdown. Bot confirms "✅ Fake ban prank executed".
   - `/explode` (the funny 5th one) — Screen shakes violently for 2 seconds, NexusBot says "💥 @username just nuked the server! Everything is fine. Probably." with a dramatic explosion emoji sequence.

### Modify
- `App.tsx`: Simplify loading gate to only block on `isInitializing`, not on actor/profile fetch states.
- `ChatPane.tsx`: Add the 5 new fun commands to `COMMAND_LIST` and `handleSlashCommand`. Add fun overlay state for party effects, food rain, fake ban, and screen shake.
- `/help` text: Add the 5 new commands to the help output.
- Admin Panel commands tab: Add all 5 new commands to the copy-paste list.

### Remove
Nothing.

## Implementation Plan
1. Fix loading screen in `App.tsx` — remove over-eager loading gate, keep only `isInitializing`.
2. Add overlay/animation components for:
   - Sparkle rain (CSS keyframe particles rendered as floating divs or canvas)
   - Food emoji rain (same pattern, different emojis)
   - Fake ban overlay (full-screen red alert, 5-second countdown)
   - Screen shake (CSS animation on root element or wrapper)
3. Add state in `ChatPane.tsx` for: `showParty`, `showFoodParty`, `showFakeBan`, `shakeScreen`.
4. Implement the 5 new command handlers inside `handleSlashCommand`.
5. Update `HELP_TEXT`, `COMMAND_LIST`, and `AdminPanel` commands list.
