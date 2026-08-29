"use strict";
/* ============================================================
   Прогресс тренажёра.
   Хранится как  ключ -> момент, когда отметили «Знаю» (мс).
   Сброс режима не удаляет ключи, а ставит метку в cleared —
   иначе при слиянии со второго устройства сброшенное воскресает.
   ============================================================ */
const P = (function () {
  const LS = "yoko.progress.v2";
  const OLD = "yoko.progress.v1";

  let known = {};    // "f:12" -> 1786...
  let cleared = {};  // "f:"   -> 1786...
  let queued = null;

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(LS) || "null");
      if (raw && raw.known) { known = raw.known; cleared = raw.cleared || {}; return; }
    } catch (e) { /* повреждённые данные — начинаем с чистого */ }
    try {
      const old = JSON.parse(localStorage.getItem(OLD) || "null");
      if (old && typeof old === "object") {
        const t = Date.now();
        for (const k of Object.keys(old)) known[k] = t;
        persist();
      }
    } catch (e) { /* старого формата нет — нормально */ }
  }

  function persist() {
    try { localStorage.setItem(LS, JSON.stringify({ known, cleared })); } catch (e) {}
  }

  const prefixOf = k => k.slice(0, k.indexOf(":") + 1);

  function isKnown(k) {
    const t = known[k];
    return !!t && t > (cleared[prefixOf(k)] || 0);
  }

  function count(pre) {
    const c = cleared[pre] || 0;
    let n = 0;
    for (const k in known) if (k.startsWith(pre) && known[k] > c) n++;
    return n;
  }

  function touched() {
    persist();
    if (typeof Sync !== "undefined") Sync.queuePush();
  }

  function mark(k) { known[k] = Date.now(); touched(); }

  function clearPrefix(pre) { cleared[pre] = Date.now(); touched(); }

  function snapshot() { return { known: { ...known }, cleared: { ...cleared } }; }

  /* Слияние с облаком: по каждому ключу побеждает более поздняя метка. */
  function merge(remote) {
    if (!remote || typeof remote !== "object") return false;
    let changed = false;
    const rk = remote.known || {}, rc = remote.cleared || {};
    for (const k in rk) {
      if (!(known[k] > rk[k])) { if (known[k] !== rk[k]) changed = true; known[k] = Math.max(known[k] || 0, rk[k]); }
    }
    for (const p in rc) {
      if (!(cleared[p] > rc[p])) { if (cleared[p] !== rc[p]) changed = true; cleared[p] = Math.max(cleared[p] || 0, rc[p]); }
    }
    if (changed) { persist(); if (api.onChange) api.onChange(); }
    return changed;
  }

  load();
  const api = { isKnown, count, mark, clearPrefix, snapshot, merge, onChange: null };
  return api;
})();
