/* ==========================================================================
   VAK Marketing — общая мобильная оболочка: сворачиваемый подвал (до 900 px).
   Подвал страниц услуг перерисовывается при смене языка, поэтому клики
   ловятся делегированием, а доступность заголовков обновляется наблюдателем.
   «Услуги» открыты по умолчанию (это задаёт CSS), остальные разделы закрыты.
   ========================================================================== */
(function () {
  'use strict';
  var mq = matchMedia('(max-width:900px)');

  function isDefaultOpen(col) { return col.parentNode && col.parentNode.children[2] === col; }
  function isOpen(col) {
    return isDefaultOpen(col) ? !col.classList.contains('is-closed') : col.classList.contains('is-open');
  }
  function toggle(col) {
    if (isDefaultOpen(col)) col.classList.toggle('is-closed');
    else col.classList.toggle('is-open');
    col.firstElementChild.setAttribute('aria-expanded', String(isOpen(col)));
  }
  function heads() {
    return Array.prototype.slice.call(document.querySelectorAll('.foot__col > h4:first-child'));
  }
  function prep() {
    heads().forEach(function (h) {
      if (mq.matches) {
        h.setAttribute('role', 'button');
        h.setAttribute('tabindex', '0');
        h.setAttribute('aria-expanded', String(isOpen(h.parentNode)));
      } else {
        h.removeAttribute('role'); h.removeAttribute('tabindex'); h.removeAttribute('aria-expanded');
      }
    });
  }

  document.addEventListener('click', function (e) {
    if (!mq.matches) return;
    var h = e.target.closest && e.target.closest('.foot__col > h4:first-child');
    if (h) toggle(h.parentNode);
  });
  document.addEventListener('keydown', function (e) {
    if (!mq.matches || (e.key !== 'Enter' && e.key !== ' ')) return;
    var h = e.target.closest && e.target.closest('.foot__col > h4:first-child');
    if (h) { e.preventDefault(); toggle(h.parentNode); }
  });

  /* Фоновая догрузка (только телефон), но без рывка в первые секунды:
     в браузерах Telegram и Instagram одновременная загрузка и декодирование
     всех картинок страницы сразу после открытия подтормаживали анимацию.
     1. Картинки догружаются и декодируются заранее, но порциями — когда до
        них остаётся около полутора экранов (IntersectionObserver), по две
        за раз. К моменту прокрутки фото готово, а не проявляется пустым местом.
     2. Файлы страниц услуг (HTML, стили, скрипты) кладём в кэш, когда
        страница уже несколько секунд спокойна: переход в услугу мгновенный.
     При включённой экономии трафика ничего не делаем. */
  function saveData() {
    var c = navigator.connection;
    return !!(c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || '')));
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function idle(fn, ms) {
    if ('requestIdleCallback' in window) requestIdleCallback(fn, { timeout: ms });
    else setTimeout(fn, ms);
  }
  var queue = [], busy = 0;
  function pump() {
    while (busy < 2 && queue.length) {
      var img = queue.shift();
      busy++;
      if (img.loading === 'lazy') img.loading = 'eager';
      var done = img.decode ? img.decode() : new Promise(function (r) { img.onload = img.onerror = r; });
      Promise.race([done.catch(function () {}), wait(6000)]).then(function () { busy--; pump(); });
    }
  }
  function warmImages() {
    var imgs = Array.prototype.slice.call(document.querySelectorAll('img')).filter(function (i) {
      return !i.closest('#menu') && !i.complete;
    });
    if (!('IntersectionObserver' in window)) { queue = imgs; pump(); return; }
    // Картинки внутри лент, листаемых вбок, спрятаны за краем ленты, и
    // наблюдатель их не видит: следим за самой лентой и берём их все сразу.
    var groups = [];
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        var g = e.target.__warm || [e.target];
        Array.prototype.push.apply(queue, g);
      });
      pump();
    }, { rootMargin: '0px 0px 150% 0px' });
    imgs.forEach(function (i) {
      var row = i.closest('.rail, .m-rail, .m-others__row, .sp-pr-cases__rail, .m-track');
      if (!row) return io.observe(i);
      if (!row.__warm) { row.__warm = []; groups.push(row); }
      row.__warm.push(i);
    });
    groups.forEach(function (row) { io.observe(row); });
  }
  // Картинки меню — маленькие; грузим, когда страница успокоится.
  function warmMenu() {
    Array.prototype.slice.call(document.querySelectorAll('#menu img')).forEach(function (i) { queue.push(i); });
    pump();
  }
  var PAGES = ['/strategy/', '/linkedin/', '/pr/', '/seo/', '/localization/'];
  function warmPages() {
    if (!window.fetch) return Promise.resolve();
    var seen = {};
    var get = function (u) {
      if (seen[u]) return Promise.resolve('');
      seen[u] = 1;
      return fetch(u, { credentials: 'same-origin', priority: 'low' }).then(function (r) { return r.ok ? r.text() : ''; }).catch(function () { return ''; });
    };
    return PAGES.filter(function (u) { return location.pathname !== u; }).reduce(function (p, page) {
      return p.then(function () {
        return get(page).then(function (html) {
          var urls = [], re = /(?:href|src)="(\/assets\/(?:css|js)\/[^"]+)"/g, m;
          while ((m = re.exec(html))) urls.push(m[1]);
          return Promise.all(urls.map(get));
        }).then(function () { return wait(250); });
      });
    }, Promise.resolve());
  }
  function warm() {
    if (!mq.matches || saveData()) return;
    warmImages();
    idle(function () { warmMenu(); idle(warmPages, 2500); }, 4000);
  }
  if (document.readyState === 'complete') setTimeout(warm, 1200);
  else addEventListener('load', function () { setTimeout(warm, 1200); }, { once: true });

  var foot = document.querySelector('footer');
  if (foot && 'MutationObserver' in window) new MutationObserver(prep).observe(foot, { childList: true });
  if (mq.addEventListener) mq.addEventListener('change', prep); else mq.addListener(prep);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', prep); else prep();
})();
