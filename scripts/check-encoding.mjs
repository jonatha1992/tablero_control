import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const ignoredDirs = new Set([
  '.git',
  '.next',
  'node_modules',
  'playwright-report',
  'screenshots-review',
  'test-results',
]);
const extensions = new Set([
  '.cjs',
  '.css',
  '.html',
  '.js',
  '.json',
  '.jsx',
  '.md',
  '.mjs',
  '.prisma',
  '.ts',
  '.tsx',
  '.txt',
  '.yaml',
  '.yml',
]);
const suspiciousChars = String.fromCodePoint(0x00c2, 0x00c3, 0x00e2, 0x00f0, 0xfffd);
const suspiciousFragments = [
  String.fromCodePoint(0x00e2, 0x20ac),
  String.fromCodePoint(0x00f0, 0x0178),
  String.fromCodePoint(0x00ef, 0x00b8),
];
const findings = [];

function hasMojibake(line) {
  return [...suspiciousChars].some((char) => line.includes(char))
    || suspiciousFragments.some((fragment) => line.includes(fragment));
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) walk(path.join(dir, entry.name));
      continue;
    }

    if (!entry.isFile()) continue;

    const file = path.join(dir, entry.name);
    if (!extensions.has(path.extname(entry.name))) continue;

    const text = fs.readFileSync(file, 'utf8');
    const lines = text.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (hasMojibake(line)) {
        findings.push(`${path.relative(root, file)}:${index + 1}: ${line.trim()}`);
      }
    });
  }
}

walk(root);

if (findings.length > 0) {
  console.error('Se detectaron posibles caracteres con encoding roto:');
  console.error(findings.join('\n'));
  process.exit(1);
}

console.log('Encoding OK');
