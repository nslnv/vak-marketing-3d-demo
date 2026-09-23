/* Strategy hero: pointer tilt and the luminance-masked glint overlay.
   service-page.js re-renders #main on a language switch, so the overlay is
   re-attached whenever the hero image is replaced. */
(function () {
  'use strict';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var main = document.getElementById('main');
  if (!main) return;
  var img = null, glint = null, tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;

  function place() {
    if (!img || !glint || !img.isConnected) return;
    glint.style.left = img.offsetLeft + 'px';
    glint.style.top = (img.offsetTop - img.offsetHeight / 2) + 'px';
    glint.style.width = img.offsetWidth + 'px';
    glint.style.height = img.offsetHeight + 'px';
  }
  function attach() {
    var next = main.querySelector('.sp-hero__visual--strategy .sp-hero__object');
    if (!next || next === img) return;
    img = next;
    glint = document.createElement('span');
    glint.className = 'sp-strat-glint';
    glint.setAttribute('aria-hidden', 'true');
    var url = 'url("' + (img.currentSrc || img.src) + '")';
    glint.style.webkitMaskImage = url;
    glint.style.maskImage = url;
    img.insertAdjacentElement('afterend', glint);
    if (img.complete) place(); else img.addEventListener('load', place, { once: true });
  }
  function tick() {
    raf = 0;
    cx += (tx - cx) * 0.12; cy += (ty - cy) * 0.12;
    // наклон задаётся контейнеру: его наследуют и объект, и блик
    var host = img && img.isConnected ? img.parentElement : null;
    if (host) {
      host.style.setProperty('--tilt-x', cy.toFixed(2) + 'deg');
      host.style.setProperty('--tilt-y', cx.toFixed(2) + 'deg');
    }
    if (Math.abs(tx - cx) > 0.01 || Math.abs(ty - cy) > 0.01) raf = requestAnimationFrame(tick);
  }
  window.addEventListener('pointermove', function (e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    if (window.scrollY > window.innerHeight) return;
    tx = (e.clientX / window.innerWidth - 0.5) * 10;
    ty = (e.clientY / window.innerHeight - 0.5) * -8;
    if (!raf) raf = requestAnimationFrame(tick);
  }, { passive: true });
  window.addEventListener('resize', place, { passive: true });
  new MutationObserver(attach).observe(main, { childList: true });
  attach();
})();
