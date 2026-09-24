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

  /* Фоновая догрузка после открытия страницы (только телефон).
     1. Картинки страницы по порядку сверху вниз: грузим и сразу декодируем
        (img.decode), по одной. Тогда к моменту прокрутки фото уже готово к
        показу, а не проявляется пустым местом. Скрытое меню и «Другие услуги»
        внизу страницы — в самом конце.
     2. Файлы страниц услуг (HTML, стили, скрипты) кладём в кэш браузера:
        переход в услугу берёт их оттуда и открывается сразу.
     При включённой экономии трафика ничего не делаем. */
  function saveData() {
    var c = navigator.connection;
    return !!(c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || '')));
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function warmImages() {
    var all = Array.prototype.slice.call(document.querySelectorAll('img'));
    var late = function (img) { return img.closest('#menu, .m-others'); };
    var list = all.filter(function (i) { return !late(i); }).concat(all.filter(late));
    return list.reduce(function (p, img) {
      return p.then(function () {
        if (img.loading === 'lazy') img.loading = 'eager';
        if (img.complete && img.naturalWidth && !img.decode) return;
        var done = img.decode ? img.decode() : new Promise(function (r) { img.onload = img.onerror = r; });
        return Promise.race([done.catch(function () {}), wait(4000)]);
      });
    }, Promise.resolve());
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
        });
      });
    }, Promise.resolve());
  }
  function warm() {
    if (!mq.matches || saveData()) return;
    warmImages().then(function () { return wait(300); }).then(warmPages);
  }
  if (document.readyState === 'complete') setTimeout(warm, 400);
  else addEventListener('load', function () { setTimeout(warm, 400); }, { once: true });

  var foot = document.querySelector('footer');
  if (foot && 'MutationObserver' in window) new MutationObserver(prep).observe(foot, { childList: true });
  if (mq.addEventListener) mq.addEventListener('change', prep); else mq.addListener(prep);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', prep); else prep();
})();
