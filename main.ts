// Leonida 55 — hand-in program (Node 22, standard library only).
// Written fresh for this entry. It checks the guide before handing it in,
// then copies app/ and screenshots/ beside this file into the output dir
// (/output, or MAKEFUN_OUTPUT_DIR outside the grader) and writes
// /output/dossier.json with the vendored make.fun library
// (vendor/makefun-frontend.ts, copied from the kit unchanged — never edited).
// The app itself is plain static files under app/: index.html opens in desktop
// Chrome with the network off and loads nothing from outside app/.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//   node serve.ts   # then open http://localhost:8080

import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const appDir = join(here, 'app');
const shotsDir = join(here, 'screenshots');

// Preflight 1: the trophy file must hold the official 55, with the official
// grade split (1 platinum, 2 gold, 6 silver, 46 bronze) and a guide each.
const trophyDoc = JSON.parse(readFileSync(join(appDir, 'data', 'trophies.json'), 'utf8'));
const trophies = trophyDoc.trophies ?? trophyDoc;
if (!Array.isArray(trophies) || trophies.length !== 55) {
  throw new Error(`preflight: expected 55 trophies, found ${Array.isArray(trophies) ? trophies.length : 'no array'}`);
}
const gradeCounts = {};
for (const t of trophies) {
  gradeCounts[t.grade] = (gradeCounts[t.grade] ?? 0) + 1;
  if (typeof t.name !== 'string' || !t.name.trim()) throw new Error('preflight: a trophy has no name');
  if (typeof t.guide !== 'string' || !t.guide.trim()) throw new Error(`preflight: trophy "${t.name}" has no guide`);
}
const expectedGrades = { platinum: 1, gold: 2, silver: 6, bronze: 46 };
for (const [grade, want] of Object.entries(expectedGrades)) {
  if (gradeCounts[grade] !== want) throw new Error(`preflight: expected ${want} ${grade}, found ${gradeCounts[grade] ?? 0}`);
}

// Preflight 2: app/ holds plain files only — no symlinks or special files.
function walkPlain(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const st = lstatSync(path);
    if (!st.isFile() && !st.isDirectory()) throw new Error(`preflight: not a plain file or directory: ${path}`);
    if (st.isDirectory()) walkPlain(path);
  }
}
walkPlain(appDir);
if (!existsSync(join(appDir, 'index.html'))) throw new Error('preflight: app/index.html is missing');

// Preflight 3: 3 or 4 screenshots, each a whole file at most 256 KiB.
const shots = existsSync(shotsDir) ? readdirSync(shotsDir).filter((f) => !f.startsWith('.')) : [];
if (shots.length < 3 || shots.length > 4) throw new Error(`preflight: expected 3-4 screenshots, found ${shots.length}`);
for (const f of shots) {
  const size = statSync(join(shotsDir, f)).size;
  if (size > 262144) throw new Error(`preflight: screenshot ${f} is ${size} bytes, over the 256 KiB cap`);
}

mkdirSync(outDir, { recursive: true });
cpSync(appDir, join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(shotsDir)) cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });

// The scorer's caps (kit reference/gate.json): only text_max_bytes shapes the
// bytes; the others refuse an entry the scorer would refuse (more than 4
// screenshots or one over 256 KiB; more than 993 files and directories in app/
// or 48 MiB of app files — app/ counts beside /output's own 1000-entry cap).
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
console.log(`Leonida 55 handed in: ${trophies.length} trophies (${gradeCounts.platinum} platinum, ${gradeCounts.gold} gold, ${gradeCounts.silver} silver, ${gradeCounts.bronze} bronze), ${shots.length} screenshots -> ${outDir}`);
