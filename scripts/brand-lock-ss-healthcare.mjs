import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const textExt = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.html', '.md', '.json', '.sql']);
const skipDirs = new Set(['node_modules', '.git', 'dist', 'build', '.next', '.vercel']);

const replacements = [
  [/99Care OS/g, 'SS Health Care Admin OS'],
  [/99 Care OS/g, 'SS Health Care Admin OS'],
  [/99Care/g, 'SS Health Care'],
  [/99 Care/g, 'SS Health Care'],
  [/99care-logo\.svg/g, 'logo.png'],
  [/https:\/\/99care\.org\/wp-content\/uploads\/2024\/01\/99care-logo\.svg/g, '/logo.png'],
  [/https:\/\/99care\.in/g, 'https://homecareservices.co.in'],
  [/99care\.in/g, 'homecareservices.co.in'],
  [/Powered by Supabase \+ ElevenLabs/g, 'Powered by Supabase + Callyzer'],
  [/AI voice agent/gi, 'Callyzer call review'],
  [/Voice AI/g, 'Callyzer Calls'],
];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (skipDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (textExt.has(path.extname(entry.name))) rewrite(full);
  }
}

function rewrite(file) {
  let s = fs.readFileSync(file, 'utf8');
  const before = s;
  for (const [pattern, replacement] of replacements) s = s.replace(pattern, replacement);
  if (file.endsWith('src/index.css') && !s.includes("ss-healthcare-brand-lock.css")) {
    s = s.replace("@tailwind base;", "@import './styles/ss-healthcare-brand-lock.css';\n\n@tailwind base;");
  }
  if (s !== before) {
    fs.writeFileSync(file, s);
    console.log(`brand-lock updated ${path.relative(root, file)}`);
  }
}

walk(root);
console.log('SS Health Care brand lock complete.');
