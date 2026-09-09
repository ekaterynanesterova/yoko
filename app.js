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
        txt = txt.replace(/[.!?;:]+\s*$/, "").trim();
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

  const sauceKey = '<span><b class="scdemo">Sauce ↓ внутрь</b> соус, который кладётся внутрь</span>';
  const topKey = '<span><i class="sw" style="background:transparent"></i> прозрачная ячейка, ↑ сверху — этим поливают или посыпают</span>';
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
  /* Открыли заказы — сразу проверяем, не сняли ли чек на другом устройстве. */
  if (t.dataset.p === "p-order" && typeof OrderSync !== "undefined") OrderSync.pull();
  /* То же для смен: график мог приехать с телефона, пока планшет лежал. */
  if (t.dataset.p === "p-cal" && typeof ShiftSync !== "undefined") ShiftSync.pull();
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
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !lb.hidden) { e.preventDefault(); close(); }
  });

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
        ${rec ? `<button class="rcphoto" type="button" data-photo="dish" data-name="${esc(d.de)}"
          aria-label="Открыть фото во весь размер: ${esc(d.de)}">
          <img src="img/${rec[0]}" alt="${esc(d.de)}" loading="lazy"></button>` : ""}
        <div class="rc-t">
          <h3 id="rcTitle">${esc(d.de)}</h3>
          <span class="ru">${esc(d.ru)}</span>
          <span class="spec">${spec}</span>
          ${d.tags.includes("deepfried") ? '<span class="rc-fry">ФРИ · целиком во фритюре</span>' : ""}
        </div>
      </div>
      <div class="hcells" style="--cols:${meta ? meta.cols : 3}">${cellsHTML(d, meta)}</div>
      ${d.note ? `<p class="rc-note">${esc(d.note)}</p>` : ""}
      <p class="rc-hint">Ячейка с заливкой — кладётся <b>внутрь</b>. Прозрачная со стрелкой <b>↑ сверху</b> — этим поливают или посыпают.</p>`;

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
    /* Просмотр фото открыт поверх карточки: он забирает Escape себе и метит
       событие обработанным — карточка остаётся открытой. */
    if (e.key === "Escape" && !rc.hidden && !e.defaultPrevented) close();
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

  /* Отметка «собрано» живёт в самом заказе, поэтому переживает перезагрузку
     и уезжает на другое устройство вместе с ним. */
  const isDone = (o, name) => !!(o.done && o.done[name]);

  function toggleDone(o, name) {
    o.done = o.done || {};
    if (o.done[name]) delete o.done[name]; else o.done[name] = Date.now();
    o.mt = Date.now();
    Order.put(o);
    renderOrder(o);
    renderHistory();
  }

  /* Сколько позиций работы отмечено — показываем и в заголовке блока,
     и в списке чеков, чтобы видеть, какой заказ ближе к готовности. */
  function progress(o) {
    const e = Order.expand(o);
    const all = [].concat(e.fry, e.roll, e.other);
    return { done: all.filter(w => isDone(o, w.name)).length, total: all.length };
  }

  /* Откуда взялась работа. Когда позиция пришла и из меню, и отдельной
     строкой, разбиваем по источникам — иначе выглядит как ошибка счёта. */
  function srcLine(w) {
    const from = w.from && w.from.size ? [...w.from] : [];
    const unit = w.rolls ? "" : (w.pcs ? " шт" : "");
    const own = w.ownRolls || (w.rolls ? 0 : (w.ownPcs || 0));
    if (!from.length) return own ? `<u>отдельной позицией</u>` : "";
    if (!own) return `<u>из ${esc(from.join(", "))}</u>`;
    const fromN = (w.rolls || w.pcs) - own;
    return `<u>${fromN}${unit} из ${esc(from.join(", "))} · ${own}${unit} отдельно</u>`;
  }
  function chip(w, o) {
    const done = isDone(o, w.name);
    /* Миниатюра открывается во весь размер: на кухне чаще надо свериться
       с видом ролла, а не с названием. Кнопку рисует общий помощник. */
    const th = thumbHTML("dish", w.name, w.ru);
    const cnt = w.rolls || w.pcs || w.portions;
    const unit = w.rolls ? plural(w.rolls, "ролл", "ролла", "роллов") : (w.pcs ? "шт" : "порц");
    const rec = w.cat ? ` data-recipe="${esc(w.name)}" tabindex="0" role="button"` : "";
    return `<div class="wcell${done ? " done" : ""}">
      <button class="wdone" type="button" data-done="${esc(w.name)}" aria-pressed="${done}"
        aria-label="${done ? "Снять отметку" : "Отметить собранным"}: ${esc(w.name)}">✓</button>
      <span class="wn"><span class="mono">${cnt}</span><i>${unit}</i></span>
      ${th}
      <span class="wt"${rec}><b>${esc(w.name)}</b>${w.ru ? `<i>${esc(w.ru)}</i>` : ""}${
        w.rolls ? `<u class="cutinfo">режем по ${w.per} кусков · всего ${w.pcs}</u>` : ""}${
        srcLine(w)}</span>
    </div>`;
  }

  const timeOf = at => new Date(at).toLocaleString("ru-RU",
    { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

  function renderOrder(o) {
    current = o;
    if (!o) { view.innerHTML = ""; return; }
    const e = Order.expand(o);

    const block = (title, arr, cls) => {
      if (!arr.length) return "";
      const left = arr.filter(w => !isDone(o, w.name));
      const total = arr.reduce((a, w) => a + (w.rolls || w.pcs || w.portions), 0);
      const doneN = arr.length - left.length;
      /* Собранное уезжает вниз блока, чтобы не цеплялось глазами. */
      const sorted = left.concat(arr.filter(w => isDone(o, w.name)));
      return `<div class="wblock ${cls}"><h3>${title} <span class="cnt">${total}</span>${
        doneN ? `<span class="donecnt">собрано ${doneN} из ${arr.length}</span>` : ""}</h3>
        <div class="wcells">${sorted.map(w => chip(w, o)).join("")}</div></div>`;
    };

    view.innerHTML = `
      <div class="ordhead">
        <h3>Заказ${o.ref ? " " + esc(o.ref) : ""}</h3>
        <span class="when">${timeOf(o.at)}</span>
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
              ${p.box ? `<span class="boxtag">коробка ${esc(p.box)}</span>`
                : (p.single ? `<span class="boxtag unk">коробка отдельная</span>` : "")}
            </div>
          </div>
          ${p.kit.length ? `<p class="packkit"><span class="lbl">в каждую коробку:</span> ${
            p.kit.map(k => `<span class="tag"><span class="mono">${k.cnt}×</span> ${esc(k.label)}</span>`).join("")}</p>` : ""}
          ${p.single && !p.box ? `<p class="packnote">Размер коробки в техкартах не указан — уточни у шефа, впишу.</p>` : ""}
          ${p.boxAsk ? `<p class="packnote">Размер со слов Kate, у шефа ещё не подтверждён.</p>` : ""}
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
      ${o.unknown && o.unknown.length ? `<div class="wblock w-unk">
        <h3>Не распознано <button class="unkall" id="unkAll" type="button">убрать все</button></h3>
        <p class="wline">${o.unknown.map((u, ix) =>
          `<span class="tag">${esc(u)}<button class="unkx" type="button" data-unk="${ix}" aria-label="Убрать ${esc(u)}">×</button></span>`).join("")}</p>
        <p class="wnote">Эти строки не совпали ни с одной позицией карты. Проверь глазами и убери крестиком.</p></div>` : ""}`;

    $("#ordDel").onclick = () => { Order.remove(o.id); current = null; view.innerHTML = ""; renderHistory(); };

    view.querySelectorAll("[data-done]").forEach(b =>
      b.onclick = () => toggleDone(o, b.dataset.done));

    /* Позицию можно убрать поштучно — заказ набирается по ходу. */
    view.querySelectorAll("[data-drop]").forEach(b => b.onclick = () => {
      o.items.splice(+b.dataset.drop, 1);
      o.mt = Date.now();
      Order.put(o);
      renderOrder(o);
      renderHistory();
    });
    view.querySelectorAll("[data-unk]").forEach(b => b.onclick = () => {
      o.unknown.splice(+b.dataset.unk, 1);
      o.mt = Date.now();
      Order.put(o);
      renderOrder(o);
    });
    const unkAll = view.querySelector("#unkAll");
    if (unkAll) unkAll.onclick = () => {
      o.unknown = [];
      o.mt = Date.now();
      Order.put(o);
      renderOrder(o);
    };
  }

  /* Список всех чеков, а не только прежних: в смену их бывает три-четыре
     одновременно, и нужно с одного взгляда понять, какой открыт и что в нём. */
  function renderHistory() {
    const rows = Order.all().filter(o => !o.deleted);
    if (rows.length < 2) { hist.innerHTML = ""; return; }
    hist.innerHTML = `<div class="ordhist"><h3>Все чеки <span class="cnt">${rows.length}</span></h3>${
      rows.map(o => {
        const open = current && o.id === current.id;
        const pr = progress(o);
        const sum = o.items.map(i => (i.qty > 1 ? i.qty + "× " : "") + i.name).join(" · ") || "пусто";
        const ready = pr.total && pr.done === pr.total;
        return `<button class="ordrow${open ? " open" : ""}${ready ? " ready" : ""}" type="button" data-ord="${esc(o.id)}">
          <span class="rowtop">
            <span class="mono">${timeOf(o.at)}</span>
            ${o.ref ? `<b>${esc(o.ref)}</b>` : ""}
            ${pr.total ? `<span class="prog">${pr.done} из ${pr.total}</span>` : ""}
            ${open ? `<span class="now">открыт</span>` : ""}
          </span>
          <span class="rowsum">${esc(sum)}</span>
        </button>`;
      }).join("")}</div>`;
    hist.querySelectorAll("[data-ord]").forEach(b =>
      b.onclick = () => { renderOrder(Order.get(b.dataset.ord)); renderHistory(); scrollTo({ top: 0, behavior: "smooth" }); });
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
    if (unknown.length) {
      const seen = new Set(o.unknown || []);
      o.unknown = (o.unknown || []).concat(unknown.filter(u => !seen.has(u)));
    }
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

/* ============================================================
   ПОЛОСА СОСТОЯНИЯ СИНХРОНИЗАЦИИ ЗАКАЗОВ
   Раньше при ненастроенной базе всё молчало, и было непонятно,
   почему на планшете пусто. Теперь причина написана прямо тут.
   ============================================================ */
(function () {
  const bar = $("#syncBar"), txt = $("#syncTxt"), btn = $("#syncNow");
  if (!bar) return;

  const hhmm = t => new Date(t).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

  function paint(st) {
    const s = st || OrderSync.state;
    bar.dataset.s = s.kind;
    if (s.kind === "ok") {
      const n = Order.all().filter(o => !o.deleted).length;
      txt.textContent = `чеки синхронизированы · ${n} на всех устройствах · обновлено ${hhmm(s.at || Date.now())}`;
    } else {
      txt.textContent = s.text;
    }
  }

  OrderSync.onState = paint;
  btn.onclick = () => { txt.textContent = "проверяю…"; OrderSync.pull().then(() => paint()); };

  /* Не вошли — говорим об этом сразу, не дожидаясь первой попытки. */
  if (!Sync.session) paint({ kind: "off", text: "синхронизация выключена — нажми «синхронизация» в шапке и войди" });
  else paint();
})();

/* ============================================================
   BUILD YOUR BOWL — сборщик
   Не список, а рабочий инструмент: тыкаешь варианты, видишь
   предел по каждому этапу и что в итоге получилось.
   ============================================================ */
(function () {
  const stepsEl = $("#bowlSteps"), sumEl = $("#bowlSum");
  if (!stepsEl) return;

  $("#bowlTitle").textContent = BOWL.ru;
  $("#bowlLead").innerHTML = esc(BOWL.lead) +
    ` <b>${esc(BOWL.de)}</b> — так это называется в карте.`;

  /* Выбор держим в памяти вкладки: это рабочий черновик под один заказ. */
  const picked = {};
  BOWL.steps.forEach(s => { picked[s.key] = new Set(); });

  function toggle(stepKey, idx) {
    const step = BOWL.steps.find(s => s.key === stepKey);
    const set = picked[stepKey];
    if (set.has(idx)) set.delete(idx);
    else {
      /* Дошли до предела — самый старый выбор уступает место новому. */
      if (set.size >= step.max) set.delete(set.values().next().value);
      set.add(idx);
    }
    render();
  }

  function render() {
    stepsEl.innerHTML = BOWL.steps.map(step => {
      const set = picked[step.key];
      const full = set.size >= step.max;
      return `<section class="bstep${full ? " full" : ""}">
        <header class="bhead">
          <h3>${esc(step.ru)}</h3>
          <span class="bde">${esc(step.de)}</span>
          <span class="bmax">максимум ${step.max}</span>
          ${step.pay ? `<span class="bpay ${step.pay === "платно" ? "paid" : "free"}">${esc(step.pay)}</span>` : ""}
          <span class="bcount">${set.size} из ${step.max}</span>
        </header>
        <div class="bopts">${step.items.map((it, i) => {
          const on = set.has(i);
          return `<button class="bopt${on ? " on" : ""}" type="button"
            data-step="${esc(step.key)}" data-i="${i}" aria-pressed="${on}">
            <span class="bg">${esc(it.g)}</span>
            <span class="bt"><b>${esc(it.de)}</b><i>${esc(it.ru)}</i>${
              it.how ? `<u>${esc(it.how)}</u>` : ""}</span>
          </button>`;
        }).join("")}</div>
      </section>`;
    }).join("");

    stepsEl.querySelectorAll("[data-step]").forEach(b =>
      b.onclick = () => toggle(b.dataset.step, +b.dataset.i));

    const chosen = BOWL.steps
      .map(s => ({ s, list: [...picked[s.key]].map(i => s.items[i]) }))
      .filter(x => x.list.length);

    sumEl.innerHTML = chosen.length
      ? `<div class="bsum">
          <h3>Собрано <button class="btn" id="bowlReset" type="button">сбросить</button></h3>
          ${chosen.map(x => `<p class="bline"><span class="lbl">${esc(x.s.ru)}</span>${
            x.list.map(it => `<span class="tag"><span class="mono">${esc(it.g)}</span> ${esc(it.de)}</span>`).join("")}</p>`).join("")}
        </div>`
      : `<p class="bempty">Ничего не выбрано. Нажимай варианты — соберётся боул.</p>`;

    const rst = $("#bowlReset");
    if (rst) rst.onclick = () => { BOWL.steps.forEach(s => picked[s.key].clear()); render(); };
  }

  render();
})();

/* ============================================================
   СМЕНЫ

   Два вида одного месяца. «Сетка» повторяет бумажный Dienstplan:
   колонки понедельник—воскресенье, в ячейке число и под ним имена
   столбиком — глаз уже привык искать смену именно так. «Список»
   удобнее на ходу: те же дни строками, ничего не надо листать вбок.
   ============================================================ */
(function () {
  const daysBox = $("#calDays"), editBox = $("#calEdit"), meSel = $("#calMe"),
        title = $("#calMonth"), count = $("#calCount"), nextBox = $("#calNext"),
        state = $("#calState"), file = $("#calFile");
  if (!daysBox) return;

  const WD = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
  /* Заголовки сетки идут с понедельника — как на листе от руководителя. */
  const HEAD = [
    ["понедельник", "Montag"], ["вторник", "Dienstag"], ["среда", "Mittwoch"],
    ["четверг", "Donnerstag"], ["пятница", "Freitag"], ["суббота", "Samstag"],
    ["воскресенье", "Sonntag"]
  ];
  const MON = ["январь", "февраль", "март", "апрель", "май", "июнь",
               "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];
  const MON_OF = ["января", "февраля", "марта", "апреля", "мая", "июня",
                  "июля", "августа", "сентября", "октября", "ноября", "декабря"];

  const VIEW_LS = "yoko.shifts.view";
  const today = Shifts.iso(new Date());
  let cur = new Date();
  cur = new Date(cur.getFullYear(), cur.getMonth(), 1);
  let onlyMine = false;
  let editing = "";
  let view = "grid";
  /* На телефоне видно три колонки из семи — при смене месяца подводим
     сетку к нужному дню, чтобы не искать его пальцем. */
  let recenter = true;
  try { view = localStorage.getItem(VIEW_LS) === "list" ? "list" : "grid"; } catch (e) {}

  function say(msg, kind) {
    state.textContent = msg || "";
    state.className = "scanstate" + (kind ? " " + kind : "");
  }

  /* ---------- кто я ---------- */
  function fillMe() {
    const list = Shifts.roster();
    const me = Shifts.me();
    meSel.innerHTML = '<option value="">— не выбрано —</option>' +
      list.map(n => `<option value="${esc(n)}"${Shifts.same(n, me) ? " selected" : ""}>${esc(n)}</option>`).join("");
  }
  meSel.addEventListener("change", () => { Shifts.setMe(meSel.value); render(); });

  /* ---------- ближайшие смены ---------- */
  function renderNext() {
    const me = Shifts.me();
    if (!me) {
      nextBox.innerHTML = `<p class="calhint">Выбери своё имя выше — тогда сайт подсветит твои смены и покажет ближайшую.</p>`;
      return;
    }
    const up = Shifts.upcoming(me, 3);
    if (!up.length) {
      nextBox.innerHTML = `<p class="calhint">Твоих смен впереди в графике нет. Как придёт новое фото — сфотографируй его здесь.</p>`;
      return;
    }
    const one = up[0], d = Shifts.dateOf(one.date);
    const days = Math.round((d - Shifts.dateOf(today)) / 86400000);
    const when = days === 0 ? "сегодня" : days === 1 ? "завтра" : "через " + days + " дн.";
    const withMe = (Shifts.get(one.date).who || [])
      .filter(p => !Shifts.same(p.n, me)).map(p => p.n);
    nextBox.innerHTML =
      `<div class="calnextcard">
        <span class="lbl">ближайшая смена</span>
        <b>${WD[d.getDay()]}, ${d.getDate()} ${MON_OF[d.getMonth()]}</b>
        <i>${when}${one.t ? " · " + esc(one.t) : ""}</i>
        ${withMe.length ? `<span class="calwith">вместе с: ${esc(withMe.join(", "))}</span>` : ""}
      </div>` +
      (up.length > 1
        ? `<p class="calhint">дальше: ${up.slice(1).map(u => {
            const x = Shifts.dateOf(u.date);
            return WD[x.getDay()] + " " + x.getDate() + " " + MON_OF[x.getMonth()] + (u.t ? " (" + esc(u.t) + ")" : "");
          }).join(" · ")}</p>`
        : "");
  }

  /* ---------- общее ---------- */
  const dateStr = (y, m, d) =>
    y + "-" + String(m + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");

  const whoOf = date => ((Shifts.get(date) || {}).who) || [];
  const isMine = (who, me) => !!me && who.some(p => Shifts.same(p.n, me));

  function chip(p, me) {
    const mine = me && Shifts.same(p.n, me);
    return `<span class="calp${mine ? " me" : ""}">${esc(p.n)}${
      p.t ? `<i>${esc(p.t)}</i>` : ""}</span>`;
  }

  /* ---------- сетка ---------- */
  function renderGrid(me) {
    const y = cur.getFullYear(), m = cur.getMonth();
    const first = new Date(y, m, 1);
    /* Неделя начинается с понедельника: воскресенье в JS это 0. */
    const lead = (first.getDay() + 6) % 7;
    const last = new Date(y, m + 1, 0).getDate();
    const cells = Math.ceil((lead + last) / 7) * 7;

    let out = `<div class="calgridwrap"><div class="calgrid">` +
      HEAD.map(h => `<div class="calhcell"><b>${h[0]}</b><i>${h[1]}</i></div>`).join("");

    for (let i = 0; i < cells; i++) {
      const dayNum = i - lead + 1;
      if (dayNum < 1 || dayNum > last) { out += `<div class="calcell out"></div>`; continue; }
      const date = dateStr(y, m, dayNum);
      const who = whoOf(date);
      const mine = isMine(who, me);
      const cls = ["calcell"];
      if (mine) cls.push("mine");
      if (date === today) cls.push("today");
      if (!who.length) cls.push("empty");
      if (editing === date) cls.push("sel");
      if (onlyMine && !mine) cls.push("dim");
      out += `<button class="${cls.join(" ")}" type="button" data-open="${date}" aria-expanded="${editing === date}">
        <span class="calnum">${dayNum}</span>
        <span class="calnames">${who.length
          ? who.map(p => `<span class="caln${me && Shifts.same(p.n, me) ? " me" : ""}">${
              esc(p.n)}${p.t ? `<i>${esc(p.t)}</i>` : ""}</span>`).join("")
          : ""}</span>
      </button>`;
    }
    return out + `</div></div>`;
  }

  /* ---------- список ---------- */
  function renderList(me) {
    const y = cur.getFullYear(), m = cur.getMonth();
    const last = new Date(y, m + 1, 0).getDate();
    const rows = [];
    for (let i = 1; i <= last; i++) {
      const date = dateStr(y, m, i);
      const who = whoOf(date);
      const mine = isMine(who, me);
      if (onlyMine && !mine && editing !== date) continue;
      const d = Shifts.dateOf(date);
      const cls = ["calday"];
      if (mine) cls.push("mine");
      if (date === today) cls.push("today");
      if (d.getDay() === 0 || d.getDay() === 6) cls.push("we");
      if (!who.length) cls.push("empty");
      if (d.getDay() === 1) cls.push("wk");
      rows.push(`<div class="${cls.join(" ")}" data-date="${date}">
        <button class="calopen" type="button" data-open="${date}" aria-expanded="${editing === date}">
          <span class="caldate"><b>${i}</b><i>${WD[d.getDay()]}</i></span>
          <span class="calwho">${who.length
            ? who.map(p => chip(p, me)).join("")
            : `<span class="calnone">не заполнено</span>`}</span>
        </button>
      </div>`);
    }
    return rows.length ? rows.join("") :
      `<p class="empty">${onlyMine ? "В этом месяце твоих смен нет." : "Этот месяц ещё не заполнен."}</p>`;
  }

  /* ---------- правка дня ----------
     Отдельной панелью под календарём, а не внутри ячейки: в сетке
     ячейка узкая, поля в неё не влезают и ломают колонки. */
  function renderEditor() {
    if (!editing) { editBox.innerHTML = ""; editBox.hidden = true; return; }
    editBox.hidden = false;
    const who = whoOf(editing);
    const d = Shifts.dateOf(editing);
    const opts = Shifts.roster().map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join("");
    editBox.innerHTML = `<div class="caledit">
      <div class="calehead">
        <b>${WD[d.getDay()]}, ${d.getDate()} ${MON_OF[d.getMonth()]}</b>
        <button class="btn" type="button" data-close="1">Готово</button>
      </div>
      ${who.length ? who.map((p, i) => `
        <div class="calerow">
          <b>${esc(p.n)}</b>
          <input type="text" class="calet" data-t="${i}" value="${esc(p.t || "")}" placeholder="время, если есть" aria-label="Время для ${esc(p.n)}">
          <button class="btn caldel" type="button" data-del="${i}" aria-label="Убрать ${esc(p.n)}">✕</button>
        </div>`).join("") : `<p class="calhint">В этот день пока никого нет.</p>`}
      <div class="calerow add">
        <select class="calenew" aria-label="Кого добавить"><option value="">кого добавить…</option>${opts}</select>
        <input type="text" class="calent" placeholder="время, если есть" aria-label="Время новой смены">
        <button class="btn primary" type="button" data-add="1">Добавить</button>
      </div>
    </div>`;

    const date = editing;
    const list = who.map(p => ({ ...p }));
    editBox.querySelectorAll("[data-del]").forEach(b => b.onclick = () => {
      list.splice(+b.dataset.del, 1); Shifts.put(date, list);
    });
    editBox.querySelectorAll("[data-t]").forEach(inp => inp.onchange = () => {
      list[+inp.dataset.t].t = inp.value.trim(); Shifts.put(date, list);
    });
    editBox.querySelector("[data-add]").onclick = () => {
      const n = editBox.querySelector(".calenew").value;
      if (!n) return;
      list.push({ n, t: editBox.querySelector(".calent").value.trim() });
      Shifts.put(date, list);
    };
    editBox.querySelector("[data-close]").onclick = () => { editing = ""; render(); };
  }

  function render() {
    const me = Shifts.me();
    const y = cur.getFullYear(), m = cur.getMonth();
    title.textContent = MON[m][0].toUpperCase() + MON[m].slice(1) + " " + y;

    daysBox.className = view === "grid" ? "caldays grid" : "caldays list";
    daysBox.innerHTML = view === "grid" ? renderGrid(me) : renderList(me);

    let filled = 0;
    const last = new Date(y, m + 1, 0).getDate();
    for (let i = 1; i <= last; i++) if (whoOf(dateStr(y, m, i)).length) filled++;
    count.textContent = me
      ? "твоих смен: " + Shifts.countIn(y, m, me) + " · дней в графике: " + filled
      : "дней в графике: " + filled;

    daysBox.querySelectorAll("[data-open]").forEach(b => b.onclick = () => {
      editing = editing === b.dataset.open ? "" : b.dataset.open;
      render();
      if (editing) editBox.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });

    if (view === "grid" && recenter) {
      const wrap = daysBox.querySelector(".calgridwrap");
      const cell = daysBox.querySelector(".calcell.sel") || daysBox.querySelector(".calcell.today")
        || daysBox.querySelector(".calcell.mine");
      if (wrap && cell && wrap.scrollWidth > wrap.clientWidth) {
        wrap.scrollLeft = Math.max(0, cell.offsetLeft - (wrap.clientWidth - cell.offsetWidth) / 2);
        recenter = false;
      }
    }

    fillMe();
    renderNext();
    renderEditor();
  }

  /* ---------- навигация ---------- */
  $("#calPrev").onclick = () => { cur = new Date(cur.getFullYear(), cur.getMonth() - 1, 1); editing = ""; recenter = true; render(); };
  $("#calNext2").onclick = () => { cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1); editing = ""; recenter = true; render(); };
  $("#calToday").onclick = () => {
    const n = new Date();
    cur = new Date(n.getFullYear(), n.getMonth(), 1); editing = ""; recenter = true; render();
  };
  const mineBtn = $("#calOnlyMine");
  mineBtn.onclick = () => {
    onlyMine = !onlyMine;
    mineBtn.setAttribute("aria-pressed", String(onlyMine));
    render();
  };
  const viewBtns = document.querySelectorAll("#calView .chip");
  function paintView() {
    viewBtns.forEach(b => b.setAttribute("aria-pressed", String(b.dataset.v === view)));
  }
  viewBtns.forEach(b => b.onclick = () => {
    view = b.dataset.v;
    try { localStorage.setItem(VIEW_LS, view); } catch (e) {}
    recenter = true; paintView(); render();
  });
  paintView();

  /* ---------- фото графика ---------- */
  async function handle(f) {
    if (!f) return;
    if (!Scan.hasKey()) { askKey(); return; }
    say("Читаю график…");
    try {
      /* Год на листе не пишут — берём из месяца, который сейчас открыт. */
      const res = await Scan.recognizeShifts(f, cur.getFullYear());
      const n = Shifts.applyPhoto(res);
      if (n) {
        /* Перескакиваем на месяц, который только что распознали. */
        const first = Shifts.dateOf(res.days[0].date);
        cur = new Date(first.getFullYear(), first.getMonth(), 1);
        editing = "";
      }
      render();
      const un = res.unknown.length ? " Не разобрано: " + res.unknown.join(", ") + "." : "";
      say(n ? `Внесено дней: ${n}.${un} Проверь глазами — почерк есть почерк.`
            : "Дни не распознались — попробуй переснять ровнее и ближе.",
          n ? "ok" : "err");
    } catch (err) {
      say(err.message || "Не получилось прочитать график.", "err");
    } finally { file.value = ""; }
  }

  function askKey() {
    const k = window.prompt("Ключ Gemini (хранится только в этом браузере):", "");
    if (k === null) return;
    Scan.setKey(k);
    say(Scan.hasKey() ? "Ключ сохранён. Можно фотографировать график." : "Ключ убран.", "ok");
  }

  file.addEventListener("change", () => handle(file.files && file.files[0]));
  $("#calScan").addEventListener("click", () => file.click());
  $("#calKey").addEventListener("click", askKey);

  /* ---------- синхронизация ---------- */
  const bar = $("#calSyncBar"), txt = $("#calSyncTxt");
  function paint(st) {
    bar.dataset.s = st.kind;
    txt.textContent = st.kind === "ok" && st.at
      ? "обновлено " + new Date(st.at).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })
      : st.text;
  }
  ShiftSync.onState = paint;
  paint(ShiftSync.state);
  $("#calSyncNow").onclick = () => ShiftSync.pull().then(() => ShiftSync.push());

  /* Панель рисуется скрытой, поэтому первый честный расчёт ширины
     возможен только когда вкладку открыли. */
  const calTab = document.querySelector(`.tab[data-p="p-cal"]`);
  if (calTab) calTab.addEventListener("click", () => { recenter = true; render(); });

  Shifts.onChange = () => { try { render(); } catch (e) {} };
  render();
})();
