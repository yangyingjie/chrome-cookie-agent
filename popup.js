// Popup Controller: Cookie & User-Agent & WebRTC 统一集成面板

// ========================
// 1. User-Agent 预设库
// ========================
const UA_PRESETS = {
  DEFAULT: '',
  IPHONE_15: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  IPAD_PRO: 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  ANDROID_PIXEL: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
  ANDROID_SAMSUNG: 'Mozilla/5.0 (Linux; Android 14; SAMSUNG SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.6167.143 Mobile Safari/537.36',
  WECHAT_IOS: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.49(0x1800312d) NetType/WIFI Language/zh_CN',
  WECHAT_ANDROID: 'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36 MicroMessenger/8.0.49 NetType/WIFI Language/zh_CN',
  MAC_SAFARI: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  MAC_CHROME: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  WIN_EDGE: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0',
  WIN_FIREFOX: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
  LINUX_CHROME: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  GOOGLE_BOT: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  BAIDU_SPIDER: 'Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)',
  BING_BOT: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)'
};

// WebRTC 策略说明字典
const WEBRTC_TIPS = {
  disable_non_proxied_udp: '🛡️ 最高防泄漏模式：强制所有 WebRTC 数据经由代理转发，防止真实 IP 绕过代理发生泄露（代理环境必备）。',
  default_public_interface_only: '🔒 仅公网模式：仅使用默认路由的公网 IP，向网页隐藏局域网私有 IP（如 192.168.x.x）。',
  block_api: '🚫 完全禁用模式：在网页 JS 环境屏蔽 RTCPeerConnection API，彻底禁止网站使用 WebRTC。',
  default_public_and_private_interfaces: '⚠️ 标准路由模式：允许 WebRTC 使用默认路由的公网与内网接口。',
  default: '🌐 原生默认模式：浏览器默认策略，WebRTC 可绑定任意可用网络接口。'
};

// ========================
// 2. 状态变量与 DOM 引用
// ========================
let currentCookies = [];
let activeTabInfo = null;
let currentHostname = '';
let currentUrl = '';
let currentExportTab = 'header';
const defaultBrowserUa = navigator.userAgent;
let effectiveUa = defaultBrowserUa;

// UA DOM
const statsInfo = document.getElementById('statsInfo');
const kshopIndicator = document.getElementById('kshopIndicator');
const currentDomainText = document.getElementById('currentDomainText');
const activeUaBadge = document.getElementById('activeUaBadge');
const uaPresetsSelect = document.getElementById('uaPresets');
const customUaInput = document.getElementById('customUaInput');
const autoReloadCheckbox = document.getElementById('autoReloadCheckbox');
const saveUaBtn = document.getElementById('saveUaBtn');
const resetUaBtn = document.getElementById('resetUaBtn');
const toggleRulesBtn = document.getElementById('toggleRulesBtn');
const rulesPanel = document.getElementById('rulesPanel');
const rulesListContainer = document.getElementById('rulesList');
const clearAllRulesBtn = document.getElementById('clearAllRulesBtn');

// WebRTC DOM
const webrtcStatusBadge = document.getElementById('webrtcStatusBadge');
const webrtcPolicySelect = document.getElementById('webrtcPolicySelect');
const saveWebrtcBtn = document.getElementById('saveWebrtcBtn');
const webrtcPolicyTip = document.getElementById('webrtcPolicyTip');

// Export DOM
const preview = document.getElementById('preview');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');

// ========================
// 3. 辅助函数
// ========================
function normalizeDomain(domain) {
  if (!domain) return '';
  return domain.trim().toLowerCase()
    .replace(/^https?:\/\//, '')
    .split('/')[0]
    .split(':')[0]
    .replace(/^\.+/, '');
}

function findPresetKeyByUa(ua) {
  if (!ua || !ua.trim()) return 'DEFAULT';
  const clean = ua.trim();
  for (const [key, val] of Object.entries(UA_PRESETS)) {
    if (val && val.trim() === clean) return key;
  }
  return 'CUSTOM';
}

function findMatchingSiteRule(hostname, siteUaMap) {
  if (!hostname || !siteUaMap) return null;
  const cleanHost = normalizeDomain(hostname);
  if (!cleanHost) return null;

  // 1. 精确匹配
  for (const [key, config] of Object.entries(siteUaMap)) {
    if (!config || !config.enabled || !config.ua) continue;
    const cleanKey = normalizeDomain(key);
    if (cleanHost === cleanKey) {
      return { domainKey: key, matchedDomain: cleanKey, config: config, isExact: true };
    }
  }

  // 2. 父域名层级匹配
  const parts = cleanHost.split('.');
  for (let i = 1; i < parts.length - 1; i++) {
    const candidate = parts.slice(i).join('.');
    for (const [key, config] of Object.entries(siteUaMap)) {
      if (!config || !config.enabled || !config.ua) continue;
      const cleanKey = normalizeDomain(key);
      if (candidate === cleanKey) {
        return { domainKey: key, matchedDomain: cleanKey, config: config, isExact: false };
      }
    }
  }

  // 3. www 互转匹配
  const wwwAlt = cleanHost.startsWith('www.') ? cleanHost.slice(4) : ('www.' + cleanHost);
  for (const [key, config] of Object.entries(siteUaMap)) {
    if (!config || !config.enabled || !config.ua) continue;
    const cleanKey = normalizeDomain(key);
    if (wwwAlt === cleanKey) {
      return { domainKey: key, matchedDomain: cleanKey, config: config, isExact: false };
    }
  }

  return null;
}

function getSelectedScope() {
  const checked = document.querySelector('input[name="uaScope"]:checked');
  return checked ? checked.value : 'site';
}

// ========================
// 4. User-Agent 事件绑定与加载
// ========================
if (uaPresetsSelect) {
  uaPresetsSelect.addEventListener('change', () => {
    const selectedKey = uaPresetsSelect.value;
    if (customUaInput) {
      if (selectedKey === 'DEFAULT') {
        customUaInput.value = '';
      } else if (selectedKey !== 'CUSTOM') {
        customUaInput.value = UA_PRESETS[selectedKey] || '';
      }
    }
  });
}

if (customUaInput) {
  customUaInput.addEventListener('input', () => {
    const val = customUaInput.value.trim();
    if (uaPresetsSelect) {
      uaPresetsSelect.value = findPresetKeyByUa(val);
    }
  });
}

document.querySelectorAll('input[name="uaScope"]').forEach(radio => {
  radio.addEventListener('change', () => {
    loadUaSettings();
  });
});

if (toggleRulesBtn && rulesPanel) {
  toggleRulesBtn.addEventListener('click', () => {
    rulesPanel.classList.toggle('show');
    toggleRulesBtn.textContent = rulesPanel.classList.contains('show') ? '🔼 收起规则' : '⚙️ 规则管理';
  });
}

async function loadUaSettings() {
  const scope = getSelectedScope();
  const data = await chrome.storage.local.get(['siteUaMap', 'globalUa']);
  const siteUaMap = data.siteUaMap || {};
  const globalUa = data.globalUa || { enabled: false, ua: '' };

  const siteMatch = findMatchingSiteRule(currentHostname, siteUaMap);
  const siteConfig = siteMatch ? siteMatch.config : null;

  // 判定当前生效的 UA
  if (siteConfig && siteConfig.enabled && siteConfig.ua && siteConfig.ua.trim()) {
    effectiveUa = siteConfig.ua.trim();
    if (activeUaBadge) {
      activeUaBadge.className = 'ua-status-badge active';
      activeUaBadge.textContent = siteMatch.isExact ? '🟢 已生效: 本站定制 UA' : `🟢 已生效: 站点 UA (${siteMatch.matchedDomain})`;
    }
  } else if (globalUa && globalUa.enabled && globalUa.ua && globalUa.ua.trim()) {
    effectiveUa = globalUa.ua.trim();
    if (activeUaBadge) {
      activeUaBadge.className = 'ua-status-badge active';
      activeUaBadge.textContent = '🟢 已生效: 全局 UA';
    }
  } else {
    effectiveUa = defaultBrowserUa;
    if (activeUaBadge) {
      activeUaBadge.className = 'ua-status-badge';
      activeUaBadge.textContent = '⚪ 默认浏览器 UA';
    }
  }

  // 同步编辑区与预设下拉框
  if (scope === 'site') {
    if (siteConfig && siteConfig.enabled && siteConfig.ua) {
      if (customUaInput) customUaInput.value = siteConfig.ua;
      if (uaPresetsSelect) uaPresetsSelect.value = findPresetKeyByUa(siteConfig.ua);
    } else if (globalUa && globalUa.enabled && globalUa.ua) {
      if (customUaInput) {
        customUaInput.value = '';
        customUaInput.placeholder = `当前继承全局 UA: ${globalUa.ua.slice(0, 50)}... (可在此输入覆盖本站)`;
      }
      if (uaPresetsSelect) uaPresetsSelect.value = 'DEFAULT';
    } else {
      if (customUaInput) {
        customUaInput.value = '';
        customUaInput.placeholder = 'User-Agent 字符串 (选择预设自动填入，支持自定义修改)...';
      }
      if (uaPresetsSelect) uaPresetsSelect.value = 'DEFAULT';
    }
  } else {
    if (globalUa && globalUa.enabled && globalUa.ua) {
      if (customUaInput) customUaInput.value = globalUa.ua;
      if (uaPresetsSelect) uaPresetsSelect.value = findPresetKeyByUa(globalUa.ua);
    } else {
      if (customUaInput) {
        customUaInput.value = '';
        customUaInput.placeholder = '全局 User-Agent 字符串 (将影响所有未单独配置的网站)...';
      }
      if (uaPresetsSelect) uaPresetsSelect.value = 'DEFAULT';
    }
  }

  renderRulesList(siteUaMap, globalUa);
  updateExportPreview();
}

function renderRulesList(siteUaMap, globalUa) {
  if (!rulesListContainer) return;
  rulesListContainer.innerHTML = '';
  const entries = Object.entries(siteUaMap || {});
  const hasGlobal = globalUa && globalUa.enabled && globalUa.ua;

  if (entries.length === 0 && !hasGlobal) {
    rulesListContainer.innerHTML = '<div class="rules-empty">暂无持久化自定义 UA 规则</div>';
    return;
  }

  if (hasGlobal) {
    const item = document.createElement('div');
    item.className = 'rule-item';
    item.innerHTML = `
      <span class="rule-domain" title="全局所有网站">🌐 全局生效</span>
      <span class="rule-ua" title="${globalUa.ua}">${globalUa.ua}</span>
      <button class="btn-icon" data-del="global" title="清除全局规则">🗑️</button>
    `;
    rulesListContainer.appendChild(item);
  }

  for (const [domain, config] of entries) {
    if (!config || !config.ua) continue;
    const item = document.createElement('div');
    item.className = 'rule-item';
    item.innerHTML = `
      <span class="rule-domain" title="${domain}">${domain}</span>
      <span class="rule-ua" title="${config.ua}">${config.ua}</span>
      <button class="btn-icon" data-del-domain="${domain}" title="删除此站点规则">🗑️</button>
    `;
    rulesListContainer.appendChild(item);
  }

  rulesListContainer.querySelectorAll('button[data-del="global"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      await chrome.storage.local.set({ globalUa: { enabled: false, ua: '' } });
      await loadUaSettings();
      maybeReloadActiveTab();
    });
  });

  rulesListContainer.querySelectorAll('button[data-del-domain]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const domainToDelete = btn.dataset.delDomain;
      const d = await chrome.storage.local.get(['siteUaMap']);
      const map = d.siteUaMap || {};
      delete map[domainToDelete];
      await chrome.storage.local.set({ siteUaMap: map });
      await loadUaSettings();
      maybeReloadActiveTab();
    });
  });
}

if (saveUaBtn) {
  saveUaBtn.addEventListener('click', async () => {
    const scope = getSelectedScope();
    const uaValue = customUaInput ? customUaInput.value.trim() : '';

    if (!uaValue) {
      await resetCurrentScopeUa();
      return;
    }

    const data = await chrome.storage.local.get(['siteUaMap', 'globalUa']);
    const siteUaMap = data.siteUaMap || {};
    let globalUa = data.globalUa || { enabled: false, ua: '' };

    if (scope === 'site') {
      const cleanHost = normalizeDomain(currentHostname);
      if (!cleanHost) return;
      siteUaMap[cleanHost] = {
        enabled: true,
        ua: uaValue,
        updatedAt: Date.now()
      };
      await chrome.storage.local.set({ siteUaMap });
    } else {
      globalUa = {
        enabled: true,
        ua: uaValue,
        updatedAt: Date.now()
      };
      await chrome.storage.local.set({ globalUa });
    }

    saveUaBtn.textContent = '✅ 已保存生效!';
    setTimeout(() => { if (saveUaBtn) saveUaBtn.textContent = '💾 保存生效'; }, 1500);

    await loadUaSettings();
    maybeReloadActiveTab();
  });
}

async function resetCurrentScopeUa() {
  const scope = getSelectedScope();
  const data = await chrome.storage.local.get(['siteUaMap', 'globalUa']);
  const siteUaMap = data.siteUaMap || {};

  if (scope === 'site') {
    const cleanHost = normalizeDomain(currentHostname);
    const siteMatch = findMatchingSiteRule(cleanHost, siteUaMap);
    if (siteMatch) {
      delete siteUaMap[siteMatch.domainKey];
    }
    if (cleanHost && siteUaMap[cleanHost]) {
      delete siteUaMap[cleanHost];
    }
    await chrome.storage.local.set({ siteUaMap });
  } else {
    await chrome.storage.local.set({ globalUa: { enabled: false, ua: '' } });
  }

  if (resetUaBtn) {
    resetUaBtn.textContent = '✅ 已恢复默认!';
    setTimeout(() => { if (resetUaBtn) resetUaBtn.textContent = '🔄 恢复默认'; }, 1500);
  }

  await loadUaSettings();
  maybeReloadActiveTab();
}

if (resetUaBtn) {
  resetUaBtn.addEventListener('click', resetCurrentScopeUa);
}

if (clearAllRulesBtn) {
  clearAllRulesBtn.addEventListener('click', async () => {
    if (confirm('确认清空所有已配置的网站和全局 User-Agent 规则吗？')) {
      await chrome.storage.local.set({ siteUaMap: {}, globalUa: { enabled: false, ua: '' } });
      await loadUaSettings();
      maybeReloadActiveTab();
    }
  });
}

// ========================
// 5. WebRTC Control 逻辑
// ========================
async function loadWebrtcSettings() {
  const data = await chrome.storage.local.get(['webrtcPolicy']);
  const policy = data.webrtcPolicy || 'disable_non_proxied_udp';

  if (webrtcPolicySelect) {
    webrtcPolicySelect.value = policy;
  }
  updateWebrtcUI(policy);
}

function updateWebrtcUI(policy) {
  if (webrtcStatusBadge) {
    if (policy === 'disable_non_proxied_udp') {
      webrtcStatusBadge.className = 'ua-status-badge active';
      webrtcStatusBadge.textContent = '🟢 保护中: 禁用非代理 UDP';
    } else if (policy === 'default_public_interface_only') {
      webrtcStatusBadge.className = 'ua-status-badge active';
      webrtcStatusBadge.textContent = '🟢 保护中: 仅公网接口';
    } else if (policy === 'block_api') {
      webrtcStatusBadge.className = 'ua-status-badge active';
      webrtcStatusBadge.textContent = '🟢 保护中: 完全禁用 API';
    } else if (policy === 'default_public_and_private_interfaces') {
      webrtcStatusBadge.className = 'ua-status-badge';
      webrtcStatusBadge.textContent = '🟡 允许公网与私网';
    } else {
      webrtcStatusBadge.className = 'ua-status-badge';
      webrtcStatusBadge.textContent = '⚪ 原生默认策略';
    }
  }

  if (webrtcPolicyTip) {
    webrtcPolicyTip.textContent = WEBRTC_TIPS[policy] || WEBRTC_TIPS.disable_non_proxied_udp;
  }
}

if (webrtcPolicySelect) {
  webrtcPolicySelect.addEventListener('change', () => {
    const selected = webrtcPolicySelect.value;
    if (webrtcPolicyTip) {
      webrtcPolicyTip.textContent = WEBRTC_TIPS[selected] || '';
    }
  });
}

if (saveWebrtcBtn) {
  saveWebrtcBtn.addEventListener('click', async () => {
    const selectedPolicy = webrtcPolicySelect ? webrtcPolicySelect.value : 'disable_non_proxied_udp';
    await chrome.storage.local.set({ webrtcPolicy: selectedPolicy });

    if (chrome.privacy && chrome.privacy.network && chrome.privacy.network.webRTCIPHandlingPolicy) {
      const chromeValue = (selectedPolicy === 'block_api') ? 'disable_non_proxied_udp' : selectedPolicy;
      try {
        await chrome.privacy.network.webRTCIPHandlingPolicy.set({ value: chromeValue });
      } catch (e) {
        console.warn('WebRTC policy set error:', e);
      }
    }

    updateWebrtcUI(selectedPolicy);

    saveWebrtcBtn.textContent = '✅ 已应用策略!';
    setTimeout(() => { if (saveWebrtcBtn) saveWebrtcBtn.textContent = '💾 应用策略'; }, 1500);

    maybeReloadActiveTab();
  });
}

function maybeReloadActiveTab() {
  if (autoReloadCheckbox && autoReloadCheckbox.checked && activeTabInfo && activeTabInfo.id) {
    chrome.tabs.reload(activeTabInfo.id);
  }
}

// ========================
// 6. Cookie & UA 集成导出格式化
// ========================
function toCookieHeaderString(cookies) {
  return (cookies || []).map(c => `${c.name}=${c.value}`).join('; ');
}

function formatAsHeader(cookies, ua) {
  const cookieStr = toCookieHeaderString(cookies);
  return `User-Agent: ${ua}\nCookie: ${cookieStr}`;
}

function formatAsPython(cookies, ua, url) {
  const cookieDict = {};
  for (const c of (cookies || [])) cookieDict[c.name] = c.value;
  return `import requests

url = "${url || 'https://' + currentHostname}"
headers = {
    "User-Agent": "${ua}"
}
cookies = ${JSON.stringify(cookieDict, null, 4)}

response = requests.get(url, headers=headers, cookies=cookies)
print("Status Code:", response.status_code)
print(response.text[:500])
`;
}

function formatAsCurl(cookies, ua, url) {
  const targetUrl = url || ('https://' + currentHostname);
  const cookieStr = toCookieHeaderString(cookies);
  return `curl '${targetUrl}' \\
  -H 'User-Agent: ${ua}' \\
  -H 'Cookie: ${cookieStr}'`;
}

function formatAsJson(cookies, ua, url) {
  return JSON.stringify({
    url: url || ('https://' + currentHostname),
    userAgent: ua,
    cookiesCount: (cookies || []).length,
    cookies: cookies || []
  }, null, 2);
}

function formatAsNetscape(cookies, ua) {
  const lines = [
    '# Netscape HTTP Cookie File',
    '# http://curl.haxx.se/rfc/cookie_spec.html',
    '# Generated by Cookie & User-Agent Switcher Pro',
    `# User-Agent: ${ua}`,
    '# Domain\tIncludeSubdomains\tPath\tSecure\tExpiry\tName\tValue'
  ];
  const now = Math.floor(Date.now() / 1000);
  for (const c of (cookies || [])) {
    const domain = c.domain || '';
    const includeSub = domain.startsWith('.') ? 'TRUE' : 'FALSE';
    const path = c.path || '/';
    const secure = c.secure ? 'TRUE' : 'FALSE';
    const expiry = Math.floor(c.expirationDate || (now + 86400 * 365));
    lines.push(`${domain}\t${includeSub}\t${path}\t${secure}\t${expiry}\t${c.name}\t${c.value}`);
  }
  return lines.join('\n');
}

function updateExportPreview() {
  if (!preview) return;
  if (currentExportTab === 'header') {
    preview.value = formatAsHeader(currentCookies, effectiveUa);
  } else if (currentExportTab === 'python') {
    preview.value = formatAsPython(currentCookies, effectiveUa, currentUrl);
  } else if (currentExportTab === 'curl') {
    preview.value = formatAsCurl(currentCookies, effectiveUa, currentUrl);
  } else if (currentExportTab === 'json') {
    preview.value = formatAsJson(currentCookies, effectiveUa, currentUrl);
  } else if (currentExportTab === 'netscape') {
    preview.value = formatAsNetscape(currentCookies, effectiveUa);
  }
}

// 导出选项卡切换
document.querySelectorAll('.export-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.export-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentExportTab = tab.dataset.tab;
    updateExportPreview();
  });
});

// 一键复制
if (copyBtn) {
  copyBtn.addEventListener('click', async () => {
    if (!preview || !preview.value) return;
    await navigator.clipboard.writeText(preview.value);
    copyBtn.textContent = '✅ 已复制!';
    setTimeout(() => { if (copyBtn) copyBtn.textContent = '📋 一键复制'; }, 1500);
  });
}

// 文件导出
if (downloadBtn) {
  downloadBtn.addEventListener('click', () => {
    if (!preview || !preview.value) return;
    const safeHost = (currentHostname || 'export').replace(/[^a-zA-Z0-9_-]/g, '_');
    let filename = `${safeHost}_headers.txt`;
    let mime = 'text/plain';

    if (currentExportTab === 'python') {
      filename = `${safeHost}_request.py`;
    } else if (currentExportTab === 'curl') {
      filename = `${safeHost}_curl.sh`;
    } else if (currentExportTab === 'json') {
      filename = `${safeHost}_data.json`;
      mime = 'application/json';
    } else if (currentExportTab === 'netscape') {
      filename = `${safeHost}_cookies.txt`;
    }

    const blob = new Blob([preview.value], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  });
}

// ========================
// 7. 初始化与数据读取
// ========================
async function init() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) {
      if (statsInfo) statsInfo.textContent = '无法获取当前网页';
      await loadUaSettings();
      await loadWebrtcSettings();
      return;
    }
    activeTabInfo = tab;
    currentUrl = tab.url;

    try {
      const urlObj = new URL(tab.url);
      currentHostname = normalizeDomain(urlObj.hostname);
      if (currentDomainText) {
        currentDomainText.textContent = currentHostname || '当前页';
      }

      // 1. 获取当前 URL 的所有 Cookie
      const urlCookies = await chrome.cookies.getAll({ url: tab.url });

      // 2. 获取域名树所有 Cookie
      if (currentHostname) {
        const parts = currentHostname.split('.');
        const domains = [currentHostname, '.' + currentHostname];
        for (let i = 1; i < parts.length - 1; i++) {
          const p = parts.slice(i).join('.');
          domains.push(p);
          domains.push('.' + p);
        }

        const domainPromises = domains.map(d => chrome.cookies.getAll({ domain: d }).catch(() => []));
        const domainResults = await Promise.all(domainPromises);

        const cookieMap = new Map();
        for (const c of [...urlCookies, ...domainResults.flat()]) {
          const key = `${c.name}___${c.domain}___${c.path}`;
          cookieMap.set(key, c);
        }

        currentCookies = Array.from(cookieMap.values());
      } else {
        currentCookies = urlCookies || [];
      }

      const httpOnlyCount = currentCookies.filter(c => c.httpOnly).length;
      const hasKshop = currentCookies.some(c => c.name === 'kshop.api_st');

      if (statsInfo) {
        statsInfo.innerHTML = `站点: <strong>${currentHostname || '本地'}</strong> (共 ${currentCookies.length} 个, HttpOnly: <strong>${httpOnlyCount}</strong> 个)`;
      }
      if (kshopIndicator) {
        kshopIndicator.textContent = hasKshop ? '✅ 已包含 kshop.api_st' : '';
      }
    } catch (e) {
      if (statsInfo) statsInfo.textContent = '非标准网页或无 Cookie';
    }

    await loadUaSettings();
    await loadWebrtcSettings();
  } catch (err) {
    console.error('Init error:', err);
  }
}

// 确保 DOM 加载完毕后执行初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
