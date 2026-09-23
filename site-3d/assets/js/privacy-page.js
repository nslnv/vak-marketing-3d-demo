/* Privacy page: language switch shared with the rest of the site
   (localStorage 'vak-lang'), the mobile menu, and the current section
   highlighted in the table of contents. No dependency on main.js. */
(function () {
  'use strict';
  var root = document.documentElement;
  var titles = { ru: 'Политика конфиденциальности — VAK Marketing', en: 'Privacy policy — VAK Marketing' };

  function setLang(lang) {
    root.lang = lang === 'en' ? 'en' : 'ru';
    document.title = titles[root.lang];
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
  window.addEventListener('resize', function () {
    if (!window.matchMedia('(max-width:1080px)').matches) closeMenu();
  }, { passive: true });

  var links = Array.prototype.slice.call(document.querySelectorAll('.pv-toc a'));
  if ('IntersectionObserver' in window && links.length) {
    var current = null;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        current = entry.target.id;
        links.forEach(function (a) { a.classList.toggle('is-current', a.getAttribute('href') === '#' + current); });
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    Array.prototype.forEach.call(document.querySelectorAll('.pv-sec'), function (s) { observer.observe(s); });
  }
})();
