import fs from 'node:fs';
import path from 'node:path';

export const ALLOWED_OS_FOLDERS = ['macos', 'windows', 'linux', 'chromeos'] as const;
export type OsFolder = (typeof ALLOWED_OS_FOLDERS)[number];

export const INSTALLER_EXTENSIONS = [
  '.app.tar.gz',
  '.tar.gz',
  '.tar.xz',
  '.appimage',
  '.dmg',
  '.pkg',
  '.exe',
  '.msi',
  '.deb',
  '.rpm',
  '.zip',
  '.crx',
] as const;

export interface InstallerArtifact {
  filename: string;
  os: OsFolder;
  sizeBytes: number;
  updatedAt: string;
  downloadUrl: string;
}

export type InstallersCatalog = Record<OsFolder, InstallerArtifact[]>;

export function isValidOsFolder(value: string): value is OsFolder {
  return (ALLOWED_OS_FOLDERS as readonly string[]).includes(value);
}

export function isAllowedInstallerFilename(filename: string): boolean {
  if (!filename || typeof filename !== 'string') return false;
  if (filename.startsWith('.')) return false;
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) return false;
  if (path.basename(filename) !== filename) return false;

  const lower = filename.toLowerCase();
  return INSTALLER_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function listInstallersCatalog(installersRootDir: string): InstallersCatalog {
  const catalog: InstallersCatalog = {
    macos: [],
    windows: [],
    linux: [],
    chromeos: [],
  };

  for (const os of ALLOWED_OS_FOLDERS) {
    const osDir = path.join(installersRootDir, os);
    if (!fs.existsSync(osDir)) continue;

    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(osDir, { withFileTypes: true });
    } catch {
      continue;
    }

    const items: InstallerArtifact[] = [];
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      if (!isAllowedInstallerFilename(entry.name)) continue;

      const fullPath = path.join(osDir, entry.name);
      try {
        const stat = fs.statSync(fullPath);
        if (!stat.isFile()) continue;
        items.push({
          filename: entry.name,
          os,
          sizeBytes: stat.size,
          updatedAt: stat.mtime.toISOString(),
          downloadUrl: `/downloads/${os}/${encodeURIComponent(entry.name)}`,
        });
      } catch {
        // Ignore unreadable entries
      }
    }

    items.sort((a, b) => a.filename.localeCompare(b.filename));
    catalog[os] = items;
  }

  return catalog;
}

export function resolveInstallerFilePath(
  installersRootDir: string,
  osFolder: string,
  filename: string
): string | null {
  if (!isValidOsFolder(osFolder)) return null;
  if (!isAllowedInstallerFilename(filename)) return null;

  const expectedOsDir = path.resolve(installersRootDir, osFolder);
  const resolved = path.resolve(expectedOsDir, filename);

  if (!resolved.startsWith(expectedOsDir + path.sep)) {
    return null;
  }

  if (!fs.existsSync(resolved)) return null;

  try {
    const stat = fs.statSync(resolved);
    if (!stat.isFile()) return null;
    return resolved;
  } catch {
    return null;
  }
}
