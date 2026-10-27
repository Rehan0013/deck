# Build Prompt: Deck — Mac Tablet Remote (Next.js 16 + Server Actions)

Paste this into Antigravity as your project brief.

---

## Project Overview

Build **Deck**, a local-network web app that turns an Android tablet into a shortcut launcher for a MacBook. The app runs entirely on the Mac (as a Next.js server). The tablet connects to it over WiFi via the Mac's local IP and browser — no app install on the tablet. Tapping a shortcut tile on the tablet triggers a Server Action that runs on the Mac and opens a native app or a URL using macOS's `open` CLI command.

This is a personal LAN utility, not a public-facing product — but it should still look and feel like a real, polished product, not a prototype.

## Tech Stack

- **Next.js 16** (App Router, Server Actions — no separate Express backend)
- **TypeScript** throughout
- **Server Actions** for all mutations: opening an app/URL, adding/editing/deleting shortcuts
- Shortcuts persisted in a local JSON file (`data/shortcuts.json`) read/written via Node's `fs` inside server actions — no database needed for v1
- Use Node's `child_process.exec` inside a server action to run macOS `open -a "AppName"` or `open "https://..."`
- Tailwind CSS for styling
- Use **Stitch MCP** to generate the initial UI screens/components, then wire them to real server actions and state — don't leave any Stitch output as static/non-functional

## Design Direction (important — read carefully)

- **No purple gradients anywhere.** This is a hard constraint — no violet/purple hues, no purple-to-anything gradients, no glassmorphism.
- Palette: near-black background (`#0b0d10`–`#14171c` range), electric blue accent (`#3d8bff`-ish), amber/warm accent (`#ffb347`-ish) used sparingly for secondary states (e.g. URL-type tiles vs app-type tiles). Sharp, modern, high-contrast — not soft or pastel.
- Typography: a distinctive display/mono pairing — e.g. Space Grotesk for headings/labels, JetBrains Mono for small metadata/status text (timestamps, tags, connection status). Avoid generic system-font-only UI.
- Visual metaphor: shortcut tiles should feel tactile, like mechanical keyboard keycaps — subtle bevel, a pressed/active state that mimics a keypress (slight translateY + shadow collapse on tap), not flat generic buttons.
- No rounded-pill buttons everywhere, no soft drop-shadows-on-everything, no default shadcn look-and-feel out of the box — customize it.
- Include a small persistent connection-status indicator (dot + label) showing whether the tablet's last request to the Mac succeeded, styled like a status LED.
- Fully responsive down to a tablet viewport (assume landscape ~1280×800 and portrait ~800×1280); large enough tap targets for touch (min 64px).
- Respect `prefers-reduced-motion`.

## Core Screens / Features

### 1. `/` — Shortcut Grid (main screen, tablet-facing)
- Grid of shortcut tiles pulled from `data/shortcuts.json`, each showing an icon (emoji or small SVG), a label, and a subtle tag indicating `app` vs `url` type.
- Tapping a tile calls a server action `openShortcut(id)` that looks up the shortcut and runs the appropriate `open` command on the Mac.
- Show a toast/snackbar confirming success (`Opened Chrome`) or failure (`Couldn't open Chrome`).
- Auto-revalidate/poll shortcuts every ~15s in case they were edited from the settings screen on another device.
- Empty state if no shortcuts exist yet, with a clear call-to-action pointing to the settings screen.

### 2. `/settings` — Manage Shortcuts
- List of existing shortcuts with edit/delete actions.
- A form to add a new shortcut: name, icon (emoji picker or plain text input), type (`app` | `url`), and target (app name or URL, with different placeholder/help text depending on type selected).
- All mutations (`addShortcut`, `updateShortcut`, `deleteShortcut`) go through Server Actions and revalidate the shortcuts list.
- Basic validation: name and target required; for `type: "url"`, validate it looks like a URL.

### 3. Root layout
- Persistent header with the "Deck" wordmark, a small "Mac Remote" eyebrow label, and the connection-status indicator.
- Simple nav between the shortcut grid and settings (icon button is fine — keep it unobtrusive on the main tablet-facing screen).

## Server Actions — Behavior Spec

- `openShortcut(id: string)`
  - Reads `data/shortcuts.json`, finds the shortcut by id.
  - If `type === "app"`: run `open -a "<target>"` (escape quotes safely).
  - If `type === "url"`: run `open "<target>"` (escape quotes safely).
  - Returns `{ success: boolean, message: string }`.
- `getShortcuts()` — reads and returns the JSON file contents (or use a Server Component fetch directly).
- `addShortcut(data)`, `updateShortcut(id, data)`, `deleteShortcut(id)` — mutate the JSON file, then `revalidatePath("/")`.
- Wrap all `fs`/`exec` calls in try/catch; never let a failed `open` command crash the request — return a clean error to the UI instead.
- No shell injection: sanitize/escape the `target` value before interpolating into the `exec` command, or better, use `execFile`/`spawn` with argument arrays instead of a shell string where possible.

## Non-Goals for v1

- No auth/PIN system yet (can be added later — note this as a TODO in the code, don't build it now).
- No database — flat JSON file is fine.
- No app-icon lookup from `/Applications` — icons stay manual (emoji) for now.
- No push notifications or WebSocket live-sync between multiple tablets — polling is fine.

## Deliverable

A working Next.js 16 project (App Router, Server Actions, TypeScript, Tailwind) that:
1. Runs locally on the Mac with `npm run dev` (or `next start` after build), reachable from the tablet at `http://<mac-lan-ip>:3000`.
2. Has the shortcut grid and settings screen described above, fully wired to real server actions and the JSON data file — not mocked.
3. Matches the design direction above, generated/refined via Stitch MCP for the visual layer, then integrated into real components with real state and data.

Ask me if anything about the data shape, port number, or folder structure should be different before you start scaffolding.
