# macOS Single-File Installer

After the GitHub Actions workflow runs (triggered automatically on every commit), the Universal `.dmg` is staged here (or downloadable via **GitHub → Actions** `installers-macos` / `mutejar-installers-all-os`):

- `Mute Jar_1.0.0_universal.dmg` (runs natively on Apple Silicon M1–M4 and Intel Macs, ad-hoc signed via `"signingIdentity": "-"`)

### Install
1. Double-click the `.dmg` file and drag **Mute Jar** into your **Applications** folder.
2. Because Apple Notarization requires a paid $99/yr Developer ID, free builds are ad-hoc signed. If macOS displays an *unidentified developer* or *damaged* alert on first launch:
   - **Option A (GUI)**: Right-click **Mute Jar.app** → click **Open**, or approve it in **System Settings → Privacy & Security → Open Anyway**.
   - **Option B (Terminal)**: Clear the download quarantine flag once:
     ```bash
     xattr -rd com.apple.quarantine "/Applications/Mute Jar.app"
     ```
3. On first launch, approve microphone permission under **System Settings → Privacy & Security → Microphone**.
