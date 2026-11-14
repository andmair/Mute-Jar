import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const installersDir = path.join(rootDir, 'installers');
const osDirs = ['macos', 'windows', 'linux', 'chromeos'];
const allowedExtensions = [
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
];

const lines = [];

for (const osFolder of osDirs) {
  const dirPath = path.join(installersDir, osFolder);
  if (!fs.existsSync(dirPath)) continue;

  const entries = fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => {
      if (name.startsWith('.')) return false;
      const lower = name.toLowerCase();
      return allowedExtensions.some((ext) => lower.endsWith(ext));
    })
    .sort((a, b) => a.localeCompare(b));

  for (const filename of entries) {
    const filePath = path.join(dirPath, filename);
    const hash = crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
    lines.push(`${hash}  ${osFolder}/${filename}`);
  }
}

const outPath = path.join(installersDir, 'SHA256SUMS.txt');
if (lines.length > 0) {
  fs.writeFileSync(outPath, `${lines.join('\n')}\n`, 'utf8');
  console.log(`Wrote ${lines.length} checksum(s) to installers/SHA256SUMS.txt`);
} else {
  if (fs.existsSync(outPath)) {
    fs.unlinkSync(outPath);
  }
  console.log('No staged installer binaries found; skipped SHA256SUMS.txt');
}
