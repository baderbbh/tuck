const api = globalThis.browser || globalThis.chrome;
const $ = id => document.getElementById(id);
let mode = 'sessions';
let pendingTabs = [];
let currentWindowId = null;
let selectedId = null;
let sessions = [];
let recovery = [];

function notice(message, ok = false) {
  $('status').textContent = message;
  $('status').className = ok ? 'status ok' : 'status';
}

async function load() {
  const data = await api.storage.local.get(['sessions', 'recovery']);
  sessions = Array.isArray(data.sessions) ? data.sessions : [];
  recovery = Array.isArray(data.recovery) ? data.recovery : [];
  render();
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function action(label, callback, className = '') {
  const button = el('button', className, label);
  button.type = 'button';
  button.addEventListener('click', callback);
  return button;
}

function render() {
  const list = $('sessions');
  list.replaceChildren();
  const items = TuckCore.filterSessions(mode === 'sessions' ? sessions : recovery.map(item => ({ ...item, name: 'Recovery snapshot' })), $('search').value);
  $('count').textContent = `${items.length} ${mode === 'sessions' ? 'session' : 'snapshot'}${items.length === 1 ? '' : 's'}`;
  if (!items.length) {
    list.append(el('div', 'empty', $('search').value ? 'No matching tabs or sessions.' : mode === 'sessions' ? 'No saved sessions yet. Save your current window to get started.' : 'No recovery snapshots yet. Tuck checks open windows about every five minutes while your browser is running.'));
    return;
  }
  for (const item of items) {
    const card = el('article', 'session');
    const top = el('div', 'session-top');
    top.append(el('div', 'session-title', item.name));
    card.append(top);
    const date = new Date(item.createdAt);
    card.append(el('div', 'session-meta', `${item.tabs.length} tabs · ${Number.isNaN(date.getTime()) ? 'Unknown date' : date.toLocaleString()}`));
    const buttons = el('div', 'session-actions');
    buttons.append(action('Restore', () => restore(item), 'restore'));
    buttons.append(action('View tabs', () => toggleTabs(card, item)));
    if (mode === 'sessions') buttons.append(action('Rename', () => openRename(item)));
    buttons.append(action('Delete', () => openDelete(item)));
    card.append(buttons);
    list.append(card);
  }
}

function toggleTabs(card, item) {
  const old = card.querySelector('.tab-list');
  if (old) { old.remove(); return; }
  const list = el('ul', 'tab-list');
  for (const tab of item.tabs) {
    const row = el('li');
    const link = el('a', '', tab.title);
    link.href = tab.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    row.append(link, el('span', 'tab-url', tab.url));
    list.append(row);
  }
  card.append(list);
}

async function restore(item) {
  try {
    const urls = item.tabs.map(tab => tab.url).filter(url => /^https?:\/\//i.test(url));
    if (!urls.length) throw new Error('This session has no valid web links.');
    await api.windows.create({ url: urls });
    notice(`Restored ${urls.length} tabs in a new window.`, true);
  } catch (error) { notice(`Could not restore tabs: ${error.message}`); }
}

async function startSave() {
  try {
    const win = await api.windows.getCurrent();
    currentWindowId = win.id;
    const tabs = await api.tabs.query({ windowId: win.id });
    pendingTabs = tabs;
    const count = TuckCore.collectTabs(tabs).length;
    if (!count) { notice('No regular web pages in this window to save.'); return; }
    $('session-name').value = `Session ${new Date().toLocaleDateString()}`;
    $('tab-info').textContent = `${count} web tabs will be saved.`;
    $('close-tabs').checked = false;
    $('save-dialog').showModal();
    $('session-name').focus();
    $('session-name').select();
  } catch (error) { notice(`Could not read tabs: ${error.message}`); }
}

async function save(event) {
  event.preventDefault();
  try {
    const session = TuckCore.makeSession($('session-name').value, pendingTabs);
    const { sessions: latest = [] } = await api.storage.local.get('sessions');
    sessions = TuckCore.appendSession(Array.isArray(latest) ? latest : [], session);
    await api.storage.local.set({ sessions });
    const close = $('close-tabs').checked;
    $('save-dialog').close();
    render();
    notice(`Saved ${session.tabs.length} tabs.`, true);
    if (close) {
      const closable = pendingTabs.filter(tab => !tab.pinned && TuckCore.collectTabs([tab]).length).map(tab => tab.id);
      if (closable.length) {
        const currentTabs = await api.tabs.query({ windowId: currentWindowId });
        if (currentTabs.every(tab => closable.includes(tab.id))) {
          await api.tabs.create({ windowId: currentWindowId, url: 'about:blank', active: true });
        }
        await api.tabs.remove(closable);
      }
    }
  } catch (error) { notice(`Could not save session: ${error.message}`); }
}

function openRename(item) {
  selectedId = item.id;
  $('rename-name').value = item.name;
  $('rename-dialog').showModal();
  $('rename-name').focus();
}

async function rename(event) {
  event.preventDefault();
  const name = $('rename-name').value.trim();
  if (!name) return;
  try {
    const { sessions: latest = [] } = await api.storage.local.get('sessions');
    sessions = latest.map(item => item.id === selectedId ? { ...item, name: name.slice(0, 80) } : item);
    await api.storage.local.set({ sessions });
    $('rename-dialog').close();
    render();
    notice('Session renamed.', true);
  } catch (error) { notice(`Could not rename session: ${error.message}`); }
}

function openDelete(item) {
  selectedId = item.id;
  $('delete-dialog').showModal();
}

async function remove(event) {
  event.preventDefault();
  try {
    const key = mode === 'sessions' ? 'sessions' : 'recovery';
    const data = await api.storage.local.get(key);
    const items = (Array.isArray(data[key]) ? data[key] : []).filter(item => item.id !== selectedId);
    await api.storage.local.set({ [key]: items });
    if (mode === 'sessions') sessions = items;
    else recovery = items;
    $('delete-dialog').close();
    render();
    notice('Deleted.', true);
  } catch (error) { notice(`Could not delete: ${error.message}`); }
}

function changeMode(next) {
  mode = next;
  $('saved-tab').classList.toggle('active', next === 'sessions');
  $('recovery-tab').classList.toggle('active', next === 'recovery');
  $('saved-tab').setAttribute('aria-selected', String(next === 'sessions'));
  $('recovery-tab').setAttribute('aria-selected', String(next === 'recovery'));
  $('search').value = '';
  render();
}

$('save').addEventListener('click', startSave);
$('save-form').addEventListener('submit', save);
$('rename-form').addEventListener('submit', rename);
$('delete-form').addEventListener('submit', remove);
$('search').addEventListener('input', render);
$('saved-tab').addEventListener('click', () => changeMode('sessions'));
$('recovery-tab').addEventListener('click', () => changeMode('recovery'));
document.querySelectorAll('[data-cancel]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
load().catch(error => notice(`Could not load saved data: ${error.message}`));
