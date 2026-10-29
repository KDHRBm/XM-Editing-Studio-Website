import fs from 'node:fs/promises';
import { RELEASES_API, selectDownloads, formatDate, formatSize, installationHint, incrementalHint } from '../docs/release-core.mjs';
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
const htmlFile=new URL('../docs/index.html',import.meta.url);
let html=await fs.readFile(htmlFile,'utf8');
const escape=value=>value.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
function text(id,value){html=html.replace(new RegExp(`(<[^>]+id="${id}"[^>]*>)[^<]*(</)`),(_,start,end)=>start+escape(value)+end);}
for(const type of ['installer','incremental']) {
  const asset=downloads[type];
  text(type+'-version',(type==='installer'?'v':'更新至 v')+asset.version);
  text(type+'-size',formatSize(asset.size)+(type==='installer'?' · EXE':' · ZIP'));
  text(type+'-date',formatDate(asset.date));
  html=html.replace(new RegExp(`(id="${type}-download" href=")[^"]*(")`),(_,start,end)=>start+escape(asset.url)+end);
}
text('install-hint',installationHint(downloads).includes('再应用')?'安装后再应用增量包，获得最新修复。':'按安装器引导完成安装。');
text('update-description',incrementalHint(downloads.incremental));
await fs.writeFile(htmlFile,html);
console.log(JSON.stringify(downloads, null, 2));
