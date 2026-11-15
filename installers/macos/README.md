# macOS Single-File Installer

After the GitHub Actions workflow runs (triggered automatically on every commit), the macOS downloads are staged here (and available via **GitHub → Actions** `mutejar-installers-all-os` or **GitHub Releases**):

- **`MuteJar_1.0.0_macos.zip`** *(Recommended)* — Bundles `Mute Jar_1.0.0_universal.dmg` together with this `README.md`
- **`Mute Jar_1.0.0_universal.dmg`** *(Direct DMG)* — Universal disk image for Apple Silicon M1–M4 and Intel Macs (ad-hoc signed via `"signingIdentity": "-"`)

### Install
1. If you downloaded the `.zip`, double-click it to extract the `.dmg` and `README.md`.
2. Double-click `Mute Jar_1.0.0_universal.dmg` and drag **Mute Jar** into your **Applications** folder.
3. Because Apple Notarization requires a paid $99/yr Developer ID, free builds are ad-hoc signed. If macOS displays an *unidentified developer* or *damaged* alert on first launch:
   - **Option A (GUI)**: Right-click **Mute Jar.app** → click **Open**, or approve it in **System Settings → Privacy & Security → Open Anyway**.
   - **Option B (Terminal)**: Clear the download quarantine flag once:
     ```bash
     xattr -rd com.apple.quarantine "/Applications/Mute Jar.app"
     ```
4. On first launch, approve microphone permission under **System Settings → Privacy & Security → Microphone**.
