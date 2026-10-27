# 🎛️ Deck — Mac Tablet Remote

> Turn any Android tablet, iPad, or mobile device on your local Wi-Fi into a tactile, mechanical-keyboard-inspired macro remote control for your Mac.

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![macOS](https://img.shields.io/badge/Platform-macOS-grey?style=flat-square&logo=apple)](https://www.apple.com/macos/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](#license)

---

## ⚡ Overview

**Deck** is a zero-install LAN utility designed for macOS power users. The Next.js server runs locally on your Mac, binding to your local network. Your tablet connects via its standard web browser over Wi-Fi. 

Tapping any tile on the tablet executes a **Next.js Server Action** directly on your Mac, launching native applications or opening URLs with intelligent browser tab-focusing.

```
┌─────────────────────────────────┐               ┌───────────────────────────────────┐
│     Tablet / iPad (Client)      │               │         Host Mac (Server)         │
│                                 │   Local WiFi  │                                   │
│  ┌───┐  ┌───┐  ┌───┐  ┌───┐     │  HTTP / JSON  │  ┌─────────────────────────────┐  │
│  │ 🌐│  │ 💻│  │ 🎵│  │ 🚀│      │ ────────────> │  │ Next.js App Router (0.0.0.0)│  │
│  └───┘  └───┘  └───┘  └───┘     │ Server Action │  └──────────────┬──────────────┘  │
│    Tactile Keycap Interface     │               │                 │                 │
│   (Chrome / Safari / Kiosk)     │ <──────────── │                 ▼                 │
│                                 │  Live Status  │  ┌─────────────────────────────┐  │
│   ● Link: OK (Heartbeat LED)    │   & Execution │  │ child_process.spawn('open') │  │
└─────────────────────────────────┘     Response  │  │ & AppleScript Tab Focusing  │  │
                                                  │  └──────────────┬──────────────┘  │
                                                  │                 │                 │
                                                  │  ┌──────────────▼──────────────┐  │
                                                  │  │ VS Code, Spotify, Browser   │  │
                                                  │  └─────────────────────────────┘  │
                                                  └───────────────────────────────────┘
```

---

## ✨ Features

- **No Client App Installation Required**: Works inside any modern mobile browser (Chrome, Safari, Firefox).
- **Physical Keycap Tactile Aesthetics**: Styled like mechanical keyboard keycaps with realistic 3D bevels, active depression (`translateY`), and click feedback.
- **Intelligent URL Tab Focusing**: When launching URLs, Deck uses AppleScript to check if Google Chrome or Safari already has a matching tab open and focuses it rather than spawning duplicate tabs.
- **Shell-Injection Proof**: Uses Node's `child_process.spawn` with direct argument arrays without invoking an intermediate shell.
- **Live Connection Heartbeat**: Continuous visual LED status indicator monitoring server connectivity in real time.
- **Full Shortcut Customization**: Add, edit, reorder, or delete app and web shortcuts directly from the `/settings` screen.
- **JSON Backup & Sync**: Quick one-click export/import functionality to back up your layout or clone configurations across multiple devices.
- **Dark Industrial Palette**: Near-black technical blueprint background, electric blue accents for applications, and warm amber accents for URLs.
- **Kiosk & Fullscreen Ready**: Add to your tablet home screen for a borderless, full-screen hardware remote experience.

---

## 🛠️ System Requirements

- **Host Machine**: macOS (required for macOS `open` and AppleScript automation)
- **Node.js**: v18.18+ or v20+
- **Tablet / Client**: Any tablet, smartphone, or secondary computer connected to the **same local Wi-Fi network**

---

## 🚀 Quick Start Guide

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/Rehan0013/deck.git
cd deck
npm install
```

### 2. Start the Development Server

The development script is pre-configured to bind to `0.0.0.0` so other devices on your Wi-Fi can connect:

```bash
npm run dev
```

The terminal will confirm the server is running:

```text
▲ Next.js 16.2.12
- Local:        http://localhost:3000
- Network:      http://192.168.1.XX:3000
```

### 3. Find Your Mac's Local IP Address

If you need to verify your Mac's Wi-Fi IP address:

```bash
ipconfig getifaddr en0
```
*(If you are connected via Ethernet or secondary interface, replace `en0` with `en1`).*

Alternatively, find it via macOS **System Settings** → **Wi-Fi** → **Details...** → **IP address**.

### 4. Connect Your Tablet

1. Ensure your tablet is connected to the **same Wi-Fi network** as your Mac.
2. Open Chrome, Safari, or Firefox on your tablet.
3. Navigate to:
   ```text
   http://<YOUR_MAC_IP>:3000
   ```
   *(Example: `http://192.168.1.45:3000`)*
4. Verify the top right status badge displays **`● Link: OK`**.
5. Tap any shortcut tile to test launching an app or URL on your Mac!

---

## 📱 Pro-Tip: Fullscreen Kiosk Mode

To make Deck look and feel like dedicated hardware:

### On Android (Chrome)
1. Navigate to `http://<YOUR_MAC_IP>:3000`.
2. Tap the browser menu (`⋮`) in the top-right corner.
3. Select **Add to Home screen** (or **Install App**).
4. Launch Deck from your home screen — it will open in full-screen standalone mode without URL bars.

### On iPad (Safari)
1. Navigate to `http://<YOUR_MAC_IP>:3000`.
2. Tap the **Share** button (`⎙`).
3. Scroll down and tap **Add to Home Screen**.
4. Open the newly added icon for a clean, borderless display.

---

## 🧩 Usage & Shortcut Types

Navigate to `/settings` or click **`[ Settings ]`** in the header to manage your shortcuts.

### 1. Application Shortcuts (`type: "app"`)
Launches native macOS applications using `open -a "<Target>"`.

| Field | Example Value | Description |
| :--- | :--- | :--- |
| **Name** | `VS Code` | Tile display label |
| **Icon** | `💻` | Any emoji or symbol |
| **Type** | `Application` | Marks the tile with a blue accent |
| **Target** | `Visual Studio Code` | Exact app name in `/Applications` or Spotlight |

> **Common App Targets**:
> - `Visual Studio Code`
> - `Google Chrome`
> - `Spotify`
> - `Terminal` or `iTerm`
> - `Slack`
> - `Figma`
> - `Notion`
> - `Discord`

### 2. URL Shortcuts (`type: "url"`)
Opens web pages using intelligent tab-focusing.

| Field | Example Value | Description |
| :--- | :--- | :--- |
| **Name** | `YouTube` | Tile display label |
| **Icon** | `📺` | Any emoji or symbol |
| **Type** | `Web URL` | Marks the tile with an amber accent |
| **Target** | `https://www.youtube.com` | Full or partial URL (`github.com`) |

Deck will automatically prefix URLs missing protocols with `https://`.

---

## 🔒 Security & Safety

- **No Arbitrary Shell Execution**: Commands are never passed into a shell interpreter string (`bash -c` or `sh`). Deck uses Node's `child_process.spawn` where arguments are strictly isolated into parameter arrays, preventing shell injection vulnerabilities.
- **Local Network Scope**: Deck is intended to run strictly on your trusted home or office local area network (LAN).
- **macOS Permissions**: The first time you launch an AppleScript-controlled URL shortcut, macOS may show a prompt: *"Terminal / Node would like to control Google Chrome / Safari"*. Click **Allow** to enable tab-focusing.

---

## 🚢 Running in the Background (Production)

To run Deck permanently without keeping an open terminal window:

### Option A: Build and Run with Next.js

```bash
# Build the optimized production bundle
npm run build

# Start the production server on 0.0.0.0
npm run start -- --hostname 0.0.0.0
```

### Option B: Keep Alive with PM2

Install [PM2](https://pm2.keymetrics.io/) to automatically run Deck in the background and restart on reboot:

```bash
npm install -g pm2
pm2 start "npm run dev" --name "deck-remote"
pm2 save
pm2 startup
```

---

## 📁 Project Structure

```text
deck/
├── src/
│   ├── app/
│   │   ├── actions.ts           # Server Actions: executeOpen, openUrl, executeShortcut
│   │   ├── api/
│   │   │   └── health/route.ts  # Healthcheck endpoint for heartbeat LED
│   │   ├── components/
│   │   │   └── Header.tsx       # Brand header, navigation & link status monitor
│   │   ├── globals.css          # Keycap tactile animations, blueprint grid & styling
│   │   ├── layout.tsx           # Fonts (Space Grotesk & JetBrains Mono) & Root Layout
│   │   ├── page.tsx             # Shortcut Dashboard grid & tile launch handling
│   │   └── settings/
│   │       └── page.tsx         # Shortcut CRUD & JSON export/import sync
│   └── lib/
│       └── storage.ts           # LocalStorage helpers & default shortcut definitions
├── package.json
└── README.md
```

---

## ❓ Troubleshooting

<details>
<summary><strong>Tablet shows "Link: ERR" or cannot load the page</strong></summary>

1. Confirm your tablet and Mac are on the **exact same Wi-Fi network** (check if one is on a Guest network or 5GHz vs 2.4GHz with AP isolation).
2. Ensure you started the dev server with `--hostname 0.0.0.0` (included in `npm run dev`).
3. Check your Mac Firewall: Go to **System Settings** → **Network** → **Firewall** and ensure incoming connections for Node / Next.js are allowed.
</details>

<details>
<summary><strong>"Failed: Exit code 1" when tapping an app tile</strong></summary>

Ensure the application name in the shortcut's **Target** matches the app name in macOS `/Applications`. For example, use `Visual Studio Code` instead of `code`.
</details>

<details>
<summary><strong>Port 3000 is already in use</strong></summary>

You can specify an alternate port when running:
```bash
npx next dev -p 3001 --hostname 0.0.0.0
```
Then access `http://<YOUR_MAC_IP>:3001` on your tablet.
</details>

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
