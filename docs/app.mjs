import snapshot from './release-snapshot.mjs';
import { RELEASES_API, MIRRORS, REPO_URL, selectDownloads, downloadUrl, formatDate, formatSize, installationHint } from './release-core.mjs';

const $ = selector => document.querySelector(selector);
let downloads = snapshot.downloads, mirror = 'official', checking = false, synced = false, toastTimer;
const dialog = $('#info-dialog');
try { const saved = localStorage.getItem('xm-download-mirror'); if (MIRRORS[saved]) mirror = saved; } catch { }
$('#mirror-select').value = mirror;
function notify(message) {
  $('#toast').textContent = message; $('#toast').classList.add('visible');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3500);
}
function element(tag, text, className) {
  const item = document.createElement(tag); if (text) item.textContent = text; if (className) item.className = className; return item;
}
function render() {
  for (const type of ['installer', 'incremental']) {
    const asset = downloads[type], card = $(`#${type}-card`);
    card.hidden = !asset; if (!asset) continue;
    $(`#${type}-version`).textContent = type === 'installer' ? `v${asset.version}` : `${asset.fromVersion} / ${asset.version} → ${asset.version}`;
    $(`#${type}-date`).textContent = formatDate(asset.date);
    const size = $(`#${type}-size`); size.replaceChildren(document.createTextNode(`${formatSize(asset.size)} `), element('span', `/ ${type === 'installer' ? 'EXE' : 'ZIP'}`));
    const link = $(`#${type}-download`); link.href = downloadUrl(asset, mirror); link.title = asset.name;
    $(`[data-checksum="${type}"]`).disabled = !asset.sha;
    $(`[data-checksum="${type}"]`).title = asset.sha ? '查看 GitHub 文件校验值' : '此附件尚未提供 SHA-256';
  }
  $('#install-hint').textContent = installationHint(downloads);
  const patch = downloads.incremental;
  $('#update-hint').textContent = patch?.revision === '20261027' && patch.version === '1.3.1' ? '含 DeepSeek 改进、称谓句点与横线保留修复。' : patch ? `修订 ${patch.revision} · 更新前自动备份。` : '';
  const firstFAQ = $('.faq-list details p');
  firstFAQ.textContent = `${installationHint(downloads).replace('首次安装：', '').replace('右侧', '本页')} 新电脑无需额外安装 Node.js 或 Python。`;
  if (patch) $('.faq-list details:nth-child(2) summary').firstChild.textContent = `已经装了 ${patch.fromVersion} 或 ${patch.version}，如何更新？`;
  $('#incremental-card .package-description').replaceChildren(document.createTextNode(patch ? `已有 ${patch.fromVersion} 或 ${patch.version}，直接更新。` : ''), document.createElement('br'), document.createTextNode('此前更新一次补齐，保留你的设置、历史和素材。'));
  $('#mirror-note').textContent = mirror === 'official' ? '默认连接 GitHub；访问较慢时可手动切换镜像。' : '当前使用第三方镜像；若下载失败请切回官方源，并核对 SHA-256。';
}

async function refresh() {
  if (checking) return;
  checking = true; $('#refresh-releases').disabled = true; $('#sync-text').textContent = '正在检查 GitHub 版本…';
  const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(RELEASES_API, { headers: { Accept: 'application/vnd.github+json' }, signal: controller.signal });
    if (!response.ok) throw new Error(`GitHub ${response.status}`);
    const next = selectDownloads(await response.json());
    if (!next.installer && !next.incremental) throw new Error('未找到下载附件');
    downloads = next; synced = true; render(); $('#sync-text').textContent = '已同步 GitHub Releases';
  } catch {
    $('#sync-text').textContent = synced ? '暂无法同步 · 保留上次版本信息' : `暂无法同步 · 显示 ${formatDate(snapshot.verifiedAt)} 已验证版本`;
  } finally { clearTimeout(timeout); checking = false; $('#refresh-releases').disabled = false; }
}
$('#refresh-releases').addEventListener('click', refresh);
$('#mirror-select').addEventListener('change', event => {
  mirror = MIRRORS[event.target.value] ? event.target.value : 'official';
  try { localStorage.setItem('xm-download-mirror', mirror); } catch { }
  render();
});

function openDialog(title, category, contents) {
  $('#dialog-title').textContent = title; $('#dialog-category').textContent = category;
  $('#dialog-content').replaceChildren(...contents);
  dialog.showModal(); document.body.style.overflow = 'hidden';
}
$('#close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { const box = dialog.getBoundingClientRect(); if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) dialog.close(); });
dialog.addEventListener('close', () => { document.body.style.overflow = ''; });
function list(items) { const ol = element('ol'); for (const item of items) ol.append(element('li', item)); return ol; }
function externalLink(label, href) { const a = element('a', label); a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer'; return a; }

const guides = {
  install: () => ({ title: '完整安装 · 从这里开始', contents: [
    list(['下载完整安装包，保存到本机；首次安装选择一个专用空文件夹。', '按安装器引导完成安装，打开 XM剪辑台。原程序文件名为“小马剪辑台.exe”，现有快捷方式仍可使用。', installationHint(downloads), '换电脑后重新连接本地音乐、草稿和自定义文件夹，并登录自己的 AI 网页账号。']),
    element('p', '面向 Windows 10 / 11 x64，运行组件随软件提供。更早的 1.1.x / 1.2.x 版本请使用完整安装包，不要直接使用本页增量包。'),
    externalLink('查看 GitHub 完整发布说明 ↗', downloads.installer?.releaseUrl || `${REPO_URL}/releases`),
  ] }),
  update: () => ({ title: '增量更新与回退', contents: [
    element('p', downloads.incremental ? `适用版本：已验证的 ${downloads.incremental.fromVersion} / ${downloads.incremental.version} 及对应支持的修订版。更新器会根据文件校验值识别，不会强制覆盖无法识别的修改版。` : '请在 GitHub 发布页确认适用版本。'),
    list(['保存当前任务，完全退出剪辑台。建议在程序盘预留 2 GB 空间。', '将 ZIP 完整解压到软件目录之外，保留所有 patches、blocks 和 manifest 文件。', '运行包内的 XM-Update 增量更新器，选择包含“小马剪辑台.exe”和 resources 的原软件目录。', '等待校验、备份与更新完成，再通过原快捷方式启动。配置、历史、音乐和素材保留。']),
    element('p', '需要恢复时，先退出软件，运行更新包中的 Restore-Previous.cmd，选择软件目录 .xiaoma-update-backups 内本次生成的 delta131 备份文件夹。不要手动混搭 EXE 和 app.asar。'),
    externalLink('打开更新发布页 ↗', downloads.incremental?.releaseUrl || `${REPO_URL}/releases`),
  ] }),
  changes: () => ({ title: '1.3.1 · 10 月 27 日增量修订', contents: [
    list(['累计包含 1.3.0 发布后的全部 1.3.1 功能，无需逐个安装中间补丁。', 'DeepSeek / 豆包回答读取排除思考区和输入模板，兼容嵌套结果与尾随逗号，保留多集分析结果。', '保留 Mr.、Ms.、Dr.、Sra. 等称谓句点，断句时不拆开称谓与人名。', '兼容复制时 Mr. 转为 Mr․；整理显示与 TXT 使用标准英文句点。', '台词首尾横线不再删除，You— 整理为 You -。工作空间与跑量剪辑流同时生效。']),
    element('p', '217 项应用检查、七种交付来源升级与回退及 11 类异常处理检查通过。已完成本机启动验证；未进行 Windows 10 / 11 双机及真实剪映字幕生成验证。'),
    externalLink('下载详细更新说明 ↗', `${REPO_URL}/releases/download/v1.3.1/Incremental-Guide-1.3.1-20261027.md`),
  ] }),
  workflow: () => ({ title: '从剧本到剪辑素材', contents: [
    list(['在“跑量剪辑流”粘贴多集剧本，用“第1集”“第2集”或 Episode 1 等标题分隔；单集处理可使用“工作空间”。', '选择字幕语言。英文与西语按 [EN] / [ES] 标记提取角色冒号后的内容；中文可使用“角色：台词”。', '连接自己的本地音乐文件夹。默认 DeepSeek 网页分析，也可更换为配置好的 Gemini；批量模式联合分析多集，可开启每集多段音乐推荐。', '打开分集任务卡查看字幕与推荐，试听、选用或标记音乐；再次点击可取消标记，最近使用记录会参与后续避重。', '开启标点保留后复制台词到剪映；将已有本地音乐拖入剪映，继续剪辑。需要原创音乐时，在工作空间或音乐页使用 Suno。']),
    element('p', 'Suno 需要有效 API 和额度，可联系小马获取。官网 AI 的账号、可用模型和额度由对应服务方提供。'),
    externalLink('查看软件仓库说明 ↗', REPO_URL),
  ] }),
};
document.querySelectorAll('[data-guide]').forEach(button => button.addEventListener('click', () => { const guide = guides[button.dataset.guide](); openDialog(guide.title, 'XM / GUIDE', guide.contents); }));
document.querySelectorAll('[data-checksum]').forEach(button => button.addEventListener('click', () => {
  const asset = downloads[button.dataset.checksum]; if (!asset?.sha) return;
  const input = element('input', '', 'hash-field'); input.value = asset.sha; input.readOnly = true; input.setAttribute('aria-label', 'SHA-256 校验值');
  const copy = element('button', '复制校验值', 'copy-hash'); copy.type = 'button';
  copy.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(asset.sha); notify('SHA-256 校验值已复制'); copy.textContent = '已复制'; }
    catch { input.focus(); input.select(); notify('已选中校验值，请按 Ctrl+C 复制'); }
  });
  openDialog('核对下载文件', 'XM / SHA-256', [element('p', asset.name, 'checksum-name'), element('p', '在 PowerShell 中运行 Get-FileHash "文件路径" -Algorithm SHA256，将结果与下方校验值对比。'), input, copy, element('p', '校验值来自 GitHub 发布附件，使用镜像下载时也应得到同一结果。')]);
}));
render(); refresh();
