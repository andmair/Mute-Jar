# Mute Jar

> **A privacy-first meeting companion that detects when you speak while muted, drops MuteCoins into an animated jar, and turns awkward call slip-ups into charitable giving, personal habits, or team fun.**

---

## Table of Contents

1. [Purpose](#-purpose)
2. [Key Features](#-key-features)
3. [System Architecture](#-system-architecture)
4. [Installation Instructions by Operating System](#-installation-instructions-by-operating-system)
5. [Local Development & Testing](#-local-development--testing)
6. [Configuration & Environment Variables](#-configuration--environment-variables)
7. [License](#-license)

---

## 🎯 Purpose

Everyone on remote or hybrid calls has uttered *"Sorry, I was on mute!"*

**Mute Jar** turns that everyday interruption into measurable, light-hearted accountability without surveilling your conversations. Using strictly local, in-browser Web Audio analysis (zero audio recording and zero speech-to-text transcripts), Mute Jar tracks when you speak while muted, logs each incident into a tamper-resistant ledger, and helps you redeem accumulated MuteCoins at the end of every cycle according to your chosen philosophy:

- **The Saint** — Convert MuteCoins into verified charitable donations (GlobalGiving, GiveDirectly, Doctors Without Borders, or a custom URL) with receipt uploads.
- **The Habit Builder** *(formerly The Pragmatist)* — Turn slip-ups into constructive daily habits such as pushups, reading pages, or focus sprints.
- **The Forfeit Master** *(formerly The Roast Master)* — Pay your dues to colleagues with coffee shouts, Friday pastries, or playful team dares.

---

## ✨ Key Features

### 1. Real-Time On-Device Audio Detection
- **100% In-Memory Web Audio Engine**: Uses `AudioContext` and FFT spectrum analysis in temporary RAM—no audio clips, waveforms, or transcripts are ever recorded or transmitted.
- **Background Noise & Speaker Filtering**: Includes 2-second ambient noise-floor calibration, proximity mic profiles (near-field desk, headset boom, room mic), and optional voiceprint pitch ($F_0$) + formant matching to ignore background TV/radio or nearby coworkers.
- **OS Focus / Do Not Disturb Awareness**: Automatically pauses audio monitoring when Focus / Do Not Disturb mode is active.
- **5-Second Undo Grace Period**: Accidental manual or auto-detected drops can be undone within 5 seconds before locking into the ledger.

### 2. Focus View Dashboard & Live Action Hub
- **Streamlined Navigation**: Single-row header (`Mute Jar`, `Ledger`, `Pledges & Goals`) paired with a compact 2-tab workspace (`Meeting Ledger` and `Pledges & Goals`).
- **3D Animated Mute Jar & Quick Controls**: Live coin counter, cycle value conversion in your local currency, instant **Drop Coin (+1)** button, and milestone progress tracker side by side.
- **Custom Profile Photo & Built-in Avatars**: Upload your own profile photo (auto-cropped and resized client-side for lightweight local storage) or pick from 12 built-in character avatars.

### 3. Settings-Only Multi-Calendar Auto-Tagging
- **Zero Dashboard Clutter**: Calendar connections live strictly inside **Settings** with no extra schedule cards or tabs on the main screen.
- **Up to 3 Calendars with Primary Priority**: Connect up to 3 calendars (Work, Personal, Side Project) and designate one as **Primary** so overlapping double-bookings always resolve cleanly.
- **Hybrid Connection Options**:
  - **1-Click OAuth** for standard Google Calendar and Microsoft 365 accounts.
  - **Private Webcal / `.ICS` Subscription Feeds** for Apple iCloud or corporate environments where IT blocks third-party OAuth apps.
- **Decoupled Logs & Sequential Unscheduled Fallback**: When a mute occurs, Mute Jar copies the matching meeting title into the ledger entry (with no backlink to your calendar). If no calendar event matches, it automatically labels `"Unscheduled meeting - mute #"` sequentially per 45-minute call window.
- **Inline Ledger Editing**: Click the edit icon on any ledger row to rename a meeting title or add notes as a fallback.

### 4. Cycle Reviews, Integrations & Local MCP
- **Flexible Cycles**: Weekly (ISO week), Fortnightly (14 days), or Monthly cycles with automated cycle-end review & redemption modals.
- **Team Chat Webhooks**: Relay Mute Jar milestones and roast summaries to Slack, Discord, or Microsoft Teams through the server webhook proxy (`/api/integrations/relay-webhook`).
- **AI Pledge Suggestions & Local MCP Server**: Optional Gemini-powered pledge ideas (`/api/pledges/suggest`) and a built-in Model Context Protocol endpoint (`/api/mcp`) for connecting local AI clients such as Claude Desktop or Cursor.

---

## 🏗️ System Architecture

Mute Jar uses a **local-first React SPA** backed by a lightweight **Express + Vite** Node.js server for webhook relaying, optional Gemini pledge generation, and local MCP state syncing.

```
┌───────────────────────────────────────────────────────────────────────────┐
│                         Browser / Installed PWA                           │
│                                                                           │
│  ┌──────────────────────┐   ┌───────────────────┐   ┌──────────────────┐  │
│  │  Web Audio Engine    │   │  MuteJarContext   │   │  React UI Views  │  │
│  │  • Mic FFT Analysis  │──▶│  • Cycle Engine   │──▶│  • Hero Jar Hub  │  │
│  │  • Noise Calibration │   │  • Multi-Calendar │   │  • Meeting Ledger│  │
│  │  • Voiceprint Match  │   │    Resolver (≤3)  │   │  • Pledges/Goals │  │
│  │  (100% RAM, 0 Audio) │   │  • localStorage   │   │  • Settings/Setup│  │
│  └──────────────────────┘   └─────────┬─────────┘   └──────────────────┘  │
└───────────────────────────────────────┼───────────────────────────────────┘
                                        │ HTTP /api/* (Optional Integrations)
┌───────────────────────────────────────▼───────────────────────────────────┐
│                        Express Server (`server.ts`)                       │
│                                                                           │
│  • GET  /api/health                    Health probe                       │
│  • POST /api/pledges/suggest           Gemini AI pledge suggestions       │
│  • POST /api/integrations/relay-webhook Slack / Discord / Teams proxy     │
│  • GET|POST /api/mcp & /api/mcp/sync-state Local MCP server & state sync  │
└───────────────────────────────────────────────────────────────────────────┘
```

### Repository Layout

| Path | Responsibility |
| :--- | :--- |
| `src/App.tsx` | Main application shell, streamlined navigation, Focus View hero, and 2-tab workspace |
| `src/context/MuteJarContext.tsx` | Central state store (`localStorage`), multi-calendar priority resolver, unscheduled mute counter, cycle calculations, and integration dispatcher |
| `src/components/` | UI modules including `CartoonJar`, `AudioMonitor`, `LiveActionGoalHub`, `DashboardStats` (inline-editable ledger), `ActionTracker`, `SettingsModal`, `SetupModal`, and `UserProfileModal` (custom photo upload) |
| `src/utils/` | `audioEngine.ts` (FFT & voiceprint), `cycles.ts`, `localeCurrency.ts`, `buildCacheManager.ts`, `security.ts`, and Vitest suites |
| `src/types/index.ts` | TypeScript interfaces for mute records, calendar sources, pledges, audio settings, and integrations |
| `server.ts` | Express backend serving Vite in development, static `dist/` in production, MCP endpoints, webhook relay, and Gemini suggestion route |

---

## 💻 Installation Instructions by Operating System

Mute Jar can be installed as a standalone desktop app via Progressive Web App (PWA) support or built from source for any major desktop OS.

### 🪟 Windows (Windows 10 / 11)

1. **Install as a Standalone App (Recommended)**:
   - Open Mute Jar in **Microsoft Edge** or **Google Chrome**.
   - Click the **Install** icon in the address bar (or the **Install App** button in the top header) and confirm.
2. **Run in Background & Pin**:
   - Right-click the Mute Jar icon on the Windows Taskbar and choose **Pin to taskbar**.
   - Minimize the window during calls; microphone monitoring continues in the background (when started).
3. **Auto-Launch at Sign-In (Optional)**:
   - In Edge/Chrome's installed app title bar menu (`···`), open **App settings** and enable **Start app when you sign in**, **or** press `Win + R`, run `shell:startup`, and drop the Mute Jar shortcut inside.
4. **Native `.exe` Wrapper (Optional)**:
   ```bash
   npx nativefier --name "MuteJar" --icon public/icon.svg --single-instance "http://localhost:3000"
   ```

---

### 🍎 macOS (Ventura, Sonoma, Sequoia)

1. **Install as a macOS App (Recommended)**:
   - **Safari**: Open Mute Jar and click **File → Add to Dock**.
   - **Google Chrome / Brave / Arc**: Click the **Install** icon in the address bar (or **Menu → Save and Share → Install Mute Jar**). The app bundle is placed in `~/Applications/Chrome Apps`.
2. **Keep in Dock & Hide Without Quitting**:
   - Right-click the Dock icon → **Options → Keep in Dock**.
   - Press `⌘ + H` during meetings to hide the window while audio monitoring stays active.
3. **Grant Microphone Access**:
   - On first monitor start, approve microphone permission in macOS **System Settings → Privacy & Security → Microphone**.
4. **Auto-Launch at Login (Optional)**:
   - Right-click the Dock icon → **Options → Open at Login**, or add Mute Jar under **System Settings → General → Login Items**.
5. **Native `.app` / `.dmg` Wrapper (Optional)**:
   ```bash
   npx nativefier --name "MuteJar" --icon public/icon.svg --platform mac "http://localhost:3000"
   ```

---

### 🐧 Linux (Ubuntu, Debian, Fedora, Arch)

1. **Install Desktop Entry (Recommended)**:
   - Open Mute Jar in **Google Chrome**, **Chromium**, or **Brave**.
   - Click **Install Mute Jar** in the address bar. This creates a `.desktop` entry in `~/.local/share/applications/`.
2. **Auto-Start on Session Login (Optional)**:
   ```bash
   mkdir -p ~/.config/autostart
   cp ~/.local/share/applications/chrome-*mutejar*.desktop ~/.config/autostart/mutejar.desktop
   ```
3. **Native AppImage / Binary (Optional)**:
   ```bash
   npx nativefier --name "MuteJar" --icon public/icon.svg --platform linux "http://localhost:3000"
   ```

---

### 🌐 ChromeOS (Chromebook)

1. **Install to App Launcher**:
   - Open Mute Jar in Chrome and click the **Install** icon in the omnibox.
2. **Pin to Shelf & Autostart**:
   - Two-finger tap (right-click) the Mute Jar icon on your shelf and choose **Pin**.
   - To launch automatically on boot, open **ChromeOS Settings → Apps → Manage your apps → Mute Jar** and enable **Open on startup**.

---

### 🐳 Docker (Any OS / Self-Hosted)

```bash
# Build the image
docker build -t mutejar .

# Run on port 3000
docker run -d -p 3000:3000 --name mutejar-app mutejar
```

---

## 🚀 Local Development & Testing

### Prerequisites
- **Node.js** `>= 18.0.0`
- **npm** `>= 9.0.0`

### Commands

```bash
# 1. Install dependencies
npm install

# 2. Start full-stack dev server (Express + Vite on port 3000)
npm run dev

# 3. Run unit tests (Vitest)
npm test

# 4. Type-check TypeScript
npm run lint

# 5. Run tests & build production bundle into dist/
npm run build

# 6. Start production server
npm start
```

Open `http://localhost:3000` in your browser once `npm run dev` is running.

---

## ⚙️ Configuration & Environment Variables

Copy `.env.example` to `.env` if deploying with optional AI pledge suggestions:

| Variable | Required | Description |
| :--- | :--- | :--- |
| `PORT` | No | Server port (defaults to `3000`) |
| `GEMINI_API_KEY` | No | Optional Google Gemini API key for AI-generated pledge ideas (`/api/pledges/suggest`); local curated fallbacks work without a key |

All user preferences, custom avatars, calendar connections, mute logs, and pledges are stored locally in browser `localStorage` and can be wiped anytime via **Settings → Wipe All Data**.

---

## 📄 License

Licensed under the **Apache-2.0 License**.
