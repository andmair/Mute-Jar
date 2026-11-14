# Desktop Installers

Compiled single-file installers are organized by operating system into the sub-folders below by GitHub Actions (`.github/workflows/release-desktop.yml`) on **every commit** and locally via `npm run desktop:build && node scripts/stage-installers.mjs`:

- `installers/macos/` — Universal `.dmg` (Apple Silicon & Intel)
- `installers/windows/` — `-setup.exe` (NSIS) & `.msi`
- `installers/linux/` — `.AppImage` & `.deb`
- `installers/chromeos/` — 1-click PWA install instructions

To download the latest compiled installers from GitHub:
1. Open the repository's **Actions** tab and select the latest **Build & Release Desktop Installers** run.
2. Download `mutejar-installers-all-os` (contains all OS sub-folders) or the individual OS artifact (`installers-macos`, `installers-windows`, `installers-linux`).
3. Tagged builds (`v*`) also attach all single-file installers to **GitHub → Releases**.
