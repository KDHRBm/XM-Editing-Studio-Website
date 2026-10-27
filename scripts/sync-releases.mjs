import fs from 'node:fs/promises';
import { RELEASES_API, selectDownloads } from '../docs/release-core.mjs';
const input = process.argv[2];
let releases;
if (input) releases = JSON.parse((await fs.readFile(input, 'utf8')).replace(/^\ufeff/, ''));
else {
  const response = await fetch(RELEASES_API, { headers: { Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(`GitHub: ${response.status}`);
  releases = await response.json();
}
const downloads = selectDownloads(releases);
if (!downloads.installer || !downloads.incremental) throw new Error('Expected installer and incremental release assets');
const snapshot = { verifiedAt: new Date().toISOString(), downloads };
await fs.writeFile(new URL('../docs/release-snapshot.mjs', import.meta.url), `// Verified public GitHub release metadata; no credentials.\nexport default ${JSON.stringify(snapshot, null, 2)};\n`);
console.log(JSON.stringify(downloads, null, 2));
