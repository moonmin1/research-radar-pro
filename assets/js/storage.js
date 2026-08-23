(function (global) {
  'use strict';

  const KEY = 'researchRadarProState.v2';
  const DEFAULT_STATE = {
    version: 3,
    saved: [],
    read: [],
    shortlisted: [],
    archived: [],
    notes: {},
    applicationStages: {},
    profile: null,
    theme: 'system',
    feedView: 'list',
    libraryTab: 'saved',
    lastRoute: 'home'
  };

  function safeParse(value, fallback) {
    try { return JSON.parse(value); } catch (_) { return fallback; }
  }

  function normalize(raw) {
    const state = Object.assign({}, DEFAULT_STATE, raw || {});
    for (const key of ['saved', 'read', 'shortlisted', 'archived']) {
      state[key] = Array.isArray(state[key]) ? [...new Set(state[key].map(String))] : [];
    }
    state.notes = state.notes && typeof state.notes === 'object' ? state.notes : {};
    state.applicationStages = state.applicationStages && typeof state.applicationStages === 'object' ? state.applicationStages : {};
    return state;
  }

  const memoryStore = new Map();
  const memoryStorage = {
    getItem(key) { return memoryStore.has(String(key)) ? memoryStore.get(String(key)) : null; },
    setItem(key, value) { memoryStore.set(String(key), String(value)); },
    removeItem(key) { memoryStore.delete(String(key)); }
  };
  function resolveStorage() {
    try {
      const storage = global.localStorage;
      const probe = `${KEY}.probe`;
      storage.setItem(probe, '1'); storage.removeItem(probe);
      return storage;
    } catch (_) {
      return memoryStorage;
    }
  }
  const backend = resolveStorage();
  let state = normalize(safeParse(backend.getItem(KEY), DEFAULT_STATE));
  const listeners = new Set();

  function persist() {
    backend.setItem(KEY, JSON.stringify(state));
    listeners.forEach(listener => {
      try { listener(get()); } catch (error) { console.error(error); }
    });
  }

  function get() {
    return JSON.parse(JSON.stringify(state));
  }

  function has(collection, id) {
    return state[collection]?.includes(String(id)) || false;
  }

  function toggle(collection, id, force) {
    if (!Array.isArray(state[collection])) return false;
    id = String(id);
    const set = new Set(state[collection]);
    const next = typeof force === 'boolean' ? force : !set.has(id);
    next ? set.add(id) : set.delete(id);
    state[collection] = [...set];
    persist();
    return next;
  }

  function setValue(key, value) {
    state[key] = value;
    persist();
  }

  function setNote(id, text) {
    id = String(id);
    if (text && text.trim()) state.notes[id] = text.trim();
    else delete state.notes[id];
    persist();
  }

  function setApplicationStage(id, stage) {
    id = String(id);
    const allowed = new Set(['watch', 'researching', 'preparing', 'submitted', 'interviewing', 'offer', 'excluded']);
    if (allowed.has(stage)) state.applicationStages[id] = stage;
    else delete state.applicationStages[id];
    persist();
    return state.applicationStages[id] || '';
  }

  function setProfile(profile) {
    state.profile = profile ? JSON.parse(JSON.stringify(profile)) : null;
    persist();
  }

  function resetProfile() {
    state.profile = null;
    persist();
  }

  function resetAll() {
    state = normalize(DEFAULT_STATE);
    persist();
  }

  function exportState() {
    const payload = {
      exportedAt: new Date().toISOString(),
      app: 'Research Radar Pro',
      state: get()
    };
    return JSON.stringify(payload, null, 2);
  }

  function importState(text) {
    const parsed = safeParse(text, null);
    if (!parsed) throw new Error('올바른 JSON 파일이 아닙니다.');
    state = normalize(parsed.state || parsed);
    persist();
    return get();
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  global.RRStore = {
    get,
    has,
    toggle,
    setValue,
    setNote,
    setApplicationStage,
    setProfile,
    resetProfile,
    resetAll,
    exportState,
    importState,
    subscribe,
    key: KEY
  };
})(window);
