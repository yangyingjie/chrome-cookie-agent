# Chrome Cookie Agent (Cookie & User-Agent Switcher Pro)

<p align="center">
  <img src="icons/icon128.png" alt="Logo" width="96" height="96" />
</p>

<p align="center">
  <strong>一款基于 Chrome Manifest V3 的高权限 Cookie 导出、多维 User-Agent 切换与 WebRTC IP 防泄漏隐私保护插件。</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Manifest-V3-blue.svg" alt="Manifest V3" />
  <img src="https://img.shields.io/badge/Version-1.3.2-green.svg" alt="Version" />
  <img src="https://img.shields.io/badge/License-MIT-orange.svg" alt="License" />
  <img src="https://img.shields.io/badge/Platform-Chrome%20%7C%20Edge%20%7C%20Brave-lightgrey.svg" alt="Platform" />
</p>

---

## 🌟 核心特性

### 1. 🍪 原生高权限 Cookie 导出 (Cookie Exporter)
- **突破 JS 限制**：采用 `chrome.cookies` 原生 API，完整读取并导出 `HttpOnly`、`Secure`、`SameSite` 等受限 Cookie。
- **多格式一键导出**：
  - **Header 格式**：标准 `User-Agent` 与 `Cookie` 拼接格式，直接贴入抓包或调试工具。
  - **Python Requests**：开箱即用的 Python 代码片段（含请求头与字典化 Cookies）。
  - **cURL 命令**：单行包含完整 UA 与 Cookie 的终端请求命令。
  - **JSON 格式**：全字段元数据（Domain, Path, Expires, HttpOnly 等），兼容 Playwright / Puppeteer / EditThisCookie。
  - **Netscape / cookies.txt**：标准 Netscape 格式，兼容 `wget`、`yt-dlp`、`aria2`、`curl -b`。
- **便捷操作**：支持一键复制到剪贴板与一键下载保存为文本文件。

### 2. 🎭 双层 User-Agent 伪装与 Client Hints 剥离
- **细粒度作用域**：
  - **站点级规则 (Site-Specific)**：依据域名特异度自动匹配，支持多级子域名与 `www` 互转，不影响其他标签页。
  - **全局规则 (Global)**：一键对所有网页生效。
- **网络层动态修改**：使用 `declarativeNetRequest` 动态规则修改请求头，同时自动移除 `sec-ch-ua`、`sec-ch-ua-mobile`、`sec-ch-ua-platform` 等客户端指纹头，防止网站通过 Client Hints 识破。
- **DOM / JS 环境伪装**：通过 Web Accessible Resource 主环境安全注入（`inject.js`），无缝重写 `navigator.userAgent`、`navigator.appVersion`、`navigator.platform` 并置空 `navigator.userAgentData`，完美绕过严格 CSP (Content Security Policy) 拦截。
- **内置丰富预设**：涵盖 iOS (iPhone/iPad)、Android (Pixel/Samsung)、微信内置浏览器 (WeChat iOS/Android)、macOS (Safari/Chrome)、Windows (Edge/Firefox)、Linux 以及搜索引擎爬虫 (Googlebot/Baiduspider/Bingbot)，亦支持任意自定义输入。

### 3. 🛡️ WebRTC IP 防泄漏与隐私控制 (WebRTC Privacy)
- 提供 5 档 WebRTC 路由与 API 拦截策略：
  1. **最高防泄漏模式 (`disable_non_proxied_udp`)**：强制所有 WebRTC 流量走代理通道，防止真实公网 IP 绕过代理发生泄露（代理/科学上网环境必备）。
  2. **仅公网模式 (`default_public_interface_only`)**：向网页隐藏本地局域网私有 IP（如 `192.168.x.x`）。
  3. **完全禁用模式 (`block_api`)**：在网页 JS 环境中彻底拦截并屏蔽 `RTCPeerConnection` 与 `getUserMedia` API。
  4. **标准路由模式 (`default_public_and_private_interfaces`)**：允许公网与内网默认接口。
  5. **原生默认模式 (`default`)**：恢复浏览器默认网络绑定策略。

### 4. ⚡ 极简架构与极致体验
- **本地纯净**：零外部依赖，不收集任何用户隐私数据，所有规则均保存在浏览器本地 `chrome.storage.local`。
- **护眼 UI**：经典清爽的护眼豆沙绿配色，功能分区紧凑直观。
- **规则中心**：内置规则管理面板，支持实时查看、单条删除与一键清空所有站点规则。

---

## 📦 安装方法

### 方式一：加载已解压的扩展程序（开发者模式）

1. 克隆或下载本项目代码到本地：
   ```bash
   git clone https://github.com/yangyingjie/chrome-cookie-agent.git
   ```
2. 打开基于 Chromium 内核的浏览器（Chrome / Edge / Brave / 360极速等），在地址栏访问：
   - **Chrome**: `chrome://extensions/`
   - **Edge**: `edge://extensions/`
3. 开启右上角的 **「开发者模式 (Developer Mode)」**。
4. 点击 **「加载已解压的扩展程序 (Load unpacked)」**。
5. 选择包含 `manifest.json` 的项目目录（`chrome_extension` 文件夹）即可完成安装。

---

## 🚀 使用指南

### 1. 导出当前网站 Cookie
1. 打开目标网页并完成登录。
2. 点击浏览器工具栏中的插件图标打开控制面板。
3. 在底部的导出面板中，切换所需的格式选项卡（`Header` / `Python` / `cURL` / `JSON` / `Netscape`）。
4. 点击 **「📋 一键复制」** 或 **「💾 下载文件」** 即可。

### 2. 切换 User-Agent
1. 打开插件面板，选择作用域：
   - **当前网站专属**：仅对当前域名及其子域名生效。
   - **全局生效**：对所有打开的网站生效。
2. 从下拉列表选择内置预设（如 `iPhone 15`、`微信内嵌浏览器` 等），或在输入框中粘贴自定义 UA。
3. 点击 **「💾 应用 UA」**（勾选“应用后自动刷新页面”可即时查看效果）。
4. 如需恢复默认，点击 **「🔄 恢复默认」**。
5. 点击 **「⚙️ 管理规则」** 可查看和清理已保存的站点专属规则。

### 3. 配置 WebRTC 防 IP 泄露
1. 在插件面板的 **WebRTC 策略与防泄露控制** 区域。
2. 下拉选择所需模式（推荐在挂代理时选择 `🛡️ 最高防泄漏模式` 或 `🚫 完全禁用模式`）。
3. 点击 **「💾 应用策略」** 即可立即生效。

---

## 📂 项目结构

```text
chrome_extension/
├── manifest.json         # Manifest V3 配置文件与权限声明
├── background.js        # Service Worker: declarativeNetRequest 动态规则与 WebRTC 策略管理
├── content_script.js    # 隔离环境调度器，向页面安全注入主环境脚本
├── inject.js            # Main World 注入脚本: 深度伪装 navigator 对象与拦截 WebRTC API
├── popup.html           # 扩展弹出层 UI 界面 (护眼豆沙绿主题)
├── popup.js             # 弹出层交互逻辑与各格式导出格式化引擎
├── icons/               # 扩展各尺寸图标 (16x16, 32x32, 48x48, 128x128)
└── generate_icons.ps1   # 图标生成辅助脚本
```

---

## 🔒 权限说明

| 权限名称 | 用途说明 |
| :--- | :--- |
| `cookies` | 用于读取当前域名的完整 Cookie（含 HttpOnly/Secure） |
| `storage` | 用于本地持久化存储站点 UA 规则与 WebRTC 策略配置 |
| `declarativeNetRequest` / `declarativeNetRequestWithHostAccess` | 用于在网络层无感重写 HTTP 请求头 (User-Agent/Client Hints) |
| `privacy` | 用于配置浏览器底层的 WebRTC IP 路由与处理策略 |
| `tabs` / `activeTab` | 用于获取当前激活标签页的 URL、Hostname 与自动刷新 |
| `scripting` | 用于执行辅助脚本注入 |
| `clipboardWrite` / `clipboardRead` | 用于将导出的 Cookie / UA 内容快速复制到剪贴板 |
| `<all_urls>` (Host Permissions) | 允许在用户访问的任意站点上执行 Cookie 导出与请求头伪装 |

---

## 📄 开源协议

本项目基于 [MIT License](LICENSE) 协议开源。
