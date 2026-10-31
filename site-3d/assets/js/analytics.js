/* Аналитика vakmarketing.com: Яндекс Метрика 113735253 (с Вебвизором), Google Analytics 4
   G-86MMFNBTZ7 и Google Tag Manager GTM-W54MJGKK. GA4 стоит здесь напрямую, а не тегом
   в GTM: доступ к контейнеру у нас только на чтение. Если GA4 добавят и в GTM, отсюда его
   надо убрать, иначе визиты задвоятся.
   Счётчики стартуют сразу после разбора страницы в свободную паузу браузера: первый экран
   и 3D не ждут их, а короткие визиты всё равно засчитываются. До 28.10.2026 стояли
   счётчики старого сайта на Tilda: Метрика 96495064 и GTM-WXXJ3QSM.

   Согласие на cookie (окно внизу экрана, выбор хранится год в localStorage 'vak-consent'):
   - посетители из ЕС, ЕЭЗ, Великобритании и Швейцарии (по часовому поясу браузера) до согласия
     идут без cookie: Google Analytics в режиме согласия «denied» (только обезличенные сигналы),
     Метрика не загружается;
   - остальным счётчики работают сразу, окно сообщает о cookie и даёт отказаться;
   - «Только необходимые» выключает Метрику, переводит Google в «denied» и стирает их cookie.
   window.vakConsent.open() и любые [data-cookie-settings] снова показывают окно. */
(function () {
  'use strict';
  var YM = 113735253, GTM = 'GTM-W54MJGKK', GA = 'G-86MMFNBTZ7';
  var KEY = 'vak-consent', YEAR = 365 * 864e5;
  var local = /^(localhost|127\.|192\.168\.)/.test(location.hostname);   // локальная разработка не считается
  var GDPR = /^(Europe\/(Amsterdam|Athens|Berlin|Bratislava|Brussels|Bucharest|Budapest|Busingen|Copenhagen|Dublin|Guernsey|Helsinki|Isle_of_Man|Jersey|Lisbon|Ljubljana|London|Luxembourg|Madrid|Malta|Mariehamn|Nicosia|Oslo|Paris|Prague|Riga|Rome|Sofia|Stockholm|Tallinn|Vaduz|Vienna|Vilnius|Warsaw|Zagreb|Zurich)|Asia\/(Nicosia|Famagusta)|Atlantic\/(Canary|Madeira|Azores|Reykjavik)|Africa\/Ceuta)$/;

  var choice = readChoice();                 // true — все cookie, false — только необходимые, null — не выбирал
  var strict = inGdprZone();
  var allowed = choice === null ? !strict : choice;
  var ymLoaded = false;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', consentState(allowed, choice === true));

  function readChoice() {
    try {
      var c = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (c && Date.now() - c.t < YEAR) return !!c.a;
    } catch (e) {}
    return null;
  }
  function saveChoice(all) {
    try { localStorage.setItem(KEY, JSON.stringify({ a: all, t: Date.now() })); } catch (e) {}
  }
  function inGdprZone() {
    try { return GDPR.test(Intl.DateTimeFormat().resolvedOptions().timeZone || ''); } catch (e) { return false; }
  }
  function consentState(analytics, ads) {
    var a = analytics ? 'granted' : 'denied', b = ads ? 'granted' : 'denied';
    return { analytics_storage: a, ad_storage: b, ad_user_data: b, ad_personalization: b };
  }

  function metrika() {
    if (ymLoaded || local) return;
    ymLoaded = true;
    window['disableYaCounter' + YM] = false;
    window.ym = window.ym || function () { (window.ym.a = window.ym.a || []).push(arguments); };
    window.ym.l = 1 * new Date();
    var s = document.createElement('script');
    s.async = true; s.src = 'https://mc.yandex.ru/metrika/tag.js';
    document.head.appendChild(s);
    window.ym(YM, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });
  }
  function gtm() {
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    var s = document.createElement('script');
    s.async = true; s.src = 'https://www.googletagmanager.com/gtm.js?id=' + GTM;
    document.head.appendChild(s);
  }
  function analytics() {
    window.gtag('js', new Date());
    window.gtag('config', GA);
    var s = document.createElement('script');
    s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA;
    document.head.appendChild(s);
  }
  function start() {
    if (choice === null) banner.show();
    if (local) return;
    var go = function () { if (allowed) metrika(); analytics(); gtm(); };
    if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 2000 }); else setTimeout(go, 300);
  }

  function accept() {
    choice = allowed = true;
    saveChoice(true);
    window.gtag('consent', 'update', consentState(true, true));
    metrika();
    banner.hide();
  }
  function decline() {
    choice = allowed = false;
    saveChoice(false);
    window.gtag('consent', 'update', consentState(false, false));
    window['disableYaCounter' + YM] = true;
    // Стираем уже поставленные cookie Метрики и Google Analytics.
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (!/^(_ym|_ga|_gid|_gat)/.test(name)) return;
      ['', '; domain=' + location.hostname, '; domain=.' + location.hostname.replace(/^www\./, '')].forEach(function (d) {
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + d;
      });
    });
    banner.hide();
  }

  /* ---------- окно о cookie: стекло и кнопки сайта, тексты на языке страницы ---------- */
  var TEXT = {
    ru: {
      body: 'Сайт использует cookie. Необходимые нужны для его работы, аналитические (Яндекс Метрика и Google Analytics) помогают понять, что посетителям полезно. Подробнее в <a href="/privacy/#p5">политике конфиденциальности</a>.',
      yes: 'Принять все', no: 'Только необходимые', label: 'Настройки cookie'
    },
    en: {
      body: 'This site uses cookies. Essential ones keep it working, analytics cookies (Yandex Metrica and Google Analytics) show us what visitors find useful. Details in our <a href="/privacy/#p5">privacy policy</a>.',
      yes: 'Accept all', no: 'Essential only', label: 'Cookie settings'
    }
  };
  var CSS = '.ck{position:fixed;left:24px;bottom:24px;z-index:210;width:min(440px,calc(100vw - 48px));' +
    'padding:20px 22px 22px;border-radius:22px;background:rgba(20,16,32,.94);border:1px solid var(--line-2,rgba(255,255,255,.15));' +
    'backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:0 24px 60px -24px rgba(0,0,0,.8);' +
    'color:var(--ink-2,#E0DCEC);font:400 14px/1.55 var(--f,Manrope,sans-serif);letter-spacing:-.005em;' +
    'opacity:0;transform:translateY(16px);transition:opacity .45s var(--e,ease),transform .45s var(--e,ease)}' +
    '.ck.is-on{opacity:1;transform:none}' +
    '.ck p{margin:0}' +
    '.ck a{color:var(--ink,#F5F3FB);text-decoration:underline;text-decoration-color:rgba(255,255,255,.35);text-underline-offset:3px}' +
    '.ck a:hover{text-decoration-color:currentColor}' +
    '.ck__act{display:flex;gap:10px;margin-top:16px}' +
    '.ck__act .btn{height:42px;padding:0 20px;font-size:14px;flex:0 0 auto}' +
    '@media (max-width:600px){.ck{left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));width:auto;padding:18px 18px 18px}' +
    '.ck__act .btn{flex:1 1 0;padding:0 12px}}' +
    '@media (hover:none) and (pointer:coarse){.ck{backdrop-filter:none;-webkit-backdrop-filter:none;background:#15112A}}' +
    '@media (prefers-reduced-motion:reduce){.ck{transition:opacity .2s;transform:none}}';

  var banner = (function () {
    var el = null;
    function lang() { return document.documentElement.lang === 'en' ? 'en' : 'ru'; }
    function fill() {
      var t = TEXT[lang()];
      el.setAttribute('aria-label', t.label);
      el.querySelector('p').innerHTML = t.body;
      el.querySelector('[data-ck=yes]').textContent = t.yes;
      el.querySelector('[data-ck=no]').textContent = t.no;
    }
    function build() {
      var st = document.createElement('style');
      st.textContent = CSS;
      document.head.appendChild(st);
      el = document.createElement('section');
      el.className = 'ck';
      el.setAttribute('role', 'region');
      el.innerHTML = '<p></p><div class="ck__act"><button type="button" class="btn btn--primary" data-ck="yes"></button>' +
        '<button type="button" class="btn btn--ghost" data-ck="no"></button></div>';
      el.querySelector('[data-ck=yes]').addEventListener('click', accept);
      el.querySelector('[data-ck=no]').addEventListener('click', decline);
      fill();
      document.body.appendChild(el);
      // Язык переключается без перезагрузки: обе страницы меняют lang у <html>.
      new MutationObserver(fill).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    }
    return {
      show: function () {
        if (!el) build();
        el.hidden = false;
        void el.offsetWidth;   // стартовое положение применяется до появления, анимация идёт и без кадров отрисовки
        el.classList.add('is-on');
      },
      hide: function () {
        if (!el) return;
        el.classList.remove('is-on');
        setTimeout(function () { el.hidden = true; }, 450);
      }
    };
  })();

  window.vakConsent = { open: banner.show, accept: accept, decline: decline };
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-cookie-settings]');
    if (b) { e.preventDefault(); banner.show(); }
  });

  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', start, { once: true });
  else start();

  // Клики по Telegram, WhatsApp, почте и телефону: событие contact в GA4 (в Метрике это её автоцели).
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var h = a.getAttribute('href');
    var m = /^https?:\/\/t\.me\//.test(h) ? 'telegram' : /wa\.me|whatsapp\.com/.test(h) ? 'whatsapp'
      : /^mailto:/.test(h) ? 'email' : /^tel:/.test(h) ? 'phone' : '';
    if (m) window.gtag('event', 'contact', { method: m });
  }, true);
  // Заявка ушла — цель в Метрике, событие generate_lead в GA4 и событие в dataLayer.
  window.vakLead = function (where) {
    try { if (window.ym && ymLoaded) window.ym(YM, 'reachGoal', 'lead', { where: where }); } catch (e) {}
    try { window.gtag('event', 'generate_lead', { lead_source: where }); } catch (e) {}
    window.dataLayer.push({ event: 'lead', lead_source: where });
  };
})();
