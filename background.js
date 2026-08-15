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
});
