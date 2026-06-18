import { SpreadsheetRow } from '../types';

export const OFFLINE_QUEUE_KEY = 'scoutmaster_offline_queue';

export function getOfflineQueue(): Partial<SpreadsheetRow>[] {
  try {
    const queueJson = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return queueJson ? JSON.parse(queueJson) : [];
  } catch (e) {
    console.error('Failed to parse offline sync queue:', e);
    return [];
  }
}

export function saveOfflineQueue(queue: Partial<SpreadsheetRow>[]) {
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Failed to save offline sync queue:', e);
  }
}

export function addToOfflineQueue(item: Partial<SpreadsheetRow>) {
  const queue = getOfflineQueue();
  const existingIdx = queue.findIndex((q) => q.sessionId === item.sessionId);
  if (existingIdx >= 0) {
    queue[existingIdx] = item;
  } else {
    queue.push(item);
  }
  saveOfflineQueue(queue);
}

export async function syncScoutData(payload: Partial<SpreadsheetRow>) {
  const resp = await fetch('/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      sheetName: 'scoutsmaster_ongoing'
    })
  });
  if (!resp.ok) {
    throw new Error(await resp.text() || 'Failed to sync with server');
  }
  return await resp.json();
}
