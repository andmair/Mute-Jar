# Download Mute Jar

> **Single-file desktop installers (~8–15 MB) built with Tauri v2 — no Node.js, Rust, or Docker required.**

[← Back to README](./README.md) · [Privacy Policy](./PRIVACY.md) · [GitHub Releases](https://github.com/andrewmair/Mute-Jar/releases)

---

## Quick Downloads by Operating System

Every commit pushed to GitHub automatically compiles standalone installers and stages them into the [`installers/`](./installers/) directory, and version tags (`v*`) attach them directly to [GitHub Releases](https://github.com/andrewmair/Mute-Jar/releases).

| Operating System | Recommended Download | Direct / Standalone Files | Repo Folder | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **macOS** (Apple Silicon & Intel) | [`MuteJar_1.0.0_macos.zip`](https://github.com/andrewmair/Mute-Jar/raw/main/installers/macos/MuteJar_1.0.0_macos.zip) *(recommended: `.dmg` + `README.md`)* | [`Mute Jar_1.0.0_universal.dmg`](https://github.com/andrewmair/Mute-Jar/raw/main/installers/macos/Mute%20Jar_1.0.0_universal.dmg) | [`installers/macos/`](./installers/macos/) | Universal binary (M1–M4 + Intel), ad-hoc signed |
| **Windows 10 / 11** (64-bit) | [`MuteJar_1.0.0_windows.zip`](https://github.com/andrewmair/Mute-Jar/raw/main/installers/windows/MuteJar_1.0.0_windows.zip) | `Mute Jar_1.0.0_x64-setup.exe` / `.msi` | [`installers/windows/`](./installers/windows/) | Built-in WebView2; NSIS wizard & enterprise `.msi` |
| **Linux** (x86_64) | [`MuteJar_1.0.0_linux.zip`](https://github.com/andrewmair/Mute-Jar/raw/main/installers/linux/MuteJar_1.0.0_linux.zip) | `Mute Jar_1.0.0_amd64.AppImage` / `.deb` | [`installers/linux/`](./installers/linux/) | Portable AppImage & Debian/Ubuntu `.deb` |
| **ChromeOS** (Chromebook) | 1-Click PWA | — | [`installers/chromeos/`](./installers/chromeos/) | Install directly from Chrome address bar |
| **Checksums & Signatures** | `SHA256SUMS.txt` (+ optional `.asc`) | — | [`installers/SHA256SUMS.txt`](./installers/SHA256SUMS.txt) | SHA-256 verification manifest for all installers and ZIPs |

---

## Installation Instructions

### macOS (Ventura, Sonoma, Sequoia)
1. **Recommended:** Download [`MuteJar_1.0.0_macos.zip`](https://github.com/andrewmair/Mute-Jar/raw/main/installers/macos/MuteJar_1.0.0_macos.zip) (bundles the Universal `.dmg` together with `README.md` setup instructions), or download the direct Universal `.dmg` ([`Mute Jar_1.0.0_universal.dmg`](https://github.com/andrewmair/Mute-Jar/raw/main/installers/macos/Mute%20Jar_1.0.0_universal.dmg)) from [`installers/macos/`](./installers/macos/) or [GitHub Releases](https://github.com/andrewmair/Mute-Jar/releases).
2. Double-click the `.zip` (if downloaded) to extract it, open `Mute Jar_1.0.0_universal.dmg`, and drag **Mute Jar** into your **Applications** folder.
3. Free builds use Apple ad-hoc signing (`signingIdentity: "-"`). If macOS displays an *unidentified developer* alert on first launch:
   - Right-click **Mute Jar.app** → click **Open** (or approve under **System Settings → Privacy & Security → Open Anyway**), **or**
   - Clear the quarantine attribute once in Terminal:
     ```bash
     xattr -rd com.apple.quarantine "/Applications/Mute Jar.app"
     ```
4. Grant microphone access when prompted under **System Settings → Privacy & Security → Microphone**.

### Windows 10 / 11
1. Download [`MuteJar_1.0.0_windows.zip`](https://github.com/andrewmair/Mute-Jar/raw/main/installers/windows/MuteJar_1.0.0_windows.zip) (contains `.exe`, `.msi`, and `README.md`), or grab `Mute Jar_1.0.0_x64-setup.exe` / `Mute Jar_1.0.0_x64_en-US.msi` directly from [`installers/windows/`](./installers/windows/) or [GitHub Releases](https://github.com/andrewmair/Mute-Jar/releases).
2. Double-click the installer to run (Windows 10/11 includes Microsoft Edge WebView2 automatically).
3. If Windows SmartScreen appears prior to SignPath Foundation certificate onboarding, verify the SHA-256 hash below and click **More info → Run anyway**.

> *Free Windows code signing provided by SignPath.io, certificate by [SignPath Foundation](https://signpath.org/) (when configured in GitHub Actions).*

### Linux (Ubuntu, Debian, Fedora, Arch)
Download [`MuteJar_1.0.0_linux.zip`](https://github.com/andrewmair/Mute-Jar/raw/main/installers/linux/MuteJar_1.0.0_linux.zip) (contains `.AppImage`, `.deb`, and `README.md`) or grab the standalone package from [`installers/linux/`](./installers/linux/):
- **AppImage (Portable):**
  ```bash
  chmod +x "Mute Jar"*.AppImage
  ./"Mute Jar"*.AppImage
  ```
- **Debian / Ubuntu (`.deb`):**
  ```bash
  sudo apt install ./"Mute Jar"*_amd64.deb
  ```

### ChromeOS
1. Open the Mute Jar web app in Chrome on your Chromebook.
2. Click the **Install** button in Chrome's address bar (or **Setup → Install App** inside the app).
3. Right-click Mute Jar on your Shelf → **Pin**.

---

## Verify Download Integrity (SHA-256)

Compare your downloaded file against [`installers/SHA256SUMS.txt`](./installers/SHA256SUMS.txt):

- **macOS / Linux:**
  ```bash
  shasum -a 256 "Mute Jar"*
  # or on Linux:
  sha256sum -c SHA256SUMS.txt --ignore-missing
  ```
- **Windows PowerShell:**
  ```powershell
  Get-FileHash ".\Mute Jar*" -Algorithm SHA256
  ```
- **GPG Signature (when `SHA256SUMS.txt.asc` is published):**
  ```bash
  gpg --verify SHA256SUMS.txt.asc SHA256SUMS.txt
  ```

---

## Quick Controls After Installing
- **OS Status Bar / Menu Bar Icon:** Left-click the Mute Jar icon in your macOS menu bar or Windows system tray to quickly toggle the Audio Monitor on or off.
- **Keyboard Hotkey:** Press `Alt+Shift+M` (customizable anytime in **Mute Jar Settings → Audio Monitor Toggle Hotkey**).
