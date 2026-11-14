# Mute Jar

> **A privacy-first meeting companion that detects when you speak while muted, drops MuteCoins into an animated jar, and turns awkward call slip-ups into charitable giving, personal habits, or team fun.**

---

## Table of Contents

1. [Purpose](#-purpose)
2. [Key Features](#-key-features)
3. [System Architecture](#-system-architecture)
4. [Single-File Desktop Installers by OS](#-single-file-desktop-installers-by-os)
5. [Optional Local MCP & Webhook Sidecar](#-optional-local-mcp--webhook-sidecar)
6. [Local Development, Testing & Packaging](#-local-development-testing--packaging)
7. [Configuration & Environment Variables](#-configuration--environment-variables)
8. [License](#-license)

---

## 🎯 Purpose

Everyone on remote or hybrid calls has uttered *"Sorry, I was on mute!"*

**Mute Jar** turns that everyday interruption into measurable, light-hearted accountability without surveilling your conversations. Using strictly local, on-device Web Audio analysis (zero audio recording and zero speech-to-text transcripts), Mute Jar tracks when you speak while muted, logs each incident into a local ledger, and helps you redeem accumulated MuteCoins at the end of every cycle according to your chosen philosophy:

- **The Saint** — Convert MuteCoins into charitable donations (GlobalGiving, GiveDirectly, Doctors Without Borders, or a custom URL) with receipt uploads.
- **The Habit Builder** — Turn slip-ups into constructive daily habits such as pushups, reading pages, or focus sprints.
- **The Forfeit Master** — Pay your dues to colleagues with coffee shouts, Friday pastries, or playful team dares.

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

### 4. Offline-First Desktop App & Optional Sidecar
- **Standalone Native Bundles**: Packaged via **Tauri v2** into compact single-file OS installers (~8–15 MB) using the operating system's built-in webview—no Chromium bloat, no Electron ~120 MB binaries, and no Node.js or Docker required for end users.
- **Graceful Offline Fallbacks**: Audio analysis, cycle tracking, ledger history, and persona-matched pledge suggestions work completely offline.
- **Optional Local Sidecar**: When you run `npm run sidecar`, desktop builds automatically connect to `http://localhost:3000` for Slack/Discord/Teams webhook relaying, Gemini AI pledge suggestions, and Local MCP (Claude Desktop / Cursor) integration.

---

## 🏗️ System Architecture

Mute Jar uses an **offline-first React SPA** embedded inside a lightweight **Tauri v2** native shell (for desktop packages) or served as a **PWA**, with an optional **Express sidecar (`server.ts`)** for external webhooks, Gemini suggestions, and Local MCP.

```
┌────────────────────────────────────────────────────────────────────────────┐
│            Tauri v2 Desktop App (.exe / .dmg / .AppImage) or PWA           │
│                                                                            │
│  ┌──────────────────────┐   ┌────────────────────┐   ┌──────────────────┐  │
│  │  Web Audio Engine    │   │  MuteJarContext    │   │  React UI Views  │  │
│  │  • Mic FFT Analysis  │──▶│  • Cycle Engine    │──▶│  • Hero Jar Hub  │  │
│  │  • Noise Calibration │   │  • Multi-Calendar  │   │  • Meeting Ledger│  │
│  │  • Voiceprint Match  │   │    Resolver (<=3)  │   │  • Pledges/Goals │  │
│  │  (100% RAM, 0 Audio) │   │  • localStorage    │   │  • Settings/Setup│  │
│  └──────────────────────┘   └─────────┬──────────┘   └──────────────────┘  │
└───────────────────────────────────────┼────────────────────────────────────┘
                                        │ Optional http://localhost:3000/api/*
┌───────────────────────────────────────▼────────────────────────────────────┐
│                    Optional Local Sidecar (`server.ts`)                    │
│                                                                            │
│  • GET  /api/health                      Health probe                      │
│  • POST /api/pledges/suggest             Gemini AI pledge suggestions      │
│  • POST /api/integrations/relay-webhook  Slack / Discord / Teams proxy     │
│  • GET|POST /api/mcp & /api/mcp/sync-state Local MCP server & state sync   │
└────────────────────────────────────────────────────────────────────────────┘
```

### Repository Layout

| Path | Responsibility |
| :--- | :--- |
| `src/App.tsx` | Main application shell, streamlined navigation, Focus View hero, and 2-tab workspace |
| `src/context/MuteJarContext.tsx` | Central state store (`localStorage`), multi-calendar priority resolver, unscheduled mute counter, cycle calculations, and integration dispatcher |
| `src/components/` | UI modules including `CartoonJar`, `AudioMonitor`, `LiveActionGoalHub`, `DashboardStats`, `ActionTracker`, `SettingsModal`, `SetupModal`, and `UserProfileModal` |
| `src/utils/` | `audioEngine.ts` (FFT & voiceprint), `localSidecar.ts` (Tauri URL routing & offline pledge fallback), `cycles.ts`, `localeCurrency.ts`, `security.ts`, and Vitest suites |
| `src-tauri/` | Tauri v2 configuration (`tauri.conf.json`), Rust crate (`Cargo.toml`, `src/lib.rs`, `src/main.rs`), macOS microphone `Info.plist` & `Entitlements.plist`, and capability permissions |
| `.github/workflows/release-desktop.yml` | Automated cross-platform CI matrix building Windows, macOS Universal, and Linux single-file releases |
| `server.ts` | Optional Express sidecar & dev server providing CORS-enabled `/api/mcp`, webhook relay, and Gemini suggestion endpoints |

---

## 💻 Single-File Desktop Installers by OS

Each operating system receives a dedicated **single-file download** (~8–15 MB) generated automatically via **Tauri v2** and `.github/workflows/release-desktop.yml` (on GitHub Releases), or installed in 1 click as a PWA on ChromeOS. End users do **not** need Node.js, Rust, or Docker installed.

| Operating System | Single-File Download | Approx. Size | Install Experience |
| :--- | :--- | :--- | :--- |
| **Windows 10 / 11** | `MuteJar_x64-setup.exe` (NSIS) or `.msi` | ~10 MB | Standard wizard; uses built-in Windows WebView2 |
| **macOS (Apple Silicon & Intel)** | `MuteJar_universal.dmg` | ~12 MB | Open `.dmg` & drag to Applications; built-in WKWebView |
| **Linux (Ubuntu, Fedora, Arch)** | `MuteJar_amd64.AppImage` or `.deb` | ~14 MB | Run AppImage directly (`chmod +x`) or `apt install` `.deb` |
| **ChromeOS (Chromebook)** | 1-Click PWA (Omnibox Install) | < 2 MB cache | Installs from browser bar to Shelf with offline cache |

### 🪟 Windows (Windows 10 / 11)
1. Download **`MuteJar_x64-setup.exe`** (for personal installs) or **`MuteJar_x64.msi`** (for enterprise rollout) from the Releases page.
2. Double-click the file to run the installer—Windows 10/11 includes Microsoft Edge WebView2 by default, so no extra runtimes are downloaded.
3. Launch **Mute Jar** from the Start Menu and pin it to your Taskbar.
4. *(Optional Autostart)*: Press `Win + R`, type `shell:startup`, and drop the Mute Jar Start Menu shortcut into the folder.

### 🍎 macOS (Ventura, Sonoma, Sequoia)
1. Download the Universal **`MuteJar_universal.dmg`** (runs natively on both Apple Silicon M1–M4 and Intel Macs).
2. Double-click the `.dmg` and drag **Mute Jar** into your **Applications** folder.
3. Launch Mute Jar and allow microphone access when prompted (pre-declared via `src-tauri/Info.plist` and hardened sandbox `Entitlements.plist`).
4. *(Optional Autostart)*: Open **System Settings → General → Login Items** and add **Mute Jar**.

### 🐧 Linux (Ubuntu, Debian, Fedora, Arch)
- **Portable AppImage (Any Distro, Zero Install)**:
  1. Download **`MuteJar_amd64.AppImage`**.
  2. Make it executable and launch:
     ```bash
     chmod +x MuteJar_*.AppImage
     ./MuteJar_*.AppImage
     ```
- **Debian / Ubuntu System Package**:
  ```bash
  sudo apt install ./MuteJar_*_amd64.deb
  ```
*(Note: Requires standard `libwebkit2gtk-4.1-0` on Linux desktops, pre-installed on most GNOME/Ubuntu systems.)*

### 🌐 ChromeOS (Chromebook)
1. Open Mute Jar in Chrome and click the **Install** icon in the address bar (or **Setup → Install App**).
2. Right-click the Mute Jar icon on your Shelf and choose **Pin**.
3. To auto-start on boot, open **ChromeOS Settings → Apps → Manage your apps → Mute Jar → Open on startup**.

---

## 🔌 Optional Local MCP & Webhook Sidecar

The packaged desktop app works **100% offline** with zero background daemons. If you also want to connect **Claude Desktop / Cursor** via Local MCP or relay alerts to **Slack / Discord / Microsoft Teams** webhooks from the desktop app:

```bash
# Runs the lightweight Express sidecar on http://localhost:3000
npm run sidecar
```

When running inside the Tauri desktop bundle, Mute Jar automatically routes `/api/mcp`, `/api/integrations/relay-webhook`, and `/api/pledges/suggest` calls to `http://localhost:3000` whenever the sidecar is active, and gracefully uses curated offline suggestions when it is stopped.

---

## 🚀 Local Development, Testing & Packaging

### Prerequisites
- **Node.js** `>= 18.0.0` and **npm** `>= 9.0.0` (for web dev & sidecar)
- **Rust (`rustup` / `cargo`)** + OS WebView dev headers (only if building Tauri desktop installers locally; see `.github/workflows/release-desktop.yml` for exact CI system packages)

### Web & Sidecar Commands

```bash
# 1. Install dependencies
npm install

# 2. Start full-stack dev server (Express + Vite on port 3000)
npm run dev

# 3. Run unit tests (Vitest)
npm test

# 4. Type-check TypeScript
npm run lint

# 5. Run tests & build production web bundle into dist/
npm run build

# 6. Start standalone local MCP & webhook sidecar
npm run sidecar
```

### Building Single-File Desktop Packages Locally

```bash
# 1. Generate native .icns, .ico, and PNG bundle icons from public/pwa-512x512.png
npm run desktop:icons

# 2. Launch live Tauri desktop window during development
npm run desktop:dev

# 3. Build single-file installers into src-tauri/target/release/bundle/
npm run desktop:build
```

Pushing a version tag (e.g., `git tag v0.1.0 && git push origin v0.1.0`) triggers `.github/workflows/release-desktop.yml` to compile and upload Windows (`.exe`/`.msi`), macOS Universal (`.dmg`), and Linux (`.AppImage`/`.deb`) artifacts to a draft GitHub Release automatically.

---

## ⚙️ Configuration & Environment Variables

Copy `.env.example` to `.env` if running the optional sidecar with AI-powered pledge suggestions:

| Variable | Required | Description |
| :--- | :--- | :--- |
| `PORT` | No | Local sidecar / server port (defaults to `3000`) |
| `GEMINI_API_KEY` | No | Optional Google Gemini API key for AI-generated pledge ideas (`/api/pledges/suggest`); curated offline suggestions work without a key |

All user preferences, custom avatars, calendar connections, mute logs, and pledges stay locally on-device and can be wiped anytime via **Settings → Wipe All Data**.

---

## 📄 License

Licensed under the **Apache-2.0 License**.
