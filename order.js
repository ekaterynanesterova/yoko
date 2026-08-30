"use strict";
/* ============================================================
   СБОРОЧНЫЙ ЛИСТ ПО ЗАКАЗУ

   Меню разворачивается в конкретные роллы, всё складывается и
   раскладывается в том порядке, в каком реально работают:
   сначала фритюр (он узкое место), потом крутка, потом упаковка
   и стаканчики.
   ============================================================ */
const Order = (function () {
  const LS = "yoko.orders.v1";
  let list = [];
  try { list = JSON.parse(localStorage.getItem(LS) || "[]") || []; } catch (e) { list = []; }

  const save = () => { try { localStorage.setItem(LS, JSON.stringify(list.slice(0, 40))); } catch (e) {} };

  function all() { return list.slice().sort((a, b) => b.at - a.at); }
  function get(id) { return list.find(o => o.id === id) || null; }

  function put(o) {
    const i = list.findIndex(x => x.id === o.id);
    if (i >= 0) list[i] = o; else list.unshift(o);
    list = list.slice(0, 40);
    save();
    if (typeof OrderSync !== "undefined") OrderSync.queuePush();
    return o;
  }

  function remove(id) {
    const o = get(id);
    if (!o) return;
    o.deleted = true; o.mt = Date.now();
    save();
    if (typeof OrderSync !== "undefined") OrderSync.queuePush();
  }

  /* Слияние с облаком: по каждому заказу побеждает более поздняя правка. */
  function merge(rows) {
    let changed = false;
    for (const r of (rows || [])) {
      const cur = list.find(x => x.id === r.id);
      if (!cur || (r.mt || 0) > (cur.mt || 0)) {
        const i = list.findIndex(x => x.id === r.id);
        if (i >= 0) list[i] = r; else list.push(r);
        changed = true;
      }
    }
    if (changed) { list = list.slice(0, 40); save(); }
    return changed;
  }

  function snapshot() { return list.map(o => ({ ...o, preview: undefined })); }

  /* ---------- разворачивание заказа в работу ---------- */
  const dishBy = new Map(D.map(d => [d[1], d]));
  const menuBy = new Map(MENUCARDS.map(m => [m.name, m]));

  function expand(order) {
    const work = new Map();   // немецкое имя -> {name, pcs, fromMenus:Set}
    const boxes = new Map();  // размер -> количество
    const kit = new Map();    // текст комплекта -> количество
    const plain = [];         // позиции без разбора (снеки, супы)

    /* Внутри меню количество указано в штуках, а отдельная позиция
       заказывается порциями. Приводим к штукам, где у типа есть
       фиксированное количество кусков, иначе считаем порциями. */
    const typePcs = name => {
      const d = dishBy.get(name);
      const t = d && TYPES.find(x => x.id === d[0]);
      return t && t.pcs > 1 ? t.pcs : 0;
    };
    const addWork = (name, pcs, from) => {
      const w = work.get(name) || { name, pcs: 0, portions: 0, from: new Set() };
      w.pcs += pcs;
      if (from) w.from.add(from);
      work.set(name, w);
    };
    const addPortions = (name, q) => {
      const per = typePcs(name);
      const w = work.get(name) || { name, pcs: 0, portions: 0, from: new Set() };
      w.portions += q;
      if (per) w.pcs += q * per;
      work.set(name, w);
    };
    const addKit = (text, n) => kit.set(text, (kit.get(text) || 0) + n);

    for (const it of order.items) {
      const q = Math.max(1, it.qty || 1);
      if (it.kind === "menu") {
        const m = menuBy.get(it.name);
        if (!m) continue;
        for (const [n, dishName] of (m.items || [])) addWork(dishName, n * q, m.name);
        if (m.box) boxes.set(m.box, (boxes.get(m.box) || 0) + q);
        /* Комплект в карточке записан строкой вида «васаби · имбирь · 2× Cocktail Mayo». */
        String(m.kit || "").split("·").map(s => s.trim()).filter(Boolean).forEach(part => {
          const mm = part.match(/^(\d+)\s*[×x]\s*(.+)$/);
          if (mm) addKit(mm[2].trim(), (+mm[1]) * q);
          else addKit(part, q);
        });
      } else {
        addPortions(it.name, q);
      }
    }

    const fry = [], roll = [], other = [];
    for (const w of work.values()) {
      const d = dishBy.get(w.name);
      if (!d) { other.push(w); continue; }
      const cat = d[0], tags = d[6] || [];
      w.cat = cat;
      w.ru = d[2];
      if (tags.includes("deepfried")) fry.push(w);
      else if (["maki", "io", "premium", "mini", "nigiri", "sommer"].includes(cat)) roll.push(w);
      else other.push(w);
    }
    const byName = (a, b) => a.name.localeCompare(b.name);
    return {
      fry: fry.sort(byName), roll: roll.sort(byName), other: other.sort(byName),
      boxes: [...boxes.entries()].sort(),
      kit: [...kit.entries()].sort((a, b) => b[1] - a[1]),
      plain
    };
  }

  return { all, get, put, remove, merge, snapshot, expand,
           set list(v) { list = v; save(); }, get list() { return list; } };
})();
