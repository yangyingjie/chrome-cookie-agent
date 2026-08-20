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

    // 初始化 Auto-PiP 设置 (默认开启 true)
    chrome.storage.local.get(['autoPipEnabled'], (res) => {
      if (chrome.runtime.lastError) return;
      const isAutoPipOn = (res && res.autoPipEnabled !== undefined) ? Boolean(res.autoPipEnabled) : true;
      if (typeof window !== 'undefined' && window.__CHROME_PIP_ENGINE__) {
        window.__CHROME_PIP_ENGINE__.initAutoPip(isAutoPipOn);
      }
    });

    // 初始化倍速与音量增强引擎
    function syncPageSpeedSettings(forcedSpeed) {
      chrome.storage.local.get(['globalSpeed', 'siteSpeedMap', 'speedPreservePitch', 'speedHotkeysEnabled', 'speedScope'], (data) => {
        if (chrome.runtime.lastError || !data) return;
        const speedScope = data.speedScope || 'global';
        const siteSpeedMap = data.siteSpeedMap || {};
        const globalSpeed = (data.globalSpeed !== undefined) ? Number(data.globalSpeed) : 1.0;
        const pitch = (data.speedPreservePitch !== undefined) ? Boolean(data.speedPreservePitch) : true;
        const hotkeys = (data.speedHotkeysEnabled !== undefined) ? Boolean(data.speedHotkeysEnabled) : true;

        const cleanHost = normalizeDomain(window.location.hostname);
        let targetSpeed = globalSpeed;
        let targetVolume = 1.0;

        if (speedScope === 'site' && cleanHost && siteSpeedMap[cleanHost]) {
          const siteCfg = siteSpeedMap[cleanHost];
          if (siteCfg.speed !== undefined) targetSpeed = Number(siteCfg.speed);
          if (siteCfg.volumeBoost !== undefined) targetVolume = Number(siteCfg.volumeBoost);
        } else if (cleanHost && siteSpeedMap[cleanHost] && siteSpeedMap[cleanHost].volumeBoost !== undefined) {
          targetVolume = Number(siteSpeedMap[cleanHost].volumeBoost);
        }

        if (forcedSpeed !== undefined) {
          targetSpeed = Number(forcedSpeed);
        }

        if (typeof window !== 'undefined' && window.__CHROME_SPEED_ENGINE__) {
          const currentEngineSpeed = window.__CHROME_SPEED_ENGINE__.getSpeedStatus().speed;
          if (Math.abs(currentEngineSpeed - targetSpeed) > 0.001 || forcedSpeed !== undefined) {
            window.__CHROME_SPEED_ENGINE__.setSpeed(targetSpeed, pitch, false);
          }
          window.__CHROME_SPEED_ENGINE__.setVolumeBoost(targetVolume, false);
          window.__CHROME_SPEED_ENGINE__.setupHotkeys(hotkeys);
          window.__CHROME_SPEED_ENGINE__.initMediaObserver();
        }
      });
    }

    syncPageSpeedSettings();

    let isInternalSpeedUpdate = false;

    // 监听 storage 变更自动同步
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local') {
        if (changes.autoPipEnabled && typeof window !== 'undefined' && window.__CHROME_PIP_ENGINE__) {
          window.__CHROME_PIP_ENGINE__.initAutoPip(Boolean(changes.autoPipEnabled.newValue));
        }
        if (changes.speedHotkeysEnabled && typeof window !== 'undefined' && window.__CHROME_SPEED_ENGINE__) {
          window.__CHROME_SPEED_ENGINE__.setupHotkeys(Boolean(changes.speedHotkeysEnabled.newValue));
        }
        if (!isInternalSpeedUpdate) {
          if (changes.globalSpeed || changes.siteSpeedMap || changes.speedPreservePitch || changes.speedHotkeysEnabled || changes.speedScope) {
            syncPageSpeedSettings();
          }
        }
      }
    });

    // 监听页面内快捷键等触发的倍速变更，全局自动持久化保存到 storage
    window.addEventListener('chrome_speed_changed', (e) => {
      if (!e || !e.detail) return;
      const newSpeed = Number(e.detail.speed);
      if (!isNaN(newSpeed)) {
        isInternalSpeedUpdate = true;
        chrome.storage.local.get(['speedScope', 'siteSpeedMap'], (data) => {
          const scope = data.speedScope || 'global';
          if (scope === 'global') {
            chrome.storage.local.set({ globalSpeed: newSpeed }, () => {
              setTimeout(() => { isInternalSpeedUpdate = false; }, 200);
            });
          } else {
            const cleanHost = normalizeDomain(window.location.hostname);
            const siteMap = data.siteSpeedMap || {};
            if (!siteMap[cleanHost]) siteMap[cleanHost] = {};
            siteMap[cleanHost].speed = newSpeed;
            chrome.storage.local.set({ siteSpeedMap: siteMap }, () => {
              setTimeout(() => { isInternalSpeedUpdate = false; }, 200);
            });
          }
        });
      }
    });

    // 监听来自 Background / Popup 的画中画与倍速调度指令
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      // 1. 画中画指令
      if (request.type === 'GET_PIP_STATUS' || request.type === 'CHECK_PIP_STATUS') {
        if (typeof window !== 'undefined' && window.__CHROME_PIP_ENGINE__) {
          sendResponse(window.__CHROME_PIP_ENGINE__.getPipStatus());
        } else {
          sendResponse({ supported: false, totalVideos: 0, playingVideos: 0, isInPip: false });
        }
        return false;
      }

      if (request.type === 'TOGGLE_PIP') {
        if (typeof window !== 'undefined' && window.__CHROME_PIP_ENGINE__) {
          window.__CHROME_PIP_ENGINE__.togglePictureInPicture()
            .then(result => sendResponse(result))
            .catch(err => sendResponse({ success: false, error: err.name || 'PIP_ERROR', message: err.message }));
          return true; // 异步响应
        } else {
          sendResponse({ success: false, error: 'ENGINE_NOT_LOADED', message: '画中画引擎未在页面载入' });
          return false;
        }
      }

      if (request.type === 'SET_AUTO_PIP') {
        if (typeof window !== 'undefined' && window.__CHROME_PIP_ENGINE__) {
          window.__CHROME_PIP_ENGINE__.initAutoPip(Boolean(request.enabled));
        }
        sendResponse({ success: true });
        return false;
      }

      // 2. 媒体倍速与音量增强指令
      if (request.type === 'GET_SPEED_STATUS') {
        if (typeof window !== 'undefined' && window.__CHROME_SPEED_ENGINE__) {
          sendResponse(window.__CHROME_SPEED_ENGINE__.getSpeedStatus());
        } else {
          sendResponse({ speed: 1.0, volumeBoost: 1.0, preservesPitch: true, mediaCount: 0 });
        }
        return false;
      }

      if (request.type === 'SET_SPEED') {
        if (typeof window !== 'undefined' && window.__CHROME_SPEED_ENGINE__) {
          const res = window.__CHROME_SPEED_ENGINE__.setSpeed(request.speed, request.pitch, Boolean(request.showToast));
          sendResponse({ success: true, ...res });
        } else {
          sendResponse({ success: false, error: 'ENGINE_NOT_LOADED' });
        }
        return false;
      }

      if (request.type === 'SET_VOLUME_BOOST') {
        if (typeof window !== 'undefined' && window.__CHROME_SPEED_ENGINE__) {
          const res = window.__CHROME_SPEED_ENGINE__.setVolumeBoost(request.boost, Boolean(request.showToast));
          sendResponse({ success: true, ...res });
        } else {
          sendResponse({ success: false, error: 'ENGINE_NOT_LOADED' });
        }
        return false;
      }

      if (request.type === 'SEEK_RELATIVE') {
        if (typeof window !== 'undefined' && window.__CHROME_SPEED_ENGINE__) {
          window.__CHROME_SPEED_ENGINE__.seekRelative(request.seconds);
          sendResponse({ success: true });
        }
        return false;
      }

      if (request.type === 'TOGGLE_PLAY_PAUSE') {
        if (typeof window !== 'undefined' && window.__CHROME_SPEED_ENGINE__) {
          window.__CHROME_SPEED_ENGINE__.togglePlayPause();
          sendResponse({ success: true });
        }
        return false;
      }
    });

    // 页面内直接监听 Alt+P (Mac: Option+P) 快捷键，具备直接的用户手势激活权限 (User Gesture)
    window.addEventListener('keydown', async (e) => {
      if (e.altKey && (e.code === 'KeyP' || e.key === 'p' || e.key === 'P')) {
        const activeEl = document.activeElement;
        const tag = activeEl ? activeEl.tagName.toLowerCase() : '';
        if (tag === 'input' || tag === 'textarea' || (activeEl && activeEl.isContentEditable)) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        if (typeof window !== 'undefined' && window.__CHROME_PIP_ENGINE__) {
          await window.__CHROME_PIP_ENGINE__.togglePictureInPicture();
        }
      }
    }, true);
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
