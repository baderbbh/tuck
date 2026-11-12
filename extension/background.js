importScripts('core.js');

const api = globalThis.browser || globalThis.chrome;

async function snapshot() {
  try {
    const windows = await api.windows.getAll({ populate: true, windowTypes: ['normal'] });
    const { recovery = [] } = await api.storage.local.get('recovery');
    let updated = recovery;
    for (const window of windows) {
      updated = TuckCore.addRecovery(updated, window.tabs || []);
    }
    await api.storage.local.set({ recovery: updated });
  } catch (error) {
    console.warn('Could not save recovery snapshot:', error);
  }
}

api.runtime.onInstalled.addListener(() => {
  api.alarms.create('recovery', { periodInMinutes: TuckCore.RECOVERY_INTERVAL_MINUTES });
  snapshot();
});
api.runtime.onStartup.addListener(() => {
  api.alarms.create('recovery', { periodInMinutes: TuckCore.RECOVERY_INTERVAL_MINUTES });
  snapshot();
});
api.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'recovery') snapshot();
});
