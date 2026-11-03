/**
 * Блог vakmarketing.com: API для админки vakmarketing.com/admin/ и для nslnv.seo.
 *
 * Статьи лежат в репозитории сайта (GH_REPO) файлами content/blog/<slug>.json, картинки в
 * content/blog/media/. При публикации коммит запускает сборку сайта (tools/build-blog.mjs),
 * и через 1–2 минуты статья на сайте. Черновики коммитятся с [skip ci] и сайт не трогают.
 *
 * Свойства скрипта:
 *   GH_TOKEN   — fine-grained токен GitHub с правом Contents: Read and write на GH_REPO
 *                (создаёт и вставляет владелец, в код не попадает);
 *   BLOG_KEYS  — JSON {ключ: {name, role}}; role 'owner' может заводить редакторов в админке.
 *                Первый ключ владельца выдаёт setupBlog() в журнал.
 * nslnv.seo: «Другой сайт или CMS» → адрес <URL веб-приложения>?key=<ключ редактора>;
 * присланные статьи сохраняются черновиками, картинки из них скачиваются в media/. Сеошке отвечаем
 * через HtmlService (см. doPost). Рубрики лежат в content/blog/categories.json (действие categories).
 * Вторая языковая версия статьи (поле tr) делается при публикации переводчиком Google (LanguageApp);
 * сайт показывает её, когда посетитель переключил язык. Уже опубликованные переводит действие translate.
 */
var GH_REPO = 'nslnv/vak-marketing-3d-demo', GH_BRANCH = 'main', BLOG_DIR = 'content/blog';
var SITE_BLOG = 'https://vakmarketing.com/blog/';
var BLOG_TAGS = { p: 1, h2: 1, h3: 1, h4: 1, strong: 1, b: 1, em: 1, i: 1, u: 1, s: 1, a: 1, ul: 1, ol: 1, li: 1,
  blockquote: 1, img: 1, figure: 1, figcaption: 1, br: 1, hr: 1, code: 1, pre: 1, table: 1, thead: 1, tbody: 1,
  tr: 1, th: 1, td: 1, mark: 1, aside: 1, span: 1, sup: 1, sub: 1 };
// Классы оформления из палитры админки: лид, врезки, акцент, видео. Остальные классы срезаются.
var BLOG_CLASSES = { p: ['lead'], aside: ['callout', 'callout--tip', 'callout--warn'], span: ['accent'], figure: ['video'] };
var MEDIA_EXT = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif' };

/** Запускать вручную один раз: создаёт ключ владельца и пишет его в журнал. */
function setupBlog() {
  var keys = blogKeys_(), owner = Object.keys(keys).filter(function (k) { return keys[k].role === 'owner'; })[0];
  if (!owner) {
    owner = newKey_();
    keys[owner] = { name: 'Никита', role: 'owner' };
    PropertiesService.getScriptProperties().setProperty('BLOG_KEYS', JSON.stringify(keys));
  }
  console.log('Ключ владельца для vakmarketing.com/admin/: ' + owner);
  console.log('GH_TOKEN ' + (PropertiesService.getScriptProperties().getProperty('GH_TOKEN') ? 'есть' : 'НЕ ЗАДАН'));
}

/** Точка входа из doPost: data — тело запроса, params — параметры адреса (?key=). */
function blogApi_(data, params) {
  var keys = blogKeys_(), key = String(data.key || params.key || ''), who = keys[key];
  if (!who) return { ok: false, error: 'Неверный ключ редактора' };
  try {
    if (!data.action && (data.title || data.html || data.markdown)) return fromNslnv_(data, who);
    switch (data.action) {
      case 'me': return { ok: true, name: who.name, role: who.role };
      case 'list': return { ok: true, posts: listPosts_() };
      case 'get': return getPost_(data.slug);
      case 'save': return savePost_(data.post || {}, data.prevSlug, who);
      case 'delete': return deletePost_(data.slug, who);
      case 'upload': return upload_(data.file || {}, who);
      case 'editors': return editors_(data, who);
      case 'categories': return categories_(data, who);
      case 'translate': return translateAll_(data.slug, who);
    }
    return { ok: false, error: 'Неизвестное действие' };
  } catch (err) {
    console.error(err);
    return { ok: false, error: String(err.message || err) };
  }
}

/* ---------- статьи ---------- */
function listPosts_() {
  var dir = gh_('get', '/contents/' + BLOG_DIR + '?ref=' + GH_BRANCH);
  if (dir.code === 404) return [];
  var files = (dir.json || []).filter(function (f) { return f.type === 'file' && /\.json$/.test(f.name) && f.name !== 'categories.json'; });
  var reqs = files.map(function (f) { return ghReq_('get', '/contents/' + BLOG_DIR + '/' + encodeURIComponent(f.name) + '?ref=' + GH_BRANCH, null, true); });
  var out = [];
  UrlFetchApp.fetchAll(reqs).forEach(function (r) {
    if (r.getResponseCode() !== 200) return;
    try {
      var p = JSON.parse(r.getContentText());
      out.push({ slug: p.slug, title: p.title, status: p.status, date: p.date, updated: p.updated, lang: p.lang, author: p.author,
        editedBy: p.editedBy || '', source: p.source || 'admin', cover: p.cover || '', category: p.category || '', featured: !!p.featured,
        review: !!p.review, note: p.note ? String(p.note).slice(0, 140) : '', tr: p.tr ? p.tr.lang : '' });
    } catch (e) {}
  });
  return out.sort(function (a, b) { return String(b.updated || b.date).localeCompare(String(a.updated || a.date)); });
}

function getPost_(slug) {
  if (!/^[a-z0-9-]+$/.test(slug || '')) return { ok: false, error: 'Нет такой статьи' };
  var f = readFile_(BLOG_DIR + '/' + slug + '.json');
  return f ? { ok: true, post: JSON.parse(f.text) } : { ok: false, error: 'Нет такой статьи' };
}

function savePost_(p, prevSlug, who) {
  var title = String(p.title || '').trim().slice(0, 200);
  if (!title) return { ok: false, error: 'Нужен заголовок' };
  var slug = slugify_(p.slug || title);
  if (!slug) return { ok: false, error: 'Нужен адрес статьи' };
  if (/^(category|media|feed)$/.test(slug)) slug += '-1';   // эти адреса заняты страницами блога
  var path = BLOG_DIR + '/' + slug + '.json';
  var cur = readFile_(path), before = cur ? JSON.parse(cur.text) : null;
  if (before && prevSlug !== slug) return { ok: false, error: 'Статья с адресом «' + slug + '» уже есть, поменяйте адрес' };
  var old = prevSlug && prevSlug !== slug ? readFile_(BLOG_DIR + '/' + prevSlug + '.json') : null;
  var oldPost = old ? JSON.parse(old.text) : null;
  var base = before || oldPost || {};
  // trash — корзина: файл остаётся, на сайте статьи нет, из корзины её можно вернуть или удалить насовсем.
  var status = p.status === 'published' ? 'published' : p.status === 'trash' ? 'trash' : 'draft';
  var today = Utilities.formatDate(new Date(), 'Europe/Nicosia', 'yyyy-MM-dd');
  var post = {
    slug: slug, title: title,
    description: String(p.description || '').trim().slice(0, 300),
    lang: p.lang === 'en' ? 'en' : 'ru',
    date: /^\d{4}-\d{2}-\d{2}$/.test(p.date || '') ? p.date : (base.date || today),
    updated: Utilities.formatDate(new Date(), 'Europe/Nicosia', "yyyy-MM-dd'T'HH:mm"),
    status: status,
    cover: /^media\/[\w.-]+$/.test(p.cover || '') ? p.cover : '',
    coverAlt: String(p.coverAlt || '').trim().slice(0, 200),
    // Поля, которых нет в запросе (например, при повторной отправке из сеошки), берутся из прежней версии.
    category: p.category !== undefined ? (/^[a-z0-9-]{1,60}$/.test(p.category) ? p.category : '') : (base.category || ''),
    seoTitle: p.seoTitle !== undefined ? String(p.seoTitle).trim().slice(0, 90) : (base.seoTitle || ''),
    featured: p.featured !== undefined ? !!p.featured : !!base.featured,
    review: status === 'draft' && (p.review !== undefined ? !!p.review : !!base.review),   // ждёт проверки
    note: p.note !== undefined ? String(p.note).trim().slice(0, 1000) : (base.note || ''),  // заметка для редакции, на сайт не идёт
    html: sanitize_(p.html),
    author: base.author || who.name,
    editedBy: who.name,
    source: base.source || (p.source === 'nslnv' ? 'nslnv' : 'admin')
  };
  if (p.sourceFields) post.sourceFields = p.sourceFields;
  else if (base.sourceFields) post.sourceFields = base.sourceFields;
  var tr = status === 'published' ? translated_(post, base.tr) : base.tr;
  if (tr) post.tr = tr;
  var wasLive = (base.status === 'published');
  var verb = status === 'published' ? 'опубликована' : status === 'trash' ? 'в корзине' : post.review ? 'на проверке' : 'черновик';
  var msg = 'Блог: «' + title + '» ' + verb + ' (' + who.name + ')' +
    (status === 'published' || wasLive ? '' : ' [skip ci]');
  writeFile_(path, JSON.stringify(post, null, 2), msg, cur && cur.sha);
  if (old) deleteFile_(BLOG_DIR + '/' + prevSlug + '.json', old.sha, 'Блог: адрес «' + prevSlug + '» → «' + slug + '»' + (wasLive ? '' : ' [skip ci]'));
  return { ok: true, slug: slug, status: status, url: SITE_BLOG + slug + '/' };
}

/* ---------- перевод ---------- */
// Рубрика на обоих языках: name русское, nameEn английское. Если редактор написал название только
// по-английски, оно уходит в nameEn, а русское делает переводчик; так же с описанием.
function catLangs_(c) {
  var cyr = /[а-яё]/i;
  var tr = function (s, from, to) { try { return plain_(LanguageApp.translate(s, from, to)); } catch (e) { return s; } };
  if (!c.nameEn && !cyr.test(c.name)) { c.nameEn = c.name; c.name = tr(c.name, 'en', 'ru'); }
  else if (!c.nameEn) c.nameEn = tr(c.name, 'ru', 'en');
  if (c.description && !c.descriptionEn && !cyr.test(c.description)) { c.descriptionEn = c.description; c.description = tr(c.description, 'en', 'ru'); }
  else if (c.description && !c.descriptionEn) c.descriptionEn = tr(c.description, 'ru', 'en');
  return c;
}

// Перевод статьи на второй язык сайта. Пока исходный текст не менялся (подпись sig), прежний
// перевод не трогаем. Если переводчик не ответил, статья выходит без перевода, сайт покажет оригинал.
function translated_(post, prev) {
  var from = post.lang === 'en' ? 'en' : 'ru', to = from === 'en' ? 'ru' : 'en';
  var sig = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5,
    [post.title, post.description, post.seoTitle, post.coverAlt, post.html].join('\u0001'), Utilities.Charset.UTF_8));
  if (prev && prev.lang === to && prev.sig === sig) return prev;
  try {
    var line = function (s) { return s ? plain_(LanguageApp.translate(s, from, to)) : ''; };
    return { lang: to, sig: sig, title: line(post.title), description: line(post.description), seoTitle: line(post.seoTitle),
      coverAlt: line(post.coverAlt), html: sanitize_(translateHtml_(post.html, from, to)) };
  } catch (err) {
    console.error(err);
    return prev || null;
  }
}

// HTML уходит переводчику кусками по целым блокам верхнего уровня: длина одного запроса ограничена.
function translateHtml_(html, from, to) {
  var blocks = [], depth = 0, start = 0, re = /<(\/?)([a-z][a-z0-9]*)\b[^>]*>/gi, m;
  html = String(html || '');
  while ((m = re.exec(html))) {
    if (/^(br|hr|img|wbr)$/i.test(m[2])) continue;
    depth = Math.max(0, depth + (m[1] ? -1 : 1));
    if (!depth) { blocks.push(html.slice(start, re.lastIndex)); start = re.lastIndex; }
  }
  if (start < html.length) blocks.push(html.slice(start));
  var out = '', chunk = '';
  var flush = function () { if (chunk.trim()) out += LanguageApp.translate(chunk, from, to, { contentType: 'html' }); chunk = ''; };
  blocks.forEach(function (b) { if (chunk.length + b.length > 4000) flush(); chunk += b; });
  flush();
  return out;
}

function plain_(s) {
  return String(s).replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

// Перевести уже опубликованные статьи (или одну, slug), у которых перевода нет или он устарел.
// Сайт пересобирается один раз, последним коммитом.
function translateAll_(slug, who) {
  var dir = gh_('get', '/contents/' + BLOG_DIR + '?ref=' + GH_BRANCH), todo = [];
  (dir.json || []).forEach(function (f) {
    if (f.type !== 'file' || !/\.json$/.test(f.name) || f.name === 'categories.json') return;
    if (slug && f.name !== slug + '.json') return;
    var cur = readFile_(BLOG_DIR + '/' + f.name), post = cur && JSON.parse(cur.text);
    if (!post || post.status !== 'published') return;
    var tr = translated_(post, post.tr);
    if (tr && tr !== post.tr) { post.tr = tr; todo.push({ name: f.name, post: post, sha: cur.sha }); }
  });
  todo.forEach(function (t, i) {
    writeFile_(BLOG_DIR + '/' + t.name, JSON.stringify(t.post, null, 2),
      'Блог: перевод «' + t.post.title + '» (' + who.name + ')' + (i < todo.length - 1 ? ' [skip ci]' : ''), t.sha);
  });
  return { ok: true, translated: todo.map(function (t) { return t.post.slug; }) };
}

function deletePost_(slug, who) {
  var f = /^[a-z0-9-]+$/.test(slug || '') ? readFile_(BLOG_DIR + '/' + slug + '.json') : null;
  if (!f) return { ok: false, error: 'Нет такой статьи' };
  var live = JSON.parse(f.text).status === 'published';
  deleteFile_(BLOG_DIR + '/' + slug + '.json', f.sha, 'Блог: удалена «' + slug + '» (' + who.name + ')' + (live ? '' : ' [skip ci]'));
  return { ok: true };
}

function upload_(file, who) {
  var ext = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif' }[file.type];
  if (!ext || !file.data) return { ok: false, error: 'Нужна картинка JPG, PNG, WEBP или GIF' };
  if (file.data.length > 8e6) return { ok: false, error: 'Картинка больше 6 МБ, уменьшите её' };
  var name = Utilities.formatDate(new Date(), 'Europe/Nicosia', 'yyyyMMdd') + '-' + newKey_().slice(0, 8) + '.' + ext;
  ghWrite_(BLOG_DIR + '/media/' + name, file.data, 'Блог: картинка (' + who.name + ') [skip ci]');
  return { ok: true, path: 'media/' + name };
}

// Статья из nslnv.seo: только черновиком, без заголовка-дубля и без заглушек [IMAGE: …].
// Картинки по https-ссылкам скачиваются в media/, первая (или присланная обложка) становится обложкой.
function fromNslnv_(d, who) {
  // «Test connection» в сеошке присылает статью с этим адресом: отвечаем, но не сохраняем.
  if (d.slug === 'nslnv-connection-check') return { ok: true, id: d.slug, url: SITE_BLOG };
  var html = String(d.html || d.content || '');
  if (!html && d.markdown) html = String(d.markdown).split(/\n{2,}/).map(function (b) { return '<p>' + esc_(b) + '</p>'; }).join('');
  html = html.replace(/^\s*<h1[^>]*>[\s\S]*?<\/h1>/i, '')
    .replace(/<p>\s*\[IMAGE:[^\]]*\]\s*<\/p>/gi, '').replace(/\[IMAGE:[^\]]*\]/gi, '');
  // Повторная отправка из сеошки обновляет её же черновик; опубликованное и чужие черновики не трогаем.
  var base = slugify_(d.slug || d.title), slug = base, n = 2, cur, prev = {};
  while ((cur = readFile_(BLOG_DIR + '/' + slug + '.json'))) {
    prev = JSON.parse(cur.text);
    if (prev.source === 'nslnv' && prev.status !== 'published') break;
    prev = {};
    slug = base + '-' + n++;
  }
  var imgs = importImages_(html), cover = prev.cover || '', coverAlt = prev.coverAlt || '';
  html = imgs.html;
  var sent = d.cover || d.image || d.featured_image || d.featuredImage || d.og_image || d.cover_url || '';
  if (!cover && /^https:\/\//i.test(sent)) cover = importImage_(sent) || '';
  if (!cover && imgs.first) {
    cover = imgs.first.path; coverAlt = imgs.first.alt;
    // Картинка в самом начале текста — это и есть обложка, второй раз её не показываем.
    var at = html.indexOf('/blog/' + cover);
    if (at >= 0 && at < 400) html = html.replace(/<(p|figure)>\s*<img[^>]*>\s*<\/\1>|<img[^>]*>/i, '');
  }
  var cats = readCategories_().list, want = String(d.category || d.rubric || '').trim().toLowerCase();
  var cat = want ? cats.filter(function (c) { return c.slug === want || c.name.toLowerCase() === want || String(c.nameEn).toLowerCase() === want; })[0] : null;
  var r = savePost_({ title: d.title, slug: slug, html: html, status: 'draft', source: 'nslnv', date: prev.date,
    description: d.description || d.meta_description || d.metaDescription || d.excerpt || d.seo_description || prev.description || '',
    seoTitle: d.seo_title || d.seoTitle || d.meta_title || undefined,
    category: cat ? cat.slug : undefined,
    lang: /[а-яё]/i.test(String(d.title || '')) ? 'ru' : 'en', cover: cover, coverAlt: coverAlt,
    sourceFields: Object.keys(d).slice(0, 40) }, slug, who);
  if (r.ok) { r.id = r.slug; r.url = 'https://vakmarketing.com/admin/#edit/' + r.slug; }
  return r;
}

function importImages_(html) {
  var first = null, n = 0;
  html = html.replace(/<img\b[^>]*>/gi, function (tag) {
    var src = attr_(tag, 'src');
    if (/^\/blog\/media\//.test(src)) return tag;
    if (!/^https:\/\//i.test(src) || n >= 12) return '';
    var path = importImage_(src);
    if (!path) return '';
    n++;
    var alt = attr_(tag, 'alt');
    if (!first) first = { path: path, alt: alt };
    return '<img src="/blog/' + path + '" alt="' + escAttr_(alt) + '">';
  });
  return { html: html, first: first };
}
function importImage_(url) {
  try {
    var r = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true });
    var blob = r.getBlob(), ext = MEDIA_EXT[String(blob.getContentType() || '').split(';')[0]], bytes = r.getContent();
    if (r.getResponseCode() !== 200 || !ext || bytes.length > 6e6) return '';
    var name = Utilities.formatDate(new Date(), 'Europe/Nicosia', 'yyyyMMdd') + '-' + newKey_().slice(0, 8) + '.' + ext;
    ghWrite_(BLOG_DIR + '/media/' + name, Utilities.base64Encode(bytes), 'Блог: картинка из nslnv.seo [skip ci]');
    return 'media/' + name;
  } catch (e) {
    console.error(e);
    return '';
  }
}

/* ---------- рубрики: content/blog/categories.json, заводят и правят все редакторы ---------- */
function readCategories_() {
  var f = readFile_(BLOG_DIR + '/categories.json'), list = [];
  try { list = f ? JSON.parse(f.text) : []; } catch (e) { list = []; }
  return { file: f, list: Array.isArray(list) ? list : [] };
}
function categories_(d, who) {
  var cur = readCategories_();
  if (!d.set) return { ok: true, categories: cur.list };
  var seen = {}, out = [];
  (Array.isArray(d.set) ? d.set : []).slice(0, 40).forEach(function (c) {
    var name = String(c.name || '').trim().slice(0, 60);
    var slug = slugify_(c.slug || name).slice(0, 60);
    if (!name || !slug || seen[slug]) return;
    seen[slug] = 1;
    out.push(catLangs_({ slug: slug, name: name, nameEn: String(c.nameEn || '').trim().slice(0, 60),
      description: String(c.description || '').trim().slice(0, 300), descriptionEn: String(c.descriptionEn || '').trim().slice(0, 300) }));
  });
  writeFile_(BLOG_DIR + '/categories.json', JSON.stringify(out, null, 2), 'Блог: рубрики (' + who.name + ')', cur.file && cur.file.sha);
  return { ok: true, categories: out };
}

/* ---------- редакторы ---------- */
function editors_(d, who) {
  if (who.role !== 'owner') return { ok: false, error: 'Редакторов заводит только владелец' };
  var keys = blogKeys_(), props = PropertiesService.getScriptProperties();
  if (d.add) {
    var k = newKey_();
    keys[k] = { name: String(d.add).trim().slice(0, 60) || 'Редактор', role: 'editor' };
    props.setProperty('BLOG_KEYS', JSON.stringify(keys));
    return { ok: true, key: k, name: keys[k].name };
  }
  if (d.remove) {
    var target = Object.keys(keys).filter(function (k) { return k.slice(0, 6) === d.remove && keys[k].role !== 'owner'; })[0];
    if (target) { delete keys[target]; props.setProperty('BLOG_KEYS', JSON.stringify(keys)); }
    return { ok: true };
  }
  return { ok: true, editors: Object.keys(keys).map(function (k) { return { id: k.slice(0, 6), name: keys[k].name, role: keys[k].role }; }) };
}

function blogKeys_() {
  try { return JSON.parse(PropertiesService.getScriptProperties().getProperty('BLOG_KEYS') || '{}'); } catch (e) { return {}; }
}
function newKey_() { return Utilities.getUuid().replace(/-/g, ''); }

/* ---------- чистка HTML: только разрешённые теги и атрибуты ---------- */
function sanitize_(html) {
  html = String(html || '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|iframe|object|embed|form|svg|math|template|noscript|head|title)\b[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<h1\b[^>]*>/gi, '<h2>').replace(/<\/h1>/gi, '</h2>');
  return html.replace(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/g, function (m, close, tag, attrs) {
    tag = tag.toLowerCase();
    if (!BLOG_TAGS[tag]) return '';
    if (close) return /^(img|br|hr)$/.test(tag) ? '' : '</' + tag + '>';
    var out = '';
    if (tag === 'a') {
      var h = attr_(attrs, 'href');
      if (h && /^(https?:|mailto:|\/|#)/i.test(h)) {
        out = ' href="' + escAttr_(h) + '"' + (/^https?:/i.test(h) && !/^https?:\/\/(www\.)?vakmarketing\.com/i.test(h) ? ' target="_blank" rel="noopener"' : '');
      }
    } else if (tag === 'img') {
      var s = attr_(attrs, 'src');
      if (!s || !/^(https:\/\/|\/blog\/media\/)/i.test(s)) return '';
      out = ' src="' + escAttr_(s) + '" alt="' + escAttr_(attr_(attrs, 'alt')) + '" loading="lazy" decoding="async"';
    } else if (tag === 'th' || tag === 'td') {
      var cs = attr_(attrs, 'colspan'), rs = attr_(attrs, 'rowspan');
      if (/^\d+$/.test(cs)) out += ' colspan="' + cs + '"';
      if (/^\d+$/.test(rs)) out += ' rowspan="' + rs + '"';
    }
    if (BLOG_CLASSES[tag]) {
      var cls = attr_(attrs, 'class').split(/\s+/).filter(function (c) { return BLOG_CLASSES[tag].indexOf(c) >= 0; });
      if (cls.length) out += ' class="' + cls.join(' ') + '"';
    }
    if (tag === 'figure' && /^[\w-]{11}$/.test(attr_(attrs, 'data-youtube'))) out += ' data-youtube="' + attr_(attrs, 'data-youtube') + '"';
    return '<' + tag + out + '>';
  });
}
function attr_(attrs, name) {
  var m = new RegExp('\\s' + name + '\\s*=\\s*("([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i').exec(attrs || '');
  return m ? (m[2] || m[3] || m[4] || '').replace(/&amp;/g, '&') : '';
}
function escAttr_(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function slugify_(s) {
  var map = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
    н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '',
    ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' };
  return String(s || '').toLowerCase().split('').map(function (c) { return map[c] !== undefined ? map[c] : c; }).join('')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80).replace(/-+$/, '');
}

/* ---------- GitHub ---------- */
function ghReq_(method, path, body, raw) {
  var token = PropertiesService.getScriptProperties().getProperty('GH_TOKEN');
  if (!token) throw new Error('Не задан GH_TOKEN в свойствах скрипта');
  var req = { url: 'https://api.github.com/repos/' + GH_REPO + path, method: method, muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + token, Accept: raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' } };
  if (body) { req.contentType = 'application/json'; req.payload = JSON.stringify(body); }
  return req;
}
function gh_(method, path, body) {
  var r = UrlFetchApp.fetchAll([ghReq_(method, path, body)])[0];
  var t = r.getContentText();
  return { code: r.getResponseCode(), json: t ? JSON.parse(t) : null };
}
function readFile_(path) {
  var r = gh_('get', '/contents/' + path + '?ref=' + GH_BRANCH);
  if (r.code !== 200 || !r.json || !r.json.content) return null;
  var bytes = Utilities.base64Decode(r.json.content.replace(/\n/g, ''));
  return { sha: r.json.sha, text: Utilities.newBlob(bytes).getDataAsString('UTF-8') };
}
function writeFile_(path, text, message, sha) {
  ghWrite_(path, Utilities.base64Encode(text, Utilities.Charset.UTF_8), message, sha);
}
function ghWrite_(path, base64, message, sha) {
  var body = { message: message, content: base64, branch: GH_BRANCH };
  if (sha) body.sha = sha;
  var r = gh_('put', '/contents/' + path, body);
  if (r.code !== 200 && r.code !== 201) throw new Error('GitHub ' + r.code + ': ' + (r.json && r.json.message));
}
function deleteFile_(path, sha, message) {
  var r = gh_('delete', '/contents/' + path, { message: message, sha: sha, branch: GH_BRANCH });
  if (r.code !== 200) throw new Error('GitHub ' + r.code + ': ' + (r.json && r.json.message));
}
