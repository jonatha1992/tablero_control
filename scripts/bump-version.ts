/**
 * Incrementa patch semver y sincroniza version.ts, package.json y public/version.json.
 * Se ejecuta automáticamente vía prebuild antes de `next build`.
 */
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const versionFilePath = path.join(root, 'src/config/version.ts');
const versionJsonPath = path.join(root, 'public/version.json');
const packageJsonPath = path.join(root, 'package.json');

function bumpVersion(): void {
  if (process.env.SKIP_VERSION_BUMP === '1') {
    console.log('Skipping version bump (SKIP_VERSION_BUMP=1)');
    return;
  }

  const content = fs.readFileSync(versionFilePath, 'utf8');

  const versionMatch = content.match(/APP_VERSION = ['"](\d+)\.(\d+)\.(\d+)['"]/);
  if (!versionMatch) {
    throw new Error('Version pattern not found in src/config/version.ts');
  }

  const [, major, minor, patch] = versionMatch;
  const newPatch = parseInt(patch, 10) + 1;
  const newVersion = `${major}.${minor}.${newPatch}`;
  const today = new Date().toISOString().split('T')[0];

  const newContent = content
    .replace(/APP_VERSION = ['"].*['"]/, `APP_VERSION = '${newVersion}'`)
    .replace(/BUILD_DATE = ['"].*['"]/, `BUILD_DATE = '${today}'`);

  fs.writeFileSync(versionFilePath, newContent, 'utf8');

  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as { version?: string };
  pkg.version = newVersion;
  fs.writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');

  const versionJson = {
    version: newVersion,
    buildDate: today,
  };
  fs.writeFileSync(versionJsonPath, `${JSON.stringify(versionJson, null, 2)}\n`, 'utf8');

  console.log(`Version bumped: ${major}.${minor}.${patch} → ${newVersion}`);
  console.log(`Build date updated: ${today}`);
}

try {
  bumpVersion();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error('Error bumping version:', message);
  process.exit(1);
}
