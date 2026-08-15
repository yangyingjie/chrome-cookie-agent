// Main World Injector - 运行于网页主环境，规避 CSP inline-script 拦截

(function () {
  try {
    const root = document.documentElement;
    if (!root) return;

    const customUA = root.getAttribute('data-switcher-ua');
    const blockWebRtc = root.getAttribute('data-switcher-block-webrtc') === 'true';

    // 1. User-Agent 与 JS 浏览器指纹伪装
    if (customUA) {
      try {
        Object.defineProperty(navigator, 'userAgent', {
          get: () => customUA,
          configurable: true
        });
        Object.defineProperty(navigator, 'appVersion', {
          get: () => customUA,
          configurable: true
        });

        let plat = navigator.platform;
        if (customUA.includes('iPhone') || customUA.includes('iPad')) {
          plat = 'iPhone';
        } else if (customUA.includes('Macintosh') || customUA.includes('Mac OS X')) {
          plat = 'MacIntel';
        } else if (customUA.includes('Linux') && customUA.includes('Android')) {
          plat = 'Linux armv8l';
        } else if (customUA.includes('Windows NT')) {
          plat = 'Win32';
        }

        Object.defineProperty(navigator, 'platform', {
          get: () => plat,
          configurable: true
        });

        if (navigator.userAgentData) {
          Object.defineProperty(navigator, 'userAgentData', {
            get: () => undefined,
            configurable: true
          });
        }
      } catch (e) {}
    }

    // 2. WebRTC API 彻底拦截与屏蔽
    if (blockWebRtc) {
      try {
        const blockMessage = 'WebRTC is disabled by WebRTC Control';
        if (window.RTCPeerConnection) {
          window.RTCPeerConnection = function () {
            throw new Error(blockMessage);
          };
        }
        if (window.webkitRTCPeerConnection) {
          window.webkitRTCPeerConnection = function () {
            throw new Error(blockMessage);
          };
        }
        if (window.RTCSessionDescription) {
          window.RTCSessionDescription = function () {
            throw new Error(blockMessage);
          };
        }
        if (window.RTCDataChannel) {
          window.RTCDataChannel = function () {
            throw new Error(blockMessage);
          };
        }
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          navigator.mediaDevices.getUserMedia = function () {
            return Promise.reject(new Error(blockMessage));
          };
        }
      } catch (e) {}
    }

    // 清理临时 DOM 标记
    root.removeAttribute('data-switcher-ua');
    root.removeAttribute('data-switcher-block-webrtc');
  } catch (e) {}
})();
