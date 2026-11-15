# Desktop Installers

Compiled single-file installers and versioned OS ZIP archives are organized by operating system into the sub-folders below by GitHub Actions (`.github/workflows/release-desktop.yml`) on **every commit** and locally via `npm run desktop:build && node scripts/stage-installers.mjs && node scripts/package-installer-zips.mjs && node scripts/generate-checksums.mjs`:

- `installers/macos/` — Recommended `MuteJar_<version>_macos.zip` (`.dmg` + `README.md`) and standalone Universal `.dmg` (Apple Silicon & Intel, ad-hoc signed)
- `installers/windows/` — `MuteJar_<version>_windows.zip` (`.exe` + `.msi` + `README.md`) and standalone `-setup.exe` (NSIS) & `.msi` (SignPath Foundation free OSS signing when configured)
- `installers/linux/` — `MuteJar_<version>_linux.zip` (`.AppImage` + `.deb` + `README.md`) and standalone `.AppImage` & `.deb`
- `installers/chromeos/` — 1-click PWA install instructions
- `installers/SHA256SUMS.txt` — Generated SHA-256 integrity manifest covering all standalone installers and ZIP archives (plus `SHA256SUMS.txt.asc` when a free GPG signing secret is configured)

### Free Signing Secrets (GitHub Actions)
- **Windows (SignPath Foundation, $0 for public Apache-2.0 OSS)**: Add `SIGNPATH_API_TOKEN` and `SIGNPATH_ORG_ID` repository secrets (plus optional `SIGNPATH_PROJECT_SLUG`, `SIGNPATH_SIGNING_POLICY_SLUG`, `SIGNPATH_ARTIFACT_CONFIG_SLUG` variables) to eliminate Windows SmartScreen warnings automatically.
- **macOS ($0 Ad-Hoc)**: Configured automatically via `"signingIdentity": "-"` in `src-tauri/tauri.conf.json`. See `installers/macos/README.md` for one-time quarantine bypass instructions.
- **Checksums & Optional GPG ($0)**: `SHA256SUMS.txt` is generated automatically; optionally add `GPG_PRIVATE_KEY` (and `GPG_PASSPHRASE`) secrets to attach `SHA256SUMS.txt.asc`.
