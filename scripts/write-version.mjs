import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { version } = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
let commit = 'desconocido';

try {
  commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
} catch (error) {
  if (error.code !== 'ENOENT' && error.status !== 128) throw error;
}

const publicDir = path.join(root, 'public');
await mkdir(publicDir, { recursive: true });
await writeFile(path.join(publicDir, 'version.json'), `${JSON.stringify({ version, commit, builtAt: new Date().toISOString() }, null, 2)}\n`);
