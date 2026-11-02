/* Админка блога vakmarketing.com/admin/: вход по ключу редактора, список статей,
   редактор, выдача ключей. Всё общение — с Apps Script (docs/leads-telegram/Blog.gs),
   он пишет статьи в репозиторий, а сборка сайта делает из них страницы блога.
   Картинки во время правки показываются прямо из репозитория (raw.githubusercontent.com),
   в статье хранятся как /blog/media/…: так они видны сразу после загрузки, до сборки. */
(function () {
  'use strict';
  var API = 'https://script.google.com/macros/s/AKfycbyEsh4G_SMcSX0Jgc5TX5T5EzaVhynD4Sxz6F9iFTDGQ14gprT0J6Yu7j5BlHvC7WV-DA/exec';
  var RAW = 'https://raw.githubusercontent.com/nslnv/vak-marketing-3d-demo/main/content/blog/';
  // Отдельное развёртывание того же скрипта для nslnv.seo: оно отвечает сеошке без редиректа (см. doPost).
  var NSLNV = 'https://script.google.com/macros/s/AKfycbzBcYAfw0RdhqnqDpRad1fkEuf1xzJV6h1CNDUa4yBh7bu3BlE2UOCrxXoDIRVEsuFyvQ/exec';
  var STORE = 'vak-editor-key';
  var key = '';
  var me = null;
  try { key = localStorage.getItem(STORE) || ''; } catch (e) {}

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function view(name) {
    $$('.ad-view').forEach(function (v) { v.hidden = v.getAttribute('data-view') !== name; });
    $$('.ad-bar__nav a').forEach(function (a) { a.classList.toggle('is-on', a.getAttribute('href') === '#' + name); });
    window.scrollTo(0, 0);
    return $('[data-view="' + name + '"]');
  }
  function say(root, text, kind) {
    var m = $('[data-msg]', root);
    m.className = 'ad-msg' + (kind ? ' is-' + kind : '');
    m.innerHTML = text || '';
  }
  function api(action, extra) {
    var body = { action: action, key: key };
    Object.keys(extra || {}).forEach(function (k) { body[k] = extra[k]; });
    // text/plain не вызывает предварительный запрос, который Apps Script не обслуживает.
    return fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); })
      .then(function (res) { if (!res.ok) throw new Error(res.error || 'Не получилось'); return res; });
  }
  var MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  function human(d) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || ''); return m ? Number(m[3]) + ' ' + MONTHS[Number(m[2]) - 1] + ' ' + m[1] : ''; }
  function today() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  var TR = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
    п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' };
  function slugify(s) {
    return String(s || '').toLowerCase().split('').map(function (c) { return TR[c] !== undefined ? TR[c] : c; }).join('')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80).replace(/-+$/, '');
  }

  /* ---------- вход ---------- */
  function signIn() {
    return api('me').then(function (res) {
      me = res;
      $$('[data-auth]').forEach(function (el) { el.hidden = false; });
      $$('[data-owner]').forEach(function (el) { el.hidden = me.role !== 'owner'; });
      $('[data-name]').textContent = me.name;
    });
  }
  $('[data-login]').addEventListener('submit', function (e) {
    e.preventDefault();
    var form = e.currentTarget;
    key = form.key.value.trim();
    say(form, 'Проверяем ключ…');
    signIn().then(function () {
      try { localStorage.setItem(STORE, key); } catch (err) {}
      form.reset();
      location.hash = '#list';
      route();
    }).catch(function (err) { say(form, err.message, 'err'); });
  });
  $('[data-logout]').addEventListener('click', function () {
    try { localStorage.removeItem(STORE); } catch (e) {}
    key = ''; me = null;
    $$('[data-auth]').forEach(function (el) { el.hidden = true; });
    view('login');
  });

  /* ---------- список ---------- */
  function showList() {
    var v = view('list'), box = $('[data-list]', v);
    say(v, 'Загружаем статьи…');
    box.innerHTML = '';
    api('list').then(function (res) {
      say(v, '');
      if (!res.posts.length) { box.innerHTML = '<p>Статей пока нет. Нажмите «Новая статья».</p>'; return; }
      box.innerHTML = res.posts.map(function (p) {
        var live = p.status === 'published';
        return '<div class="ad-item"><a class="ad-item__title" href="#edit/' + esc(p.slug) + '">' + esc(p.title) + '</a>' +
          '<span class="ad-item__meta">' + human(p.date) + ' · ' + (p.lang === 'en' ? 'EN' : 'RU') + (p.author ? ' · ' + esc(p.author) : '') +
          (p.source === 'nslnv' ? ' · из nslnv.seo' : '') + '</span>' +
          '<span class="ad-item__side"><span class="ad-chip' + (live ? ' ad-chip--live' : '') + '">' + (live ? 'Опубликована' : 'Черновик') + '</span>' +
          (live ? '<a class="ad-link" href="/blog/' + esc(p.slug) + '/" target="_blank" rel="noopener">На сайте ↗</a>' : '') + '</span></div>';
      }).join('');
    }).catch(function (err) { say(v, err.message, 'err'); });
  }

  /* ---------- редактор ---------- */
  var ed = { slug: '', status: '', cover: '', dirty: false, slugTouched: false, range: null };
  var form = $('[data-form]'), body = $('[data-body]'), ev = $('[data-view="edit"]');
  try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch (e) {}

  function toEditor(html) { return String(html || '').split('src="/blog/media/').join('src="' + RAW + 'media/'); }
  function fromEditor(html) {
    return String(html || '').split('src="' + RAW + 'media/').join('src="/blog/media/')
      .replace(/ class="is-sel"/g, '').replace(/<p>(\s|&nbsp;|<br>)*<\/p>/g, '').trim();
  }
  function coverPreview() {
    $('[data-cover-img]').innerHTML = ed.cover ? '<img src="' + RAW + esc(ed.cover) + '" alt="">' : 'Без обложки';
    $('[data-cover-del]').hidden = !ed.cover;
  }
  function stateLine() {
    var live = ed.status === 'published';
    $('[data-state]').textContent = !ed.slug ? 'Новая статья' : live ? 'Опубликована' : 'Черновик';
    $('[data-publish]').textContent = live ? 'Обновить на сайте' : 'Опубликовать';
    $('[data-unpublish]').hidden = !live;
    $('[data-delete]').hidden = !ed.slug;
    var a = $('[data-view-live]');
    a.hidden = !live;
    a.href = '/blog/' + ed.slug + '/';
  }
  function autosize() { form.title.style.height = 'auto'; form.title.style.height = form.title.scrollHeight + 'px'; }
  function count() { $('[data-count]').textContent = form.description.value.length + ' / 160'; }

  function showEditor(slug) {
    view('edit');
    say(ev, '');
    ed = { slug: '', status: '', cover: '', dirty: false, slugTouched: false, range: null };
    form.reset();
    body.innerHTML = '';
    form.date.value = today();
    coverPreview(); stateLine(); autosize(); count();
    if (!slug) { form.title.focus(); return; }
    say(ev, 'Открываем статью…');
    api('get', { slug: slug }).then(function (res) {
      var p = res.post;
      ed.slug = p.slug; ed.status = p.status; ed.cover = p.cover || ''; ed.slugTouched = true;
      form.title.value = p.title || '';
      form.slug.value = p.slug;
      form.lang.value = p.lang === 'en' ? 'en' : 'ru';
      form.date.value = p.date || today();
      form.description.value = p.description || '';
      form.coverAlt.value = p.coverAlt || '';
      body.innerHTML = toEditor(p.html);
      coverPreview(); stateLine(); autosize(); count();
      say(ev, p.source === 'nslnv' && p.status !== 'published' ? 'Статья пришла из nslnv.seo. Проверьте факты, цифры и ссылки перед публикацией.' : '');
      ed.dirty = false;
    }).catch(function (err) { say(ev, err.message, 'err'); });
  }

  form.addEventListener('input', function (e) {
    ed.dirty = true;
    if (e.target === form.title) { autosize(); if (!ed.slugTouched) form.slug.value = slugify(form.title.value); }
    if (e.target === form.slug) { ed.slugTouched = true; form.slug.value = form.slug.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'); }
    if (e.target === form.description) count();
  });
  body.addEventListener('input', function () { ed.dirty = true; });
  window.addEventListener('beforeunload', function (e) {
    if (ed.dirty && !$('[data-view="edit"]').hidden) { e.preventDefault(); e.returnValue = ''; }
  });

  function save(status) {
    var title = form.title.value.trim();
    if (!title) { say(ev, 'Нужен заголовок', 'err'); form.title.focus(); return; }
    var html = fromEditor(body.innerHTML);
    if (status === 'published' && html.replace(/<[^>]+>/g, '').trim().length < 200) { say(ev, 'Текст слишком короткий для публикации', 'err'); return; }
    var post = {
      title: title, slug: form.slug.value || slugify(title), lang: form.lang.value, date: form.date.value,
      description: form.description.value.trim(), cover: ed.cover, coverAlt: form.coverAlt.value.trim(), html: html, status: status
    };
    $$('.ad-actions button').forEach(function (b) { b.disabled = true; });
    say(ev, status === 'published' ? 'Публикуем…' : 'Сохраняем…');
    api('save', { post: post, prevSlug: ed.slug }).then(function (res) {
      ed.slug = res.slug; ed.status = res.status; ed.dirty = false; ed.slugTouched = true;
      form.slug.value = res.slug;
      history.replaceState(null, '', '#edit/' + res.slug);
      stateLine();
      say(ev, res.status === 'published'
        ? 'Готово. Статья будет на сайте через 1–2 минуты: <a href="' + res.url + '" target="_blank" rel="noopener">' + res.url + '</a>'
        : 'Черновик сохранён. На сайте его не видно.', 'ok');
    }).catch(function (err) { say(ev, err.message, 'err'); })
      .then(function () { $$('.ad-actions button').forEach(function (b) { b.disabled = false; }); });
  }
  $('[data-publish]').addEventListener('click', function () { save('published'); });
  $('[data-draft]').addEventListener('click', function () {
    if (ed.status === 'published' && !confirm('Статья опубликована. Сохранить как черновик и убрать её с сайта?')) return;
    save('draft');
  });
  $('[data-unpublish]').addEventListener('click', function () { if (confirm('Убрать статью с сайта? Она останется черновиком.')) save('draft'); });
  $('[data-delete]').addEventListener('click', function () {
    if (!confirm('Удалить статью насовсем? Это не отменить.')) return;
    api('delete', { slug: ed.slug }).then(function () { ed.dirty = false; location.hash = '#list'; })
      .catch(function (err) { say(ev, err.message, 'err'); });
  });

  /* ---------- картинки: сжатие до 1600 px в WebP (или JPEG, если браузер не умеет) ---------- */
  function readB64(blob) {
    return new Promise(function (ok) { var r = new FileReader(); r.onload = function () { ok(String(r.result).split(',')[1]); }; r.readAsDataURL(blob); });
  }
  function compress(file) {
    if (file.type === 'image/gif') return readB64(file).then(function (d) { return { type: file.type, data: d }; });
    return new Promise(function (ok, fail) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var k = Math.min(1, 1600 / img.naturalWidth), c = document.createElement('canvas');
        c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) {
          if (b && b.type === 'image/webp') return readB64(b).then(function (d) { ok({ type: 'image/webp', data: d }); });
          c.toBlob(function (j) { readB64(j).then(function (d) { ok({ type: 'image/jpeg', data: d }); }); }, 'image/jpeg', 0.86);
        }, 'image/webp', 0.84);
      };
      img.onerror = function () { fail(new Error('Не получилось открыть картинку')); };
      img.src = url;
    });
  }
  function uploadImage(file) {
    say(ev, 'Загружаем картинку…');
    return compress(file).then(function (f) { return api('upload', { file: f }); })
      .then(function (res) { say(ev, ''); return res.path; });
  }
  $('[data-cover-file]').addEventListener('change', function (e) {
    var file = e.target.files[0]; e.target.value = '';
    if (!file) return;
    uploadImage(file).then(function (path) { ed.cover = path; ed.dirty = true; coverPreview(); })
      .catch(function (err) { say(ev, err.message, 'err'); });
  });
  $('[data-cover-del]').addEventListener('click', function () { ed.cover = ''; ed.dirty = true; coverPreview(); });

  /* ---------- текст: панель, вставка, картинки ---------- */
  function keepRange() {
    var s = window.getSelection();
    if (s.rangeCount && body.contains(s.anchorNode)) ed.range = s.getRangeAt(0).cloneRange();
  }
  function restoreRange() {
    body.focus();
    if (!ed.range) return;
    var s = window.getSelection(); s.removeAllRanges(); s.addRange(ed.range);
  }
  body.addEventListener('keyup', keepRange);
  body.addEventListener('mouseup', keepRange);
  $$('.ad-tools button').forEach(function (b) {
    b.addEventListener('mousedown', function (e) { e.preventDefault(); });
    b.addEventListener('click', function () {
      var cmd = b.getAttribute('data-cmd'), arg = b.getAttribute('data-arg');
      restoreRange();
      if (cmd === 'link') {
        var url = prompt('Адрес ссылки (пусто — убрать ссылку)', 'https://');
        if (url && url !== 'https://') document.execCommand('createLink', false, url.trim());
        else document.execCommand('unlink');
      } else if (cmd === 'formatBlock') {
        document.execCommand('formatBlock', false, '<' + arg + '>');
      } else {
        document.execCommand(cmd);
      }
      ed.dirty = true; keepRange();
    });
  });
  $('[data-body-file]').addEventListener('change', function (e) {
    var file = e.target.files[0]; e.target.value = '';
    if (!file) return;
    var range = ed.range;
    uploadImage(file).then(function (path) {
      ed.range = range; restoreRange();
      document.execCommand('insertHTML', false, '<p><img src="' + RAW + path + '" alt=""></p><p><br></p>');
      ed.dirty = true;
    }).catch(function (err) { say(ev, err.message, 'err'); });
  });
  body.addEventListener('click', function (e) {
    $$('img.is-sel', body).forEach(function (i) { i.classList.remove('is-sel'); });
    if (e.target.tagName !== 'IMG') return;
    e.target.classList.add('is-sel');
    var alt = prompt('Описание картинки для поисковиков (alt):', e.target.getAttribute('alt') || '');
    if (alt !== null) { e.target.setAttribute('alt', alt.trim()); ed.dirty = true; }
  });

  // Вставка из Google Docs, Word и сайтов: остаются абзацы, подзаголовки, списки, жирный,
  // курсив, ссылки и таблицы; стили, шрифты и чужие картинки убираются.
  var KEEP = { P: 'p', H2: 'h2', H3: 'h3', H1: 'h2', H4: 'h3', H5: 'h3', H6: 'h3', UL: 'ul', OL: 'ol', LI: 'li', BLOCKQUOTE: 'blockquote',
    STRONG: 'strong', B: 'strong', EM: 'em', I: 'em', A: 'a', BR: 'br', TABLE: 'table', THEAD: 'thead', TBODY: 'tbody', TR: 'tr',
    TH: 'th', TD: 'td', IMG: 'img', HR: 'hr', FIGURE: 'figure', FIGCAPTION: 'figcaption', DIV: 'p' };
  function cleanNode(node, out) {
    Array.prototype.forEach.call(node.childNodes, function (n) {
      if (n.nodeType === 3) { out.push(esc(n.nodeValue)); return; }
      if (n.nodeType !== 1 || /^(SCRIPT|STYLE|META|LINK|TITLE)$/.test(n.tagName)) return;
      var tag = KEEP[n.tagName], st = n.getAttribute('style') || '';
      if (n.tagName === 'B' && /font-weight:\s*normal/i.test(st)) tag = null;          // обёртка Google Docs
      if (!tag && n.tagName === 'SPAN') {
        var bold = /font-weight:\s*(bold|[6-9]00)/i.test(st), it = /font-style:\s*italic/i.test(st);
        if (bold || it) { var inner = []; cleanNode(n, inner); out.push((bold ? '<strong>' : '') + (it ? '<em>' : '') + inner.join('') + (it ? '</em>' : '') + (bold ? '</strong>' : '')); return; }
      }
      if (tag === 'img') {
        var src = n.getAttribute('src') || '';
        if (src.indexOf(RAW) === 0 || src.indexOf('/blog/media/') === 0) out.push('<img src="' + esc(src) + '" alt="' + esc(n.getAttribute('alt') || '') + '">');
        else cleanNode.dropped = (cleanNode.dropped || 0) + 1;
        return;
      }
      if (tag === 'br' || tag === 'hr') { out.push('<' + tag + '>'); return; }
      if (!tag) { cleanNode(n, out); return; }
      var attrs = '';
      if (tag === 'a') { var h = n.getAttribute('href') || ''; if (!/^(https?:|mailto:|\/|#)/i.test(h)) { cleanNode(n, out); return; } attrs = ' href="' + esc(h) + '"'; }
      out.push('<' + tag + attrs + '>'); cleanNode(n, out); out.push('</' + tag + '>');
    });
  }
  body.addEventListener('paste', function (e) {
    var cd = e.clipboardData; if (!cd) return;
    if (cd.files && cd.files.length && cd.files[0].type.indexOf('image/') === 0) {
      e.preventDefault(); keepRange();
      var range = ed.range;
      uploadImage(cd.files[0]).then(function (path) { ed.range = range; restoreRange(); document.execCommand('insertHTML', false, '<p><img src="' + RAW + path + '" alt=""></p>'); });
      return;
    }
    e.preventDefault();
    var html = cd.getData('text/html'), out = [];
    if (html) {
      cleanNode.dropped = 0;
      cleanNode(new DOMParser().parseFromString(html, 'text/html').body, out);
      if (cleanNode.dropped) say(ev, 'Картинки из вставленного текста не перенеслись: добавьте их кнопкой «Картинка».', 'err');
    } else {
      out = cd.getData('text/plain').split(/\n{2,}/).map(function (b) { return '<p>' + esc(b).replace(/\n/g, '<br>') + '</p>'; });
    }
    document.execCommand('insertHTML', false, out.join(''));
    ed.dirty = true;
  });

  /* ---------- редакторы ---------- */
  function showEditors() {
    var v = view('editors'), box = $('[data-editors]', v);
    say(v, 'Загружаем…');
    api('editors').then(function (res) {
      say(v, '');
      box.innerHTML = res.editors.map(function (x) {
        return '<div class="ad-item"><span class="ad-item__title">' + esc(x.name) + '</span><span class="ad-item__meta">' +
          (x.role === 'owner' ? 'Владелец' : 'Редактор') + ' · ключ ' + esc(x.id) + '…</span><span class="ad-item__side">' +
          (x.role === 'owner' ? '' : '<button type="button" class="ad-link ad-link--danger" data-remove="' + esc(x.id) + '">Удалить</button>') + '</span></div>';
      }).join('');
    }).catch(function (err) { say(v, err.message, 'err'); });
  }
  $('[data-add-editor]').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.currentTarget, v = $('[data-view="editors"]'), name = f.name.value.trim();
    api('editors', { add: name }).then(function (res) {
      var box = $('[data-newkey]', v);
      box.hidden = false;
      box.innerHTML = '<p>Ключ для «' + esc(res.name) + '». Он показывается один раз, скопируйте сейчас:</p><code>' + esc(res.key) + '</code>' +
        '<p>Отправьте его человеку вместе со ссылкой <b>https://vakmarketing.com/admin/</b>: он откроет её и войдёт с этим ключом.</p>' +
        '<p>Если он будет отправлять статьи из nslnv.seo, дайте ему ещё этот адрес. В своём проекте сеошки он вставляет его ' +
        'в блок «Other site or CMS (not WordPress)», поле Token оставляет пустым и жмёт Test connection, потом Save:</p><code>' +
        esc(NSLNV + '?key=' + res.key) + '</code>';
      f.reset();
      showEditors();
    }).catch(function (err) { say(v, err.message, 'err'); });
  });
  $('[data-editors]').addEventListener('click', function (e) {
    var id = e.target.getAttribute('data-remove');
    if (!id || !confirm('Удалить редактора? Его ключ сразу перестанет работать.')) return;
    api('editors', { remove: id }).then(showEditors).catch(function (err) { say($('[data-view="editors"]'), err.message, 'err'); });
  });

  /* ---------- маршруты ---------- */
  function route() {
    if (!me) { view('login'); return; }
    var h = location.hash;
    if (/^#edit\//.test(h)) showEditor(decodeURIComponent(h.slice(6)));
    else if (h === '#new') showEditor('');
    else if (h === '#editors' && me.role === 'owner') showEditors();
    else showList();
  }
  window.addEventListener('hashchange', function () {
    if (ed.dirty && !$('[data-view="edit"]').hidden && !confirm('Есть несохранённые изменения. Уйти без сохранения?')) return;
    ed.dirty = false;
    route();
  });
  if (key) signIn().then(route).catch(function () { view('login'); });
  else view('login');
})();
