import snapshot from './release-snapshot.mjs';
import { RELEASES_API, selectDownloads, downloadUrl, formatDate, formatSize, installationHint } from './release-core.mjs';

const $ = selector => document.querySelector(selector);
function render(downloads) {
  for (const type of ['installer', 'incremental']) {
    const asset = downloads[type];
    if (!asset) continue;
    $(`#${type}-version`).textContent = type === 'installer' ? `v${asset.version}` : `更新至 v${asset.version}`;
    $(`#${type}-date`).textContent = formatDate(asset.date);
    $(`#${type}-size`).textContent = `${formatSize(asset.size)} · ${type === 'installer' ? 'EXE' : 'ZIP'}`;
    $(`#${type}-download`).href = downloadUrl(asset);
  }
  const hint = installationHint(downloads);
  $('#install-hint').textContent = hint.includes('再应用') ? '安装后再应用增量包，获得最新修复。' : '按安装器引导完成安装。';
  if (downloads.incremental) $('#update-description').textContent = `适用于已有 ${downloads.incremental.fromVersion} 或 ${downloads.incremental.version} 的用户。`;
}

render(snapshot.downloads);
// Keep the two verified direct links available while checking for newer assets.
async function refresh() {
  const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(RELEASES_API, { headers: { Accept: 'application/vnd.github+json' }, signal: controller.signal });
    if (!response.ok) return;
    const next = selectDownloads(await response.json());
    if (next.installer && next.incremental) render(next);
  } catch { /* The verified download links remain usable if GitHub is unavailable. */ }
  finally { clearTimeout(timeout); }
}
refresh();
