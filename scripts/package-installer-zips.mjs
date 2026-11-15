import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

export const APPLICABLE_OS_FOLDERS = ['macos', 'windows', 'linux'];

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
  '.crx',
];

const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[i] = c >>> 0;
}

export function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i++) {
    crc = CRC_TABLE[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function toDosDateTime(date = new Date()) {
  const year = Math.max(1980, Math.min(2107, date.getFullYear()));
  const dosTime =
    ((date.getHours() & 0x1f) << 11) |
    ((date.getMinutes() & 0x3f) << 5) |
    ((date.getSeconds() >> 1) & 0x1f);
  const dosDate =
    (((year - 1980) & 0x7f) << 9) |
    (((date.getMonth() + 1) & 0x0f) << 5) |
    (date.getDate() & 0x1f);
  return { dosTime, dosDate };
}

export function buildZipBuffer(files) {
  const chunks = [];
  const centralDirRecords = [];
  let offset = 0;

  for (const file of files) {
    const cleanName = path.posix.basename(file.name.replace(/\\/g, '/'));
    const nameBuf = Buffer.from(cleanName, 'utf8');
    const rawData = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data);
    const deflated = zlib.deflateRawSync(rawData);
    const useDeflate = deflated.length < rawData.length;
    const method = useDeflate ? 8 : 0;
    const payload = useDeflate ? deflated : rawData;

    const crc = crc32(rawData);
    const { dosTime, dosDate } = toDosDateTime(file.mtime ?? new Date());
    const unixMode = (file.mode ?? 0o644) & 0o777;
    const externalAttrs = ((0o100000 | unixMode) << 16) >>> 0;

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(method, 8);
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(payload.length, 18);
    localHeader.writeUInt32LE(rawData.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE((3 << 8) | 20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(method, 10);
    centralHeader.writeUInt16LE(dosTime, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(payload.length, 20);
    centralHeader.writeUInt32LE(rawData.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(externalAttrs, 38);
    centralHeader.writeUInt32LE(offset, 42);

    chunks.push(localHeader, nameBuf, payload);
    centralDirRecords.push(centralHeader, nameBuf);

    offset += localHeader.length + nameBuf.length + payload.length;
  }

  const cdOffset = offset;
  let cdSize = 0;
  for (const part of centralDirRecords) {
    cdSize += part.length;
  }

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(cdSize, 12);
  eocd.writeUInt32LE(cdOffset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...chunks, ...centralDirRecords, eocd]);
}

export function readInstallerVersion(tauriConfigPath) {
  const raw = JSON.parse(fs.readFileSync(tauriConfigPath, 'utf8'));
  const version = typeof raw.version === 'string' ? raw.version.trim() : '';
  if (!version || /[\\/\s]/.test(version)) {
    throw new Error(`Invalid installer version in ${tauriConfigPath}: "${version}"`);
  }
  return version;
}

export function getZipFilename(version, osFolder) {
  return `MuteJar_${version}_${osFolder}.zip`;
}

export function isPackagedInstallerFile(filename) {
  if (!filename || filename.startsWith('.')) return false;
  const lower = filename.toLowerCase();
  if (lower.endsWith('.zip') || lower.endsWith('.asc') || lower.startsWith('sha256sums')) {
    return false;
  }
  return INSTALLER_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function collectZipEntriesForOsDir(osDir) {
  if (!fs.existsSync(osDir)) {
    throw new Error(`Missing installer directory: ${osDir}`);
  }

  const dirEntries = fs
    .readdirSync(osDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  const installerFiles = dirEntries.filter((name) => isPackagedInstallerFile(name));
  const hasReadme = dirEntries.includes('README.md');

  if (installerFiles.length === 0) {
    throw new Error(`No built installer files found in ${osDir}`);
  }
  if (!hasReadme) {
    throw new Error(`Missing README.md in ${osDir}`);
  }

  const selected = [...installerFiles, 'README.md'];
  return selected.map((name) => ({
    name,
    fullPath: path.join(osDir, name),
  }));
}

export function packageInstallerZips(options = {}) {
  const rootDir = options.rootDir ?? process.cwd();
  const installersDir = options.installersDir ?? path.join(rootDir, 'installers');
  const tauriConfigPath =
    options.tauriConfigPath ?? path.join(rootDir, 'src-tauri', 'tauri.conf.json');
  const osFolders = options.osFolders ?? APPLICABLE_OS_FOLDERS;

  const version = readInstallerVersion(tauriConfigPath);
  const results = [];

  for (const osFolder of osFolders) {
    const osDir = path.join(installersDir, osFolder);
    const entries = collectZipEntriesForOsDir(osDir);
    const zipFilename = getZipFilename(version, osFolder);
    const zipPath = path.join(osDir, zipFilename);

    const filesForZip = entries.map((entry) => {
      const stat = fs.statSync(entry.fullPath);
      return {
        name: entry.name,
        data: fs.readFileSync(entry.fullPath),
        mode: stat.mode,
        mtime: stat.mtime,
      };
    });

    const zipBuffer = buildZipBuffer(filesForZip);
    fs.writeFileSync(zipPath, zipBuffer);

    const includedFiles = entries.map((e) => e.name);
    console.log(`Created ${path.relative(rootDir, zipPath)} (${includedFiles.join(', ')})`);

    results.push({
      os: osFolder,
      version,
      zipFilename,
      zipPath,
      includedFiles,
    });
  }

  return results;
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
  packageInstallerZips();
}
