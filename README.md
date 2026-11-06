# 🎙️ Mute Jar

> **A privacy-first meeting companion that automatically detects when you speak while muted, drops cartoon MuteCoins into your jar, and turns awkward slip-ups into charitable giving, personal habits, or team fun.**

---

## 🌟 Overview

We’ve all said it: *"Sorry, I was on mute!"*

**Mute Jar** turns this everyday remote-work blunder into something positive, humorous, and accountable. Powered by real-time client-side audio analysis, Mute Jar listens to your microphone activity during virtual meetings and automatically drops a virtual cartoon coin whenever you speak while muted. 

At the end of each configurable cycle (weekly, fortnightly, or monthly), you review your accumulated MuteCoins and redeem them according to your chosen philosophy:
- **😇 The Saint** — Cash in your coins for verified charitable donations (e.g., GlobalGiving, GiveDirectly, Doctors Without Borders), complete with receipt uploads and verified goal tracking.
- **⚡ The Habit Builder** (The Pragmatist) — Redeem coins for physical fitness reps (pushups, squats), focus sprints, or book reading goals.
- **👑 The Forfeit Master** (The Roast Master) — Pay your dues to colleagues with Friday morning donuts & barista coffee shouts, team social treats, or funny dares.

---

## 🔒 Privacy & Architecture

Mute Jar was architected with a **strict privacy-first guarantee**:
- **Zero Cloud Audio**: Audio processing is executed 100% locally on your machine using the browser's Web Audio API and Fast Fourier Transform (FFT) spectrum analysis.
- **No Speech Recognition or Transcripts**: The engine monitors volume, frequency variance, and speech energy thresholds only—it **never** transcribes, parses, records, or stores human words.
- **Ambient Noise Filtering**: Features an adaptive background noise filter that differentiates near-field speaker speech from ambient background noise, radio, podcasts, or colleagues speaking across the room.
- **Immutable Local Ledger**: Event logs, scheduled meetings, and pledged goals are stored strictly in your browser’s local storage (`localStorage`). To prevent tampering, individual mutes cannot be erased; only a complete profile wipe can reset historical data.

---

## 💻 Installation & Background Setup by Operating System

Mute Jar is designed to run silently in the background of your operating system without requiring an open browser window, and can start automatically on computer reboot.

### 🪟 Windows (Windows 10 / 11)

#### 1. Install as a Desktop Application
1. Open Mute Jar in **Google Chrome** or **Microsoft Edge**.
2. Click the **Install** icon in the address bar (or click **Install Desktop Application** in the app header).
3. Confirm the installation. Mute Jar will now run in its own dedicated, borderless desktop window.

#### 2. Run in the Background & Pin to Taskbar
1. When Mute Jar opens, right-click its icon on the Windows Taskbar and select **"Pin to taskbar"**.
2. You can minimize the app window during meetings—the Web Audio background worker continues active detection without interruption.

#### 3. Autostart Silently on Windows Boot
- **Method A (App Settings):** In the installed Mute Jar window, click the `···` menu in the title bar > **App settings** > toggle ON **"Start app when you sign in"**.
- **Method B (Windows Startup Folder):**
  1. Press `Win + R`, type `shell:startup`, and press `Enter`.
  2. Drag and drop the Mute Jar desktop shortcut into this Startup folder.

---

### 🍏 macOS (Sonoma, Sequoia, Ventura)

#### 1. Install as a macOS Application
1. Open Mute Jar in **Google Chrome** or **Safari**.
2. In Chrome: Click the **Install** button in the omnibox (or navigate to **Menu > Save and Share > Install Mute Jar**).
3. In Safari: Go to **File > Add to Dock**.
4. Mute Jar will install as a native macOS application bundle in `~/Applications/Chrome Apps` or `/Applications`.

#### 2. Keep in Dock & Silent Background Operation
1. Right-click the Mute Jar icon in your Dock > **Options > Keep in Dock**.
2. You can hide the application at any time using `⌘ + H`. The audio monitor remains active in the background throughout your Google Meet, Zoom, Slack Huddle, or Microsoft Teams calls.

#### 3. Autostart on Mac Login
1. Right-click the Mute Jar icon in the macOS Dock.
2. Select **Options > Open at Login**.
3. Alternatively, open **System Settings > General > Login Items** and add Mute Jar to the list of applications that launch on startup.

---

### 🌐 ChromeOS / Chromebook

#### 1. Install to Shelf
1. Open Mute Jar in the Chrome browser.
2. Click the **Install Mute Jar** icon in the address bar.
3. The app will open in standalone window mode and appear in your ChromeOS launcher.

#### 2. Pin to Shelf Status Bar
1. Right-click (or two-finger tap) the Mute Jar icon on your shelf.
2. Select **Pin** to keep the icon permanently on your status shelf.

#### 3. Autostart on Chromebook Boot
1. In ChromeOS, open **Settings > Apps > Manage your apps > Mute Jar**.
2. Enable **"Open on startup"**.

---

### 🐧 Linux (Ubuntu, Debian, Fedora, Arch)

#### 1. Desktop Integration
1. In Chrome, Chromium, or Brave, click **Install Mute Jar** from the URL bar.
2. A `.desktop` launcher will be created automatically in `~/.local/share/applications/`.

#### 2. Autostart on Desktop Session Login
1. Copy the desktop entry to your autostart directory:
   ```bash
   mkdir -p ~/.config/autostart
   cp ~/.local/share/applications/chrome-*mutejar*.desktop ~/.config/autostart/mutejar.desktop
   ```

---

## 🚀 Quickstart for Local Development

### Prerequisites
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/mute-jar.git
cd mute-jar
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Test Suite
```bash
npm test
```
Runs the full Vitest unit test suite (verifying cycle bounds, ISO week calculations, and philosophy label helpers).

### 5. Type-Check and Build
```bash
npm run lint    # runs tsc --noEmit
npm run build   # runs unit tests and compiles production bundle to /dist
```

---

## 🧹 Automated Cache Clearance on Every Build

Mute Jar implements an automated cache lifecycle manager (`src/utils/buildCacheManager.ts`):
- **Compile-Time Build Hash**: On every `npm run build` or Vite compile, a fresh `__APP_BUILD_ID__` timestamp hash is injected into the bundle.
- **Automatic Purge on Launch**: When a newly built app loads in the user's browser, it detects that the stored build ID differs from the bundle's build ID. It automatically purges all:
  - `localStorage` items (`mutejar_settings_v1`, `mutejar_mutes_v1`, `mutejar_pledges_v1`, etc.)
  - `sessionStorage` session values
  - `CacheStorage` service worker caches
- **Clean Slate Guarantee**: This ensures that every new build starts with clean defaults, avoiding migration bugs, outdated schemas, or phantom cached recordings.
- **Manual Flush**: You can also manually purge all local data anytime via the **Settings Modal > Build Version & Local Cache Lifecycle > "Clear Cache Now"** button.

---

## 📦 Packaging & Installation Guide

Choose the packaging approach that fits your workflow:

### Option 1: 1-Click Progressive Web App (PWA) — *Recommended*
No compilers or developer tools needed:
1. Open the app in **Google Chrome**, **Microsoft Edge**, **Brave**, or **Safari**.
2. Click the **"Install App"** button in the top navigation bar (or the install icon in the browser address bar).
3. The app installs immediately as a standalone, borderless desktop window with taskbar/dock integration, offline capability, and OS autostart options.

### Option 2: 1-Command Native Desktop Executable (`.exe`, `.dmg`, `.app`)
To generate a standalone executable file without configuring Electron from scratch:
```bash
# Windows (.exe):
npx nativefier --name "MuteJar" --icon public/icon.svg --single-instance "http://localhost:3000"

# macOS (.app / .dmg):
npx nativefier --name "MuteJar" --icon public/icon.svg --platform mac "http://localhost:3000"

# Linux (AppImage / binary):
npx nativefier --name "MuteJar" --icon public/icon.svg --platform linux "http://localhost:3000"
```

### Option 3: Docker Container
Run Mute Jar anywhere with Docker in a single command:
```bash
# Build container image
docker build -t mutejar .

# Run container on port 3000
docker run -d -p 3000:3000 --name mutejar-app mutejar
```

### Option 4: Tauri Native Packaging (Lightweight Rust Shell)
For teams that prefer ultra-compact native installers (<15MB):
```bash
npm install -D @tauri-apps/cli
npx tauri init
npx tauri build
```

---

## 🛠️ Configuration & Key Settings

All preferences can be customized within the app’s **Settings** modal:
- **Philosophy Style**: Action-focused names (*The Habit Builder*, *The Forfeit Master*) vs. Classic labels (*The Pragmatist*, *The Roast Master*).
- **MuteCoin Exchange Rate**: Assign a custom monetary valuation per coin in your local system currency (e.g., $1.00, £0.50, €1.00).
- **Cycle Frequency**: Choose between **Weekly** (7-day ISO week), **Fortnightly** (14-day sprint cycles), or **Monthly** (calendar month).
- **Speech Sensitivity Threshold**: 10-level slider adjusting speech onset threshold.
- **Background Noise Filter**: Dynamic voice-to-noise margin (+15%) and quick 2-second ambient noise calibration.
- **Speaker Voice Pattern (Voiceprint)**: Real-time fundamental pitch ($F_0$) autocorrelation and 16-band formant matching to exclude background radios, podcasts, and co-workers.
- **Proximity Profile**: Near-field desk mic, headset boom mic, or room mic.

---

## 📄 License

This project is licensed under the **Apache-2.0 License**. See [LICENSE](LICENSE) for details.
