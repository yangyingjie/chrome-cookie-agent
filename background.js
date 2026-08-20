// Background Service Worker - User-Agent & WebRTC 动态规则与隐私同步引擎

const ALL_RESOURCE_TYPES = [
  'main_frame',
  'sub_frame',
  'stylesheet',
  'script',
  'image',
  'font',
  'object',
  'xmlhttprequest',
  'ping',
  'csp_report',
  'media',
  'websocket',
  'other'
];

function normalizeDomain(domain) {
  if (!domain) return '';
  return domain.trim().toLowerCase()
    .replace(/^https?:\/\//, '')
    .split('/')[0]
    .split(':')[0]
    .replace(/^\.+/, '');
}

// 同步 chrome.declarativeNetRequest 动态规则
async function syncDeclarativeRules() {
  try {
    const data = await chrome.storage.local.get(['siteUaMap', 'globalUa']);
    const siteUaMap = data.siteUaMap || {};
    const globalUa = data.globalUa || { enabled: false, ua: '' };

    // 获取现有动态规则 ID 并清除
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const removeRuleIds = existingRules.map(r => r.id);

    const addRules = [];
    let ruleIdCounter = 1;

    // 1. 全局 User-Agent 规则 (优先级 1)
    if (globalUa.enabled && globalUa.ua && globalUa.ua.trim()) {
      addRules.push({
        id: ruleIdCounter++,
        priority: 1,
        action: {
          type: 'modifyHeaders',
          requestHeaders: [
            { header: 'User-Agent', operation: 'set', value: globalUa.ua.trim() },
            { header: 'sec-ch-ua', operation: 'remove' },
            { header: 'sec-ch-ua-mobile', operation: 'remove' },
            { header: 'sec-ch-ua-platform', operation: 'remove' },
            { header: 'sec-ch-ua-platform-version', operation: 'remove' },
            { header: 'sec-ch-ua-model', operation: 'remove' }
          ]
        },
        condition: {
          urlFilter: '*',
          resourceTypes: ALL_RESOURCE_TYPES
        }
      });
    }

    // 2. 站点特异 User-Agent 规则 (优先级依据域名特异度 10~50，覆盖全局)
    for (const [domain, config] of Object.entries(siteUaMap)) {
      if (config && config.enabled && config.ua && config.ua.trim()) {
        const cleanDomain = normalizeDomain(domain);
        if (!cleanDomain) continue;

        const domainDepth = cleanDomain.split('.').length;
        const priority = Math.min(10 + domainDepth, 50);

        addRules.push({
          id: ruleIdCounter++,
          priority: priority,
          action: {
            type: 'modifyHeaders',
            requestHeaders: [
              { header: 'User-Agent', operation: 'set', value: config.ua.trim() },
              { header: 'sec-ch-ua', operation: 'remove' },
              { header: 'sec-ch-ua-mobile', operation: 'remove' },
              { header: 'sec-ch-ua-platform', operation: 'remove' },
              { header: 'sec-ch-ua-platform-version', operation: 'remove' },
              { header: 'sec-ch-ua-model', operation: 'remove' }
            ]
          },
          condition: {
            urlFilter: `||${cleanDomain}`,
            resourceTypes: ALL_RESOURCE_TYPES
          }
        });
      }
    }

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: removeRuleIds,
      addRules: addRules
    });

    console.log(`[UA Switcher] 规则同步成功: 生效规则数 = ${addRules.length}`);
  } catch (err) {
    console.error('[UA Switcher] 规则同步失败:', err);
  }
}

// 同步 WebRTC IP 策略
async function syncWebrtcPolicy() {
  try {
    const data = await chrome.storage.local.get(['webrtcPolicy']);
    const policy = data.webrtcPolicy || 'disable_non_proxied_udp';

    if (!data.webrtcPolicy) {
      await chrome.storage.local.set({ webrtcPolicy: 'disable_non_proxied_udp' });
    }

    if (chrome.privacy && chrome.privacy.network && chrome.privacy.network.webRTCIPHandlingPolicy) {
      const chromeValue = (policy === 'block_api') ? 'disable_non_proxied_udp' : policy;
      await chrome.privacy.network.webRTCIPHandlingPolicy.set({ value: chromeValue });
      console.log(`[WebRTC Control] 策略同步成功: ${policy} (Chrome Value: ${chromeValue})`);
    }
  } catch (err) {
    console.error('[WebRTC Control] 策略同步失败:', err);
  }
}

// 插件安装 / 启动时自动同步规则与策略
chrome.runtime.onInstalled.addListener(() => {
  syncDeclarativeRules();
  syncWebrtcPolicy();

  // 默认启用自动画中画 (Auto-PiP) 与倍速快捷键
  chrome.storage.local.get(['autoPipEnabled', 'speedHotkeysEnabled'], (res) => {
    const toSet = {};
    if (res.autoPipEnabled === undefined) toSet.autoPipEnabled = true;
    if (res.speedHotkeysEnabled === undefined) toSet.speedHotkeysEnabled = true;
    if (Object.keys(toSet).length > 0) {
      chrome.storage.local.set(toSet);
    }
  });

  // 注册画中画右键快捷菜单
  try {
    chrome.contextMenus.create({
      id: 'context_toggle_pip',
      title: '🪟 开启/切换 画中画 (Alt+P)',
      contexts: ['video', 'page', 'frame']
    });
  } catch (e) {
    console.warn('[PiP] Context menu registration:', e);
  }
});

chrome.runtime.onStartup.addListener(() => {
  syncDeclarativeRules();
  syncWebrtcPolicy();
});

// 监听 storage 变更自动同步规则
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local') {
    if (changes.siteUaMap || changes.globalUa) {
      syncDeclarativeRules();
    }
    if (changes.webrtcPolicy) {
      syncWebrtcPolicy();
    }
  }
});

// 处理 Popup 与 ContentScript 消息通信
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_EFFECTIVE_UA_FOR_URL') {
    (async () => {
      try {
        const urlStr = message.url || (sender.tab && sender.tab.url);
        if (!urlStr) {
          sendResponse({ ua: null });
          return;
        }
        const hostname = normalizeDomain(new URL(urlStr).hostname);
        const data = await chrome.storage.local.get(['siteUaMap', 'globalUa']);
        const siteUaMap = data.siteUaMap || {};
        const globalUa = data.globalUa || { enabled: false, ua: '' };

        let effectiveUa = null;
        let matchedDomain = null;

        // 1. 精确匹配
        for (const [key, config] of Object.entries(siteUaMap)) {
          if (config && config.enabled && config.ua && config.ua.trim()) {
            if (hostname === normalizeDomain(key)) {
              effectiveUa = config.ua.trim();
              matchedDomain = key;
              break;
            }
          }
        }

        // 2. 父域名层级匹配
        if (!effectiveUa) {
          const parts = hostname.split('.');
          for (let i = 1; i < parts.length - 1; i++) {
            const candidate = parts.slice(i).join('.');
            for (const [key, config] of Object.entries(siteUaMap)) {
              if (config && config.enabled && config.ua && config.ua.trim()) {
                if (candidate === normalizeDomain(key)) {
                  effectiveUa = config.ua.trim();
                  matchedDomain = key;
                  break;
                }
              }
            }
            if (effectiveUa) break;
          }
        }

        // 3. www 互转匹配
        if (!effectiveUa) {
          const wwwAlt = hostname.startsWith('www.') ? hostname.slice(4) : ('www.' + hostname);
          for (const [key, config] of Object.entries(siteUaMap)) {
            if (config && config.enabled && config.ua && config.ua.trim()) {
              if (wwwAlt === normalizeDomain(key)) {
                effectiveUa = config.ua.trim();
                matchedDomain = key;
                break;
              }
            }
          }
        }

        // 4. 全局回退
        if (!effectiveUa && globalUa.enabled && globalUa.ua && globalUa.ua.trim()) {
          effectiveUa = globalUa.ua.trim();
          matchedDomain = '* (全局)';
        }

        sendResponse({ ua: effectiveUa, matchedDomain: matchedDomain });
      } catch (e) {
        sendResponse({ ua: null, error: e.message });
      }
    })();
    return true; // 异步响应
  }

  if (message.type === 'FORCE_SYNC_RULES') {
    Promise.all([syncDeclarativeRules(), syncWebrtcPolicy()]).then(() => sendResponse({ success: true }));
    return true;
  }

  // ==========================================
  // Grok 账号助手 Background 核心通信调度
  // ==========================================
  if (message.type === 'GET_GROK_COOKIES') {
    (async () => {
      try {
        const cookies = await getGrokCookies();
        sendResponse({ success: true, cookies });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (message.type === 'SWITCH_GROK_ACCOUNT') {
    (async () => {
      try {
        const { cookies, accountId } = message;
        if (!cookies || !Array.isArray(cookies)) {
          throw new Error('未提供有效的 Cookies 数组');
        }

        // 1. 清理当前所有 Grok 相关域与 x.ai 相关域的 Cookies，防止冲突
        await clearGrokCookies();

        // 2. 依次注入目标账号的 Cookies (支持 .grok.com 与 .x.ai 双域同步)
        for (const c of cookies) {
          await setCookieForDomain(c);

          // 若为核心 SSO Token，同时同步写入 .x.ai 域，杜绝 accounts.x.ai 握手时死循环
          if (c.name === 'sso' || c.name === 'sso-rw') {
            await setCookieForDomain({
              ...c,
              domain: '.x.ai'
            });
          }
        }

        // 3. 更新 storage 中的 activeAccountId
        if (accountId) {
          const store = await chrome.storage.local.get(['grokData']);
          const grokData = store.grokData || { accounts: [], activeAccountId: null };
          grokData.activeAccountId = accountId;
          await chrome.storage.local.set({ grokData });
        }

        sendResponse({ success: true });
      } catch (err) {
        console.error('[Grok Switcher] 切换失败:', err);
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (message.type === 'CLEAR_GROK_SESSION') {
    (async () => {
      try {
        await clearGrokCookies();
        const store = await chrome.storage.local.get(['grokData']);
        const grokData = store.grokData || { accounts: [], activeAccountId: null };
        grokData.activeAccountId = null;
        await chrome.storage.local.set({ grokData });
        sendResponse({ success: true });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (message.type === 'FETCH_GROK_QUOTA') {
    (async () => {
      try {
        const quotaData = await fetchGrokRateLimits();
        sendResponse({ success: true, data: quotaData });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  // ==========================================
  // 画中画 (Picture-in-Picture) 后台调度
  // ==========================================
  if (message.type === 'TOGGLE_PIP_ON_ACTIVE_TAB') {
    (async () => {
      try {
        let tabId = message.tabId;
        if (!tabId) {
          const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
          tabId = activeTab ? activeTab.id : null;
        }
        const result = await executePipToggleOnTab(tabId);
        sendResponse(result);
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (message.type === 'QUERY_ACTIVE_TAB_PIP_STATUS') {
    (async () => {
      try {
        let tabId = message.tabId;
        if (!tabId) {
          const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
          tabId = activeTab ? activeTab.id : null;
        }
        const status = await getTabPipStatus(tabId);
        sendResponse(status);
      } catch (err) {
        sendResponse({ supported: false, totalVideos: 0, playingVideos: 0, isInPip: false, error: err.message });
      }
    })();
    return true;
  }
});

// 监听全局快捷键 (如 Alt+P / Option+P)
if (chrome.commands && chrome.commands.onCommand) {
  chrome.commands.onCommand.addListener(async (command) => {
    if (command === 'toggle-pip') {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.id) {
          const result = await executePipToggleOnTab(tab.id);
          console.log('[PiP Command]', result);
        }
      } catch (e) {
        console.error('[PiP Command Error]', e);
      }
    }
  });
}

// 监听右键菜单点击
if (chrome.contextMenus && chrome.contextMenus.onClicked) {
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'context_toggle_pip') {
      const targetTabId = (tab && tab.id) ? tab.id : (await chrome.tabs.query({ active: true, currentWindow: true }))[0]?.id;
      if (targetTabId) {
        const result = await executePipToggleOnTab(targetTabId);
        console.log('[PiP ContextMenu]', result);
      }
    }
  });
}

function isRestrictedTabUrl(url) {
  if (!url) return false;
  return /^(chrome|chrome-extension|edge|devtools|about|view-source):/i.test(url);
}

// 核心标签页 PiP 切换执行函数
async function executePipToggleOnTab(tabId) {
  if (!tabId) return { success: false, error: 'NO_TAB_ID', message: '无效的标签页目标' };

  try {
    const tab = await chrome.tabs.get(tabId).catch(() => null);
    if (tab && isRestrictedTabUrl(tab.url)) {
      return {
        success: false,
        error: 'RESTRICTED_URL',
        message: 'Chrome 安全策略限制：系统内置页面 (如 chrome://) 无法执行画中画，请在常规网页（如 Bilibili / YouTube / 网页视频等）中使用。'
      };
    }
  } catch (e) {}

  // 直接使用 chrome.scripting.executeScript 执行，继承 Command / ContextMenu 的用户手势上下文
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: async () => {
        if (window.__CHROME_PIP_ENGINE__) {
          return await window.__CHROME_PIP_ENGINE__.togglePictureInPicture();
        }

        // Fallback
        const doc = document;
        if (doc.pictureInPictureElement) {
          await doc.exitPictureInPicture();
          return { success: true, action: 'exited', message: '已退出画中画' };
        }

        const videos = Array.from(doc.querySelectorAll('video'));
        for (const v of videos) {
          if (v.disablePictureInPicture) v.disablePictureInPicture = false;
        }

        const best = videos.find(v => !v.paused && v.currentTime > 0) || videos[0];
        if (best && best.requestPictureInPicture) {
          await best.requestPictureInPicture();
          return { success: true, action: 'entered', message: '已开启画中画' };
        }
        return { success: false, error: 'NO_VIDEO_FOUND', message: '未找到视频元素' };
      }
    });

    if (results && results[0] && results[0].result) {
      return results[0].result;
    }
    return { success: false, error: 'EXECUTION_EMPTY', message: '执行返回为空' };
  } catch (injectErr) {
    return {
      success: false,
      error: injectErr.name || 'INJECTION_FAILED',
      message: `无法在此页面执行画中画: ${injectErr.message}`
    };
  }
}

// 查询指定标签页的 PiP 状态
async function getTabPipStatus(tabId) {
  if (!tabId) return { supported: false, totalVideos: 0, playingVideos: 0, isInPip: false };

  try {
    const tab = await chrome.tabs.get(tabId).catch(() => null);
    if (tab && isRestrictedTabUrl(tab.url)) {
      return {
        supported: false,
        totalVideos: 0,
        playingVideos: 0,
        isInPip: false,
        isRestricted: true,
        message: '系统页面不支持画中画'
      };
    }
  } catch (e) {}

  try {
    const res = await chrome.tabs.sendMessage(tabId, { type: 'GET_PIP_STATUS' });
    if (res && typeof res.totalVideos === 'number') {
      return res;
    }
  } catch (e) {}

  try {
    await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      files: ['pip_engine.js']
    });

    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        if (window.__CHROME_PIP_ENGINE__) {
          return window.__CHROME_PIP_ENGINE__.getPipStatus();
        }
        return { supported: false, totalVideos: 0, playingVideos: 0, isInPip: false };
      }
    });

    if (results && results[0] && results[0].result) {
      return results[0].result;
    }
  } catch (e) {}

  return { supported: false, totalVideos: 0, playingVideos: 0, isInPip: false };
}

// Grok Cookie 与 API 工具函数
const GROK_DOMAINS = ['grok.com', '.grok.com', 'x.ai', '.x.ai', 'api.x.ai', 'accounts.x.ai', 'auth.x.ai'];

async function getGrokCookies() {
  const cookieMap = new Map();
  for (const domain of GROK_DOMAINS) {
    try {
      const cookies = await chrome.cookies.getAll({ domain });
      for (const c of cookies) {
        cookieMap.set(`${c.name}_${c.domain}_${c.path}`, c);
      }
    } catch (e) {
      console.warn('Error reading grok cookies:', domain, e);
    }
  }
  return Array.from(cookieMap.values());
}

async function clearGrokCookies() {
  for (const domain of GROK_DOMAINS) {
    try {
      const cookies = await chrome.cookies.getAll({ domain });
      for (const c of cookies) {
        const protocol = c.secure ? 'https:' : 'http:';
        const d = c.domain.startsWith('.') ? c.domain.slice(1) : c.domain;
        await chrome.cookies.remove({
          url: `${protocol}//${d}${c.path || '/'}`,
          name: c.name,
          storeId: c.storeId
        });
      }
    } catch (e) {
      console.warn('Error clearing grok cookie:', domain, e);
    }
  }
}

async function setCookieForDomain(cookie) {
  if (!cookie || !cookie.name) return;
  const rawDomain = cookie.domain || '.grok.com';
  const cleanDomain = rawDomain.startsWith('.') ? rawDomain.slice(1) : rawDomain;
  const protocol = cookie.secure !== false ? 'https:' : 'http:';
  const url = `${protocol}//${cleanDomain}${cookie.path || '/'}`;

  const details = {
    url: url,
    name: cookie.name,
    value: cookie.value || '',
    path: cookie.path || '/',
    secure: cookie.secure !== false,
    httpOnly: Boolean(cookie.httpOnly)
  };

  if (rawDomain && !cookie.hostOnly) {
    details.domain = rawDomain.startsWith('.') ? rawDomain : ('.' + rawDomain);
  }

  if (cookie.sameSite && cookie.sameSite !== 'unspecified') {
    details.sameSite = cookie.sameSite;
  } else {
    details.sameSite = 'lax';
  }

  if (cookie.expirationDate && !cookie.session) {
    details.expirationDate = cookie.expirationDate;
  } else {
    // 默认提供 30 天有效期，防止 session cookie 丢失
    details.expirationDate = Math.floor(Date.now() / 1000) + 86400 * 30;
  }

  try {
    return await chrome.cookies.set(details);
  } catch (err) {
    // 兼容重试：若指定 domain 报错则直接依靠 URL 设置
    delete details.domain;
    return await chrome.cookies.set(details).catch(e => console.warn('Cookie set retry failed:', cookie.name, e));
  }
}

// 全面拉取 Grok 3 类实时额度（双通道：标签页注入代理 + Background 请求）
async function fetchGrokRateLimits() {
  const result = {
    lastUpdated: Date.now(),
    deepsearch: null,
    thinking: null,
    standard: null
  };

  const kinds = [
    { key: 'standard', kind: 'DEFAULT' },
    { key: 'deepsearch', kind: 'DEEPSEARCH' },
    { key: 'thinking', kind: 'REASONING' }
  ];

  // 通道 1: 优先尝试通过已打开的 Grok 标签页执行（100% 原生同源 Session 与 Cookie）
  try {
    const grokTabs = await chrome.tabs.query({ url: '*://*.grok.com/*' });
    if (grokTabs && grokTabs.length > 0) {
      const tabId = grokTabs[0].id;
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: async () => {
          const kinds = [
            { key: 'standard', kind: 'DEFAULT' },
            { key: 'deepsearch', kind: 'DEEPSEARCH' },
            { key: 'thinking', kind: 'REASONING' }
          ];
          const pageRes = {};
          for (const item of kinds) {
            try {
              const r = await fetch('/rest/rate-limits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ requestKind: item.kind, modelName: 'grok-3' })
              });
              if (r.ok) {
                pageRes[item.key] = await r.json();
              }
            } catch (e) {}
          }
          return pageRes;
        }
      });

      if (results && results[0] && results[0].result) {
        const pageData = results[0].result;
        for (const item of kinds) {
          if (pageData[item.key]) {
            const d = pageData[item.key];
            result[item.key] = {
              remaining: typeof d.remainingQueries === 'number' ? d.remainingQueries : (typeof d.remaining === 'number' ? d.remaining : null),
              total: typeof d.totalQueries === 'number' ? d.totalQueries : (typeof d.limit === 'number' ? d.limit : null),
              resetTime: d.resetTime || null,
              windowSeconds: d.windowSizeSeconds || d.windowSeconds || null
            };
          }
        }
        if (result.standard || result.deepsearch || result.thinking) {
          return result;
        }
      }
    }
  } catch (e) {
    console.warn('[Grok Quota] 标签页通道获取失败，切换至 Background 通道:', e);
  }

  // 通道 2: Background 服务工作者直接凭证请求
  const promises = kinds.map(async item => {
    try {
      const res = await fetch('https://grok.com/rest/rate-limits', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': 'https://grok.com',
          'Referer': 'https://grok.com/'
        },
        body: JSON.stringify({ requestKind: item.kind, modelName: 'grok-3' })
      });

      if (res.ok) {
        const data = await res.json();
        result[item.key] = {
          remaining: typeof data.remainingQueries === 'number' ? data.remainingQueries : (typeof data.remaining === 'number' ? data.remaining : null),
          total: typeof data.totalQueries === 'number' ? data.totalQueries : (typeof data.limit === 'number' ? data.limit : null),
          resetTime: data.resetTime || null,
          windowSeconds: data.windowSizeSeconds || data.windowSeconds || null
        };
      } else {
        // Fallback: 尝试不传 modelName
        const res2 = await fetch('https://grok.com/rest/rate-limits', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Origin': 'https://grok.com',
            'Referer': 'https://grok.com/'
          },
          body: JSON.stringify({ requestKind: item.kind })
        });
        if (res2.ok) {
          const data2 = await res2.json();
          result[item.key] = {
            remaining: typeof data2.remainingQueries === 'number' ? data2.remainingQueries : (typeof data2.remaining === 'number' ? data2.remaining : null),
            total: typeof data2.totalQueries === 'number' ? data2.totalQueries : (typeof data2.limit === 'number' ? data2.limit : null),
            resetTime: data2.resetTime || null,
            windowSeconds: data2.windowSizeSeconds || data2.windowSeconds || null
          };
        }
      }
    } catch (e) {
      console.warn(`[Grok Quota] 拉取 ${item.kind} 额度失败:`, e);
    }
  });

  await Promise.all(promises);
  return result;
}

