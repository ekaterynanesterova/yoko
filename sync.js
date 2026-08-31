"use strict";
/* ============================================================
   Синхронизация прогресса между устройствами.
   Supabase REST напрямую, без SDK — чтобы страница работала офлайн
   и не тянула скрипт со стороннего CDN.
   Аккаунт тот же, что в KALORIYA (общий Supabase-проект).
   ============================================================ */
const Sync = (function () {
  const URL = "https://rezyccwdgnvaolxxrtut.supabase.co";
  const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlenljY3dkZ252YW9seHhydHV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMTIzMjQsImV4cCI6MjA5Nzc4ODMyNH0.LcCSZHOuGq6bvEqGret-2CAtak1DAGJhEAx1RwLLyzU";
  const AUTH_LS = "yoko.auth";
  const TABLE = "yoko_progress";

  let session = null;   // {access_token, refresh_token, expires_at, email, user_id}
  let pushTimer = null;
  let pulling = false;
  let status = "off";   // off | ok | busy | error
  let statusText = "";

  try { session = JSON.parse(localStorage.getItem(AUTH_LS) || "null"); } catch (e) { session = null; }

  const saveSession = () => {
    try {
      if (session) localStorage.setItem(AUTH_LS, JSON.stringify(session));
      else localStorage.removeItem(AUTH_LS);
    } catch (e) {}
  };

  function setStatus(s, text) {
    status = s; statusText = text || "";
    if (api.onStatus) api.onStatus(s, statusText);
  }

  async function req(path, opts = {}) {
    const headers = Object.assign({
      "apikey": KEY,
      "Content-Type": "application/json"
    }, opts.headers || {});
    if (opts.auth !== false && session) headers["Authorization"] = "Bearer " + session.access_token;
    const r = await fetch(URL + path, { method: opts.method || "GET", headers, body: opts.body });
    const text = await r.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
    if (!r.ok) {
      let msg = (data && (data.error_description || data.msg || data.message || data.error)) || ("HTTP " + r.status);
      /* Таблицы ещё нет — самая вероятная причина при первом запуске. */
      if (data && data.code === "PGRST205") {
        msg = "Таблица прогресса ещё не создана. Выполни supabase.sql в SQL Editor проекта — один раз.";
      } else if (r.status === 400 && /Invalid login/i.test(String(msg))) {
        msg = "Не подошли почта или пароль.";
      }
      const err = new Error(msg); err.status = r.status; err.data = data; throw err;
    }
    return data;
  }

  function adopt(d) {
    session = {
      access_token: d.access_token,
      refresh_token: d.refresh_token,
      expires_at: Date.now() + (d.expires_in || 3600) * 1000 - 60000,
      email: d.user && d.user.email,
      user_id: d.user && d.user.id
    };
    saveSession();
  }

  async function ensureFresh() {
    if (!session) return false;
    if (Date.now() < session.expires_at) return true;
    try {
      const d = await req("/auth/v1/token?grant_type=refresh_token", {
        method: "POST", auth: false,
        body: JSON.stringify({ refresh_token: session.refresh_token })
      });
      adopt(d);
      return true;
    } catch (e) {
      session = null; saveSession();
      setStatus("error", "сессия истекла, войди заново");
      return false;
    }
  }

  async function signIn(email, password) {
    setStatus("busy", "вход…");
    const d = await req("/auth/v1/token?grant_type=password", {
      method: "POST", auth: false,
      body: JSON.stringify({ email, password })
    });
    adopt(d);
    await pull();
    await push();
    if (typeof OrderSync !== "undefined") { await OrderSync.pull(); await OrderSync.push(); }
    setStatus("ok", session.email);
    return session;
  }

  async function signUp(email, password) {
    setStatus("busy", "создаём аккаунт…");
    const d = await req("/auth/v1/signup", {
      method: "POST", auth: false,
      body: JSON.stringify({ email, password })
    });
    if (d && d.access_token) { adopt(d); await push(); setStatus("ok", session.email); return session; }
    setStatus("off", "подтверди адрес письмом, потом войди");
    return null;
  }

  function signOut() {
    session = null; saveSession();
    setStatus("off", "");
  }

  async function pull() {
    if (!session || pulling || !navigator.onLine) return false;
    if (!(await ensureFresh())) return false;
    pulling = true;
    try {
      const rows = await req("/rest/v1/" + TABLE + "?select=known,cleared&user_id=eq." + session.user_id);
      if (Array.isArray(rows) && rows.length) P.merge(rows[0]);
      setStatus("ok", session.email);
      return true;
    } catch (e) {
      setStatus("error", e.message);
      return false;
    } finally { pulling = false; }
  }

  async function push() {
    if (!session || !navigator.onLine) return false;
    if (!(await ensureFresh())) return false;
    const snap = P.snapshot();
    try {
      await req("/rest/v1/" + TABLE, {
        method: "POST",
        headers: { "Prefer": "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({
          user_id: session.user_id,
          known: snap.known,
          cleared: snap.cleared,
          updated_at: new Date().toISOString()
        })
      });
      setStatus("ok", session.email);
      return true;
    } catch (e) {
      setStatus("error", e.message);
      return false;
    }
  }

  function queuePush() {
    if (!session) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(push, 1500);
  }

  /* Периодический подтяг и досылка при возврате в сеть. */
  if (session) { pull(); }
  setInterval(() => { if (session && document.visibilityState === "visible") pull(); }, 60000);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") pull(); });
  window.addEventListener("online", () => { pull().then(push); });
  window.addEventListener("beforeunload", () => {
    if (session && pushTimer) { clearTimeout(pushTimer); push(); }
  });

  const api = {
    signIn, signUp, signOut, pull, push, queuePush, req,
    get session() { return session; },
    get status() { return status; },
    get statusText() { return statusText; },
    onStatus: null
  };
  return api;
})();

/* ============================================================
   СИНХРОНИЗАЦИЯ ЗАКАЗОВ
   Чек, снятый на телефоне, должен открываться на планшете.
   Фото не отправляется — только разобранный состав.
   ============================================================ */
const OrderSync = (function () {
  const TABLE = "yoko_orders";
  let timer = null, pulling = false;

  async function pull() {
    const s = Sync.session;
    if (!s || pulling || !navigator.onLine) return false;
    pulling = true;
    try {
      const rows = await Sync.req("/rest/v1/" + TABLE +
        "?select=id,payload,mt,deleted&user_id=eq." + s.user_id + "&order=mt.desc&limit=40");
      if (Array.isArray(rows) && rows.length) {
        const mapped = rows.map(r => Object.assign({}, r.payload, { id: r.id, mt: r.mt, deleted: !!r.deleted }));
        if (Order.merge(mapped) && Order.onChange) Order.onChange();
      }
      return true;
    } catch (e) { return false; }
    finally { pulling = false; }
  }

  async function push() {
    const s = Sync.session;
    if (!s || !navigator.onLine) return false;
    const rows = Order.snapshot().map(o => ({
      user_id: s.user_id, id: o.id, mt: o.mt || o.at || Date.now(),
      deleted: !!o.deleted, updated_at: new Date().toISOString(),
      payload: { at: o.at, ref: o.ref, items: o.items, extras: o.extras, unknown: o.unknown }
    }));
    if (!rows.length) return true;
    try {
      await Sync.req("/rest/v1/" + TABLE, {
        method: "POST",
        headers: { "Prefer": "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(rows)
      });
      return true;
    } catch (e) { return false; }
  }

  function queuePush() {
    if (!Sync.session) return;
    clearTimeout(timer);
    timer = setTimeout(push, 1500);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") pull();
  });
  window.addEventListener("online", () => pull().then(push));

  /* Сценарий: чек сняли на телефоне, планшет лежит открытым рядом.
     Раз в минуту тут слишком долго, поэтому опрашиваем каждые 15 секунд,
     пока страница на экране. Плюс подтяг при открытии вкладки «Заказ». */
  setInterval(() => {
    if (document.visibilityState === "visible") pull();
  }, 15000);

  return { pull, push, queuePush };
})();
