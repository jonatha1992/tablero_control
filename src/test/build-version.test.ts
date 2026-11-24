// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, it } from 'vitest';

it('builds version metadata without git and preserves the release version in Docker', () => {
  const root = mkdtempSync(path.join(process.env.TMPDIR || tmpdir(), 'tablero-version-'));
  try {
    mkdirSync(path.join(root, 'src/config'), { recursive: true });
    mkdirSync(path.join(root, 'public'));
    writeFileSync(path.join(root, 'src/config/version.ts'), "export const APP_VERSION = '0.1.43';\nexport const BUILD_DATE = '2026-11-23';\n");
    writeFileSync(path.join(root, 'package.json'), '{"version":"0.1.43"}');
    execFileSync(process.execPath, [path.resolve('node_modules/tsx/dist/cli.mjs'), path.resolve('scripts/bump-version.ts')], {
      cwd: root,
      env: { ...process.env, PATH: '', SKIP_VERSION_BUMP: '1', GIT_SHA: '5ef7b01' },
    });
    expect(JSON.parse(readFileSync(path.join(root, 'public/version.json'), 'utf8'))).toEqual({ version: '0.1.43', sha: '5ef7b01' });
    expect(JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')).version).toBe('0.1.43');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
