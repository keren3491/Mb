'use strict';

const DEFAULT_DATA = {
  synagogue: 'בית הכנסת אליהו הנביא',
  rabbi: '',
  dedication: 'לעילוי נשמת זהבה חלא בת דינה זצ״ל',
  announcements: ['שיעור גמרא במוצ״ש 21:15'],
  geo: '5128581',
  timezone: 'America/New_York',
  shacharit: '07:00',
  mincha: 'לפני השקיעה',
  maariv: '20:30',
  tickerSpeed: 32,
  musicUrl: '',
  musicVolume: 0.35
};

const LOCAL_KEY = 'synagogueCloudBoardData';
const $ = id => document.getElementById(id);

function normalizeData(data = {}) {
  return {
    ...DEFAULT_DATA,
    ...data,
    announcements: Array.isArray(data.announcements) ? data.announcements : DEFAULT_DATA.announcements,
    tickerSpeed: Math.min(90, Math.max(15, Number(data.tickerSpeed) || DEFAULT_DATA.tickerSpeed)),
    musicVolume: Math.min(1, Math.max(0, Number(data.musicVolume ?? DEFAULT_DATA.musicVolume)))
  };
}

function localData() {
  try {
    return normalizeData(JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}'));
  } catch {
    return normalizeData();
  }
}

function saveLocal(data) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(normalizeData(data)));
}

function firebaseReady() {
  const f = window.APP_CONFIG?.firebase || {};
  return Boolean(f.apiKey && f.projectId && f.databaseURL);
}

function databaseUrl() {
  const id = window.APP_CONFIG?.boardId || 'main';
  return `${window.APP_CONFIG.firebase.databaseURL.replace(/\/$/, '')}/boards/${encodeURIComponent(id)}.json`;
}

async function getBoardData() {
  if (!firebaseReady()) return localData();
  try {
    const response = await fetch(databaseUrl(), { cache: 'no-store' });
    if (!response.ok) throw new Error(`Firebase read failed: ${response.status}`);
    const data = normalizeData((await response.json()) || {});
    saveLocal(data);
    return data;
  } catch (error) {
    console.warn(error);
    return localData();
  }
}

async function saveBoardData(data) {
  const normalized = normalizeData(data);
  saveLocal(normalized);
  if (!firebaseReady()) return { cloud: false };
  const response = await fetch(databaseUrl(), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(normalized)
  });
  if (!response.ok) throw new Error(`Cloud save failed: ${response.status}`);
  return { cloud: true };
}

function watchBoardData(callback) {
  let last = '';
  const publish = raw => {
    const data = normalizeData(raw || {});
    const serialized = JSON.stringify(data);
    if (serialized === last) return;
    last = serialized;
    saveLocal(data);
    callback(data);
  };

  publish(localData());
  if (!firebaseReady()) return () => {};

  let source;
  let pollTimer;
  try {
    source = new EventSource(databaseUrl());
    source.addEventListener('put', event => {
      try { publish(JSON.parse(event.data).data || {}); } catch (error) { console.warn(error); }
    });
    source.addEventListener('patch', async () => {
      try { publish(await getBoardData()); } catch (error) { console.warn(error); }
    });
    source.onerror = () => {
      if (pollTimer) return;
      pollTimer = setInterval(async () => {
        try { publish(await getBoardData()); } catch (error) { console.warn(error); }
      }, 10000);
    };
  } catch (error) {
    console.warn(error);
    pollTimer = setInterval(async () => {
      try { publish(await getBoardData()); } catch (pollError) { console.warn(pollError); }
    }, 10000);
  }

  return () => {
    source?.close();
    if (pollTimer) clearInterval(pollTimer);
  };
}
