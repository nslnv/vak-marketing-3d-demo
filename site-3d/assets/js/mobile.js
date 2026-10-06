/* ==========================================================================
   VAK Marketing — поведение мобильной главной (телефон и планшет): цепочка
   этапов «О нас», проявление фото аудитории и объектив первого экрана.
   Анимации пишут только transform, opacity и CSS-классы; объектив и пыльца
   рисуются на одном холсте в одном requestAnimationFrame. Компьютер с мышью
   этот файл не затрагивает.
   ========================================================================== */
(function () {
  'use strict';
  var mq = matchMedia('(max-width:900px)');
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var io = 'IntersectionObserver' in window;

  /* Цепочка этапов под «О VAK Marketing»: один раз загорается по очереди,
     когда целиком попадает в кадр (сама анимация — в CSS). */
  var flow = $('.about__flow-line');
  if (flow) {
    if (reduced || !io) flow.classList.add('is-run');
    else {
      var flowIo = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { flow.classList.add('is-run'); flowIo.disconnect(); }
      }, { threshold: 1, rootMargin: '0px 0px -18% 0px' });
      flowIo.observe(flow);
    }
  }

  /* Фото аудитории проявляются из лёгкого приближения. */
  var seen = io ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-seen'); seen.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -12% 0px' }) : null;
  function sync() {
    if (!mq.matches) return;
    $$('.aud .slat').forEach(function (s) { if (seen) seen.observe(s); else s.classList.add('is-seen'); });
  }
  if (mq.addEventListener) mq.addEventListener('change', sync); else mq.addListener(sync);
  sync();
})();

/* ── объектив первого экрана: телефон и планшет ──────────────────────────
   Вместо WebGL — настоящие кадры той же модели. Объектив стоит собранным,
   из передней линзы тихо струится пыльца, раз в несколько секунд по нему
   проходит блик. С началом прокрутки он разворачивается (14 кадров одного
   спрайта, соседние перетекают), улетает вдаль, пыльца тянется шлейфом;
   когда он улетел, появляются кнопки.
   Всё рисуется на одном холсте из уже раскодированных картинок, положение
   считается формулой: ни замеров страницы, ни перерисовки DOM на кадре.
   Холст лежит внутри первого экрана и прокручивается вместе со страницей
   силами браузера, а скрипт добавляет только сам номер — поэтому прибор не
   дрожит, когда палец водит страницу туда-сюда. Ход номера сглажен
   (догоняет прокрутку за ~0,1 с), а высота экрана берётся одна на
   ориентацию: в Safari она меняется от панелей, и номер дёргался.
   HTML-блок .hero__lens держит место и показывает первый кадр до холста. */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var mq = matchMedia('(max-width:900px), (hover:none) and (pointer:coarse)');
  var phone = matchMedia('(max-width:900px)');
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hero = $('.hero'), heroIn = $('.hero__in'), lens = $('.hero__lens');
  if (!hero || !heroIn || !lens) return;
  var FRAMES = 32, COLS = 4, DIR = '/assets/img/hero/';
  /* Передняя линза в каждом кадре (доли кадра) и куда смотрит её ось на
     экране — сняты из той же 3D-сцены. [x, y, dx, dy, длина оси]: когда
     линза развёрнута к зрителю, ось на экране короткая. */
  var FRONT = [
    [.863,.392,.987,-.159,1],[.854,.388,.985,-.17,1],[.845,.384,.983,-.183,1],[.835,.381,.981,-.196,1],[.824,.377,.978,-.209,1],
    [.813,.373,.975,-.224,1],[.802,.37,.971,-.24,.97],[.79,.367,.966,-.257,.95],[.777,.364,.961,-.275,.92],[.764,.363,.957,-.289,.88],
    [.751,.365,.955,-.298,.85],[.737,.37,.954,-.3,.8],[.723,.378,.956,-.294,.76],[.708,.389,.96,-.279,.71],[.693,.402,.967,-.254,.66],
    [.677,.418,.977,-.215,.6],[.662,.435,.987,-.159,.55],[.645,.454,.997,-.08,.49],[.629,.475,1,.028,.43],[.612,.496,.985,.172,.38],
    [.595,.518,.936,.352,.34],[.578,.54,.833,.554,.32],[.561,.561,.668,.744,.31],[.544,.582,.465,.885,.32],[.526,.601,.261,.965,.34],
    [.509,.618,.081,.997,.37],[.492,.633,-.069,.998,.41],[.474,.646,-.192,.981,.45],[.457,.656,-.295,.955,.49],
    [.44,.663,-.385,.923,.52],[.423,.667,-.465,.886,.55],[.406,.667,-.538,.843,.58]
  ];
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var ease = function (a, b, v) { var t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };

  var on = false, key = '', heroH = 1, heroTop = 0, cta = false, started = 0;
  var vw = innerWidth, vh = innerHeight;         // одна высота на ориентацию
  var base = { x: 0, y: 0, w: 1, h: 1 };        // блок .hero__lens в координатах первого экрана

  /* Высота объектива — по свободному месту между текстом и кнопками.
     Меряем синхронно, до отрисовки, и только при смене ширины/ориентации:
     в Safari высота окна меняется от панелей при каждой прокрутке. */
  function fit() {
    if (!mq.matches) { on = false; key = ''; hero.classList.remove('has-lens', 'is-cta'); showCanvas(false); return false; }
    var k = innerWidth + (innerWidth > innerHeight ? 'l' : 'p');
    if (k === key) return false;
    key = k;
    vw = innerWidth; vh = innerHeight;
    if (!phone.matches) { on = true; hero.classList.add('has-lens'); measure(); return true; }
    hero.classList.remove('has-lens');
    var minH = parseFloat(getComputedStyle(heroIn).minHeight) || 0;
    hero.classList.add('is-measuring');     // блок не растягивается: видна чистая высота текста и кнопок
    var natural = heroIn.offsetHeight;
    hero.classList.remove('is-measuring');
    // собранный прибор — верхние ~78% кадра 600 × 448; по ширине он
    // занимает не весь экран: справа нужно место для потока пыльцы
    var h = Math.min(innerWidth >= 600 ? 300 : 230, (minH - natural - 36) / 0.8, innerWidth * 0.76 * 448 / 600);
    on = h >= 120;
    if (on) {
      lens.style.setProperty('--lens-h', Math.floor(h) + 'px');
      hero.classList.add('has-lens');
      measure();
    } else { hero.classList.remove('is-cta'); showCanvas(false); }
    return true;
  }
  function measure() {
    if (!on) return;
    var r = lens.getBoundingClientRect(), hr = hero.getBoundingClientRect();
    base.w = r.width; base.h = r.height;
    base.x = r.left - hr.left + r.width / 2; base.y = r.top - hr.top + r.height / 2;
    heroTop = hr.top + scrollY; heroH = hero.offsetHeight;
    sizeCanvas();
  }

  /* ---------- холст ---------- */
  var cv = null, cx = null, dpr = 1, img0 = null, sprite = null, canvasOn = false;
  function ensureCanvas() {
    if (cv) return;
    cv = document.createElement('canvas');
    cv.className = 'hero__dust';
    cv.setAttribute('aria-hidden', 'true');
    hero.appendChild(cv);
    cx = cv.getContext('2d');
    sizeCanvas();
  }
  /* Холст размером с первый экран; пересоздаётся только при смене ширины
     или высоты блока, не на каждое движение панелей Safari. Плотность ≤2:
     третья на iPhone удваивала работу без видимой разницы. */
  var cw = 1, ch = 1;
  function sizeCanvas() {
    if (!cv) return;
    var w = hero.clientWidth, h = heroH, d = Math.min(2, devicePixelRatio || 1);
    if (w === cw && h === ch && d === dpr) return;
    cw = w; ch = h; dpr = d; dirty = null;
    cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
  }
  function showCanvas(v) {
    if (!cv || canvasOn === v) return;
    canvasOn = v;
    cv.classList.toggle('is-on', v);
  }
  /* Картинки для холста декодируются вне основного потока
     (createImageBitmap): иначе первый drawImage большого спрайта
     раскодировал его прямо в кадре, и объектив подвисал. */
  var avifOk = null;
  function supportsAvif(cb) {
    if (avifOk != null) return cb(avifOk);
    var t = new Image();
    t.onload = function () { avifOk = t.width > 0; cb(avifOk); };
    t.onerror = function () { avifOk = false; cb(false); };
    t.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  }
  var blobs = {};
  function loadImg(name, done, small) {
    supportsAvif(function (avif) {
      var src = DIR + name + (avif ? '.avif' : '.webp');
      var viaImg = function () {
        var img = new Image();
        img.decoding = 'async';
        img.onload = function () {
          var ready = function () { done(img); };
          if (img.decode) img.decode().then(ready, ready); else ready();
        };
        img.src = src;
      };
      // маленький первый кадр берём обычной картинкой — её уже загрузил preload
      if (small || !window.createImageBitmap || !window.fetch) return viaImg();
      fetch(src).then(function (r) { if (!r.ok) throw 0; return r.blob(); })
        .then(function (b) { blobs[name] = b; return createImageBitmap(b); })
        .then(done, viaImg);
    });
  }

  /* ---------- пыльца ---------- */
  var parts = [], acc = 0;
  var COLORS = ['255,255,255', '207,233,255', '201,188,255', '191,233,255', '255,160,214'];
  function spawn(n, e, boost) {
    for (var i = 0; i < n && parts.length < 340; i++) {
      // линза смотрит на зрителя — струя раскрывается веером к нам
      var spread = (Math.random() - 0.5) * (0.5 + boost * 0.5 + (1 - e.len) * 2.2);
      var cs = Math.cos(spread), sn = Math.sin(spread);
      var dx = e.dx * cs - e.dy * sn, dy = e.dx * sn + e.dy * cs;
      var sp = e.w * (0.16 + Math.random() * 0.34) * (0.6 + e.len * 0.4) * (1 + boost * 1.4);
      parts.push({
        x: e.x + (Math.random() - 0.5) * e.w * 0.03, y: e.y + (Math.random() - 0.5) * e.w * 0.03,
        vx: dx * sp, vy: dy * sp, life: 0, max: 1.1 + Math.random() * 1.3,
        r: (0.7 + Math.random() * 1.6) * (e.w / 330) * (1 + boost * 0.35), g: (1 - e.len) * 1.6,
        c: COLORS[(Math.random() * COLORS.length) | 0], tw: Math.random() * 6.28
      });
    }
  }

  /* ---------- кадр ---------- */
  var lastT = 0, raf = 0, ys = null, dirty = null;
  function draw(t) {
    raf = 0;
    if (!on || !cx) return;
    var dt = Math.min(0.05, (t - (lastT || t)) / 1000); lastT = t;
    // Координаты — внутри первого экрана. Номер идёт за сглаженной
    // прокруткой ys: рывки пальца туда-сюда превращаются в плавный ход.
    var sy = Math.max(0, scrollY - heroTop);
    if (ys == null || reduced) ys = sy;
    else { ys += (sy - ys) * (1 - Math.exp(-dt * 11)); if (Math.abs(sy - ys) < 0.25) ys = sy; }
    // Весь номер — первые ~40% экрана прокрутки. На горизонтальном планшете
    // кнопки стоят высоко, поэтому полёт короче: они появляются на глазах.
    var D = vh * (phone.matches ? 0.42 : 0.2);
    var y = Math.min(ys, D);
    var prog = reduced ? 0 : clamp(ys / D);
    var turn = ease(0, 0.6, prog), fly = ease(0.3, 1, prog);
    var f = turn * (FRAMES - 1);
    // Пока разворачивается, прибор почти висит на экране (и смещается к
    // середине: боком он шире всего); затем уходит в точку схода и тает.
    var vx = cw * 0.64, vy = ys + Math.max(110, vh * 0.2);
    var cx0 = base.x + (cw * 0.5 - base.x) * turn * 0.8, cy0 = base.y + y * 0.8;
    var bob = reduced ? 0 : Math.sin(t / 1000 * 0.9) * 3.5 * (1 - turn);   // лёгкое покачивание в покое
    var X = cx0 + (vx - cx0) * fly, Y = cy0 + (vy - cy0) * fly + bob;
    var S = 1 - 0.95 * Math.pow(fly, 1.35);
    var fade = started ? clamp((t - started) / 900) : 0;
    var O = (1 - ease(0.78, 1, prog)) * fade;
    var W = base.w * S, H = base.h * S, L = X - W / 2, T = Y - H / 2;

    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Стираем только то, что рисовали в прошлом кадре, а не весь холст.
    if (dirty) cx.clearRect(dirty[0], dirty[1], dirty[2] - dirty[0], dirty[3] - dirty[1]);
    var nd = [1e9, 1e9, -1e9, -1e9];
    var grow = function (x0, y0, x1, y1) { if (x0 < nd[0]) nd[0] = x0; if (y0 < nd[1]) nd[1] = y0; if (x1 > nd[2]) nd[2] = x1; if (y1 > nd[3]) nd[3] = y1; };
    var lensVisible = O > 0.003 && T < sy + vh && T + H > sy;
    if (lensVisible) grow(L - W * 0.25, T - H * 0.25, L + W * 1.25, T + H * 1.25);
    if (lensVisible && img0) {
      // кадры перетекают: сложение двух взвешенных кадров на пустом холсте
      cx.globalCompositeOperation = 'lighter';
      if (sprite) {
        // кадры лежат сеткой 4 × 8: так картинка не упирается в предел размера на iPhone
        var fw = sprite.width / COLS, fh = sprite.height / Math.ceil(FRAMES / COLS);
        var a = Math.floor(f), b = Math.min(FRAMES - 1, a + 1), k = f - a;
        cx.globalAlpha = O * (1 - k); cx.drawImage(sprite, (a % COLS) * fw, Math.floor(a / COLS) * fh, fw, fh, L, T, W, H);
        if (k > 0.003) { cx.globalAlpha = O * k; cx.drawImage(sprite, (b % COLS) * fw, Math.floor(b / COLS) * fh, fw, fh, L, T, W, H); }
      } else { cx.globalAlpha = O; cx.drawImage(img0, L, T, W, H); }
      // блик по металлу и вспышка линзы — только пока прибор стоит
      var still = (1 - ease(0, 0.04, prog)) * fade;
      if (still > 0 && !reduced) {
        var ph = ((t / 1000 - 1.6) % 5.2 + 5.2) % 5.2 / 5.2;
        if (ph < 0.3) {
          var u = ph / 0.3, e2 = u * u * (3 - 2 * u), bx = L - W * 0.4 + e2 * W * 1.8;
          var g = cx.createLinearGradient(bx - W * 0.16, T, bx + W * 0.16, T + H * 0.35);
          g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(236,232,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
          cx.globalCompositeOperation = 'source-atop'; cx.globalAlpha = still;
          cx.fillStyle = g; cx.fillRect(L, T, W, H);
        }
        if (ph > 0.2 && ph < 0.48) {
          var q = ph < 0.29 ? (ph - 0.2) / 0.09 : 1 - (ph - 0.29) / 0.19;
          var fx = L + FRONT[0][0] * W, fy = T + FRONT[0][1] * H, R = W * 0.16 * (0.5 + q * 0.6);
          var rg = cx.createRadialGradient(fx, fy, 0, fx, fy, R);
          rg.addColorStop(0, 'rgba(255,255,255,0.95)'); rg.addColorStop(0.2, 'rgba(191,233,255,0.5)'); rg.addColorStop(1, 'rgba(160,140,255,0)');
          cx.globalCompositeOperation = 'lighter'; cx.globalAlpha = still * q;
          cx.fillStyle = rg; cx.fillRect(fx - R, fy - R, R * 2, R * 2);
        }
      }
    }

    // пыльца из передней линзы: тихий поток в покое, шлейф при улёте
    if (!reduced && dt > 0 && lensVisible && prog < 0.995) {
      var fa = Math.floor(f), fb = Math.min(FRAMES - 1, fa + 1), fk = f - fa, A = FRONT[fa], B = FRONT[fb];
      var m = function (i) { return A[i] + (B[i] - A[i]) * fk; };
      var ddx = m(2), ddy = m(3), dl = Math.hypot(ddx, ddy) || 1;
      var em = { x: L + m(0) * W, y: T + m(1) * H, dx: ddx / dl, dy: ddy / dl, len: m(4), w: W };
      // линза развёрнута к зрителю и толкает прибор вдаль — она светится
      var glow = turn * O;
      if (glow > 0.01) {
        var GR = W * (0.2 + 0.1 * Math.sin(t / 90) * 0.5);
        var gg = cx.createRadialGradient(em.x, em.y, 0, em.x, em.y, GR);
        gg.addColorStop(0, 'rgba(255,255,255,0.9)'); gg.addColorStop(0.18, 'rgba(191,233,255,0.55)');
        gg.addColorStop(0.5, 'rgba(150,120,255,0.18)'); gg.addColorStop(1, 'rgba(150,120,255,0)');
        cx.globalCompositeOperation = 'lighter'; cx.globalAlpha = glow;
        cx.fillStyle = gg; cx.fillRect(em.x - GR, em.y - GR, GR * 2, GR * 2); cx.globalAlpha = 1;
      }
      var flying = ease(0.25, 0.8, prog);
      acc += dt * (64 + flying * 170) * (prog > 0.9 ? (1 - prog) * 10 : 1) * fade;
      var n = acc | 0; acc -= n;
      if (n) spawn(n, em, flying);
    }
    // частицы живут на странице и уплывают вместе с ней
    cx.globalCompositeOperation = 'lighter';
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.life += dt;
      if (p.life >= p.max) { parts.splice(i, 1); continue; }
      var drag = Math.pow(0.45, dt);
      p.vx *= drag; p.vy *= drag;
      p.x += p.vx * dt; p.y += p.vy * dt - 6 * dt;
      var kk = p.life / p.max, al = (kk < 0.15 ? kk / 0.15 : 1 - (kk - 0.15) / 0.85) * (0.55 + 0.45 * Math.sin(p.tw + p.life * 9));
      cx.globalAlpha = 1;
      cx.fillStyle = 'rgba(' + p.c + ',' + Math.min(1, al).toFixed(3) + ')';
      var pr = p.r * (1 + p.g * kk);            // летящие к зрителю частицы растут
      grow(p.x - pr * 2.5, p.y - pr * 2.5, p.x + pr * 2.5, p.y + pr * 2.5);
      cx.beginPath(); cx.arc(p.x, p.y, pr, 0, 6.2832); cx.fill();
      if (pr > 1.3) { cx.fillStyle = 'rgba(' + p.c + ',' + (al * 0.12).toFixed(3) + ')'; cx.beginPath(); cx.arc(p.x, p.y, pr * 2.4, 0, 6.2832); cx.fill(); }
    }
    cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over';
    dirty = nd[2] > nd[0] ? [Math.max(0, Math.floor(nd[0]) - 2), Math.max(0, Math.floor(nd[1]) - 2), Math.min(cw, Math.ceil(nd[2]) + 2), Math.min(ch, Math.ceil(nd[3]) + 2)] : null;

    // Кнопки появляются, когда прибор улетел, и дальше остаются: если
    // прятать их при обратной прокрутке, они мигали от движения пальца.
    if (!cta && (reduced || prog >= 0.86)) { cta = true; hero.classList.add('is-cta'); }

    var busy = lensVisible || parts.length > 0;
    showCanvas(busy);
    // Пока прибор на экране, летит пыльца или номер догоняет прокрутку —
    // следующий кадр; дальше холст спит до возврата к первому экрану.
    if (!document.hidden && (busy || sy < heroH || ys !== sy)) raf = requestAnimationFrame(draw);
  }
  function kick() { if (!raf && on && cx) raf = requestAnimationFrame(draw); }

  function start() {
    if (!on) return;
    ensureCanvas();
    if (!img0) loadImg('lens-0', function (im) {
      img0 = im; started = performance.now();
      lens.classList.add('is-canvas');           // дальше прибор рисует холст
      kick();
    }, true);
  }
  /* Кадры разворота (~0,5 МБ) грузим чуть позже открытия (0,9 с после
     загрузки) или сразу при первом касании: к началу прокрутки они уже
     раскодированы и переданы видеокарте, и первый разворот не дёргается.
     До их прихода прибор летит первым кадром. */
  var sprReq = false;
  function loadSprite() {
    if (sprReq || !on || reduced) return;
    sprReq = true;
    loadImg('lens-turn', function (im) {
      sprite = im;
      /* Сразу один раз «показываем» лист видеокарте на крошечном холсте,
         пока прибор ещё стоит: иначе загрузка текстуры попадала в первый
         кадр разворота. */
      try { var w = document.createElement('canvas'); w.width = w.height = 2; w.getContext('2d').drawImage(im, 0, 0, 2, 2); } catch (e) {}
      kick();
    });
  }
  /* Раскодированный лист кадров занимает ~34 МБ памяти. Во встроенных
     браузерах Telegram и Instagram памяти меньше, и при её нехватке браузер
     выкидывает уже раскодированные фото страницы, а при прокрутке назад
     раскодирует их заново — отсюда подтормаживания. Поэтому, когда первый
     экран далеко позади, лист освобождаем, а при возвращении заново
     раскодируем вне основного потока из сохранённого файла (~0,5 МБ). Пока
     он не готов, прибор у начала разворота показан первым кадром. */
  var released = false;
  function spriteMemory() {
    if (!on || !sprite) {
      if (released && on && scrollY < heroTop + heroH + vh * 1.2) {
        released = false;
        var b = blobs['lens-turn'];
        if (b && window.createImageBitmap) createImageBitmap(b).then(function (im) { sprite = im; kick(); }, function () {});
        else { sprReq = false; loadSprite(); }
      }
      return;
    }
    if (scrollY > heroTop + heroH + vh * 2 && sprite.close) {
      sprite.close(); sprite = null; released = true;
    }
  }
  var sprTimer = 0;
  function idleSprite() {
    if (sprReq || sprTimer) return;
    sprTimer = setTimeout(loadSprite, 900);
  }
  ['touchstart', 'scroll', 'wheel'].forEach(function (type) {
    addEventListener(type, function first() { removeEventListener(type, first); loadSprite(); }, { passive: true, once: true });
  });

  function sync() {
    fit();
    if (on) { start(); measure(); kick(); if (document.readyState === 'complete') idleSprite(); }
  }
  sync();
  addEventListener('load', idleSprite);
  addEventListener('scroll', function () { kick(); spriteMemory(); }, { passive: true });
  // Панели Safari при прокрутке тоже шлют resize: реагируем только на смену
  // ширины или ориентации, иначе холст пересоздавался прямо в движении.
  addEventListener('resize', function () {
    if (fit() && on) { start(); measure(); kick(); idleSprite(); }
  }, { passive: true });
  document.addEventListener('visibilitychange', function () { lastT = 0; kick(); });
  if (mq.addEventListener) mq.addEventListener('change', sync); else mq.addListener(sync);
  // Шрифт уточняет высоту заголовка — перемеряем свободное место.
  if (document.fonts && document.fonts.status !== 'loaded') document.fonts.ready.then(function () { key = ''; fit(); if (on) { measure(); kick(); } });
})();
