# 安全策略

## 支持范围

只维护最新发布版本（当前 3.3.x）。旧版本的问题请在最新版上复现后再报告。

## 报告问题

请**不要**用公开 issue 报告安全问题，改用 GitHub 的私密渠道：

<https://github.com/shushuzn/idle-empire/security/advisories/new>

报告里尽量包含：

- 受影响的版本或 commit；
- 复现步骤与浏览器/系统；
- 影响范围（例如：能否读取他人数据、能否执行脚本）。

一般会在 7 天内回复。修复发布后会在 Security Advisory 里致谢。

## 这个项目的攻击面

游戏是纯静态页面，没有后端、没有账号体系、不收集数据。已知的边界：

- **存档只在本机**：保存在 `localStorage` 的 `idle_empire_save`，不上传任何服务器。
- **导入存档**：用户粘贴的 JSON 会经过 `normalize()` 逐字段校验和夹取，非法值回退默认值。
- **Service Worker**：只缓存同源 GET 请求，不代理第三方域名。
- **无动态 HTML 注入**：图标来自静态字符串表，文本走 `textContent`，不使用 `eval`。

如果你发现可以绕过以上约束（例如存档导入造成 XSS、SW 缓存跨源内容），那就是有效问题。
