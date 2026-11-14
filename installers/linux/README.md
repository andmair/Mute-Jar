# Linux Single-File Installers

After the GitHub Actions workflow runs (triggered automatically on every commit), download **`installers-linux`** (or **`mutejar-installers-all-os`**) from **GitHub → Actions** to get:

- `Mute Jar_1.0.0_amd64.AppImage` (zero-install portable binary for Ubuntu, Fedora, Arch, etc.)
- `Mute Jar_1.0.0_amd64.deb` (Debian / Ubuntu package)

### Install
- **AppImage**: `chmod +x "Mute Jar"*.AppImage && ./"Mute Jar"*.AppImage`
- **Debian / Ubuntu**: `sudo apt install ./"Mute Jar"*_amd64.deb`
