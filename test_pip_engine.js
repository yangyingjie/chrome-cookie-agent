// test_pip_engine.js - Comprehensive Test Suite for Picture-in-Picture Engine
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Picture-in-Picture Suite Verification...\n');

// 1. Verify manifest.json
console.log('--- Test 1: manifest.json Integrity & MV3 Compliance ---');
const manifestPath = path.join(__dirname, 'manifest.json');
const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

assert.strictEqual(manifestContent.manifest_version, 3, 'Manifest version must be 3');
assert.ok(manifestContent.permissions.includes('contextMenus'), 'permissions must include contextMenus');
assert.ok(manifestContent.commands && manifestContent.commands['toggle-pip'], 'commands must define toggle-pip');
assert.strictEqual(manifestContent.commands['toggle-pip'].suggested_key.default, 'Alt+P', 'Default shortcut should be Alt+P');
assert.ok(manifestContent.content_scripts[0].js.includes('pip_engine.js'), 'content_scripts must load pip_engine.js');
console.log('✅ Test 1 Passed: manifest.json is valid MV3 with commands, permissions, and scripts.\n');

// 2. Mock DOM & PipEngine Tests
console.log('--- Test 2: Mock DOM & PipEngine Algorithms ---');

// Create a lightweight DOM simulation for node.js environment
class MockElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.shadowRoot = null;
    this.attributes = {};
    this.style = { display: 'block', visibility: 'visible', opacity: '1' };
    this.clientWidth = 640;
    this.clientHeight = 360;
    this.videoWidth = 640;
    this.videoHeight = 360;
    this.offsetWidth = 640;
    this.offsetHeight = 360;
    this.paused = true;
    this.ended = false;
    this.currentTime = 0;
    this.readyState = 4;
    this.duration = 100;
    this.src = 'https://example.com/video.mp4';
    this.currentSrc = 'https://example.com/video.mp4';
    this.disablePictureInPicture = false;
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  querySelectorAll(selector) {
    const results = [];
    const search = (node) => {
      for (const child of node.children) {
        if (child.tagName.toLowerCase() === selector.toLowerCase()) {
          results.push(child);
        }
        search(child);
      }
    };
    search(this);
    return results;
  }

  hasAttribute(name) {
    return Object.prototype.hasOwnProperty.call(this.attributes, name);
  }

  removeAttribute(name) {
    delete this.attributes[name];
  }

  setAttribute(name, val) {
    this.attributes[name] = val;
  }

  getBoundingClientRect() {
    return { width: this.clientWidth, height: this.clientHeight };
  }

  async requestPictureInPicture() {
    if (this.shouldFailPip) {
      throw new Error('User denied or video not allowed');
    }
    mockDocument.pictureInPictureElement = this;
    return { width: this.clientWidth, height: this.clientHeight };
  }
}

const mockDocument = {
  pictureInPictureEnabled: true,
  pictureInPictureElement: null,
  body: new MockElement('body'),
  querySelectorAll: function(sel) {
    return this.body.querySelectorAll(sel);
  },
  createTreeWalker: function(root, filter, fn) {
    const allNodes = [];
    const traverse = (node) => {
      allNodes.push(node);
      for (const c of node.children) {
        traverse(c);
      }
    };
    traverse(root);
    let index = 0;
    return {
      currentNode: allNodes[0] || null,
      nextNode: () => {
        index++;
        return allNodes[index] || null;
      }
    };
  },
  exitPictureInPicture: async function() {
    if (!this.pictureInPictureElement) {
      throw new Error('No picture in picture element active');
    }
    this.pictureInPictureElement = null;
  },
  addEventListener: () => {}
};

global.document = mockDocument;
global.window = {
  getComputedStyle: (el) => el.style,
  location: { hostname: 'example.com' },
  addEventListener: () => {}
};
global.NodeFilter = { SHOW_ELEMENT: 1 };
global.Document = function() {};
Object.setPrototypeOf(mockDocument, global.Document.prototype);

// Load PipEngine module
const PipEngine = require('./pip_engine.js');

// Test 2.1: Finding standard videos
const container = new MockElement('div');
const v1 = new MockElement('video');
v1.src = 'https://example.com/v1.mp4';
container.appendChild(v1);
mockDocument.body.appendChild(container);

const foundVideos1 = PipEngine.findAllVideos(mockDocument);
assert.strictEqual(foundVideos1.length, 1, 'Should find 1 video');
assert.strictEqual(foundVideos1[0].src, 'https://example.com/v1.mp4');
console.log('  ✔ Subtest 2.1 Passed: Found standard document videos.');

// Test 2.2: Finding videos in Shadow DOM
const customPlayer = new MockElement('custom-player');
const shadowRoot = new MockElement('shadow-root');
const vShadow = new MockElement('video');
vShadow.src = 'https://example.com/shadow_video.mp4';
shadowRoot.appendChild(vShadow);
customPlayer.shadowRoot = shadowRoot;
mockDocument.body.appendChild(customPlayer);

const foundVideos2 = PipEngine.findAllVideos(mockDocument);
assert.strictEqual(foundVideos2.length, 2, 'Should find 2 videos (including Shadow DOM)');
assert.ok(foundVideos2.some(v => v.src.includes('shadow_video.mp4')), 'Shadow DOM video must be discovered');
console.log('  ✔ Subtest 2.2 Passed: Shadow DOM recursive traversal.');

// Test 2.3: Unlocking video restrictions
const restrictedVideo = new MockElement('video');
restrictedVideo.disablePictureInPicture = true;
restrictedVideo.setAttribute('disablepictureinpicture', 'true');
PipEngine.unlockVideoRestrictions(restrictedVideo);
assert.strictEqual(restrictedVideo.disablePictureInPicture, false, 'disablePictureInPicture must be reset to false');
assert.strictEqual(restrictedVideo.hasAttribute('disablepictureinpicture'), false, 'Attribute must be removed');
console.log('  ✔ Subtest 2.3 Passed: Restrictions (disablePictureInPicture) successfully unlocked.');

// Test 2.4: Video candidate scoring and best video selection
v1.paused = true;
v1.clientWidth = 300;
v1.clientHeight = 200;

vShadow.paused = false; // Currently playing!
vShadow.currentTime = 15;
vShadow.clientWidth = 1280;
vShadow.clientHeight = 720;

const bestVideo = PipEngine.findBestVideo(mockDocument);
assert.strictEqual(bestVideo, vShadow, 'Playing video with higher resolution should be selected as best candidate');
console.log('  ✔ Subtest 2.4 Passed: Candidate ranking algorithm correctly prioritizes active playing video.');

// Test 2.5: Toggle Enter and Exit Picture-in-Picture
(async () => {
  console.log('--- Test 3: Toggle Picture-in-Picture Workflow ---');
  
  // Enter PiP
  mockDocument.pictureInPictureElement = null;
  const enterResult = await PipEngine.togglePictureInPicture(mockDocument);
  assert.strictEqual(enterResult.success, true, 'PiP enter should succeed');
  assert.strictEqual(enterResult.action, 'entered', 'Action should be entered');
  assert.strictEqual(mockDocument.pictureInPictureElement, vShadow, 'vShadow should now be the PiP element');
  
  // Status check
  const statusInPip = PipEngine.getPipStatus(mockDocument);
  assert.strictEqual(statusInPip.isInPip, true, 'Status must report isInPip: true');
  assert.strictEqual(statusInPip.playingVideos, 1, '1 video playing');
  console.log('  ✔ Subtest 3.1 Passed: Successfully entered PiP and verified state.');

  // Exit PiP
  const exitResult = await PipEngine.togglePictureInPicture(mockDocument);
  assert.strictEqual(exitResult.success, true, 'PiP exit should succeed');
  assert.strictEqual(exitResult.action, 'exited', 'Action should be exited');
  assert.strictEqual(mockDocument.pictureInPictureElement, null, 'PiP element should be cleared');
  console.log('  ✔ Subtest 3.2 Passed: Successfully exited PiP.');

  // Test 3.4: Auto-PiP Initialization and mediaSession action handler
  let mediaSessionHandler = null;
  const mockMediaSession = {
    setActionHandler: (action, fn) => {
      if (action === 'enterpictureinpicture') {
        mediaSessionHandler = fn;
      }
    }
  };

  try {
    Object.defineProperty(globalThis.navigator, 'mediaSession', {
      value: mockMediaSession,
      configurable: true,
      writable: true
    });
  } catch (e) {
    globalThis.navigator = { mediaSession: mockMediaSession };
  }

  PipEngine.initAutoPip(true);
  assert.strictEqual(global.window.__CHROME_PIP_AUTO_ENABLED__, true, 'Auto-PiP should be enabled in global window');
  assert.ok(typeof mediaSessionHandler === 'function', 'enterpictureinpicture mediaSession action handler should be registered');
  console.log('  ✔ Subtest 3.4 Passed: Auto-PiP initialization and mediaSession action handler verified.');

  console.log('\n🎉 ALL PICTURE-IN-PICTURE TESTS PASSED SUCCESSFULLY! 🎉\n');
})();
