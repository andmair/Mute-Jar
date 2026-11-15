import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  collectZipEntriesForOsDir,
  getZipFilename,
  isPackagedInstallerFile,
  packageInstallerZips,
  readInstallerVersion,
} from './package-installer-zips.mjs';

describe('package-installer-zips', () => {
  let tmpRoot: string;
  let installersDir: string;
  let tauriConfigPath: string;

  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'mutejar-zips-'));
    installersDir = path.join(tmpRoot, 'installers');
    const srcTauriDir = path.join(tmpRoot, 'src-tauri');
    fs.mkdirSync(srcTauriDir, { recursive: true });
    tauriConfigPath = path.join(srcTauriDir, 'tauri.conf.json');
    fs.writeFileSync(tauriConfigPath, JSON.stringify({ productName: 'Mute Jar', version: '1.2.3' }));

    for (const folder of ['macos', 'windows', 'linux', 'chromeos']) {
      fs.mkdirSync(path.join(installersDir, folder), { recursive: true });
      fs.writeFileSync(path.join(installersDir, folder, 'README.md'), `# ${folder} README\n`);
    }

    fs.writeFileSync(path.join(installersDir, 'macos', 'Mute Jar_1.2.3_universal.dmg'), 'dmg-binary-payload');
    fs.writeFileSync(path.join(installersDir, 'windows', 'Mute Jar_1.2.3_x64-setup.exe'), 'exe-binary-payload');
    fs.writeFileSync(path.join(installersDir, 'windows', 'Mute Jar_1.2.3_x64_en-US.msi'), 'msi-binary-payload');
    fs.writeFileSync(path.join(installersDir, 'linux', 'Mute Jar_1.2.3_amd64.AppImage'), 'appimage-binary-payload');
    fs.writeFileSync(path.join(installersDir, 'linux', 'Mute Jar_1.2.3_amd64.deb'), 'deb-binary-payload');
  });

  afterEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  it('reads installer version and constructs predictable versioned ZIP filenames', () => {
    expect(readInstallerVersion(tauriConfigPath)).toBe('1.2.3');
    expect(getZipFilename('1.2.3', 'macos')).toBe('MuteJar_1.2.3_macos.zip');
    expect(getZipFilename('1.2.3', 'windows')).toBe('MuteJar_1.2.3_windows.zip');
    expect(getZipFilename('1.2.3', 'linux')).toBe('MuteJar_1.2.3_linux.zip');
  });

  it('excludes checksums, dotfiles, and pre-existing ZIP archives from packaging', () => {
    fs.writeFileSync(path.join(installersDir, 'macos', 'MuteJar_1.2.3_macos.zip'), 'old-zip');
    fs.writeFileSync(path.join(installersDir, 'macos', 'SHA256SUMS.txt'), 'abc123');
    fs.writeFileSync(path.join(installersDir, 'macos', 'SHA256SUMS.txt.asc'), 'sig');
    fs.writeFileSync(path.join(installersDir, 'macos', '.DS_Store'), 'junk');

    expect(isPackagedInstallerFile('Mute Jar_1.2.3_universal.dmg')).toBe(true);
    expect(isPackagedInstallerFile('MuteJar_1.2.3_macos.zip')).toBe(false);
    expect(isPackagedInstallerFile('SHA256SUMS.txt')).toBe(false);

    const entries = collectZipEntriesForOsDir(path.join(installersDir, 'macos'));
    expect(entries.map((entry) => entry.name)).toEqual([
      'Mute Jar_1.2.3_universal.dmg',
      'README.md',
    ]);
  });

  it('creates valid root-flat ZIP archives alongside standalone installers and READMEs', () => {
    fs.writeFileSync(path.join(installersDir, 'macos', 'MuteJar_1.2.3_macos.zip'), 'stale-zip');
    fs.writeFileSync(path.join(installersDir, 'SHA256SUMS.txt'), 'root-manifest');

    const results = packageInstallerZips({
      rootDir: tmpRoot,
      installersDir,
      tauriConfigPath,
    });

    expect(results.map((r) => r.os)).toEqual(['macos', 'windows', 'linux']);

    // Standalone files & READMEs remain intact in place
    expect(fs.existsSync(path.join(installersDir, 'macos', 'Mute Jar_1.2.3_universal.dmg'))).toBe(true);
    expect(fs.existsSync(path.join(installersDir, 'macos', 'README.md'))).toBe(true);
    expect(fs.existsSync(path.join(installersDir, 'windows', 'Mute Jar_1.2.3_x64-setup.exe'))).toBe(true);
    expect(fs.existsSync(path.join(installersDir, 'windows', 'Mute Jar_1.2.3_x64_en-US.msi'))).toBe(true);
    expect(fs.existsSync(path.join(installersDir, 'linux', 'Mute Jar_1.2.3_amd64.AppImage'))).toBe(true);
    expect(fs.existsSync(path.join(installersDir, 'linux', 'Mute Jar_1.2.3_amd64.deb'))).toBe(true);
    // ChromeOS is PWA-only and has no ZIP
    expect(fs.existsSync(path.join(installersDir, 'chromeos', 'MuteJar_1.2.3_chromeos.zip'))).toBe(false);

    // Verify each generated ZIP using system unzip
    for (const result of results) {
      execFileSync('unzip', ['-t', result.zipPath], { stdio: 'pipe' });
      const listed = execFileSync('unzip', ['-Z1', result.zipPath], { encoding: 'utf8' })
        .trim()
        .split('\n')
        .filter(Boolean);

      expect(listed).toEqual(result.includedFiles);
      expect(listed.every((name) => !name.includes('/'))).toBe(true);
      expect(listed.some((name) => name.endsWith('.zip'))).toBe(false);
      expect(listed.some((name) => name.includes('SHA256SUMS'))).toBe(false);
    }

    // Verify macOS ZIP specifically extracts exact DMG & README contents
    const extractDir = path.join(tmpRoot, 'extracted-macos');
    fs.mkdirSync(extractDir);
    execFileSync('unzip', ['-q', path.join(installersDir, 'macos', 'MuteJar_1.2.3_macos.zip'), '-d', extractDir]);
    expect(fs.readFileSync(path.join(extractDir, 'Mute Jar_1.2.3_universal.dmg'), 'utf8')).toBe('dmg-binary-payload');
    expect(fs.readFileSync(path.join(extractDir, 'README.md'), 'utf8')).toBe('# macos README\n');
  });
});
