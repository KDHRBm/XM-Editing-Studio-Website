import test from 'node:test';
import assert from 'node:assert/strict';
import snapshot from '../docs/release-snapshot.mjs';
import { selectDownloads, downloadUrl, compareVersions, installationHint, formatDate } from '../docs/release-core.mjs';

function release(version, kind, date = '2026-10-27T02:06:53Z') {
  const name = kind === 'installer' ? `XM-Editing-Studio-${version}-Windows-x64-Setup.exe` : `XM-Editing-Studio-1.3.0-to-${version}-Incremental-20261027.zip`;
  return { tag_name: `v${version}`, published_at: date, assets: [{ name, state: 'uploaded', browser_download_url: `https://github.com/KDHRBm/XM-Editing-Studio/releases/download/v${version}/${name}`, size: 12345, updated_at: date, digest: 'sha256:' + 'a'.repeat(64) }] };
}
test('installer and incremental files are selected independently, never confuse full update or source ZIP', () => {
  const older = release('1.3.0', 'installer'), next = release('1.3.1', 'installer'), patch = release('1.3.1', 'incremental');
  next.assets.push({ ...patch.assets[0], name: 'XM-Editing-Studio-1.3.1-Full-Update.zip' });
  const result = selectDownloads([older, next, patch]);
  assert.equal(result.installer.version, '1.3.1'); assert.equal(result.incremental.revision, '20261027');
  assert.equal(result.incremental.fromVersion, '1.3.0');
});
test('numeric versions beat publication dates; draft and preview releases are ignored', () => {
  const result = selectDownloads([release('1.3.2', 'installer'), release('1.3.10', 'installer', '2026-10-25T00:00:00Z'), { ...release('2.0.0', 'installer'), draft: true }, { ...release('3.0.0', 'installer'), prerelease: true }]);
  assert.equal(result.installer.version, '1.3.10'); assert.equal(compareVersions('1.3.10','1.3.9'), 1);
});
test('rejects foreign URLs, credential URLs, wrong tags and unfinished assets', () => {
  for (const change of [
    { browser_download_url: 'javascript:alert(1)' },
    { browser_download_url: 'https://github.com.evil.example/a.exe' },
    { browser_download_url: release('1.3.1', 'installer').assets[0].browser_download_url.replace('github.com/', 'github.com/another/') },
    { browser_download_url: release('1.3.1', 'installer').assets[0].browser_download_url.replace('https://', 'https://user@') },
    { browser_download_url: release('1.3.1', 'installer').assets[0].browser_download_url.replace('/v1.3.1/', '/v1.3.0/') },
    { state: 'new' }, { size: -1 }, { updated_at: 'invalid' },
  ]) { const item = release('1.3.1','installer'); Object.assign(item.assets[0], change); assert.equal(selectDownloads([item]).installer,null); }
});
test('network fallback snapshot uses verified real downloads; mirrors cannot change repository', () => {
  assert.equal(snapshot.downloads.incremental.sha, '8108d4c94e1fb2bc9df3e9a06192502b412d769fedc5a981dfa9b1476f8fbfaf');
  const asset = snapshot.downloads.incremental;
  assert.equal(downloadUrl(asset, 'ghfast'), 'https://ghfast.top/' + asset.url);
  assert.equal(downloadUrl(asset, 'unknown'), asset.url);
  assert.throws(() => downloadUrl({ ...asset, url: 'https://example.org/bad.zip' }));
});
test('installation advice reflects newer patches and never asks to downgrade a new installer', () => {
  assert.match(installationHint(snapshot.downloads), /再应用/);
  const next = selectDownloads([release('1.4.0','installer'), release('1.3.1','incremental')]);
  assert.doesNotMatch(installationHint(next), /再应用/);
  assert.equal(formatDate('2026-10-26T20:00:00Z'), '2026.10.27');
});
test('empty and malformed API responses cannot fabricate an asset', () => {
  assert.deepEqual(selectDownloads([]), { installer:null, incremental:null });
  assert.throws(() => selectDownloads({ message:'API rate limit' }));
});
