export const REPO = 'KDHRBm/XM-Editing-Studio';
export const REPO_URL = `https://github.com/${REPO}`;
export const RELEASES_API = `https://api.github.com/repos/${REPO}/releases?per_page=30`;
export const MIRRORS = Object.freeze({
  official: { label: 'GitHub 官方源', prefix: '' },
  ghfast: { label: 'GHFast · 第三方镜像', prefix: 'https://ghfast.top/' },
  ghproxy: { label: 'GHProxy · 第三方镜像', prefix: 'https://ghproxy.net/' },
});

const VERSION = /^v?(\d+)\.(\d+)\.(\d+)$/;
const INSTALLER = /^XM-Editing-Studio-(\d+\.\d+\.\d+)-Windows-x64-Setup\.exe$/;
const INCREMENTAL = /^XM-Editing-Studio-(\d+\.\d+\.\d+)-to-(\d+\.\d+\.\d+)-Incremental-(\d{8})\.zip$/;
const SMALL_UPDATE = /^XM-Editing-Studio-(\d+\.\d+\.\d+)-Small-Update\.zip$/;

export function officialAsset(url, name) {
  try {
    const parsed = new URL(url);
    const prefix = `/${REPO}/releases/download/`;
    if (parsed.protocol !== 'https:' || parsed.hostname !== 'github.com' || parsed.username || parsed.password || parsed.port || parsed.search || parsed.hash || !parsed.pathname.startsWith(prefix)) return false;
    const parts = parsed.pathname.slice(prefix.length).split('/');
    return parts.length === 2 && VERSION.test(decodeURIComponent(parts[0])) && decodeURIComponent(parts[1]) === name;
  } catch { return false; }
}

export function compareVersions(a, b) {
  const aa = a.replace(/^v/, '').split('.').map(Number), bb = b.replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < 3; i++) { const order = aa[i] - bb[i]; if (order) return order; }
  return 0;
}

export function selectDownloads(releases) {
  if (!Array.isArray(releases)) throw new Error('版本数据格式不正确');
  const candidates = { installer: [], incremental: [] };
  for (const release of releases) {
    if (!release || release.draft || release.prerelease || !VERSION.test(release.tag_name || '') || !Array.isArray(release.assets)) continue;
    const version = release.tag_name.replace(/^v/, '');
    for (const asset of release.assets) {
      if (!asset || typeof asset.name !== 'string' || (asset.state && asset.state !== 'uploaded') || !Number.isSafeInteger(asset.size) || asset.size <= 0 || !officialAsset(asset.browser_download_url, asset.name)) continue;
      const full = asset.name.match(INSTALLER), patch = asset.name.match(INCREMENTAL), small = asset.name.match(SMALL_UPDATE);
      const type = full ? 'installer' : patch || small ? 'incremental' : null;
      if (!type || (full ? full[1] : patch ? patch[2] : small[1]) !== version) continue;
      const urlTag = decodeURIComponent(new URL(asset.browser_download_url).pathname.split('/').at(-2));
      if (urlTag !== release.tag_name) continue;
      const date = asset.updated_at || release.published_at;
      if (!Number.isFinite(Date.parse(date))) continue;
      const sha = /^sha256:[a-f0-9]{64}$/i.test(asset.digest || '') ? asset.digest.slice(7).toLowerCase() : '';
      candidates[type].push({ type, version, fromVersion: patch?.[1] || '', revision: patch?.[3] || '', name: asset.name, url: asset.browser_download_url, size: asset.size, date, sha, releaseUrl: `${REPO_URL}/releases/tag/${encodeURIComponent(release.tag_name)}` });
    }
  }
  const newest = items => items.sort((a, b) => compareVersions(b.version, a.version) || b.revision.localeCompare(a.revision) || Date.parse(b.date) - Date.parse(a.date))[0] || null;
  return { installer: newest(candidates.installer), incremental: newest(candidates.incremental) };
}

export function downloadUrl(asset, mirror = 'official') {
  if (!asset || !officialAsset(asset.url, asset.name)) throw new Error('下载地址不正确');
  return (MIRRORS[mirror] || MIRRORS.official).prefix + asset.url;
}
export const formatSize = bytes => `${(bytes / 1000000).toFixed(1)} MB`;
export const formatDate = value => new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value)).replaceAll('/', '.');
export const incrementalHint = asset => asset?.fromVersion ? `适用于原版 ${asset.fromVersion}${asset.fromVersion === asset.version ? '' : ` 至 ${asset.version}`}。` : '适用版本请查看包内更新说明。';

export function installationHint(downloads) {
  const { installer, incremental } = downloads;
  if (installer && incremental && (compareVersions(incremental.version, installer.version) > 0 || compareVersions(incremental.version, installer.version) === 0 && Date.parse(incremental.date) > Date.parse(installer.date))) return `首次安装：先安装 v${installer.version}，再应用右侧增量包，获得最新修复。`;
  return installer ? `首次安装：下载 v${installer.version} 完整安装包，按引导完成安装。` : '请选择下方适合现有版本的更新包。';
}
