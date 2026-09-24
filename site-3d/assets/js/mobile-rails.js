/* Mobile rails: a thin position indicator under each swipe rail (services,
   audience, team). Width shows the visible share, position follows the
   finger. Only active up to 900 px; desktop layouts are left untouched. */
(function () {
  'use strict';
  var mq = window.matchMedia('(max-width:900px)');
  var selectors = ['.srv:not(.is-deck) .srv__deck', '.aud .slats', '.team .team__grid'];
  var rails = [];

  function update(rail) {
    var bar = rail.__bar;
    if (!bar) return;
    var max = rail.scrollWidth - rail.clientWidth;
    var share = rail.scrollWidth ? rail.clientWidth / rail.scrollWidth : 1;
    var thumb = Math.max(0.12, Math.min(1, share));
    var progress = max > 0 ? rail.scrollLeft / max : 0;
    bar.style.display = max > 2 ? '' : 'none';
    bar.style.setProperty('--m-thumb', (thumb * 100).toFixed(2) + '%');
    // translateX в процентах от ширины самого бегунка
    bar.style.setProperty('--m-pos', (progress * (1 - thumb) / thumb * 100).toFixed(2) + '%');
  }
  function attach() {
    selectors.forEach(function (sel) {
      var rail = document.querySelector(sel);
      if (!rail || rail.__bar) return;
      var bar = document.createElement('div');
      bar.className = 'm-rail-bar';
      bar.setAttribute('aria-hidden', 'true');
      bar.appendChild(document.createElement('i'));
      rail.insertAdjacentElement('afterend', bar);
      rail.__bar = bar;
      var ticking = false;
      rail.addEventListener('scroll', function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () { ticking = false; update(rail); });
      }, { passive: true });
      rails.push(rail);
      update(rail);
    });
  }
  function detach() {
    rails.forEach(function (rail) { if (rail.__bar) { rail.__bar.remove(); rail.__bar = null; } });
    rails = [];
  }
  function sync() { if (mq.matches) { attach(); rails.forEach(update); } else detach(); }
  if (mq.addEventListener) mq.addEventListener('change', sync); else mq.addListener(sync);
  window.addEventListener('resize', function () { rails.forEach(update); }, { passive: true });
  // колоду услуг строит main.js после загрузки — подключаемся, когда она готова
  if (document.readyState === 'complete') sync();
  else window.addEventListener('load', sync);
})();
