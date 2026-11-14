import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  isAllowedInstallerFilename,
  listInstallersCatalog,
  resolveInstallerFilePath,
  resolveVerificationManifestPath,
} from './downloadsHelper';

describe('downloadsHelper', () => {
  let tmpRoot: string;

  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'mutejar-downloads-'));
    for (const folder of ['macos', 'windows', 'linux', 'chromeos']) {
      fs.mkdirSync(path.join(tmpRoot, folder), { recursive: true });
    }
  });

  afterEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  it('allows valid desktop installer filenames and rejects docs/dotfiles/traversal', () => {
    expect(isAllowedInstallerFilename('Mute Jar_1.0.0_universal.dmg')).toBe(true);
    expect(isAllowedInstallerFilename('Mute Jar_1.0.0_x64-setup.exe')).toBe(true);
    expect(isAllowedInstallerFilename('Mute Jar_1.0.0_x64_en-US.msi')).toBe(true);
    expect(isAllowedInstallerFilename('Mute Jar_1.0.0_amd64.AppImage')).toBe(true);
    expect(isAllowedInstallerFilename('Mute Jar_1.0.0_amd64.deb')).toBe(true);

    expect(isAllowedInstallerFilename('README.md')).toBe(false);
    expect(isAllowedInstallerFilename('.gitkeep')).toBe(false);
    expect(isAllowedInstallerFilename('../secret.dmg')).toBe(false);
    expect(isAllowedInstallerFilename('nested/app.exe')).toBe(false);
  });

  it('lists staged installer binaries with SHA-256 hashes while skipping README.md', () => {
    fs.writeFileSync(path.join(tmpRoot, 'macos', 'README.md'), '# macOS');
    fs.writeFileSync(path.join(tmpRoot, 'macos', 'MuteJar_universal.dmg'), 'dmg-bytes');
    fs.writeFileSync(path.join(tmpRoot, 'windows', 'MuteJar_x64.msi'), 'msi-bytes');
    fs.writeFileSync(path.join(tmpRoot, 'linux', 'MuteJar_amd64.AppImage'), 'appimage');

    const expectedDmgHash = crypto.createHash('sha256').update('dmg-bytes').digest('hex');

    const catalog = listInstallersCatalog(tmpRoot);
    expect(catalog.macos).toHaveLength(1);
    expect(catalog.macos[0].filename).toBe('MuteJar_universal.dmg');
    expect(catalog.macos[0].sha256).toBe(expectedDmgHash);
    expect(catalog.macos[0].downloadUrl).toBe('/downloads/macos/MuteJar_universal.dmg');
    expect(catalog.windows).toHaveLength(1);
    expect(catalog.windows[0].downloadUrl).toBe('/downloads/windows/MuteJar_x64.msi');
    expect(catalog.linux).toHaveLength(1);
    expect(catalog.chromeos).toHaveLength(0);
  });

  it('resolves valid download and verification manifest paths safely', () => {
    const file = path.join(tmpRoot, 'macos', 'MuteJar.dmg');
    const sums = path.join(tmpRoot, 'SHA256SUMS.txt');
    fs.writeFileSync(file, 'binary');
    fs.writeFileSync(sums, 'abc123  macos/MuteJar.dmg\n');

    expect(resolveInstallerFilePath(tmpRoot, 'macos', 'MuteJar.dmg')).toBe(file);
    expect(resolveInstallerFilePath(tmpRoot, 'freebsd', 'MuteJar.dmg')).toBeNull();
    expect(resolveInstallerFilePath(tmpRoot, 'macos', '../secret.dmg')).toBeNull();
    expect(resolveInstallerFilePath(tmpRoot, 'macos', 'README.md')).toBeNull();
    expect(resolveInstallerFilePath(tmpRoot, 'macos', 'missing.dmg')).toBeNull();

    expect(resolveVerificationManifestPath(tmpRoot, 'SHA256SUMS.txt')).toBe(sums);
    expect(resolveVerificationManifestPath(tmpRoot, 'SHA256SUMS.txt.asc')).toBeNull();
    expect(resolveVerificationManifestPath(tmpRoot, '../package.json')).toBeNull();
  });
});
