/* ==========================================================================
   VAK Marketing — поведение мобильной главной (до 900 px): строка этапов
   «О нас» и проявление фото аудитории.
   Всё, что связано с прокруткой, считается в одном requestAnimationFrame и
   пишется только в CSS-переменные и transform: так нет перерасчёта
   раскладки и дёрганья на слабых телефонах. Десктоп этот файл не трогает.
   ========================================================================== */
(function () {
  'use strict';
  var mq = matchMedia('(max-width:900px)');
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };

  var about = $('#about'), aboutBody = $('.about__body'), flow = $('.about__flow-line');
  var vh = innerHeight, ticking = false, active = false;

  /* Строка этапов: слово загорается целиком, когда полоса до него дошла.
     Путь привязан к тексту раздела, который проезжает под строкой. */
  var BOUNDS = [0, 0.25, 0.5, 0.75, 1];
  var lastFlow = -1;
  function paintFlow() {
    if (!about || !flow || !flowOn) return;
    // Полоса идёт, пока под прилипшей строкой проезжает текст раздела:
    // 0 — текст только подошёл к строке, 1 — его конец поднялся к середине экрана.
    var r = (aboutBody || about).getBoundingClientRect();
    var line = flow.getBoundingClientRect().bottom + 24;
    var f = reduced ? 1 : clamp((line - r.top) / Math.max(1, r.height - (vh * 0.5 - line)));
    if (Math.abs(f - lastFlow) < 0.002) return;
    lastFlow = f;
    flow.style.setProperty('--m-flow', f.toFixed(3));
    var k = 0;
    for (var i = 0; i < BOUNDS.length - 1; i++) if (f >= BOUNDS[i]) k = i;
    $$('span', flow).forEach(function (w, i) {
      var st = f < 0.004 ? 'next' : i < k ? 'done' : i === k ? (f >= 1 ? 'done' : 'active') : 'next';
      if (w.dataset.state !== st) w.dataset.state = st;
    });
  }

  // строку этапов считаем, только пока раздел «О нас» рядом с экраном
  var flowOn = true;
  if (about && 'IntersectionObserver' in window) new IntersectionObserver(function (es) {
    flowOn = es[0].isIntersecting; if (flowOn) kick();
  }, { rootMargin: '200px 0px' }).observe(about);

  function frame() {
    ticking = false;
    if (!active) return;
    // На телефоне по прокрутке считается только строка этапов: покадровое
    // уменьшение карточек и параллакс объектива на iPhone давали рывки.
    paintFlow();
  }
  function kick() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }

  /* Фото аудитории проявляются из лёгкого приближения. */
  var seen = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-seen'); seen.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -12% 0px' }) : null;

  function sync() {
    active = mq.matches;
    if (active) {
      if (seen) $$('.aud .slat').forEach(function (s) { seen.observe(s); });
      else $$('.aud .slat').forEach(function (s) { s.classList.add('is-seen'); });
      lastFlow = -1;
      kick();
    } else {
      if (flow) flow.style.removeProperty('--m-flow');
    }
  }

  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', function () { vh = innerHeight; kick(); }, { passive: true });
  if (mq.addEventListener) mq.addEventListener('change', sync); else mq.addListener(sync);
  if (document.readyState === 'complete') sync(); else addEventListener('load', sync);
  sync();
})();
