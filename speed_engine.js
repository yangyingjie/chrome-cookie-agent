// speed_engine.js - Global Speed 全能视频/音频倍速与媒体增强引擎
// 支持 0.05x-16.0x 无极倍速、Shadow DOM 穿透、音量增强(最高600%)、音调保持与防冲突快捷键

(function (global) {
  'use strict';

  // 核心状态
  let currentSpeed = 1.0;
  let currentVolumeBoost = 1.0; // 1.0 = 100%, 6.0 = 600%
  let preservesPitch = true;
  let hotkeysEnabled = true;
  let observerInitialized = false;

  // Web Audio 增强节点缓存映射 (WeakMap 防止内存泄漏)
  const audioContextMap = new WeakMap();

  // 1. 递归扫描当前文档及所有 Shadow Root 中的所有 <video> 和 <audio> 媒体元素
  function findAllMedia(root) {
    if (!root) {
      root = (typeof document !== 'undefined') ? document : null;
    }
    if (!root) return [];

    const mediaList = [];

    // 1. getElementsByTagName 快速获取
    if (typeof root.getElementsByTagName === 'function') {
      try {
        const vList = root.getElementsByTagName('video');
        for (let i = 0; i < vList.length; i++) {
          if (!mediaList.includes(vList[i])) mediaList.push(vList[i]);
        }
        const aList = root.getElementsByTagName('audio');
        for (let i = 0; i < aList.length; i++) {
          if (!mediaList.includes(aList[i])) mediaList.push(aList[i]);
        }
      } catch (e) {}
    }

    // 2. 直接通过 querySelectorAll 检索当前根
    if (typeof root.querySelectorAll === 'function') {
      try {
        const directList = root.querySelectorAll('video, audio');
        for (let i = 0; i < directList.length; i++) {
          if (!mediaList.includes(directList[i])) {
            mediaList.push(directList[i]);
          }
        }
      } catch (e) {}
    }

    // 3. 递归遍历子节点与 Shadow DOM
    try {
      const walkerRoot = root.body || root.documentElement || root;
      if (walkerRoot && typeof document !== 'undefined' && document.createTreeWalker) {
        const walker = document.createTreeWalker(
          walkerRoot,
          NodeFilter.SHOW_ELEMENT,
          null
        );

        let node = walker.currentNode;
        while (node) {
          if (node.tagName) {
            const tag = node.tagName.toLowerCase();
            if (tag === 'video' || tag === 'audio') {
              if (!mediaList.includes(node)) {
                mediaList.push(node);
              }
            }
          }

          // 深入 Shadow DOM
          if (node.shadowRoot) {
            const shadowMedia = findAllMedia(node.shadowRoot);
            for (let j = 0; j < shadowMedia.length; j++) {
              if (!mediaList.includes(shadowMedia[j])) {
                mediaList.push(shadowMedia[j]);
              }
            }
          }

          node = walker.nextNode();
        }
      }
    } catch (e) {}

    return mediaList;
  }

  // 2. 将倍速与音调配置应用到单个媒体元素
  function applyToMediaElement(media, speed, pitch) {
    if (!media) return;

    try {
      const targetSpeed = Math.max(0.05, Math.min(16.0, Math.round(Number(speed) * 100) / 100));
      const targetPitch = Boolean(pitch !== undefined ? pitch : preservesPitch);

      media.__prevent_rate_loop__ = true;
      try {
        if (Math.abs(media.playbackRate - targetSpeed) > 0.001) {
          media.playbackRate = targetSpeed;
        }
        if (Math.abs(media.defaultPlaybackRate - targetSpeed) > 0.001) {
          media.defaultPlaybackRate = targetSpeed;
        }
      } finally {
        media.__prevent_rate_loop__ = false;
      }

      // 音调保持 (Preserve Pitch)
      if ('preservesPitch' in media) {
        media.preservesPitch = targetPitch;
      }
      if ('mozPreservesPitch' in media) {
        media.mozPreservesPitch = targetPitch;
      }
      if ('webkitPreservesPitch' in media) {
        media.webkitPreservesPitch = targetPitch;
      }

      // 绑定防回弹监听器
      if (!media.__speed_listener_attached__) {
        media.__speed_listener_attached__ = true;
        media.addEventListener('ratechange', () => {
          if (media.__prevent_rate_loop__) return;
          // 若网页自身脚本强行将倍速改回 1.0 或其它值，则重新强制应用用户当前倍速
          if (Math.abs(media.playbackRate - currentSpeed) > 0.01) {
            media.__prevent_rate_loop__ = true;
            try {
              media.playbackRate = currentSpeed;
            } catch (e) {}
            media.__prevent_rate_loop__ = false;
          }
        });
      }
    } catch (e) {}
  }

  // 3. Web Audio API 音量放大增强 (Volume Booster up to 600%)
  function applyVolumeBoostToMedia(media, boost) {
    if (!media) return;
    const targetGain = Math.max(0, Math.min(6.0, Number(boost) || 1.0));

    // 如果是 1.0 且尚未创建 AudioContext，则保持原生播放链路
    if (targetGain === 1.0 && !audioContextMap.has(media)) {
      return;
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      let ctxInfo = audioContextMap.get(media);
      if (!ctxInfo) {
        const audioCtx = new AudioCtx();
        const sourceNode = audioCtx.createMediaElementSource(media);
        const gainNode = audioCtx.createGain();

        sourceNode.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        ctxInfo = { audioCtx, sourceNode, gainNode };
        audioContextMap.set(media, ctxInfo);
      }

      if (ctxInfo.audioCtx.state === 'suspended') {
        ctxInfo.audioCtx.resume().catch(() => {});
      }

      ctxInfo.gainNode.gain.setValueAtTime(targetGain, ctxInfo.audioCtx.currentTime);
    } catch (e) {
      // 部分受 CORS 保护的音频源或已连接源可能抛出异常，优雅降级
    }
  }

  // 4. 设置全局/当前页面倍速
  function setSpeed(speed, pitch, showToast = false) {
    currentSpeed = Math.max(0.05, Math.min(16.0, Math.round(Number(speed) * 100) / 100));
    if (pitch !== undefined) {
      preservesPitch = Boolean(pitch);
    }

    const allMedia = findAllMedia();
    for (let i = 0; i < allMedia.length; i++) {
      applyToMediaElement(allMedia[i], currentSpeed, preservesPitch);
    }

    if (showToast) {
      showMediaToast(`⚡ 倍速: ${currentSpeed.toFixed(2)}x`);
    }

    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      try {
        window.dispatchEvent(new CustomEvent('chrome_speed_changed', {
          detail: { speed: currentSpeed, pitch: preservesPitch }
        }));
      } catch (e) {}
    }

    return {
      speed: currentSpeed,
      preservesPitch,
      mediaCount: allMedia.length
    };
  }

  // 5. 设置音量放大增强
  function setVolumeBoost(boost, showToast = false) {
    currentVolumeBoost = Math.max(0, Math.min(6.0, Math.round(Number(boost) * 100) / 100));
    const allMedia = findAllMedia();
    for (let i = 0; i < allMedia.length; i++) {
      applyVolumeBoostToMedia(allMedia[i], currentVolumeBoost);
    }

    if (showToast) {
      const pct = Math.round(currentVolumeBoost * 100);
      showMediaToast(`🔊 音量: ${pct}%`);
    }

    return {
      volumeBoost: currentVolumeBoost,
      mediaCount: allMedia.length
    };
  }

  // 6. 快进/快退/播放控制
  function seekRelative(seconds) {
    const allMedia = findAllMedia();
    const activeMedia = allMedia.find(m => !m.paused && m.currentTime > 0) || allMedia[0];
    if (activeMedia) {
      try {
        activeMedia.currentTime = Math.max(0, activeMedia.currentTime + seconds);
        const icon = seconds > 0 ? '⏩' : '⏪';
        showMediaToast(`${icon} ${seconds > 0 ? '+' : ''}${seconds}s (${formatTime(activeMedia.currentTime)})`);
      } catch (e) {}
    }
  }

  function togglePlayPause() {
    const allMedia = findAllMedia();
    const activeMedia = allMedia.find(m => !m.paused && m.currentTime > 0) || allMedia[0];
    if (activeMedia) {
      try {
        if (activeMedia.paused) {
          activeMedia.play().catch(() => {});
          showMediaToast('▶ 播放');
        } else {
          activeMedia.pause();
          showMediaToast('⏸ 暂停');
        }
      } catch (e) {}
    }
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  // 7. 屏幕轻量 Toast 提示
  let toastTimeout = null;
  function showMediaToast(text) {
    if (typeof document === 'undefined') return;

    try {
      let toast = document.getElementById('__chrome_media_speed_toast__');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = '__chrome_media_speed_toast__';
        if (toast.style) {
          toast.style.cssText = `
            position: fixed;
            top: 24px;
            right: 24px;
            background: rgba(19, 78, 47, 0.9);
            color: #f0fdf4;
            padding: 8px 14px;
            border-radius: 8px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 0.5px;
            z-index: 2147483647;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
            pointer-events: none;
            transition: opacity 0.2s ease, transform 0.2s ease;
            opacity: 0;
            transform: translateY(-4px);
            backdrop-filter: blur(4px);
            border: 1px solid rgba(167, 207, 175, 0.4);
          `;
        }
        (document.body || document.documentElement).appendChild(toast);
      }

      toast.textContent = text;
      if (toast.style) {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
      }

      if (toastTimeout) clearTimeout(toastTimeout);
      toastTimeout = setTimeout(() => {
        if (toast && toast.style) {
          toast.style.opacity = '0';
          toast.style.transform = 'translateY(-4px)';
        }
      }, 900);
    } catch (e) {}
  }

  // 8. 监听 DOM 树动态增删元素 (DOM Mutation Observer)
  function initMediaObserver() {
    if (observerInitialized || typeof MutationObserver === 'undefined' || typeof document === 'undefined') return;
    observerInitialized = true;

    const observer = new MutationObserver((mutations) => {
      let hasNewMedia = false;
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType === 1) {
            if (node.tagName === 'VIDEO' || node.tagName === 'AUDIO' || (node.querySelector && node.querySelector('video, audio'))) {
              hasNewMedia = true;
              break;
            }
          }
        }
        if (hasNewMedia) break;
      }

      if (hasNewMedia) {
        const allMedia = findAllMedia();
        for (let i = 0; i < allMedia.length; i++) {
          applyToMediaElement(allMedia[i], currentSpeed, preservesPitch);
          if (currentVolumeBoost !== 1.0) {
            applyVolumeBoostToMedia(allMedia[i], currentVolumeBoost);
          }
        }
      }
    });

    try {
      const target = document.body || document.documentElement;
      if (target) {
        observer.observe(target, { childList: true, subtree: true });
      }
    } catch (e) {}
  }

  // 9. 智能防冲突快捷键处理器
  function setupHotkeys(enabled = true) {
    hotkeysEnabled = Boolean(enabled);
    if (typeof window !== 'undefined') {
      window.__CHROME_SPEED_HOTKEYS_ENABLED__ = hotkeysEnabled;
    }
    return { hotkeysEnabled };
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', (e) => {
      if (!hotkeysEnabled || window.__CHROME_SPEED_HOTKEYS_ENABLED__ === false) return;

      // 检查当前焦点是否在可输入区域，智能避让防冲突
      const activeEl = document.activeElement;
      if (activeEl) {
        const tag = activeEl.tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select' || activeEl.isContentEditable) {
          return;
        }
      }

      // 检查是否按下 Command / Ctrl / Meta 键以避免系统快捷键冲突
      if (e.ctrlKey || e.metaKey) return;

      const key = e.key;
      const code = e.code;

      // 加速: D / d 或 ] (大D 加速)
      if (key === 'd' || key === 'D' || key === ']' || code === 'KeyD') {
        e.preventDefault();
        const newSpeed = Math.min(16.0, currentSpeed + 0.1);
        setSpeed(newSpeed, preservesPitch, true);
        return;
      }

      // 减速: A / a 或 [ (大A 减速)
      if (key === 'a' || key === 'A' || key === '[' || code === 'KeyA') {
        e.preventDefault();
        const newSpeed = Math.max(0.05, currentSpeed - 0.1);
        setSpeed(newSpeed, preservesPitch, true);
        return;
      }

      // 恢复正常速度 1.0x: S / s 或 r / R (大S 恢复正常速度)
      if (key === 's' || key === 'S' || key === 'r' || key === 'R' || code === 'KeyS') {
        e.preventDefault();
        setSpeed(1.0, preservesPitch, true);
        return;
      }

      // 快退 5 秒: z / Z
      if (key === 'z' || key === 'Z') {
        e.preventDefault();
        seekRelative(-5);
        return;
      }

      // 快进 5 秒: x / X
      if (key === 'x' || key === 'X') {
        e.preventDefault();
        seekRelative(5);
        return;
      }

      // 切换播放/暂停: c / C
      if (key === 'c' || key === 'C') {
        e.preventDefault();
        togglePlayPause();
        return;
      }
    }, true);
  }

  // 10. 获取当前倍速与媒体状态
  function getSpeedStatus() {
    const allMedia = findAllMedia();
    return {
      speed: currentSpeed,
      volumeBoost: currentVolumeBoost,
      preservesPitch,
      hotkeysEnabled,
      mediaCount: allMedia.length,
      hasMedia: allMedia.length > 0
    };
  }

  const SpeedEngine = {
    findAllMedia,
    setSpeed,
    setVolumeBoost,
    seekRelative,
    togglePlayPause,
    getSpeedStatus,
    initMediaObserver,
    setupHotkeys
  };

  // 挂载到全局与模块导出
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpeedEngine;
  }
  if (typeof global !== 'undefined') {
    global.__CHROME_SPEED_ENGINE__ = SpeedEngine;
  }

})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
