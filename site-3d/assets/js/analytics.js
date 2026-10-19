/* Аналитика со старого сайта vakmarketing.com (Tilda): Яндекс Метрика 96495064
   (с Вебвизором, как было) и Google Tag Manager GTM-WXXJ3QSM — статистика
   продолжается в тех же счётчиках. Подключаются после загрузки страницы и
   паузы, чтобы не мешать первому экрану, 3D и прокрутке. */
(function () {
  'use strict';
  var YM = 96495064, GTM = 'GTM-WXXJ3QSM';
  if (/^(localhost|127\.|192\.168\.)/.test(location.hostname)) return;   // локальная разработка не считается
  function metrika() {
    window.ym = window.ym || function () { (window.ym.a = window.ym.a || []).push(arguments); };
    window.ym.l = 1 * new Date();
    var s = document.createElement('script');
    s.async = true; s.src = 'https://mc.yandex.ru/metrika/tag.js';
    document.head.appendChild(s);
    window.ym(YM, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });
  }
  function gtm() {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    var s = document.createElement('script');
    s.async = true; s.src = 'https://www.googletagmanager.com/gtm.js?id=' + GTM;
    document.head.appendChild(s);
  }
  function start() {
    var go = function () { metrika(); gtm(); };
    if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 4000 }); else go();
  }
  if (document.readyState === 'complete') setTimeout(start, 1800);
  else addEventListener('load', function () { setTimeout(start, 1800); }, { once: true });
  // Заявка ушла — цель в Метрике и событие в dataLayer.
  window.vakLead = function (where) {
    try { if (window.ym) window.ym(YM, 'reachGoal', 'lead', { where: where }); } catch (e) {}
    (window.dataLayer = window.dataLayer || []).push({ event: 'lead', lead_source: where });
  };
})();
