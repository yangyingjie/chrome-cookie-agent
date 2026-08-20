// Popup Controller: Grok 账号助手 & Cookie / UA / WebRTC 通用工具箱

// ==========================================
// 1. 常量与预设库配置
// ==========================================
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

const WEBRTC_TIPS = {
  disable_non_proxied_udp: '🛡️ 最高防泄漏模式：强制所有 WebRTC 数据经由代理转发，防止真实 IP 绕过代理发生泄露（代理环境必备）。',
  default_public_interface_only: '🔒 仅公网模式：仅使用默认路由的公网 IP，向网页隐藏局域网私有 IP（如 192.168.x.x）。',
  block_api: '🚫 完全禁用模式：在网页 JS 环境屏蔽 RTCPeerConnection API，彻底禁止网站使用 WebRTC。',
  default_public_and_private_interfaces: '⚠️ 标准路由模式：允许 WebRTC 使用默认路由的公网与内网接口。',
  default: '🌐 原生默认模式：浏览器默认策略，WebRTC 可绑定任意可用网络接口。'
};

// ==========================================
// 2. 状态变量与 DOM 引用
// ==========================================
let currentCookies = [];
let activeTabInfo = null;
let currentHostname = '';
let currentUrl = '';
let currentExportTab = 'header';
const defaultBrowserUa = navigator.userAgent;
let effectiveUa = defaultBrowserUa;

// Grok 助手状态
let grokData = {
  activeAccountId: null,
  accounts: []
};

// 顶部导航 DOM
const navTabGrok = document.getElementById('navTabGrok');
const navTabToolbox = document.getElementById('navTabToolbox');
const navTabExtensions = document.getElementById('navTabExtensions');
const panelGrok = document.getElementById('panelGrok');
const panelToolbox = document.getElementById('panelToolbox');
const panelExtensions = document.getElementById('panelExtensions');
const statsInfo = document.getElementById('statsInfo');

// 扩展管理器 DOM
const extSearchInput = document.getElementById('extSearchInput');
const extSearchClearBtn = document.getElementById('extSearchClearBtn');
const extFilterAll = document.getElementById('extFilterAll');
const extFilterEnabled = document.getElementById('extFilterEnabled');
const extFilterDisabled = document.getElementById('extFilterDisabled');
const extCountAll = document.getElementById('extCountAll');
const extCountEnabled = document.getElementById('extCountEnabled');
const extCountDisabled = document.getElementById('extCountDisabled');
const extRefreshListBtn = document.getElementById('extRefreshListBtn');
const extOpenChromeExtensionsBtn = document.getElementById('extOpenChromeExtensionsBtn');
const extListContainer = document.getElementById('extListContainer');

// Grok 极速切换栏 DOM
const grokAccountSelect = document.getElementById('grokAccountSelect');
const grokQuickSwitchBtn = document.getElementById('grokQuickSwitchBtn');

// Grok 工具栏 DOM
const grokCaptureBtn = document.getElementById('grokCaptureBtn');
const grokRefreshQuotaBtn = document.getElementById('grokRefreshQuotaBtn');
const grokAddManualBtn = document.getElementById('grokAddManualBtn');
const grokImportBtn = document.getElementById('grokImportBtn');
const grokExportBtn = document.getElementById('grokExportBtn');
const grokResetSessionBtn = document.getElementById('grokResetSessionBtn');
const grokOpenWebBtn = document.getElementById('grokOpenWebBtn');
const grokClearAllBtn = document.getElementById('grokClearAllBtn');

const navGrokAccountCount = document.getElementById('navGrokAccountCount');
const grokSwitcherCount = document.getElementById('grokSwitcherCount');
const grokActiveName = document.getElementById('grokActiveName');
const grokActiveTierBadge = document.getElementById('grokActiveTierBadge');
const grokActiveStatus = document.getElementById('grokActiveStatus');
const grokLastUpdated = document.getElementById('grokLastUpdated');
const grokAccountCount = document.getElementById('grokAccountCount');
const grokAccountsContainer = document.getElementById('grokAccountsContainer');

// 额度指标 DOM
const deepsearchRemaining = document.getElementById('deepsearchRemaining');
const deepsearchTotal = document.getElementById('deepsearchTotal');
const deepsearchBar = document.getElementById('deepsearchBar');
const deepsearchReset = document.getElementById('deepsearchReset');

const thinkRemaining = document.getElementById('thinkRemaining');
const thinkTotal = document.getElementById('thinkTotal');
const thinkBar = document.getElementById('thinkBar');
const thinkReset = document.getElementById('thinkReset');

const standardRemaining = document.getElementById('standardRemaining');
const standardTotal = document.getElementById('standardTotal');
const standardBar = document.getElementById('standardBar');
const standardReset = document.getElementById('standardReset');

// Grok Modal DOM
const grokModalOverlay = document.getElementById('grokModalOverlay');
const grokModalTitle = document.getElementById('grokModalTitle');
const grokModalDesc = document.getElementById('grokModalDesc');
const grokModalInput = document.getElementById('grokModalInput');
const grokModalFileInput = document.getElementById('grokModalFileInput');
const grokModalChooseFileBtn = document.getElementById('grokModalChooseFileBtn');
const grokModalCancelBtn = document.getElementById('grokModalCancelBtn');
const grokModalConfirmBtn = document.getElementById('grokModalConfirmBtn');
const grokForceAddAsNewCheckbox = document.getElementById('grokForceAddAsNewCheckbox');
let grokModalMode = 'import'; // 'import' | 'manual' | 'rename'
let grokModalTargetAccountId = null;

// Universal Toolbox DOM
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

// Picture-in-Picture (画中画) DOM
const pipStatusBadge = document.getElementById('pipStatusBadge');
const pipToggleBtn = document.getElementById('pipToggleBtn');
const pipRefreshBtn = document.getElementById('pipRefreshBtn');
const pipShortcutBtn = document.getElementById('pipShortcutBtn');
const autoPipCheckbox = document.getElementById('autoPipCheckbox');
const pipVideoCountTip = document.getElementById('pipVideoCountTip');

// Speed & Audio Controller (倍速与音量增强) DOM
const speedCurrentBadge = document.getElementById('speedCurrentBadge');
const speedDomainText = document.getElementById('speedDomainText');
const speedPitchCheckbox = document.getElementById('speedPitchCheckbox');
const speedSlider = document.getElementById('speedSlider');
const speedInput = document.getElementById('speedInput');
const speedMinusBtn = document.getElementById('speedMinusBtn');
const speedPlusBtn = document.getElementById('speedPlusBtn');
const speedResetBtn = document.getElementById('speedResetBtn');
const volumeBoostSlider = document.getElementById('volumeBoostSlider');
const volumeBoostValue = document.getElementById('volumeBoostValue');
const speedMediaCountTip = document.getElementById('speedMediaCountTip');
const speedHotkeysCheckbox = document.getElementById('speedHotkeysCheckbox');
const speedScopeRadios = document.querySelectorAll('input[name="speedScope"]');
const speedPresetBtns = document.querySelectorAll('.speed-preset-btn');

let currentSpeedValue = 1.0;
let currentVolumeBoostValue = 1.0;
let currentPitchPreserve = true;
let currentSpeedHotkeysEnabled = true;
let currentSpeedScope = 'global';
let siteSpeedMap = {};
let globalSpeed = 1.0;

const webrtcStatusBadge = document.getElementById('webrtcStatusBadge');
const webrtcPolicySelect = document.getElementById('webrtcPolicySelect');
const saveWebrtcBtn = document.getElementById('saveWebrtcBtn');
const webrtcPolicyTip = document.getElementById('webrtcPolicyTip');

const preview = document.getElementById('preview');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');

// ==========================================
// 3. 通用辅助函数
// ==========================================
function normalizeDomain(domain) {
  if (!domain) return '';
  return domain.trim().toLowerCase()
    .replace(/^https?:\/\//, '')
    .split('/')[0]
    .split(':')[0]
    .replace(/^\.+/, '');
}

function formatRelativeTime(timestamp) {
  if (!timestamp) return '未同步';
  const diff = Date.now() - timestamp;
  if (diff < 60000) return '刚刚刷新';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  return new Date(timestamp).toLocaleDateString();
}

function formatResetCountdown(resetTimeStr, windowSeconds) {
  if (!resetTimeStr) return '⏳ 额度充足';
  try {
    const resetDate = new Date(resetTimeStr);
    const diffMs = resetDate.getTime() - Date.now();
    if (diffMs <= 0) return '⏳ 即将重置';

    const diffMins = Math.ceil(diffMs / 60000);
    if (diffMins < 60) return `⏳ ${diffMins} 分钟后重置`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `⏳ ${hours}小时${mins > 0 ? mins + '分' : ''}后重置`;
  } catch (e) {
    return '⏳ 自动重置';
  }
}

// ==========================================
// 4. Tab 切换逻辑
// ==========================================
function switchTab(targetPanelId) {
  const tabs = [
    { btn: navTabGrok, panel: panelGrok, id: 'panelGrok' },
    { btn: navTabToolbox, panel: panelToolbox, id: 'panelToolbox' },
    { btn: navTabExtensions, panel: panelExtensions, id: 'panelExtensions' }
  ];

  tabs.forEach(tab => {
    if (tab.btn && tab.panel) {
      if (tab.id === targetPanelId) {
        tab.btn.classList.add('active');
        tab.panel.classList.add('active');
      } else {
        tab.btn.classList.remove('active');
        tab.panel.classList.remove('active');
      }
    }
  });
}

if (navTabGrok) navTabGrok.addEventListener('click', () => switchTab('panelGrok'));
if (navTabToolbox) navTabToolbox.addEventListener('click', () => switchTab('panelToolbox'));
if (navTabExtensions) navTabExtensions.addEventListener('click', () => switchTab('panelExtensions'));

// ==========================================
// 5. Grok 账号助手核心功能
// ==========================================

// 加载 Grok 存储数据并渲染
// 加载 Grok 存储数据并渲染
async function loadGrokData() {
  try {
    const store = await chrome.storage.local.get(['grokData']);
    grokData = store.grokData || { activeAccountId: null, accounts: [] };

    if (!Array.isArray(grokData.accounts)) {
      grokData.accounts = [];
    }

    renderGrokUI();

    // 每次打开弹窗自动异步拉取最新真实额度
    if (grokData.activeAccountId) {
      refreshActiveGrokQuota();
    }
  } catch (err) {
    console.error('Failed to load Grok data:', err);
  }
}

// 保存 Grok 数据
async function saveGrokData() {
  await chrome.storage.local.set({ grokData });
  renderGrokUI();
}

// 渲染 Grok 完整界面
function renderGrokUI() {
  const accounts = grokData.accounts || [];
  if (grokAccountCount) {
    grokAccountCount.textContent = accounts.length;
  }
  if (navGrokAccountCount) {
    navGrokAccountCount.textContent = accounts.length;
  }
  if (grokSwitcherCount) {
    grokSwitcherCount.textContent = `${accounts.length}个可用`;
  }

  // 1. 填充顶部快速切换下拉框
  renderQuickSwitcherSelect(accounts);

  // 2. 查找当前活跃账号
  let activeAccount = null;
  if (grokData.activeAccountId) {
    activeAccount = accounts.find(a => a.id === grokData.activeAccountId);
  }

  // 3. 渲染顶部活跃账号状态卡
  if (activeAccount) {
    if (grokActiveName) grokActiveName.textContent = activeAccount.name || 'Grok 账号';
    if (grokActiveStatus) {
      grokActiveStatus.className = 'ua-status-badge active';
      grokActiveStatus.textContent = '🟢 已连接生效';
    }
    if (grokActiveTierBadge) {
      const tier = (activeAccount.tier || 'unknown').toLowerCase();
      grokActiveTierBadge.textContent = activeAccount.tier || 'Standard';
      grokActiveTierBadge.className = `tier-badge ${tier}`;
    }
    if (grokLastUpdated) {
      const lu = activeAccount.rateLimits ? activeAccount.rateLimits.lastUpdated : activeAccount.updatedAt;
      grokLastUpdated.textContent = `更新于: ${formatRelativeTime(lu)}`;
    }

    renderQuotaDashboard(activeAccount.rateLimits);
  } else {
    if (grokActiveName) grokActiveName.textContent = accounts.length > 0 ? '未选定活跃账号' : '未检测到已连接账号';
    if (grokActiveStatus) {
      grokActiveStatus.className = 'ua-status-badge';
      grokActiveStatus.textContent = '⚪ 离线 / 未选定';
    }
    if (grokActiveTierBadge) {
      grokActiveTierBadge.textContent = '未知';
      grokActiveTierBadge.className = 'tier-badge';
    }
    if (grokLastUpdated) grokLastUpdated.textContent = '未同步额度';

    renderQuotaDashboard(null);
  }

  // 4. 渲染账号列表
  renderAccountsList();
}

// 渲染极速切换下拉框
function renderQuickSwitcherSelect(accounts) {
  if (!grokAccountSelect) return;
  grokAccountSelect.innerHTML = '';

  if (!accounts || accounts.length === 0) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = '-- 暂无已保存账号 (请先点击捕获或导入) --';
    grokAccountSelect.appendChild(opt);
    grokAccountSelect.disabled = true;
    if (grokQuickSwitchBtn) grokQuickSwitchBtn.disabled = true;
    return;
  }

  grokAccountSelect.disabled = false;
  if (grokQuickSwitchBtn) grokQuickSwitchBtn.disabled = false;

  accounts.forEach((acc, idx) => {
    const opt = document.createElement('option');
    opt.value = acc.id;
    const isAct = acc.id === grokData.activeAccountId;
    const q = acc.rateLimits || {};
    const ds = q.deepsearch && q.deepsearch.remaining !== undefined ? q.deepsearch.remaining : '--';
    const th = q.thinking && q.thinking.remaining !== undefined ? q.thinking.remaining : '--';
    const st = q.standard && q.standard.remaining !== undefined ? q.standard.remaining : '--';
    
    opt.textContent = `${isAct ? '🟢 [当前生效] ' : `⚡ [可切换] ${idx + 1}. `}${acc.name} (${acc.tier || 'SuperGrok'}) | DS:${ds} Think:${th} Std:${st}`;
    if (isAct) {
      opt.selected = true;
    }
    grokAccountSelect.appendChild(opt);
  });

  if (grokData.activeAccountId) {
    grokAccountSelect.value = grokData.activeAccountId;
  }
}

// 渲染额度卡片
function renderQuotaDashboard(rateLimits) {
  function updateCard(itemKey, remElem, totElem, barElem, resetElem, fallbackTotal) {
    const info = (rateLimits && rateLimits[itemKey]) ? rateLimits[itemKey] : null;
    const remaining = (info && info.remaining !== undefined && info.remaining !== null) ? info.remaining : '--';
    const total = (info && info.total !== undefined && info.total !== null) ? info.total : (remaining !== '--' ? fallbackTotal : '--');

    if (remElem) remElem.textContent = remaining;
    if (totElem) totElem.textContent = total;

    if (barElem) {
      if (typeof remaining === 'number' && typeof total === 'number' && total > 0) {
        const pct = Math.min(100, Math.max(0, Math.round((remaining / total) * 100)));
        barElem.style.width = `${pct}%`;
        barElem.className = 'quota-bar-fill' + (pct === 0 ? ' danger' : (pct <= 25 ? ' warn' : ''));
      } else {
        barElem.style.width = remaining === '--' ? '0%' : '100%';
        barElem.className = 'quota-bar-fill';
      }
    }

    if (resetElem) {
      if (info && info.resetTime) {
        resetElem.textContent = formatResetCountdown(info.resetTime, info.windowSeconds);
      } else if (remaining !== '--') {
        resetElem.textContent = '⏳ 额度已同步';
      } else {
        resetElem.textContent = '⏳ 点击刷新同步';
      }
    }
  }

  updateCard('deepsearch', deepsearchRemaining, deepsearchTotal, deepsearchBar, deepsearchReset, 10);
  updateCard('thinking', thinkRemaining, thinkTotal, thinkBar, thinkReset, 15);
  updateCard('standard', standardRemaining, standardTotal, standardBar, standardReset, 80);
}

// 渲染账号列表
function renderAccountsList() {
  if (!grokAccountsContainer) return;
  grokAccountsContainer.innerHTML = '';

  const accounts = grokData.accounts || [];
  if (accounts.length === 0) {
    grokAccountsContainer.innerHTML = `
      <div class="accounts-empty">
        暂无已保存账号。请先在浏览器中登录 grok.com，然后点击上方 <strong>「➕ 捕获当前账号」</strong> 或 <strong>「📥 导入」</strong> 备份数据。
      </div>
    `;
    return;
  }

  accounts.forEach(account => {
    const isActive = account.id === grokData.activeAccountId;
    const card = document.createElement('div');
    card.className = `grok-account-card ${isActive ? 'active-account' : ''}`;
    card.dataset.accountId = account.id;

    const tier = (account.tier || 'Standard').toUpperCase();
    const q = account.rateLimits || {};
    const dsRem = q.deepsearch && q.deepsearch.remaining !== undefined ? q.deepsearch.remaining : '--';
    const thRem = q.thinking && q.thinking.remaining !== undefined ? q.thinking.remaining : '--';
    const stRem = q.standard && q.standard.remaining !== undefined ? q.standard.remaining : '--';

    card.innerHTML = `
      <div class="account-main">
        <div class="account-header-line">
          <span class="account-name" title="${account.name}">${account.name}</span>
          <span class="tier-badge ${account.tier ? account.tier.toLowerCase() : ''}">${tier}</span>
          ${isActive 
            ? '<span class="ua-status-badge active" style="font-size: 9px; padding: 1px 6px;">🟢 当前生效中</span>' 
            : '<span class="ua-status-badge" style="font-size: 9px; padding: 1px 6px; cursor: pointer; color: #215134;" title="点击切换至此账号">⚪ 待命 (点击切换)</span>'
          }
        </div>
        <div class="account-sub-line">
          <span>${account.email || account.userId || 'Session Token'}</span>
          <span>•</span>
          <span>${formatRelativeTime(account.updatedAt)}</span>
        </div>
        <div class="account-quota-summary">
          <span class="quota-chip" title="DeepSearch 剩余额度">🔍 DS: ${dsRem}</span>
          <span class="quota-chip" title="Thinking 思考剩余额度">🧠 Think: ${thRem}</span>
          <span class="quota-chip" title="Standard 问答剩余额度">💬 Std: ${stRem}</span>
        </div>
      </div>
      <div class="account-actions">
        ${!isActive 
          ? `<button class="btn btn-switch-highlight btn-sm" data-action="switch" data-id="${account.id}" title="点击立即切换至此账号并同步 Cookie">⚡ 切换生效</button>` 
          : `<button class="btn btn-secondary btn-sm" data-action="reapply" data-id="${account.id}" title="重新写入此账号 Cookie">🔄 重连</button>`
        }
        <button class="btn btn-secondary btn-sm" data-action="refresh" data-id="${account.id}" title="刷新此账号额度">🔄 额度</button>
        <button class="btn btn-outline btn-sm" data-action="edit" data-id="${account.id}" title="修改名称/备注">✏️</button>
        <button class="btn-icon" data-action="delete" data-id="${account.id}" title="删除此账号">🗑️</button>
      </div>
    `;

    // 点击整张卡片（非按钮区域）也可以直接切换
    card.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      if (!isActive) {
        switchGrokAccount(account.id);
      }
    });

    grokAccountsContainer.appendChild(card);
  });

  // 绑定账号卡片按钮事件
  grokAccountsContainer.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const action = btn.dataset.action;
      const id = btn.dataset.id;

      if (action === 'switch' || action === 'reapply') {
        btn.textContent = '⏳ 切换中...';
        await switchGrokAccount(id);
      } else if (action === 'refresh') {
        btn.textContent = '⏳...';
        await refreshSpecificAccountQuota(id);
        btn.textContent = '🔄 额度';
      } else if (action === 'edit') {
        openEditAccountModal(id);
      } else if (action === 'delete') {
        if (confirm('确定删除此 Grok 账号吗？')) {
          grokData.accounts = grokData.accounts.filter(a => a.id !== id);
          if (grokData.activeAccountId === id) {
            grokData.activeAccountId = grokData.accounts.length > 0 ? grokData.accounts[0].id : null;
          }
          await saveGrokData();
        }
      }
    });
  });
}

// 捕获当前浏览器登录的 Grok 账号
async function captureCurrentGrokAccount() {
  try {
    if (grokCaptureBtn) grokCaptureBtn.textContent = '⏳ 捕获中...';

    // 1. 获取所有 Grok Cookies
    const resp = await chrome.runtime.sendMessage({ type: 'GET_GROK_COOKIES' });
    const cookies = resp && resp.cookies ? resp.cookies : [];

    // 检查核心 SSO Cookie
    const ssoCookie = cookies.find(c => c.name === 'sso' || c.name === 'sso-rw');

    if (!ssoCookie && cookies.length === 0) {
      alert('未检测到 Grok 登录态 Cookie！\n请先在当前浏览器中打开 https://grok.com 并登录账号，然后再点击捕获。');
      if (grokCaptureBtn) grokCaptureBtn.textContent = '➕ 捕获当前账号';
      return;
    }

    // 2. 尝试从 grok.com 接口拉取用户身份与额度
    let userInfo = { name: 'Grok 账号', email: '', userId: '', tier: 'SuperGrok' };
    let quotaData = null;

    try {
      const userRes = await fetch('https://grok.com/rest/app-chat/users/me', {
        headers: { 'Accept': 'application/json' }
      });
      if (userRes.ok) {
        const u = await userRes.json();
        userInfo.userId = u.id || u.userId || '';
        userInfo.name = u.name || u.username || u.email || 'Grok 用户';
        userInfo.email = u.email || '';
        if (u.subscription && u.subscription.tier) {
          userInfo.tier = u.subscription.tier;
        }
      }
    } catch (e) {
      console.warn('Could not fetch user info from me endpoint:', e);
    }

    // 拉取额度
    quotaData = await fetchAllGrokQuotas();

    // 3. 构建或更新账号 (按有效 userId 或完整 Token 精准去重)
    const existingIndex = grokData.accounts.findIndex(a => {
      if (userInfo.userId && a.userId && a.userId === userInfo.userId) return true;
      if (ssoCookie && a.cookies && Array.isArray(a.cookies)) {
        const aSso = a.cookies.find(c => c.name === 'sso' || c.name === 'sso-rw');
        if (aSso && aSso.value.trim() === ssoCookie.value.trim()) return true;
      }
      return false;
    });

    const now = Date.now();
    const newAccount = {
      id: existingIndex >= 0 ? grokData.accounts[existingIndex].id : `acc_${now}_${Math.random().toString(36).slice(2, 9)}`,
      name: existingIndex >= 0 ? grokData.accounts[existingIndex].name : (userInfo.name || `Grok 账号 ${grokData.accounts.length + 1}`),
      email: userInfo.email,
      userId: userInfo.userId,
      tier: userInfo.tier || 'SuperGrok',
      cookies: cookies,
      ssoPreview: ssoCookie ? ssoCookie.value.slice(0, 20) : '',
      rateLimits: quotaData || (existingIndex >= 0 ? grokData.accounts[existingIndex].rateLimits : null),
      createdAt: existingIndex >= 0 ? grokData.accounts[existingIndex].createdAt : now,
      updatedAt: now
    };

    if (existingIndex >= 0) {
      grokData.accounts[existingIndex] = newAccount;
    } else {
      grokData.accounts.push(newAccount);
    }

    grokData.activeAccountId = newAccount.id;
    await saveGrokData();

    if (grokCaptureBtn) {
      grokCaptureBtn.textContent = '✅ 捕获成功!';
      setTimeout(() => { if (grokCaptureBtn) grokCaptureBtn.textContent = '➕ 捕获当前账号'; }, 1500);
    }
  } catch (err) {
    console.error('Capture account failed:', err);
    alert('捕获账号失败: ' + err.message);
    if (grokCaptureBtn) grokCaptureBtn.textContent = '➕ 捕获当前账号';
  }
}

// 从 Background 双通道引擎获取实时真实配额
async function fetchAllGrokQuotas() {
  try {
    const resp = await chrome.runtime.sendMessage({ type: 'FETCH_GROK_QUOTA' });
    if (resp && resp.success && resp.data) {
      const d = resp.data;
      if (d.standard || d.deepsearch || d.thinking) {
        return d;
      }
    }
  } catch (e) {
    console.warn('[Grok Quota] 发送 FETCH_GROK_QUOTA 消息失败:', e);
  }
  return null;
}

// 刷新当前活跃账号额度
async function refreshActiveGrokQuota() {
  if (grokRefreshQuotaBtn) grokRefreshQuotaBtn.textContent = '⏳ 刷新中...';

  try {
    const quota = await fetchAllGrokQuotas();
    if (quota && (quota.standard || quota.deepsearch || quota.thinking)) {
      if (grokData.activeAccountId) {
        const acc = grokData.accounts.find(a => a.id === grokData.activeAccountId);
        if (acc) {
          acc.rateLimits = quota;
          acc.updatedAt = Date.now();
          await saveGrokData();
        }
      } else {
        renderQuotaDashboard(quota);
      }

      if (grokRefreshQuotaBtn) {
        grokRefreshQuotaBtn.textContent = '✅ 已刷新!';
        setTimeout(() => { if (grokRefreshQuotaBtn) grokRefreshQuotaBtn.textContent = '🔄 刷新额度'; }, 1500);
      }
    } else {
      if (grokRefreshQuotaBtn) {
        grokRefreshQuotaBtn.textContent = '⚠️ 刷新失败';
        setTimeout(() => { if (grokRefreshQuotaBtn) grokRefreshQuotaBtn.textContent = '🔄 刷新额度'; }, 1500);
      }
    }
  } catch (err) {
    console.error('Refresh quota failed:', err);
    if (grokRefreshQuotaBtn) grokRefreshQuotaBtn.textContent = '🔄 刷新额度';
  }
}

// 一键切换 Grok 账号核心实现
async function switchGrokAccount(accountId) {
  if (!accountId) return;
  const targetAccount = grokData.accounts.find(a => a.id === accountId);
  if (!targetAccount) return;

  try {
    // 1. 发送切换消息至 background (自动双域同步 .grok.com 与 .x.ai)
    const resp = await chrome.runtime.sendMessage({
      type: 'SWITCH_GROK_ACCOUNT',
      cookies: targetAccount.cookies,
      accountId: targetAccount.id
    });

    if (!resp || !resp.success) {
      throw new Error((resp && resp.error) || '切换 Cookie 失败');
    }

    grokData.activeAccountId = targetAccount.id;
    await saveGrokData();

    // 2. 检查并智能处理当前标签页 (若在 grok.com 则直接刷新)
    if (activeTabInfo && activeTabInfo.url && (activeTabInfo.url.includes('grok.com') || activeTabInfo.url.includes('x.ai'))) {
      chrome.tabs.reload(activeTabInfo.id);
    }

    // 3. 立即刷新此账号的最新额度
    refreshActiveGrokQuota();
  } catch (err) {
    alert('切换账号失败: ' + err.message);
  }
}

// 刷新指定账号额度 (切换并刷新)
async function refreshSpecificAccountQuota(accountId) {
  if (grokData.activeAccountId !== accountId) {
    await switchGrokAccount(accountId);
  } else {
    await refreshActiveGrokQuota();
  }
}

// 极速切换下拉框与按钮事件绑定
if (grokQuickSwitchBtn && grokAccountSelect) {
  grokQuickSwitchBtn.addEventListener('click', async () => {
    const selectedId = grokAccountSelect.value;
    if (!selectedId) {
      alert('请先选择要切换的 Grok 账号！');
      return;
    }
    grokQuickSwitchBtn.textContent = '⏳ 切换中...';
    await switchGrokAccount(selectedId);
    grokQuickSwitchBtn.textContent = '✅ 切换成功!';
    setTimeout(() => { if (grokQuickSwitchBtn) grokQuickSwitchBtn.textContent = '⚡ 立即切换'; }, 1500);
  });

  grokAccountSelect.addEventListener('change', async () => {
    const selectedId = grokAccountSelect.value;
    if (selectedId && selectedId !== grokData.activeAccountId) {
      grokQuickSwitchBtn.textContent = '⏳ 切换中...';
      await switchGrokAccount(selectedId);
      grokQuickSwitchBtn.textContent = '✅ 切换成功!';
      setTimeout(() => { if (grokQuickSwitchBtn) grokQuickSwitchBtn.textContent = '⚡ 立即切换'; }, 1500);
    }
  });
}

// 清理 Grok 登录态与会话缓存 (解决死循环重定向)
async function resetGrokSession() {
  if (!confirm('确认彻底清除当前浏览器的 Grok / x.ai 登录 Cookie 缓存吗？\n可用于解决页面死循环重定向或登录异常问题。')) {
    return;
  }

  try {
    if (grokResetSessionBtn) grokResetSessionBtn.textContent = '⏳ 清理中...';
    await chrome.runtime.sendMessage({ type: 'CLEAR_GROK_SESSION' });
    grokData.activeAccountId = null;
    await saveGrokData();

    if (activeTabInfo && activeTabInfo.url && (activeTabInfo.url.includes('grok.com') || activeTabInfo.url.includes('x.ai'))) {
      chrome.tabs.reload(activeTabInfo.id);
    }

    if (grokResetSessionBtn) {
      grokResetSessionBtn.textContent = '✅ 已清理!';
      setTimeout(() => { if (grokResetSessionBtn) grokResetSessionBtn.textContent = '🧹 清除Cookie'; }, 1500);
    }
    alert('Grok 与 x.ai 登录缓存已彻底清除！页面将恢复为纯净未登录状态，你可以重新登录或点击切换账号。');
  } catch (err) {
    alert('清理失败: ' + err.message);
    if (grokResetSessionBtn) grokResetSessionBtn.textContent = '🧹 清除Cookie';
  }
}

// 解析 JWT Payload
function parseJwtPayload(token) {
  try {
    const parts = (token || '').split('.');
    if (parts.length >= 2) {
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    }
  } catch (e) {
    try {
      const parts = (token || '').split('.');
      if (parts.length >= 2) {
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const binary = atob(base64);
        return JSON.parse(binary);
      }
    } catch (e2) {
      console.warn('JWT parse error:', e2);
    }
  }
  return null;
}

// 根据 Grok SSO Token 创建标准账号对象
function createAccountFromSsoToken(token, defaultName = null) {
  const cleanToken = (token || '').trim();
  const payload = parseJwtPayload(cleanToken) || {};
  const sessionId = payload.session_id || payload.sub || payload.user_id || '';
  const now = Date.now();

  const cookies = [
    {
      name: 'sso',
      value: cleanToken,
      domain: '.grok.com',
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'lax'
    },
    {
      name: 'sso-rw',
      value: cleanToken,
      domain: '.grok.com',
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'lax'
    }
  ];

  const displayName = defaultName || (payload.email ? payload.email : (sessionId ? `Grok 账号 (${sessionId.slice(0, 8)})` : `Grok 账号`));

  return {
    id: `acc_${now}_${Math.random().toString(36).slice(2, 9)}`,
    name: displayName,
    email: payload.email || '',
    userId: sessionId,
    tier: payload.tier || 'SuperGrok',
    cookies: cookies,
    ssoPreview: cleanToken.slice(0, 20),
    rateLimits: null,
    createdAt: now,
    updatedAt: now
  };
}

// 解析任意格式的 Grok 导入内容 (支持纯 SSO Token, sso=xxx 键值对, Cookie 字符串, 多行列表及标准 JSON)
function parseRawGrokInput(rawInput) {
  const text = (rawInput || '').trim();
  if (!text) return [];
  let accountsToImport = [];

  // 1. 优先尝试标准 JSON 解析
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      if (parsed.length > 0 && typeof parsed[0] === 'string') {
        accountsToImport = parsed.map((token, i) => createAccountFromSsoToken(token, `Grok 账号 ${i + 1}`));
      } else if (parsed.length > 0 && parsed[0].cookies) {
        accountsToImport = parsed;
      } else if (parsed.length > 0 && (parsed[0].name === 'sso' || parsed[0].name === 'sso-rw' || parsed[0].domain)) {
        const ssoCookie = parsed.find(c => c.name === 'sso' || c.name === 'sso-rw');
        const token = ssoCookie ? ssoCookie.value : '';
        if (token) {
          accountsToImport = [createAccountFromSsoToken(token)];
        } else {
          accountsToImport = [{
            id: `acc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            name: `导入账号`,
            cookies: parsed,
            tier: 'SuperGrok',
            rateLimits: null,
            createdAt: Date.now(),
            updatedAt: Date.now()
          }];
        }
      } else if (parsed.length > 0 && typeof parsed[0] === 'object') {
        accountsToImport = parsed.map((item, i) => {
          if (item.cookies) return item;
          if (item.token || item.sso || item.value) {
            return createAccountFromSsoToken(item.token || item.sso || item.value, item.name || `Grok 账号 ${i + 1}`);
          }
          return null;
        }).filter(Boolean);
      }
    } else if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.fullAccounts) && parsed.fullAccounts.length > 0) {
        accountsToImport = parsed.fullAccounts.filter(acc => acc && (acc.cookies || acc.sso || acc.token));
      } else if (Array.isArray(parsed.accounts)) {
        accountsToImport = parsed.accounts.map((item, i) => {
          if (typeof item === 'string') {
            return createAccountFromSsoToken(item, `Grok 账号 ${i + 1}`);
          } else if (item && typeof item === 'object') {
            if (item.cookies) return item;
            if (item.token || item.sso || item.value) return createAccountFromSsoToken(item.token || item.sso || item.value, item.name || `Grok 账号 ${i + 1}`);
          }
          return null;
        }).filter(Boolean);
      } else if (Array.isArray(parsed.tokens)) {
        accountsToImport = parsed.tokens.map((token, i) => createAccountFromSsoToken(token, `Grok 账号 ${i + 1}`));
      } else if (parsed.cookies && Array.isArray(parsed.cookies)) {
        accountsToImport = [parsed];
      } else if (parsed.token || parsed.sso || parsed.value) {
        accountsToImport = [createAccountFromSsoToken(parsed.token || parsed.sso || parsed.value, parsed.name)];
      }
    }
  } catch (e) {
    // 非 JSON 格式，继续进入文本与 Cookie 解析引擎
  }

  // 2. 非 JSON 格式：按行智能提取（支持 "备注名: eyJ..."、"备注名 ---- eyJ..."、"sso=eyJ..."、直接粘贴多行 JWT）
  if (!accountsToImport || accountsToImport.length === 0) {
    const lines = text.split(/[\r\n]+/);
    const lineAccounts = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      let customName = null;
      let lineText = line;

      // 提取前缀备注名 (如 "主号: eyJ..." 或 "账号A ---- eyJ...")
      if (line.includes(':') && !line.startsWith('http') && !line.startsWith('eyJ')) {
        const colonIdx = line.indexOf(':');
        const possibleName = line.slice(0, colonIdx).trim();
        const rest = line.slice(colonIdx + 1).trim();
        if (possibleName && rest.includes('eyJ')) {
          customName = possibleName;
          lineText = rest;
        }
      } else if (line.includes('----')) {
        const parts = line.split('----');
        if (parts[0].trim() && parts[1] && parts[1].includes('eyJ')) {
          customName = parts[0].trim();
          lineText = parts[1].trim();
        }
      }

      // 匹配 JWT Token (支持直接以 eyJ 开头，或包含在 sso=eyJ... 中)
      const jwtRegex = /eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g;
      const matches = lineText.match(jwtRegex);
      if (matches && matches.length > 0) {
        matches.forEach((token, subIdx) => {
          const accName = customName ? (matches.length > 1 ? `${customName} (${subIdx + 1})` : customName) : null;
          lineAccounts.push(createAccountFromSsoToken(token, accName));
        });
      }
    }

    if (lineAccounts.length > 0) {
      accountsToImport = lineAccounts;
    } else {
      // 3. 兜底全局正则扫描任意文本中包含的 JWT Token
      const jwtRegex = /eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g;
      const allMatches = text.match(jwtRegex);
      if (allMatches && allMatches.length > 0) {
        const uniqueTokens = Array.from(new Set(allMatches));
        accountsToImport = uniqueTokens.map((token, i) => createAccountFromSsoToken(token, `Grok 账号 ${i + 1}`));
      }
    }
  }

  return accountsToImport;
}

// 导出所有账号备份 (JSON)
function exportGrokAccounts() {
  if (!grokData.accounts || grokData.accounts.length === 0) {
    alert('当前没有可导出的账号数据！');
    return;
  }

  const ssoTokens = grokData.accounts.map(a => {
    if (a.cookies && Array.isArray(a.cookies)) {
      const sso = a.cookies.find(c => c.name === 'sso' || c.name === 'sso-rw');
      if (sso && sso.value) return sso.value;
    }
    return a.ssoPreview || null;
  }).filter(Boolean);

  const exportPayload = {
    accounts: ssoTokens, // 100% 兼容 Chrome 商店 Grok Account Helper 标准格式
    version: '1.7.0',
    exportTime: new Date().toISOString(),
    generator: 'Cookie & Grok Assistant Pro',
    accountsCount: grokData.accounts.length,
    fullAccounts: grokData.accounts
  };

  const jsonStr = JSON.stringify(exportPayload, null, 2);
  
  navigator.clipboard.writeText(jsonStr);

  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `grok_accounts_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);

  if (grokExportBtn) {
    grokExportBtn.textContent = '✅ 已导出并复制!';
    setTimeout(() => { if (grokExportBtn) grokExportBtn.textContent = '📤 备份导出'; }, 1500);
  }
}

// 导入账号 JSON 或 Token 数据
async function importGrokAccountsData(rawJsonStr) {
  try {
    const accountsToImport = parseRawGrokInput(rawJsonStr);

    if (!accountsToImport || accountsToImport.length === 0) {
      throw new Error('未识别到有效的账号数据格式。请确保粘贴了正确的 JSON 备份或 JWT Token 列表。');
    }

    let addedCount = 0;
    let updatedCount = 0;
    const forceAsNew = grokForceAddAsNewCheckbox && grokForceAddAsNewCheckbox.checked;

    for (const acc of accountsToImport) {
      if (!acc.cookies || !Array.isArray(acc.cookies)) continue;
      
      const ssoCookie = acc.cookies.find(c => c.name === 'sso' || c.name === 'sso-rw');
      const ssoToken = ssoCookie && ssoCookie.value ? ssoCookie.value.trim() : '';
      const userId = acc.userId || '';

      // 精确去重：仅当未开启强制新建，且有效非空 userId 相同或完整 SSO Token 完全一致时才更新已有账号
      let existIdx = -1;
      if (!forceAsNew) {
        existIdx = grokData.accounts.findIndex(a => {
          if (userId && a.userId && a.userId === userId) return true;
          if (ssoToken && a.cookies && Array.isArray(a.cookies)) {
            const aSso = a.cookies.find(c => c.name === 'sso' || c.name === 'sso-rw');
            if (aSso && aSso.value && aSso.value.trim() === ssoToken) return true;
          }
          return false;
        });
      }

      if (existIdx >= 0) {
        grokData.accounts[existIdx] = {
          ...grokData.accounts[existIdx],
          ...acc,
          id: grokData.accounts[existIdx].id,
          name: acc.name && !acc.name.startsWith('Grok 账号') ? acc.name : grokData.accounts[existIdx].name,
          updatedAt: Date.now()
        };
        updatedCount++;
      } else {
        const newAcc = {
          id: `acc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          name: acc.name || `Grok 账号 ${grokData.accounts.length + 1}`,
          email: acc.email || '',
          userId: userId,
          tier: acc.tier || 'SuperGrok',
          cookies: acc.cookies,
          ssoPreview: ssoToken ? ssoToken.slice(0, 20) : '',
          rateLimits: acc.rateLimits || null,
          createdAt: acc.createdAt || Date.now(),
          updatedAt: Date.now()
        };
        grokData.accounts.push(newAcc);
        addedCount++;
      }
    }

    if (!grokData.activeAccountId && grokData.accounts.length > 0) {
      grokData.activeAccountId = grokData.accounts[0].id;
    }

    await saveGrokData();
    closeGrokModal();
    
    if (addedCount > 0 && updatedCount === 0) {
      alert(`🎉 导入成功！\n- 成功新增: ${addedCount} 个新账号\n- 当前共有: ${grokData.accounts.length} 个可用账号（可随时在顶部或列表切换）。`);
    } else if (addedCount === 0 && updatedCount > 0) {
      alert(`ℹ️ 导入提示：\n- 导入的 SSO Token (用户ID: ${accountsToImport[0].userId || accountsToImport[0].name}) 与当前列表中的已有账号完全相同！\n- 已为您更新已有账号数据 (新增 0，更新 1)。\n\n💡 提示：\n1. 若需添加不同账号，请在浏览器中登录【另一个账号】后重新获取并粘贴其 SSO Token；\n2. 若希望保存多个副本，可勾选输入框下方的「强制作为新账号添加」。`);
    } else {
      alert(`🎉 导入完成！\n- 新增账号: ${addedCount} 个\n- 更新已有: ${updatedCount} 个\n- 当前共计: ${grokData.accounts.length} 个可用账号。`);
    }
  } catch (err) {
    alert('导入失败: ' + err.message);
  }
}

// Modal 弹窗控制
function openGrokModal(mode, targetAccountId = null) {
  grokModalMode = mode;
  grokModalTargetAccountId = targetAccountId;
  if (!grokModalOverlay) return;
  if (grokForceAddAsNewCheckbox) grokForceAddAsNewCheckbox.checked = false;

  if (mode === 'import') {
    grokModalTitle.textContent = '📥 导入 Grok 账号备份';
    grokModalDesc.textContent = '请在下方粘贴导出的账号备份 JSON、SSO 列表，或选择 .json 文件：';
    grokModalInput.placeholder = '粘贴 JSON 备份文件内容、Token 数组，或直接粘贴单个/多行 SSO Token...';
    grokModalInput.value = '';
    grokModalConfirmBtn.textContent = '确认导入';
    grokModalChooseFileBtn.style.display = 'inline-flex';
    if (grokForceAddAsNewCheckbox) grokForceAddAsNewCheckbox.parentElement.parentElement.style.display = 'block';
  } else if (mode === 'manual') {
    grokModalTitle.textContent = '✏️ 手动添加 Grok 账号 (支持直接粘贴 SSO Cookie)';
    grokModalDesc.textContent = '直接粘贴 Grok 的 SSO Token (以 eyJ... 开头)、sso=xxx 键值对，或多行 Token：';
    grokModalInput.placeholder = '直接粘贴 SSO Token，例如：\neyJhbGciOiJIUzI1NiJ9.eyJzZXNzaW9uX2lkIjoiMTNmMDY0MmQt...\n\n支持格式：\n1. 纯 SSO Token: eyJhbGci...\n2. 键值对: sso=eyJhbGci...\n3. 带备注格式: 主账号: eyJhbGci...';
    grokModalInput.value = '';
    grokModalConfirmBtn.textContent = '💾 立即添加账号';
    grokModalChooseFileBtn.style.display = 'none';
    if (grokForceAddAsNewCheckbox) grokForceAddAsNewCheckbox.parentElement.parentElement.style.display = 'block';
  } else if (mode === 'rename') {
    const acc = grokData.accounts.find(a => a.id === targetAccountId);
    grokModalTitle.textContent = '✏️ 修改账号名称 / 备注';
    grokModalDesc.textContent = '请输入新的账号显示名称：';
    grokModalInput.placeholder = '例如: 工作主号 / SuperGrok 2号';
    grokModalInput.value = acc ? acc.name : '';
    grokModalConfirmBtn.textContent = '保存修改';
    grokModalChooseFileBtn.style.display = 'none';
    if (grokForceAddAsNewCheckbox) grokForceAddAsNewCheckbox.parentElement.parentElement.style.display = 'none';
  }

  grokModalOverlay.classList.add('show');
}

function openEditAccountModal(accountId) {
  openGrokModal('rename', accountId);
}

function closeGrokModal() {
  if (grokModalOverlay) {
    grokModalOverlay.classList.remove('show');
    grokModalInput.value = '';
  }
}

// Grok 事件绑定
if (grokCaptureBtn) grokCaptureBtn.addEventListener('click', captureCurrentGrokAccount);
if (grokRefreshQuotaBtn) grokRefreshQuotaBtn.addEventListener('click', refreshActiveGrokQuota);
if (grokAddManualBtn) grokAddManualBtn.addEventListener('click', () => openGrokModal('manual'));
if (grokImportBtn) grokImportBtn.addEventListener('click', () => openGrokModal('import'));
if (grokExportBtn) grokExportBtn.addEventListener('click', exportGrokAccounts);
if (grokResetSessionBtn) grokResetSessionBtn.addEventListener('click', resetGrokSession);
if (grokOpenWebBtn) {
  grokOpenWebBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://grok.com' });
  });
}
if (grokClearAllBtn) {
  grokClearAllBtn.addEventListener('click', async () => {
    if (confirm('确定清空所有已保存的 Grok 账号吗？此操作不可逆，请先做好导出备份！')) {
      grokData.accounts = [];
      grokData.activeAccountId = null;
      await saveGrokData();
    }
  });
}

// Modal 内部事件
if (grokModalCancelBtn) grokModalCancelBtn.addEventListener('click', closeGrokModal);
if (grokModalChooseFileBtn && grokModalFileInput) {
  grokModalChooseFileBtn.addEventListener('click', () => grokModalFileInput.click());
  grokModalFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (grokModalInput) grokModalInput.value = evt.target.result;
    };
    reader.readAsText(file);
  });
}

if (grokModalConfirmBtn) {
  grokModalConfirmBtn.addEventListener('click', async () => {
    const val = (grokModalInput ? grokModalInput.value : '').trim();
    if (!val) {
      alert('内容不能为空！');
      return;
    }

    if (grokModalMode === 'import' || grokModalMode === 'manual') {
      await importGrokAccountsData(val);
    } else if (grokModalMode === 'rename' && grokModalTargetAccountId) {
      const acc = grokData.accounts.find(a => a.id === grokModalTargetAccountId);
      if (acc) {
        acc.name = val;
        acc.updatedAt = Date.now();
        await saveGrokData();
      }
      closeGrokModal();
    }
  });
}


// ==========================================
// 6. 通用工具箱 (UA / WebRTC / Cookie 导出)
// ==========================================

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

// User-Agent 事件绑定
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

// WebRTC 策略逻辑
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

// Cookie 导出格式化
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
    '# Generated by Cookie & Grok Assistant Pro',
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

function isRestrictedUrl(url) {
  if (!url) return false;
  return /^(chrome|chrome-extension|edge|devtools|about|view-source):/i.test(url);
}

// ==========================================
// 6.5 视频画中画 (Picture-in-Picture) 控制逻辑
// ==========================================
function renderPipStatus(status) {
  if (!pipStatusBadge || !pipToggleBtn) return;

  if (isRestrictedUrl(currentUrl) || (status && status.isRestricted)) {
    pipStatusBadge.textContent = '⚪ 系统页面不支持画中画';
    pipStatusBadge.className = 'ua-status-badge';
    pipToggleBtn.innerHTML = '🪟 开启/切换 画中画 (Alt+P)';
    if (pipVideoCountTip) pipVideoCountTip.textContent = 'Chrome 限制内置页，请在普通视频网页使用';
    return;
  }

  if (!status || status.error) {
    pipStatusBadge.textContent = '⚪ 未检测到视频';
    pipStatusBadge.className = 'ua-status-badge';
    pipToggleBtn.innerHTML = '🪟 开启/切换 画中画 (Alt+P)';
    if (pipVideoCountTip) pipVideoCountTip.textContent = '支持 Shadow DOM 递归穿透';
    return;
  }

  if (status.isInPip) {
    pipStatusBadge.textContent = '🪟 画中画运行中';
    pipStatusBadge.className = 'ua-status-badge active';
    pipToggleBtn.innerHTML = '⏹️ 退出画中画 (Alt+P)';
    if (pipVideoCountTip) pipVideoCountTip.textContent = '当前正在画中画独立浮窗播放';
  } else if (status.playingVideos > 0) {
    pipStatusBadge.textContent = `🟢 ${status.playingVideos} 个视频播放中`;
    pipStatusBadge.className = 'ua-status-badge active';
    pipToggleBtn.innerHTML = '🪟 开启画中画 (Alt+P)';
    if (pipVideoCountTip) pipVideoCountTip.textContent = `检测到 ${status.totalVideos} 个视频 (${status.playingVideos} 个播放中)`;
  } else if (status.totalVideos > 0) {
    pipStatusBadge.textContent = `🟡 ${status.totalVideos} 个视频 (未播放)`;
    pipStatusBadge.className = 'ua-status-badge';
    pipToggleBtn.innerHTML = '🪟 开启画中画 (Alt+P)';
    if (pipVideoCountTip) pipVideoCountTip.textContent = `已发现 ${status.totalVideos} 个就绪视频，点击一键唤起`;
  } else {
    pipStatusBadge.textContent = '⚪ 当前页面未检测到视频';
    pipStatusBadge.className = 'ua-status-badge';
    pipToggleBtn.innerHTML = '🪟 开启/切换 画中画 (Alt+P)';
    if (pipVideoCountTip) pipVideoCountTip.textContent = '支持嵌套播放器与 Shadow DOM 穿透';
  }
}

async function loadPipSettingsAndStatus() {
  try {
    // 1. 加载 Auto-PiP 配置 (默认开启 true)
    const data = await chrome.storage.local.get(['autoPipEnabled']);
    const isAutoPipOn = (data.autoPipEnabled !== undefined) ? Boolean(data.autoPipEnabled) : true;
    if (autoPipCheckbox) {
      autoPipCheckbox.checked = isAutoPipOn;
    }
    if (data.autoPipEnabled === undefined) {
      await chrome.storage.local.set({ autoPipEnabled: true });
    }

    // 2. 如果当前在系统受限页面，直接展示提示
    if (isRestrictedUrl(currentUrl)) {
      renderPipStatus({ isRestricted: true });
      return;
    }

    // 3. 查询当前激活标签页的视频与 PiP 状态 (动态穿透扫描，彻底解决旧页面连接丢失问题)
    if (activeTabInfo && activeTabInfo.id) {
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: activeTabInfo.id },
          func: () => {
            if (window.__CHROME_PIP_ENGINE__) {
              return window.__CHROME_PIP_ENGINE__.getPipStatus();
            }
            const doc = document;
            const vList = Array.from(doc.querySelectorAll('video'));
            const playing = vList.filter(v => !v.paused && v.currentTime > 0);
            return {
              supported: 'pictureInPictureEnabled' in doc,
              totalVideos: vList.length,
              playingVideos: playing.length,
              isInPip: Boolean(doc.pictureInPictureElement)
            };
          }
        }).catch(() => null);

        if (results && results[0] && results[0].result) {
          renderPipStatus(results[0].result);
        } else {
          renderPipStatus({ totalVideos: 0, playingVideos: 0, isInPip: false });
        }
      } catch (e) {
        renderPipStatus({ totalVideos: 0, playingVideos: 0, isInPip: false });
      }
    }
  } catch (e) {
    console.warn('[PiP Popup] load status failed:', e);
  }
}

// 绑定画中画按钮事件
if (pipToggleBtn) {
  pipToggleBtn.addEventListener('click', async () => {
    if (!activeTabInfo || !activeTabInfo.id) {
      alert('无法在当前页面操作画中画');
      return;
    }

    if (isRestrictedUrl(currentUrl)) {
      alert('提示：Chrome 安全策略禁止在系统内置页面 (chrome://) 执行画中画。\n\n请在常规网页（例如 Bilibili、YouTube、腾讯视频等）中使用画中画功能。');
      return;
    }

    const originalText = pipToggleBtn.innerHTML;
    pipToggleBtn.disabled = true;
    pipToggleBtn.innerHTML = '⏳ 正在处理...';

    try {
      // 在用户点击手势 (User Gesture) 上下文中直接执行脚本，确保满足浏览器 requestPictureInPicture 权限要求
      const results = await chrome.scripting.executeScript({
        target: { tabId: activeTabInfo.id },
        func: async () => {
          if (window.__CHROME_PIP_ENGINE__) {
            return await window.__CHROME_PIP_ENGINE__.togglePictureInPicture();
          }

          // Fallback 原生查找与切换
          const doc = document;
          if (doc.pictureInPictureElement) {
            await doc.exitPictureInPicture();
            return { success: true, action: 'exited', message: '已退出画中画模式' };
          }

          const videos = Array.from(doc.querySelectorAll('video'));
          for (const v of videos) {
            if (v.disablePictureInPicture) v.disablePictureInPicture = false;
            if (v.hasAttribute && v.hasAttribute('disablepictureinpicture')) v.removeAttribute('disablepictureinpicture');
          }

          const bestVideo = videos.find(v => !v.paused && v.currentTime > 0) || videos[0];
          if (!bestVideo) {
            return { success: false, error: 'NO_VIDEO_FOUND', message: '当前网页未检测到视频元素' };
          }

          if (bestVideo.requestPictureInPicture) {
            await bestVideo.requestPictureInPicture();
            return { success: true, action: 'entered', message: '已开启画中画模式' };
          } else {
            return { success: false, error: 'NOT_SUPPORTED', message: '当前浏览器环境不支持 Picture-in-Picture' };
          }
        }
      });

      pipToggleBtn.disabled = false;
      pipToggleBtn.innerHTML = originalText;

      const res = results && results[0] && results[0].result;
      if (res && res.success) {
        setTimeout(() => {
          loadPipSettingsAndStatus();
        }, 300);
      } else {
        const errMsg = (res && res.message) || '未检测到可画中画的视频元素';
        alert('提示: ' + errMsg + '\n\n💡 提示：您也可以在视频网页中直接按快捷键 Alt+P (Mac: Option+P) 或鼠标右键开启画中画。');
        loadPipSettingsAndStatus();
      }
    } catch (err) {
      pipToggleBtn.disabled = false;
      pipToggleBtn.innerHTML = originalText;
      console.warn('[PiP Popup Execution Error]', err);
      alert('画中画执行提示: ' + err.message + '\n\n💡 提示：您也可以直接在视频网页中按快捷键 Alt+P (Mac: Option+P) 或鼠标右键开启画中画。');
      loadPipSettingsAndStatus();
    }
  });
}

if (pipRefreshBtn) {
  pipRefreshBtn.addEventListener('click', () => {
    if (pipStatusBadge) {
      pipStatusBadge.textContent = '🔄 扫描中...';
    }
    loadPipSettingsAndStatus();
    loadSpeedSettingsAndStatus();
  });
}

if (pipShortcutBtn) {
  pipShortcutBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
  });
}

if (autoPipCheckbox) {
  autoPipCheckbox.addEventListener('change', async (e) => {
    const enabled = Boolean(e.target.checked);
    await chrome.storage.local.set({ autoPipEnabled: enabled });
    if (activeTabInfo && activeTabInfo.id) {
      chrome.tabs.sendMessage(activeTabInfo.id, { type: 'SET_AUTO_PIP', enabled }).catch(() => {});
    }
  });
}

// ==========================================
// 6.6 视频/音频倍速与音量增强 (Speed & Audio) 控制逻辑
// ==========================================
function updateSpeedUI(speed, volumeBoost, pitch) {
  if (speed !== undefined) {
    currentSpeedValue = Math.max(0.05, Math.min(16.0, Math.round(Number(speed) * 100) / 100));
    if (speedCurrentBadge) speedCurrentBadge.textContent = `${currentSpeedValue.toFixed(2)}x`;
    if (speedSlider) speedSlider.value = currentSpeedValue;
    if (speedInput) speedInput.value = currentSpeedValue.toFixed(2);

    if (speedPresetBtns) {
      speedPresetBtns.forEach(btn => {
        const btnSpeed = parseFloat(btn.dataset.speed);
        if (Math.abs(btnSpeed - currentSpeedValue) < 0.01) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }
  }

  if (volumeBoost !== undefined) {
    currentVolumeBoostValue = Math.max(1.0, Math.min(6.0, Number(volumeBoost) || 1.0));
    const pct = Math.round(currentVolumeBoostValue * 100);
    if (volumeBoostSlider) volumeBoostSlider.value = pct;
    if (volumeBoostValue) volumeBoostValue.textContent = (pct === 100) ? '100% (正常)' : `${pct}% (放大)`;
  }

  if (pitch !== undefined) {
    currentPitchPreserve = Boolean(pitch);
    if (speedPitchCheckbox) speedPitchCheckbox.checked = currentPitchPreserve;
  }
}

async function loadSpeedSettingsAndStatus() {
  try {
    if (speedDomainText) {
      speedDomainText.textContent = currentHostname || '当前页';
    }

    const data = await chrome.storage.local.get(['siteSpeedMap', 'globalSpeed', 'speedPreservePitch', 'speedHotkeysEnabled', 'speedScope']);
    siteSpeedMap = data.siteSpeedMap || {};
    globalSpeed = (data.globalSpeed !== undefined) ? Number(data.globalSpeed) : 1.0;
    currentPitchPreserve = (data.speedPreservePitch !== undefined) ? Boolean(data.speedPreservePitch) : true;
    currentSpeedHotkeysEnabled = (data.speedHotkeysEnabled !== undefined) ? Boolean(data.speedHotkeysEnabled) : true;
    currentSpeedScope = data.speedScope || 'global';

    if (speedScopeRadios) {
      speedScopeRadios.forEach(radio => {
        radio.checked = (radio.value === currentSpeedScope);
      });
    }

    if (speedHotkeysCheckbox) {
      speedHotkeysCheckbox.checked = currentSpeedHotkeysEnabled;
    }
    if (data.speedHotkeysEnabled === undefined) {
      await chrome.storage.local.set({ speedHotkeysEnabled: true });
    }
    if (data.speedScope === undefined) {
      await chrome.storage.local.set({ speedScope: 'global' });
    }

    let initSpeed = globalSpeed;
    let initVolume = 1.0;

    if (currentSpeedScope === 'site' && currentHostname && siteSpeedMap[currentHostname]) {
      const cfg = siteSpeedMap[currentHostname];
      if (cfg.speed !== undefined) initSpeed = Number(cfg.speed);
      if (cfg.volumeBoost !== undefined) initVolume = Number(cfg.volumeBoost);
    }

    updateSpeedUI(initSpeed, initVolume, currentPitchPreserve);

    // 动态扫描目标页面的媒体元素与倍速状态 (跨进程稳健直通)
    if (activeTabInfo && activeTabInfo.id && !isRestrictedUrl(currentUrl)) {
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: activeTabInfo.id },
          func: (hotkeysOn) => {
            if (window.__CHROME_SPEED_ENGINE__) {
              if (window.__CHROME_SPEED_ENGINE__.setupHotkeys) {
                window.__CHROME_SPEED_ENGINE__.setupHotkeys(hotkeysOn);
              }
              return window.__CHROME_SPEED_ENGINE__.getSpeedStatus();
            }

            const doc = document;
            const mediaList = Array.from(doc.querySelectorAll('video, audio'));
            return {
              speed: 1.0,
              volumeBoost: 1.0,
              preservesPitch: true,
              hotkeysEnabled: hotkeysOn,
              mediaCount: mediaList.length,
              hasMedia: mediaList.length > 0
            };
          },
          args: [currentSpeedHotkeysEnabled]
        }).catch(() => null);

        if (results && results[0] && results[0].result) {
          const res = results[0].result;
          if (speedMediaCountTip) {
            speedMediaCountTip.textContent = res.mediaCount > 0 ? `🟢 已连接 ${res.mediaCount} 个媒体` : '⚪ 当前页未检测到媒体';
          }
          if (res.speed) {
            updateSpeedUI(res.speed, res.volumeBoost, res.preservesPitch);
          }
        } else {
          if (speedMediaCountTip) speedMediaCountTip.textContent = '⚪ 当前页未检测到媒体';
        }
      } catch (err) {
        if (speedMediaCountTip) speedMediaCountTip.textContent = '⚪ 当前页未检测到媒体';
      }
    } else {
      if (speedMediaCountTip) speedMediaCountTip.textContent = '⚪ 系统页面无可用媒体';
    }
  } catch (e) {
    console.warn('[Speed Popup] load settings failed:', e);
  }
}

async function applySpeedChange(newSpeed, persist = true) {
  const targetSpeed = Math.max(0.05, Math.min(16.0, Math.round(Number(newSpeed) * 100) / 100));
  updateSpeedUI(targetSpeed, undefined, currentPitchPreserve);

  if (persist) {
    if (currentSpeedScope === 'site' && currentHostname) {
      if (!siteSpeedMap[currentHostname]) siteSpeedMap[currentHostname] = {};
      siteSpeedMap[currentHostname].speed = targetSpeed;
      await chrome.storage.local.set({ siteSpeedMap, speedScope: 'site' });
    } else {
      globalSpeed = targetSpeed;
      await chrome.storage.local.set({ globalSpeed: targetSpeed, speedScope: 'global' });
    }
  }

  // 跨进程直接注入执行与消息分发双保险
  if (activeTabInfo && activeTabInfo.id && !isRestrictedUrl(currentUrl)) {
    chrome.scripting.executeScript({
      target: { tabId: activeTabInfo.id },
      func: (spd, pitch) => {
        if (window.__CHROME_SPEED_ENGINE__) {
          window.__CHROME_SPEED_ENGINE__.setSpeed(spd, pitch, true);
        } else {
          const list = Array.from(document.querySelectorAll('video, audio'));
          for (const m of list) {
            try {
              m.playbackRate = spd;
              m.defaultPlaybackRate = spd;
              if ('preservesPitch' in m) m.preservesPitch = pitch;
            } catch (e) {}
          }
        }
      },
      args: [targetSpeed, currentPitchPreserve]
    }).catch(() => {});
  }
}

async function applyVolumeBoostChange(newBoost, persist = true) {
  const targetBoost = Math.max(1.0, Math.min(6.0, Math.round(Number(newBoost) * 100) / 100));
  updateSpeedUI(undefined, targetBoost, undefined);

  if (persist && currentHostname) {
    if (!siteSpeedMap[currentHostname]) siteSpeedMap[currentHostname] = {};
    siteSpeedMap[currentHostname].volumeBoost = targetBoost;
    await chrome.storage.local.set({ siteSpeedMap });
  }

  if (activeTabInfo && activeTabInfo.id && !isRestrictedUrl(currentUrl)) {
    chrome.scripting.executeScript({
      target: { tabId: activeTabInfo.id },
      func: (boost) => {
        if (window.__CHROME_SPEED_ENGINE__) {
          window.__CHROME_SPEED_ENGINE__.setVolumeBoost(boost, true);
        }
      },
      args: [targetBoost]
    }).catch(() => {});
  }
}

// 绑定快捷键全局开关
if (speedHotkeysCheckbox) {
  speedHotkeysCheckbox.addEventListener('change', async (e) => {
    const enabled = Boolean(e.target.checked);
    currentSpeedHotkeysEnabled = enabled;
    await chrome.storage.local.set({ speedHotkeysEnabled: enabled });
    if (activeTabInfo && activeTabInfo.id && !isRestrictedUrl(currentUrl)) {
      chrome.scripting.executeScript({
        target: { tabId: activeTabInfo.id },
        func: (en) => {
          if (window.__CHROME_SPEED_ENGINE__) {
            window.__CHROME_SPEED_ENGINE__.setupHotkeys(en);
          }
          window.__CHROME_SPEED_HOTKEYS_ENABLED__ = en;
        },
        args: [enabled]
      }).catch(() => {});
    }
  });
}

// 绑定倍速预设按钮
if (speedPresetBtns) {
  speedPresetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const speed = parseFloat(btn.dataset.speed);
      if (!isNaN(speed)) {
        applySpeedChange(speed);
      }
    });
  });
}

if (speedMinusBtn) {
  speedMinusBtn.addEventListener('click', () => {
    applySpeedChange(Math.max(0.05, currentSpeedValue - 0.1));
  });
}

if (speedPlusBtn) {
  speedPlusBtn.addEventListener('click', () => {
    applySpeedChange(Math.min(16.0, currentSpeedValue + 0.1));
  });
}

if (speedResetBtn) {
  speedResetBtn.addEventListener('click', () => {
    applySpeedChange(1.0);
    applyVolumeBoostChange(1.0);
  });
}

if (speedSlider) {
  speedSlider.addEventListener('input', (e) => {
    applySpeedChange(parseFloat(e.target.value));
  });
}

if (speedInput) {
  speedInput.addEventListener('change', (e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      applySpeedChange(val);
    }
  });
}

if (speedPitchCheckbox) {
  speedPitchCheckbox.addEventListener('change', async (e) => {
    currentPitchPreserve = Boolean(e.target.checked);
    await chrome.storage.local.set({ speedPreservePitch: currentPitchPreserve });
    applySpeedChange(currentSpeedValue);
  });
}

if (volumeBoostSlider) {
  volumeBoostSlider.addEventListener('input', (e) => {
    const pct = parseFloat(e.target.value);
    applyVolumeBoostChange(pct / 100);
  });
}

if (speedScopeRadios) {
  speedScopeRadios.forEach(radio => {
    radio.addEventListener('change', async (e) => {
      currentSpeedScope = e.target.value;
      await chrome.storage.local.set({ speedScope: currentSpeedScope });
      loadSpeedSettingsAndStatus();
    });
  });
}

// ==========================================
// 6.5. 扩展管理器 (Extension Manager) 核心功能
// ==========================================
let allExtensions = [];
let currentExtFilter = 'all'; // 'all' | 'enabled' | 'disabled'
let extSearchQuery = '';
const currentSelfId = (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) ? chrome.runtime.id : '';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 获取最佳图标 URL
function getExtensionIcon(ext) {
  if (ext.icons && ext.icons.length > 0) {
    const sorted = [...ext.icons].sort((a, b) => (b.size || 0) - (a.size || 0));
    const pref = sorted.find(i => i.size >= 32 && i.size <= 48) || sorted[0];
    return pref ? pref.url : '';
  }
  return '';
}

// 加载扩展列表
async function loadExtensionList() {
  if (typeof chrome === 'undefined' || !chrome.management || !chrome.management.getAll) {
    if (extListContainer) {
      extListContainer.innerHTML = '<div class="ext-empty-state">当前环境不支持 chrome.management API</div>';
    }
    return;
  }

  try {
    const list = await new Promise((resolve, reject) => {
      chrome.management.getAll((items) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(items || []);
        }
      });
    });

    // 过滤掉主题类，保留常规扩展及应用
    allExtensions = list.filter(item => item.type !== 'theme');

    // 智能排序：
    // 1. 本扩展排在最前
    // 2. 已启用排在已禁用前
    // 3. 按扩展名称拼音/字母排序
    allExtensions.sort((a, b) => {
      const aIsSelf = a.id === currentSelfId;
      const bIsSelf = b.id === currentSelfId;
      if (aIsSelf && !bIsSelf) return -1;
      if (!aIsSelf && bIsSelf) return 1;

      if (a.enabled !== b.enabled) {
        return a.enabled ? -1 : 1;
      }
      return (a.name || '').localeCompare(b.name || '', 'zh-CN');
    });

    updateExtensionCounts();
    renderExtensionsUI();
  } catch (err) {
    console.error('Failed to load extensions:', err);
    if (extListContainer) {
      extListContainer.innerHTML = `<div class="ext-empty-state" style="color: #dc2626;">加载扩展列表失败: ${escapeHtml(err.message || String(err))}</div>`;
    }
  }
}

// 更新扩展数量统计
function updateExtensionCounts() {
  const total = allExtensions.length;
  const enabledCount = allExtensions.filter(e => e.enabled).length;
  const disabledCount = total - enabledCount;

  if (extCountAll) extCountAll.textContent = total;
  if (extCountEnabled) extCountEnabled.textContent = enabledCount;
  if (extCountDisabled) extCountDisabled.textContent = disabledCount;
}

// 渲染扩展列表 UI
function renderExtensionsUI() {
  if (!extListContainer) return;
  extListContainer.innerHTML = '';

  const q = extSearchQuery.trim().toLowerCase();
  const filtered = allExtensions.filter(ext => {
    // 状态过滤
    if (currentExtFilter === 'enabled' && !ext.enabled) return false;
    if (currentExtFilter === 'disabled' && ext.enabled) return false;

    // 关键词搜索
    if (q) {
      const name = (ext.name || '').toLowerCase();
      const shortName = (ext.shortName || '').toLowerCase();
      const desc = (ext.description || '').toLowerCase();
      const id = (ext.id || '').toLowerCase();
      return name.includes(q) || shortName.includes(q) || desc.includes(q) || id.includes(q);
    }
    return true;
  });

  if (filtered.length === 0) {
    extListContainer.innerHTML = `
      <div class="ext-empty-state">
        ${q ? '未找到符合条件的扩展' : (currentExtFilter === 'enabled' ? '暂无已启用的扩展' : (currentExtFilter === 'disabled' ? '暂无已禁用的扩展' : '暂无已安装的扩展'))}
      </div>
    `;
    return;
  }

  const fragment = document.createDocumentFragment();

  filtered.forEach(ext => {
    const isSelf = ext.id === currentSelfId;
    const isEnabled = !!ext.enabled;
    const canDisable = ext.mayDisable !== false && !isSelf;
    const iconUrl = getExtensionIcon(ext);

    const card = document.createElement('div');
    card.className = `ext-card ${isEnabled ? '' : 'disabled'} ${isSelf ? 'self-ext' : ''}`;
    card.dataset.id = ext.id;

    // 1. 图标区域
    const iconWrap = document.createElement('div');
    iconWrap.className = 'ext-icon-wrap';

    if (iconUrl) {
      const img = document.createElement('img');
      img.className = 'ext-icon';
      img.src = iconUrl;
      img.alt = ext.name || 'icon';
      img.onerror = () => {
        iconWrap.innerHTML = `<div class="ext-icon-fallback">${escapeHtml((ext.name || 'E').charAt(0).toUpperCase())}</div>`;
      };
      iconWrap.appendChild(img);
    } else {
      iconWrap.innerHTML = `<div class="ext-icon-fallback">${escapeHtml((ext.name || 'E').charAt(0).toUpperCase())}</div>`;
    }

    // 2. 信息详情区域
    const infoDiv = document.createElement('div');
    infoDiv.className = 'ext-info';

    const headerLine = document.createElement('div');
    headerLine.className = 'ext-header-line';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'ext-name';
    nameSpan.textContent = ext.name || ext.shortName || '未命名扩展';
    nameSpan.title = `${ext.name || ''}\n版本: ${ext.version || ''}\nID: ${ext.id}`;
    headerLine.appendChild(nameSpan);

    if (ext.version) {
      const verSpan = document.createElement('span');
      verSpan.className = 'ext-version-chip';
      verSpan.textContent = `v${ext.version}`;
      headerLine.appendChild(verSpan);
    }

    if (isSelf) {
      const selfSpan = document.createElement('span');
      selfSpan.className = 'ext-self-badge';
      selfSpan.textContent = '🛡️ 本扩展 (保护中)';
      headerLine.appendChild(selfSpan);
    }

    const descDiv = document.createElement('div');
    descDiv.className = 'ext-desc';
    descDiv.textContent = ext.description || '暂无详细描述';
    descDiv.title = ext.description || '';

    const metaLine = document.createElement('div');
    metaLine.className = 'ext-meta-line';
    metaLine.innerHTML = `<span>ID: ${escapeHtml(ext.id)}</span>`;

    infoDiv.appendChild(headerLine);
    infoDiv.appendChild(descDiv);
    infoDiv.appendChild(metaLine);

    // 3. 右侧操作控制区
    const rightCol = document.createElement('div');
    rightCol.className = 'ext-right-col';

    // 启停开关
    const toggleWrap = document.createElement('div');
    toggleWrap.className = 'ext-toggle-wrap';

    const switchLabel = document.createElement('label');
    switchLabel.className = 'ext-switch';
    if (isSelf) {
      switchLabel.title = '为避免自锁，已锁定当前扩展启用状态';
    } else if (!canDisable) {
      switchLabel.title = '系统策略托管扩展，不可禁用';
    }

    const switchInput = document.createElement('input');
    switchInput.type = 'checkbox';
    switchInput.checked = isEnabled;
    switchInput.disabled = !canDisable;

    const sliderSpan = document.createElement('span');
    sliderSpan.className = 'ext-slider';

    switchLabel.appendChild(switchInput);
    switchLabel.appendChild(sliderSpan);
    toggleWrap.appendChild(switchLabel);

    // 开关切换监听
    switchInput.addEventListener('change', async (e) => {
      const targetState = e.target.checked;
      try {
        await new Promise((resolve, reject) => {
          chrome.management.setEnabled(ext.id, targetState, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          });
        });

        ext.enabled = targetState;
        if (targetState) {
          card.classList.remove('disabled');
        } else {
          card.classList.add('disabled');
        }
        updateExtensionCounts();

        if (currentExtFilter !== 'all') {
          renderExtensionsUI();
        }
      } catch (err) {
        console.error('Failed to toggle extension state:', err);
        e.target.checked = !targetState;
        alert(`切换扩展状态失败: ${err.message || err}`);
      }
    });

    // 快捷按钮行
    const actionsRow = document.createElement('div');
    actionsRow.className = 'ext-actions-row';

    // ⚙️ 设置按钮 (Options)
    const optionsBtn = document.createElement('button');
    optionsBtn.className = 'ext-action-btn';
    optionsBtn.innerHTML = '⚙️';
    optionsBtn.title = '打开扩展设置/选项页';
    optionsBtn.addEventListener('click', () => {
      if (ext.optionsUrl) {
        chrome.tabs.create({ url: ext.optionsUrl });
      } else {
        chrome.tabs.create({ url: `chrome://extensions/?options=${ext.id}` });
      }
    });

    // 🌐 商店/主页按钮
    const homeBtn = document.createElement('button');
    homeBtn.className = 'ext-action-btn';
    homeBtn.innerHTML = '🌐';
    homeBtn.title = '打开扩展主页 / Web Store 商店页面';
    homeBtn.addEventListener('click', () => {
      const targetUrl = ext.homepageUrl || `https://chromewebstore.google.com/detail/${ext.id}`;
      chrome.tabs.create({ url: targetUrl });
    });

    // 📋 复制 ID 按钮
    const copyIdBtn = document.createElement('button');
    copyIdBtn.className = 'ext-action-btn';
    copyIdBtn.innerHTML = '📋';
    copyIdBtn.title = '复制扩展 ID 到剪贴板';
    copyIdBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(ext.id);
        copyIdBtn.innerHTML = '✅';
        setTimeout(() => {
          copyIdBtn.innerHTML = '📋';
        }, 1500);
      } catch (err) {
        console.error('Failed to copy ID:', err);
      }
    });

    // 🗑️ 卸载按钮
    const uninstallBtn = document.createElement('button');
    uninstallBtn.className = 'ext-action-btn danger';
    uninstallBtn.innerHTML = '🗑️';
    uninstallBtn.title = isSelf ? '不能卸载当前扩展' : '卸载此扩展';
    uninstallBtn.disabled = isSelf || !canDisable;

    uninstallBtn.addEventListener('click', () => {
      if (isSelf) return;
      chrome.management.uninstall(ext.id, { showConfirmDialog: true }, () => {
        if (!chrome.runtime.lastError) {
          loadExtensionList();
        }
      });
    });

    actionsRow.appendChild(optionsBtn);
    actionsRow.appendChild(homeBtn);
    actionsRow.appendChild(copyIdBtn);
    actionsRow.appendChild(uninstallBtn);

    rightCol.appendChild(toggleWrap);
    rightCol.appendChild(actionsRow);

    card.appendChild(iconWrap);
    card.appendChild(infoDiv);
    card.appendChild(rightCol);

    fragment.appendChild(card);
  });

  extListContainer.appendChild(fragment);
}

// 扩展管理器事件监听绑定
if (extSearchInput) {
  extSearchInput.addEventListener('input', (e) => {
    extSearchQuery = e.target.value;
    if (extSearchClearBtn) {
      extSearchClearBtn.style.display = extSearchQuery ? 'block' : 'none';
    }
    renderExtensionsUI();
  });
}

if (extSearchClearBtn) {
  extSearchClearBtn.addEventListener('click', () => {
    extSearchQuery = '';
    if (extSearchInput) extSearchInput.value = '';
    extSearchClearBtn.style.display = 'none';
    renderExtensionsUI();
  });
}

const filterPillList = [
  { btn: extFilterAll, filter: 'all' },
  { btn: extFilterEnabled, filter: 'enabled' },
  { btn: extFilterDisabled, filter: 'disabled' }
];

filterPillList.forEach(item => {
  if (item.btn) {
    item.btn.addEventListener('click', () => {
      filterPillList.forEach(p => p.btn && p.btn.classList.remove('active'));
      item.btn.classList.add('active');
      currentExtFilter = item.filter;
      renderExtensionsUI();
    });
  }
});

if (extRefreshListBtn) {
  extRefreshListBtn.addEventListener('click', () => {
    loadExtensionList();
  });
}

if (extOpenChromeExtensionsBtn) {
  extOpenChromeExtensionsBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'chrome://extensions/' });
  });
}

// 监听 Chrome 原生扩展状态变更事件
if (typeof chrome !== 'undefined' && chrome.management) {
  if (chrome.management.onEnabled) {
    chrome.management.onEnabled.addListener(() => loadExtensionList());
  }
  if (chrome.management.onDisabled) {
    chrome.management.onDisabled.addListener(() => loadExtensionList());
  }
  if (chrome.management.onInstalled) {
    chrome.management.onInstalled.addListener(() => loadExtensionList());
  }
  if (chrome.management.onUninstalled) {
    chrome.management.onUninstalled.addListener(() => loadExtensionList());
  }
}

// ==========================================
// 7. 全局初始化与数据加载
// ==========================================
async function init() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) {
      if (statsInfo) statsInfo.textContent = '无法获取当前网页';
      await loadGrokData();
      await loadUaSettings();
      await loadWebrtcSettings();
      await loadPipSettingsAndStatus();
      await loadSpeedSettingsAndStatus();
      await loadExtensionList();
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

      // 如果当前访问的是 grok.com 或 x.ai 域名，智能默认聚焦 Grok 助手 Tab
      if (currentHostname.includes('grok.com') || currentHostname.includes('x.ai')) {
        switchTab('panelGrok');
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
        statsInfo.innerHTML = `站点: <strong>${currentHostname || '本地'}</strong> (${currentCookies.length} 个 Cookie, HttpOnly: <strong>${httpOnlyCount}</strong>)`;
      }
      if (kshopIndicator) {
        kshopIndicator.textContent = hasKshop ? '✅ 已包含 kshop.api_st' : '';
      }
    } catch (e) {
      if (statsInfo) statsInfo.textContent = '非标准网页或无 Cookie';
    }

    // 并行初始化各模块数据
    await Promise.all([
      loadGrokData(),
      loadUaSettings(),
      loadWebrtcSettings(),
      loadPipSettingsAndStatus(),
      loadSpeedSettingsAndStatus(),
      loadExtensionList()
    ]);

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
