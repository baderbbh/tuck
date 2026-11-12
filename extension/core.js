(function (root) {
  const MAX_SESSIONS = 250;
  const MAX_RECOVERY = 12;
  const RECOVERY_INTERVAL_MINUTES = 5;

  function safeTab(tab) {
    if (!tab || typeof tab.url !== 'string') return null;
    if (!/^https?:\/\//i.test(tab.url)) return null;
    return { title: String(tab.title || tab.url).slice(0, 300), url: tab.url };
  }

  function collectTabs(tabs) {
    return (Array.isArray(tabs) ? tabs : []).map(safeTab).filter(Boolean);
  }

  function makeSession(name, tabs, id) {
    const cleanTabs = collectTabs(tabs);
    if (!cleanTabs.length) throw new Error('No supported tabs to save.');
    const cleanName = String(name || '').trim().slice(0, 80);
    if (!cleanName) throw new Error('Enter a session name.');
    return { id: id || crypto.randomUUID(), name: cleanName, createdAt: new Date().toISOString(), tabs: cleanTabs };
  }

  function filterSessions(sessions, search) {
    const term = String(search || '').trim().toLowerCase();
    if (!term) return sessions;
    return sessions.filter(session => session.name.toLowerCase().includes(term) || session.tabs.some(tab => tab.title.toLowerCase().includes(term) || tab.url.toLowerCase().includes(term)));
  }

  function appendSession(sessions, session) {
    return [session, ...sessions].slice(0, MAX_SESSIONS);
  }

  function addRecovery(items, tabs, id) {
    const cleanTabs = collectTabs(tabs);
    if (!cleanTabs.length) return items;
    const signature = JSON.stringify(cleanTabs.map(tab => tab.url));
    if (items[0] && JSON.stringify(items[0].tabs.map(tab => tab.url)) === signature) return items;
    return [{ id: id || crypto.randomUUID(), createdAt: new Date().toISOString(), tabs: cleanTabs }, ...items].slice(0, MAX_RECOVERY);
  }

  root.TuckCore = { collectTabs, makeSession, filterSessions, appendSession, addRecovery, RECOVERY_INTERVAL_MINUTES };
  if (typeof module !== 'undefined') module.exports = root.TuckCore;
})(typeof globalThis !== 'undefined' ? globalThis : this);
