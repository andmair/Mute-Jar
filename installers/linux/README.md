# Linux Single-File Installers

After the GitHub Actions workflow runs (triggered automatically on every commit), the Linux installers are staged here (and available via **GitHub → Actions** `mutejar-installers-all-os` or **GitHub Releases**):

- `MuteJar_1.0.0_linux.zip` (combined ZIP containing both Linux installers + this `README.md`)
- `Mute Jar_1.0.0_amd64.AppImage` (zero-install portable binary for Ubuntu, Fedora, Arch, etc.)
- `Mute Jar_1.0.0_amd64.deb` (Debian / Ubuntu package)

### Verify & Install
1. Verify checksum integrity against `installers/SHA256SUMS.txt`:
   ```bash
   sha256sum -c SHA256SUMS.txt --ignore-missing
   ```
   *(If `SHA256SUMS.txt.asc` is published, verify with `gpg --verify SHA256SUMS.txt.asc SHA256SUMS.txt`.)*
2. Install or launch:
   - **AppImage**: `chmod +x "Mute Jar"*.AppImage && ./"Mute Jar"*.AppImage`
   - **Debian / Ubuntu**: `sudo apt install ./"Mute Jar"*_amd64.deb`
