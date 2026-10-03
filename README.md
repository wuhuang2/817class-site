# 屯留一中817班 班级网站

> Tunliu District No.1 Middle School Class 817 Information Portal

基于 **Hexo** + **Fluid** 构建的纯静态班级网站，部署于 **Cloudflare Pages**。

---

## 特性

- **纯静态** —— 构建产物为纯 HTML/CSS/JS，无需服务端
- **404 页面** —— 自包含的独立 404 页（猫头鹰吉祥物），附「返回主页」按钮
- **响应式** —— 适配手机 / 平板 / 桌面，支持安全区与暗色模式
- **本地搜索** —— Fluid 内置，无需第三方服务
- **零追踪** —— 未启用任何统计与评论插件

---

## 环境要求

| 工具 | 版本 |
| --- | --- |
| Node.js | ≥ 18（推荐 22） |
| 包管理器 | pnpm / npm / yarn 均可 |

---

## 本地开发

```bash
# 安装依赖
pnpm install

# 启动本地预览（默认 http://localhost:4000）
pnpm server

# 构建静态文件到 public/
pnpm build

# 清理缓存与产物
pnpm clean
```

如需指定端口：

```bash
pnpm exec hexo server -p 4321
```

### 测试 404 页面

⚠️ **`hexo server` 无法测试 404 页面。**

`hexo server` 是开发服务器，对未知路径只返回纯文本 `Cannot GET /xxx`（404 状态码），
**不会**渲染 `404.html`。这不是 404 页面的问题，而是 hexo-server 源码中
根本没有 404 回退中间件。

要验证 404，请使用项目自带的静态服务器，它会模拟 Cloudflare Pages / Nginx 的行为：

```bash
pnpm build
node serve-404.js 4400
```

然后访问 <http://localhost:4400/does-not-exist>，应返回 404 状态码并渲染自定义
404 页面（猫头鹰吉祥物 + 「返回主页」按钮）。

也可以直接运行便捷脚本，按提示选择模式：

```powershell
.\start-preview.ps1
```

| 模式 | 端口 | 适用场景 |
| --- | --- | --- |
| Hexo 开发服务器 | 4321 | 日常写作，改文件自动刷新 |
| 静态服务器 | 4400 | 验证 404、检查最终构建产物 |

> **本机提示**：若系统未安装 Node.js，请使用 DSH 内置工具链的完整路径：
> `& "C:\Users\lenovo\AppData\Roaming\dsh-desktop\harness\.desktop-bin\pnpm.cmd" exec hexo server -p 4321`

---

## 目录结构

```
.
├── _config.yml            # Hexo 站点配置（标题、URL、skip_render 等）
├── _config.fluid.yml      # Fluid 主题配置（导航、页脚、banner 等）
├── wrangler.toml          # Cloudflare Pages 部署配置
├── scaffolds/             # 新文章模板
├── source/
│   ├── 404.html           # 404 页面（skip_render，完全独立不套主题）
│   ├── _headers           # Cloudflare Pages 响应头（构建后复制到 public/）
│   ├── css/custom.css     # 自定义样式覆盖
│   ├── img/               # 图标、头像、banner
│   ├── about/index.md     # 关于页
│   └── _posts/            # 文章
├── scripts/
│   └── cloudflare-pages.js # 构建后复制 _headers 的钩子
└── public/                # 构建产物（不提交到 git）
```

---

## 写作

新建文章：

```bash
pnpm exec hexo new "文章标题"
```

或直接在 `source/_posts/` 下新建 `.md` 文件：

```markdown
---
title: 文章标题
date: 2026-01-01 09:00:00
tags:
  - 标签A
categories:
  - 分类A
---

正文内容……
```

---

## 404 页面

`source/404.html` 是一个**完全自包含**的静态页（内联 CSS + 内联 SVG 猫头鹰），
通过 `_config.yml` 的 `skip_render` 让它绕过主题渲染，原样输出到 `public/404.html`。

**关键点**：Fluid 主题自带 404 生成器，但它的判断逻辑是

```js
if (!fs.existsSync(path.join(hexo.source_dir, '404.html'))) { ... }
```

即只要 `source/404.html` 存在，主题就**不会**生成自己的 404，我们的页面自动生效。

Cloudflare Pages 会自动将根目录的 `404.html` 用作自定义错误页，无需额外配置。

---

## 部署到 Cloudflare Pages

### 方式一：Git 集成（推荐）

1. 推送仓库到 GitHub
2. Cloudflare Dashboard → **Workers & Pages** → Create → **Pages** → Connect to Git
3. 选择仓库，构建配置填：

   | 项 | 值 |
   | --- | --- |
   | Framework preset | None |
   | 构建命令 | `npm run build` |
   | 输出目录 | `public` |
   | Node 版本 | 环境变量 `NODE_VERSION` = `22` |

4. 部署完成后在 **Custom domains** 绑定域名

> ⚠️ **必须选择 "Pages" 而不是 "Workers"。**
> 若误建成 Workers 项目，Cloudflare 会执行 `wrangler deploy` 并寻找 `./dist`，
> 而本项目输出在 `public/`，构建会以
> `Failed: error occurred while running deploy command` 失败。
> 此时应删除该 Workers 项目，重新创建 Pages 项目。
>
> 另外，本项目**不使用也不需要 `wrangler.toml`** —— Pages 项目的构建配置
> 在控制台里填写，响应头由 `source/_headers` 提供。

### 方式二：Wrangler CLI

```bash
pnpm build
npx wrangler pages deploy public --project-name=817class-site
```

### 响应头与缓存

`source/_headers` 由 `scripts/cloudflare-pages.js` 在构建后复制到 `public/_headers`，
Cloudflare Pages 会自动读取。

> **为什么需要这个脚本**：Hexo 会忽略 `source/` 下划线开头的文件（视为特殊文件
> 而非静态资源），所以 `_headers` 不会自动出现在 `public/` 中，必须用
> `after_generate` 钩子手动复制。

### 404 处理

Cloudflare Pages 自动将输出目录根部的 `404.html` 作为自定义错误页，无需配置。

---

## 自定义指南

| 想改什么 | 改哪里 |
| --- | --- |
| 站点标题、描述、作者 | `_config.yml` |
| 导航菜单 | `_config.fluid.yml` → `navbar.menu` |
| 页脚版权信息 | `_config.fluid.yml` → `footer.content` |
| 首页 banner 图 | 替换 `source/img/default.webp` |
| 站点图标 / 头像 | 替换 `source/img/favicon.png` / `avatar.png` |
| 细节样式 | `source/css/custom.css` |
| 404 页面 | `source/404.html` |

> **注意**：`_config.fluid.yml` 中的 `banner_img` 路径需与 `source/img/` 下的
> 文件名保持一致。本项目使用 WebP 格式（渐变图压缩率极高）。

---

## 许可协议

除基于开源主题及第三方资源的部分外，本站原创视觉设计、页面布局与汇编编排保留所有权利。

本站发布的学生文章，除文章内另有说明外，著作权归各文章作者所有，并采用
[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh) 协议授权。
转载请注明作者与来源，不得用于商业目的，改编需以相同协议共享。

Powered by Cloudflare Pages | Theme: Hexo ♡ Fluid
