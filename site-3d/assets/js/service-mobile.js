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
      }).join('') +
      '<a href="#" data-soon class="menu__svc-soon"><img src="/assets/img/services/thumb/course.webp" width="84" height="84" alt="" loading="lazy" decoding="async"><span>' +
      t('Курс', 'Course') + '</span><small>' + t('скоро', 'soon') + '</small></a></div></div>' +
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

  /* ---------- пункты поднимаются из лёгкого наклона, подходя к экрану ----------
     Срабатывает чуть раньше, чем пункт покажется, и быстро: при резкой
     прокрутке пустых мест не остаётся. Соседние пункты — с маленькой
     задержкой друг за другом. Объём без номеров и плашек (выбор 20.10). */
  var appearIO = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('m-show'); appearIO.unobserve(e.target); } });
  }, { rootMargin: '0px 0px 10% 0px', threshold: 0.01 }) : null;
  function appear(sel) {
    if (!appearIO) return;
    $$(sel).forEach(function (el) {
      if (el.__ap) return;
      el.__ap = 1;
      var idx = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.style.setProperty('--m-d', ((idx % 3) * 0.06).toFixed(2) + 's');
      el.classList.add('m-pre');
      appearIO.observe(el);
    });
  }

  /* ---------- этапы: линия заполняется прокруткой ---------- */
  function line(list) { list.classList.add('m-line'); }
  function paintLines() {
    // сначала все чтения, потом записи — без перерасчёта раскладки в цикле
    var mark = innerHeight * 0.62, jobs = [];
    $$('.m-line').forEach(function (l) {
      var r = l.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) return;
      jobs.push({ l: l, r: r, tops: Array.prototype.map.call(l.children, function (li) { return li.getBoundingClientRect().top; }) });
    });
    jobs.forEach(function (j) {
      // Линия растёт за прокруткой и при «Уменьшить движение»: её ведёт сам человек.
      var p = clamp((mark - j.r.top) / Math.max(1, j.r.height));
      j.l.style.setProperty('--m-p', p.toFixed(3));
      Array.prototype.forEach.call(j.l.children, function (li, i) {
        var on = j.tops[i] + 10 < mark || p >= 1;
        if (li.__on !== on) { li.__on = on; li.classList.toggle('is-on', on); }
      });
    });
  }

  /* ---------- «световой путь» (стратегия, телефон) ----------
     Мотив 3D-объекта стратегии: луч света поднимается через слои к светящимся
     кольцам. Слева от списка — тонкая дорожка; по ней прокруткой идёт луч с
     искрой на конце, узлы пройденных пунктов загораются, текущий мягко
     пульсирует, его заголовок — градиентом. В раскрывающихся списках луч
     доходит до открытого пункта. Без номеров и плашек (просьба 20.10). */
  var beams = [], rng = document.createRange();
  function beam(list, follow) {
    if (!list || list.__beam) return;
    list.__beam = 1;
    list.classList.add('m-beam');
    if (follow) list.classList.add('m-beam--open');
    var spark = document.createElement('i');
    spark.className = 'm-beam__spark';
    spark.setAttribute('aria-hidden', 'true');
    list.insertBefore(spark, list.firstChild);
    // У пунктов дорожки своё появление (загорание точек), подъём из наклона
    // им не нужен: он сдвигал пункты, пока шёл замер.
    Array.prototype.forEach.call(list.children, function (x) { x.__ap = 1; x.classList.remove('m-pre'); });
    beams.push({ l: list, s: spark, follow: !!follow, y: -1, cur: -2 });
    if (follow) {
      list.addEventListener('toggle', kick, true);
      list.addEventListener('click', function () { setTimeout(kick, 0); });
    }
  }
  function paintBeams() {
    beams = beams.filter(function (b) { return b.l.isConnected; });
    var mark = innerHeight * 0.62, jobs = [];
    beams.forEach(function (b) {
      var r = b.l.getBoundingClientRect();
      if (!r.height || r.bottom < -200 || r.top > innerHeight + 200) return;
      var items = Array.prototype.filter.call(b.l.children, function (x) { return x !== b.s; });
      // Точка — по центру первой строки заголовка пункта (у раскрывающихся
      // пунктов заголовок стоит по центру высокой строки).
      var nodes = items.map(function (x) {
        var h = $('h3, h4, dt', x), ir = x.getBoundingClientRect();
        if (!h) return { t: x.offsetTop, n: 14 };
        rng.selectNodeContents(h);
        var line = rng.getClientRects()[0] || h.getBoundingClientRect();
        return { t: x.offsetTop, n: Math.round((line.top + line.bottom) / 2 - ir.top) };
      });
      jobs.push({ b: b, r: r, items: items, nodes: nodes });
    });
    jobs.forEach(function (j) {
      var b = j.b, H = j.r.height, cur = -1, y;
      var at = function (i) { return j.nodes[i].t + j.nodes[i].n; };
      if (b.follow) {
        j.items.forEach(function (x, i) { if (x.open || x.classList.contains('is-open')) cur = i; });
        y = cur < 0 ? at(0) : at(cur);
      } else {
        y = clamp((mark - j.r.top) / H) * H;
        j.items.forEach(function (x, i) { if (at(i) <= y + 1) cur = i; });
      }
      y = Math.round(y);
      var first = j.items.length ? at(0) : 0;
      if (b.first !== first) { b.first = first; b.l.style.setProperty('--m-top', first + 'px'); }
      if (b.y !== y) {
        b.y = y;
        b.l.style.setProperty('--m-y', y + 'px');
        b.s.style.transform = 'translate3d(0,' + y + 'px,0)';
        b.s.style.opacity = cur < 0 ? '0' : '1';
      }
      j.items.forEach(function (x, i) {
        if (x.__n !== j.nodes[i].n) { x.__n = j.nodes[i].n; x.style.setProperty('--m-n', j.nodes[i].n + 'px'); }
        var on = i <= cur;
        if (x.__on !== on) { x.__on = on; x.classList.toggle('is-on', on); }
        var c = i === cur;
        if (x.__cur !== c) { x.__cur = c; x.classList.toggle('is-cur', c); }
      });
    });
  }

  /* ---------- «барабан» (стратегия, «Как собираем результат») ----------
     Пункты стоят как на колесе выбора: тот, что в середине экрана, прямой и
     яркий, с градиентным заголовком; выше и ниже — отклонены в перспективе и
     приглушены. Всё ведёт прокрутка. */
  var drums = [];
  function drum(list) {
    if (!list || list.__drum) return;
    list.__drum = 1;
    list.classList.add('m-drum');
    Array.prototype.forEach.call(list.children, function (x) { x.__ap = 1; x.classList.remove('m-pre'); });
    drums.push(list);
  }
  function paintDrums() {
    drums = drums.filter(function (l) { return l.isConnected; });
    var mid = innerHeight * 0.5, span = innerHeight * 0.42, jobs = [];
    drums.forEach(function (l) {
      var r = l.getBoundingClientRect();
      if (!r.height || r.bottom < -100 || r.top > innerHeight + 100) return;
      jobs.push({ items: Array.prototype.slice.call(l.children), top: r.top });
    });
    jobs.forEach(function (j) {
      var cs = j.items.map(function (x) { return j.top + x.offsetTop + x.offsetHeight / 2; });
      j.items.forEach(function (x, i) {
        var d = Math.max(-1, Math.min(1, (cs[i] - mid) / span));
        d = Math.round(d * 100) / 100;
        if (x.__d === d) return;
        x.__d = d;
        x.style.setProperty('--dz', d);
        x.style.setProperty('--da', Math.abs(d));
        var f = Math.abs(d) < 0.22;
        if (x.__f !== f) { x.__f = f; x.classList.toggle('is-focus', f); }
      });
    });
  }

  /* ---------- заливка заголовков прокруткой ----------
     Заголовок пункта сначала приглушённый; поднимаясь к середине экрана, он
     слева направо заливается градиентом страницы, текст под ним проявляется.
     Назад — обратно. */
  var fills = [];
  function fillTitles(list) {
    if (!list || list.__fill) return;
    list.__fill = 1;
    list.classList.add('m-fill');
    fills.push(list);
  }
  function paintFills() {
    fills = fills.filter(function (l) { return l.isConnected; });
    var vh = innerHeight, jobs = [];
    fills.forEach(function (l) {
      var r = l.getBoundingClientRect();
      if (!r.height || r.bottom < -100 || r.top > vh + 100) return;
      jobs.push({ items: Array.prototype.slice.call(l.children), top: r.top });
    });
    jobs.forEach(function (j) {
      var tops = j.items.map(function (x) { return j.top + x.offsetTop; });
      j.items.forEach(function (x, i) {
        var q = Math.round(clamp((vh * 0.82 - tops[i]) / (vh * 0.3)) * 100) / 100;
        if (x.__q !== q) { x.__q = q; x.style.setProperty('--fill', q); }
      });
    });
  }

  /* ---------- воронка LinkedIn собирается прокруткой ----------
     Кольца по очереди опускаются на место сверху из лёгкого наклона, каждое
     при посадке коротко вспыхивает своим цветом. Обратная прокрутка
     разбирает воронку назад. Работает там, где воронка стоит над списком. */
  var funnelStack = null;
  function funnel() {
    var st = $('.sp-linkedin-funnel__stack');
    if (!st || st === funnelStack) return;
    funnelStack = st;
    st.classList.add('m-build');
  }
  function paintFunnel() {
    var st = funnelStack;
    if (!st || !st.isConnected || !st.offsetParent) return;
    var r = st.getBoundingClientRect(), vh = innerHeight;
    if (r.bottom < -100 || r.top > vh + 100) return;
    // Сборка идёт, пока верх воронки поднимается от низа экрана до трети
    // высоты: к концу вся воронка на экране.
    var p = clamp((vh * 0.92 - r.top) / (vh * 0.55));
    var shapes = st.children, n = shapes.length, lag = 0.55 / Math.max(1, n - 1);
    for (var k = 0; k < n; k++) {
      var q = Math.round(clamp((p - k * lag) / 0.45) * 1000) / 1000, el = shapes[k];
      if (el.__q === q) continue;
      el.__q = q;
      var e = 1 - Math.pow(1 - q, 3);
      el.style.opacity = e.toFixed(3);
      el.style.transform = q >= 1 ? 'none'
        : 'translate3d(0,' + ((1 - e) * -70).toFixed(1) + 'px,0) rotateX(' + ((1 - e) * 60).toFixed(1) + 'deg) scale(' + (0.88 + 0.12 * e).toFixed(3) + ')';
      var landed = q >= 1;
      if (el.__l !== landed) { el.__l = landed; el.classList.toggle('is-landed', landed); }
    }
  }

  /* ---------- PR на компьютере (просьба 20.10) ----------
     Первый экран, медиасеть и форму не трогаем. Остальные блоки — каждый со
     своим движением по прокрутке:
     • «Публикация с долгосрочным эффектом» — по ряду проходит свет: линии
       прорисовываются, заголовки заливаются градиентом по очереди;
     • «Материал работает не сам по себе» — подсветка идёт по цепочке шаг за
       шагом, стрелки за ней горят;
     • «От повода к опубликованному материалу» — линия этапов, как на
       телефоне, только горизонтальная: растёт, точки заливаются;
     • «Когда рынку важны…» — метки каждой отрасли выезжают по очереди. */
  var desk = [];
  function deskReg(list, cls, kind) {
    if (!list || list['__' + kind]) return;
    list['__' + kind] = 1;
    list.classList.add(cls);
    desk.push({ l: list, kind: kind });
  }
  function paintDesk() {
    desk = desk.filter(function (d) { return d.l.isConnected; });
    var vh = innerHeight, jobs = [];
    desk.forEach(function (d) {
      var r = d.l.getBoundingClientRect();
      if (!r.height || r.bottom < -100 || r.top > vh + 100) return;
      jobs.push({ d: d, r: r, items: Array.prototype.slice.call(d.l.children), lefts: d.kind === 'hline' ? Array.prototype.map.call(d.l.children, function (x) { return x.offsetLeft; }) : null });
    });
    jobs.forEach(function (j) {
      var n = j.items.length, p, cur;
      if (j.d.kind === 'sweep') {
        p = clamp((vh * 0.88 - j.r.top) / (vh * 0.5));
        j.items.forEach(function (x, k) {
          var q = Math.round(clamp((p - k * (0.6 / Math.max(1, n - 1))) / 0.4) * 100) / 100;
          if (x.__q !== q) { x.__q = q; x.style.setProperty('--fill', q); }
        });
      } else if (j.d.kind === 'walk') {
        p = clamp((vh * 0.8 - j.r.top) / (vh * 0.45));
        cur = p <= 0.02 ? -1 : Math.min(n - 1, Math.floor(p * n * 0.999));
        j.items.forEach(function (x, i) {
          var on = i <= cur, c = i === cur;
          if (x.__on !== on) { x.__on = on; x.classList.toggle('is-on', on); }
          if (x.__cur !== c) { x.__cur = c; x.classList.toggle('is-cur', c); }
        });
      } else if (j.d.kind === 'hline') {
        p = Math.round(clamp((vh * 0.8 - j.r.top) / (vh * 0.45)) * 1000) / 1000;
        if (j.d.p !== p) { j.d.p = p; j.d.l.style.setProperty('--p', p); }
        var W = j.r.width, wide = n > 1 && j.lefts[n - 1] > j.lefts[0];
        j.items.forEach(function (x, i) {
          var on = wide && j.lefts[i] > 0 ? p * W >= j.lefts[i] - 2 : p >= i / n;
          if (i === 0) on = p > 0.01;
          if (x.__on !== on) { x.__on = on; x.classList.toggle('is-on', on); }
        });
      }
    });
  }
  var DESK = {
    strategy: function () {
      deskReg($('.sp-decision-frame__items'), 'd-sweep', 'sweep');
      drum($('.sp-strategy-deliverables'));
      deskReg($('.sp-strategy-cycle'), 'd-walk', 'walk');
    },
    linkedin: function () {
      deskReg($('.sp-proof'), 'd-sweep', 'sweep');
      deskReg($('.sp-linkedin-icp'), 'd-hline', 'hline');
      deskReg($('.sp-linkedin-phases'), 'd-walk', 'walk');
    },
    pr: function () {
      deskReg($('.sp-proof'), 'd-sweep', 'sweep');
      drum($('.sp-index'));
      deskReg($('.sp-pr-chain'), 'd-walk', 'walk');
      deskReg($('.sp-pr-steps'), 'd-hline', 'hline');
      cascade('.sp-sector--tagged');
    },
    seo: function () {
      deskReg($('.sp-proof'), 'd-sweep', 'sweep');
      deskReg($('.sp-seo-steps'), 'd-walk', 'walk');
    },
    localization: function () {
      deskReg($('.sp-proof'), 'd-sweep', 'sweep');
      drum($('.sp-index'));
      deskReg($('.sp-loc-relay'), 'd-hline', 'hline');
      deskReg($('.sp-loc-steps'), 'd-walk', 'walk');
    }
  };
  var cascadeIO = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('d-in'); cascadeIO.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.2 }) : null;
  function cascade(sel) {
    $$(sel).forEach(function (el) {
      if (el.__cas) return;
      el.__cas = 1;
      $$('.sp-sector__tags li', el).forEach(function (li, i) { li.style.setProperty('--t-d', (0.12 + i * 0.08).toFixed(2) + 's'); });
      el.classList.add('d-cascade');
      if (cascadeIO) cascadeIO.observe(el); else el.classList.add('d-in');
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
    if (!$('#main .sp-hero')) return;
    // Калькулятор перевода — и на телефоне, и на компьютере (правки ч. 4).
    calculator();
    // «Доверие» — бегущая лента, как «Нам доверяют» на главной, на любой ширине.
    if (window.vakRing) $$('#main [data-sp-ring]').forEach(function (el) {
      if (!el.__ring) el.__ring = window.vakRing(el, el.querySelector('.ring__set')) || true;
    });
    // Компьютер: по 2–4 блока на страницу, у каждого своё движение по прокрутке
    // (просьба 20.10 «в меру»). Первые экраны, ленты «Доверие», медиасеть,
    // формы, калькулятор и воронку не трогаем.
    if (!mq.matches && DESK[key]) { DESK[key](); kick(); }
    if (!mq.matches) return;
    // Блоки со ступенчатым появлением показываем сразу: на телефоне пустые
    // места при быстрой прокрутке выглядели как недогруженная страница.
    $$('[data-sp-reveal]').forEach(function (el) { el.classList.add('is-in'); });
    ['.sp-sectors', '.sp-strategy-gate__items'].forEach(function (s) { $$(s).forEach(accordion); });
    ['sp-seo-phases', 'sp-linkedin-phases', 'sp-loc-groups', 'sp-strategy-cycle'].forEach(function (c) {
      $$('.' + c).forEach(function (l) { tabs(l, c); });
    });
    ['.sp-pr-steps', '.sp-loc-steps'].forEach(function (s) { $$(s).forEach(line); });
    // PR «Материал под конкретный повод» и локализация «Что можно передать в работу».
    if (key === 'pr' || key === 'localization') drum($('.sp-index'));
    if (key === 'linkedin') {
      funnel();
      // «Там, где нужен доступ…» — тот же барабан, что «Как собираем результат» (просьба 20.10).
      drum($('.sp-proof'));
    }
    if (key === 'strategy') {
      // Путь этапов — один раз, в начале страницы (просьба 20.10).
      beam($('.sp-decision-frame__items'));
      drum($('.sp-strategy-deliverables'));
      // «Выбираем глубину участия» — вместо вкладок заливка заголовков (просьба 20.10).
      fillTitles($('.sp-formats'));
    }
    appear('.sp-proof__item, .sp-decision-frame__item, .sp-index__item, .sp-strategy-deliverables > div, .sp-strategy-system__node, .m-line > li, .sp-loc-relay > li,'
      + ' .sp-linkedin-icp > li, .sp-pr-chain > li, .m-acc > .m-acc__i, .sp-strategy-step, .sp-rate-list > *');
    others();
    kick();
  }

  /* ---------- прокрутка: линии этапов ---------- */
  var ticking = false;
  function frame() {
    ticking = false;
    // Барабан и эффекты PR работают и на компьютере; остальные списки
    // регистрируются только на телефоне, поэтому лишней работы нет.
    paintDrums();
    paintDesk();
    if (!mq.matches) return;
    paintLines();
    paintBeams();
    paintFunnel();
    paintFills();
  }
  function kick() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', kick, { passive: true });

  /* На сенсорных экранах у документа нет scroll-behavior:smooth (base.css):
     переход к форме и другим разделам страницы делаем плавным сами. */
  if (matchMedia('(hover:none) and (pointer:coarse)').matches) document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || a.hasAttribute('data-soon')) return;
    var id = a.getAttribute('href').slice(1), target = id && document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    if (history.replaceState) history.replaceState(null, '', '#' + id);
  });

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
