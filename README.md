# XM剪辑台 · 发布与更新中心

为 [XM剪辑台](https://github.com/KDHRBm/XM-Editing-Studio) 提供完整安装包、累计增量更新、功能介绍、版本记录和使用指南。

网站：https://kdhrbm.github.io/XM-Editing-Studio-Website/

## 功能

- 完整安装包与累计增量包分开展示版本、修订日期、大小和 SHA-256。
- 从固定的 `KDHRBm/XM-Editing-Studio` GitHub Releases API 读取公开附件，分别识别最新安装包与增量包；不混用 Source / Full-Update ZIP。
- GitHub API 超时、网络失败或限流时使用经过核验的本地版本快照，明确提示状态并允许重试。
- 默认使用 GitHub 官方源，可手动切换 GHFast / GHProxy 第三方镜像。不会宣称节点速度或可用性有保证。
- 安装、更新、回退、软件操作说明和校验弹窗；移动端布局、键盘焦点、减弱动态效果支持。
- “发布管理”进入 GitHub 官方 Releases 页面，由 GitHub 完成账号验证。网站不收集账号、密码、API 密钥或用户文件。

## 本地开发

使用 Node.js 22 或以上，无第三方运行依赖：

```bash
npm start
npm test
```

默认预览地址为 `http://127.0.0.1:8788`，可通过环境变量 `PORT` 更改。

## 发布与维护

GitHub Pages 设置为 **Deploy from a branch → main → /docs**。所有站点资源均使用相对路径，可直接部署在项目子路径下。Cloudflare Pages 也可选择 `docs` 目录、留空构建命令部署。

程序附件仍保存在软件仓库的 Releases，不将安装器或增量块放进网站仓库。上传新版本后，页面会在访问时获取最新公开版本。识别的文件名约定：

- 完整安装：`XM-Editing-Studio-1.3.1-Windows-x64-Setup.exe`
- 累计增量：`XM-Editing-Studio-1.3.0-to-1.3.1-Incremental-20261027.zip`

不同版本替换对应版本号和日期即可。为网络失败场景更新本地快照：

```bash
npm run sync
```

同步后提交 `docs/release-snapshot.mjs`。新增功能说明和更新历史编辑 `docs/index.html` / `docs/app.mjs`。页面实时读取版本数据，不会自动生成未审核的功能说明。

## 设计参考

按用户指定参考 [Kirota233/distributinon-site](https://github.com/Kirota233/distributinon-site) 与 [剪辑组实用工具](http://distribute.taiki.me/) 的网格卡片、白底黑线和红色强调形式，独立实现 XM 品牌页面。没有复制该站的 Cloudflare 管理密钥、上传后端或用户数据。

网站源码采用 MIT 许可证。软件和第三方组件的许可仍以各自仓库为准。
