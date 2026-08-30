"use strict";

/* ============================================================
   ГЛОССАРИЙ  DE → RU
   ============================================================ */
const G = {
"Lachs":"лосось сырой","Lachsfilet":"филе лосося","flambierter Lachs":"фламбированный лосось",
"Lachswürfel":"лосось кубиком","Lachshaut":"жареная кожа лосося","Thunfisch":"тунец",
"gebratener Thunfisch":"жареный тунец","Surimi":"сурими, крабовая имитация","Garnele":"креветка",
"Black Tiger Garnele":"креветка блэк-тайгер","Tempura Garnele":"креветка в темпуре",
"Chicken":"курица халяль","Hühnchen":"курица","Hähnchen":"курица","paniertes Hühnchen":"курица в панировке",
"Karaage":"курица в соевом маринаде, фри","Korean fried Chicken":"курица по-корейски",
"Entenbrust":"утиная грудка","Tofu":"тофу","Räuchertofu":"копчёный тофу","frittierter Tofu":"жареный тофу",
"Avocado":"авокадо","Avocado Sticks":"палочки авокадо, жареные","Avocadowürfel":"авокадо кубиком",
"Guacamole":"гуакамоле","Gurke":"огурец","Rucola":"руккола","Möhre":"морковь",
"Möhrenstreifen":"морковная соломка","Karotten":"морковь","Frühlingszwiebeln":"зелёный лук",
"Schnittlauch":"шнитт-лук","Frischkäse":"сливочный сыр, веганский","Sesam":"кунжут",
"Masago":"икра масаго","Algensalat":"салат вакамэ","Salatmix":"салатная смесь","Eisbergsalat":"айсберг",
"Edamame":"эдамаме","Erdnüsse":"арахис","Thai-Spargel Tempura":"тайская спаржа в темпуре",
"Tempuraspargel":"спаржа в темпуре","grüner Spargel":"зелёная спаржа","Hummus":"хумус",
"Granatapfelkerne":"зёрна граната","Asian Coleslaw":"азиатский капустный салат","Rotkohl":"краснокочанная капуста",
"Reispapier":"рисовая бумага","Thai-Pesto":"тайское песто из базилика","Cocktailtomaten":"черри",
"Reis":"рис","Nori":"нори","Pak Choi":"пак-чой","Spiegelei":"глазунья","Wakame":"вакамэ",
"Sweet Sauce":"сладкий соус унаги","Sweet Chili Sauce":"сладкий чили",
"Yoko Cocktailmayonnaise":"фирменный майонез Yoko","Cocktailmayo":"фирменный майонез Yoko",
"Teriyaki Sauce":"терияки","Cranberry Teriyaki Sauce":"клюквенный терияки","Erdnusssauce":"арахисовый соус",
"Hoi Sin Sauce":"хойсин","Honig-Senf-Sauce":"медово-горчичный","Spicy Mango Sauce":"острый манговый",
"Sauce Hollandaise":"голландез","Korean BBQ Sauce":"корейский барбекю","Limonendressing":"лаймовый дрессинг",
"Sojasauce":"соевый соус","Wasabi":"васаби","Ingwer":"маринованный имбирь","Minz Dip":"мятный дип",
"Hähnchenfüllung":"начинка из курицы","Hähnchenbrustspieße":"шпажки из куриной грудки",
"Frühlingsrolle":"спринг-ролл","vegane Nuggets":"веганские наггетсы","gebackene Avocado":"жареное авокадо",
"Bao Teigtasche":"паровая булочка бао","Apfelfüllung":"яблочная начинка","Banane":"банан",
"Kokoscreme":"кокосовый крем","Mangocreme":"манговый крем","Matchacreme":"крем матча",
"Käseküchlein":"творожный кекс","weiße Schokolade":"белый шоколад","Milchschokolade":"молочный шоколад",
"Milka & Daim":"Milka и Daim","Miso-Fond":"мисо-фонд","Seetang":"морские водоросли",
"Lachsfiletstücke":"кусочки филе лосося","Sojabohnen":"соевые бобы","Meersalz":"морская соль",
"Knoblauchbutter":"чесночное масло","Sesamdressing":"кунжутная заправка",
"Pak Choi mit Tomate":"пак-чой с томатом в соевом соусе","Tomate":"томат","Wan-Tan":"вонтоны",
"veganer Backfisch":"веганская рыба в кляре","Gemüse":"овощи","Eiereis":"рис с яйцом",
"Udon Nudeln":"лапша удон","Glasnudeln":"стеклянная лапша","Braune Sauce":"коричневый соус",
"Mangosauce":"манговый соус","Rotes Thaicurry":"красное тайское карри","Gelbes Thaicurry":"жёлтое тайское карри",
"Chicken Teriyaki Spieße":"куриные шпажки терияки","Gyoza Chicken":"гёдза с курицей",
"Crispy Ebi Sticks":"креветки в темпуре","Avocado Sticks":"палочки авокадо",
"scharfe Sauce":"острый соус","Vanille Sauce":"ванильный соус","Honig":"мёд"
};
const SAUCES = new Set(Object.keys(G).filter(k=>/Sauce|mayonnaise|Cocktailmayo|dressing|Dip|Honig$/i.test(k)));
const ru = t => G[t] || "";

/* ============================================================
   ТИПЫ (каркас)
   ============================================================ */
const TYPES = [
 {id:"maki", ru:"Маки", de:"Makis", rice:70, pcs:8, c:"var(--green)",
  rule:"Нори <b>снаружи</b>, рис внутри. Начинка 1–3 продукта, соуса по умолчанию нет."},
 {id:"io", ru:"Inside-Out роллы", de:"Inside Outside Rolls", rice:130, pcs:8, c:"var(--green)",
  rule:"Рис <b>снаружи</b>, обваливается в Umhüllung: кунжут, масаго или шнитт-лук."},
 {id:"premium", ru:"Премиум-роллы", de:"Premium Rolls", rice:130, pcs:8, c:"var(--green)",
  rule:"Тот же Inside-Out, но с <b>топпингом сверху</b>: филе, соусы, лук."},
 {id:"yoko", ru:"Yoko Rolls", de:"Yoko Rolls", rice:120, pcs:5, c:"var(--amber)",
  rule:"<b>Жарятся в темпуре.</b> Сверху всегда Sweet Sauce + кунжут. В техкарте режут на 4, продаются по 5."},
 {id:"mini", ru:"Mini Yoko Rolls", de:"Mini Yoko Rolls", rice:70, pcs:8, c:"var(--amber)",
  rule:"Жареные, но <b>маленькие</b>. Начинка одна, к ним отдельный дип — обычно Cocktailmayo."},
 {id:"nigiri", ru:"Нигири и инари", de:"Nigiris / Inaris", rice:25, pcs:2, c:"var(--slate)",
  rule:"25 г — это <b>на один</b> нигири. Подаются всегда парой."},
 {id:"sommer", ru:"Летние роллы", de:"Sommerrollen", rice:35, pcs:2, c:"var(--yellow)",
  rule:"Рисовая бумага, <b>не жарятся</b>. 35 г риса на ролл, соус гость выбирает."},
 {id:"snack", frame:false, ru:"Снеки и десерты", de:"Snacks / Dessert", rice:0, pcs:0, c:"var(--red)",
  rule:"Количество и соус — у каждой позиции своё, смотри подпись. У большинства <b>дип на выбор гостя</b>."},
 {id:"soup", frame:false, ru:"Супы и салаты", de:"Suppen / Salate", rice:0, pcs:0, c:"var(--slate)",
  rule:"Супы заливаются <b>кипящим фондом</b> поверх начинки, уже разложенной в пиалу."},
 {id:"don", off:true, frame:false, ru:"Don Yoko", de:"Donburi и Bao Bun", rice:0, pcs:0, c:"var(--amber)",
  rule:"Донбури — рис с пак-чоем, глазуньей и топпингом. У <b>веганских</b> нет яйца и майонеза."},
 {id:"special", off:true, frame:false, ru:"Вок и супы", de:"Specials", rice:0, pcs:0, c:"var(--slate)",
  rule:"Техкарт на этот раздел в папке нет — только описания из карты. Граммовки уточняй у шефа."},
 {id:"bowl", ru:"Поке-боулы", de:"Yoko Poke Bowls", rice:250, pcs:1, c:"var(--amber)",
  rule:"250 г риса греется <b>1 мин в микроволновке</b>, потом выкладка. База у всех одинаковая."}
];

const RULES = [
 ["У всех <b>Yoko Rolls</b> сверху Sweet Sauce + кунжут",
  "Не учи топпинг для каждого — он один на всю группу. Отличается только начинка."],
 ["Внутри Yoko Roll — <b>Cocktailmayo</b>…",
  "…кроме <b>Chicken</b> и <b>Vegetaria</b>: там внутри Frischkäse. Это и есть всё исключение."],
 ["<b>Crunchy</b> в названии = Cranberry Teriyaki + кунжут сверху",
  "Crunchy Chicken / Sake / Veggie отличаются только начинкой. Исключение — Crunchy Spargel: там Hollandaise."],
 ["<b>Mini Yoko Roll</b> = одна начинка + дип",
  "Ни лука, ни овощей внутри. Только продукт, а соус идёт отдельным стаканчиком."],
 ["<b>Crispy / gebacken / Tempura</b> = идёт во фритюр",
  "Признак, что позиция требует жарки: планируй время, это не «собрал и отдал»."],
 ["<b>Salmon</b> ≠ <b>Sake</b>",
  "Sake — сырой лосось. Salmon — жареная кожа лосося (Lachshaut). Их путают чаще всего."],
 ["<b>Frischkäse</b> в карте Yoko — веганский",
  "Поэтому Fitness Roll и Maki Kappa считаются веганскими, хотя «сливочный сыр» звучит иначе."],
 ["<b>Поке-боул</b>: база всегда одна",
  "Эдамаме-огурец-морковь, салат, вакамэ, авокадо, арахис, лук, кунжут. Меняется только топпинг и соус."],
 ["<b>Соус «на выбор»</b> — у снеков и летних роллов",
  "Роллы идут с фиксированным соусом, снеки — почти всегда с дипом на выбор гостя."],
 ["Сет-меню = <b>уже известные роллы</b>",
  "Ни одного нового рецепта. Учить надо только раскладку в коробке и размер упаковки."]
];

const FAMILIES = [
 ["Лосось сырой", "Maki Sake", "Alaska Roll<br><span class='ru-s'>+ авокадо</span>", "Yoko Roll Lachs", "Mini Yoko Roll Sake"],
 ["Кожа лосося", "Maki Salmon", "Salmon Roll", "Yoko Roll Salmon", "Mini Yoko Roll Salmon"],
 ["Курица", "Maki Chicken", "Crispy Chicken Roll", "Yoko Roll Chicken", "Mini Yoko Roll Chicken"],
 ["Креветка", "Maki Ebi / Crispy Ebi", "Crispy Ebi Roll", "Yoko Roll Garnele", "Mini Yoko Roll Ebi"],
 ["Овощи", "Maki Avocado / Kappa", "Fitness Roll", "Yoko Roll Vegetaria", "Mini Yoko Roll Avocado"],
 ["Тофу", "Maki Tofu", "Tofu Roll", "—", "—"]
];

/* ============================================================
   БЛЮДА
   f = внутрь (по порядку выкладки), t = сверху, s = соус
   tag: veg / fish / meat / fried
   ============================================================ */
const D = [
/* --- MAKI, 70 г, 8 шт --- */
["maki","Maki Avocado","Маки авокадо",["Avocado"],[],[],["veg"]],
["maki","Maki California","Маки калифорния",["Avocado","Surimi"],[],[],["fish"],"сурими режется пополам"],
["maki","Maki Chicken","Маки с курицей",["Frischkäse","Frühlingszwiebeln","Hühnchen"],[],[],["meat"]],
["maki","Maki Crispy Ebi","Маки с креветкой в темпуре",["Cocktailmayo","Tempura Garnele"],[],[],["fish","fried"],"креветка режется пополам"],
["maki","Maki Ebi","Маки с креветкой",["Garnele"],[],[],["fish"]],
["maki","Maki Kappa","Маки с огурцом",["Sesam","Frischkäse","Gurke"],[],[],["veg"]],
["maki","Maki Rucola","Маки с рукколой",["Sesam","Frischkäse","Rucola"],[],[],["veg"]],
["maki","Maki Sake","Маки с лососем",["Lachs"],[],[],["fish"]],
["maki","Maki Sake Avocado","Маки лосось-авокадо",["Avocado","Lachs"],[],[],["fish"]],
["maki","Maki Sake Kappa","Маки лосось-огурец",["Gurke","Lachs"],[],[],["fish"]],
["maki","Maki Salmon","Маки с кожей лосося",["Lachshaut"],["Sesam"],["Sweet Sauce"],["fish","fried"]],
["maki","Maki Salmon Avocado","Маки кожа лосося-авокадо",["Lachshaut","Avocado"],[],[],["fish","fried"]],
["maki","Maki Tofu","Маки с тофу",["Frühlingszwiebeln","Cocktailmayo","frittierter Tofu"],[],[],["veg","fried"]],
["maki","Maki Wakame","Маки с вакамэ",["Algensalat","Möhrenstreifen"],["Sesam"],[],["veg"]],
["maki","Maki Tekka","Маки с тунцом",["Thunfisch"],[],[],["fish"]],
["maki","Maki Tuna","Маки с жареным тунцом",["gebratener Thunfisch","Frühlingszwiebeln"],[],["Yoko Cocktailmayonnaise"],["fish"]],
["maki","Maki Tempura Spargel","Маки с тайской спаржей в темпуре",["Thai-Spargel Tempura"],[],[],["veg","fried"]],
["maki","Maki Sake Spicy","Маки лосось острый",["Lachs","Frühlingszwiebeln"],[],["scharfe Sauce","Teriyaki Sauce"],["fish"]],

/* --- INSIDE OUTSIDE, 130 г, 8 шт --- */
["io","Alaska Roll","Аляска",["Avocado","Lachs"],[],[],["fish"]],
["io","California Roll","Калифорния",["Avocado","Surimi"],[],[],["fish"]],
["io","Crispy Chicken Roll","Хрустящий с курицей",["paniertes Hühnchen","Gurke","Frühlingszwiebeln","Cocktailmayo"],[],[],["meat","fried"]],
["io","Crispy Ebi Roll","Хрустящий с креветкой",["Cocktailmayo","Avocado","Rucola","Tempura Garnele"],[],[],["fish","fried"]],
["io","Fitness Roll","Фитнес",["Frischkäse","Avocado","Rucola","Möhre"],[],[],["veg"]],
["io","Garden Roll","Гарден",["Thai-Spargel Tempura","Avocado Sticks","Rucola"],["Frühlingszwiebeln"],["Yoko Cocktailmayonnaise","Sweet Sauce"],["veg","fried"]],
["io","Philadelphia Roll","Филадельфия",["Frischkäse","Gurke","Lachs"],[],[],["fish"]],
["io","Rucola Roll","Руккола",["Frischkäse","Rucola","Lachs"],[],[],["fish"]],
["io","Salmon Roll","Салмон",["Cocktailmayo","Gurke","Frühlingszwiebeln","Lachshaut"],[],[],["fish","fried"]],
["io","Tofu Roll","Тофу",["Cocktailmayo","Rucola","Gurke","Räuchertofu"],[],[],["veg","fried"]],
["io","Tekka Roll","Текка",["Thunfisch","Gurke","Frischkäse"],[],[],["fish"]],
["io","Veggie Spring Roll","Вегги спринг",["grüner Spargel","Hummus","Frühlingszwiebeln","Möhrenstreifen"],[],[],["veg","fried"]],

/* --- PREMIUM, 130 г, 8 шт --- */
["premium","Chicken Teriyaki Roll","Курица терияки",["Frühlingszwiebeln","Chicken","Avocado"],["Sesam"],["Teriyaki Sauce"],["meat"]],
["premium","Japanese fried Chicken Roll","Японская жареная курица",["Karaage","Eisbergsalat","Möhre"],["Schnittlauch"],["Yoko Cocktailmayonnaise"],["meat","fried"]],
["premium","Magic Garden Roll","Мэджик гарден",["Avocado Sticks","Thai-Spargel Tempura","Lachshaut"],["Lachsfilet","Frühlingszwiebeln"],["Yoko Cocktailmayonnaise","Sweet Sauce"],["fish","fried"]],
["premium","VIP Roll","VIP",["Tempuraspargel","Yoko Cocktailmayonnaise","Avocado"],["flambierter Lachs","Frühlingszwiebeln"],["Honig-Senf-Sauce","Sweet Sauce"],["fish","fried"]],
["premium","Guacamole Roll","Гуакамоле",["Lachs","Gurke","Frischkäse","Sesam"],["Guacamole"],["Yoko Cocktailmayonnaise"],["fish"]],
["premium","Magic Shrimp Deluxe","Мэджик шримп делюкс",["Tempura Garnele","Avocado"],["Granatapfelkerne","Schnittlauch"],["Yoko Cocktailmayonnaise"],["fish","fried"]],
["premium","Peanut Chicken Deluxe","Арахисовая курица делюкс",["Hühnchen","Avocado"],["Granatapfelkerne","Erdnüsse"],["Erdnusssauce"],["meat","fried"]],

/* --- YOKO ROLLS, 120 г --- */
["yoko","Yoko Roll Chicken","Yoko ролл с курицей",["Frischkäse","Gurke","Frühlingszwiebeln","Hühnchen"],["Sesam"],["Sweet Sauce"],["meat","fried","deepfried"]],
["yoko","Yoko Roll Garnele","Yoko ролл с креветкой",["Cocktailmayo","Gurke","Frühlingszwiebeln","Garnele"],["Sesam"],["Sweet Sauce"],["fish","fried","deepfried"]],
["yoko","Yoko Roll Lachs","Yoko ролл с лососем",["Cocktailmayo","Gurke","Avocado","Lachs"],["Sesam"],["Sweet Sauce"],["fish","fried","deepfried"]],
["yoko","Yoko Roll Salmon","Yoko ролл с кожей лосося",["Cocktailmayo","Gurke","Frühlingszwiebeln","Lachshaut"],["Sesam"],["Sweet Sauce"],["fish","fried","deepfried"]],
["yoko","Yoko Roll Vegetaria","Yoko ролл вегетарианский",["Frischkäse","Sesam","Gurke","Avocado","Möhre","Frühlingszwiebeln"],["Sesam"],["Sweet Sauce"],["veg","fried","deepfried"]],
["yoko","Yoko Roll Ente","Yoko ролл с уткой",["Entenbrust","Gurke","Rotkohl","Frühlingszwiebeln","Frischkäse"],["Sesam"],["Sweet Sauce"],["meat","fried","deepfried"]],
["yoko","Yoko Roll Tuna","Yoko ролл с тунцом",["gebratener Thunfisch","Frühlingszwiebeln"],["Sesam"],["Yoko Cocktailmayonnaise"],["fish","fried","deepfried"]],
["yoko","Yoko Roll Peanut Chicken","Yoko ролл арахисовый",["Chicken","Gurke","Frühlingszwiebeln","Frischkäse"],[],["Erdnusssauce"],["meat","fried","deepfried"]],
["yoko","Yoko Roll Cranberry Chicken","Yoko ролл клюквенный",["Chicken","Gurke","Frühlingszwiebeln","Frischkäse"],[],["Cranberry Teriyaki Sauce"],["meat","fried","deepfried"]],
["yoko","Yoko Roll Chicken Guacamole","Yoko ролл курица-гуакамоле",["Chicken","Gurke","Frühlingszwiebeln","Frischkäse"],["Guacamole"],["Sweet Sauce"],["meat","fried","deepfried"]],
["yoko","Korean Crunch Roll","Корейский кранч",["Korean fried Chicken","Asian Coleslaw","Gurke","Cocktailmayo"],["Sesam"],["Korean BBQ Sauce"],["meat","fried","deepfried"]],
["yoko","Crunchy Chicken Roll","Кранчи с курицей",["Hühnchen","Gurke","Frühlingszwiebeln","Cocktailmayo"],["Sesam"],["Cranberry Teriyaki Sauce"],["meat","fried","deepfried"]],
["yoko","Crunchy Sake Roll","Кранчи с лососем",["Lachs","Avocado","Cocktailmayo"],["Sesam"],["Cranberry Teriyaki Sauce"],["fish","fried","deepfried"]],
["yoko","Crunchy Veggie Roll","Кранчи вегетарианский",["Rucola","Frischkäse","Möhre","Avocado","Cocktailmayo"],["Sesam"],["Cranberry Teriyaki Sauce"],["veg","fried","deepfried"]],
["yoko","Crunchy Spargel Roll","Кранчи со спаржей",["Hühnchen","Frischkäse","grüner Spargel"],["Schnittlauch"],["Sauce Hollandaise"],["meat","fried","deepfried"]],
["yoko","Sushi Burger Sake","Суши-бургер с лососем",["Lachs","Avocado","Cocktailmayo"],["Frühlingszwiebeln"],["Sweet Sauce"],["fish"]],
["yoko","Sushi Burger Chicken","Суши-бургер с курицей",["Hühnchen","Avocado","Möhrenstreifen","Gurke","Cocktailmayo"],["Frühlingszwiebeln"],["Sweet Sauce"],["meat"]],
["yoko","Sushi Burger Veggie","Суши-бургер вегетарианский",["Avocado","Rucola","Möhrenstreifen","Cocktailmayo"],["Frühlingszwiebeln"],["Sweet Sauce"],["veg"]],

/* --- MINI YOKO, 8 шт --- */
["mini","Mini Yoko Roll Avocado","Мини с авокадо",["Avocado"],[],["Yoko Cocktailmayonnaise"],["veg","fried","deepfried"]],
["mini","Mini Yoko Roll Sake","Мини с лососем",["Lachs"],[],["Yoko Cocktailmayonnaise"],["fish","fried","deepfried"]],
["mini","Mini Yoko Roll Salmon","Мини с кожей лосося",["Lachshaut"],[],["Yoko Cocktailmayonnaise"],["fish","fried","deepfried"]],
["mini","Mini Yoko Roll Ebi","Мини с креветкой",["Garnele"],[],["Yoko Cocktailmayonnaise"],["fish","fried","deepfried"]],
["mini","Mini Yoko Roll Chicken","Мини с курицей",["Hühnchen","Frühlingszwiebeln","Frischkäse"],[],["Yoko Cocktailmayonnaise"],["meat","fried","deepfried"]],

/* --- NIGIRI / INARI, 25 г, 2 шт --- */
["nigiri","Nigiri Sake","Нигири с лососем",["Lachs"],[],[],["fish"]],
["nigiri","Nigiri Sake Flamed","Нигири фламбированный",["flambierter Lachs"],["Frühlingszwiebeln","Sesam"],["Sweet Sauce"],["fish"]],
["nigiri","Nigiri Ebi","Нигири с креветкой",["Garnele"],[],[],["fish"]],
["nigiri","Nigiri Maguro","Нигири с тунцом",["Thunfisch"],[],[],["fish"]],
["nigiri","Nigiri Inari","Инари",["Reis"],["Sesam"],["Sweet Sauce"],["veg"],"на сайте указан Teriyaki — уточни"],
["nigiri","Inari Taco Vegan","Инари тако веган",["Avocadowürfel","Karotten","Frühlingszwiebeln"],["Sesam"],["Sweet Sauce"],["veg"]],
["nigiri","Inari Taco Sake","Инари тако с лососем",["Lachswürfel","Avocadowürfel","Karotten","Frühlingszwiebeln"],["Sesam"],["Sweet Sauce"],["fish"],"в техкарте подписан как Nigiri Sake Flamed — опечатка"],
["nigiri","Lachs Sashimi","Сашими из лосося",["Lachs","Salatmix"],[],[],["fish"],"8 кусков на салатной подушке"],

/* --- SOMMERROLLEN, 2 шт --- */
["sommer","Sommerrolle Natur","Летний ролл натур",["Reispapier","Salatmix","Reis","Thai-Pesto","Rucola","Cocktailtomaten"],[],[],["veg"],"50 г салата · 35 г риса · 5 г песто · 10 г рукколы · 2 половинки черри"],
["sommer","Sommerrolle Chicken","Летний ролл с курицей",["Reispapier","Salatmix","Reis","Thai-Pesto","Hühnchen"],[],[],["meat"],"70 г салата · 35 г риса · 5 г песто · 2 полоски курицы"],
["sommer","Sommerrolle Black Tiger Garnele","Летний ролл с креветкой",["Reispapier","Salatmix","Reis","Thai-Pesto","Garnele"],[],[],["fish"],"50 г салата · 35 г риса · 5 г песто · 2 половинки креветки"],
["sommer","Sommerrolle Peanut Chicken","Летний ролл арахисовый",["Reispapier","Salatmix","Reis","Thai-Pesto","Hühnchen"],[],["Erdnusssauce"],["meat","fried"]],

/* --- POKE BOWLS, 250 г риса --- */
["bowl","Yoko Poke Bowl Lachs","Боул с лососем",["Lachs"],[],[],["fish"]],
["bowl","Yoko Poke Bowl Sake Teriyaki","Боул лосось терияки",["Lachs"],[],["Teriyaki Sauce"],["fish","fried"]],
["bowl","Yoko Poke Bowl Guacamole Lachs","Боул лосось-гуакамоле",["Lachs","Guacamole"],[],[],["fish"]],
["bowl","Yoko Poke Bowl Chicken","Боул с курицей",["Hühnchen"],[],[],["meat","fried"]],
["bowl","Yoko Poke Bowl Chicken Teriyaki","Боул курица терияки",["Hühnchen"],[],["Teriyaki Sauce"],["meat","fried"]],
["bowl","Yoko Poke Bowl Chicken Balls","Боул с куриными шариками",["Hühnchen"],[],[],["meat","fried"],"6 шариков"],
["bowl","Yoko Poke Bowl Japanese fried Chicken","Боул с карааге",["Karaage"],[],[],["meat","fried"],"4–5 штук"],
["bowl","Yoko Poke Bowl Gyoza Chicken","Боул с гёдза",["Hühnchen"],[],[],["meat","fried"],"4 гёдза"],
["bowl","Yoko Poke Bowl Crispy Ebi Sticks","Боул с креветкой в темпуре",["Tempura Garnele"],[],[],["fish","fried"],"4 палочки"],
["bowl","Yoko Poke Bowl Ente","Боул с уткой",["Entenbrust"],[],[],["meat","fried"]],
["bowl","Yoko Poke Bowl Tofu","Боул с тофу",["frittierter Tofu"],[],[],["veg","fried"]],
["bowl","Yoko Poke Bowl Veggie","Боул вегетарианский",["Avocado"],[],[],["veg"],"двойная порция авокадо"],
["bowl","Yoko Poke Bowl Spargel Hähnchen","Боул спаржа-курица",["grüner Spargel","Hühnchen"],[],["Sauce Hollandaise"],["meat","fried"]],
["bowl","Yoko Poke Bowl Peanut Chicken","Боул арахисовый",["Hühnchen"],[],["Erdnusssauce"],["meat","fried"]],

/* --- SNACKS / DESSERT --- */
["snack","Crispy Ebi Sticks","Креветки в темпуре",["Tempura Garnele"],[],["Yoko Cocktailmayonnaise"],["fish","fried"],"6 шт · соус фиксированный"],
["snack","Avocado Sticks","Палочки авокадо",["gebackene Avocado"],[],[],["veg","fried"],"4 шт · дип на выбор"],
["snack","Chicken Nuggets (vegan)","Наггетсы веганские",["vegane Nuggets"],[],[],["veg","fried"],"4 шт · дип на выбор"],
["snack","Mini Frühlingsrollen","Мини спринг-роллы",["Frühlingsrolle"],[],[],["veg","fried"],"5 шт · дип на выбор"],
["snack","Mini Frühlingsrollen Vegetaria","Мини спринг-роллы вегетарианские",["Frühlingsrolle"],[],[],["veg","fried"],"5 шт · дип на выбор"],
["snack","Gyoza Chicken","Гёдза с курицей",["Hähnchenfüllung"],[],["Sweet Sauce"],["meat","fried"],"5 шт · плюс дип на выбор"],
["snack","Double Baked Gyoza Chicken","Гёдза двойной обжарки",["Hähnchenfüllung"],[],[],["meat","fried"],"5 шт · дип на выбор"],
["snack","Chicken Teriyaki Spieße","Куриные шпажки терияки",["Hähnchenbrustspieße"],[],[],["meat"],"3 шт · маринованные · дип на выбор"],
["snack","Japanese fried Chicken Box","Курица карааге",["Karaage"],[],["Sweet Chili Sauce"],["meat","fried"],"5 шт · соус фиксированный"],
["snack","Korean fried Chicken - 5 Stück","Корейская курица, 5 шт",["Korean fried Chicken"],["Sesam"],["Korean BBQ Sauce"],["meat","fried"],"5 шт"],
["snack","Korean fried Chicken - 10 Stück","Корейская курица, 10 шт",["Korean fried Chicken"],["Sesam"],["Korean BBQ Sauce"],["meat","fried"],"10 шт"],
["snack","Bao Bun Chicken","Бао с курицей",["Bao Teigtasche","Hähnchen","Asian Coleslaw","Möhrenstreifen","Frühlingszwiebeln"],["Schnittlauch","Sesam"],["Sweet Sauce","Yoko Cocktailmayonnaise"],["meat","fried"],"1 шт"],
["snack","Bao Bun Sake Avocado","Бао с лососем и авокадо",["Bao Teigtasche","Lachs","Avocado","Asian Coleslaw","Möhrenstreifen","Frühlingszwiebeln"],["Schnittlauch","Sesam"],["Sweet Sauce","Yoko Cocktailmayonnaise"],["fish"],"1 шт · лосось жареный"],
["snack","Bao Bun Veggie","Бао вегетарианский",["Bao Teigtasche","Avocado","Asian Coleslaw","Möhrenstreifen","Frühlingszwiebeln"],["Schnittlauch","Sesam"],["Sweet Sauce","Yoko Cocktailmayonnaise"],["veg"],"1 шт"],
["snack","Bao Bun Korean fried Chicken","Бао с корейской курицей",["Bao Teigtasche","Korean fried Chicken","Asian Coleslaw","Möhrenstreifen","Frühlingszwiebeln"],["Schnittlauch","Sesam"],["Korean BBQ Sauce","Yoko Cocktailmayonnaise"],["meat","fried"],"1 шт"],
["snack","Snackbox","Снек-бокс",["Chicken Teriyaki Spieße","Gyoza Chicken","Crispy Ebi Sticks","Avocado Sticks"],[],[],["meat","fried"],"11 шт: 2 шпажки · 3 гёдза · 3 креветки · 3 авокадо · соус на выбор"],
["snack","Snackbox Veggie","Снек-бокс вегетарианский",["Edamame","Frühlingsrolle","Avocado Sticks"],[],[],["veg","fried"],"9 шт: порция эдамаме · 5 спринг-роллов · 3 авокадо · соус на выбор"],
["snack","Snackbox XL","Снек-бокс XL",["Chicken Teriyaki Spieße","Gyoza Chicken","Crispy Ebi Sticks","Avocado Sticks"],[],[],["meat","fried"],"20 шт: по 5 каждого · соус на выбор"],
["snack","Gyoza Apfel","Гёдза с яблоком",["Apfelfüllung"],[],["Vanille Sauce"],["veg","fried"],"5 шт · десерт"],
["snack","Gebackene Banane","Жареный банан",["Banane"],[],["Honig"],["veg","fried"],"десерт"],
["snack","Mochi Kokos","Моти кокос",["Kokoscreme"],[],[],["veg"],"2 шт · рисовый десерт"],
["snack","Mochi Mango","Моти манго",["Mangocreme"],[],[],["veg"],"2 шт · рисовый десерт, крем веганский"],
["snack","Mochi Matcha Latte","Моти матча",["Matchacreme"],[],[],["veg"],"2 шт · рисовый десерт"],
["snack","Cheesecake","Чизкейк",["Käseküchlein","weiße Schokolade"],[],[],["veg"],"десерт"],
["snack","Muffin","Маффин",["Milchschokolade"],[],[],["veg"],"десерт"],
["snack","Donut","Пончик",["Milka & Daim"],[],[],["veg"],"десерт"],

/* --- SUPPEN / SALATE --- */
["soup","Miso Suppe","Мисо-суп",["Miso-Fond","Tofu","Seetang","Frühlingszwiebeln"],[],[],["veg"],"2 половника фонда · заливается кипящим"],
["soup","Lachs Suppe","Суп с лососем",["Miso-Fond","Lachsfiletstücke","Seetang","Frühlingszwiebeln"],[],[],["fish"],"2 половника фонда · заливается кипящим"],
["soup","Algensalat","Салат вакамэ",["Algensalat","Möhre"],["Sesam"],["Sesamdressing"],["veg"],"120 г на салатном листе"],
["soup","Edamame Salat","Эдамаме",["Sojabohnen","Meersalz"],[],[],["veg"],"стручки соевых бобов"],
["soup","Edamame Salat mit Knoblauchbutter","Эдамаме с чесночным маслом",["Sojabohnen","Meersalz","Knoblauchbutter"],[],[],["veg"]],

/* --- DON YOKO --- */
["don","Donburi Sake","Донбури с лососем",["Reis","Lachs","Pak Choi mit Tomate","Spiegelei","Frühlingszwiebeln"],[],["Yoko Cocktailmayonnaise","Cranberry Teriyaki Sauce"],["fish"]],
["don","Donburi Teriyaki Sake","Донбури лосось терияки",["Reis","Lachs","Pak Choi mit Tomate","Spiegelei","Frühlingszwiebeln"],[],["Teriyaki Sauce","Yoko Cocktailmayonnaise","Cranberry Teriyaki Sauce"],["fish","fried"]],
["don","Donburi Chicken Schnitzel","Донбури с куриным шницелем",["Reis","Hähnchen","Pak Choi mit Tomate","Spiegelei","Frühlingszwiebeln"],[],["Yoko Cocktailmayonnaise","Cranberry Teriyaki Sauce"],["meat","fried"]],
["don","Donburi Karaage","Донбури с карааге",["Reis","Karaage","Pak Choi mit Tomate","Spiegelei","Frühlingszwiebeln"],[],["Yoko Cocktailmayonnaise","Cranberry Teriyaki Sauce"],["meat","fried"]],
["don","Donburi Teriyaki Sticks","Донбури с куриными шпажками",["Reis","Hähnchenbrustspieße","Pak Choi mit Tomate","Spiegelei","Frühlingszwiebeln"],[],["Yoko Cocktailmayonnaise","Cranberry Teriyaki Sauce"],["meat"]],
["don","Donburi Wan-Tan","Донбури с вонтонами",["Reis","Wan-Tan","Pak Choi mit Tomate","Spiegelei","Frühlingszwiebeln"],[],["Yoko Cocktailmayonnaise","Cranberry Teriyaki Sauce"],["meat","fried"],"вонтоны с куриной начинкой"],
["don","Donburi Crispy Ebi Garnelen","Донбури с креветками",["Reis","Garnele","Pak Choi mit Tomate","Spiegelei","Frühlingszwiebeln"],[],["Yoko Cocktailmayonnaise","Cranberry Teriyaki Sauce"],["fish","fried"]],
["don","Donburi Duck","Донбури с уткой",["Reis","Entenbrust","Pak Choi mit Tomate","Spiegelei","Frühlingszwiebeln"],[],["Yoko Cocktailmayonnaise","Cranberry Teriyaki Sauce"],["meat","fried"]],
["don","Donburi Spargel Chicken","Донбури со спаржей и курицей",["Reis","Hähnchen","grüner Spargel","Pak Choi mit Tomate","Spiegelei","Frühlingszwiebeln"],[],["Yoko Cocktailmayonnaise","Sauce Hollandaise"],["meat","fried"],"единственный донбури с голландезом"],
["don","Donburi Tofu (vegan)","Донбури с тофу",["Reis","frittierter Tofu","Pak Choi mit Tomate","Frühlingszwiebeln"],[],["Cranberry Teriyaki Sauce"],["veg","fried"],"без яйца и майонеза"],
["don","Donburi geb. veganem Fischfilet (vegan)","Донбури с веганской рыбой",["Reis","veganer Backfisch","Pak Choi mit Tomate","Frühlingszwiebeln"],[],["Cranberry Teriyaki Sauce"],["veg","fried"],"без яйца и майонеза; на фото с сайта яйцо есть — в описании его нет"],
["don","Pak Choi mit Tomaten und Soja Sauce","Пак-чой с томатами",["Pak Choi","Tomate"],[],["Sojasauce"],["veg"],"гарнир"],

/* --- SPECIALS (вок) --- */
["special","Chop Suey","Чоп суи",["Reis","Gemüse"],[],["Braune Sauce"],["veg"]],
["special","Erdnussgericht","Блюдо с арахисовым соусом",["Reis","Gemüse"],[],["Erdnusssauce"],["veg"]],
["special","Mango Chutney","Манго чатни",["Reis","Gemüse"],[],["Mangosauce"],["veg"]],
["special","Rotes Thaicurry","Красное тайское карри",["Gemüse"],[],["Rotes Thaicurry"],["veg"]],
["special","Gelbes Thaicurry","Жёлтое тайское карри",["Gemüse"],[],["Gelbes Thaicurry"],["veg"]],
["special","Gebratener Reis","Жареный рис",["Eiereis","Gemüse"],[],["Sojasauce"],["veg"]],
["special","Gebratene Udon Nudeln","Жареная лапша удон",["Udon Nudeln","Gemüse"],[],["Sojasauce"],["veg"]],
["special","Gebratene Nudeln","Жареная лапша",["Udon Nudeln","Gemüse"],[],["Sojasauce"],["veg"],"в карте описан так же, как Udon"],
["special","Yoko Noodles","Yoko Noodles",["Udon Nudeln","Gemüse"],[],["Sojasauce"],["veg"],"в карте описан так же, как Udon"],
["special","Glasnudelsalat Natur","Салат из стеклянной лапши",["Glasnudeln"],[],[],["veg"],"состав в карте не указан"],
["special","Glasnudelsalat Chicken","Салат из стеклянной лапши с курицей",["Glasnudeln","Hähnchen"],[],[],["meat"],"состав в карте не указан"],
["special","Glasnudelsalat Garnele","Салат из стеклянной лапши с креветкой",["Glasnudeln","Garnele"],[],[],["fish"],"состав в карте не указан"],
["special","Kokos Cremesuppe","Кокосовый крем-суп",[],[],[],["veg"],"состав в карте не указан"],
["special","Sauer-Scharf-Suppe","Кисло-острый суп",[],[],[],["veg"],"состав в карте не указан"],
["special","Wan-Tan Suppe","Суп с вонтонами",["Wan-Tan"],[],[],["meat"],"состав в карте не указан"],
["special","Pikante Gemüseuppe","Острый овощной суп",["Gemüse"],[],[],["veg"],"состав в карте не указан"]
];

/* ============================================================
   СКРЫТО С САЙТА — но НЕ удалено из базы.
   В филиале этих позиций сейчас нет. Чтобы вернуть блюдо,
   убери его из HIDDEN; чтобы вернуть целый раздел — сними
   off:true у нужного типа в TYPES.
   ============================================================ */
const HIDDEN = new Set([
  /* из десертов остался только жареный банан */
  "Gyoza Apfel",
  "Mochi Kokos",
  "Mochi Mango",
  "Mochi Matcha Latte",
  "Cheesecake",
  "Muffin",
  "Donut"
]);

const CATS = {
 maki:{short:"Makis", ru:"Makis",          sub:"Маки",              cols:3, band:"--green-band", ink:"--green-ink"},
 io:{short:"Inside-Out", ru:"Inside Outside Rolls", sub:"Рис снаружи",    cols:4, band:"--green-band", ink:"--green-ink"},
 premium:{short:"Premium", ru:"Premium Rolls", sub:"С топпингом",      cols:3, band:"--green-band", ink:"--green-ink"},
 yoko:{short:"Yoko Rolls", ru:"Yoko Rolls",      sub:"Жареные",           cols:3, band:"--amber-band", ink:"--amber-ink"},
 mini:{short:"Mini Yoko", ru:"Mini Yoko Rolls", sub:"Жареные, маленькие", cols:3, band:"--amber-band", ink:"--amber-ink"},
 nigiri:{short:"Нигири", ru:"Nigiris / Inaris", sub:"Парами",          cols:3, band:"--slate-band", ink:"--slate-ink"},
 sommer:{short:"Sommerrollen", ru:"Sommerrollen",  sub:"Рисовая бумага",     cols:3, band:"--yellow-band", ink:"--yellow-ink"},
 snack:{short:"Снеки", ru:"Snacks / Dessert", sub:"Штуки и дип — в подписи", cols:3, band:"--red-soft", ink:"--red"},
 soup:{short:"Супы", ru:"Suppen / Salate", sub:"Порциями", cols:3, band:"--slate-band", ink:"--slate-ink"},
 don:{short:"Don Yoko", ru:"Don Yoko", sub:"Донбури и бао", cols:3, band:"--amber-band", ink:"--amber-ink"},
 special:{short:"Вок", ru:"Specials", sub:"Без техкарт", cols:3, band:"--slate-band", ink:"--slate-ink"},
 bowl:{short:"Боулы", ru:"Yoko Poke Bowls", sub:"База одинаковая",    cols:3, band:"--amber-band", ink:"--amber-ink"}
};

const BOWL_BASE = ["Edamame","Gurke","Möhre","Frühlingszwiebeln","Algensalat","Salatmix","Avocado","Erdnüsse","Sesam"];

/* ============================================================
   СОУСЫ / ДИПЫ
   ============================================================ */
const SAUCE_TABLE = [
 ["Sweet Sauce","сладкий соус унаги, тёмный и густой","Верх всех <b>Yoko Rolls</b>, Maki Salmon, Nigiri Sake Flamed, инари, Garden/Magic Garden/VIP, суши-бургеры. Основной соус карты."],
 ["Yoko Cocktailmayonnaise","розовый майонез, делается на месте","Внутрь: Salmon Roll, Crispy Ebi, Crispy Chicken, Tofu Roll, все Yoko Rolls кроме Chicken и Vegetaria. Дип ко всем Mini Yoko."],
 ["Sweet Chili Sauce","сладкий чили, прозрачный и острый","Альтернативная версия Yoko и Mini Yoko роллов (позиции «mit Sweet Chili Sauce»), Japanese Fried Chicken Box, дип к снекам."],
 ["Teriyaki Sauce","терияки, солёно-сладкий","Chicken Teriyaki Roll, боулы терияки, маринад для курицы и лосося терияки."],
 ["Cranberry Teriyaki Sauce","клюквенный терияки","Все <b>Crunchy</b>-роллы, Yoko Roll Cranberry Chicken, все Donburi. Дип в семейных сетах."],
 ["Erdnusssauce","арахисовый, густой","Peanut Chicken Deluxe, Yoko Roll Peanut Chicken, Peanut Pokal Menü, дип к летним роллам и снекам."],
 ["Hoi Sin Sauce","хойсин, тёмный и сладкий","Только как дип на выбор: летние роллы, гёдза, мини-спринг-роллы, куриные шпажки."],
 ["Honig-Senf-Sauce","медово-горчичный","<b>VIP Roll</b> — единственный ролл. Ещё вариант соуса к боулу."],
 ["Spicy Mango Sauce","острый манговый","Crispy Ebi Roll в версии Spicy Mango. Вариант к боулу."],
 ["Sauce Hollandaise","голландез, сливочный","Crunchy Spargel Roll, Donburi Spargel Chicken, боул со спаржей. Всегда там, где зелёная спаржа."],
 ["Korean BBQ Sauce","корейский барбекю, острый","Korean fried Chicken, Korean Crunch Roll, Bao Bun Korean."],
 ["Sojasauce","соевый","Не для роллов — идёт в коробку стаканчиком 50 мл к сет-меню."],
 ["Yoko Wasabi Mayonnaise","васаби-майонез","Вариант соуса к поке-боулу."],
 ["Minz Dip","мятный дип","Вариант соуса к поке-боулу."],
 ["Limonendressing","лаймовый дрессинг с чили и чесноком","Дип к летним роллам. Делается на месте, настаивается сутки."]
];

const DIPS = [
 ["Sommerrollen","2 шт","Cocktailmayo · Sweet Chili · Hoi Sin · Limonendressing · Erdnusssauce"],
 ["Mini Frühlingsrollen","5 шт","Cocktailmayo · Sweet Sauce · Erdnusssauce · Sweet Chili · Hoi Sin"],
 ["Gyoza","5 шт","Cocktailmayo · Sweet Sauce · Erdnusssauce · Sweet Chili · Hoi Sin"],
 ["Chicken Teriyaki Sticks","3–4 шт","Cocktailmayo · Sweet Sauce · Erdnusssauce · Sweet Chili · Hoi Sin"],
 ["Crispy Ebi Sticks","6 шт","Только Yoko Cocktailmayonnaise — без выбора"],
 ["Japanese Fried Chicken Box","5 шт","Только Sweet Chili Sauce — без выбора"],
 ["Big Roll","4 шт","Соевый 50 мл + васаби 25 мл + имбирь 25 мл"],
 ["Poke Bowl","—","Sweet+Honig-Senf · Sweet+Wasabi-Mayo · Sweet+Spicy Mango · Minz Dip · Cranberry Teriyaki"]
];

/* ============================================================
   ЗАГОТОВКИ
   ============================================================ */
const PREPS_BASE = [
 {ru:"Уксусная смесь",de:"Essigmischung",items:[["5 л","уксус"],["3450 г","сахар"],["1350 г","соль"]],
  steps:["Мешать энергично, пока не останется <b>ни одного осадка</b> на дне."]},
 {ru:"Варка риса",de:"Reis kochen",items:[["3 кг","рис"],["600 мл","готовой уксусной смеси"]],
  steps:["Отвесить 3 кг риса, промыть под проточной водой <b>3 раза</b>.","Замочить минимум на <b>30 минут</b>.","В рисоварку, залить водой до отметки <b>20 cup</b>.","Варить <b>1 час</b>.","Заправить 600 мл уксусной смеси."]},
 {ru:"Мисо-фонд",de:"Miso-Fond",items:[["8 л","вода"],["50 г","сахар"],["30 г","бонито-порошок"],["500 г","мисо-паста"]],
  steps:["Взбить венчиком до однородности и коротко довести до кипения."]},
 {ru:"Тесто и панировка темпура",de:"Tempura-Teig / Panade",items:[["2 л","холодная вода"],["1,5 кг","мука темпура"]],
  steps:["Венчиком до <b>густого текучего</b> теста.","Панировка: кокосовая стружка и панко <b>1:1</b>."]},
 {ru:"Салатная смесь",de:"Salatmix (650 г)",items:[["240 г","айсберг тонкой нарезки"],["160 г","готовая салатная смесь"],["100 г","огурец брусочками"],["100 г","соевые ростки"],["50 г","морковь тонко"]]},
 {ru:"Мисо-суп",de:"Miso-Suppe",items:[["2 половника","мисо-фонд"],["7–10","кубиков тофу"],["1 ч. л.","водоросли"],["1 ч. л.","зелёный лук"]],
  steps:["Начинку — в пиалу, залить <b>кипящим</b> фондом."]},
 {ru:"Суп с лососем",de:"Lachssuppe",items:[["2 половника","фонд"],["7–10","кубиков лосося"],["1 ч. л.","водоросли"],["1 ч. л.","зелёный лук"]],
  steps:["Так же: начинка в пиалу, сверху кипящий фонд."]},
 {ru:"Салат вакамэ",de:"Algensalat",items:[["120 г","вакамэ"]],
  steps:["Лист салата в пиалу, сверху 120 г вакамэ, украсить морковью и кунжутом."]}
];

const PREPS_SAUCE = [
 {ru:"Фирменный майонез Yoko",de:"Yoko Cocktailmayonnaise",items:[["1 кг","майонез"],["45 г","чили-соус"],["25 г","Sweet Sauce"],["25 г","мёд"],["1 ч. л.","чесночный порошок"]],
  steps:["Взбить венчиком в большой ёмкости, переложить в сквиз-бутылки."]},
 {ru:"Тайское песто",de:"Thai-Basilikum-Pesto",items:[["70 г","тайский базилик, листья и мягкие стебли"],["3","зубчика чеснока"],["100 мл","растительное масло"],["щепотка","соль и перец"]],
  steps:["Пробить блендером, хранить в сквиз-бутылке в холодильнике."],warn:"Масло — <b>только не фритюрное</b>."},
 {ru:"Лаймовый дрессинг",de:"Limonendressing",items:[["6 л","вода"],["1200 г","сахар"],["1600 мл","рыбный соус"],["16","зубчиков чеснока, мелко"],["12","красных перцев чили без семян"],["16","лаймов — сок"]],
  steps:["Вскипятить, варить <b>5 минут</b>, размешать до полного растворения сахара.","Снять с огня, добавить сок лаймов, размешать.","Процедить через сито — <b>ни кусочка</b> чили или чеснока остаться не должно.","Настоять сутки в холодильнике."],warn:"Готовится строго <b>по весам</b>."},
 {ru:"Манго-ласси",de:"Mango-Lassi",items:[["500 мл","манговый сок"],["500 г","натуральный йогурт 3,5%"],["500 г","манговое пюре"],["½","лайма"]],
  steps:["Взбить венчиком."]}
];

const PREPS_FOOD = [
 {ru:"Кожа лосося",de:"Lachshaut",items:[["2 кг","кожи — примерно с 3 лососей"],["40 г","приправа: бонито и белый перец 1:1"]],
  steps:["Очищенную от чешуи кожу нарезать полосами <b>~10 см</b>.","Приправить, разложить порционно и заморозить.","После разморозки жарить во фритюре <b>до хрустящей корочки</b>."]},
 {ru:"Курица — маринад",de:"Chicken Marinade",items:[["5 кг","куриное филе"],["400 г","Sweet Chili Sauce"],["300 г","масло"],["100 г","чили-соус"]],
  steps:["Разморозить, промыть, обсушить бумагой, уложить <b>целиком</b> в контейнер с крышкой.","Замариновать и оставить в холодильнике <b>на ночь</b>."]},
 {ru:"Курица — жарка",de:"Chicken Zubereitung",items:[],
  steps:["Разогреть сковороду, влить масло.","Жарить на среднем огне <b>по 5 минут</b> с каждой стороны.","Класть максимум <b>4–5 филе</b>, чтобы не лежали внахлёст.","Готово при внутренней температуре <b>70 °C</b>.","Сразу снять со сковороды и убрать в контейнер в холодильник."],
  warn:"Если оставить на сковороде — <b>дойдёт и станет сухой</b>."},
 {ru:"Хрустящая курица",de:"Crispy Chicken",items:[],
  steps:["Готовое жареное филе <b>целиком</b> обмакнуть в темпуру.","Обвалять в смеси панко и кокосовой стружки <b>1:1</b>.","Жарить во фритюре до золотистого."],
  warn:"Перед нарезкой дать <b>немного остыть</b>, иначе панировка отвалится."},
 {ru:"Креветки",de:"Garnelen",items:[],
  steps:["Размороженные промыть проточной водой, откинуть на дуршлаг.","Разогреть большую сковороду с маслом.","Обжарить <b>по 3 минуты</b> с каждой стороны на сильном огне.","Соль и перец."]},
 {ru:"Поке-боул: эталон",de:"Lachs Bowl (Bowl Beispiel)",
  items:[["250 г","рис — 1 мин в микроволновке"],["25 г","огурец"],["20 г","эдамаме, только бобы"],["10 г","зелёный лук"],["10 г","морковь"],["10 г","Sweet Sauce"],["30 г","авокадо кубиком"],["50 г","вакамэ"],["25 г","салатная смесь"],["75 г","лосось + 10 г Sweet Sauce"],["15 г","арахис и 2 г кунжута сверху"]],
  steps:["Овощной микс = 75 г маринованных овощей.","Соус на выбор: 15+15 Sweet/Honig-Senf · Sweet/Wasabi-Mayo · Sweet/Spicy Mango · 30 г Minz Dip · 30 г Cranberry Teriyaki."]}
];

/* ============================================================
   МЕНЮ И КОРОБКИ
   ============================================================ */
/* ============================================================
   СЕТ-МЕНЮ: состав, упаковка, комплект в одной карточке
   items: [штук, немецкое название, обсыпка]
   Название должно совпадать с полем de в D — по нему берётся
   состав и признак «жарится целиком».
   ============================================================ */
const SET_EXTRA = {
  "Miso Suppe":       { ru: "мисо-суп", fried: false },
  "Algensalat":       { ru: "салат вакамэ", fried: false },
  "Crispy Ebi Sticks":{ ru: "креветки в темпуре", fried: true }
};

const MENUCARDS = [
 {name:"Maki Menü", pcs:24, box:"M", kit:"васаби · имбирь · соевый extra",
  items:[[8,"Maki Sake"],[8,"Maki Kappa"],[8,"Maki Crispy Ebi"]]},

 {name:"Westcoast Menü", pcs:24, box:"L", kit:"васаби · имбирь · соевый",
  items:[[8,"California Roll","кунжут"],[8,"Alaska Roll","шнитт-лук"],[8,"Crispy Ebi Roll","масаго"]]},

 {name:"Chicken Menü", pcs:21, box:"M", kit:"васаби · имбирь · Sweet Sauce",
  note:"Sweet Sauce и кунжут сверху",
  items:[[8,"Maki Chicken"],[5,"Yoko Roll Chicken"],[8,"Chicken Teriyaki Roll"]]},

 {name:"Yoko Stars Menü", pcs:21, box:"M", kit:"васаби · имбирь · соевый",
  note:"Sweet Sauce и кунжут сверху",
  items:[[8,"Maki Sake"],[5,"Yoko Roll Lachs"],[8,"Philadelphia Roll","шнитт-лук"]]},

 {name:"Big Salmon Menü", pcs:29, box:"L", kit:"васаби · имбирь · Sweet Sauce · Cocktail Mayo",
  note:"Всё на жареной коже лосося. Sweet Sauce и кунжут на Yoko Rolls",
  items:[[8,"Maki Salmon Avocado"],[8,"Mini Yoko Roll Salmon"],[5,"Yoko Roll Salmon"],[8,"Salmon Roll"]]},

 {name:"Master of the Rolls Menü", pcs:42, box:"L", kit:"васаби · имбирь · Sweet Sauce",
  note:"Sweet Sauce и кунжут сверху",
  items:[[8,"California Roll","масаго"],[8,"Chicken Teriyaki Roll","кунжут"],[8,"Maki Sake"],
         [8,"Maki Kappa"],[5,"Yoko Roll Lachs"],[5,"Yoko Roll Vegetaria"]]},

 {name:"Fitness Menü", pcs:29, box:"M", kit:"васаби · имбирь · Sweet Sauce",
  note:"Веганское. Sweet Sauce и кунжут сверху",
  items:[[8,"Fitness Roll","шнитт-лук"],[8,"Maki Avocado"],[8,"Maki Rucola"],[5,"Yoko Roll Vegetaria"]]},

 {name:"Magic Mix Menü", pcs:21, box:"M", kit:"васаби · имбирь · Sweet Sauce",
  note:"Sweet Chili сверху",
  items:[[8,"Magic Garden Roll"],[8,"Japanese fried Chicken Roll"],[5,"Yoko Roll Vegetaria"]]},

 {name:"Mini Yoko Roll Menü", pcs:24, box:"L", kit:"васаби · имбирь · 2× Cocktail Mayo",
  items:[[8,"Mini Yoko Roll Sake"],[8,"Mini Yoko Roll Chicken"],[8,"Mini Yoko Roll Avocado"]]},

 {name:"Yoko Roll Menü", pcs:15, box:"XL", kit:"васаби · имбирь · 2× Sweet Sauce",
  note:"Sweet Sauce и кунжут сверху",
  items:[[5,"Yoko Roll Garnele"],[5,"Yoko Roll Chicken"],[5,"Yoko Roll Vegetaria"]]},

 {name:"Yoko Single Menü Sake", pcs:16, box:"M", kit:"васаби · имбирь · Cocktail Mayo",
  items:[[8,"Philadelphia Roll"],[8,"Mini Yoko Roll Sake"]]},

 {name:"Yoko Single Menü Chicken", pcs:16, box:"M", kit:"васаби · имбирь · Cocktail Mayo",
  items:[[8,"Chicken Teriyaki Roll"],[8,"Mini Yoko Roll Chicken"]]},

 {name:"Yoko Single Menü Veggie", pcs:16, box:"M", kit:"васаби · имбирь · Cocktail Mayo",
  items:[[8,"Fitness Roll"],[8,"Mini Yoko Roll Avocado"]]},

 {name:"Party Menü", pcs:52, box:"L", kit:"васаби · 2× имбирь · 2× соевый",
  items:[[8,"California Roll","масаго"],[8,"Alaska Roll","шнитт-лук"],[8,"Fitness Roll","кунжут"],
         [8,"Maki Sake"],[8,"Maki Avocado"],[8,"Maki Kappa"],[4,"Nigiri Sake"]]},

 {name:"Lachsmenü", pcs:26, box:"L", kit:"васаби · имбирь · соевый",
  items:[[2,"Nigiri Sake"],[8,"Maki Sake"],[8,"Alaska Roll","масаго"],[8,"Philadelphia Roll","шнитт-лук"]]},

 {name:"XL Lachsmenü", pcs:39, box:"L", kit:"васаби · имбирь · соевый",
  items:[[2,"Nigiri Sake"],[8,"Maki Sake"],[8,"Alaska Roll","масаго"],[8,"Philadelphia Roll","шнитт-лук"],
         [8,"Mini Yoko Roll Sake"],[5,"Yoko Roll Lachs"]]},

 {name:"Family Lachs Deluxe", pcs:65, box:"", kit:"соевый · Cranberry Teriyaki · Cocktailmayo",
  items:[[8,"Maki Sake"],[8,"Alaska Roll"],[8,"Philadelphia Roll"],[4,"Nigiri Sake"],
         [5,"Yoko Roll Lachs"],[16,"Mini Yoko Roll Sake"],[16,"Crunchy Sake Roll"]]},

 {name:"Family Chicken Deluxe", pcs:61, box:"", kit:"соевый · Cranberry Teriyaki · Cocktailmayo",
  items:[[8,"Maki Chicken"],[5,"Yoko Roll Chicken"],[16,"Chicken Teriyaki Roll"],
         [16,"Mini Yoko Roll Chicken"],[16,"Crunchy Chicken Roll"]]},

 {name:"Family Veggie Deluxe", pcs:69, box:"", kit:"соевый · Cranberry Teriyaki · Cocktailmayo",
  items:[[8,"Maki Avocado"],[8,"Maki Rucola"],[8,"Maki Kappa"],[8,"Fitness Roll"],
         [5,"Yoko Roll Vegetaria"],[16,"Mini Yoko Roll Avocado"],[16,"Crunchy Veggie Roll"]]},

 {name:"Crunchy Chicken Menü", pcs:16, box:"", kit:"",
  items:[[8,"Crunchy Chicken Roll"],[8,"Maki Chicken"]]},

 {name:"Crunchy Sake Menü", pcs:16, box:"", kit:"",
  items:[[8,"Crunchy Sake Roll"],[8,"Maki Sake"]]},

 {name:"Crunchy Veggie Menü", pcs:16, box:"", kit:"",
  items:[[8,"Crunchy Veggie Roll"],[8,"Maki Avocado"]]},

 {name:"Crunchy Spargel Menü", pcs:16, box:"", kit:"",
  items:[[8,"Crunchy Spargel Roll"],[8,"Maki Tempura Spargel"]]},

 {name:"Premium Lunch", pcs:15, box:"", kit:"",
  items:[[5,"Yoko Roll Chicken"],[2,"Sommerrolle Black Tiger Garnele"],[8,"Philadelphia Roll","кунжут"]]},

 {name:"Veggie Lunch", pcs:15, box:"", kit:"",
  items:[[5,"Yoko Roll Vegetaria"],[2,"Sommerrolle Natur"],[8,"Fitness Roll","кунжут"]]},

 {name:"Peanut Pokal Menü", pcs:15, box:"", kit:"Erdnuss Sauce",
  items:[[2,"Sommerrolle Peanut Chicken"],[5,"Yoko Roll Peanut Chicken"],[8,"Peanut Chicken Deluxe"]]},

 {name:"Mittagsmenü 1", pcs:null, box:"", kit:"", note:"Не участвует в акциях",
  items:[[1,"Miso Suppe"],[8,"Maki Sake"],[8,"California Roll","масаго"]]},

 {name:"Mittagsmenü 2", pcs:null, box:"", kit:"", note:"Не участвует в акциях",
  items:[[1,"Algensalat"],[8,"Maki Avocado"],[8,"Maki Rucola"]]},

 {name:"Mittagsmenü 3", pcs:null, box:"", kit:"", note:"Не участвует в акциях",
  items:[[1,"Miso Suppe"],[8,"Maki Sake Avocado"],[8,"Maki Salmon"]]},

 {name:"Mittagsmenü 4", pcs:null, box:"", kit:"", note:"Не участвует в акциях",
  items:[[1,"Miso Suppe"],[8,"Maki Kappa"],[8,"Alaska Roll","шнитт-лук"]]},

 {name:"Mittagsmenü 5", pcs:null, box:"", kit:"", note:"Не участвует в акциях",
  items:[[6,"Crispy Ebi Sticks"],[8,"Chicken Teriyaki Roll"]]},

 {name:"Mittagsmenü 6", pcs:null, box:"", kit:"", note:"Не участвует в акциях; дип и обсыпка на выбор",
  items:[[2,"Sommerrolle Chicken"],[8,"Philadelphia Roll"]]},

 {name:"Happy Sushi Menü", pcs:null, box:"XXL", kit:"2× васаби · 3× имбирь · 2× соевый",
  note:"Состав в техкартах не расписан — есть только фото раскладки", items:[]},

 {name:"Big Yoko Menü", pcs:null, box:"XXL", kit:"2× васаби · 3× имбирь · 2× соевый",
  note:"Состав в техкартах не расписан — есть только фото раскладки", items:[]}
];

const SNACKS = [
 ["Sommerrollen","2","M","50 мл дипа на выбор"],
 ["Mini Frühlingsrollen","5","S","50 мл дипа на выбор"],
 ["Gyoza","5","M","50 мл дипа на выбор"],
 ["Chicken Teriyaki Sticks","3–4","M","50 мл дипа на выбор"],
 ["Crispy Ebi Sticks","6","M","50 мл Yoko Cocktailmayonnaise"],
 ["Japanese Fried Chicken Box","5","S","50 мл Sweet Chili Sauce"],
 ["Big Roll","4","M","50 мл соевого + 25 васаби + 25 имбирь"]
];
