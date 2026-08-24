/* ==========================================================================
   VAK Marketing — поведение страницы.
   Ничего лишнего: шапка, меню, появление блоков, счётчики, гармошка
   аудиторий, панель услуг, лента кейсов, форма.
   ========================================================================== */
(function () {
'use strict';

/* Сюда вписывается адрес, который принимает POST с JSON.
   Пока строка пустая, форма работает в демо-режиме. */
var FORM_ENDPOINT = '';

/* Когда появятся отдельные страницы услуг (/strategy, /linkedin и т.д.),
   переключить на true: кнопка «Подробнее» начнёт вести на них.
   Пока false, чтобы не отправлять посетителя на несуществующий адрес. */
var SERVICE_PAGES = false;

var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
var $  = function (s, c) { return (c || document).querySelector(s); };
var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

/* ── тост ───────────────────────────────────────────────────────────── */
var toastEl = $('#toast'), toastT;
function toast(msg) {
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add('is-on');
  clearTimeout(toastT);
  toastT = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2600);
}
document.addEventListener('click', function (e) {
  var a = e.target.closest('[data-soon]');
  if (!a) return;
  e.preventDefault();
  var own = a.getAttribute('data-soon');
  toast(own || (window.__lang === 'en' ? 'This section is coming soon' : 'Раздел скоро появится'));
});

/* ── шапка и мобильное меню ─────────────────────────────────────────── */
var nav = $('#nav'), burger = $('#burger'), menu = $('#menu');
function onScroll() { nav.classList.toggle('is-stuck', scrollY > 18); }
addEventListener('scroll', onScroll, { passive: true });
onScroll();

function menuFocusable() {
  if (!menu) return [];
  return $$('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])', menu);
}
function openMenu() {
  if (!menu || !menu.hidden) return;
  menu.hidden = false;
  menu.scrollTop = 0;
  burger.setAttribute('aria-expanded', 'true');
  document.body.classList.add('is-locked');
  nav.classList.add('is-open');
  requestAnimationFrame(function () {
    var first = menuFocusable()[0];
    if (first) first.focus();
  });
}
function closeMenu(restoreFocus) {
  if (!menu || menu.hidden) return;
  menu.hidden = true;
  burger.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('is-locked');
  nav.classList.remove('is-open');
  if (restoreFocus !== false && burger) requestAnimationFrame(function () { burger.focus(); });
}
if (burger) burger.addEventListener('click', function () {
  if (menu.hidden) openMenu();
  else closeMenu();
});
if (menu) {
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(false); });
  menu.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab' || menu.hidden) return;
    var items = menuFocusable();
    if (!items.length) return;
    var first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
}
var navBrand = nav && $('.brand', nav);
if (navBrand) navBrand.addEventListener('click', function () { closeMenu(false); });
addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
var mobileNav = matchMedia('(max-width:1080px)');
function syncMobileNav(e) { if (!e.matches) closeMenu(false); }
if (mobileNav.addEventListener) mobileNav.addEventListener('change', syncMobileNav);
else mobileNav.addListener(syncMobileNav);

/* ── появление блоков ───────────────────────────────────────────────── */
var reveal = $$('[data-reveal]');
if (reduced || !('IntersectionObserver' in window)) {
  reveal.forEach(function (el) { el.classList.add('in'); });
} else {
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      io.unobserve(en.target);
      if (en.target.querySelector('[data-count]') || en.target.hasAttribute('data-count')) countIn(en.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
  reveal.forEach(function (el) { io.observe(el); });
}

/* ── счётчики ───────────────────────────────────────────────────────── */
function countIn(root) {
  var nodes = root.hasAttribute('data-count') ? [root] : $$('[data-count]', root);
  nodes.forEach(function (n) {
    if (n.__done) return;
    n.__done = true;
    var to = parseFloat(n.getAttribute('data-count')) || 0;
    var suf = n.getAttribute('data-suffix') || '';
    if (reduced) { n.textContent = fmt(to) + suf; return; }
    var t0 = performance.now(), dur = 1150;
    (function step(t) {
      var p = Math.min(1, (t - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      n.textContent = fmt(Math.round(to * e)) + suf;
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  });
}
function fmt(v) { return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }

/* ── гармошка «с кем работаем» ──────────────────────────────────────── */
var slats = $$('.slat'), openSlatEl = document.querySelector('.slat.is-open');
var pendingSlat = null, slatRaf = 0, slatMotionTimer = 0;
function openSlat(el) {
  if (!el || el === openSlatEl) return;
  openSlatEl = el;
  slats.forEach(function (s) { s.classList.toggle('is-open', s === el); });
  /* Пока колонки меняют ширину, сцена чуть снижает внутреннее разрешение.
     Это не меняет дизайн, но не позволяет WebGL соревноваться с layout на
     основном потоке в самый чувствительный момент перехода. */
  if (window.__vakAudienceMotion) window.__vakAudienceMotion(true);
  clearTimeout(slatMotionTimer);
  slatMotionTimer = setTimeout(function () {
    if (window.__vakAudienceMotion) window.__vakAudienceMotion(false);
  }, 540);
}
function queueSlat(el) {
  pendingSlat = el;
  if (slatRaf) return;
  slatRaf = requestAnimationFrame(function () {
    slatRaf = 0;
    openSlat(pendingSlat);
  });
}
slats.forEach(function (s) {
  s.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') queueSlat(s); });
  s.addEventListener('click', function () { openSlat(s); });
  s.addEventListener('focus', function () { openSlat(s); });
});

/* ── услуги ─────────────────────────────────────────────────────────── */
var SRV = [
  { i: '01', href: '/strategy',
    t: 'Стратегия и комплексное ведение проекта',
    d: 'Разрабатываем маркетинговую стратегию и берём на себя сопровождение проекта: позиционирование, PR, контент, LinkedIn, SEO, лидогенерацию, аналитику и отчётность.',
    photo: '../img/services/web/strategy-photo-v1.jpg' },
  { i: '02', href: '/linkedin',
    t: 'B2B-маркетинг и продвижение в LinkedIn',
    d: 'Помогаем компаниям, фаундерам и sales-командам превращать LinkedIn в канал доверия, экспертности, B2B-диалогов и лидогенерации.',
    photo: '../img/services/web/linkedin-photo-v1.jpg' },
  { i: '03', href: '/pr',
    t: 'PR, СМИ и SERP',
    d: 'Размещаем статьи, пресс-релизы, интервью и экспертные материалы в Tier-1 и Tier-2-3 медиа, усиливаем репутацию бренда в поисковой выдаче.',
    photo: '../img/services/web/pr-media-photo-v1.jpg' },
  { i: '04', href: '/seo',
    t: 'AI SEO и автоматизация маркетинга',
    d: 'Работаем с SEO-структурой, ключевыми запросами, контентом, аналитикой и автоматизацией маркетинговых процессов.',
    photo: '../img/services/web/ai-seo-photo-v1.jpg' },
  { i: '05', href: '/course',
    t: 'B2B и B2C курс по LinkedIn',
    d: 'Создаём образовательные продукты для компаний, sales-команд, фаундеров, экспертов и предпринимателей, включая курс по LinkedIn-продвижению.',
    photo: '../img/services/web/course-photo-v1.jpg' },
  { i: '06', href: '/localization',
    t: 'Translation & Localization Services',
    d: 'Адаптируем сайты, презентации, статьи, пресс-релизы, whitepapers, pitch decks и любые документы под международные рынки.',
    photo: '../img/services/web/localization-photo-v1.jpg' }
];

var srvSec = $('#services'), srvPin = $('#srvPin'), srvDeck = $('#srvDeck'), srvList = $('#srvList');
var srvCards = [], srvActive = -1;

/* Карточки строятся из SRV, а перевод берётся из того же словаря, что и раньше. */
function buildSrvCards() {
  if (!srvDeck) return;
  srvDeck.innerHTML = '';
  srvCards = SRV.map(function (s, n) {
    var el = document.createElement('article');
    el.className = 'card srv__card';
    el.style.setProperty('--srv-photo', "url('" + s.photo + "')");
    /* Содержимое лежит в отдельной обёртке: в колоде у неё своя прозрачность,
       поэтому за активной карточкой видны сами карточки, а не их тексты. */
    el.innerHTML = '<div class="srv__body">' +
      '<h3 class="srv__t"></h3><p class="srv__d"></p>' +
      '<a class="link-arrow" href="#contact"></a></div>';
    srvDeck.appendChild(el);
    fillSrvCard(el, n);
    return el;
  });
}

function fillSrvCard(el, n) {
  var s = SRV[n], d = window.__dict;
  el.querySelector('.srv__t').innerHTML = (d && d['srv.t' + (n + 1)]) || s.t;
  el.querySelector('.srv__d').innerHTML = (d && d['srv.d' + (n + 1)]) || s.d;
  var a = el.querySelector('.link-arrow');
  // в словаре значение уже со стрелкой: 'Read more<i></i>'
  a.innerHTML = (d && d['srv.more']) || 'Подробнее<i></i>';
  if (SERVICE_PAGES) { a.setAttribute('href', s.href); a.removeAttribute('data-soon'); }
  else {
    a.setAttribute('href', '#contact');
    a.setAttribute('data-soon', window.__lang === 'en'
      ? 'The service page is coming soon' : 'Страница услуги скоро появится');
  }
}

/* Подсветка активной строки в списке-оглавлении и доступность колоды:
   неактивные карточки убираются из обхода с клавиатуры и от скринридера,
   иначе Tab уводит в невидимое. */
function setSrv(n) {
  if (n === srvActive) return;
  srvActive = n;
  $$('.srv__row').forEach(function (r) {
    var on = +r.getAttribute('data-srv') === n;
    r.classList.toggle('is-on', on);
    if (on) r.setAttribute('aria-current', 'step');
    else r.removeAttribute('aria-current');
  });
  srvCards.forEach(function (c, i) {
    var on = i === n;
    c.classList.toggle('is-on', on);
    if (srvDeck.parentElement && srvSec.classList.contains('is-deck')) {
      c.setAttribute('aria-hidden', on ? 'false' : 'true');
      c.querySelector('.link-arrow').tabIndex = on ? 0 : -1;
    }
  });
}

buildSrvCards();
window.__setSrv = function () {
  srvCards.forEach(function (el, n) { fillSrvCard(el, n); });
  var n = srvActive; srvActive = -1; setSrv(n < 0 ? 0 : n);
};
setSrv(0);

/* ── колода услуг: закреплённая секция ──────────────────────────────────
   Секции задаётся увеличенная прокручиваемая длина в STEP пикселей на
   карточку, а сцена внутри липкая: пока эта длина идёт, колода стоит на
   экране. Переход считывается плавно, но после остановки прокрутки всегда
   фиксируется на ближайшей полной карточке. */
/* На touch/mobile не превращаем обычный просмотр услуг в длинную sticky-
   прокрутку. Там остаётся базовый вертикальный список: он быстрее читается,
   не конфликтует с инерцией пальца и уже работает без скриптов. */
var srvDeckMode = matchMedia('(min-width: 901px) and (pointer: fine)');
if (srvSec && srvPin && srvDeck && srvCards.length && !reduced && srvDeckMode.matches) (function () {
  var N = srvCards.length, STEP = 760, pinTop = 0, raf = 0;
  var SNAP_FORWARD = 0.32, SNAP_BACKWARD = 0.68;

  /* На широком экране колода стоит по центру и получает две вещи, которых
     нет на телефоне: расфокус по глубине и наклон верхней карточки под
     курсором. Обе завязаны на mouse-указатель, поэтому на тач-экранах
     не включаются. */
  var wideQ = matchMedia('(min-width: 901px)'), fineQ = matchMedia('(pointer: fine)');
  var wide = wideQ.matches && fineQ.matches;
  var tiltTX = 0, tiltTY = 0, tiltX = 0, tiltY = 0, hoverT = 0, hover = 0;

  function absTop(el) { var y = 0; for (; el; el = el.offsetParent) y += el.offsetTop; return y; }

  function layout() {
    wide = wideQ.matches && fineQ.matches;
    if (!wide) { tiltTX = tiltTY = hoverT = 0; }
    /* Шаг чуть короче экрана: у карточки остаётся время на чтение, но
       сцена не превращается в длинную sticky-ловушку. */
    STEP = Math.round(Math.max(560, Math.min(innerHeight * 0.82, 760)));
    srvPin.style.height = ((N - 1) * STEP + innerHeight) + 'px';
    pinTop = absTop(srvPin);
    lastDeckY = scrollY;
    /* Высота секции только что изменилась, а кадры сцены привязаны к позициям
       секций — пересчёт обязателен, иначе прибор поедет. */
    if (window.__vakRelayout) window.__vakRelayout();
    draw();
  }

  function pos() {
    return Math.max(0, Math.min(N - 1, (scrollY - pinTop) / STEP));
  }

  function draw() {
    raf = 0;
    /* Наклон и подъём догоняют цель, а не прыгают к ней: за счёт этого
       карточка отзывается на курсор мягко и так же мягко возвращается. */
    tiltX += (tiltTX - tiltX) * 0.14;
    tiltY += (tiltTY - tiltY) * 0.14;
    hover += (hoverT - hover) * 0.14;

    /* Входящая карточка становится визуально главной раньше математической
       середины: уходящая уже прозрачна, а следующая ещё почти целиком
       видна. Порог зависит от направления, поэтому при движении назад copy
       возвращается так же мягко и без мерцания около одной точки. */
    var p = pos(), whole = Math.floor(p), fraction = p - whole;
    var activeIndex = Math.round(p);
    if (scrollDir > 0 && fraction >= SNAP_FORWARD) activeIndex = whole + 1;
    else if (scrollDir < 0 && fraction <= SNAP_BACKWARD) activeIndex = whole;
    activeIndex = Math.max(0, Math.min(N - 1, activeIndex));
    for (var i = 0; i < N; i++) {
      var c = srvCards[i], d = i - p, z, y, rx, ry, s, op, blur;
      if (d >= 0) {                       // ещё в стопке, уходит вглубь
        z  = -d * 205;
        y  =  d * 34;
        rx = -Math.min(d, 1.8) * 7;
        ry =  0;
        s  =  1 - Math.min(d, 3) * 0.05;
        op = (1 - Math.min(d, 3) * 0.18) * Math.max(0, Math.min(1, 3 - d));
        blur = wide ? Math.min(d, 2) * 2.2 : 0;
      } else {                            // пролистана, вылетает на зрителя
        var a = -d;
        z  =  a * 520;
        y  = -a * 205;
        rx =  a * 22;
        ry = -a * 9;
        s  =  1;
        op =  Math.max(0, 1 - a * 1.5);
        /* Старая copy успевает мягко погаснуть резкой, затем карточка
           растворяется в глубине. Иначе blur попадал на текст в момент
           передачи и визуально делал переход грязным. */
        blur = wide ? Math.min(4.5, Math.max(0, a - 0.48) * 8) : 0;
      }

      /* Наклон под курсором достаётся только верхней карточке: у остальных
         вес нулевой, иначе вся стопка начинает шевелиться. */
      var w = Math.max(0, 1 - Math.abs(d));
      if (wide && w > 0.001) {
        ry += tiltX * 5.5 * w * hover;
        rx += -tiltY * 4.2 * w * hover;
        z  += 26 * w * hover;
      }

      /* Карточка, которая сейчас несёт copy, остаётся резкой. Размытие
         работает только как глубина для соседних слоёв, а не как эффект
         поверх читаемого заголовка и описания. */
      if (i === activeIndex) blur = 0;

      /* Текст всегда остаётся у одной — ближайшей — карточки. Раньше обе
         подписи исчезали в середине шага, из-за чего пользователь видел
         пустой экран; CSS мягко передаёт copy следующей услуге в точке
         смены активной карточки. */
      var bodyOpacity = i === activeIndex ? 1 : 0;
      if (c.__bodyOpacity !== bodyOpacity) {
        c.__bodyOpacity = bodyOpacity;
        c.firstChild.style.opacity = String(bodyOpacity);
      }
      c.style.opacity = op.toFixed(3);
      c.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,' + z.toFixed(1) + 'px)'
        + ' rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)'
        + ' scale(' + s.toFixed(3) + ')';

      /* Всё, что не меняется от кадра к кадру, и пишем не каждый кадр:
         каждая такая запись — лишний пересчёт стилей. Заодно невидимая
         карточка отпускает свой слой на видеокарте: шесть слоёв размером
         во всю колоду держать незачем. */
      var zi = 1000 - Math.round(d * 10);
      if (c.__zi !== zi) { c.__zi = zi; c.style.zIndex = String(zi); }
      var live = op >= 0.004;
      if (c.__live !== live) { c.__live = live; c.style.visibility = live ? 'visible' : 'hidden'; }
      var bs = blur > 0.2 ? 'blur(' + blur.toFixed(1) + 'px)' : '';
      if (c.__bs !== bs) { c.__bs = bs; c.style.filter = bs; }
    }
    setSrv(activeIndex);

    // пока наклон не улёгся, продолжаем считать кадры
    if (Math.abs(tiltTX - tiltX) > 0.002 || Math.abs(tiltTY - tiltY) > 0.002
        || Math.abs(hoverT - hover) > 0.002) kick();
  }

  function kick() { if (!raf) raf = requestAnimationFrame(draw); }
  /* Переход остаётся непрерывным во время скролла, но после его окончания
     колода всегда приходит к целой карточке. Нативный smooth-scroll ведёт
     себя по-разному в Chrome и Safari, поэтому короткую доводку считаем сами
     и можем сразу отменить её новым жестом пользователя. */
  var settleTimer = 0, settleFrame = 0, settling = false;
  var lastDeckY = scrollY, scrollDir = 0, hasNativeScrollEnd = 'onscrollend' in window;
  function scheduleSettle() {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settleDeck, 220);
  }
  function easeSettle(p) {
    /* C2-кривая: у доводки нет ни удара в начале, ни резкой остановки. */
    return p * p * p * (p * (p * 6 - 15) + 10);
  }
  function inDeckRange() {
    var min = pinTop + 3, max = pinTop + (N - 1) * STEP - 3;
    return scrollY > min && scrollY < max;
  }
  function settleDeck() {
    settleTimer = 0;
    if (drag || settling || !inDeckRange()) return;
    var progress = pos(), whole = Math.floor(progress), fraction = progress - whole;
    var targetIndex = Math.round(progress);
    /* После осмысленного жеста не тянем страницу назад к ближайшему
       математическому значению: вниз дотягиваем вперёд, вверх — назад.
       Небольшая мёртвая зона защищает от случайного листания карточки. */
    if (scrollDir > 0 && fraction >= SNAP_FORWARD) targetIndex = Math.min(N - 1, whole + 1);
    else if (scrollDir < 0 && fraction <= SNAP_BACKWARD) targetIndex = whole;
    var target = pinTop + targetIndex * STEP;
    if (Math.abs(scrollY - target) < 3) return;
    settling = true;
    var from = scrollY, distance = target - from;
    var startedAt = performance.now();
    var duration = Math.max(320, Math.min(520, Math.abs(distance) * 0.80));
    (function finish(now) {
      var p = Math.min(1, (now - startedAt) / duration);
      var eased = easeSettle(p);
      /* У html включён глобальный smooth-scroll. Для каждого кадра собственной
         доводки нужен мгновенный перенос — иначе браузер запускает второй
         smooth-scroll поверх rAF и создаёт длинный «резиновый» хвост. */
      window.scrollTo({ top: from + distance * eased, behavior: 'instant' });
      if (p < 1) { settleFrame = requestAnimationFrame(finish); return; }
      window.scrollTo({ top: target, behavior: 'instant' });
      settleFrame = 0;
      settling = false;
      scrollDir = 0;
    })(startedAt);
  }
  function interruptSettle() {
    clearTimeout(settleTimer);
    if (!settling) return;
    if (settleFrame) cancelAnimationFrame(settleFrame);
    settleFrame = 0;
    settling = false;
  }
  function onScrollDeck() {
    var delta = scrollY - lastDeckY;
    lastDeckY = scrollY;
    kick();
    if (drag || settling) return;
    if (Math.abs(delta) > 0.5) scrollDir = delta > 0 ? 1 : -1;
    /* В браузерах с scrollend ждём реального конца инерции. В остальных
       используем чуть более терпеливый debounce. */
    if (!hasNativeScrollEnd) scheduleSettle();
  }

  /* Курсор над колодой: верхняя карточка кренится за ним, по стеклу ходит
     блик. Блик двигаем переменными, а не пересчётом фона. */
  srvDeck.addEventListener('pointermove', function (e) {
    if (!wide || e.pointerType !== 'mouse' || drag) return;
    var r = srvDeck.getBoundingClientRect();
    var nx = (e.clientX - r.left) / r.width, ny = (e.clientY - r.top) / r.height;
    tiltTX = (nx - 0.5) * 2;
    tiltTY = (ny - 0.5) * 2;
    hoverT = 1;
    var on = srvCards[Math.max(0, Math.min(N - 1, Math.round(pos())))];
    if (on) {
      on.style.setProperty('--mx', (nx * 100).toFixed(1) + '%');
      on.style.setProperty('--my', (ny * 100).toFixed(1) + '%');
    }
    kick();
  });
  srvDeck.addEventListener('pointerleave', function () {
    tiltTX = tiltTY = hoverT = 0;
    kick();
  });

  function goTo(n, smooth) {
    interruptSettle();
    window.scrollTo({ top: pinTop + Math.max(0, Math.min(N - 1, n)) * STEP,
                      behavior: smooth === false ? 'instant' : 'smooth' });
  }

  /* Перетаскивание. Оно не двигает колоду напрямую, а прокручивает страницу:
     иначе появился бы второй источник правды и после отпускания картинка
     прыгала бы к тому, что говорит прокрутка. На тач-экране тянем по
     горизонтали (touch-action: pan-y оставляет вертикаль странице), мышью —
     по вертикали, как привычнее. */
  var drag = null, DRAG_STEP = 240, DRAG_INTENT = 24;
  srvDeck.addEventListener('pointerdown', function (e) {
    if (e.button) return;
    interruptSettle();
    drag = { x: e.clientX, y: e.clientY, top: scrollY, touch: e.pointerType !== 'mouse', moved: false, intent: false };
    srvDeck.setPointerCapture(e.pointerId);
  });
  srvDeck.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    var delta = drag.touch ? -dx : -dy;
    var primary = Math.abs(delta), cross = Math.abs(drag.touch ? dy : dx);
    if (!drag.intent) {
      if (primary < DRAG_INTENT || primary < cross) return;
      drag.intent = true;
      srvDeck.classList.add('is-drag');
    }
    drag.moved = true;
    window.scrollTo({ top: drag.top + delta * (STEP / DRAG_STEP), behavior: 'instant' });
  });
  function endDrag(e) {
    if (!drag) return;
    var moved = drag.moved;
    drag = null;
    srvDeck.classList.remove('is-drag');
    if (srvDeck.hasPointerCapture && e && srvDeck.hasPointerCapture(e.pointerId))
      srvDeck.releasePointerCapture(e.pointerId);
    if (moved) goTo(Math.round(pos()));      // после броска довести до карточки
  }
  srvDeck.addEventListener('pointerup', endDrag);
  srvDeck.addEventListener('pointercancel', endDrag);
  srvDeck.addEventListener('lostpointercapture', endDrag);
  srvDeck.addEventListener('dragstart', function (e) { e.preventDefault(); });

  /* Список справа работает оглавлением: клик и фокус ведут к своей карточке.
     Наведение больше ничего не переключает — при закреплённой секции это
     означало бы прокрутку страницы под курсором. */
  $$('.srv__row').forEach(function (r) {
    var n = +r.getAttribute('data-srv');
    r.addEventListener('click', function () { goTo(n); });
  });
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href="#services"]');
    if (!link) return;
    e.preventDefault();
    goTo(0);
  });
  srvSec.addEventListener('keydown', function (e) {
    if (!e.target.closest('.srv__row')) return;
    var n = Math.round(pos());
    var target = n;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') target = n + 1;
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') target = n - 1;
    else if (e.key === 'Home') target = 0;
    else if (e.key === 'End') target = N - 1;
    else return;
    e.preventDefault();
    target = Math.max(0, Math.min(N - 1, target));
    goTo(target);
    var targetRow = $('.srv__row[data-srv="' + target + '"]');
    if (targetRow) targetRow.focus({ preventScroll: true });
  });

  srvSec.classList.add('is-deck');
  /* После включения deck-режима повторно выставляем состояние: скрытые
     ссылки больше не попадают в Tab-порядок. Сама колода и шкала не ждут
     следующего IntersectionObserver-кадра, поэтому при быстром входе не
     бывают прозрачными. */
  srvActive = -1;
  setSrv(0);
  srvDeck.classList.add('in');
  if (srvList) srvList.classList.add('in');
  addEventListener('scroll', onScrollDeck, { passive: true });
  addEventListener('wheel', interruptSettle, { passive: true });
  addEventListener('touchstart', interruptSettle, { passive: true });
  if (hasNativeScrollEnd) addEventListener('scrollend', scheduleSettle, { passive: true });
  addEventListener('resize', layout);
  layout();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
})();

/* ── лента кейсов ───────────────────────────────────────────────────── */
var rail = $('#rail'), railBar = $('#railBar'),
    railPrev = $('#railPrev'), railNext = $('#railNext');
if (rail) {
  var step = function () {
    var c = rail.querySelector('.case');
    return c ? c.getBoundingClientRect().width + 18 : 380;
  };
  var syncRail = function () {
    var max = rail.scrollWidth - rail.clientWidth;
    var frac = rail.clientWidth / rail.scrollWidth;
    railBar.style.width = (frac * 100) + '%';
    railBar.style.transform = 'translateX(' + (max > 0 ? (rail.scrollLeft / max) * (100 / frac - 100) : 0) + '%)';
    railPrev.disabled = rail.scrollLeft < 6;
    railNext.disabled = rail.scrollLeft > max - 6;
  };
  rail.addEventListener('scroll', syncRail, { passive: true });
  addEventListener('resize', syncRail);
  railPrev.addEventListener('click', function () { rail.scrollBy({ left: -step(), behavior: 'smooth' }); });
  railNext.addEventListener('click', function () { rail.scrollBy({ left:  step(), behavior: 'smooth' }); });
  syncRail();
}

/* ── клиенты: спокойная лента оригинальных логотипов ────────────────────
   Скорость очень низкая, а прокрутка лишь деликатно задаёт направление.
   Никакого blur/focus-эффекта: каждая марка остаётся читаемой по всей ленте.
   При наведении движение почти останавливается, чтобы спокойно рассмотреть
   конкретный логотип. */
var ringEl = $('#ring'), ringSet = $('#ringSet');
if (ringEl && ringSet && !reduced) (function () {
  var PAD = 28;          // знак целиком уезжает за край до повтора
  var DRIFT = 7;         // px/с в покое — медленный, спокойный ритм
  var GAIN = 0.05;       // у прокрутки только небольшой вклад
  var VMAX = 80;         // без разгона при резком wheel / trackpad
  var SLOW = 0.12;       // под курсором почти останавливается

  var src = $$('.ring__i', ringSet);
  if (!src.length) return;

  var items = [], W = 0, setW = 0, L = 0, maxW = 0;
  var offset = 0, v = DRIFT, hov = 0, hovT = 0;
  var lastY = scrollY, sv = 0, prevT = 0, onScreen = true, built = false;

  function build() {
    /* Мерить ширины нужно в обычной раскладке: в рабочем состоянии имена
       расставлены абсолютно и естественной ширины у строки уже нет.
       Промежуточное состояние не успевает отрисоваться — класс снимается
       и возвращается в пределах одной задачи. */
    ringEl.classList.remove('is-live');
    items.forEach(function (it) { if (it.clone) it.el.remove(); });
    items = [];

    W = ringEl.clientWidth;
    if (!W) return;

    var g = Math.max(32, Math.min(64, W * 0.036));
    var gaps = [], h = 0;
    setW = 0; maxW = 0;

    src.forEach(function (el) {
      var w = el.offsetWidth;
      var gp = g * (parseFloat(getComputedStyle(el).getPropertyValue('--g')) || 1);
      gaps.push(gp);
      setW += w + gp;
      if (w > maxW) maxW = w;
      if (el.offsetHeight > h) h = el.offsetHeight;
    });
    if (setW <= 0) return;

    /* Копий ровно столько, чтобы длина кольца перекрыла полосу вместе
       с запасом: тогда имя перескакивает в хвост, уже полностью уехав
       за левый край, и шва не видно. */
    var N = Math.max(1, Math.min(8, Math.ceil((W + maxW + 2 * PAD) / setW)));
    L = setW * N;

    for (var c = 0; c < N; c++) {
      var at = c * setW;
      for (var i = 0; i < src.length; i++) {
        var el = src[i];
        if (c > 0) {
          el = src[i].cloneNode(true);
          el.setAttribute('aria-hidden', 'true');   // копии не для чтения с экрана
          el.removeAttribute('data-i18n');
          ringSet.appendChild(el);
        }
        el.style.filter = 'none';
        el.style.textShadow = 'none';
        items.push({ el: el, w: src[i].offsetWidth, base: at, clone: c > 0, vis: -1 });
        at += src[i].offsetWidth + gaps[i];
      }
    }

    ringEl.style.setProperty('--ring-h', Math.round(h + 34) + 'px');
    ringEl.classList.add('is-live');
    built = true;
    draw(0);
  }

  function draw(dt) {
    /* Прыжок по якорной ссылке — это не скорость прокрутки, а телепорт:
       без отсечки он даёт мгновенный рывок ленты до потолка. */
    var y = scrollY, dy = y - lastY;
    lastY = y;
    if (Math.abs(dy) > innerHeight * 1.2) dy = 0;
    if (dt) sv += (dy / Math.max(dt, 1e-4) - sv) * Math.min(1, dt * 7);

    var vT = Math.max(-VMAX, Math.min(VMAX, DRIFT + sv * GAIN));
    v   += (vT   - v)   * (1 - Math.pow(1 - .11, dt * 60));
    hov += (hovT - hov) * (1 - Math.pow(1 - .12, dt * 60));

    offset += v * (1 - hov * (1 - SLOW)) * dt;

    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var x = it.base - offset;
      x = ((x % L) + L) % L;
      if (x > W + PAD) x -= L;

      if (x < -it.w - PAD) {                    // припарковано за кадром
        if (it.vis !== 0) { it.el.style.opacity = '0'; it.vis = 0; }
        continue;
      }

      it.el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,-50%,0)';
      it.el.style.opacity = '1';
      it.vis = 1;
    }
  }

  function frame(t) {
    requestAnimationFrame(frame);
    if (!built || document.hidden || !onScreen) { prevT = t; return; }
    var dt = prevT ? Math.min(.05, (t - prevT) / 1000) : .016;
    prevT = t;
    draw(dt);
  }

  ringEl.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') hovT = 1; });
  ringEl.addEventListener('pointerleave', function () { hovT = 0; });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { onScreen = en[0].isIntersecting; },
      { rootMargin: '120px 0px' }).observe(ringEl);
  }

  var rt;
  addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(build, 180); });

  build();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
  window.__ringSync = build;    // пересборка после смены языка: имена меняют ширину
  requestAnimationFrame(frame);
})();

/* ── форма ──────────────────────────────────────────────────────────── */
var form = $('#lead'), note = $('#formNote');
function say(kind, ru, en) {
  note.className = 'form__note ' + kind;
  note.textContent = window.__lang === 'en' ? en : ru;
}
if (form) form.addEventListener('submit', function (e) {
  e.preventDefault();
  var d = new FormData(form);
  if (d.get('website_url')) return;                       // ловушка для ботов

  var bad = null;
  ['name', 'contact'].forEach(function (k) {
    var el = form.elements[k];
    var ok = String(d.get(k) || '').trim().length > 1;
    el.setAttribute('aria-invalid', ok ? 'false' : 'true');
    if (!ok && !bad) bad = el;
  });
  if (bad) {
    bad.focus();
    say('is-err', 'Заполните имя и контакт для связи.', 'Please add your name and a contact.');
    return;
  }

  var payload = {
    name: d.get('name'), company: d.get('company'), site: d.get('site'),
    contact: d.get('contact'), service: d.get('service'),
    page: location.href, lang: window.__lang || 'ru'
  };

  var btn = form.querySelector('button[type=submit]');
  btn.disabled = true;
  say('', 'Отправляем…', 'Sending…');

  if (!FORM_ENDPOINT) {
    window.__lastLead = payload;
    console.log('[VAK] демо-режим, заявка не отправлена:', payload);
    setTimeout(function () {
      btn.disabled = false;
      form.reset();
      say('is-ok', 'Заявка принята (демо-режим: адрес приёма ещё не подключён).',
                   'Received (demo mode: the endpoint is not connected yet).');
    }, 550);
    return;
  }

  fetch(FORM_ENDPOINT, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
  }).then(function (r) {
    if (!r.ok) throw new Error(r.status);
    form.reset();
    say('is-ok', 'Спасибо, заявка отправлена. Ответим в течение рабочего дня.',
                 'Thanks, your request is on its way. We reply within one business day.');
  }).catch(function () {
    say('is-err', 'Не получилось отправить. Напишите нам в Telegram или на почту.',
                  'Sending failed. Please reach us on Telegram or by email.');
  }).then(function () { btn.disabled = false; });
});

/* ── мелочи ─────────────────────────────────────────────────────────── */
var yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();

})();
