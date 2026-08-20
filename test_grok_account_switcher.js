// Automated Test Suite for Grok Multi-Account Import & Switcher Logic
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 Starting Grok Account Multi-Account & Switcher Test Suite...\n');

// 1. Verify popup.html DOM elements
console.log('▶ Test 1: popup.html DOM elements for account counters');
const popupHtmlPath = path.join(__dirname, 'popup.html');
const popupHtml = fs.readFileSync(popupHtmlPath, 'utf8');

const requiredCounters = [
  'id="navGrokAccountCount"',
  'id="grokSwitcherCount"',
  'id="grokAccountCount"'
];

for (const el of requiredCounters) {
  assert.ok(popupHtml.includes(el), `popup.html must contain ${el}`);
}
console.log('  ✅ popup.html account counters verified!\n');

// 2. Test Multi-Account Import Deduplication Fix
console.log('▶ Test 2: Multi-Account Import & Deduplication (Prefix bug fix)');

// Mock functions from popup.js
function parseJwtPayload(token) {
  try {
    const parts = (token || '').split('.');
    if (parts.length >= 2) {
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
      return JSON.parse(jsonPayload);
    }
  } catch (e) {}
  return null;
}

function createAccountFromSsoToken(token, defaultName = null) {
  const cleanToken = (token || '').trim();
  const payload = parseJwtPayload(cleanToken) || {};
  const sessionId = payload.session_id || payload.sub || payload.user_id || '';
  const now = Date.now();

  const cookies = [
    { name: 'sso', value: cleanToken, domain: '.grok.com', path: '/', secure: true, httpOnly: true, sameSite: 'lax' },
    { name: 'sso-rw', value: cleanToken, domain: '.grok.com', path: '/', secure: true, httpOnly: true, sameSite: 'lax' }
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

// Two different JWT tokens that both start with standard RS256 header "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9"
const jwtHeader = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
const jwtPayload1 = Buffer.from(JSON.stringify({ sub: 'user-uuid-1111', email: 'acc1@gmail.com' })).toString('base64url');
const jwtPayload2 = Buffer.from(JSON.stringify({ sub: 'user-uuid-2222', email: 'acc2@gmail.com' })).toString('base64url');

const token1 = `${jwtHeader}.${jwtPayload1}.signature111111111111111111111111`;
const token2 = `${jwtHeader}.${jwtPayload2}.signature222222222222222222222222`;

// Both tokens share the exact same first 20 characters
assert.strictEqual(token1.slice(0, 20), token2.slice(0, 20), 'Both tokens share same JWT header prefix');

// State simulation
let grokData = {
  activeAccountId: null,
  accounts: []
};

function importAccounts(accountsToImport) {
  let added = 0;
  let updated = 0;
  for (const acc of accountsToImport) {
    if (!acc.cookies || !Array.isArray(acc.cookies)) continue;
    const ssoCookie = acc.cookies.find(c => c.name === 'sso' || c.name === 'sso-rw');
    const ssoToken = ssoCookie && ssoCookie.value ? ssoCookie.value.trim() : '';
    const userId = acc.userId || '';

    const existIdx = grokData.accounts.findIndex(a => {
      if (userId && a.userId && a.userId === userId) return true;
      if (ssoToken && a.cookies && Array.isArray(a.cookies)) {
        const aSso = a.cookies.find(c => c.name === 'sso' || c.name === 'sso-rw');
        if (aSso && aSso.value && aSso.value.trim() === ssoToken) return true;
      }
      return false;
    });

    if (existIdx >= 0) {
      grokData.accounts[existIdx] = {
        ...grokData.accounts[existIdx],
        ...acc,
        id: grokData.accounts[existIdx].id,
        updatedAt: Date.now()
      };
      updated++;
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
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      grokData.accounts.push(newAcc);
      added++;
    }
  }
  if (!grokData.activeAccountId && grokData.accounts.length > 0) {
    grokData.activeAccountId = grokData.accounts[0].id;
  }
  return { added, updated };
}

// 2.1 Import Account 1
const acc1 = createAccountFromSsoToken(token1, '主账号 1');
const res1 = importAccounts([acc1]);
assert.strictEqual(res1.added, 1);
assert.strictEqual(grokData.accounts.length, 1);
assert.strictEqual(grokData.activeAccountId, grokData.accounts[0].id);

// 2.2 Import Account 2 (must NOT overwrite Account 1 despite identical JWT header prefix)
const acc2 = createAccountFromSsoToken(token2, '备用账号 2');
const res2 = importAccounts([acc2]);
assert.strictEqual(res2.added, 1);
assert.strictEqual(grokData.accounts.length, 2, 'Total accounts must now be 2!');
assert.strictEqual(grokData.accounts[0].name, '主账号 1');
assert.strictEqual(grokData.accounts[1].name, '备用账号 2');
console.log('  ✅ Successfully imported 2 distinct accounts without collision!');

// 2.3 Re-import Account 1 (must update existing account, not add duplicate)
const acc1Update = createAccountFromSsoToken(token1, '主账号 1 (更新)');
const res3 = importAccounts([acc1Update]);
assert.strictEqual(res3.updated, 1);
assert.strictEqual(res3.added, 0);
assert.strictEqual(grokData.accounts.length, 2, 'Total accounts should remain 2 on deduplication');
console.log('  ✅ Re-importing existing account accurately updates without duplicates!\n');

// 4. Test Raw SSO Input Parsing (Direct String / sso=xxx / Multiline)
console.log('▶ Test 4: Raw SSO Cookie String & Multiline Intelligent Parsing');

function parseRawGrokInput(rawInput) {
  const text = (rawInput || '').trim();
  if (!text) return [];
  let accountsToImport = [];

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      if (parsed.length > 0 && typeof parsed[0] === 'string') {
        accountsToImport = parsed.map((token, i) => createAccountFromSsoToken(token, `Grok 账号 ${i + 1}`));
      } else if (parsed.length > 0 && parsed[0].cookies) {
        accountsToImport = parsed;
      }
    } else if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.fullAccounts)) {
        accountsToImport = parsed.fullAccounts;
      } else if (Array.isArray(parsed.accounts)) {
        accountsToImport = parsed.accounts.map((t, i) => createAccountFromSsoToken(t, `Grok 账号 ${i + 1}`));
      }
    }
  } catch (e) {}

  if (!accountsToImport || accountsToImport.length === 0) {
    const lines = text.split(/[\r\n]+/);
    const lineAccounts = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      let customName = null;
      let lineText = line;

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
    }
  }

  return accountsToImport;
}

// 4.1 Pure raw JWT string input
const rawResult1 = parseRawGrokInput(token1);
assert.strictEqual(rawResult1.length, 1);
assert.strictEqual(rawResult1[0].cookies.find(c => c.name === 'sso').value, token1);

// 4.2 sso=eyJ... Cookie format
const rawResult2 = parseRawGrokInput(`sso=${token2}; path=/; domain=.grok.com`);
assert.strictEqual(rawResult2.length, 1);
assert.strictEqual(rawResult2[0].cookies.find(c => c.name === 'sso').value, token2);

// 4.3 Multiline with custom names
const multilineInput = `
我的主号: ${token1}
工作备用号 ---- ${token2}
`;
const rawResult3 = parseRawGrokInput(multilineInput);
assert.strictEqual(rawResult3.length, 2);
assert.strictEqual(rawResult3[0].name, '我的主号');
assert.strictEqual(rawResult3[1].name, '工作备用号');

// 4.4 Real user input test
const userActualInput = 'yyjuuok:eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzZXNzaW9uX2lkIjoiMWQ4Yjg5NjctZTY2MS00NzVkLTkwYWItNWFmOTYxMDFlNmE2In0.YOMiuxMOzLhfCWOAJl-m9SlcTwCWeJW2qraHegARlhU';
const rawResult4 = parseRawGrokInput(userActualInput);
assert.strictEqual(rawResult4.length, 1);
assert.strictEqual(rawResult4[0].name, 'yyjuuok');
assert.strictEqual(rawResult4[0].userId, '1d8b8967-e661-475d-90ab-5af96101e6a6');
assert.strictEqual(rawResult4[0].cookies.find(c => c.name === 'sso').value, 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzZXNzaW9uX2lkIjoiMWQ4Yjg5NjctZTY2MS00NzVkLTkwYWItNWFmOTYxMDFlNmE2In0.YOMiuxMOzLhfCWOAJl-m9SlcTwCWeJW2qraHegARlhU');

// Test importing real user input
const resUserImport = importAccounts(rawResult4);
assert.strictEqual(resUserImport.added, 1);
assert.strictEqual(grokData.accounts.length, 3);
assert.strictEqual(grokData.accounts[2].name, 'yyjuuok');

console.log('  ✅ Raw SSO Token, sso=xxx key-value & multiline inputs parsed successfully!\n');

console.log('🎉 ALL GROK MULTI-ACCOUNT & SWITCHER TESTS PASSED SUCCESSFULLY! ✅\n');
