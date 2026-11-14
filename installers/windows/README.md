# Windows Single-File Installers

After the GitHub Actions workflow runs (triggered automatically on every commit), the Windows installers are staged here (or downloadable via **GitHub → Actions** `installers-windows` / `mutejar-installers-all-os`):

- `Mute Jar_1.0.0_x64-setup.exe` (NSIS wizard)
- `Mute Jar_1.0.0_x64_en-US.msi` (Windows Installer package)

### Free Code Signing & SmartScreen
- **Trusted Free OSS Signing**: When `SIGNPATH_API_TOKEN` and `SIGNPATH_ORG_ID` secrets are configured from [SignPath Foundation](https://signpath.org/) (free for public Apache-2.0 open-source projects), CI signs `.exe` and `.msi` packages automatically so Windows SmartScreen warnings do not appear.
- **Before SignPath Onboarding**: Verify the download hash against `installers/SHA256SUMS.txt`:
  ```powershell
  Get-FileHash .\Mute*.exe -Algorithm SHA256
  ```
  Then click **More info → Run anyway** on the SmartScreen prompt.
