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

  var foot = document.querySelector('footer');
  if (foot && 'MutationObserver' in window) new MutationObserver(prep).observe(foot, { childList: true });
  if (mq.addEventListener) mq.addEventListener('change', prep); else mq.addListener(prep);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', prep); else prep();
})();
