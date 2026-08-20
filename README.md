# Cookie & Grok Account Helper Pro (Grok多账号切换/额度监控 & Cookie/UA工具箱)

<p align="center">
  <img src="icons/icon128.png" alt="Logo" width="96" height="96" />
</p>

<p align="center">
  <strong>一款基于 Chrome Manifest V3 的 Grok 多账号一键无缝切换、DeepSearch/Thinking 实时额度监控，以及高权限 Cookie 导出、User-Agent 伪装与 WebRTC 防泄露隐私保护插件。</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Manifest-V3-blue.svg" alt="Manifest V3" />
  <img src="https://img.shields.io/badge/Version-1.6.0-green.svg" alt="Version" />
  <img src="https://img.shields.io/badge/License-MIT-orange.svg" alt="License" />
  <img src="https://img.shields.io/badge/Platform-Chrome%20%7C%20Edge%20%7C%20Brave-lightgrey.svg" alt="Platform" />
</p>

---

## 🌟 核心特性

### 1. ⚡ 网页媒体全能倍速与增强 (Global Speed 深度整合)
- **无极倍速调节 (0.05x - 16.0x)**：支持任意精度的视频与音频播放速度调节，并提供 10 档常用快捷预设（`0.5x`, `0.75x`, `1.0x`, `1.25x`, `1.5x`, `1.75x`, `2.0x`, `2.5x`, `3.0x`, `4.0x`）。
- **音量硬件放大增强 (最高 600%)**：基于 Web Audio API 打造的无损声音增益放大器，针对低声量视频与网课录音，轻松突破系统 100% 极限音量限制。
- **音调智能保持 (Pitch Preservation)**：默认开启 `preservesPitch` 音调修复，加速播放依然保持自然人声，杜绝刺耳的“花栗鼠”变调。
- **防回弹锁定 (Anti-Reset)**：针对 Bilibili、YouTube 等视频平台在切换分集或分辨率时重置倍速的问题，引擎内置自动监听并锁定用户指定倍速。
- **站点独立记忆 / 全局生效**：支持按域名独立记忆倍速配置（如 YouTube 1.5x, B站 2.0x），亦可一键设为全局默认。
- **智能防冲突网页快捷键**：
  - **`D`**（或 `]`）：加速 `+0.1x`
  - **`A`**（或 `[`）：减速 `-0.1x`
  - **`S`**（或 `R`）：一键恢复正常速度 `1.0x`
  - **`Z`** / **`X`**：快退 5 秒 / 快进 5 秒
  - **`C`**：播放 / 暂停切换
  - 自动检测评论区、搜索框与输入焦点，打字聊天时智能静默避让，绝不误触！

---

### 2. 🎬 网页视频画中画 (Picture-in-Picture by Google 深度整合)
- **快捷键秒启**：支持全局快捷键 `Alt+P`（Mac 为 `Option+P` / `⌥+P`），无论当前网页是否提供画中画按钮，均可一键开启或退出画中画浮窗。
- **智能穿透引擎**：递归检索标准 DOM、Shadow DOM 树与嵌套框架（如自定义 Web Component 播放器），精准捕获目标视频。
- **破解禁止画中画限制**：自动清除网站针对 `<video>` 标签添加的 `disablePictureInPicture` 限制。
- **智能优先级优选**：若页面存在多个视频，自动优先选取「正在播放」且「画面尺寸最大」的主视频。
- **离开标签页自动画中画 (Auto-PiP)**：默认开启，切换标签页或最小化时正在播放的视频自动进入画中画悬浮窗。
- **右键上下文菜单**：在网页视频或页面任意位置右键呼出「🪟 开启/切换 画中画 (Alt+P)」。

---

### 3. 🤖 Grok 账号助手 & 实时额度监控 (Grok Account Helper)
- **多账号管理与一键切换**：
  - 突破多账号频繁退出登录的痛点，支持在本地存储管理多个 Grok 账号。
  - 点击列表任意账号一键自动替换 `grok.com` Session Cookie 并刷新网页，实现瞬间身份切换。
- **一键捕获当前登录账号**：在浏览器登录 `grok.com` 后，点击「➕ 捕获当前账号」即可自动读取身份与 Cookie 并存入账号库。
- **多模型额度实时监控 (Rate Limits Dashboard)**：
  - **🔍 DeepSearch (深度搜索)**：实时显示剩余次数、总配额、百分比彩色进度条及重置倒计时。
  - **🧠 Thinking (深度思考/推理)**：实时显示剩余思考次数、总配额与重置时间。
  - **💬 Standard (标准对话)**：显示当前周期的基础问答可用额度。
- **数据备份与导入导出**：
  - 支持一键导出所有账号为标准 JSON 备份文件或复制到剪贴板。
  - 支持粘贴 JSON 备份或从 `.json` 文件批量导入与合并账号。
- **智能场景激活**：当访问 `grok.com` 或 `x.ai` 时，扩展自动聚焦 Grok 助手面板。

---

### 4. 🍪 原生高权限 Cookie 导出 (Cookie Exporter)
- **突破 JS 限制**：采用 `chrome.cookies` 原生 API，完整读取并导出 `HttpOnly`、`Secure`、`SameSite` 等受限 Cookie。
- **多格式一键导出**：
  - **Header 格式**：标准 `User-Agent` 与 `Cookie` 拼接格式，直接贴入抓包或调试工具。
  - **Python Requests**：开箱即用的 Python 代码片段（含请求头与字典化 Cookies）。
  - **cURL 命令**：单行包含完整 UA 与 Cookie 的终端请求命令。
  - **JSON 格式**：全字段元数据（Domain, Path, Expires, HttpOnly 等），兼容 Playwright / Puppeteer / EditThisCookie。
  - **Netscape / cookies.txt**：标准 Netscape 格式，兼容 `wget`、`yt-dlp`、`aria2`、`curl -b`。
- **便捷操作**：支持一键复制到剪贴板与一键下载保存为文本文件。

---

### 5. 🎭 双层 User-Agent 伪装与 Client Hints 剥离
- **细粒度作用域**：
  - **站点级规则 (Site-Specific)**：依据域名特异度自动匹配，支持多级子域名与 `www` 互转，不影响其他标签页。
  - **全局规则 (Global)**：一键对所有网页生效。
- **网络层动态修改**：使用 `declarativeNetRequest` 动态规则修改请求头，同时自动移除 `sec-ch-ua`、`sec-ch-ua-mobile`、`sec-ch-ua-platform` 等客户端指纹头。
- **DOM / JS 环境伪装**：通过 Web Accessible Resource 主环境安全注入（`inject.js`），无缝重写 `navigator.userAgent`、`navigator.appVersion`、`navigator.platform` 并置空 `navigator.userAgentData`。
- **内置丰富预设**：涵盖 iOS (iPhone/iPad)、Android (Pixel/Samsung)、微信内置浏览器 (WeChat iOS/Android)、macOS (Safari/Chrome)、Windows (Edge/Firefox)、Linux 以及搜索引擎爬虫 (Googlebot/Baiduspider/Bingbot)。

---

### 6. 🛡️ WebRTC IP 防泄漏与隐私控制 (WebRTC Privacy)
- 提供 5 档 WebRTC 路由与 API 拦截策略：
  1. **最高防泄漏模式 (`disable_non_proxied_udp`)**：强制所有 WebRTC 流量走代理通道，防止真实公网 IP 绕过代理发生泄露（代理/科学上网环境必备）。
  2. **仅公网模式 (`default_public_interface_only`)**：向网页隐藏本地局域网私有 IP（如 `192.168.x.x`）。
  3. **完全禁用模式 (`block_api`)**：在网页 JS 环境中彻底拦截并屏蔽 `RTCPeerConnection` 与 `getUserMedia` API。
  4. **标准路由模式 (`default_public_and_private_interfaces`)**：允许公网与内网默认接口。
  5. **原生默认模式 (`default`)**：恢复浏览器默认网络绑定策略。

---

## 📦 安装方法

### 加载已解压的扩展程序（开发者模式）

1. 克隆或下载本项目代码到本地：
   ```bash
   git clone https://github.com/yangyingjie/chrome-cookie-agent.git
   ```
2. 打开基于 Chromium 内核的浏览器（Chrome / Edge / Brave / 360极速等），在地址栏访问：
   - **Chrome**: `chrome://extensions/`
   - **Edge**: `edge://extensions/`
3. 开启右上角的 **「开发者模式 (Developer Mode)」**。
4. 点击 **「加载已解压的扩展程序 (Load unpacked)」**。
5. 选择项目根目录（包含 `manifest.json` 的文件夹）即可完成安装。

---

## 🚀 使用指南

### 1. 使用视频/音频倍速与音量放大 (Global Speed)
1. **快捷键控制**：在任意视频或音频播放页面，直接使用键盘快捷键：
   - 按 **`D`**（或 `]`）快速加速（+0.1x）
   - 按 **`A`**（或 `[`）快速减速（-0.1x）
   - 按 **`S`**（或 `R`）恢复正常速度（1.0x）
   - 按 **`Z`** / **`X`** 快速回退/快进 5 秒
   - 按 **`C`** 切换播放/暂停
2. **面板控制**：点击插件图标 ->「🍪 通用工具箱」-> 顶部的「⚡ 网页媒体倍速与增强」区域：
   - 点击预设按钮（如 `1.5x`, `2.0x`）秒切倍速。
   - 拖动滑块或输入数字实现 0.05x-16.0x 精确无极调节。
   - 拖动「🔊 音量放大」滑块可将声音放大至最高 600%。
   - 勾选「保持原音调」自动消除尖锐变调。

### 2. 使用网页视频画中画 (Picture-in-Picture)
1. **全局快捷键**：在任意含有视频的网页中，直接按下 `Alt+P`（Mac: `Option+P` / `⌥+P`），即可瞬间开启或关闭画中画悬浮窗。
2. **右键菜单**：在视频或页面空白处单击右键，选择「🪟 开启/切换 画中画 (Alt+P)」。
3. **离开自动画中画**：默认开启，切换标签页或最小化浏览器时自动将播放中的视频浮窗化。

### 3. 使用 Grok 账号助手与额度监控
1. **添加/捕获账号**：登录 `https://grok.com` 后点击插件「➕ 捕获当前账号」。
2. **切换账号**：点击列表任意账号「⚡ 切换」即可。
3. **额度监控**：实时查看 DeepSearch、Thinking 与 Standard 剩余额度与重置倒计时。

### 4. 导出 Cookie & 切换 UA / WebRTC
1. 在「🍪 通用工具箱」中切换 Cookie 导出格式（Header, Python, cURL, JSON, Netscape）。
2. 在 UA 配置区选择预设并保存生效；在 WebRTC 配置区选择代理防漏策略。

---

## 📂 项目结构

```text
chrome-cookie-agent/
├── manifest.json         # Manifest V3 配置文件、快捷键 commands 与权限声明
├── background.js        # Service Worker: 动态规则、WebRTC策略、快捷键/右键与 Grok 切换调度
├── speed_engine.js      # 全能倍速与音量放大引擎: 0.05-16x无极倍速、WebAudio放大600%、防回弹与快捷键
├── pip_engine.js        # 画中画核心引擎: DOM/ShadowDOM穿透、限制解除、权重优选与 Auto-PiP
├── content_script.js    # 隔离环境调度器，向页面注入主环境脚本并监听画中画与倍速指令
├── inject.js            # Main World 注入脚本: navigator 对象伪装与 WebRTC API 拦截
├── popup.html           # 扩展弹窗 UI (双 Tab 架构，护眼豆沙绿主题)
├── popup.js             # Grok 账号管理/额度监控 & 倍速/画中画/Cookie/UA/WebRTC 核心控制逻辑
├── test_speed_engine.js # 倍速与音量增强引擎自动化测试脚本
├── test_pip_engine.js   # 画中画引擎自动化测试脚本
├── icons/               # 扩展各尺寸图标 (16x16, 32x32, 48x48, 128x128)
└── generate_icons.ps1   # 图标生成脚本
```

---

## 📄 开源协议

本项目基于 [MIT License](LICENSE) 协议开源。
