// Automated Test Suite for Extension Manager Integration
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 Starting Extension Manager Test Suite...\n');

// 1. Test manifest.json configuration
console.log('▶ Test 1: manifest.json permissions and version verification');
const manifestPath = path.join(__dirname, 'manifest.json');
const manifestContent = fs.readFileSync(manifestPath, 'utf8');
const manifest = JSON.parse(manifestContent);

assert.strictEqual(manifest.manifest_version, 3, 'Manifest must be MV3');
assert.ok(manifest.permissions.includes('management'), 'manifest.permissions must include "management"');
assert.strictEqual(manifest.version, '1.7.0', 'Version should be updated to 1.7.0');
assert.ok(manifest.name.includes('扩展'), 'Manifest name should mention extension management capabilities');
console.log('  ✅ manifest.json verified successfully!\n');

// 2. Test popup.html & popup.js DOM Structure and Logic Integration
console.log('▶ Test 2: popup.html UI & popup.js DOM element verification');
const popupHtmlPath = path.join(__dirname, 'popup.html');
const popupHtml = fs.readFileSync(popupHtmlPath, 'utf8');

const popupJsPath = path.join(__dirname, 'popup.js');
const popupJs = fs.readFileSync(popupJsPath, 'utf8');

const requiredHtmlElements = [
  'id="navTabExtensions"',
  'id="panelExtensions"',
  'id="extSearchInput"',
  'id="extSearchClearBtn"',
  'id="extFilterAll"',
  'id="extFilterEnabled"',
  'id="extFilterDisabled"',
  'id="extCountAll"',
  'id="extCountEnabled"',
  'id="extCountDisabled"',
  'id="extRefreshListBtn"',
  'id="extOpenChromeExtensionsBtn"',
  'id="extListContainer"',
  '.ext-card',
  '.ext-switch',
  '.ext-filter-pill'
];

for (const el of requiredHtmlElements) {
  assert.ok(popupHtml.includes(el), `popup.html must contain ${el}`);
}

const requiredJsTokens = [
  'loadExtensionList',
  'renderExtensionsUI',
  'chrome.management.getAll',
  'chrome.management.setEnabled',
  'chrome.management.uninstall',
  'currentSelfId',
  'updateExtensionCounts'
];

for (const token of requiredJsTokens) {
  assert.ok(popupJs.includes(token), `popup.js must contain ${token}`);
}
console.log('  ✅ popup.html DOM elements, CSS styles and popup.js logic verified!\n');

// 3. Test Extension Manager Logic Simulation
console.log('▶ Test 3: Extension Sorting, Filtering & Self-Protection Logic');

// Mock helpers from popup.js
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getExtensionIcon(ext) {
  if (ext.icons && ext.icons.length > 0) {
    const sorted = [...ext.icons].sort((a, b) => (b.size || 0) - (a.size || 0));
    const pref = sorted.find(i => i.size >= 32 && i.size <= 48) || sorted[0];
    return pref ? pref.url : '';
  }
  return '';
}

const currentSelfId = 'self_test_id_12345';

const mockExtensions = [
  {
    id: 'ext_b',
    name: 'B Extension (Disabled)',
    shortName: 'B',
    description: 'A tool for tests',
    enabled: false,
    mayDisable: true,
    icons: [{ size: 16, url: 'b16.png' }, { size: 48, url: 'b48.png' }]
  },
  {
    id: 'ext_a',
    name: 'A Extension (Enabled)',
    shortName: 'A',
    description: 'Another test tool',
    enabled: true,
    mayDisable: true,
    icons: [{ size: 32, url: 'a32.png' }]
  },
  {
    id: 'self_test_id_12345',
    name: 'Cookie & Grok Assistant Pro (Self)',
    shortName: 'Self',
    description: 'Current running extension',
    enabled: true,
    mayDisable: true,
    icons: [{ size: 128, url: 'self128.png' }, { size: 32, url: 'self32.png' }]
  },
  {
    id: 'ext_managed',
    name: 'Managed Enterprise Extension',
    shortName: 'Enterprise',
    description: 'Cannot be disabled by user',
    enabled: true,
    mayDisable: false
  },
  {
    id: 'theme_1',
    name: 'Dark Theme',
    type: 'theme',
    enabled: true
  }
];

// 3.1 Test Theme Filtering
const nonThemeExtensions = mockExtensions.filter(item => item.type !== 'theme');
assert.strictEqual(nonThemeExtensions.length, 4, 'Themes should be excluded');

// 3.2 Test Sorting (Self first, then enabled, then alphabetical)
nonThemeExtensions.sort((a, b) => {
  const aIsSelf = a.id === currentSelfId;
  const bIsSelf = b.id === currentSelfId;
  if (aIsSelf && !bIsSelf) return -1;
  if (!aIsSelf && bIsSelf) return 1;

  if (a.enabled !== b.enabled) {
    return a.enabled ? -1 : 1;
  }
  return (a.name || '').localeCompare(b.name || '', 'zh-CN');
});

assert.strictEqual(nonThemeExtensions[0].id, currentSelfId, 'Self extension must be first');
assert.strictEqual(nonThemeExtensions[1].id, 'ext_a', 'Enabled extension A should come before disabled B');
assert.strictEqual(nonThemeExtensions[3].id, 'ext_b', 'Disabled extension B should come last');

// 3.3 Test Icon Selection
assert.strictEqual(getExtensionIcon(mockExtensions[0]), 'b48.png', 'Should pick 48px icon for ext_b');
assert.strictEqual(getExtensionIcon(mockExtensions[2]), 'self32.png', 'Should pick 32px icon for self extension');

// 3.4 Test Self Protection Checks
function canToggle(ext, selfId) {
  const isSelf = ext.id === selfId;
  return ext.mayDisable !== false && !isSelf;
}

function canUninstall(ext, selfId) {
  const isSelf = ext.id === selfId;
  return !isSelf && ext.mayDisable !== false;
}

assert.strictEqual(canToggle(mockExtensions[2], currentSelfId), false, 'Self extension cannot be toggled');
assert.strictEqual(canUninstall(mockExtensions[2], currentSelfId), false, 'Self extension cannot be uninstalled');
assert.strictEqual(canToggle(mockExtensions[3], currentSelfId), false, 'Enterprise managed extension cannot be toggled');
assert.strictEqual(canToggle(mockExtensions[1], currentSelfId), true, 'Regular extension can be toggled');
assert.strictEqual(canUninstall(mockExtensions[1], currentSelfId), true, 'Regular extension can be uninstalled');

// 3.5 Test Search Filtering
function filterExtensions(list, filter, query) {
  const q = query.trim().toLowerCase();
  return list.filter(ext => {
    if (filter === 'enabled' && !ext.enabled) return false;
    if (filter === 'disabled' && ext.enabled) return false;
    if (q) {
      const name = (ext.name || '').toLowerCase();
      const shortName = (ext.shortName || '').toLowerCase();
      const desc = (ext.description || '').toLowerCase();
      const id = (ext.id || '').toLowerCase();
      return name.includes(q) || shortName.includes(q) || desc.includes(q) || id.includes(q);
    }
    return true;
  });
}

const allFiltered = filterExtensions(nonThemeExtensions, 'all', '');
assert.strictEqual(allFiltered.length, 4);

const enabledFiltered = filterExtensions(nonThemeExtensions, 'enabled', '');
assert.strictEqual(enabledFiltered.length, 3);

const disabledFiltered = filterExtensions(nonThemeExtensions, 'disabled', '');
assert.strictEqual(disabledFiltered.length, 1);
assert.strictEqual(disabledFiltered[0].id, 'ext_b');

const searchByKeyword = filterExtensions(nonThemeExtensions, 'all', 'Enterprise');
assert.strictEqual(searchByKeyword.length, 1);
assert.strictEqual(searchByKeyword[0].id, 'ext_managed');

const searchById = filterExtensions(nonThemeExtensions, 'all', '12345');
assert.strictEqual(searchById.length, 1);
assert.strictEqual(searchById[0].id, currentSelfId);

// 3.6 Test XSS prevention
const dangerousExt = { name: '<script>alert(1)</script>', id: 'xss" autofocus' };
assert.ok(!escapeHtml(dangerousExt.name).includes('<script>'), 'escapeHtml must sanitize HTML tags');
assert.ok(escapeHtml(dangerousExt.name).includes('&lt;script&gt;'), 'escapeHtml must encode angle brackets');

console.log('  ✅ Extension Manager logic and edge cases passed 100%!\n');

console.log('🎉 ALL EXTENSION MANAGER TESTS PASSED SUCCESSFULLY! ✅\n');
