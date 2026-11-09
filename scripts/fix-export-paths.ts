/*
 * Runs automatically after `npm run build`.
 *
 * Works around a Next.js static export bug on Windows. The router prefetches segment files
 * named like /burden/__next.burden.__PAGE__.txt. On Windows the exporter gets the path with
 * a backslash and writes out/burden/__next.burden/__PAGE__.txt instead, so every prefetch
 * fails with a 404 and a console error. This moves those files to the expected name.
 *
 * On Linux, including Vercel, the exporter writes the right name and this finds nothing to do.
 */
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.cwd(), 'out');
const PREFIX = '__next.';

function filesUnder(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(full) : [full];
  });
}

let moved = 0;

function visit(directory: string) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const full = path.join(directory, entry.name);
    if (!entry.name.startsWith(PREFIX)) {
      visit(full);
      continue;
    }
    for (const file of filesUnder(full)) {
      const flatName = path.relative(directory, file).split(path.sep).join('.');
      fs.renameSync(file, path.join(directory, flatName));
      moved += 1;
    }
    fs.rmSync(full, { recursive: true });
  }
}

if (fs.existsSync(OUT)) visit(OUT);
if (moved > 0) console.log(`Flattened ${moved} segment files in out/ (Windows export path fix).`);
