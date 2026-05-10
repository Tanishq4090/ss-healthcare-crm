import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const skipDirs = new Set(['node_modules', '.git', 'dist', 'build', '.next', '.vercel']);
const textExt = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.html', '.md']);
const forbidden = ['99Care', '99 Care', '99care-logo', 'ElevenLabs'];
const hits = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (textExt.has(path.extname(entry.name))) scan(full);
  }
}

function scan(file) {
  const text = fs.readFileSync(file, 'utf8');
  for (const word of forbidden) {
    if (text.includes(word)) hits.push(`${path.relative(root, file)} contains ${word}`);
  }
}

walk(root);
if (hits.length) {
  console.error('Brand lock check failed:\n' + hits.slice(0, 80).join('\n'));
  process.exit(1);
}
console.log('Brand lock check passed: no legacy 99Care/ElevenLabs branding found.');
