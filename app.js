"use strict";

/* ============================================================
   РЕНДЕР
   ============================================================ */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));

/* -- каркас -- */
$("#frameCards").innerHTML = TYPES.map(t=>`
  <div class="fcard" style="--c:${t.c}">
    <h3>${esc(t.ru)}</h3>
    <div class="de">${esc(t.de)}</div>
    <div class="nums">
      <div><span class="v">${t.rice}</span><span class="k">г риса</span></div>
      <div><span class="v">${t.pcs}</span><span class="k">${t.pcs===1?"порция":"шт в порции"}</span></div>
    </div>
    <div class="rule">${t.rule}</div>
  </div>`).join("");

$("#rulesBody").innerHTML = RULES.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join("");
$("#famBody").innerHTML = FAMILIES.map(f=>`<tr><td><b>${f[0]}</b></td><td>${f[1]}</td><td>${f[2]}</td><td>${f[3]}</td><td>${f[4]}</td></tr>`).join("");

/* -- соусы -- */
$("#sauceBody").innerHTML = SAUCE_TABLE.map(s=>
  `<tr><td><b>${esc(s[0])}</b></td><td>${esc(s[1])}</td><td>${s[2]}</td></tr>`).join("");
$("#dipBody").innerHTML = DIPS.map(d=>
  `<tr><td><b>${esc(d[0])}</b></td><td class="n">${esc(d[1])}</td><td>${esc(d[2])}</td></tr>`).join("");

/* -- заготовки -- */
function prepCard(p){
  const items = p.items && p.items.length
    ? `<ul>${p.items.map(i=>`<li><span class="mono">${esc(i[0])}</span> — ${esc(i[1])}</li>`).join("")}</ul>` : "";
  const steps = p.steps ? `<ol>${p.steps.map(s=>`<li>${s}</li>`).join("")}</ol>` : "";
  const warn  = p.warn ? `<div class="warn">${p.warn}</div>` : "";
  return `<div class="prep"><h3>${esc(p.ru)}</h3><div class="de">${esc(p.de)}</div>${items}${steps}${warn}</div>`;
}
$("#prepBase").innerHTML  = PREPS_BASE.map(prepCard).join("");
$("#prepSauce").innerHTML = PREPS_SAUCE.map(prepCard).join("");
$("#prepFood").innerHTML  = PREPS_FOOD.map(prepCard).join("");

/* -- меню и коробки -- */
$("#snackBody").innerHTML = SNACKS.map(s=>
  `<tr><td><b>${esc(s[0])}</b></td><td class="n">${esc(s[1])}</td><td class="n">${esc(s[2])}</td><td>${esc(s[3])}</td></tr>`).join("");

/* -- блюда -- */
const dishes = D.map((d,i)=>({
  i, cat:d[0], de:d[1], ru:d[2], f:d[3], t:d[4], s:d[5], tags:d[6], note:d[7]||""
}));
function typeOf(cat){ return TYPES.find(t=>t.id===cat); }

/* ============================================================
   СЕТ-МЕНЮ
   Каждая позиция — своя ячейка, цвет по тому, жарится она или нет.
   ============================================================ */
const dishByDe = new Map(dishes.map(d => [d.de, d]));

function setItemCell(it) {
  const [n, name, umh] = it;
  const d = dishByDe.get(name);
  const extra = SET_EXTRA[name];
  const fried = d ? d.tags.includes("deepfried") : (extra ? extra.fried : false);
  const known = !!(d || extra);
  const ruName = d ? d.ru : (extra ? extra.ru : "");
  const cls = !known ? "s-none" : (fried ? "s-fry" : "s-nofry");
  return `<div class="scell ${cls}">
    <span class="cnt">${n}</span>
    <span class="txt"><b>${esc(name)}</b>${ruName ? `<i>${esc(ruName)}</i>` : ""}${
      umh ? `<u>обсыпка: ${esc(umh)}</u>` : ""}</span>
  </div>`;
}

function renderSets() {
  $("#setList").innerHTML = MENUCARDS.map(m => {
    const items = m.items || [];
    const sum = items.reduce((a, i) => a + i[0], 0);
    /* Сумма по списку должна сходиться с заявленным количеством —
       если нет, это ошибка в источнике, и её лучше видеть. */
    const mismatch = m.pcs && items.length && sum !== m.pcs;

    const meta = [];
    if (m.pcs) meta.push(`<span class="mono">${m.pcs}</span> шт`);
    else if (sum) meta.push(`<span class="mono">${sum}</span> шт`);
    if (m.box) meta.push(`коробка <span class="mono">${esc(m.box)}</span>`);
    if (m.kit) meta.push(esc(m.kit));

    return `<article class="setcard">
      <header class="sethead">
        <h3>${esc(m.name)}</h3>
        <div class="setmeta">${meta.join('<span class="dot">·</span>')}</div>
      </header>
      ${m.note ? `<p class="setnote">${esc(m.note)}</p>` : ""}
      ${mismatch ? `<p class="setwarn">Заявлено ${m.pcs} шт, а по списку выходит ${sum}. Сверь у шефа.</p>` : ""}
      ${items.length ? `<div class="scells">${items.map(setItemCell).join("")}</div>` : ""}
    </article>`;
  }).join("");

  $("#setLegend").innerHTML =
    '<span><i class="sw" style="background:var(--green-band)"></i> не жарится</span>'
    + '<span><i class="sw" style="background:var(--amber-band)"></i> жарится во фритюре</span>'
    + '<span><span class="cntdemo">8</span> сколько штук этой позиции в коробке</span>';
}
renderSets();

const PAINT_LS = "yoko.paint";
let paint = "book";
try { paint = localStorage.getItem(PAINT_LS) || "book"; } catch (e) {}

/* Цвет ячейки: либо как в печатной папке (по разделу), либо по тому, жарится ли блюдо. */
function fillOf(d, meta) {
  if (paint === "fry") {
    return d.tags.includes("deepfried")
      ? { band: "--amber-band", ink: "--amber-ink" }
      : { band: "--green-band", ink: "--green-ink" };
  }
  return { band: meta.band, ink: meta.ink };
}

function cell(x, cls, style) {
  const r = ru(x);
  /* Соус помечаем только когда он идёт внутрь — там его легко проглядеть. */
  const sc = SAUCES.has(x) ? " sc" : "";
  return `<div class="cell ${cls}${sc}" ${style}><b>${esc(x)}</b>${r ? `<i>${esc(r)}</i>` : ""}</div>`;
}

function cellsHTML(d, meta) {
  const c = fillOf(d, meta);
  const style = `style="--fill:var(${c.band});--fink:var(${c.ink})"`;
  const cells = [];
  d.f.forEach(x => cells.push(cell(x, "", style)));
  /* Прозрачная ячейка — то, что кладётся сверху. Как в оригинале. */
  d.t.concat(d.s).forEach(x => cells.push(cell(x, "on", "")));
  if (!cells.length) cells.push(`<div class="cell" ${style}><b>только рис и нори</b></div>`);
  /* Добираем пустыми ячейками до конца строки — в папке полоса всегда во всю ширину. */
  const cols = meta.cols;
  while (cells.length % cols !== 0) cells.push(`<div class="cell blank" ${style}><b>.</b></div>`);
  return cells.join("");
}

function renderDishes() {
  const q = $("#q").value.trim().toLowerCase();
  const f = document.querySelector('.tools .chip[data-f][aria-pressed="true"]').dataset.f;
  let out = "", any = false;
  const sections = [];

  for (const key of Object.keys(CATS)) {
    const t = typeOf(key), meta = CATS[key];
    const list = dishes.filter(d => d.cat === key)
      .filter(d => f === "all" || d.tags.includes(f))
      .filter(d => !q || (d.de + " " + d.ru + " " + d.f.concat(d.t, d.s).join(" ") + " "
                          + d.f.concat(d.t, d.s).map(ru).join(" ")).toLowerCase().includes(q));
    if (!list.length) continue;
    any = true;
    sections.push({ key, label: meta.short, n: list.length });

    const base = key === "bowl"
      ? `<p class="bowlbase"><b>База во всех боулах:</b> ${BOWL_BASE.join(" · ")}</p>` : "";
    const cut = t.pcs === 1 ? "порция" : `in <span class="mono">${t.pcs}</span> Stück geschnitten`;

    out += `<div class="cat" id="cat-${key}">
      <div class="cathead">
        <h3>${esc(meta.ru)}</h3>
        <span class="spec"><span class="mono">${t.rice} g</span> Reis</span>
        <span class="spec">${cut}</span>
      </div>
      ${base}
      <div class="rows">${list.map(d => `
        <div class="hrow">
          <div class="hname">
            ${d.tags.includes("deepfried") ? '<span class="fry">ФРИ</span>' : ""}
            <b>${esc(d.de)}</b><i>${esc(d.ru)}${d.note ? " · " + esc(d.note) : ""}</i>
          </div>
          <div class="hcells" style="--cols:${meta.cols}">${cellsHTML(d, meta)}</div>
        </div>`).join("")}</div>
    </div>`;
  }
  $("#dishList").innerHTML = out;
  $("#dishEmpty").hidden = any;

  /* Закладки строим по тем разделам, что реально попали в выдачу. */
  $("#jump").innerHTML = sections.map(c =>
    `<button class="jchip" type="button" data-go="cat-${c.key}">${esc(c.label)}<span class="n">${c.n}</span></button>`
  ).join("");

  const sauceKey = '<span><b class="scdemo">Sauce ↓</b> соус, который идёт внутрь</span>';
  const topKey = '<span><i class="sw" style="background:transparent"></i> прозрачная ячейка — кладётся сверху</span>';
  $("#legend").innerHTML = paint === "fry"
    ? '<span><i class="sw" style="background:var(--green-band)"></i> ролл не жарится</span>'
      + '<span><i class="sw" style="background:var(--amber-band)"></i> ролл целиком во фритюре</span>'
      + topKey + sauceKey
    : topKey + sauceKey
      + '<span><span class="fry">ФРИ</span> ролл целиком во фритюре</span>';
}

$("#q").addEventListener("input", renderDishes);
document.querySelectorAll('.tools .chip[data-f]').forEach(c => c.addEventListener("click", () => {
  document.querySelectorAll('.tools .chip[data-f]').forEach(x => x.setAttribute("aria-pressed", "false"));
  c.setAttribute("aria-pressed", "true"); renderDishes();
}));
document.querySelectorAll('.tools .chip[data-paint]').forEach(c => {
  c.setAttribute("aria-pressed", String(c.dataset.paint === paint));
  c.addEventListener("click", () => {
    document.querySelectorAll('.tools .chip[data-paint]').forEach(x => x.setAttribute("aria-pressed", "false"));
    c.setAttribute("aria-pressed", "true");
    paint = c.dataset.paint;
    try { localStorage.setItem(PAINT_LS, paint); } catch (e) {}
    renderDishes();
  });
});

renderDishes();

/* ============================================================
   ТРЕНАЖЁР
   ============================================================ */

let mode = "fill", deck = [], cur = null, shown = false, streak = 0;

function buildDeck(){
  if (mode === "gram") {
    deck = TYPES.map(t => ({k:"g:"+t.id, t}));
  } else if (mode === "sauce") {
    deck = dishes.filter(d => d.s.length || d.t.length).map(d => ({k:"s:"+d.i, d}));
  } else if (mode === "quiz") {
    deck = dishes.filter(d => d.s.length || d.t.length).map(d => ({k:"q:"+d.i, d}));
  } else {
    deck = dishes.filter(d => d.f.length).map(d => ({k:"f:"+d.i, d}));
  }
  deck = deck.filter(x => !P.isKnown(x.k));
  for (let i = deck.length - 1; i > 0; i--){ const j = Math.floor(Math.random()*(i+1)); [deck[i],deck[j]]=[deck[j],deck[i]]; }
  next();
}
function stats(){
  const total = mode==="gram" ? TYPES.length
    : (mode==="sauce"||mode==="quiz") ? dishes.filter(d=>d.s.length||d.t.length).length
    : dishes.filter(d=>d.f.length).length;
  const pre = mode==="gram"?"g:":mode==="sauce"?"s:":mode==="quiz"?"q:":"f:";
  const done = P.count(pre);
  $("#stDeck").textContent = deck.length;
  $("#stKnown").textContent = done + " / " + total;
  $("#stStreak").textContent = streak;
  $("#prog").style.width = total ? (done/total*100) + "%" : "0%";
}
function next(){ shown = false; cur = deck[0] || null; draw(); }

function answerHTML(d){
  const p = [];
  d.f.forEach(x=>p.push(`<span class="ii${SAUCES.has(x)?" sauce":""}">${esc(x)}<br><small style="opacity:.6;font-weight:400">${esc(ru(x))}</small></span>`));
  d.t.forEach(x=>p.push(`<span class="ii top">${esc(x)}<br><small style="opacity:.6;font-weight:400">${esc(ru(x))}</small></span>`));
  d.s.forEach(x=>p.push(`<span class="ii sauce top">${esc(x)}<br><small style="opacity:.6;font-weight:400">${esc(ru(x))}</small></span>`));
  return p.join("");
}

function draw(){
  const card = $("#card"), act = $("#trActions");
  stats();
  if (!cur){
    card.innerHTML = `<div class="q">Готово</div>
      <p style="color:var(--muted);max-width:34ch">Колода пройдена. Можно сбросить прогресс и пройти заново или переключить режим.</p>`;
    act.innerHTML = `<button class="btn" id="reset" type="button">Сбросить этот режим</button>`;
    $("#reset").onclick = () => {
      const pre = mode==="gram"?"g:":mode==="sauce"?"s:":mode==="quiz"?"q:":"f:";
      P.clearPrefix(pre);
      streak = 0; buildDeck();
    };
    return;
  }

  if (mode === "gram"){
    const t = cur.t;
    card.innerHTML = `<div class="kicker">сколько риса и штук</div>
      <div class="q">${esc(t.ru)}</div><div class="qru">${esc(t.de)}</div>
      ${shown ? `<div class="a" style="gap:26px">
          <span><span class="big">${t.rice}</span><br><span class="kicker">г риса</span></span>
          <span><span class="big">${t.pcs}</span><br><span class="kicker">${t.pcs===1?"порция":"штук"}</span></span>
        </div><p style="font-size:13px;color:var(--muted);max-width:38ch">${t.rule}</p>` : ""}`;
  } else if (mode === "sauce"){
    const d = cur.d;
    const sauce = d.s.concat(d.t);
    card.innerHTML = `<div class="kicker">какой соус и что сверху</div>
      <div class="q">${esc(d.de)}</div><div class="qru">${esc(d.ru)}</div>
      ${shown ? `<div class="a">${sauce.map(x=>`<span class="ii ${SAUCES.has(x)?"sauce":""} top">${esc(x)}<br><small style="opacity:.6;font-weight:400">${esc(ru(x))}</small></span>`).join("")}</div>` : ""}`;
  } else if (mode === "quiz"){
    const d = cur.d;
    const right = d.s.length ? d.s[0] : (d.t[0] || d.f[d.f.length-1]);
    const pool = [...new Set(dishes.flatMap(x => x.s.concat(x.t)))].filter(x => x !== right);
    const opts = [right];
    while (opts.length < 4 && pool.length){ opts.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0]); }
    for (let i = opts.length-1; i>0; i--){ const j = Math.floor(Math.random()*(i+1)); [opts[i],opts[j]]=[opts[j],opts[i]]; }
    card.innerHTML = `<div class="kicker">что идёт сверху / соус</div>
      <div class="q">${esc(d.de)}</div><div class="qru">${esc(d.ru)}</div>
      <div class="opts">${opts.map(o=>`<button class="opt" type="button" data-o="${esc(o)}">${esc(o)}<br><small style="opacity:.6">${esc(ru(o))}</small></button>`).join("")}</div>`;
    card.querySelectorAll(".opt").forEach(b => b.onclick = () => {
      const ok = b.dataset.o === right;
      card.querySelectorAll(".opt").forEach(x => {
        x.disabled = true;
        if (x.dataset.o === right) x.classList.add("right");
        else if (x === b) x.classList.add("wrong");
      });
      if (ok){ P.mark(cur.k); streak++; } else { streak = 0; }
      deck.shift(); if (!ok) deck.push(cur);
      $("#trActions").innerHTML = `<button class="btn primary" id="nx" type="button">Дальше</button>`;
      $("#nx").onclick = next; stats();
    });
    $("#trActions").innerHTML = "";
    return;
  } else {
    const d = cur.d, t = typeOf(d.cat);
    card.innerHTML = `<div class="kicker">${esc(CATS[d.cat].ru)} · ${t.rice} г · ${t.pcs===1?"порция":t.pcs+" шт"}</div>
      <div class="q">${esc(d.de)}</div><div class="qru">${esc(d.ru)}</div>
      ${shown ? `<div class="a">${answerHTML(d)}</div>${d.note?`<p style="font-size:12.5px;color:var(--muted)">${esc(d.note)}</p>`:""}` : ""}`;
  }

  act.innerHTML = shown
    ? `<button class="btn again" id="ag" type="button">Ещё раз</button>
       <button class="btn good" id="ok" type="button">Знаю</button>`
    : `<button class="btn primary" id="sh" type="button">Показать</button>
       <button class="btn" id="sk" type="button">Пропустить</button>`;
  if (shown){
    $("#ag").onclick = () => { streak = 0; deck.shift(); deck.push(cur); next(); };
    $("#ok").onclick = () => { P.mark(cur.k); streak++; deck.shift(); next(); };
  } else {
    $("#sh").onclick = () => { shown = true; draw(); };
    $("#sk").onclick = () => { deck.shift(); deck.push(cur); next(); };
  }
}
document.querySelectorAll("#trModes .chip").forEach(c => c.addEventListener("click", () => {
  document.querySelectorAll("#trModes .chip").forEach(x => x.setAttribute("aria-pressed","false"));
  c.setAttribute("aria-pressed","true"); mode = c.dataset.m; streak = 0; buildDeck();
}));
buildDeck();

/* ============================================================
   ВКЛАДКИ И ТЕМА
   ============================================================ */
document.querySelectorAll(".tab").forEach(t => t.addEventListener("click", () => {
  document.querySelectorAll(".tab").forEach(x => x.setAttribute("aria-selected","false"));
  t.setAttribute("aria-selected","true");
  document.querySelectorAll(".panel").forEach(p => p.hidden = (p.id !== t.dataset.p));
  window.scrollTo({top:0, behavior:"instant"});
}));

$("#theme").addEventListener("click", () => {
  const r = document.documentElement;
  const dark = r.getAttribute("data-theme") === "dark"
    || (!r.getAttribute("data-theme") && matchMedia("(prefers-color-scheme: dark)").matches);
  r.setAttribute("data-theme", dark ? "light" : "dark");
});

/* колода перестраивается, когда прогресс приехал из облака */
P.onChange = () => { try { buildDeck(); } catch(e){} };

/* ============================================================
   ПАНЕЛЬ СИНХРОНИЗАЦИИ
   ============================================================ */
(function () {
  const btn = $("#sync"), sheet = $("#authSheet"), msg = $("#authMsg");
  const form = $("#authForm"), out = $("#authOut"), note = $("#authNote");

  function paint() {
    const s = Sync.session;
    btn.dataset.s = Sync.status;
    btn.textContent = s ? (Sync.status === "error" ? "ошибка синхр." : "синхр. вкл")
                        : (navigator.onLine ? "синхронизация" : "офлайн");
    form.hidden = !!s; out.hidden = !s;
    note.textContent = s
      ? "Прогресс синхронизируется с " + s.email + ". Он подтягивается при открытии вкладки и раз в минуту."
      : "Войди тем же аккаунтом, что в KALORIYA — прогресс тренажёра будет общим на телефоне и ноутбуке. Без входа всё работает, просто остаётся на этом устройстве.";
  }
  function say(t, kind) { msg.textContent = t || ""; msg.dataset.t = kind || ""; }

  Sync.onStatus = (s, text) => {
    paint();
    if (s === "error" && text) say(text, "err");
  };

  btn.onclick = () => { sheet.hidden = false; paint(); say(""); $("#authEmail").focus(); };
  $("#authClose").onclick = () => { sheet.hidden = true; };
  sheet.addEventListener("click", e => { if (e.target === sheet) sheet.hidden = true; });
  document.addEventListener("keydown", e => { if (e.key === "Escape") sheet.hidden = true; });

  async function run(fn, okText) {
    const email = $("#authEmail").value.trim(), pw = $("#authPw").value;
    if (!email || !pw) { say("Заполни почту и пароль.", "err"); return; }
    say("Секунду…");
    try { await fn(email, pw); $("#authPw").value = ""; say(okText, "ok"); paint(); }
    catch (e) { say(e.message || "Не получилось. Проверь почту и пароль.", "err"); }
  }
  $("#authIn").onclick = () => run(Sync.signIn, "Готово, прогресс синхронизирован.");
  $("#authUp").onclick = () => run(Sync.signUp, "Аккаунт создан.");
  $("#authSignOut").onclick = () => { Sync.signOut(); paint(); say("Вышли. Прогресс остался на этом устройстве.", "ok"); };

  window.addEventListener("online", paint);
  window.addEventListener("offline", paint);
  paint();
})();

/* офлайн-режим */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}

/* ============================================================
   ЗАКЛАДКИ ПО РАЗДЕЛАМ
   ============================================================ */
(function () {
  const bar = document.querySelector(".bar");
  const tools = document.querySelector("#p-dish .tools");
  const jump = document.querySelector("#jump");

  /* Высоты шапки и строки закладок меняются на разных ширинах — держим их
     в переменных, иначе закреплённые полосы наезжают друг на друга. */
  function syncHeights() {
    const root = document.documentElement.style;
    root.setProperty("--barh", bar.offsetHeight + "px");
    root.setProperty("--jumph", jump.offsetHeight + "px");
  }
  syncHeights();
  addEventListener("resize", syncHeights);
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(syncHeights);
    ro.observe(bar); ro.observe(jump);
  }

  /* На узком экране поиск с фильтрами не закреплён — учитываем только то,
     что реально висит сверху. */
  function stickyBottom() {
    let h = bar.offsetHeight;
    if (getComputedStyle(jump).position === "sticky") h += jump.offsetHeight;
    if (getComputedStyle(tools).position === "sticky") h += tools.offsetHeight;
    return h;
  }
  const offset = () => stickyBottom() + 10;

  jump.addEventListener("click", e => {
    const b = e.target.closest(".jchip");
    if (!b) return;
    const el = document.getElementById(b.dataset.go);
    if (!el) return;
    const smooth = !matchMedia("(prefers-reduced-motion: reduce)").matches;
    const y = el.getBoundingClientRect().top + scrollY - offset();
    scrollTo({ top: Math.max(0, y), behavior: smooth ? "smooth" : "auto" });
  });

  /* Подсветка раздела, на котором стоим. */
  let ticking = false;
  function spy() {
    ticking = false;
    const cats = [...document.querySelectorAll("#dishList .cat")];
    if (!cats.length) return;
    const line = offset() + 4;
    let active = cats[0].id;
    for (const c of cats) if (c.getBoundingClientRect().top <= line) active = c.id;
    /* У самого низа страницы подсвечиваем последний — иначе он недостижим. */
    if (innerHeight + scrollY >= document.body.scrollHeight - 4) active = cats[cats.length - 1].id;
    document.querySelectorAll("#jump .jchip").forEach(b =>
      b.setAttribute("aria-current", String(b.dataset.go === active)));
  }
  addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(spy); }
  }, { passive: true });
  jump.addEventListener("click", () => setTimeout(spy, 400));
  new MutationObserver(spy).observe(document.querySelector("#dishList"), { childList: true });
  spy();
})();
