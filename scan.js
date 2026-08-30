"use strict";
/* ============================================================
   ЧЕК → СБОРОЧНЫЙ ЛИСТ

   Фото кухонного чека уходит в Gemini вместе со списком всех
   позиций карты. Модель не угадывает буквы — она выбирает из
   готового списка, поэтому смазанный шрифт термопринтера почти
   не мешает.

   Ключ хранится только в этом браузере (localStorage), в
   репозиторий не попадает.
   ============================================================ */
const Scan = (function () {
  const KEY_LS = "yoko.gemini";
  const MODEL = "gemini-2.5-flash";
  let key = "";
  try { key = localStorage.getItem(KEY_LS) || ""; } catch (e) {}

  const hasKey = () => !!key;
  function setKey(k) {
    key = (k || "").trim();
    try { key ? localStorage.setItem(KEY_LS, key) : localStorage.removeItem(KEY_LS); } catch (e) {}
  }

  /* Ужимаем до 1600px: текст чека остаётся читаемым, а объём падает в разы. */
  function fileToJpeg(file, maxSide = 1600, quality = 0.85) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        const dataUrl = c.toDataURL("image/jpeg", quality);
        resolve({ base64: dataUrl.split(",")[1], preview: dataUrl, w: c.width, h: c.height });
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Не удалось открыть снимок")); };
      img.src = url;
    });
  }

  /* Словарь для модели: канонические названия и артикулы из каталога Yoko. */
  function vocabulary() {
    const dish = D.map(d => d[1]);
    const menu = MENUCARDS.map(m => m.name);
    return { dish, menu };
  }

  function prompt() {
    const v = vocabulary();
    return [
      "Ты помогаешь повару суши-бара Yoko Sushi разобрать кухонный чек с заказом.",
      "На фото — чек термопринтера на немецком языке.",
      "",
      "Верни СТРОГО JSON такого вида:",
      '{"items":[{"name":"...","qty":1,"kind":"dish|menu","note":""}],"extras":[{"name":"...","qty":1}],"unknown":["..."],"orderRef":""}',
      "",
      "Правила:",
      "1. Поле name бери ТОЛЬКО из списков ниже, дословно. Ничего не придумывай и не переводи.",
      "2. Если строка чека не совпадает ни с чем из списков — положи её текст как есть в unknown.",
      "3. qty — количество из чека, по умолчанию 1.",
      "4. Дополнительные соусы, васаби, имбирь, приборы клади в extras с их текстом с чека.",
      "5. В note положи пожелания к позиции, если они есть: замены, «ohne», «extra», выбранный соус.",
      "6. orderRef — номер заказа или стола, если он на чеке есть.",
      "7. Имя, адрес и телефон клиента игнорируй, в ответ их не включай.",
      "",
      "СПИСОК БЛЮД:",
      v.dish.join(" | "),
      "",
      "СПИСОК МЕНЮ:",
      v.menu.join(" | ")
    ].join("\n");
  }

  async function recognize(file) {
    if (!key) throw new Error("Нет ключа Gemini — нажми «Ключ Gemini» и вставь его.");
    const img = await fileToJpeg(file);
    const url = "https://generativelanguage.googleapis.com/v1beta/models/" +
      MODEL + ":generateContent?key=" + encodeURIComponent(key);
    const body = {
      contents: [{
        parts: [
          { text: prompt() },
          { inline_data: { mime_type: "image/jpeg", data: img.base64 } }
        ]
      }],
      generationConfig: { responseMimeType: "application/json", temperature: 0 }
    };
    const r = await fetch(url, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
    });
    const data = await r.json().catch(() => null);
    if (!r.ok) {
      const msg = (data && data.error && data.error.message) || ("HTTP " + r.status);
      throw new Error(r.status === 400 && /API key/i.test(msg) ? "Ключ Gemini не подошёл." : msg);
    }
    const txt = data && data.candidates && data.candidates[0] &&
      data.candidates[0].content && data.candidates[0].content.parts &&
      data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;
    if (!txt) throw new Error("Модель вернула пустой ответ. Попробуй переснять чек.");
    let parsed;
    try { parsed = JSON.parse(txt); }
    catch (e) { throw new Error("Не удалось разобрать ответ модели."); }
    return normalize(parsed, img.preview);
  }

  /* Приводим ответ к своему виду и отсеиваем всё, чего нет в карте. */
  function normalize(raw, preview) {
    const dishSet = new Map(D.map(d => [d[1].toLowerCase(), d[1]]));
    const menuSet = new Map(MENUCARDS.map(m => [m.name.toLowerCase(), m.name]));
    const items = [], unknown = Array.isArray(raw.unknown) ? raw.unknown.slice() : [];
    for (const it of (Array.isArray(raw.items) ? raw.items : [])) {
      const n = String(it && it.name || "").trim();
      if (!n) continue;
      const asMenu = menuSet.get(n.toLowerCase());
      const asDish = dishSet.get(n.toLowerCase());
      if (asMenu) items.push({ name: asMenu, kind: "menu", qty: +it.qty || 1, note: String(it.note || "") });
      else if (asDish) items.push({ name: asDish, kind: "dish", qty: +it.qty || 1, note: String(it.note || "") });
      else unknown.push(n);
    }
    return {
      id: "o" + Date.now().toString(36),
      at: Date.now(),
      ref: String(raw.orderRef || "").slice(0, 40),
      items,
      extras: (Array.isArray(raw.extras) ? raw.extras : [])
        .map(e => ({ name: String(e && e.name || "").slice(0, 60), qty: +(e && e.qty) || 1 }))
        .filter(e => e.name),
      unknown: unknown.map(u => String(u).slice(0, 80)).filter(Boolean),
      preview: preview || ""
    };
  }

  return { recognize, hasKey, setKey, get model() { return MODEL; } };
})();
