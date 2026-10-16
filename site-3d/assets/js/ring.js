/* ── «Нам доверяют»: спокойная лента оригинальных логотипов ──────────────
   Одна и та же лента на главной и в блоке «Доверие» на страницах услуг.
   Скорость очень низкая, а прокрутка лишь деликатно задаёт направление.
   Никакого blur/focus-эффекта: каждая марка остаётся читаемой по всей ленте.
   При наведении движение почти останавливается, чтобы спокойно рассмотреть
   конкретный логотип. Возвращает функцию пересборки (после смены языка). */
window.vakRing = function (ringEl, ringSet) {
  if (!ringEl || !ringSet || matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
  var PAD = 28;          // знак целиком уезжает за край до повтора
  var DRIFT = 15;        // px/с в покое — +25%, остаётся ровный спокойный ритм
  /* У прокрутки только небольшой вклад, и только с мышью: на телефоне палец
     водит страницу туда-сюда, и лента дёргалась бы вперёд-назад. */
  var GAIN = matchMedia('(hover:hover)').matches ? 0.05 : 0;
  var VMAX = 80;         // без разгона при резком wheel / trackpad
  var SLOW = 0.12;       // под курсором почти останавливается

  var src = Array.prototype.slice.call(ringSet.querySelectorAll('.ring__i'));
  if (!src.length) return null;

  var items = [], W = 0, setW = 0, L = 0, maxW = 0;
  var offset = 0, v = DRIFT, hov = 0, hovT = 0;
  var lastY = scrollY, sv = 0, prevT = 0, onScreen = true, built = false, io = null;

  function build() {
    if (!ringEl.isConnected) return;
    /* Мерить ширины нужно в обычной раскладке: в рабочем состоянии имена
       расставлены абсолютно и естественной ширины у строки уже нет.
       Промежуточное состояние не успевает отрисоваться — класс снимается
       и возвращается в пределах одной задачи. */
    ringEl.classList.remove('is-live');
    items.forEach(function (it) { if (it.clone) it.el.remove(); });
    items = [];

    W = ringEl.clientWidth;
    if (!W) return;

    var g = Math.max(32, Math.min(64, W * 0.036));
    var gaps = [], h = 0;
    setW = 0; maxW = 0;

    src.forEach(function (el) {
      var w = el.offsetWidth;
      var gp = g * (parseFloat(getComputedStyle(el).getPropertyValue('--g')) || 1);
      gaps.push(gp);
      setW += w + gp;
      if (w > maxW) maxW = w;
      if (el.offsetHeight > h) h = el.offsetHeight;
    });
    if (setW <= 0) return;

    /* Копий ровно столько, чтобы длина кольца перекрыла полосу вместе
       с запасом: тогда имя перескакивает в хвост, уже полностью уехав
       за левый край, и шва не видно. */
    var N = Math.max(1, Math.min(8, Math.ceil((W + maxW + 2 * PAD) / setW)));
    L = setW * N;

    for (var c = 0; c < N; c++) {
      var at = c * setW;
      for (var i = 0; i < src.length; i++) {
        var el = src[i];
        if (c > 0) {
          el = src[i].cloneNode(true);
          el.setAttribute('aria-hidden', 'true');   // копии не для чтения с экрана
          el.removeAttribute('data-i18n');
          ringSet.appendChild(el);
        }
        el.style.filter = 'none';
        el.style.textShadow = 'none';
        items.push({ el: el, w: src[i].offsetWidth, base: at, clone: c > 0, vis: -1 });
        at += src[i].offsetWidth + gaps[i];
      }
    }

    ringEl.style.setProperty('--ring-h', Math.round(h + 34) + 'px');
    ringEl.classList.add('is-live');
    built = true;
    draw(0);
  }

  function draw(dt) {
    /* Прыжок по якорной ссылке — это не скорость прокрутки, а телепорт:
       без отсечки он даёт мгновенный рывок ленты до потолка. */
    var y = scrollY, dy = y - lastY;
    lastY = y;
    if (Math.abs(dy) > innerHeight * 1.2) dy = 0;
    if (dt) sv += (dy / Math.max(dt, 1e-4) - sv) * Math.min(1, dt * 7);

    var vT = Math.max(-VMAX, Math.min(VMAX, DRIFT + sv * GAIN));
    v   += (vT   - v)   * (1 - Math.pow(1 - .11, dt * 60));
    hov += (hovT - hov) * (1 - Math.pow(1 - .12, dt * 60));

    offset += v * (1 - hov * (1 - SLOW)) * dt;

    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var x = it.base - offset;
      x = ((x % L) + L) % L;
      if (x > W + PAD) x -= L;

      if (x < -it.w - PAD) {                    // припарковано за кадром
        if (it.vis !== 0) { it.el.style.opacity = '0'; it.vis = 0; }
        continue;
      }

      it.el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,-50%,0)';
      if (it.vis !== 1) { it.el.style.opacity = '1'; it.vis = 1; }   // без лишней записи стиля каждый кадр
    }
  }

  /* На страницах услуг разметка перерисовывается при смене языка: лента,
     которую убрали со страницы, останавливается и отпускает обработчики. */
  function stop() {
    removeEventListener('resize', onResize);
    if (io) io.disconnect();
  }

  function frame(t) {
    if (!ringEl.isConnected) { stop(); return; }
    requestAnimationFrame(frame);
    if (!built || document.hidden || !onScreen) { prevT = t; return; }
    var dt = prevT ? Math.min(.05, (t - prevT) / 1000) : .016;
    prevT = t;
    draw(dt);
  }

  ringEl.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') hovT = 1; });
  ringEl.addEventListener('pointerleave', function () { hovT = 0; });

  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(function (en) { onScreen = en[0].isIntersecting; },
      { rootMargin: '120px 0px' });
    io.observe(ringEl);
  }

  // Пересборка только при смене ширины: в Safari высота окна меняется от
  // панелей при каждой смене направления прокрутки.
  var rt, builtW = innerWidth;
  function onResize() {
    if (innerWidth === builtW) return;
    builtW = innerWidth;
    clearTimeout(rt); rt = setTimeout(build, 180);
  }
  addEventListener('resize', onResize);

  build();
  // Повторная сборка нужна, только если шрифт ещё догружался (обычно он уже
  // пришёл по preload) — лишние пересчёты раскладки при открытии ни к чему.
  if (document.fonts && document.fonts.status !== 'loaded') document.fonts.ready.then(build);
  // Страховка: если лента собралась раньше, чем применились стили (один раз
  // в тестах получилась полоса высотой в строку), к load она пересоберётся.
  if (document.readyState !== 'complete') addEventListener('load', build, { once: true });
  requestAnimationFrame(frame);
  return build;
};
