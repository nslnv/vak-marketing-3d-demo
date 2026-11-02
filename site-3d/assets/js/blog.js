/* Блог: переключение языка (общее с сайтом, localStorage 'vak-lang'), мобильное меню,
   шапка при прокрутке и копирование ссылки на статью. То же, что privacy-page.js, но без оглавления и без смены
   заголовка вкладки: у каждой статьи он свой. */
(function () {
  'use strict';
  var root = document.documentElement;

  function setLang(lang) {
    root.lang = lang === 'en' ? 'en' : 'ru';
    Array.prototype.forEach.call(document.querySelectorAll('.lang__b'), function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === root.lang));
    });
    try { localStorage.setItem('vak-lang', root.lang); } catch (e) {}
  }
  setLang(root.lang);
  Array.prototype.forEach.call(document.querySelectorAll('.lang__b'), function (b) {
    b.addEventListener('click', function () { setLang(b.getAttribute('data-lang')); });
  });

  var nav = document.getElementById('nav');
  var burger = document.getElementById('burger');
  var menu = document.getElementById('menu');
  function syncScroll() { nav.classList.toggle('is-stuck', window.scrollY > 18); }
  syncScroll();
  window.addEventListener('scroll', syncScroll, { passive: true });
  function closeMenu() {
    if (menu.hidden) return;
    menu.hidden = true;
    burger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('is-locked');
    nav.classList.remove('is-open');
  }
  burger.addEventListener('click', function () {
    if (!menu.hidden) { closeMenu(); return; }
    menu.hidden = false;
    burger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('is-locked');
    nav.classList.add('is-open');
  });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(); });
  var services = document.querySelector('.nav__services');
  window.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    closeMenu();
    if (services) services.removeAttribute('open');
  });
  document.addEventListener('click', function (e) {
    if (services && services.open && !services.contains(e.target)) services.removeAttribute('open');
  });
  // «Скопировать ссылку» под статьёй.
  Array.prototype.forEach.call(document.querySelectorAll('[data-copy]'), function (b) {
    b.addEventListener('click', function () {
      var done = function () { b.textContent = root.lang === 'en' ? 'Copied' : 'Ссылка скопирована'; };
      if (navigator.clipboard) navigator.clipboard.writeText(b.getAttribute('data-copy')).then(done, function () {});
    });
  });
  window.addEventListener('resize', function () {
    if (!window.matchMedia('(max-width:1080px)').matches) closeMenu();
  }, { passive: true });
})();
