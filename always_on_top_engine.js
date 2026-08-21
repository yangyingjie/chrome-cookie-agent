// always_on_top_engine.js - Document Picture-in-Picture & Always-On-Top Dual Engine
// Implements W3C Document Picture-in-Picture API with fallback popup window, in-window navigation bar, stylesheet copying, and preset dimensions.

(function (global) {
  'use strict';

  const PRESETS = {
    '360p': { width: 480, height: 270, aspectRatio: '16:9', label: '360p (480x270)' },
    '480p': { width: 640, height: 360, aspectRatio: '16:9', label: '480p (640x360)' },
    '720p': { width: 1280, height: 720, aspectRatio: '16:9', label: '720p (1280x720)' },
    'portrait': { width: 375, height: 667, aspectRatio: '9:16', label: '竖屏 (375x667)' },
    'mobile': { width: 375, height: 667, aspectRatio: '9:16', label: '竖屏 (375x667)' }
  };

  const DEFAULT_PRESET = '480p';
  const MIN_WIDTH = 200;
  const MIN_HEIGHT = 150;
  const MAX_WIDTH = 3840;
  const MAX_HEIGHT = 2160;

  let currentPipWindow = null;
  let currentAotMode = null; // 'docpip' | 'popup'
  let currentDimensions = { width: 640, height: 360 };
  let currentUrl = '';
  let movedElementState = null; // { element, originalParent, placeholder }
  let fallbackActive = false;

  // 1. Feature Detection
  function isSupported() {
    return typeof window !== 'undefined' &&
      'documentPictureInPicture' in window &&
      Boolean(window.documentPictureInPicture && typeof window.documentPictureInPicture.requestWindow === 'function');
  }

  // 2. Preset Dimensions Helper
  function getPresetDimensions(presetKey, customW, customH) {
    if (presetKey === 'custom') {
      const w = parseInt(customW, 10);
      const h = parseInt(customH, 10);
      return {
        width: Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, !isNaN(w) && w > 0 ? w : 800)),
        height: Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, !isNaN(h) && h > 0 ? h : 600))
      };
    }

    const key = (presetKey || DEFAULT_PRESET).toString().toLowerCase();
    if (PRESETS[key]) {
      return {
        width: PRESETS[key].width,
        height: PRESETS[key].height
      };
    }

    // Direct width/height fallback
    const w = parseInt(customW, 10);
    const h = parseInt(customH, 10);
    if (!isNaN(w) && w > 0 && !isNaN(h) && h > 0) {
      return {
        width: Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, w)),
        height: Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, h))
      };
    }

    return {
      width: PRESETS[DEFAULT_PRESET].width,
      height: PRESETS[DEFAULT_PRESET].height
    };
  }

  // 3. Fallback Popup Bounds Calculation
  function calculatePopupBounds(width, height, placement = 'bottom-right', screenBounds = null) {
    const w = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, Math.round(width || 640)));
    const h = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, Math.round(height || 360)));
    const margin = 24;

    const screenW = screenBounds?.availWidth || (typeof screen !== 'undefined' ? screen.availWidth : 1920) || 1920;
    const screenH = screenBounds?.availHeight || (typeof screen !== 'undefined' ? screen.availHeight : 1080) || 1080;
    const screenLeft = screenBounds?.availLeft || (typeof screen !== 'undefined' ? screen.availLeft : 0) || 0;
    const screenTop = screenBounds?.availTop || (typeof screen !== 'undefined' ? screen.availTop : 0) || 0;

    let left = screenLeft + margin;
    let top = screenTop + margin;

    if (placement === 'bottom-right') {
      left = Math.max(screenLeft, screenLeft + screenW - w - margin);
      top = Math.max(screenTop, screenTop + screenH - h - margin);
    } else if (placement === 'top-right') {
      left = Math.max(screenLeft, screenLeft + screenW - w - margin);
      top = screenTop + margin;
    } else if (placement === 'center') {
      left = Math.max(screenLeft, screenLeft + Math.round((screenW - w) / 2));
      top = Math.max(screenTop, screenTop + Math.round((screenH - h) / 2));
    }

    return {
      width: w,
      height: h,
      left: Math.round(left),
      top: Math.round(top)
    };
  }

  // 4. Stylesheet Cloner & Injected Control Styles
  const NAVBAR_STYLES = `
    .aot-navbar-wrapper {
      position: fixed;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2147483647;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      user-select: none;
    }
    .aot-navbar {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 4px;
      background: rgba(18, 24, 38, 0.85);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 30px;
      padding: 4px 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
      opacity: 0.2;
      transform: translateY(-2px);
      transition: opacity 0.25s ease, transform 0.25s ease, background 0.2s ease;
    }
    .aot-navbar-wrapper:hover .aot-navbar,
    .aot-navbar.aot-active {
      opacity: 1;
      transform: translateY(0);
      background: rgba(18, 24, 38, 0.95);
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.45);
    }
    .aot-nav-btn {
      background: transparent;
      border: none;
      outline: none;
      cursor: pointer;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 5px;
      color: #e2e8f0;
      transition: all 0.15s ease;
    }
    .aot-nav-btn svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
    }
    .aot-nav-btn:hover {
      background: rgba(255, 255, 255, 0.18);
      color: #38bdf8;
    }
    .aot-btn-close:hover {
      background: rgba(239, 68, 68, 0.25);
      color: #f87171;
    }
    .aot-nav-divider {
      width: 1px;
      height: 16px;
      background: rgba(255, 255, 255, 0.2);
      margin: 0 2px;
    }
    .aot-toast {
      pointer-events: none;
      background: rgba(15, 23, 42, 0.94);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.3);
      font-size: 11px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 12px;
      opacity: 0;
      transform: translateY(-6px);
      transition: all 0.2s ease;
      white-space: nowrap;
    }
    .aot-toast.show {
      opacity: 1;
      transform: translateY(0);
    }
    iframe.aot-viewport {
      width: 100vw;
      height: 100vh;
      border: none;
      margin: 0;
      padding: 0;
      display: block;
      background: #000;
    }
  `;

  function copyStylesheetsToPip(pipDoc) {
    if (!pipDoc || !pipDoc.head) return;

    // 1. Copy link[rel="stylesheet"] and style elements
    if (typeof document !== 'undefined' && document.querySelectorAll) {
      try {
        const styleNodes = document.querySelectorAll('link[rel="stylesheet"], style');
        styleNodes.forEach(node => {
          try {
            pipDoc.head.appendChild(node.cloneNode(true));
          } catch (e) {}
        });
      } catch (e) {}

      // 2. Clone CSSStyleSheet rules (for constructed or inline sheets)
      if (document.styleSheets) {
        try {
          Array.from(document.styleSheets).forEach(sheet => {
            try {
              if (sheet.cssRules && !sheet.href) {
                const styleEl = pipDoc.createElement('style');
                let css = '';
                for (let i = 0; i < sheet.cssRules.length; i++) {
                  css += sheet.cssRules[i].cssText + '\n';
                }
                styleEl.appendChild(pipDoc.createTextNode(css));
                pipDoc.head.appendChild(styleEl);
              }
            } catch (e) {
              // Cross-origin CSS security block, safely ignore
            }
          });
        } catch (e) {}
      }
    }

    // 3. Inject Navbar and AOT Frame Styles
    try {
      const customStyle = pipDoc.createElement('style');
      customStyle.id = 'aot-injected-styles';
      customStyle.appendChild(pipDoc.createTextNode(NAVBAR_STYLES));
      pipDoc.head.appendChild(customStyle);
    } catch (e) {}
  }

  // 5. In-Window Floating Navigation Bar Creation
  function createFloatingNavBar(pipWindow, options = {}) {
    if (!pipWindow || !pipWindow.document) return null;
    const pipDoc = pipWindow.document;

    // Wrapper
    const wrapper = pipDoc.createElement('div');
    wrapper.className = 'aot-navbar-wrapper';
    wrapper.id = 'aotNavbarWrapper';

    // Navbar
    const navbar = pipDoc.createElement('nav');
    navbar.className = 'aot-navbar aot-active';
    navbar.id = 'aotNavbar';

    // Back Button
    const btnBack = pipDoc.createElement('button');
    btnBack.className = 'aot-nav-btn';
    btnBack.id = 'aotBtnBack';
    btnBack.title = '后退 (Back)';
    btnBack.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>';

    // Reload Button
    const btnReload = pipDoc.createElement('button');
    btnReload.className = 'aot-nav-btn';
    btnReload.id = 'aotBtnReload';
    btnReload.title = '刷新 (Reload)';
    btnReload.innerHTML = '<svg viewBox="0 0 24 24"><path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>';

    // Divider
    const divider = pipDoc.createElement('div');
    divider.className = 'aot-nav-divider';

    // Restore to Tab Button
    const btnRestore = pipDoc.createElement('button');
    btnRestore.className = 'aot-nav-btn';
    btnRestore.id = 'aotBtnRestore';
    btnRestore.title = '还原到标签页 (Restore to Tab)';
    btnRestore.innerHTML = '<svg viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>';

    // Copy URL Button
    const btnCopy = pipDoc.createElement('button');
    btnCopy.className = 'aot-nav-btn';
    btnCopy.id = 'aotBtnCopy';
    btnCopy.title = '复制链接 (Copy URL)';
    btnCopy.innerHTML = '<svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>';

    // Close Button
    const btnClose = pipDoc.createElement('button');
    btnClose.className = 'aot-nav-btn aot-btn-close';
    btnClose.id = 'aotBtnClose';
    btnClose.title = '关闭置顶窗口 (Close Window)';
    btnClose.innerHTML = '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';

    // Toast
    const toast = pipDoc.createElement('div');
    toast.className = 'aot-toast';
    toast.id = 'aotToast';
    toast.textContent = '链接已复制到剪贴板';

    navbar.appendChild(btnBack);
    navbar.appendChild(btnReload);
    navbar.appendChild(divider);
    navbar.appendChild(btnRestore);
    navbar.appendChild(btnCopy);
    navbar.appendChild(btnClose);

    wrapper.appendChild(navbar);
    wrapper.appendChild(toast);

    pipDoc.body.appendChild(wrapper);

    // Auto-fade timer logic
    let fadeTimer = null;
    function triggerFade() {
      navbar.classList.add('aot-active');
      if (fadeTimer) clearTimeout(fadeTimer);
      fadeTimer = setTimeout(() => {
        navbar.classList.remove('aot-active');
      }, 2500);
    }

    try {
      pipDoc.addEventListener('mousemove', triggerFade);
      triggerFade();
    } catch (e) {}

    // Button event bindings
    btnBack.addEventListener('click', () => {
      const iframe = pipDoc.querySelector('iframe.aot-viewport');
      if (iframe && iframe.contentWindow) {
        try {
          iframe.contentWindow.history.back();
          return;
        } catch (e) {}
      }
      try {
        pipWindow.history.back();
      } catch (e) {}
    });

    btnReload.addEventListener('click', () => {
      const iframe = pipDoc.querySelector('iframe.aot-viewport');
      if (iframe) {
        try {
          iframe.src = iframe.src;
          return;
        } catch (e) {}
      }
      try {
        pipWindow.location.reload();
      } catch (e) {}
    });

    btnCopy.addEventListener('click', async () => {
      const linkToCopy = options.targetUrl || (typeof window !== 'undefined' ? window.location.href : '');
      try {
        if (pipWindow.navigator && pipWindow.navigator.clipboard && pipWindow.navigator.clipboard.writeText) {
          await pipWindow.navigator.clipboard.writeText(linkToCopy);
        } else if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(linkToCopy);
        }
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 1800);
      } catch (e) {}
    });

    btnRestore.addEventListener('click', () => {
      const restoreUrl = options.targetUrl || (typeof window !== 'undefined' ? window.location.href : '');
      const openerId = options.openerTabId;
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        try {
          chrome.runtime.sendMessage({
            type: 'RESTORE_AOT_TO_TAB',
            tabId: openerId,
            url: restoreUrl
          });
        } catch (e) {}
      }
      try {
        pipWindow.close();
      } catch (e) {}
    });

    btnClose.addEventListener('click', () => {
      try {
        pipWindow.close();
      } catch (e) {}
    });

    return wrapper;
  }

  // 6. Fallback Popup Launcher
  async function openFallbackPopup(options = {}, width, height) {
    fallbackActive = true;
    currentAotMode = 'popup';
    currentDimensions = { width, height };
    currentUrl = options.targetUrl || (typeof window !== 'undefined' ? window.location.href : '');

    const bounds = calculatePopupBounds(width, height, options.placement || 'bottom-right');

    if (typeof chrome !== 'undefined' && chrome.windows && typeof chrome.windows.create === 'function') {
      try {
        const win = await chrome.windows.create({
          url: currentUrl,
          type: 'popup',
          width: bounds.width,
          height: bounds.height,
          left: bounds.left,
          top: bounds.top,
          focused: true
        });
        return { success: true, mode: 'popup', window: win, windowId: win.id };
      } catch (e) {
        // Continue to background message
      }
    }

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({
          type: 'OPEN_ALWAYS_ON_TOP_FALLBACK',
          url: currentUrl,
          width: bounds.width,
          height: bounds.height,
          left: bounds.left,
          top: bounds.top
        }, (response) => {
          resolve(response || { success: true, mode: 'popup' });
        });
      });
    }

    return { success: true, mode: 'popup' };
  }

  // 7. Core openAlwaysOnTop Method
  async function openAlwaysOnTop(options = {}) {
    const opts = Object.assign({}, options);
    const dims = getPresetDimensions(opts.preset, opts.width, opts.height);
    const targetWidth = dims.width;
    const targetHeight = dims.height;

    const requestedUrl = opts.targetUrl || (typeof window !== 'undefined' ? window.location.href : '');
    const isRestrictedUrl = requestedUrl.startsWith('chrome://') ||
                            requestedUrl.startsWith('chrome-extension://') ||
                            requestedUrl.startsWith('devtools://') ||
                            requestedUrl.startsWith('edge://') ||
                            requestedUrl.startsWith('about:');

    // Force or need fallback
    if (opts.mode === 'popup' || isRestrictedUrl || !isSupported()) {
      return await openFallbackPopup(opts, targetWidth, targetHeight);
    }

    // Close any prior PiP window if still open
    if (currentPipWindow && !currentPipWindow.closed) {
      try {
        currentPipWindow.close();
      } catch (e) {}
    }

    try {
      const pipWindow = await window.documentPictureInPicture.requestWindow({
        width: targetWidth,
        height: targetHeight,
        disallowReturnToOpener: Boolean(opts.disallowReturnToOpener)
      });

      currentPipWindow = pipWindow;
      currentAotMode = 'docpip';
      currentDimensions = { width: targetWidth, height: targetHeight };
      currentUrl = requestedUrl;
      fallbackActive = false;

      // Copy styles
      copyStylesheetsToPip(pipWindow.document);

      // Apply body defaults
      if (pipWindow.document && pipWindow.document.body) {
        pipWindow.document.body.style.margin = '0';
        pipWindow.document.body.style.padding = '0';
        pipWindow.document.body.style.width = '100%';
        pipWindow.document.body.style.height = '100%';
        pipWindow.document.body.style.overflow = 'hidden';
        pipWindow.document.body.style.background = '#0f172a';
      }

      // Content Mounting
      if (opts.targetElement && opts.targetElement.parentNode) {
        // Pop out DOM element
        const parent = opts.targetElement.parentNode;
        const placeholder = typeof document !== 'undefined' ? document.createComment('aot-element-placeholder') : null;
        if (placeholder && parent.insertBefore) {
          parent.insertBefore(placeholder, opts.targetElement);
        }
        movedElementState = {
          element: opts.targetElement,
          originalParent: parent,
          placeholder: placeholder
        };
        pipWindow.document.body.appendChild(opts.targetElement);
      } else if (opts.targetUrl && (typeof window === 'undefined' || opts.targetUrl !== window.location.href)) {
        // Embed target link in iframe
        const iframe = pipWindow.document.createElement('iframe');
        iframe.className = 'aot-viewport';
        iframe.src = opts.targetUrl;
        iframe.allow = 'autoplay; camera; microphone; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
        pipWindow.document.body.appendChild(iframe);
      } else if (typeof document !== 'undefined' && document.body) {
        // Full tab pop-out fallback
        const iframe = pipWindow.document.createElement('iframe');
        iframe.className = 'aot-viewport';
        iframe.src = window.location.href;
        iframe.allow = 'autoplay; camera; microphone; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
        pipWindow.document.body.appendChild(iframe);
      }

      // Add navigation bar
      createFloatingNavBar(pipWindow, {
        targetUrl: requestedUrl,
        openerTabId: opts.openerTabId
      });

      // Cleanup on pagehide
      pipWindow.addEventListener('pagehide', () => {
        if (movedElementState && movedElementState.element && movedElementState.originalParent) {
          try {
            if (movedElementState.placeholder && movedElementState.placeholder.parentNode) {
              movedElementState.placeholder.parentNode.insertBefore(movedElementState.element, movedElementState.placeholder);
              movedElementState.placeholder.remove();
            } else {
              movedElementState.originalParent.appendChild(movedElementState.element);
            }
          } catch (e) {}
          movedElementState = null;
        }
        currentPipWindow = null;
        currentAotMode = null;
      });

      return pipWindow;
    } catch (err) {
      if (opts.mode === 'docpip') {
        throw err;
      }
      // Auto fallback to popup window
      return await openFallbackPopup(opts, targetWidth, targetHeight);
    }
  }

  // 8. Close Always On Top
  function closeAlwaysOnTop() {
    let closedAny = false;
    if (currentPipWindow && !currentPipWindow.closed) {
      try {
        currentPipWindow.close();
        closedAny = true;
      } catch (e) {}
      currentPipWindow = null;
    }

    if (fallbackActive) {
      fallbackActive = false;
      closedAny = true;
    }

    currentAotMode = null;
    return closedAny;
  }

  // 9. Status Query
  function getAotStatus() {
    const isPipActive = Boolean(currentPipWindow && !currentPipWindow.closed);
    return {
      supported: isSupported(),
      active: isPipActive || fallbackActive,
      mode: isPipActive ? 'docpip' : (fallbackActive ? 'popup' : 'none'),
      dimensions: currentDimensions,
      currentUrl: currentUrl || (typeof window !== 'undefined' ? window.location.href : '')
    };
  }

  const AlwaysOnTopEngine = {
    version: '1.0.0',
    PRESETS,
    isSupported,
    getPresetDimensions,
    calculatePopupBounds,
    copyStylesheetsToPip,
    createFloatingNavBar,
    openAlwaysOnTop,
    closeAlwaysOnTop,
    getAotStatus
  };

  // Global & Module Export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AlwaysOnTopEngine;
  }
  if (typeof global !== 'undefined') {
    global.__CHROME_ALWAYS_ON_TOP_ENGINE__ = AlwaysOnTopEngine;
  }

})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
