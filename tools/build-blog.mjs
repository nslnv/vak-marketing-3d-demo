// Сборка блога vakmarketing.com. Запускается в GitHub Actions после копирования site-3d:
//   node tools/build-blog.mjs _site/site-3d
// Берёт статьи из content/blog/<slug>.json (их пишет админка /admin/ через Apps Script,
// см. docs/leads-telegram/Blog.gs) и делает в собранном сайте:
//   blog/index.html, blog/<slug>/index.html, blog/feed.xml, blog/media/* и записи в sitemap.xml.
// Шапка, подвал и счётчики берутся из privacy/index.html, чтобы блог не расходился с сайтом.
// Пока опубликованных статей нет, блог не собирается и пункты «Блог» в меню остаются «скоро»;
// с первой статьёй сборка включает их на главной, на страницах услуг и в политике.
import fs from 'node:fs';
import path from 'node:path';

const OUT = process.argv[2] || '_site/site-3d';
const SRC = 'content/blog';
const SITE = 'https://vakmarketing.com';
const DEFAULT_OG = SITE + '/assets/img/og-v6.jpg';

const read = (p) => fs.readFileSync(p, 'utf8');
const write = (p, s) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); };
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function loadPosts() {
  if (!fs.existsSync(SRC)) return [];
  return fs.readdirSync(SRC).filter((f) => f.endsWith('.json')).map((f) => {
    try { return JSON.parse(read(path.join(SRC, f))); } catch (e) { console.warn('skip', f, e.message); return null; }
  }).filter((p) => p && p.status === 'published' && /^[a-z0-9-]+$/.test(p.slug || '') && p.title)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

// Вторая линия защиты: админка и Apps Script уже чистят HTML, здесь вырезаем исполняемое.
function clean(html) {
  return String(html || '')
    .replace(/<(script|style|iframe|object|embed|form)[\s\S]*?<\/\1>/gi, '')
    .replace(/<(script|style|iframe|object|embed|form|input|button)[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*"\s*javascript:[^"]*"/gi, '$1="#"');
}

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
  <link rel="stylesheet" href="/assets/css/blog.css?v=20261102-1">
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
  <script src="/assets/js/blog.js?v=20261102-1" defer></script>
</body>
</html>
`;
}

function card(p) {
  const img = coverSrc(p);
  return `<a class="bl-card" href="/blog/${p.slug}/" lang="${p.lang === 'en' ? 'en' : 'ru'}">
          ${img ? `<span class="bl-card__img"><img src="${esc(img)}" alt="${esc(p.coverAlt || '')}" width="1600" height="900" loading="lazy" decoding="async"></span>` : '<span class="bl-card__img bl-card__img--none" aria-hidden="true"></span>'}
          <span class="bl-card__meta"><time datetime="${esc(p.date)}">${humanDate(p.date, p.lang)}</time>${p.lang === 'en' ? ' · EN' : ''}</span>
          <span class="bl-card__title">${esc(p.title)}</span>
          ${p.description ? `<span class="bl-card__desc">${esc(p.description)}</span>` : ''}
        </a>`;
}

const ORG = { '@type': 'Organization', '@id': SITE + '/#org', name: 'VAK Marketing', url: SITE + '/' };

function listPage(sh, posts) {
  const body = `  <main class="bl-main" id="main">
    <div class="wrap">
      <header class="bl-head">
        <p class="pv-eyebrow">VAK Marketing</p>
        <h1 class="pv-title"><span data-l="ru">Блог</span><span data-l="en">Blog</span></h1>
        <p class="bl-lead"><span data-l="ru">Разборы, кейсы и заметки команды о маркетинге, PR и продвижении в iGaming, FinTech, Crypto и Web3.</span><span data-l="en">Breakdowns, cases and team notes on marketing, PR and growth in iGaming, FinTech, Crypto and Web3.</span></p>
      </header>
      <div class="bl-grid">
        ${posts.map(card).join('\n        ')}
      </div>
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

function postPage(sh, p, posts) {
  const lang = p.lang === 'en' ? 'en' : 'ru';
  const url = `${SITE}/blog/${p.slug}/`;
  const img = coverSrc(p);
  const more = posts.filter((x) => x.slug !== p.slug).slice(0, 3);
  const body = `  <main class="bl-main" id="main">
    <article class="wrap bl-post">
      <nav class="bl-crumbs" aria-label="Навигация"><a href="/blog/"><span data-l="ru">Блог</span><span data-l="en">Blog</span></a></nav>
      <div lang="${lang}">
        <h1 class="bl-title">${esc(p.title)}</h1>
        <p class="bl-meta"><time datetime="${esc(p.date)}">${humanDate(p.date, lang)}</time></p>
        ${img ? `<figure class="bl-cover"><img src="${esc(img)}" alt="${esc(p.coverAlt || '')}" width="1600" height="900" fetchpriority="high" decoding="async"></figure>` : ''}
        <div class="bl-prose">
${clean(p.html)}
        </div>
      </div>
      <aside class="bl-cta">
        <p><span data-l="ru">Хотите так же для своего проекта? Расскажите о задаче, предложим первые шаги.</span><span data-l="en">Want the same for your project? Tell us about the task and we will suggest the first steps.</span></p>
        <a class="btn btn--primary" href="/#contact"><span data-l="ru">Получить консультацию</span><span data-l="en">Book a consultation</span></a>
      </aside>
    </article>
    ${more.length ? `<section class="wrap bl-more" aria-labelledby="bl-more-h">
      <h2 id="bl-more-h"><span data-l="ru">Ещё в блоге</span><span data-l="en">More from the blog</span></h2>
      <div class="bl-grid">
        ${more.map(card).join('\n        ')}
      </div>
    </section>` : ''}
  </main>`;
  const description = p.description || String(p.html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 158);
  return page(sh, {
    title: `${p.title} — VAK Marketing`, description, canonical: url, ogType: 'article',
    ogImage: p.cover ? absUrl(p.cover) : DEFAULT_OG, ogLocale: lang === 'en' ? 'en_US' : 'ru_RU', body,
    jsonld: { '@context': 'https://schema.org', '@graph': [
      { '@type': 'BlogPosting', '@id': url + '#post', headline: p.title, description, url, mainEntityOfPage: url,
        datePublished: p.date, dateModified: p.updated || p.date, inLanguage: lang,
        image: p.cover ? absUrl(p.cover) : DEFAULT_OG, author: ORG, publisher: ORG, isPartOf: { '@id': SITE + '/blog/#blog' } },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'VAK Marketing', item: SITE + '/' },
        { '@type': 'ListItem', position: 2, name: 'Блог', item: SITE + '/blog/' },
        { '@type': 'ListItem', position: 3, name: p.title, item: url }] }] }
  });
}

function feed(posts) {
  const items = posts.slice(0, 30).map((p) => `    <item>
      <title>${esc(p.title)}</title>
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

function sitemap(posts) {
  const p = path.join(OUT, 'sitemap.xml');
  if (!fs.existsSync(p)) return;
  const last = posts.reduce((m, x) => ((x.updated || x.date) > m ? (x.updated || x.date) : m), '');
  const urls = [`  <url><loc>${SITE}/blog/</loc><lastmod>${last}</lastmod></url>`]
    .concat(posts.map((x) => `  <url><loc>${SITE}/blog/${x.slug}/</loc><lastmod>${(x.updated || x.date).slice(0, 10)}</lastmod></url>`));
  write(p, read(p).replace('</urlset>', urls.join('\n') + '\n</urlset>'));
}

const posts = loadPosts();
console.log(`blog: ${posts.length} published`);
if (posts.length) {
  const sh = shell();
  write(path.join(OUT, 'blog/index.html'), listPage(sh, posts));
  posts.forEach((p) => write(path.join(OUT, 'blog', p.slug, 'index.html'), postPage(sh, p, posts)));
  write(path.join(OUT, 'blog/feed.xml'), feed(posts));
  const media = path.join(SRC, 'media');
  if (fs.existsSync(media)) fs.cpSync(media, path.join(OUT, 'blog/media'), { recursive: true });
  sitemap(posts);
  enableNav();
}
