"use strict";
/* ============================================================
   СМЕНЫ

   Руководитель присылает фото графика — рукописная таблица
   «Dienstplan» на одну-две недели. Фото уходит в Gemini, разбирается
   в дни и ложится сюда. Дальше это обычные данные: правятся руками
   и разъезжаются между телефоном и планшетом.

   Хранение — ПО ДНЮ, а не по фото. Иначе новый снимок затирал бы
   правку, сделанную руками в одном конкретном дне.
   ============================================================ */
const Shifts = (function () {
  const LS = "yoko.shifts.v1";
  const ME_LS = "yoko.shifts.me";
  const SEED_LS = "yoko.shifts.seed.v1";
  /* Поднимать при каждой правке SEED. */
  const SEED_V = "4";
  const MIG_LS = "yoko.shifts.nooff";

  /* Кто вообще выходит в смену. Список нужен распознаванию: модель
     выбирает из готовых имён, а не разбирает почерк по буквам. */
  const ROSTER = ["Аня", "Вика", "Даша", "Алина", "Джордан", "Катя", "Сергей", "Саша", "Chimly"];

  /* ------------------------------------------------------------
     Четыре плана, присланные Ханной (11.08 — 27.09.2026).
     Перенесены с фотографий вручную. Формат ячейки: «Имя (время)».
     Зачёркнутых на фото не переносим: зачеркнули — значит человека
     в этот день не было, в таблице ему делать нечего. Исключение —
     12.09: на листе Катя зачёркнута, но по факту работала весь день,
     без времени. Так что лист тут не источник правды, а Kate — источник.
     ------------------------------------------------------------ */
  const SEED = {
    "2026-08-12": "Джордан, Катя, Аня, Вика",
    "2026-08-13": "Сергей, Даша, Аня",
    "2026-08-14": "Аня, Сергей, Джордан",
    "2026-08-15": "Вика, Аня, Даша",
    "2026-08-16": "Даша, Алина, Аня",
    "2026-08-17": "Джордан, Вика, Алина, Аня (14:00)",
    "2026-08-18": "Аня, Саша (18:00), Chimly (18:00), Алина (до 18:00)",
    "2026-08-19": "Аня (до 14:00), Даша (14:00), Джордан, Вика (16:00)",
    "2026-08-20": "Вика, Даша, Катя",
    "2026-08-21": "Саша, Chimly, Даша, Алина (16:00)",
    "2026-08-22": "Саша, Chimly, Даша",
    "2026-08-23": "Даша, Джордан, Алина (16:00)",
    "2026-08-24": "Даша, Вика, Алина (16:00)",
    "2026-08-25": "Аня (с 14:00), Джордан, Сергей, Вика (до 18:00)",
    "2026-08-26": "Аня, Алина, Катя",
    "2026-08-27": "Вика, Аня, Катя",
    "2026-08-28": "Джордан, Аня, Алина (с 16:00)",
    "2026-08-29": "Вика, Джордан, Сергей",
    "2026-08-30": "Джордан, Аня, Алина (16:00)",
    "2026-08-31": "Даша, Вика, Алина (16:00)",
    "2026-09-01": "Даша, Джордан, Катя",
    "2026-09-02": "Аня, Джордан, Вика (16:00)",
    "2026-09-03": "Аня, Джордан, Алина (16:00)",
    "2026-09-04": "Даша, Вика, Аня (16:00 до 21:00)",
    "2026-09-05": "Даша, Джордан, Вика (16:00)",
    "2026-09-06": "Даша, Аня (16:00), Джордан",
    "2026-09-07": "Аня, Джордан, Вика (16:00)",
    "2026-09-08": "Аня, Вика (16:00), Катя",
    "2026-09-09": "Аня, Джордан, Алина (16:00)",
    "2026-09-10": "Даша, Джордан, Алина (16:00)",
    "2026-09-11": "Даша, Джордан, Аня (16:00)",
    "2026-09-12": "Даша, Вика, Катя",
    "2026-09-13": "Аня, Даша (16:00), Вика",
    "2026-09-14": "Аня, Вика, Катя",
    "2026-09-15": "Даша, Вика, Аня (16:00)",
    "2026-09-16": "Даша, Алина, Вика (16:00)",
    "2026-09-17": "Аня, Катя, Алина (16:00)",
    "2026-09-18": "Аня, Даша (16:00), Вика",
    "2026-09-19": "Даша, Алина, Аня (16:00)",
    "2026-09-20": "Даша, Аня (16:00), Джордан",
    "2026-09-21": "Аня, Джордан, Вика",
    "2026-09-22": "Джордан, Катя",
    "2026-09-23": "Даша (с 13:00), Аня, Вика (до 16:00)",
    "2026-09-24": "Даша, Джордан, Алина (с 16:00)",
    "2026-09-25": "Аня, Джордан, Даша (16:00)",
    "2026-09-26": "Аня, Джордан, Алина (с 16:00)",
    "2026-09-27": "Даша, Аня (16:00), Вика"
  };

  /* Дата фото, с которого перенесён день. Служит меткой времени:
     любая правка руками будет новее и победит при слиянии. */
  const SEED_MT = Date.UTC(2026, 8, 6, 22, 0);

  let days = {};
  try { days = JSON.parse(localStorage.getItem(LS) || "{}") || {}; } catch (e) { days = {}; }

  /* По умолчанию — Катя: приложение её. Меняется селектом на вкладке. */
  let me = "Катя";
  try { const v = localStorage.getItem(ME_LS); if (v !== null) me = v; } catch (e) {}

  const save = () => { try { localStorage.setItem(LS, JSON.stringify(days)); } catch (e) {} };

  /* ---------- разбор ячейки графика ---------- */
  /* «Алина (до 18:00)» → {n:"Алина", t:"до 18:00"} */
  function parseCell(cell) {
    let s = String(cell || "").trim();
    if (!s) return null;
    let t = "";
    const open = s.indexOf("(");
    if (open >= 0) {
      const close = s.indexOf(")", open);
      t = s.slice(open + 1, close < 0 ? s.length : close).trim();
      s = s.slice(0, open).trim();
    }
    if (!s) return null;
    return { n: s, t };
  }

  function seed() {
    let have = "";
    try { have = localStorage.getItem(SEED_LS) || ""; } catch (e) {}
    if (have === SEED_V) return;
    for (const date in SEED) {
      const cur = days[date];
      /* Не трогаем только то, что Kate правила руками (src "hand").
         По метке времени судить нельзя: разовые чистки её тоже меняли. */
      if (cur && cur.src === "hand") continue;
      const who = SEED[date].split(",").map(parseCell).filter(Boolean);
      days[date] = { date, who, mt: SEED_MT, src: "photo" };
    }
    save();
    try { localStorage.setItem(SEED_LS, SEED_V); } catch (e) {}
  }
  seed();

  /* Зачёркнутое имя значит, что человека в этот день не было. Сначала мы
     показывали такие записи перечёркнутыми; Kate поправила — их не должно
     быть в таблице вовсе. Разовая чистка того, что успело сохраниться. */
  function dropOff() {
    let done = false;
    try { done = localStorage.getItem(MIG_LS) === "1"; } catch (e) {}
    if (done) return;
    let changed = false;
    for (const date in days) {
      const who = days[date].who || [];
      const keep = who.filter(p => !p.off);
      if (keep.length !== who.length) {
        /* Свежая метка времени, чтобы чистка победила копию на другом устройстве. */
        days[date] = { date, who: keep, mt: Date.now(), src: days[date].src || "" };
        changed = true;
      }
    }
    if (changed) {
      save();
      setTimeout(() => { if (typeof ShiftSync !== "undefined") ShiftSync.queuePush(); }, 0);
    }
    try { localStorage.setItem(MIG_LS, "1"); } catch (e) {}
  }
  dropOff();

  /* ---------- чтение ---------- */
  function get(date) { return days[date] || null; }

  function range(from, to) {
    return Object.keys(days).filter(d => d >= from && d <= to).sort()
      .map(d => days[d]).filter(d => d.who && d.who.length);
  }

  function all() { return Object.keys(days).sort().map(d => days[d]); }

  /* Кого можно выбрать в списке: базовый состав плюс все, кто уже
     встречался в графике (появился новый человек — сам подтянется). */
  function roster() {
    const set = new Set(ROSTER);
    for (const d in days) for (const p of (days[d].who || [])) if (p.n) set.add(p.n);
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ru"));
  }

  const same = (a, b) => String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();

  function worksOn(date, name) {
    const d = days[date];
    if (!d) return null;
    return (d.who || []).find(p => same(p.n, name)) || null;
  }

  /* Мои смены начиная с сегодняшнего дня — для строки «следующая смена». */
  function upcoming(name, limit) {
    const today = iso(new Date());
    const out = [];
    for (const date of Object.keys(days).sort()) {
      if (date < today) continue;
      const p = worksOn(date, name);
      if (p) out.push({ date, t: p.t || "" });
      if (limit && out.length >= limit) break;
    }
    return out;
  }

  function countIn(y, m, name) {
    const pre = y + "-" + String(m + 1).padStart(2, "0");
    let n = 0;
    for (const date in days) if (date.startsWith(pre) && worksOn(date, name)) n++;
    return n;
  }

  /* ---------- запись ---------- */
  function put(date, who) {
    const clean = (who || []).filter(p => p && p.n);
    if (!clean.length) delete days[date];
    else days[date] = { date, who: clean, mt: Date.now(), src: "hand" };
    /* Удалённый день тоже надо разослать, иначе он вернётся с другого
       устройства. Держим пустую запись с новой меткой времени. */
    if (!clean.length) days[date] = { date, who: [], mt: Date.now(), src: "hand" };
    save();
    if (typeof ShiftSync !== "undefined") ShiftSync.queuePush();
    if (api.onChange) api.onChange();
  }

  /* Разобранное фото: день целиком заменяется тем, что на снимке.
     Фото — источник правды, оно приходит от руководителя. */
  function applyPhoto(parsed) {
    let n = 0;
    for (const d of (parsed && parsed.days) || []) {
      if (!d.date || !Array.isArray(d.people) || !d.people.length) continue;
      const who = d.people
        .map(p => ({ n: String(p.name || "").trim(), t: String(p.time || "").trim() }))
        .filter(p => p.n);
      if (!who.length) continue;
      days[d.date] = { date: d.date, who, mt: Date.now(), src: "photo" };
      n++;
    }
    if (n) {
      save();
      if (typeof ShiftSync !== "undefined") ShiftSync.queuePush();
      if (api.onChange) api.onChange();
    }
    return n;
  }

  /* Слияние с облаком: по каждому дню побеждает более поздняя правка. */
  function merge(rows) {
    let changed = false;
    for (const r of (rows || [])) {
      if (!r || !r.date) continue;
      const cur = days[r.date];
      if (!cur || (r.mt || 0) > (cur.mt || 0)) {
        days[r.date] = { date: r.date, who: (r.who || []).filter(p => !p.off), mt: r.mt || 0, src: r.src || "" };
        changed = true;
      }
    }
    if (changed) { save(); if (api.onChange) api.onChange(); }
    return changed;
  }

  function snapshot() { return Object.keys(days).map(d => days[d]); }

  /* ---------- кто я ---------- */
  function getMe() { return me; }
  function setMe(n) {
    me = String(n || "").trim();
    try { me ? localStorage.setItem(ME_LS, me) : localStorage.removeItem(ME_LS); } catch (e) {}
    if (api.onChange) api.onChange();
  }

  /* ---------- даты ---------- */
  function iso(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") +
      "-" + String(d.getDate()).padStart(2, "0");
  }
  /* Полдень, чтобы переход на зимнее время не сдвинул день назад. */
  const dateOf = s => new Date(s + "T12:00:00");

  const api = {
    ROSTER, roster, get, range, all, worksOn, upcoming, countIn,
    put, applyPhoto, merge, snapshot, parseCell,
    me: getMe, setMe, iso, dateOf, same,
    onChange: null
  };
  return api;
})();
