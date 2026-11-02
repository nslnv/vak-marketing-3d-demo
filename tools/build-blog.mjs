// Сборка блога vakmarketing.com. Запускается в GitHub Actions после копирования site-3d:
//   node tools/build-blog.mjs _site/site-3d
// Берёт статьи из content/blog/<slug>.json и рубрики из content/blog/categories.json (их пишет
// админка /admin/ через Apps Script, см. docs/leads-telegram/Blog.gs) и делает в собранном сайте:
//   blog/index.html, blog/<slug>/index.html, blog/category/<рубрика>/index.html, blog/feed.xml,
//   blog/media/* и записи в sitemap.xml.
// Шапка, подвал и счётчики берутся из privacy/index.html, чтобы блог не расходился с сайтом.
// Пока опубликованных статей нет, блог не собирается и пункты «Блог» в меню остаются «скоро»;
// с первой статьёй сборка включает их на главной, на страницах услуг и в политике.
import fs from 'node:fs';
import path from 'node:path';

const OUT = process.argv[2] || '_site/site-3d';
const SRC = 'content/blog';
const SITE = 'https://vakmarketing.com';
const DEFAULT_OG = SITE + '/assets/img/og-v6.jpg';
const CSS_V = '20261103-1', JS_V = '20261103-1';
// Статья запланирована, пока её дата не наступила нигде в мире (UTC+14): так редактор в любом
// часовом поясе публикует «сегодня» сразу, а запланированная выходит со сборкой в 00:10 по Кипру.
const TODAY = new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Kiritimati' }).format(new Date());

const read = (p) => fs.readFileSync(p, 'utf8');
const write = (p, s) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); };
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function loadPosts() {
  if (!fs.existsSync(SRC)) return [];
  return fs.readdirSync(SRC).filter((f) => f.endsWith('.json')).map((f) => {
    try { return JSON.parse(read(path.join(SRC, f))); } catch (e) { console.warn('skip', f, e.message); return null; }
  }).filter((p) => p && p.status === 'published' && /^[a-z0-9-]+$/.test(p.slug || '') && p.title && String(p.date) <= TODAY)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.updated).localeCompare(String(a.updated)));
}
function loadCategories() {
  try {
    const list = JSON.parse(read(path.join(SRC, 'categories.json')));
    return Array.isArray(list) ? list.filter((c) => c && /^[a-z0-9-]+$/.test(c.slug || '') && c.name) : [];
  } catch (e) { return []; }
}

// Вторая линия защиты: админка и Apps Script уже чистят HTML, здесь вырезаем исполняемое.
function clean(html) {
  return String(html || '')
    .replace(/<(script|style|iframe|object|embed|form)[\s\S]*?<\/\1>/gi, '')
    .replace(/<(script|style|iframe|object|embed|form|input|button)[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*"\s*javascript:[^"]*"/gi, '$1="#"');
}

// Видео из палитры хранится как <figure class="video" data-youtube="ID"> с превью; на сайте — плеер.
function videos(html) {
  return html.replace(/<figure class="video" data-youtube="([\w-]{11})">[\s\S]*?<\/figure>/g, (m, id) =>
    `<figure class="video"><iframe src="https://www.youtube-nocookie.com/embed/${id}" title="Видео" loading="lazy" ` +
    'allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe></figure>');
}
const TR = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' };
const slugify = (t) => String(t).toLowerCase().split('').map((c) => (TR[c] !== undefined ? TR[c] : c)).join('')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'part';
const text = (html) => String(html || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
// Якоря у подзаголовков H2 и оглавление, если их три и больше.
function toc(html) {
  const used = {}, items = [];
  const out = html.replace(/<h2>([\s\S]*?)<\/h2>/g, (m, inner) => {
    let id = slugify(text(inner)); while (used[id]) id += '-2'; used[id] = 1;
    items.push({ id, title: text(inner) });
    return `<h2 id="${id}">${inner}</h2>`;
  });
  return { html: out, items: items.length >= 3 ? items : [] };
}
const words = (html) => text(html).split(' ').filter(Boolean).length;
const readMin = (html) => Math.max(1, Math.round(words(html) / 190));
const L = (ru, en) => `<span data-l="ru">${ru}</span><span data-l="en">${en == null ? ru : en}</span>`;

const MONTHS = {
  ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
};
function humanDate(iso, lang) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  if (!m) return '';
  return `${Number(m[3])} ${MONTHS[lang === 'en' ? 'en' : 'ru'][Number(m[2]) - 1]} ${m[1]}`;
}
const absUrl = (p) => (/^https?:/.test(p) ? p : SITE + '/blog/' + String(p).replace(/^\/?(blog\/)?/, ''));
const coverSrc = (p) => (p.cover ? '/blog/' + p.cover.replace(/^\/?(blog\/)?/, '') : '');

/* ---------- оболочка сайта из страницы политики ---------- */
const BLOG_LINK = '<a href="/blog/"><span data-l="ru">Блог</span><span data-l="en">Blog</span></a>\n        ';
function shell() {
  const pv = read(path.join(OUT, 'privacy/index.html'));
  const ver = (re) => (pv.match(re) || [])[1] || '';
  const pick = (from, to) => { const i = pv.indexOf(from); const j = pv.indexOf(to, i); return pv.slice(i, j + to.length); };
  let header = pick('<a class="skip-link"', '</header>');
  // «Блог» перед «Контактами» в шапке и мобильном меню.
  header = header.split('<a href="/#contact"><span data-l="ru">Контакты</span>').join(BLOG_LINK.replace('<a href="/blog/"', '<a href="/blog/" data-bl') + '<a href="/#contact"><span data-l="ru">Контакты</span>');
  let footer = pick('<footer class="foot">', '</footer>').replace(' aria-current="page"', '');
  footer = footer.replace(/(<a href="\/#partners">[\s\S]*?<\/a>)/, '$1\n          <a href="/blog/"><span data-l="ru">Блог</span><span data-l="en">Blog</span></a>');
  return {
    noscript: (pv.match(/<noscript>[\s\S]*?<\/noscript>/) || [''])[0],
    header, footer,
    base: ver(/base\.css\?v=([\w-]+)/), sections: ver(/sections\.css\?v=([\w-]+)/),
    pvcss: ver(/privacy-page\.css\?v=([\w-]+)/), analytics: ver(/analytics\.js\?v=([\w-]+)/)
  };
}

function page(sh, { title, description, canonical, ogType, ogImage, ogLocale, jsonld, body, current }) {
  const header = sh.header.replace(/<a href="\/blog\/" data-bl>/g, current ? '<a href="/blog/" aria-current="page">' : '<a href="/blog/">');
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="description" content="${esc(description)}">
  <meta name="robots" content="index,follow">
  <meta name="theme-color" content="#06050C">
  <title>${esc(title)}</title>
  <link rel="canonical" href="${canonical}">
  <link rel="alternate" type="application/rss+xml" title="VAK Marketing — блог" href="${SITE}/blog/feed.xml">
  <link rel="icon" href="/favicon.ico?v=2" sizes="48x48">
  <link rel="icon" href="/assets/img/brand/icon-96.png?v=2" type="image/png" sizes="96x96">
  <link rel="icon" href="/assets/img/brand/icon-192.png?v=2" type="image/png" sizes="192x192">
  <link rel="apple-touch-icon" href="/assets/img/brand/apple-touch-icon.png?v=2">
  <link rel="preload" href="/assets/fonts/manrope-cyrillic.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/assets/fonts/manrope-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/assets/css/base.css?v=${sh.base}">
  <link rel="stylesheet" href="/assets/css/sections.css?v=${sh.sections}">
  <link rel="stylesheet" href="/assets/css/privacy-page.css?v=${sh.pvcss}">
  <link rel="stylesheet" href="/assets/css/blog.css?v=${CSS_V}">
  <script>try{if(localStorage.getItem('vak-lang')==='en')document.documentElement.lang='en'}catch(e){}</script>
  <script src="/assets/js/analytics.js?v=${sh.analytics}" defer></script>
  <meta property="og:type" content="${ogType}">
  <meta property="og:site_name" content="VAK Marketing">
  <meta property="og:locale" content="${ogLocale}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${ogImage}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${ogImage}">
  <script type="application/ld+json">${JSON.stringify(jsonld)}</script>
</head>
<body class="pv bl">
${sh.noscript}
  ${header}

${body}

  ${sh.footer}
  <script src="/assets/js/blog.js?v=${JS_V}" defer></script>
</body>
</html>
`;
}

function card(p, cats, big) {
  const img = coverSrc(p), c = cats[p.category];
  return `<a class="bl-card${big ? ' bl-card--big' : ''}" href="/blog/${p.slug}/" lang="${p.lang === 'en' ? 'en' : 'ru'}">
          ${img ? `<span class="bl-card__img"><img src="${esc(img)}" alt="${esc(p.coverAlt || '')}" width="1600" height="900" ${big ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></span>` : '<span class="bl-card__img bl-card__img--none" aria-hidden="true"></span>'}
          <span class="bl-card__body">
            <span class="bl-card__meta">${c ? `<span class="bl-card__cat">${L(esc(c.name), esc(c.nameEn || c.name))}</span>` : ''}<time datetime="${esc(p.date)}">${humanDate(p.date, p.lang)}</time><span>${L(readMin(p.html) + ' мин', readMin(p.html) + ' min')}</span>${p.lang === 'en' ? '<span>EN</span>' : ''}</span>
            <span class="bl-card__title">${esc(p.title)}</span>
            ${p.description ? `<span class="bl-card__desc">${esc(p.description)}</span>` : ''}
          </span>
        </a>`;
}

// Рубрики, в которых есть опубликованные статьи, в порядке из админки.
function usedCats(posts, catList) { return catList.filter((c) => posts.some((p) => p.category === c.slug)); }
function catNav(used, current) {
  if (!used.length) return '';
  return `<nav class="bl-cats" aria-label="Рубрики">
        <a href="/blog/"${current ? '' : ' aria-current="page"'}>${L('Все статьи', 'All posts')}</a>
        ${used.map((c) => `<a href="/blog/category/${c.slug}/"${current === c.slug ? ' aria-current="page"' : ''}>${L(esc(c.name), esc(c.nameEn || c.name))}</a>`).join('\n        ')}
      </nav>`;
}

const ORG = { '@type': 'Organization', '@id': SITE + '/#org', name: 'VAK Marketing', url: SITE + '/' };

function listPage(sh, posts, cats, used) {
  const top = posts.find((p) => p.featured) || posts[0];
  const rest = posts.filter((p) => p !== top);
  const body = `  <main class="bl-main" id="main">
    <div class="wrap">
      <header class="bl-head">
        <p class="pv-eyebrow">VAK Marketing</p>
        <h1 class="pv-title">${L('Блог', 'Blog')}</h1>
        <p class="bl-lead">${L('Разборы, кейсы и заметки команды о маркетинге, PR и продвижении в iGaming, FinTech, Crypto и Web3.', 'Breakdowns, cases and team notes on marketing, PR and growth in iGaming, FinTech, Crypto and Web3.')}</p>
      </header>
      ${catNav(used, '')}
      <div class="bl-top">
        ${card(top, cats, true)}
      </div>
      ${rest.length ? `<div class="bl-grid">
        ${rest.map((p) => card(p, cats)).join('\n        ')}
      </div>` : ''}
    </div>
  </main>`;
  return page(sh, {
    title: 'Блог — VAK Marketing',
    description: 'Блог VAK Marketing: разборы, кейсы и заметки о маркетинге, PR и продвижении в iGaming, FinTech, Crypto и Web3.',
    canonical: SITE + '/blog/', ogType: 'website', ogImage: DEFAULT_OG, ogLocale: 'ru_RU', current: true, body,
    jsonld: { '@context': 'https://schema.org', '@graph': [
      { '@type': 'Blog', '@id': SITE + '/blog/#blog', name: 'Блог VAK Marketing', url: SITE + '/blog/', publisher: ORG, inLanguage: ['ru', 'en'],
        blogPost: posts.slice(0, 20).map((p) => ({ '@type': 'BlogPosting', headline: p.title, url: `${SITE}/blog/${p.slug}/`, datePublished: p.date })) },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'VAK Marketing', item: SITE + '/' },
        { '@type': 'ListItem', position: 2, name: 'Блог', item: SITE + '/blog/' }] }] }
  });
}

function categoryPage(sh, c, posts, cats, used) {
  const url = `${SITE}/blog/category/${c.slug}/`;
  const desc = c.description || `Статьи рубрики «${c.name}» в блоге VAK Marketing.`;
  const body = `  <main class="bl-main" id="main">
    <div class="wrap">
      <header class="bl-head">
        <nav class="bl-crumbs" aria-label="Навигация"><a href="/blog/">${L('Блог', 'Blog')}</a></nav>
        <h1 class="pv-title">${L(esc(c.name), esc(c.nameEn || c.name))}</h1>
        ${c.description ? `<p class="bl-lead">${esc(c.description)}</p>` : ''}
      </header>
      ${catNav(used, c.slug)}
      <div class="bl-grid">
        ${posts.map((p) => card(p, cats)).join('\n        ')}
      </div>
    </div>
  </main>`;
  return page(sh, {
    title: `${c.name} — блог VAK Marketing`, description: desc, canonical: url, ogType: 'website', ogImage: DEFAULT_OG,
    ogLocale: 'ru_RU', current: true, body,
    jsonld: { '@context': 'https://schema.org', '@graph': [
      { '@type': 'CollectionPage', '@id': url, name: c.name, description: desc, url, isPartOf: { '@id': SITE + '/blog/#blog' },
        hasPart: posts.slice(0, 20).map((p) => ({ '@type': 'BlogPosting', headline: p.title, url: `${SITE}/blog/${p.slug}/` })) },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'VAK Marketing', item: SITE + '/' },
        { '@type': 'ListItem', position: 2, name: 'Блог', item: SITE + '/blog/' },
        { '@type': 'ListItem', position: 3, name: c.name, item: url }] }] }
  });
}

function postPage(sh, p, posts, cats) {
  const lang = p.lang === 'en' ? 'en' : 'ru';
  const url = `${SITE}/blog/${p.slug}/`;
  const img = coverSrc(p), c = cats[p.category];
  const t = toc(videos(clean(p.html)));
  const min = readMin(p.html);
  const same = posts.filter((x) => x.slug !== p.slug && p.category && x.category === p.category);
  const more = same.concat(posts.filter((x) => x.slug !== p.slug && !same.includes(x))).slice(0, 3);
  const share = encodeURIComponent(url), title = encodeURIComponent(p.title);
  const body = `  <main class="bl-main" id="main">
    <article class="wrap bl-post">
      <nav class="bl-crumbs" aria-label="Навигация"><a href="/blog/">${L('Блог', 'Blog')}</a>${c ? `<span aria-hidden="true">/</span><a href="/blog/category/${c.slug}/">${L(esc(c.name), esc(c.nameEn || c.name))}</a>` : ''}</nav>
      <div lang="${lang}">
        <h1 class="bl-title">${esc(p.title)}</h1>
        <p class="bl-meta"><time datetime="${esc(p.date)}">${humanDate(p.date, lang)}</time><span>${lang === 'en' ? min + ' min read' : min + ' мин чтения'}</span></p>
        ${p.description ? `<p class="bl-intro">${esc(p.description)}</p>` : ''}
        ${img ? `<figure class="bl-cover"><img src="${esc(img)}" alt="${esc(p.coverAlt || '')}" width="1600" height="900" fetchpriority="high" decoding="async"></figure>` : ''}
        ${t.items.length ? `<nav class="bl-toc" aria-label="${lang === 'en' ? 'Contents' : 'Содержание'}">
          <p>${lang === 'en' ? 'Contents' : 'Содержание'}</p>
          <ol>${t.items.map((i) => `<li><a href="#${i.id}">${esc(i.title)}</a></li>`).join('')}</ol>
        </nav>` : ''}
        <div class="bl-prose">
${t.html}
        </div>
      </div>
      <div class="bl-share">
        <span>${L('Поделиться', 'Share')}</span>
        <a href="https://t.me/share/url?url=${share}&amp;text=${title}" target="_blank" rel="noopener">Telegram</a>
        <a href="https://www.linkedin.com/sharing/share-offsite/?url=${share}" target="_blank" rel="noopener">LinkedIn</a>
        <a href="https://wa.me/?text=${title}%20${share}" target="_blank" rel="noopener">WhatsApp</a>
        <button type="button" data-copy="${url}">${L('Скопировать ссылку', 'Copy link')}</button>
      </div>
      <aside class="bl-cta">
        <p>${L('Хотите так же для своего проекта? Расскажите о задаче, предложим первые шаги.', 'Want the same for your project? Tell us about the task and we will suggest the first steps.')}</p>
        <a class="btn btn--primary" href="/#contact">${L('Получить консультацию', 'Book a consultation')}</a>
      </aside>
    </article>
    ${more.length ? `<section class="wrap bl-more" aria-labelledby="bl-more-h">
      <h2 id="bl-more-h">${same.length ? L('Ещё в рубрике', 'More in this topic') : L('Читайте также', 'Read next')}</h2>
      <div class="bl-grid">
        ${more.map((x) => card(x, cats)).join('\n        ')}
      </div>
    </section>` : ''}
  </main>`;
  const description = p.description || text(p.html).slice(0, 158);
  const crumbs = [{ '@type': 'ListItem', position: 1, name: 'VAK Marketing', item: SITE + '/' },
    { '@type': 'ListItem', position: 2, name: 'Блог', item: SITE + '/blog/' }];
  if (c) crumbs.push({ '@type': 'ListItem', position: 3, name: c.name, item: `${SITE}/blog/category/${c.slug}/` });
  crumbs.push({ '@type': 'ListItem', position: crumbs.length + 1, name: p.title, item: url });
  return page(sh, {
    title: `${p.seoTitle || p.title} — VAK Marketing`, description, canonical: url, ogType: 'article',
    ogImage: p.cover ? absUrl(p.cover) : DEFAULT_OG, ogLocale: lang === 'en' ? 'en_US' : 'ru_RU', body,
    jsonld: { '@context': 'https://schema.org', '@graph': [
      { '@type': 'BlogPosting', '@id': url + '#post', headline: p.seoTitle || p.title, description, url, mainEntityOfPage: url,
        datePublished: p.date, dateModified: String(p.updated || p.date).slice(0, 10), inLanguage: lang, wordCount: words(p.html),
        timeRequired: `PT${min}M`, ...(c ? { articleSection: c.name } : {}),
        image: p.cover ? absUrl(p.cover) : DEFAULT_OG, author: ORG, publisher: ORG, isPartOf: { '@id': SITE + '/blog/#blog' } },
      { '@type': 'BreadcrumbList', itemListElement: crumbs }] }
  });
}

function feed(posts, cats) {
  const items = posts.slice(0, 30).map((p) => `    <item>
      <title>${esc(p.title)}</title>${cats[p.category] ? `\n      <category>${esc(cats[p.category].name)}</category>` : ''}
      <link>${SITE}/blog/${p.slug}/</link>
      <guid>${SITE}/blog/${p.slug}/</guid>
      <pubDate>${new Date(p.date + 'T09:00:00Z').toUTCString()}</pubDate>
      <description>${esc(p.description || '')}</description>
    </item>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Блог VAK Marketing</title>
    <link>${SITE}/blog/</link>
    <description>Разборы, кейсы и заметки о маркетинге в iGaming, FinTech, Crypto и Web3.</description>
    <language>ru</language>
${items}
  </channel>
</rss>
`;
}

/* ---------- включение пунктов «Блог» в собранном сайте ---------- */
function enableNav() {
  // headerOnly: менять только до </header>, чтобы не задеть подвал.
  const patch = (rel, from, to, headerOnly) => {
    const p = path.join(OUT, rel);
    if (!fs.existsSync(p)) return;
    const s = read(p);
    const cut = headerOnly ? s.indexOf('</header>') : s.length;
    const head = s.slice(0, cut), tail = s.slice(cut);
    const n = head.split(from).length - 1;
    if (n) write(p, head.split(from).join(to) + tail);
    console.log(`nav ${rel}: ${n}`);
  };
  patch('index.html', 'href="#" data-soon data-i18n="nav.blog"', 'href="/blog/" data-i18n="nav.blog"');
  patch('assets/js/service-page.js', "['#', language === 'en' ? 'Blog' : 'Блог', true]", "['/blog/', language === 'en' ? 'Blog' : 'Блог']");
  patch('privacy/index.html', '<a href="/#contact"><span data-l="ru">Контакты</span>', BLOG_LINK + '<a href="/#contact"><span data-l="ru">Контакты</span>', true);
}

function sitemap(posts, used) {
  const p = path.join(OUT, 'sitemap.xml');
  if (!fs.existsSync(p)) return;
  const day = (x) => String(x.updated || x.date).slice(0, 10);
  const last = posts.reduce((m, x) => (day(x) > m ? day(x) : m), '');
  const urls = [`  <url><loc>${SITE}/blog/</loc><lastmod>${last}</lastmod></url>`]
    .concat(used.map((c) => `  <url><loc>${SITE}/blog/category/${c.slug}/</loc><lastmod>${posts.filter((x) => x.category === c.slug).reduce((m, x) => (day(x) > m ? day(x) : m), '')}</lastmod></url>`))
    .concat(posts.map((x) => `  <url><loc>${SITE}/blog/${x.slug}/</loc><lastmod>${day(x)}</lastmod></url>`));
  write(p, read(p).replace('</urlset>', urls.join('\n') + '\n</urlset>'));
}

const posts = loadPosts();
const catList = loadCategories();
const cats = Object.fromEntries(catList.map((c) => [c.slug, c]));
console.log(`blog: ${posts.length} published, ${catList.length} categories`);
if (posts.length) {
  const sh = shell();
  const used = usedCats(posts, catList);
  write(path.join(OUT, 'blog/index.html'), listPage(sh, posts, cats, used));
  posts.forEach((p) => write(path.join(OUT, 'blog', p.slug, 'index.html'), postPage(sh, p, posts, cats)));
  used.forEach((c) => write(path.join(OUT, 'blog/category', c.slug, 'index.html'), categoryPage(sh, c, posts.filter((p) => p.category === c.slug), cats, used)));
  write(path.join(OUT, 'blog/feed.xml'), feed(posts, cats));
  const media = path.join(SRC, 'media');
  if (fs.existsSync(media)) fs.cpSync(media, path.join(OUT, 'blog/media'), { recursive: true });
  sitemap(posts, used);
  enableNav();
}
