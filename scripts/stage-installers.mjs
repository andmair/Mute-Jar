import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const bundleSearchRoot = path.join(rootDir, 'src-tauri', 'target');
const installersDir = path.join(rootDir, 'installers');

const osDirs = ['macos', 'windows', 'linux', 'chromeos'];
for (const dir of osDirs) {
  fs.mkdirSync(path.join(installersDir, dir), { recursive: true });
}

function walkFiles(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, results);
    } else if (entry.isFile()) {
      results.push(fullPath);
    }
  }
  return results;
}

const allFiles = walkFiles(bundleSearchRoot);
let copiedCount = 0;

for (const filePath of allFiles) {
  const normalized = filePath.replace(/\\/g, '/');
  if (!normalized.includes('/release/bundle/')) continue;

  const fileName = path.basename(filePath);
  const lower = fileName.toLowerCase();

  let targetSubDir = null;
  if (normalized.includes('/bundle/dmg/') && lower.endsWith('.dmg')) {
    targetSubDir = 'macos';
  } else if (
    (normalized.includes('/bundle/msi/') && lower.endsWith('.msi')) ||
    (normalized.includes('/bundle/nsis/') && lower.endsWith('.exe'))
  ) {
    targetSubDir = 'windows';
  } else if (
    (normalized.includes('/bundle/appimage/') && lower.endsWith('.appimage')) ||
    (normalized.includes('/bundle/deb/') && lower.endsWith('.deb'))
  ) {
    targetSubDir = 'linux';
  }

  if (targetSubDir) {
    const dest = path.join(installersDir, targetSubDir, fileName);
    fs.copyFileSync(filePath, dest);
    console.log(`Staged ${path.relative(rootDir, dest)}`);
    copiedCount += 1;
  }
}

console.log(`Staged ${copiedCount} desktop installer file(s) into installers/.`);
