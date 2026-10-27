# XM剪辑台下载

网站：https://kdhrbm.github.io/XM-Editing-Studio-Website/

页面仅保留两个下载卡片：**完整安装包**和**累计增量更新包**。显示版本、日期、大小及一句使用提示，下载直连 [软件仓库 GitHub Releases](https://github.com/KDHRBm/XM-Editing-Studio/releases)。

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

- `XM-Editing-Studio-1.3.1-Windows-x64-Setup.exe`
- `XM-Editing-Studio-1.3.0-to-1.3.1-Incremental-20261027.zip`

上传新版本后，页面访问时会自动读取。执行 `npm run sync` 可更新本地快照，提交 `docs/release-snapshot.mjs` 即可；同时更新 `docs/index.html` 中供无 JavaScript 使用的链接。

界面参考 [Kirota233/distributinon-site](https://github.com/Kirota233/distributinon-site) 的白底黑线与红色卡片风格，独立实现。网站源码采用 MIT 许可证。
