const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../extension/core.js');

test('only regular web pages are saved', () => {
  assert.deepEqual(core.collectTabs([
    { title: 'Example', url: 'https://example.com' },
    { title: 'Local', url: 'http://localhost:3000' },
    { title: 'Settings', url: 'chrome://settings' },
    { url: 'file:///private.txt' }
  ]), [
    { title: 'Example', url: 'https://example.com' },
    { title: 'Local', url: 'http://localhost:3000' }
  ]);
});

test('session requires a name and valid tabs', () => {
  assert.throws(() => core.makeSession(' ', [{ url: 'https://example.com' }]), /name/);
  assert.throws(() => core.makeSession('Work', [{ url: 'about:blank' }]), /tabs/);
  const session = core.makeSession(' Work ', [{ title: 'Home', url: 'https://example.com' }], 'abc');
  assert.equal(session.name, 'Work');
  assert.equal(session.id, 'abc');
});

test('searches session name, tab title, and URL', () => {
  const sessions = [core.makeSession('Work', [{ title: 'Issue tracker', url: 'https://example.com/issue' }], 'a'), core.makeSession('Study', [{ title: 'Lecture', url: 'https://school.edu' }], 'b')];
  assert.equal(core.filterSessions(sessions, 'WORK').length, 1);
  assert.equal(core.filterSessions(sessions, 'lecture').length, 1);
  assert.equal(core.filterSessions(sessions, 'school.edu').length, 1);
  assert.equal(core.filterSessions(sessions, 'unknown').length, 0);
});

test('recovery skips identical consecutive snapshots and limits history', () => {
  const tabs = [{ url: 'https://example.com' }];
  const first = core.addRecovery([], tabs, 'one');
  assert.equal(core.addRecovery(first, tabs, 'two').length, 1);
  let items = first;
  for (let i = 0; i < 20; i++) items = core.addRecovery(items, [{ url: `https://example.com/${i}` }], String(i));
  assert.equal(items.length, 12);
});

test('saved sessions have a limit', () => {
  const session = core.makeSession('Test', [{ url: 'https://example.com' }]);
  assert.equal(core.appendSession(Array(250).fill(session), session).length, 250);
});
