// test_speed_engine.js - Comprehensive Test Suite for Global Speed Engine
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Global Speed & Media Controller Suite Verification...\n');

// 1. Verify manifest.json
console.log('--- Test 1: manifest.json Integrity for Speed Engine ---');
const manifestPath = path.join(__dirname, 'manifest.json');
const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

assert.strictEqual(manifestContent.manifest_version, 3, 'Manifest version must be 3');
assert.ok(manifestContent.content_scripts[0].js.includes('speed_engine.js'), 'content_scripts must load speed_engine.js');
console.log('✅ Test 1 Passed: manifest.json includes speed_engine.js in content_scripts.\n');

// 2. Mock DOM & Media Elements for SpeedEngine
console.log('--- Test 2: Mock Media DOM & SpeedEngine Algorithms ---');

class MockMediaElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.shadowRoot = null;
    this.style = {};
    this.playbackRate = 1.0;
    this.defaultPlaybackRate = 1.0;
    this.preservesPitch = true;
    this.mozPreservesPitch = true;
    this.webkitPreservesPitch = true;
    this.paused = true;
    this.currentTime = 10;
    this.duration = 120;
    this.eventListeners = {};
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  addEventListener(event, fn) {
    if (!this.eventListeners[event]) this.eventListeners[event] = [];
    this.eventListeners[event].push(fn);
  }

  dispatchEvent(event) {
    const list = this.eventListeners[event] || [];
    for (const fn of list) {
      fn({ target: this });
    }
  }

  play() {
    this.paused = false;
    return Promise.resolve();
  }

  pause() {
    this.paused = true;
  }
}

class MockAudioContext {
  constructor() {
    this.state = 'running';
    this.currentTime = 0;
    this.destination = {};
  }

  createMediaElementSource(media) {
    return {
      connect: (dest) => {}
    };
  }

  createGain() {
    return {
      gain: {
        value: 1.0,
        setValueAtTime: (val, time) => {
          this.gainValue = val;
        }
      },
      connect: (dest) => {}
    };
  }

  resume() {
    this.state = 'running';
    return Promise.resolve();
  }
}

const mockDoc = {
  body: new MockMediaElement('body'),
  activeElement: null,
  querySelectorAll: function(sel) {
    const results = [];
    const search = (node) => {
      for (const child of node.children) {
        if (sel.toLowerCase().includes(child.tagName.toLowerCase())) {
          results.push(child);
        }
        search(child);
      }
    };
    search(this.body);
    return results;
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
  getElementById: () => null,
  createElement: (tag) => new MockMediaElement(tag)
};

global.document = mockDoc;
let windowKeydownListener = null;
global.window = {
  AudioContext: MockAudioContext,
  webkitAudioContext: MockAudioContext,
  addEventListener: (event, fn) => {
    if (event === 'keydown') windowKeydownListener = fn;
  }
};
global.NodeFilter = { SHOW_ELEMENT: 1 };
global.Document = function() {};
Object.setPrototypeOf(mockDoc, global.Document.prototype);

// Load speed_engine.js
const SpeedEngine = require('./speed_engine.js');

// Test 2.1: Finding standard video & audio elements
const v1 = new MockMediaElement('video');
const a1 = new MockMediaElement('audio');
mockDoc.body.appendChild(v1);
mockDoc.body.appendChild(a1);

const found1 = SpeedEngine.findAllMedia(mockDoc);
assert.strictEqual(found1.length, 2, 'Should discover 2 media elements');
console.log('  ✔ Subtest 2.1 Passed: Found standard document video & audio elements.');

// Test 2.2: Shadow DOM media discovery
const customPlayer = new MockMediaElement('video-player-component');
const shadowRoot = new MockMediaElement('shadow-root');
const vShadow = new MockMediaElement('video');
shadowRoot.appendChild(vShadow);
customPlayer.shadowRoot = shadowRoot;
mockDoc.body.appendChild(customPlayer);

const found2 = SpeedEngine.findAllMedia(mockDoc);
assert.strictEqual(found2.length, 3, 'Should discover 3 media elements (including Shadow DOM)');
console.log('  ✔ Subtest 2.2 Passed: Shadow DOM recursive traversal found nested video.');

// Test 2.3: Setting speed & preservesPitch
const resSpeed = SpeedEngine.setSpeed(2.25, true, false);
assert.strictEqual(resSpeed.speed, 2.25, 'Speed should be 2.25');
assert.strictEqual(v1.playbackRate, 2.25, 'v1 playbackRate must be 2.25');
assert.strictEqual(vShadow.playbackRate, 2.25, 'vShadow playbackRate must be 2.25');
assert.strictEqual(v1.preservesPitch, true, 'preservesPitch should be true');
console.log('  ✔ Subtest 2.3 Passed: Successfully applied 2.25x speed and pitch preservation to all media.');

// Test 2.4: Anti-Reset Protection mechanism
v1.playbackRate = 1.0;
v1.dispatchEvent('ratechange');
assert.strictEqual(v1.playbackRate, 2.25, 'playbackRate must immediately re-apply user setting after site reset');
console.log('  ✔ Subtest 2.4 Passed: Anti-reset protection successfully countered webpage playbackRate reset.');

// Test 2.5: Setting Volume Boost (e.g. 300% = 3.0)
const resBoost = SpeedEngine.setVolumeBoost(3.0, false);
assert.strictEqual(resBoost.volumeBoost, 3.0, 'Volume boost should be 3.0 (300%)');
console.log('  ✔ Subtest 2.5 Passed: Web Audio API volume booster configured to 300%.');

// Test 2.6: Seeking and Play/Pause Toggle
v1.paused = true;
v1.currentTime = 10;
SpeedEngine.togglePlayPause();
assert.strictEqual(v1.paused, false, 'togglePlayPause should play paused media');

SpeedEngine.seekRelative(5);
assert.strictEqual(v1.currentTime, 15, 'seekRelative(5) should forward 5 seconds');
SpeedEngine.seekRelative(-10);
assert.strictEqual(v1.currentTime, 5, 'seekRelative(-10) should rewind 10 seconds');
console.log('  ✔ Subtest 2.6 Passed: Play/pause toggle and relative seeking verified.');

// Test 2.7: Hotkeys & Anti-Conflict Check (D 加速, A 减速, S 恢复正常 1.0x)
console.log('--- Test 3: Hotkey Dispatch & Anti-Conflict ---');
assert.ok(typeof windowKeydownListener === 'function', 'window keydown listener should be registered');

// Test increase speed hotkey 'D'
windowKeydownListener({
  key: 'D',
  code: 'KeyD',
  preventDefault: () => {},
  stopPropagation: () => {}
});
assert.strictEqual(SpeedEngine.getSpeedStatus().speed, 2.35, 'Key D should increase speed by 0.1');

// Test decrease speed hotkey 'A'
windowKeydownListener({
  key: 'A',
  code: 'KeyA',
  preventDefault: () => {},
  stopPropagation: () => {}
});
assert.strictEqual(SpeedEngine.getSpeedStatus().speed, 2.25, 'Key A should decrease speed by 0.1');

// Test reset hotkey 'S'
windowKeydownListener({
  key: 'S',
  code: 'KeyS',
  preventDefault: () => {},
  stopPropagation: () => {}
});
assert.strictEqual(SpeedEngine.getSpeedStatus().speed, 1.0, 'Key S should reset speed to 1.0x');

// Test consecutive multiple speed-up presses (1.0 -> 1.1 -> 1.2 -> 1.3 -> 1.4 -> 1.5)
for (let i = 1; i <= 5; i++) {
  windowKeydownListener({
    key: 'D',
    code: 'KeyD',
    preventDefault: () => {},
    stopPropagation: () => {}
  });
  const expected = Math.round((1.0 + i * 0.1) * 100) / 100;
  assert.strictEqual(SpeedEngine.getSpeedStatus().speed, expected, `Pressing D #${i} should reach ${expected}x`);
}
console.log('  ✔ Subtest 2.8 Passed: Consecutive multiple speed-up presses (1.0 -> 1.5x) work smoothly.');

// Test input field anti-conflict (should NOT trigger hotkey when typing in input)
const mockInput = new MockMediaElement('input');
mockDoc.activeElement = mockInput;
windowKeydownListener({
  key: 'D',
  code: 'KeyD',
  preventDefault: () => {},
  stopPropagation: () => {}
});
assert.strictEqual(SpeedEngine.getSpeedStatus().speed, 1.5, 'Speed should NOT change when activeElement is input');
mockDoc.activeElement = null;
console.log('  ✔ Subtest 3.1 Passed: Hotkeys (D/A/S) work and smartly avoid input fields during typing.');

// Reset to 1.0
SpeedEngine.setSpeed(1.0);

// Test 3.2: Hotkey master toggle (enable / disable)
SpeedEngine.setupHotkeys(false);
assert.strictEqual(SpeedEngine.getSpeedStatus().hotkeysEnabled, false, 'Hotkeys should be disabled');
windowKeydownListener({
  key: 'D',
  code: 'KeyD',
  preventDefault: () => {},
  stopPropagation: () => {}
});
assert.strictEqual(SpeedEngine.getSpeedStatus().speed, 1.0, 'Speed should NOT change when hotkeys are disabled');

SpeedEngine.setupHotkeys(true);
assert.strictEqual(SpeedEngine.getSpeedStatus().hotkeysEnabled, true, 'Hotkeys should be re-enabled');
windowKeydownListener({
  key: 'D',
  code: 'KeyD',
  preventDefault: () => {},
  stopPropagation: () => {}
});
assert.strictEqual(SpeedEngine.getSpeedStatus().speed, 1.1, 'Speed should change when hotkeys are enabled');
console.log('  ✔ Subtest 3.2 Passed: Global hotkey toggle (enabled/disabled) verified successfully.');

console.log('\n🎉 ALL GLOBAL SPEED & MEDIA TESTS PASSED SUCCESSFULLY! 🎉\n');
