# XM剪辑台下载

网站：https://kdhrbm.github.io/XM-Editing-Studio-Website/

页面仅保留两个下载卡片：**全量包**和**增量包**。完整安装包统一进入全量包栏，增量更新和小更新包统一进入增量包栏，两栏独立选择各自最新版本。显示版本、日期、大小及一句使用提示，下载直连 [软件仓库 GitHub Releases](https://github.com/KDHRBm/XM-Editing-Studio/releases)。

页面在后台读取公开版本信息；网络失败时保留已验证的下载快照。未开启 JavaScript 时，HTML 中的两个直接下载链接仍可用。

## 本地运行

Node.js 22 或以上，无第三方运行依赖：

```bash
npm start
npm test
```

本地地址 `http://127.0.0.1:8788`。GitHub Pages 使用 `main` 分支的 `/docs` 目录部署。

## 更新下载

在软件仓库发布附件，命名约定：

- 全量包：`XM-Editing-Studio-1.4.2-Windows-x64-Setup.exe`
- 增量包：`XM-Editing-Studio-1.4.2-to-1.4.3-Incremental-20261029.zip`（推荐，名称包含最低适用版本）
- 小更新包：`XM-Editing-Studio-1.4.3-Small-Update.zip`（进入增量栏，适用版本提示查看包内说明）

上传新版本后，页面访问时会自动读取。执行 `npm run sync` 可同步更新 `docs/release-snapshot.mjs` 和 `docs/index.html` 中的离线快照与无 JavaScript 下载链接，提交后由 GitHub Pages 部署。不得把增量 ZIP 放进全量包栏，也不得用增量版本号改写完整安装包版本。

界面参考 [Kirota233/distributinon-site](https://github.com/Kirota233/distributinon-site) 的白底黑线与红色卡片风格，独立实现。网站源码采用 MIT 许可证。
