/* Аналитика vakmarketing.com: Яндекс Метрика 113735253 (с Вебвизором), Google Analytics 4
   G-86MMFNBTZ7 и Google Tag Manager GTM-W54MJGKK. GA4 стоит здесь напрямую, а не тегом
   в GTM: доступ к контейнеру у нас только на чтение. Если GA4 добавят и в GTM, отсюда его
   надо убрать, иначе визиты задвоятся.
   Счётчики стартуют сразу после разбора страницы в свободную паузу браузера: первый экран
   и 3D не ждут их, а короткие визиты всё равно засчитываются. До 28.10.2026 стояли
   счётчики старого сайта на Tilda: Метрика 96495064 и GTM-WXXJ3QSM. */
(function () {
  'use strict';
  var YM = 113735253, GTM = 'GTM-W54MJGKK', GA = 'G-86MMFNBTZ7';
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
  function analytics() {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA);
    var s = document.createElement('script');
    s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA;
    document.head.appendChild(s);
  }
  function start() {
    var go = function () { metrika(); analytics(); gtm(); };
    if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 2000 }); else setTimeout(go, 300);
  }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', start, { once: true });
  else start();
  // Заявка ушла — цель в Метрике, событие generate_lead в GA4 и событие в dataLayer.
  window.vakLead = function (where) {
    try { if (window.ym) window.ym(YM, 'reachGoal', 'lead', { where: where }); } catch (e) {}
    try { if (window.gtag) window.gtag('event', 'generate_lead', { lead_source: where }); } catch (e) {}
    (window.dataLayer = window.dataLayer || []).push({ event: 'lead', lead_source: where });
  };
})();
