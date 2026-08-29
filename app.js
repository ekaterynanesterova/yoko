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
$("#menuBody").innerHTML = MENUS.map(m=>
  `<tr><td><b>${esc(m[0])}</b></td><td class="n">${esc(m[1])}</td><td class="n">${esc(m[2])}</td><td>${m[3]}</td><td>${esc(m[4])}</td></tr>`).join("");
$("#setBody").innerHTML = SETS.map(s=>`<tr><td><b>${esc(s[0])}</b></td><td>${s[1]}</td></tr>`).join("");
$("#snackBody").innerHTML = SNACKS.map(s=>
  `<tr><td><b>${esc(s[0])}</b></td><td class="n">${esc(s[1])}</td><td class="n">${esc(s[2])}</td><td>${esc(s[3])}</td></tr>`).join("");

/* -- блюда -- */
const dishes = D.map((d,i)=>({
  i, cat:d[0], de:d[1], ru:d[2], f:d[3], t:d[4], s:d[5], tags:d[6], note:d[7]||""
}));
function typeOf(cat){ return TYPES.find(t=>t.id===cat); }

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
  /* Соус подчёркиваем и помечаем направлением: ↓ идёт внутрь, ↑ кладётся сверху. */
  const sc = SAUCES.has(x) ? " sc" : "";
  return `<div class="cell ${cls}${sc}" ${style}><b>${esc(x)}</b>${r ? `<i>${esc(r)}</i>` : ""}</div>`;
}

function cellsHTML(d, meta) {
  const c = fillOf(d, meta);
  const style = `style="--fill:var(${c.band});--fink:var(${c.ink})"`;
  const cells = [];
  d.f.forEach(x => cells.push(cell(x, "", style)));
  /* Белая ячейка — то, что кладётся сверху. Ровно как в оригинале. */
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

  for (const key of Object.keys(CATS)) {
    const t = typeOf(key), meta = CATS[key];
    const list = dishes.filter(d => d.cat === key)
      .filter(d => f === "all" || d.tags.includes(f))
      .filter(d => !q || (d.de + " " + d.ru + " " + d.f.concat(d.t, d.s).join(" ") + " "
                          + d.f.concat(d.t, d.s).map(ru).join(" ")).toLowerCase().includes(q));
    if (!list.length) continue;
    any = true;

    const base = key === "bowl"
      ? `<p class="bowlbase"><b>База во всех боулах:</b> ${BOWL_BASE.join(" · ")}</p>` : "";
    const cut = t.pcs === 1 ? "порция" : `in <span class="mono">${t.pcs}</span> Stück geschnitten`;

    out += `<div class="cat">
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

  const sauceKey = '<span><b class="scdemo">Sauce ↓</b> соус внутрь, <b class="scdemo">Sauce ↑</b> соус сверху</span>';
  const topKey = '<span><i class="sw" style="background:var(--cell-top)"></i> без заливки — кладётся сверху</span>';
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
