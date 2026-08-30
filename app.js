"use strict";

/* ============================================================
   РЕНДЕР
   ============================================================ */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));

const PHOTO_LS = "yoko.photos";
let photosOn = true;
try { photosOn = localStorage.getItem(PHOTO_LS) !== "0"; } catch (e) {}

/* Миниатюра лежит у нас и работает офлайн; полный размер — на сервере Yoko,
   поэтому увеличение доступно только онлайн. */
function thumbHTML(kind, name, ru, preferBox) {
  if (!photosOn) return "";
  let rec = PHOTO[kind] && PHOTO[kind][name];
  const box = kind === "menu" ? PHOTO.box[name] : null;
  /* В блоке сборки полезнее сразу видеть раскладку коробки, а не витрину. */
  if (preferBox && box) rec = null;
  const cls = kind === "menu" ? "setthumb" : "thumb";
  /* Фото нет — оставляем пустую рамку, иначе названия разъезжаются по левому краю. */
  if (!rec && !box) return `<span class="${cls} none" aria-hidden="true"></span>`;
  const src = rec ? "img/" + rec[0] : "img/box/" + box;
  const alt = esc(name + (ru ? " — " + ru : ""));
  return `<button class="${cls}" type="button" data-photo="${kind}" data-name="${esc(name)}"
    aria-label="Показать фото: ${alt}"><img src="${src}" alt="${alt}" loading="lazy" decoding="async"></button>`;
}

/* ============================================================
   ГОЛОСОВОЙ ВВОД
   Встроенное в браузер распознавание речи: ни ключа, ни трафика
   на наши сервисы. Одна реализация на два поля — поиск по блюдам
   и ручная сборка заказа.
   ============================================================ */
const Voice = (function () {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const LS = "yoko.miclang";
  const supported = !!SR;

  let lang = "de-DE";
  try { lang = localStorage.getItem(LS) || "de-DE"; } catch (e) {}
  const label = () => (lang === "de-DE" ? "DE" : "RU");

  const langBtns = [];
  function paintAll() { langBtns.forEach(b => { b.textContent = label(); }); }
  function toggleLang() {
    lang = lang === "de-DE" ? "ru-RU" : "de-DE";
    try { localStorage.setItem(LS, lang); } catch (e) {}
    paintAll();
    return lang;
  }

  const ERRORS = {
    "not-allowed": "Микрофон запрещён. Разреши доступ в настройках браузера.",
    "service-not-allowed": "Микрофон запрещён. Разреши доступ в настройках браузера.",
    "no-speech": "Ничего не услышала — попробуй ещё раз.",
    "audio-capture": "Микрофон не найден.",
    "network": "Распознаванию нужен интернет."
  };

  /* input — поле, куда пишем; btn — кнопка микрофона; langBtn — переключатель;
     hint(text, kind) — куда сообщать; onFinal — что делать по окончании фразы. */
  function attach(input, btn, langBtn, hint, onFinal) {
    if (!supported) { btn && btn.remove(); langBtn && langBtn.remove(); return; }
    langBtns.push(langBtn);
    paintAll();

    langBtn.onclick = () => {
      const l = toggleLang();
      hint(l === "de-DE" ? "Слушаю немецкий" : "Слушаю русский");
    };

    let rec = null, active = false;
    const stop = () => { active = false; btn.dataset.on = "0"; if (rec) { try { rec.stop(); } catch (e) {} } };

    btn.onclick = () => {
      if (active) { stop(); hint(""); return; }
      rec = new SR();
      rec.lang = lang;
      rec.interimResults = true;
      rec.continuous = false;
      rec.maxAlternatives = 1;

      rec.onstart = () => { active = true; btn.dataset.on = "1"; hint("Говори…", "live"); };

      rec.onresult = e => {
        let txt = "", final = false;
        for (let i = e.resultIndex; i < e.results.length; i++) {
          txt += e.results[i][0].transcript;
          if (e.results[i].isFinal) final = true;
        }
        /* Распознавание любит ставить точку в конце — в поиске она мешает. */
        txt = txt.replace(/[.!?;:]+s*$/, "").trim();
        input.value = txt;
        input.dispatchEvent(new Event("input"));
        if (onFinal) onFinal(txt, final);
      };

      rec.onerror = ev => { stop(); hint(ERRORS[ev.error] || "Не получилось распознать.", "err"); };
      rec.onend = () => { active = false; btn.dataset.on = "0"; };

      try { rec.start(); } catch (e) { stop(); hint("Не удалось включить микрофон.", "err"); }
    };
  }

  return { attach, get supported() { return supported; } };
})();

/* -- каркас -- */
$("#frameCards").innerHTML = TYPES.filter(t => t.frame !== false && !t.off).map(t=>`
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
const allDishes = D.map((d,i)=>({
  i, cat:d[0], de:d[1], ru:d[2], f:d[3], t:d[4], s:d[5], tags:d[6], note:d[7]||""
}));
function typeOf(cat){ return TYPES.find(t=>t.id===cat); }

/* Скрытое не удалено из данных — просто не показывается. Состав сет-меню
   по-прежнему ищет блюда во всём списке, чтобы ссылки не рвались. */
const dishes = allDishes.filter(d => !HIDDEN.has(d.de) && !(typeOf(d.cat) || {}).off);

/* ============================================================
   СЕТ-МЕНЮ
   Каждая позиция — своя ячейка, цвет по тому, жарится она или нет.
   ============================================================ */
const dishByDe = new Map(allDishes.map(d => [d.de, d]));

function setItemCell(it) {
  const [n, name, umh] = it;
  const d = dishByDe.get(name);
  const extra = SET_EXTRA[name];
  const fried = d ? d.tags.includes("deepfried") : (extra ? extra.fried : false);
  const known = !!(d || extra);
  const ruName = d ? d.ru : (extra ? extra.ru : "");
  const cls = !known ? "s-none" : (fried ? "s-fry" : "s-nofry");
  /* Если позиция есть в справочнике — по ней можно открыть рецепт,
     чтобы не уходить из сборки меню в другую вкладку. */
  const act = d ? ` data-recipe="${esc(name)}" tabindex="0" role="button"
    aria-label="Рецепт: ${esc(name)}"` : "";
  return `<div class="scell ${cls}"${act}>
    <span class="cnt">${n}</span>
    <span class="txt"><b>${esc(name)}</b>${ruName ? `<i>${esc(ruName)}</i>` : ""}${
      umh ? `<u>обсыпка: ${esc(umh)}</u>` : ""}</span>
  </div>`;
}

function renderSets() {
  $("#setList").innerHTML = MENUCARDS.filter(m => !HIDDEN_MENUS.has(m.name)).map(m => {
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
        ${thumbHTML("menu", m.name, "")}
        <div class="htxt">
          <h3>${esc(m.name)}</h3>
          <div class="setmeta">${meta.join('<span class="dot">·</span>')}</div>
        </div>
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
    /* У снеков, супов, донбури и вока нет ни граммовки риса, ни общего количества:
       там всё индивидуально и стоит в подписи к позиции. */
    const spec = t.rice
      ? `<span class="spec"><span class="mono">${t.rice} g</span> Reis</span>
         <span class="spec">${cut}</span>`
      : `<span class="spec">${esc(meta.sub)}</span>`;

    out += `<div class="cat" id="cat-${key}">
      <div class="cathead">
        <h3>${esc(meta.ru)}</h3>
        ${spec}
      </div>
      ${base}
      <div class="rows">${list.map(d => `
        <div class="hrow">
          <div class="hname">
            ${d.tags.includes("deepfried") ? '<span class="fry">ФРИ</span>' : ""}
            ${thumbHTML("dish", d.de, d.ru)}
            <div class="txt"><b>${esc(d.de)}</b><i>${esc(d.ru)}${d.note ? " · " + esc(d.note) : ""}</i></div>
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
    deck = TYPES.filter(t => t.frame !== false && !t.off).map(t => ({k:"g:"+t.id, t}));
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
  const total = mode==="gram" ? TYPES.filter(t => t.frame !== false && !t.off).length
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
      ? "Синхронизируется с " + s.email + ": прогресс тренажёра и отсканированные чеки. Подтягивается при открытии вкладки и раз в минуту."
      : "Войди тем же аккаунтом, что в KALORIYA — прогресс тренажёра и снятые чеки будут общими на телефоне и планшете. Без входа всё работает, просто остаётся на этом устройстве.";
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

/* ============================================================
   ФОТО: миниатюры и просмотр
   ============================================================ */
(function () {
  const lb = $("#lb"), img = $("#lbImg"), cap = $("#lbCap");
  let lastFocus = null;

  function open(kind, name) {
    const rec = PHOTO[kind] && PHOTO[kind][name];
    const box = kind === "menu" ? PHOTO.box[name] : null;
    /* У меню полезнее показать собранную коробку; если её нет — фото блюда. */
    const src = box ? "img/box/" + box : (navigator.onLine && rec ? rec[1] : (rec ? "img/" + rec[0] : ""));
    if (!src) return;
    let note = "";
    if (box) note = "Раскладка коробки из Handbuch, Anhang 2";
    else if (!navigator.onLine) note = "Офлайн — показан уменьшенный снимок";
    img.src = src;
    img.alt = name;
    cap.innerHTML = `<b>${esc(name)}</b>${note ? esc(note) : ""}`;
    lastFocus = document.activeElement;
    lb.hidden = false;
    $("#lbX").focus();
  }
  function close() {
    lb.hidden = true;
    img.src = "";
    if (lastFocus && lastFocus.isConnected) lastFocus.focus();
  }

  document.addEventListener("click", e => {
    const b = e.target.closest("[data-photo]");
    if (b) { open(b.dataset.photo, b.dataset.name); return; }
    if (e.target === lb) close();
  });
  $("#lbX").addEventListener("click", close);
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !lb.hidden) close(); });

  const t = $("#photoToggle");
  t.setAttribute("aria-pressed", String(photosOn));
  t.addEventListener("click", () => {
    photosOn = !photosOn;
    t.setAttribute("aria-pressed", String(photosOn));
    try { localStorage.setItem(PHOTO_LS, photosOn ? "1" : "0"); } catch (e) {}
    renderDishes(); renderSets();
  });
})();

/* ============================================================
   РЕЦЕПТ ПО НАЖАТИЮ НА ПОЗИЦИЮ В СЕТ-МЕНЮ
   ============================================================ */
(function () {
  const rc = $("#rc"), body = $("#rcBody");
  let lastFocus = null;

  function open(name) {
    const d = dishByDe.get(name);
    if (!d) return;
    const t = typeOf(d.cat), meta = CATS[d.cat];
    const rec = PHOTO.dish[d.de];
    const spec = t && t.rice
      ? `${meta.ru} · <span class="mono">${t.rice} g</span> Reis · ${
          t.pcs === 1 ? "порция" : `<span class="mono">${t.pcs}</span> Stück`}`
      : (meta ? meta.ru : "");

    body.innerHTML = `
      <div class="rc-head">
        ${rec ? `<img src="img/${rec[0]}" alt="${esc(d.de)}" loading="lazy">` : ""}
        <div class="rc-t">
          <h3 id="rcTitle">${esc(d.de)}</h3>
          <span class="ru">${esc(d.ru)}</span>
          <span class="spec">${spec}</span>
          ${d.tags.includes("deepfried") ? '<span class="rc-fry">ФРИ · целиком во фритюре</span>' : ""}
        </div>
      </div>
      <div class="hcells" style="--cols:${meta ? meta.cols : 3}">${cellsHTML(d, meta)}</div>
      ${d.note ? `<p class="rc-note">${esc(d.note)}</p>` : ""}
      <p class="rc-hint">Ячейка с заливкой — внутрь, прозрачная — сверху. Соус внутрь подчёркнут.</p>`;

    lastFocus = document.activeElement;
    rc.hidden = false;
    $("#rcX").focus();
  }
  function close() {
    rc.hidden = true;
    body.innerHTML = "";
    if (lastFocus && lastFocus.isConnected) lastFocus.focus();
  }

  document.addEventListener("click", e => {
    const c = e.target.closest("[data-recipe]");
    if (c) { open(c.dataset.recipe); return; }
    if (e.target === rc) close();
  });
  document.addEventListener("keydown", e => {
    const c = e.target.closest && e.target.closest("[data-recipe]");
    if (c && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); open(c.dataset.recipe); return; }
    if (e.key === "Escape" && !rc.hidden) close();
  });
  $("#rcX").addEventListener("click", close);
})();

/* ============================================================
   ВКЛАДКА «ЗАКАЗ»: сканирование чека и сборочный лист
   ============================================================ */
(function () {
  const file = $("#scanFile"), state = $("#scanState");
  const view = $("#orderView"), hist = $("#orderHistory");
  let current = null;

  const say = (t, kind) => { state.textContent = t || ""; state.dataset.t = kind || ""; };

  /* 1 ролл, 2 ролла, 5 роллов — иначе на пяти получается «5 ролла». */
  const plural = (n, one, few, many) => {
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b > 1 && b < 5) return few;
    if (b === 1) return one;
    return many;
  };

  function chip(w) {
    const known = !!PHOTO.dish[w.name];
    const act = w.cat ? ` data-recipe="${esc(w.name)}" tabindex="0" role="button"` : "";
    const th = known && photosOn
      ? `<img src="img/${PHOTO.dish[w.name][0]}" alt="" loading="lazy">` : "";
    return `<div class="wcell"${act}>
      <span class="wn"><span class="mono">${w.rolls || w.pcs || w.portions}</span><i>${
        w.rolls ? plural(w.rolls, "ролл", "ролла", "роллов") : (w.pcs ? "шт" : "порц")}</i></span>
      ${th}
      <span class="wt"><b>${esc(w.name)}</b>${w.ru ? `<i>${esc(w.ru)}</i>` : ""}${
        w.rolls ? `<u class="cutinfo">режем по ${w.per} кусков · всего ${w.pcs}</u>` : ""}${
        w.from && w.from.size ? `<u>из ${esc([...w.from].join(", "))}</u>` : ""}</span>
    </div>`;
  }

  function renderOrder(o) {
    current = o;
    if (!o) { view.innerHTML = ""; return; }
    const e = Order.expand(o);
    const block = (title, arr, cls) => arr.length
      ? `<div class="wblock ${cls}"><h3>${title} <span class="cnt">${arr.reduce((a, w) => a + (w.rolls || w.pcs || w.portions), 0)}</span></h3>
         <div class="wcells">${arr.map(chip).join("")}</div></div>` : "";

    view.innerHTML = `
      <div class="ordhead">
        <h3>Заказ${o.ref ? " " + esc(o.ref) : ""}</h3>
        <span class="when">${new Date(o.at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
        <button class="btn" id="ordDel" type="button">Убрать</button>
      </div>
      ${o.items.length ? `<p class="ordline">${o.items.map((i, ix) =>
        `<span class="oi"><span class="mono">${i.qty}×</span> ${esc(i.name)}${i.note ? ` <i>${esc(i.note)}</i>` : ""}<button class="oix" type="button" data-drop="${ix}" aria-label="Убрать ${esc(i.name)}">×</button></span>`).join("")}</p>` : ""}
      ${block("Во фритюр", e.fry, "w-fry")}
      ${block("Крутить", e.roll, "w-roll")}
      ${block("Остальное", e.other, "w-other")}
      ${e.packs.length ? `<div class="wblock w-pack"><h3>Как складывать</h3>
        ${e.packs.map(p => `<div class="pack">
          <div class="packhead">
            ${thumbHTML("menu", p.name, "", true)}
            <div class="pt">
              <b>${p.qty > 1 ? `<span class="mono">${p.qty}×</span> ` : ""}${esc(p.name)}</b>
              ${p.box ? `<span class="boxtag">коробка ${esc(p.box)}</span>` : ""}
            </div>
          </div>
          ${p.kit.length ? `<p class="packkit"><span class="lbl">в каждую коробку:</span> ${
            p.kit.map(k => `<span class="tag"><span class="mono">${k.cnt}×</span> ${esc(k.label)}</span>`).join("")}</p>` : ""}
          ${p.items.length ? `<p class="packitems">${
            p.items.map(([n, nm]) => `<span class="pi"><span class="mono">${n}</span> ${esc(nm)}</span>`).join("")}</p>` : ""}
          ${p.note ? `<p class="packnote">${esc(p.note)}</p>` : ""}
        </div>`).join("")}
        ${e.boxes.length ? `<p class="wline boxsum"><span class="lbl">всего коробок:</span> ${
          e.boxes.map(([b, n]) => `<span class="tag"><span class="mono">${n}×</span> ${esc(b)}</span>`).join("")}</p>` : ""}
        </div>` : ""}
      ${e.kit.length ? `<div class="wblock w-kit"><h3>Комплект</h3><p class="wline">${
        e.kit.map(([k, n]) => `<span class="tag"><span class="mono">${n}×</span> ${esc(k)}</span>`).join("")}</p></div>` : ""}
      ${o.extras && o.extras.length ? `<div class="wblock w-extra"><h3>Допы с чека</h3><p class="wline">${
        o.extras.map(x => `<span class="tag"><span class="mono">${x.qty}×</span> ${esc(x.name)}</span>`).join("")}</p></div>` : ""}
      ${o.unknown && o.unknown.length ? `<div class="wblock w-unk"><h3>Не распознано</h3><p class="wline">${
        o.unknown.map(u => `<span class="tag">${esc(u)}</span>`).join("")}</p>
        <p class="wnote">Эти строки чека не совпали ни с одной позицией карты. Проверь их глазами.</p></div>` : ""}`;

    $("#ordDel").onclick = () => { Order.remove(o.id); current = null; view.innerHTML = ""; renderHistory(); };
    /* Позицию можно убрать поштучно — заказ теперь набирается по ходу. */
    view.querySelectorAll("[data-drop]").forEach(b => b.onclick = () => {
      o.items.splice(+b.dataset.drop, 1);
      o.mt = Date.now();
      Order.put(o);
      renderOrder(o);
    });
  }

  function renderHistory() {
    const rows = Order.all().filter(o => !o.deleted);
    hist.innerHTML = rows.length > 1
      ? `<div class="ordhist"><h3>Прежние чеки</h3>${rows.slice(1).map(o =>
          `<button class="ordrow" type="button" data-ord="${esc(o.id)}">
             <span class="mono">${new Date(o.at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
             ${o.ref ? `<b>${esc(o.ref)}</b>` : ""}
             <i>${o.items.length} поз.</i></button>`).join("")}</div>` : "";
    hist.querySelectorAll("[data-ord]").forEach(b =>
      b.onclick = () => { renderOrder(Order.get(b.dataset.ord)); scrollTo({ top: 0, behavior: "smooth" }); });
  }

  function showLatest() {
    const rows = Order.all().filter(o => !o.deleted);
    renderOrder(rows[0] || null);
    renderHistory();
  }

  async function handle(f) {
    if (!f) return;
    if (!Scan.hasKey()) { askKey(); return; }
    say("Читаю чек…");
    try {
      const o = await Scan.recognize(f);
      Order.put(o);
      showLatest();
      say(o.items.length ? `Разобрано позиций: ${o.items.length}` : "Позиции не распознались — попробуй переснять ровнее.",
          o.items.length ? "ok" : "err");
    } catch (err) {
      say(err.message || "Не получилось прочитать чек.", "err");
    } finally { file.value = ""; }
  }

  function askKey() {
    const k = window.prompt("Ключ Gemini (хранится только в этом браузере):", "");
    if (k === null) return;
    Scan.setKey(k);
    say(Scan.hasKey() ? "Ключ сохранён. Можно сканировать." : "Ключ убран.", "ok");
  }

  file.addEventListener("change", () => handle(file.files && file.files[0]));
  const openPicker = () => {
    document.querySelector('.tab[data-p="p-order"]').click();
    file.click();
  };
  $("#scanBtn").addEventListener("click", openPicker);
  $("#scanBig").addEventListener("click", () => file.click());
  $("#scanKey").addEventListener("click", askKey);

  /* ---------- ручная сборка ----------
     Работает без интернета и без ключа. Позиции ДОБАВЛЯЮТСЯ в текущий
     заказ, а не заменяют его: за смену чек дополняется по ходу. */
  const mHint = (t, kind) => { $("#manualHint").textContent = t || ""; $("#manualHint").dataset.t = kind || ""; };
  let forceNew = false;

  const dishL = new Map(D.map(d => [d[1].toLowerCase(), d[1]]));
  const menuL = new Map(MENUCARDS.map(m => [m.name.toLowerCase(), m.name]));

  function lookup(raw) {
    const low = raw.toLowerCase().trim();
    if (!low) return null;
    if (menuL.has(low)) return { name: menuL.get(low), kind: "menu" };
    if (dishL.has(low)) return { name: dishL.get(low), kind: "dish" };
    /* Неточное совпадение: «филадельфия» найдёт Philadelphia Roll. */
    const mk = [...menuL.keys()].find(k => k.includes(low) || low.includes(k));
    if (mk) return { name: menuL.get(mk), kind: "menu" };
    const dk = [...dishL.keys()].find(k => k.includes(low) || low.includes(k));
    if (dk) return { name: dishL.get(dk), kind: "dish" };
    return null;
  }

  /* «2 Maki Menü, Yoko Roll Lachs и 3 гёдза» → позиции с количеством. */
  function parseLine(text) {
    const items = [], unknown = [];
    const parts = String(text).split(/\s*[,;]\s*|\s+и\s+|\s+und\s+/i)
      .map(x => x.trim()).filter(Boolean);
    for (const part of parts) {
      const m = part.match(/^(\d+)\s*(?:шт\.?|штук[иа]?|порци[йия]?|[x×])?\s*(.+)$/i);
      const qty = m ? Math.max(1, +m[1]) : 1;
      const raw = (m ? m[2] : part).replace(/^[x×]\s*/i, "").trim();
      const hit = lookup(raw);
      if (hit) items.push({ ...hit, qty, note: "" }); else unknown.push(raw);
    }
    return { items, unknown };
  }

  function addToOrder(items, unknown) {
    let o = forceNew ? null : current;
    if (o && o.deleted) o = null;
    if (!o) {
      o = { id: "o" + Date.now().toString(36), at: Date.now(), ref: "", items: [], extras: [], unknown: [] };
      forceNew = false;
    }
    for (const it of items) {
      /* Одну и ту же позицию не плодим — складываем количество. */
      const same = o.items.find(x => x.name === it.name && x.kind === it.kind && !x.note);
      if (same) same.qty += it.qty; else o.items.push(it);
    }
    if (unknown.length) o.unknown = (o.unknown || []).concat(unknown);
    o.mt = Date.now();
    Order.put(o);
    renderOrder(o);
    renderHistory();
    return o;
  }

  function submitManual() {
    const q = $("#manualQ").value.trim();
    if (!q) { mHint("Впиши или продиктуй, что в заказе.", "err"); return; }
    const { items, unknown } = parseLine(q);
    if (!items.length && !unknown.length) return;
    addToOrder(items, unknown);
    $("#manualQ").value = "";
    const added = items.map(i => `${i.qty}× ${i.name}`).join(", ");
    mHint(items.length
      ? `Добавлено: ${added}` + (unknown.length ? `. Не нашла: ${unknown.join(", ")}` : "")
      : `Не нашла: ${unknown.join(", ")}`, items.length ? "ok" : "err");
  }

  $("#manualGo").addEventListener("click", submitManual);
  $("#manualQ").addEventListener("keydown", e => { if (e.key === "Enter") submitManual(); });
  $("#manualNew").addEventListener("click", () => {
    forceNew = true;
    current = null;
    view.innerHTML = "";
    $("#manualQ").value = "";
    mHint("Начат новый заказ — добавляй позиции.", "ok");
    renderHistory();
  });

  /* Голосом: надиктовала — позиции сразу уходят в заказ. */
  Voice.attach($("#manualQ"), $("#manualMic"), $("#manualLang"), mHint, (txt, final) => {
    if (final && txt) submitManual();
  });

  Order.onChange = showLatest;
  showLatest();
})();

/* -- голос в поиске по блюдам -- */
(function () {
  if (!Voice.supported) { const m = $("#mic"), l = $("#micLang"); m && m.remove(); l && l.remove(); return; }
  let hintEl = null;
  const hint = (text, kind) => {
    if (!hintEl) {
      hintEl = document.createElement("p");
      hintEl.className = "michint";
      $("#legend").before(hintEl);
    }
    hintEl.textContent = text || "";
    hintEl.dataset.t = kind || "";
  };
  Voice.attach($("#q"), $("#mic"), $("#micLang"), hint, txt => {
    const found = document.querySelectorAll("#dishList .hrow").length;
    hint(txt ? `«${txt}» — найдено: ${found}` : "", found ? "live" : "err");
  });
})();
