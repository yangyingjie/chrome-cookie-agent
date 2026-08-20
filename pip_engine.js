// pip_engine.js - 画中画 (Picture-in-Picture) 核心引擎
// 支持标准 DOM / Shadow DOM 穿透检索、自动解除网站 disablePictureInPicture 限制、多视频智能权重优选与 Auto-PiP

(function (global) {
  'use strict';

  // 1. 递归检索当前文档及所有 Shadow Root 中的所有 <video> 元素
  function findAllVideos(root) {
    if (!root) {
      root = (typeof document !== 'undefined') ? document : null;
    }
    if (!root) return [];

    const videos = [];

    // 1. getElementsByTagName 快速获取
    if (typeof root.getElementsByTagName === 'function') {
      try {
        const vList = root.getElementsByTagName('video');
        for (let i = 0; i < vList.length; i++) {
          if (!videos.includes(vList[i])) videos.push(vList[i]);
        }
      } catch (e) {}
    }

    // 2. 直接通过 querySelectorAll 检索当前根
    if (typeof root.querySelectorAll === 'function') {
      try {
        const directVideos = root.querySelectorAll('video');
        for (let i = 0; i < directVideos.length; i++) {
          if (!videos.includes(directVideos[i])) {
            videos.push(directVideos[i]);
          }
        }
      } catch (e) {}
    }

    // 3. 递归遍历所有子节点检索 Shadow DOM 与自定义播放器
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
          if (node.tagName && node.tagName.toLowerCase() === 'video') {
            if (!videos.includes(node)) {
              videos.push(node);
            }
          }

          // 检查并深入 open 或 closed shadowRoot
          if (node.shadowRoot) {
            const shadowVideos = findAllVideos(node.shadowRoot);
            for (let j = 0; j < shadowVideos.length; j++) {
              if (!videos.includes(shadowVideos[j])) {
                videos.push(shadowVideos[j]);
              }
            }
          }

          node = walker.nextNode();
        }
      }
    } catch (e) {
      // 容错处理
    }

    return videos;
  }

  // 2. 解除目标视频的画中画禁用限制 (Bypass disablePictureInPicture)
  function unlockVideoRestrictions(video) {
    if (!video) return;
    try {
      if (video.disablePictureInPicture) {
        video.disablePictureInPicture = false;
      }
      if (typeof video.removeAttribute === 'function' && video.hasAttribute('disablepictureinpicture')) {
        video.removeAttribute('disablepictureinpicture');
      }
    } catch (e) {}
  }

  // 3. 计算单个视频的优先级评分权重
  function calculateVideoScore(video) {
    if (!video) return -1;

    let score = 0;
    const isPlaying = !video.paused && !video.ended && video.currentTime > 0;
    const isReady = video.readyState > 0 || video.duration > 0;

    // 正在播放中的视频权重极高 (+1,000,000)
    if (isPlaying) {
      score += 1000000;
    }

    // 处于就绪状态 (+10,000)
    if (isReady) {
      score += 10000;
    }

    // 画面尺寸评分 (面积越大，为主播放器的可能性越高)
    let width = video.clientWidth || video.videoWidth || video.offsetWidth || 0;
    let height = video.clientHeight || video.videoHeight || video.offsetHeight || 0;

    // 如果获取不到，尝试 getBoundingClientRect
    if (width === 0 && height === 0 && typeof video.getBoundingClientRect === 'function') {
      try {
        const rect = video.getBoundingClientRect();
        width = rect.width || 0;
        height = rect.height || 0;
      } catch (e) {}
    }

    score += Math.min(width * height, 500000);

    // 检查可见性与样式
    if (typeof window !== 'undefined' && window.getComputedStyle) {
      try {
        const style = window.getComputedStyle(video);
        if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) {
          score -= 50000;
        }
      } catch (e) {}
    }

    return score;
  }

  // 4. 智能查找页面中最佳的目标视频
  function findBestVideo(root) {
    const videos = findAllVideos(root);
    if (!videos || videos.length === 0) {
      return null;
    }

    // 解除所有视频的限制
    for (let i = 0; i < videos.length; i++) {
      unlockVideoRestrictions(videos[i]);
    }

    // 按评分倒序排序
    videos.sort((a, b) => calculateVideoScore(b) - calculateVideoScore(a));

    return videos[0];
  }

  // 5. 获取当前页面的画中画与视频综合状态
  function getPipStatus(root) {
    const doc = (typeof document !== 'undefined') ? document : null;
    const isPipSupported = Boolean(doc && (doc.pictureInPictureEnabled || ('pictureInPictureEnabled' in doc)));
    const pipElement = doc ? doc.pictureInPictureElement : null;
    const allVideos = findAllVideos(root);

    let playingCount = 0;
    for (let i = 0; i < allVideos.length; i++) {
      const v = allVideos[i];
      if (!v.paused && !v.ended && v.currentTime > 0) {
        playingCount++;
      }
    }

    return {
      supported: isPipSupported,
      isInPip: Boolean(pipElement),
      totalVideos: allVideos.length,
      playingVideos: playingCount,
      pipVideoSrc: pipElement ? (pipElement.currentSrc || pipElement.src || '') : ''
    };
  }

  // 6. 核心画中画切换操作 (Toggle Picture-in-Picture)
  async function togglePictureInPicture(root) {
    const doc = (typeof document !== 'undefined') ? document : null;
    if (!doc) {
      return { success: false, error: 'NO_DOCUMENT', message: '当前环境无可用文档对象' };
    }

    // 检查浏览器是否支持 PiP API
    if (!doc.pictureInPictureEnabled && typeof HTMLVideoElement !== 'undefined' && !HTMLVideoElement.prototype.requestPictureInPicture) {
      return { success: false, error: 'NOT_SUPPORTED', message: '当前浏览器环境不支持 Picture-in-Picture API' };
    }

    // 1. 如果当前已经处于画中画模式，则退出画中画
    if (doc.pictureInPictureElement) {
      try {
        await doc.exitPictureInPicture();
        return {
          success: true,
          action: 'exited',
          message: '已成功退出画中画模式'
        };
      } catch (err) {
        return {
          success: false,
          error: err.name || 'EXIT_FAILED',
          message: `退出画中画失败: ${err.message}`
        };
      }
    }

    // 2. 否则查找最合适的目标视频并进入画中画
    const bestVideo = findBestVideo(root);
    if (!bestVideo) {
      return {
        success: false,
        error: 'NO_VIDEO_FOUND',
        message: '当前网页未检测到可用的视频元素 (<video>)'
      };
    }

    unlockVideoRestrictions(bestVideo);

    try {
      if (typeof bestVideo.requestPictureInPicture === 'function') {
        const pipWindow = await bestVideo.requestPictureInPicture();
        return {
          success: true,
          action: 'entered',
          message: '已成功开启画中画模式',
          videoSrc: bestVideo.currentSrc || bestVideo.src || '',
          width: pipWindow ? pipWindow.width : undefined,
          height: pipWindow ? pipWindow.height : undefined
        };
      } else {
        return {
          success: false,
          error: 'METHOD_UNAVAILABLE',
          message: '目标视频元素未提供 requestPictureInPicture 方法'
        };
      }
    } catch (err) {
      return {
        success: false,
        error: err.name || 'REQUEST_FAILED',
        message: `开启画中画失败: ${err.message}`
      };
    }
  }

  // 7. Auto-PiP (离开标签页时自动开启画中画) 控制器
  let autoPipInitialized = false;
  let autoPipWasTriggered = false;

  function initAutoPip(enabled) {
    if (typeof document === 'undefined') return;

    const isEnabled = Boolean(enabled);
    if (typeof window !== 'undefined') {
      window.__CHROME_PIP_AUTO_ENABLED__ = isEnabled;
    }

    // 1. 在所有视频上配置 autoPictureInPicture 属性与解除禁用
    try {
      const videos = findAllVideos();
      for (let i = 0; i < videos.length; i++) {
        unlockVideoRestrictions(videos[i]);
        if (isEnabled) {
          try { videos[i].autoPictureInPicture = true; } catch (e) {}
        }
      }
    } catch (e) {}

    // 2. 注册原生 Media Session API 的 enterpictureinpicture 动作处理器 (Chrome 推荐的自动化画中画规范)
    if (typeof navigator !== 'undefined' && navigator.mediaSession && typeof navigator.mediaSession.setActionHandler === 'function') {
      try {
        navigator.mediaSession.setActionHandler('enterpictureinpicture', async (details) => {
          if (window.__CHROME_PIP_AUTO_ENABLED__) {
            const status = getPipStatus();
            if (status.playingVideos > 0 && !status.isInPip) {
              await togglePictureInPicture();
            }
          }
        });
      } catch (e) {}
    }

    // 3. 监听 visibilitychange 事件作为兜底方案
    if (!autoPipInitialized) {
      autoPipInitialized = true;
      document.addEventListener('visibilitychange', async () => {
        if (!window.__CHROME_PIP_AUTO_ENABLED__) return;

        if (document.hidden) {
          // 标签页被隐藏 / 切换至其他标签
          const status = getPipStatus();
          // 若有正在播放的视频且未处于画中画，则尝试进入
          if (status.playingVideos > 0 && !status.isInPip) {
            const result = await togglePictureInPicture();
            if (result && result.success && result.action === 'entered') {
              autoPipWasTriggered = true;
            }
          }
        } else {
          // 标签页重新变为可见，若是由 Auto-PiP 触发进入的，重置标记
          autoPipWasTriggered = false;
        }
      });
    }
  }

  const PipEngine = {
    findAllVideos,
    unlockVideoRestrictions,
    calculateVideoScore,
    findBestVideo,
    getPipStatus,
    togglePictureInPicture,
    initAutoPip
  };

  // 挂载到全局与模块导出
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PipEngine;
  }
  if (typeof global !== 'undefined') {
    global.__CHROME_PIP_ENGINE__ = PipEngine;
  }

})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
