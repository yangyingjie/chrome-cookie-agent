// Content Script - 隔离环境调度器 (通过 Web Accessible Resource 安全注入，彻底杜绝 CSP 拦截)

(function () {
  function normalizeDomain(domain) {
    if (!domain) return '';
    return domain.trim().toLowerCase()
      .replace(/^https?:\/\//, '')
      .split('/')[0]
      .split(':')[0]
      .replace(/^\.+/, '');
  }

  function findMatchingUa(hostname, siteUaMap, globalUa) {
    const cleanHost = normalizeDomain(hostname);
    if (!cleanHost) {
      return (globalUa && globalUa.enabled && globalUa.ua) ? globalUa.ua.trim() : null;
    }

    // 1. 精确匹配
    for (const [key, config] of Object.entries(siteUaMap)) {
      if (config && config.enabled && config.ua && config.ua.trim()) {
        if (cleanHost === normalizeDomain(key)) {
          return config.ua.trim();
        }
      }
    }

    // 2. 父域名层级匹配
    const parts = cleanHost.split('.');
    for (let i = 1; i < parts.length - 1; i++) {
      const candidate = parts.slice(i).join('.');
      for (const [key, config] of Object.entries(siteUaMap)) {
        if (config && config.enabled && config.ua && config.ua.trim()) {
          if (candidate === normalizeDomain(key)) {
            return config.ua.trim();
          }
        }
      }
    }

    // 3. www 互转匹配
    const wwwAlt = cleanHost.startsWith('www.') ? cleanHost.slice(4) : ('www.' + cleanHost);
    for (const [key, config] of Object.entries(siteUaMap)) {
      if (config && config.enabled && config.ua && config.ua.trim()) {
        if (wwwAlt === normalizeDomain(key)) {
          return config.ua.trim();
        }
      }
    }

    // 4. 全局回退
    if (globalUa && globalUa.enabled && globalUa.ua && globalUa.ua.trim()) {
      return globalUa.ua.trim();
    }

    return null;
  }

  try {
    const hostname = window.location.hostname;
    if (!hostname) return;

    chrome.storage.local.get(['siteUaMap', 'globalUa', 'webrtcPolicy'], (data) => {
      if (chrome.runtime.lastError || !data) return;

      const siteUaMap = data.siteUaMap || {};
      const globalUa = data.globalUa || { enabled: false, ua: '' };
      const webrtcPolicy = data.webrtcPolicy || 'disable_non_proxied_udp';

      const targetUa = findMatchingUa(hostname, siteUaMap, globalUa);
      const shouldBlockWebRtc = (webrtcPolicy === 'block_api');

      if (targetUa || shouldBlockWebRtc) {
        injectMainWorldScript(targetUa, shouldBlockWebRtc);
      }
    });
  } catch (e) {
    // 忽略异常
  }

  // 通过外部脚本文件而非内联脚本执行，符合标准 CSP 规范
  function injectMainWorldScript(ua, blockWebRtc) {
    try {
      const docEl = document.documentElement || document.head;
      if (!docEl) return;

      if (ua) {
        docEl.setAttribute('data-switcher-ua', ua);
      }
      if (blockWebRtc) {
        docEl.setAttribute('data-switcher-block-webrtc', 'true');
      }

      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('inject.js');
      script.onload = function () {
        script.remove();
      };
      (document.head || document.documentElement).appendChild(script);
    } catch (e) {}
  }
})();
