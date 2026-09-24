/* ==========================================================================
   VAK Marketing — мобильный слой страниц услуг (до 900 px).
   Страницу строит service-page.js и целиком перерисовывает при смене языка,
   поэтому этот слой только дополняет готовую разметку и повторяет это после
   каждой перерисовки (MutationObserver). Структуру блоков не переставляет:
   на широком экране всё добавленное скрыто, а классы ни на что не влияют.
   Анимации — transform, opacity и CSS-переменные, один rAF на кадр.
   ========================================================================== */
(function () {
  'use strict';
  var mq = matchMedia('(max-width:900px)');
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var key = document.body.getAttribute('data-service');
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var en = function () { return document.documentElement.lang === 'en'; };
  var t = function (ru, eng) { return en() ? eng : ru; };
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };

  var SERVICES = [
    { k: 'strategy', ru: 'Стратегия и комплексное ведение', en: 'Strategy and full-service delivery', sr: 'Стратегия', se: 'Strategy' },
    { k: 'linkedin', ru: 'B2B-маркетинг и LinkedIn', en: 'B2B marketing and LinkedIn', sr: 'LinkedIn', se: 'LinkedIn' },
    { k: 'pr', ru: 'PR, СМИ и SERP', en: 'PR, media and SERP', sr: 'PR', se: 'PR' },
    { k: 'seo', ru: 'AI SEO', en: 'AI SEO', sr: 'AI SEO', se: 'AI SEO' },
    { k: 'localization', ru: 'Перевод и локализация', en: 'Translation and localisation', sr: 'Перевод', se: 'Translation' }
  ];

  /* ---------- шапка и меню: та же подача, что на главной ---------- */
  function enhanceNav() {
    var burger = $('#burger'), menu = $('#menu');
    if (!burger || !menu || menu.getAttribute('data-m')) return;
    menu.setAttribute('data-m', '1');
    burger.insertAdjacentHTML('beforeend',
      '<b class="burger__t burger__t--open">' + t('Меню', 'Menu') + '</b>' +
      '<b class="burger__t burger__t--close">' + t('Закрыть', 'Close') + '</b>');
    var lang = en() ? 'en' : 'ru';
    menu.innerHTML =
      '<div class="menu__svc"><a class="menu__svc-h" href="/#services">' + t('Услуги', 'Services') + '</a>' +
      '<div class="menu__svc-row">' + SERVICES.map(function (s) {
        return '<a href="/' + s.k + '/"' + (s.k === key ? ' aria-current="page"' : '') + '><img src="/assets/img/services/thumb/' + s.k +
          '.webp" width="84" height="84" alt="" loading="lazy" decoding="async"><span>' + t(s.sr, s.se) + '</span></a>';
      }).join('') + '</div></div>' +
      '<nav class="menu__links" aria-label="' + t('Мобильная навигация', 'Mobile navigation') + '">' + [
        ['/#about', 'О нас', 'About'], ['/#cases', 'Кейсы', 'Cases'], ['/#clients', 'Клиенты', 'Clients'],
        ['/#founder', 'Основатель', 'Founder'], ['/#team', 'Команда', 'Team'], ['/#contact', 'Контакты', 'Contacts']
      ].map(function (l) { return '<a href="' + l[0] + '">' + t(l[1], l[2]) + '</a>'; }).join('') + '</nav>' +
      '<div class="menu__foot"><div class="menu__soc"><a href="#" data-soon>Telegram</a><a href="#" data-soon>WhatsApp</a><a href="#" data-soon>LinkedIn</a></div>' +
      '<div class="lang lang--menu" role="group" aria-label="Язык / Language">' +
      '<button type="button" class="lang__b" data-lang="ru" aria-pressed="' + (lang === 'ru') + '">RU</button>' +
      '<button type="button" class="lang__b" data-lang="en" aria-pressed="' + (lang === 'en') + '">EN</button></div></div>' +
      '<a class="btn btn--primary" href="#spForm">' + t('Обсудить проект', 'Discuss your project') + '</a>';
    // Переключатель в меню нажимает основной: язык меняет service-page.js.
    $$('.lang--menu .lang__b', menu).forEach(function (b) {
      b.addEventListener('click', function () {
        var src = $('.nav__side .lang__b[data-lang="' + b.getAttribute('data-lang') + '"]');
        if (src) src.click();
      });
    });
  }

  /* ---------- ленты под свайп с полосой позиции ---------- */
  function rail(list) {
    if (list.classList.contains('m-rail')) return;
    list.classList.add('m-rail');
    var bar = document.createElement('div');
    bar.className = 'm-track';
    bar.setAttribute('aria-hidden', 'true');
    bar.appendChild(document.createElement('i'));
    list.insertAdjacentElement('afterend', bar);
    var ticking = false;
    function upd() {
      ticking = false;
      var max = list.scrollWidth - list.clientWidth;
      var share = list.scrollWidth ? Math.max(0.14, Math.min(1, list.clientWidth / list.scrollWidth)) : 1;
      var p = max > 0 ? list.scrollLeft / max : 0;
      bar.style.setProperty('--w', (share * 100).toFixed(2) + '%');
      bar.style.setProperty('--x', (p * (1 - share) / share * 100).toFixed(2) + '%');
    }
    list.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    requestAnimationFrame(upd);
  }

  /* ---------- раскрывающиеся списки: открыт один пункт ---------- */
  function accordion(list) {
    if (list.classList.contains('m-acc')) return;
    list.classList.add('m-acc');
    Array.prototype.forEach.call(list.children, function (item, i) {
      var h = $('h3', item);
      if (!h) return;
      item.classList.add('m-acc__i');
      if (i === 0) item.classList.add('is-open');
      h.setAttribute('role', 'button');
      h.setAttribute('tabindex', '0');
      h.setAttribute('aria-expanded', String(i === 0));
      function toggle() {
        var open = !item.classList.contains('is-open');
        Array.prototype.forEach.call(list.children, function (x) {
          x.classList.remove('is-open');
          var xh = $('h3', x); if (xh) xh.setAttribute('aria-expanded', 'false');
        });
        if (open) { item.classList.add('is-open'); h.setAttribute('aria-expanded', 'true'); }
      }
      h.addEventListener('click', function () { if (mq.matches) toggle(); });
      h.addEventListener('keydown', function (e) {
        if (mq.matches && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggle(); }
      });
    });
  }

  /* ---------- вкладки: одна фаза на экране, бегунок едет к выбранной ---------- */
  var SHORT = {
    'sp-formats': [['Проект', 'Project'], ['С сопровождением', 'With support'], ['Аудит', 'Audit'], ['С внедрением', 'With delivery']],
    'sp-seo-phases': [['Аудит', 'Audit'], ['Ядро', 'Core'], ['Реализация', 'Build'], ['Контроль', 'Control']],
    'sp-loc-groups': [['Контент', 'Content'], ['Продукт', 'Product'], ['Коммуникации', 'Comms'], ['Документы', 'Documents']]
  };
  function tabs(list, cls) {
    if (list.classList.contains('m-tabs')) return;
    var items = Array.prototype.slice.call(list.children);
    if (items.length < 2) return;
    list.classList.add('m-tabs');
    var seg = document.createElement('div');
    seg.className = 'm-seg';
    seg.setAttribute('role', 'tablist');
    seg.innerHTML = '<span class="m-seg__thumb" aria-hidden="true"></span>' + items.map(function (item, i) {
      var label = SHORT[cls] && SHORT[cls][i] ? t(SHORT[cls][i][0], SHORT[cls][i][1]) : ($('h3', item) || item).textContent.trim();
      return '<button type="button" role="tab" aria-selected="' + (i === 0) + '">' + label + '</button>';
    }).join('');
    list.insertAdjacentElement('beforebegin', seg);
    var btns = $$('button', seg), thumb = $('.m-seg__thumb', seg);
    function pick(i, first) {
      btns.forEach(function (b, j) { b.setAttribute('aria-selected', String(i === j)); b.classList.toggle('is-on', i === j); });
      items.forEach(function (item, j) { item.classList.toggle('m-tab-off', i !== j); item.classList.toggle('m-tab-on', i === j); });
      var b = btns[i];
      thumb.style.width = b.offsetWidth + 'px';
      thumb.style.transform = 'translateX(' + (b.offsetLeft - 4) + 'px)';
      if (!first) seg.scrollTo({ left: b.offsetLeft - 40, behavior: reduced ? 'auto' : 'smooth' });
    }
    btns.forEach(function (b, i) { b.addEventListener('click', function () { pick(i); }); });
    thumb.style.transition = 'none';
    pick(0, true);
    requestAnimationFrame(function () { pick(0, true); requestAnimationFrame(function () { thumb.style.transition = ''; }); });
  }

  /* ---------- этапы: линия заполняется прокруткой ---------- */
  function line(list) { list.classList.add('m-line'); }
  function paintLines() {
    var mark = innerHeight * 0.62;
    $$('.m-line').forEach(function (l) {
      var r = l.getBoundingClientRect();
      var p = reduced ? 1 : clamp((mark - r.top) / Math.max(1, r.height));
      l.style.setProperty('--m-p', p.toFixed(3));
      Array.prototype.forEach.call(l.children, function (li) {
        li.classList.toggle('is-on', li.getBoundingClientRect().top + 10 < mark || p >= 1);
      });
    });
  }

  /* ---------- калькулятор перевода по ценам со страницы ---------- */
  function calculator() {
    var host = $('.sp-rate-list');
    if (key !== 'localization' || !host || $('.m-calc')) return;
    var rates = $$('.sp-rate-list__item dd', host).map(function (dd) { var m = dd.textContent.match(/\d+/); return m ? +m[0] : 0; });
    if (rates.length < 3 || rates.some(function (r) { return !r; })) return;
    var el = document.createElement('div');
    el.className = 'm-calc';
    el.innerHTML =
      '<div class="m-seg m-seg--calc" role="tablist"><span class="m-seg__thumb" aria-hidden="true"></span>' +
      '<button type="button" role="tab" class="is-on" aria-selected="true">ENG–RU</button>' +
      '<button type="button" role="tab" aria-selected="false">CN–RU</button>' +
      '<button type="button" role="tab" aria-selected="false">' + t('Другие', 'Other') + '</button></div>' +
      '<p class="m-calc__sum"><span>' + t('от', 'from') + '</span><b>0</b><span>USD</span></p>' +
      '<p class="m-calc__sub"></p>' +
      '<label class="m-calc__range"><span>' + t('Объём', 'Volume') + ' <b></b></span><input type="range" min="1" max="60" value="10"></label>' +
      '<button type="button" class="m-calc__tg is-on" aria-pressed="true">' + t('Первый заказ: одна страница бесплатно при объёме от 10 страниц', 'First order: one page free from 10 pages') + '<i></i></button>' +
      '<button type="button" class="m-calc__tg" aria-pressed="false">' + t('Постоянный клиент: скидка 15% с пятого заказа', 'Regular client: 15% off from the fifth order') + '<i></i></button>' +
      '<p class="m-calc__note">' + t('Точную сумму подтверждаем после оценки объёма, направления и срока.', 'We confirm the exact price after reviewing volume, language pair and deadline.') + '</p>';
    host.insertAdjacentElement('afterend', el);
    var seg = $('.m-seg', el), btns = $$('button', seg), thumb = $('.m-seg__thumb', seg);
    var range = $('input', el), sum = $('.m-calc__sum b', el), sub = $('.m-calc__sub', el), vol = $('.m-calc__range b', el);
    var tgs = $$('.m-calc__tg', el), pair = 0, shown = 0, raf = 0;
    function pages(n) {
      if (en()) return n + (n === 1 ? ' page' : ' pages');
      var a = n % 10, b = n % 100;
      return n + (a === 1 && b !== 11 ? ' страница' : a >= 2 && a <= 4 && (b < 10 || b >= 20) ? ' страницы' : ' страниц');
    }
    function tween(to) {
      cancelAnimationFrame(raf);
      var from = shown, t0 = performance.now();
      (function step(now) {
        var k = reduced ? 1 : Math.min(1, (now - t0) / 380), e = 1 - Math.pow(1 - k, 3);
        shown = Math.round(from + (to - from) * e);
        sum.textContent = shown.toLocaleString(en() ? 'en-US' : 'ru-RU');
        if (k < 1) raf = requestAnimationFrame(step);
      })(t0);
    }
    function calc() {
      var n = +range.value, rate = rates[pair];
      var free = tgs[0].classList.contains('is-on') && n >= 10 ? 1 : 0, loyal = tgs[1].classList.contains('is-on');
      range.style.setProperty('--p', ((n - 1) / 59 * 100).toFixed(1) + '%');
      vol.textContent = pages(n);
      sub.textContent = t('от ', 'from ') + rate + t(' USD за страницу', ' USD per page') + (free ? t(', одна бесплатно', ', one free') : '') + (loyal ? t(', минус 15%', ', minus 15%') : '');
      tween(Math.round((n - free) * rate * (loyal ? 0.85 : 1)));
    }
    function pick(i) {
      pair = i;
      btns.forEach(function (b, j) { b.classList.toggle('is-on', i === j); b.setAttribute('aria-selected', String(i === j)); });
      thumb.style.width = btns[i].offsetWidth + 'px';
      thumb.style.transform = 'translateX(' + (btns[i].offsetLeft - 4) + 'px)';
      calc();
    }
    btns.forEach(function (b, i) { b.addEventListener('click', function () { pick(i); }); });
    tgs.forEach(function (b) { b.addEventListener('click', function () { b.classList.toggle('is-on'); b.setAttribute('aria-pressed', String(b.classList.contains('is-on'))); calc(); }); });
    range.addEventListener('input', calc);
    requestAnimationFrame(function () { pick(0); });
  }

  /* ---------- другие услуги в конце страницы ---------- */
  function others() {
    var main = $('#main');
    if (!main || $('.m-others', main)) return;
    var el = document.createElement('section');
    el.className = 'm-others';
    el.innerHTML = '<div class="wrap"><h2>' + t('Другие услуги', 'Other services') + '</h2><div class="m-others__row">' +
      SERVICES.filter(function (s) { return s.k !== key; }).map(function (s) {
        return '<a href="/' + s.k + '/"><img src="/assets/img/services/3d/' + s.k + '-object.jpg" width="1200" height="675" alt="" loading="lazy" decoding="async"><span>' + t(s.ru, s.en) + '</span></a>';
      }).join('') + '</div></div>';
    main.appendChild(el);
  }

  function enhanceMain() {
    if (!mq.matches || !$('#main .sp-hero')) return;
    ['.sp-proof', '.sp-decision-frame__items'].forEach(function (s) { $$(s).forEach(rail); });
    ['.sp-sectors', '.sp-strategy-gate__items'].forEach(function (s) { $$(s).forEach(accordion); });
    ['sp-formats', 'sp-seo-phases', 'sp-linkedin-phases', 'sp-loc-groups', 'sp-strategy-cycle'].forEach(function (c) {
      $$('.' + c).forEach(function (l) { tabs(l, c); });
    });
    ['.sp-pr-steps', '.sp-loc-steps'].forEach(function (s) { $$(s).forEach(line); });
    calculator();
    others();
    kick();
  }

  /* ---------- прокрутка: параллакс объекта и линии этапов ---------- */
  var ticking = false;
  function frame() {
    ticking = false;
    if (!mq.matches) return;
    var v = $('.sp-hero__visual');
    if (v && !reduced && scrollY < innerHeight * 1.2) v.style.setProperty('--m-par', (scrollY * 0.18).toFixed(1) + 'px');
    paintLines();
  }
  function kick() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', kick, { passive: true });

  function all() { enhanceNav(); enhanceMain(); }
  function watch() {
    var nav = $('#nav'), main = $('#main');
    if ('MutationObserver' in window) {
      if (nav) new MutationObserver(enhanceNav).observe(nav, { childList: true });
      if (main) new MutationObserver(enhanceMain).observe(main, { childList: true });
    }
    all();
  }
  if (mq.addEventListener) mq.addEventListener('change', function () { enhanceMain(); kick(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch); else watch();
})();
