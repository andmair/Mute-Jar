# Desktop Installers

Compiled single-file installers are organized by operating system into the sub-folders below by GitHub Actions (`.github/workflows/release-desktop.yml`) on **every commit** and locally via `npm run desktop:build && node scripts/stage-installers.mjs`:

- `installers/macos/` — Universal `.dmg` (Apple Silicon & Intel)
- `installers/windows/` — `-setup.exe` (NSIS) & `.msi`
- `installers/linux/` — `.AppImage` & `.deb`
- `installers/chromeos/` — 1-click PWA install instructions

### How Downloads Work
1. When a branch commit finishes building on GitHub Actions, the workflow automatically copies the compiled binaries into `installers/macos/`, `installers/windows/`, and `installers/linux/` (alongside each folder's `README.md`) and commits them back with `[skip ci]`.
2. You can download installers directly from the repository folders, from **GitHub → Actions** artifacts (`mutejar-installers-all-os`), or directly inside Mute Jar (**Setup → Desktop Installers**, served via `/downloads`).
3. Tagged builds (`v*`) also attach all single-file installers to **GitHub → Releases**.
