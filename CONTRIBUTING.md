# 贡献指南

感谢愿意帮这个项目变得更好。这个仓库刻意保持**零依赖、无构建步骤**，改动请尽量沿用现有做法。

## 环境

- Node.js 22（见 `.nvmrc`），只用于跑测试和本地静态服务。
- 不需要 `npm install`：项目没有运行时依赖，也没有构建产物。

```bash
npm test       # node --test tests/*.test.js
npm run dev    # python3 -m http.server 5173
```

也可以直接用任意静态服务器打开 `index.html`。Service Worker 只在 `https://` 或 `localhost` 下注册。

## 目录约定

| 路径 | 职责 |
| --- | --- |
| `src/game/data.js` | 建筑、升级、Boss、成就、商店的数据表 |
| `src/game/balance.js` | 纯函数数值层，不碰 DOM |
| `src/game/state.js` | 存档结构、迁移、导入导出 |
| `src/game/engine.js` | 购买、攻击、转生、成就判定、tick |
| `src/ui/views.js` | 五个页面的 DOM 构建与增量刷新 |
| `src/ui/icons.js` | 自绘 SVG 图标集，新增图标加在这里 |
| `src/ui/theme.js` | 主题偏好与系统深浅色解析 |
| `assets/app.css` | 全部样式，深/浅两套变量 |
| `tests/*.test.js` | `node:test` 用例，纯逻辑优先 |

## 代码风格

- 浏览器原生 ES module，不引入框架、打包器或运行时依赖。
- 数值计算放 `balance.js`，保持纯函数，方便写测试。
- 视图只建一次 DOM，之后按帧改 `textContent` / `class`，不要整块 `innerHTML` 重建。
- 图标统一走 `icon(name)` 或 `data-icon` 占位，不要再写 emoji 或内联 SVG。
- 文案用中文，面向手机小屏：短句、口语、不堆术语。
- 移动优先，所有可点区域不小于 44×44，360px 宽不允许横向滚动。

## 存档兼容

- `src/game/state.js` 里的 `VERSION` 和 `normalize()` 负责旧档迁移。
- 改动存档字段时必须：升级 `VERSION`、补迁移逻辑、给 `tests/state.test.js` 加用例。
- 不允许让旧存档打开后白屏或数值变成 `NaN`。

## 提交与 PR

- 提交信息用 Conventional Commits：`feat:`、`fix:`、`docs:`、`refactor:`、`chore:`。
- 一个 PR 只做一件事；顺手修的 bug 可以在描述里说明。
- 提交前至少跑一遍 `npm test`，涉及界面的改动请附 390×844 和 360×640 的截图（深/浅各一张）。
- PR 描述请写清楚：改了什么、为什么改、怎么验证的。

## 数据表改动

新增建筑 / Boss / 成就时，除了 `data.js`，还要检查：

1. 图标名是否存在于 `src/ui/icons.js`；
2. 回本时间是否落在合理区间（`tests/balance.test.js` 有约束）；
3. 解锁门槛是否和前后项衔接，避免出现长得看不见的空档。
