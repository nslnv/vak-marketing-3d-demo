/* Админка блога vakmarketing.com/admin/: вход по ключу редактора, обзор для владельца, список
   статей с фильтрами, редактор с палитрой оформления и проверкой перед публикацией, рубрики,
   выдача ключей. Всё общение — с Apps Script (docs/leads-telegram/Blog.gs),
   он пишет статьи в репозиторий, а сборка сайта делает из них страницы блога.
   Картинки во время правки показываются прямо из репозитория (raw.githubusercontent.com),
   в статье хранятся как /blog/media/…: так они видны сразу после загрузки, до сборки. */
(function () {
  'use strict';
  // Развёртывание Apps Script, общее для админки, сеошки и заявок с сайта (см. docs/leads-telegram).
  var API = 'https://script.google.com/macros/s/AKfycbzBcYAfw0RdhqnqDpRad1fkEuf1xzJV6h1CNDUa4yBh7bu3BlE2UOCrxXoDIRVEsuFyvQ/exec';
  var NSLNV = API;
  var RAW = 'https://raw.githubusercontent.com/nslnv/vak-marketing-3d-demo/main/content/blog/';
  // История правок берётся из коммитов: Apps Script пишет в сообщение, что сделано и чьим ключом.
  var COMMITS = 'https://api.github.com/repos/nslnv/vak-marketing-3d-demo/commits?per_page=100&path=content/blog';
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
  // Последний наступивший «сегодня» на Земле (UTC+14): позже этой даты статья считается запланированной, как и при сборке сайта.
  function latestDay() {
    try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Kiritimati' }).format(new Date()); } catch (e) { return today(); }
  }
  var TR = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
    п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' };
  function slugify(s) {
    return String(s || '').toLowerCase().split('').map(function (c) { return TR[c] !== undefined ? TR[c] : c; }).join('')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80).replace(/-+$/, '');
  }

  /* ---------- кто что делал ---------- */
  function when(iso) {
    var d = new Date(iso);
    return d.getDate() + ' ' + MONTHS[d.getMonth()] + ', ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }
  function whoName(n) { return n === 'nslnv.seo' ? 'сеошка nslnv.seo' : n; }
  // Коммиты от новых к старым → записи {title, state, who, at, sha, what} от старых к новым.
  // Не history(): это имя занято window.history.
  function timeline(commits) {
    var out = [], last = {};
    commits.slice().reverse().forEach(function (c) {
      var m = /^Блог: «([\s\S]*)» (опубликована|черновик|на проверке|в корзине) \(([^)]*)\)/.exec(c.commit.message);
      if (!m) return;
      var e = { title: m[1], state: m[2], live: m[2] === 'опубликована', who: m[3], at: c.commit.committer.date, sha: c.sha }, prev = last[e.title];
      e.what = e.live ? (prev && prev.live ? 'правка на сайте' : 'публикация')
        : m[2] === 'в корзине' ? 'в корзину'
        : m[2] === 'на проверке' ? 'отправлена на проверку'
        : !prev ? 'черновик создан' : prev.live ? 'снята с сайта' : prev.state === 'в корзине' ? 'возвращена из корзины' : 'правка черновика';
      last[e.title] = e;
      out.push(e);
    });
    return out;
  }
  // Все события для ленты обзора: статьи, удаления, рубрики. Новые сверху.
  function events(list) {
    var out = timeline(list).map(function (e) { e.kind = 'post'; return e; });
    list.forEach(function (c) {
      var m = c.commit.message, d;
      if ((d = /^Блог: удалена «([^»]*)» \(([^)]*)\)/.exec(m))) out.push({ kind: 'del', title: d[1], who: d[2], at: c.commit.committer.date, what: 'удалена статья' });
      else if ((d = /^Блог: рубрики \(([^)]*)\)/.exec(m))) out.push({ kind: 'cats', title: '', who: d[1], at: c.commit.committer.date, what: 'изменены рубрики' });
    });
    return out.sort(function (a, b) { return String(b.at).localeCompare(String(a.at)); });
  }
  function commits(path) {
    return fetch(path ? COMMITS + '/' + encodeURIComponent(path) : COMMITS)
      .then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; });
  }

  /* ---------- рубрики ---------- */
  var cats = [];
  function catName(slug) { var c = cats.filter(function (x) { return x.slug === slug; })[0]; return c ? c.name : ''; }
  function fillCatSelects() {
    var opts = cats.map(function (c) { return '<option value="' + esc(c.slug) + '">' + esc(c.name) + '</option>'; }).join('');
    var sel = form.category, keep = sel.value;
    sel.innerHTML = '<option value="">Без рубрики</option>' + opts; sel.value = keep;
    var f = $('[data-f-cat]'), fk = f.value;
    f.innerHTML = '<option value="">Все рубрики</option>' + opts + '<option value="-">Без рубрики</option>'; f.value = fk;
  }
  // Старый скрипт без рубрик отвечает ошибкой: тогда просто живём без них.
  function loadCats() {
    return api('categories').then(function (res) { cats = res.categories || []; fillCatSelects(); return cats; })
      .catch(function () { cats = []; fillCatSelects(); return cats; });
  }
  function saveCats(list) {
    return api('categories', { set: list }).then(function (res) { cats = res.categories || []; fillCatSelects(); return cats; });
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
  var posts = [], latest = {};
  function showList() {
    var v = view('list');
    say(v, 'Загружаем статьи…');
    $('[data-list]', v).innerHTML = '';
    Promise.all([api('list'), commits(), loadCats()]).then(function (r) {
      posts = r[0].posts.filter(function (p) { return p.slug; }); latest = {};
      timeline(r[1]).forEach(function (e) { latest[e.title] = e; });
      say(v, '');
      renderList();
    }).catch(function (err) { say(v, err.message, 'err'); });
  }
  // Состояние для людей: опубликована, запланирована (дата в будущем), на проверке, черновик, в корзине.
  function stateOf(p) {
    if (p.status === 'trash') return 'trash';
    if (p.status === 'published') return p.date > latestDay() ? 'scheduled' : 'published';
    return p.review ? 'review' : 'draft';
  }
  var STATE = { published: 'Опубликована', scheduled: 'Запланирована', review: 'На проверке', draft: 'Черновик', trash: 'В корзине' };
  function renderList() {
    var box = $('[data-list]'), q = $('[data-f-q]').value.trim().toLowerCase(), st = $('[data-f-status]').value, fc = $('[data-f-cat]').value;
    if (!posts.length) { box.innerHTML = '<p>Статей пока нет. Нажмите «Новая статья».</p>'; return; }
    var shown = posts.filter(function (p) {
      var s0 = stateOf(p);
      return (!q || p.title.toLowerCase().indexOf(q) >= 0) && (st ? s0 === st : s0 !== 'trash') &&
        (!fc || (fc === '-' ? !p.category : p.category === fc));
    });
    box.innerHTML = shown.length ? shown.map(function (p) {
      var s0 = stateOf(p), live = s0 === 'published', e = latest[p.title], c = catName(p.category);
      return '<div class="ad-item"><a class="ad-item__title" href="#edit/' + esc(p.slug) + '">' + (p.featured ? '<span class="ad-pin" title="Закреплена">★</span> ' : '') + esc(p.title) + '</a>' +
        '<span class="ad-item__meta">' + human(p.date) + ' · ' + (p.lang === 'en' ? 'EN' : 'RU') + (c ? ' · ' + esc(c) : '') +
        (p.author ? ' · автор: ' + esc(whoName(p.author)) : '') +
        (e ? '<br>последнее: ' + e.what + ', <b>' + esc(whoName(e.who)) + '</b>, ' + when(e.at) : '') +
        (p.note ? '<br><span class="ad-note-line">Заметка: ' + esc(p.note) + '</span>' : '') + '</span>' +
        '<span class="ad-item__side"><span class="ad-chip ad-chip--' + s0 + '">' + STATE[s0] + (s0 === 'scheduled' ? ' на ' + human(p.date) : '') + '</span>' +
        (live ? '<a class="ad-link" href="/blog/' + esc(p.slug) + '/" target="_blank" rel="noopener">На сайте ↗</a>' : '') +
        (s0 === 'trash'
          ? '<button type="button" class="ad-link" data-restore="' + esc(p.slug) + '">Вернуть</button>' +
            '<button type="button" class="ad-link ad-link--danger" data-kill="' + esc(p.slug) + '">Удалить насовсем</button>'
          : '<button type="button" class="ad-link ad-link--danger" data-del="' + esc(p.slug) + '">Удалить</button>') + '</span></div>';
    }).join('') : '<p>Ничего не нашлось.</p>';
  }
  ['[data-f-q]', '[data-f-status]', '[data-f-cat]'].forEach(function (sel) { $(sel).addEventListener('input', renderList); });
  // Корзина: статья перестаёт быть на сайте, но её можно вернуть. «Удалить насовсем» стирает файл.
  function setStatus(slug, status) {
    return api('get', { slug: slug }).then(function (res) {
      var p = res.post; p.status = status; if (status !== 'draft') p.review = false;
      return api('save', { post: p, prevSlug: slug });
    });
  }
  $('[data-list]').addEventListener('click', function (e) {
    var t = e.target, v = $('[data-view="list"]'), slug;
    var find = function (s1) { return posts.filter(function (x) { return x.slug === s1; })[0] || { title: s1 }; };
    if ((slug = t.getAttribute('data-del'))) {
      var p = find(slug);
      if (!confirm('Убрать «' + p.title + '» в корзину?' + (p.status === 'published' ? ' Она пропадёт с сайта.' : '') + ' Вернуть можно в фильтре «Корзина».')) return;
      say(v, 'Убираем в корзину…');
      setStatus(slug, 'trash').then(function () { say(v, 'Статья в корзине.', 'ok'); showList(); }).catch(function (err) { say(v, err.message, 'err'); });
    } else if ((slug = t.getAttribute('data-restore'))) {
      say(v, 'Возвращаем…');
      setStatus(slug, 'draft').then(function () { say(v, 'Статья вернулась в черновики.', 'ok'); showList(); }).catch(function (err) { say(v, err.message, 'err'); });
    } else if ((slug = t.getAttribute('data-kill'))) {
      if (!confirm('Удалить «' + find(slug).title + '» насовсем? Восстановить можно будет только через разработчика.')) return;
      say(v, 'Удаляем…');
      api('delete', { slug: slug }).then(showList).catch(function (err) { say(v, err.message, 'err'); });
    }
  });

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
    var live = ed.status === 'published', s0 = ed.slug ? stateOf({ status: ed.status, date: form.date.value, review: ed.review }) : '';
    $('[data-state]').textContent = !ed.slug ? 'Новая статья' : STATE[s0] + (s0 === 'scheduled' ? ' на ' + human(form.date.value) : '');
    $('[data-publish]').textContent = live ? 'Обновить на сайте' : form.date.value > latestDay() ? 'Запланировать' : 'Опубликовать';
    $('[data-unpublish]').hidden = !live;
    $('[data-delete]').hidden = !ed.slug;
    $('[data-copy]').hidden = !ed.slug;
    $('[data-review]').hidden = live;
    var a = $('[data-view-live]');
    a.hidden = !live;
    a.href = '/blog/' + ed.slug + '/';
  }
  function autosize() { form.title.style.height = 'auto'; form.title.style.height = form.title.scrollHeight + 'px'; }
  function count() {
    $('[data-count]').textContent = form.description.value.length + ' / 160';
    $('[data-seo-count]').textContent = form.seoTitle.value ? form.seoTitle.value.length + ' / 60' : '';
  }

  function showHistory() {
    var box = $('[data-hist]');
    box.hidden = true;
    if (!ed.slug) return;
    var slug = ed.slug;
    commits(slug + '.json').then(function (list) {
      var rows = timeline(list).reverse();
      if (slug !== ed.slug || !rows.length) return;
      $('[data-hist-list]').innerHTML = rows.map(function (e, i) {
        return '<li>' + when(e.at) + ' · ' + e.what + ' · <b>' + esc(whoName(e.who)) + '</b>' +
          (i ? ' <button type="button" class="ad-link" data-version="' + esc(e.sha) + '" data-at="' + esc(e.at) + '">открыть эту версию</button>' : ' <span class="ad-dim">текущая</span>') + '</li>';
      }).join('');
      box.hidden = false;
    });
  }

  // Заполнить форму статьёй (своей, копией или версией из истории).
  function fill(p) {
    ed.cover = p.cover || '';
    ed.tr = p.tr && p.tr.lang ? p.tr.lang : '';
    form.title.value = p.title || '';
    form.lang.value = p.lang === 'en' ? 'en' : 'ru';
    form.date.value = p.date || today();
    form.description.value = p.description || '';
    form.coverAlt.value = p.coverAlt || '';
    form.category.value = p.category || '';
    form.seoTitle.value = p.seoTitle || '';
    form.featured.checked = !!p.featured;
    form.note.value = p.note || '';
    body.innerHTML = toEditor(p.html);
    coverPreview(); stateLine(); autosize(); count(); check();
  }
  var copyOf = null;

  // Версия из истории: файл статьи на момент того коммита, прямо из репозитория.
  $('[data-hist-list]').addEventListener('click', function (e) {
    var sha = e.target.getAttribute('data-version');
    if (!sha || (ed.dirty && !confirm('Несохранённые правки пропадут. Открыть старую версию?'))) return;
    fetch('https://raw.githubusercontent.com/nslnv/vak-marketing-3d-demo/' + sha + '/content/blog/' + ed.slug + '.json')
      .then(function (r) { if (!r.ok) throw new Error('Эту версию не получилось открыть'); return r.json(); })
      .then(function (p) {
        fill(p); ed.dirty = true;
        say(ev, 'Открыта версия от ' + when(e.target.getAttribute('data-at')) + '. Чтобы вернуть её, нажмите «Сохранить черновик» или «Обновить на сайте».', 'ok');
        window.scrollTo(0, 0);
      }).catch(function (err) { say(ev, err.message, 'err'); });
  });

  function showEditor(slug) {
    view('edit');
    $('[data-hist]').hidden = true;
    say(ev, '');
    ed = { slug: '', status: '', cover: '', review: false, dirty: false, slugTouched: false, range: null };
    form.reset();
    body.innerHTML = '';
    form.date.value = today();
    $('[data-restore-box]').hidden = true;
    loadCats();
    coverPreview(); stateLine(); autosize(); count(); check();
    if (!slug) {
      if (copyOf) { fill(copyOf); copyOf = null; ed.dirty = true; say(ev, 'Это копия: поменяйте заголовок и адрес и сохраните.', 'ok'); }
      offerLocal('');
      form.title.focus(); return;
    }
    say(ev, 'Открываем статью…');
    api('get', { slug: slug }).then(function (res) {
      var p = res.post;
      ed.slug = p.slug; ed.status = p.status; ed.review = !!p.review; ed.slugTouched = true; ed.updated = p.updated || '';
      fill(p);
      form.slug.value = p.slug;
      stateLine();
      offerLocal(p.slug);
      say(ev, p.source === 'nslnv' && p.status !== 'published' ? 'Статья пришла из nslnv.seo. Проверьте факты, цифры и ссылки перед публикацией.' : '');
      ed.dirty = false;
      showHistory();
    }).catch(function (err) { say(ev, err.message, 'err'); });
  }

  form.addEventListener('input', function (e) {
    ed.dirty = true;
    if (e.target === form.title) { autosize(); if (!ed.slugTouched) form.slug.value = slugify(form.title.value); }
    if (e.target === form.slug) { ed.slugTouched = true; form.slug.value = form.slug.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'); }
    if (e.target === form.description || e.target === form.seoTitle) count();
    check();
  });
  body.addEventListener('input', function () { ed.dirty = true; check(); });
  form.category.addEventListener('change', check);
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
      description: form.description.value.trim(), cover: ed.cover, coverAlt: form.coverAlt.value.trim(), html: html, status: status,
      category: form.category.value, seoTitle: form.seoTitle.value.trim(), featured: form.featured.checked,
      note: form.note.value.trim(), review: status === 'review'
    };
    if (status === 'review') post.status = status = 'draft', post.review = true;
    var bad = check().filter(function (c) { return !c.ok; });
    if (status === 'published' && bad.length && !confirm('Перед публикацией есть замечания:\n\n' +
      bad.map(function (c) { return '• ' + c.bad; }).join('\n') + '\n\nОпубликовать всё равно?')) return;
    $$('.ad-actions button').forEach(function (b) { b.disabled = true; });
    say(ev, status === 'published' ? 'Публикуем…' : 'Сохраняем…');
    api('save', { post: post, prevSlug: ed.slug }).then(function (res) {
      ed.slug = res.slug; ed.status = res.status; ed.review = post.review; ed.dirty = false; ed.slugTouched = true;
      form.slug.value = res.slug;
      dropLocal(''); dropLocal(res.slug);
      window.history.replaceState(null, '', '#edit/' + res.slug);
      stateLine();
      say(ev, res.status === 'published'
        ? (post.date > latestDay() ? 'Запланирована: статья сама появится на сайте ' + human(post.date) + '.'
          : 'Готово. Статья будет на сайте через 1–2 минуты: <a href="' + res.url + '" target="_blank" rel="noopener">' + res.url + '</a>')
        : post.review ? 'Отправлена на проверку. На сайте её не видно, в обзоре она в списке «Ждут проверки».'
        : 'Черновик сохранён. На сайте его не видно.', 'ok');
      setTimeout(showHistory, 2000);
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
    if (!confirm('Убрать статью в корзину?' + (ed.status === 'published' ? ' Она пропадёт с сайта.' : '') + ' Вернуть можно в списке, фильтр «Корзина».')) return;
    say(ev, 'Убираем в корзину…');
    setStatus(ed.slug, 'trash').then(function () { ed.dirty = false; location.hash = '#list'; })
      .catch(function (err) { say(ev, err.message, 'err'); });
  });
  $('[data-review]').addEventListener('click', function () { save('review'); });
  $('[data-copy]').addEventListener('click', function () {
    copyOf = { title: form.title.value + ' (копия)', lang: form.lang.value, date: today(), description: form.description.value,
      cover: ed.cover, coverAlt: form.coverAlt.value, category: form.category.value, seoTitle: '', html: fromEditor(body.innerHTML) };
    ed.dirty = false;
    location.hash = '#new';
  });
  form.date.addEventListener('change', stateLine);

  /* ---------- автосохранение в браузере: текст не потеряется, даже если закрыть вкладку ---------- */
  function localKey(slug) { return 'vak-autosave-' + (slug || 'new'); }
  function dropLocal(slug) { try { localStorage.removeItem(localKey(slug)); } catch (e) {} }
  var saveTimer;
  function keepLocal() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      if (!ed.dirty) return;
      var snap = { at: new Date().toISOString(), title: form.title.value, lang: form.lang.value, date: form.date.value,
        description: form.description.value, cover: ed.cover, coverAlt: form.coverAlt.value, category: form.category.value,
        seoTitle: form.seoTitle.value, featured: form.featured.checked, note: form.note.value, html: fromEditor(body.innerHTML) };
      try { localStorage.setItem(localKey(ed.slug), JSON.stringify(snap)); } catch (e) {}
    }, 800);
  }
  function offerLocal(slug) {
    var snap = null;
    try { snap = JSON.parse(localStorage.getItem(localKey(slug)) || 'null'); } catch (e) {}
    var box = $('[data-restore-box]');
    if (!snap || !snap.html || fromEditor(body.innerHTML) === snap.html) { box.hidden = true; return; }
    box.hidden = false;
    box.innerHTML = 'В этом браузере есть несохранённая версия от ' + when(snap.at) + '. ' +
      '<button type="button" class="ad-link" data-local-yes>Вернуть её</button> <button type="button" class="ad-link ad-link--danger" data-local-no>Забыть</button>';
    $('[data-local-yes]', box).onclick = function () { fill(snap); ed.dirty = true; box.hidden = true; };
    $('[data-local-no]', box).onclick = function () { dropLocal(slug); box.hidden = true; };
  }
  form.addEventListener('input', keepLocal);
  body.addEventListener('input', keepLocal);

  // Cmd+S: сохранить (опубликованную обновить на сайте, черновик сохранить черновиком).
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's' && !$('[data-view="edit"]').hidden) {
      e.preventDefault();
      save(ed.status === 'published' ? 'published' : 'draft');
    }
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
  function selectInto(el) {
    var r = document.createRange(); r.selectNodeContents(el); r.collapse(false);
    var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); keepRange();
  }
  // Блок верхнего уровня, в котором стоит курсор (абзац, подзаголовок, цитата, врезка).
  function currentBlock() {
    var s = window.getSelection(), n = s.rangeCount ? s.anchorNode : null;
    while (n && n !== body) {
      if (n.nodeType === 1 && n.parentNode === body && /^(P|H2|H3|H4|BLOCKQUOTE|ASIDE|DIV)$/.test(n.tagName)) return n;
      n = n.parentNode;
    }
    return null;
  }
  var BLOCKS = { p: ['p', ''], h2: ['h2', ''], h3: ['h3', ''], h4: ['h4', ''], blockquote: ['blockquote', ''], lead: ['p', 'lead'],
    callout: ['aside', 'callout'], 'callout--tip': ['aside', 'callout callout--tip'], 'callout--warn': ['aside', 'callout callout--warn'] };
  function setBlock(kind) {
    var b = currentBlock(), want = BLOCKS[kind];
    if (!b) { document.execCommand('formatBlock', false, '<p>'); b = currentBlock(); }
    if (!b) return;
    // Повторное нажатие той же кнопки возвращает обычный абзац.
    if (b.tagName.toLowerCase() === want[0] && (b.getAttribute('class') || '') === want[1]) want = BLOCKS.p;
    var el = document.createElement(want[0]);
    if (want[1]) el.className = want[1];
    while (b.firstChild) el.appendChild(b.firstChild);
    if (!el.firstChild) el.appendChild(document.createElement('br'));
    body.replaceChild(el, b);
    selectInto(el);
  }
  function unwrap(el) { while (el.firstChild) el.parentNode.insertBefore(el.firstChild, el); el.parentNode.removeChild(el); }
  function wrapInline(kind) {
    var s = window.getSelection();
    if (!s.rangeCount || s.isCollapsed) { say(ev, 'Сначала выделите слова, которые нужно отметить.', 'err'); return; }
    var r = s.getRangeAt(0), n = r.commonAncestorContainer;
    n = n.nodeType === 3 ? n.parentNode : n;
    var host = n.closest(kind === 'mark' ? 'mark' : 'span.accent');
    if (host && body.contains(host)) { unwrap(host); return; }
    var el = document.createElement(kind === 'mark' ? 'mark' : 'span');
    if (kind === 'accent') el.className = 'accent';
    el.appendChild(r.extractContents());
    r.insertNode(el);
    selectInto(el);
  }
  function youtubeId(u) {
    var m = /(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([\w-]{11})/.exec(u || '');
    return m ? m[1] : '';
  }
  function insert(kind) {
    if (kind === 'hr') { document.execCommand('insertHTML', false, '<hr><p><br></p>'); return; }
    if (kind === 'video') {
      var id = youtubeId(prompt('Ссылка на видео YouTube', 'https://www.youtube.com/watch?v='));
      if (!id) { say(ev, 'Не узнали ссылку на YouTube. Подойдёт обычная ссылка из адресной строки или кнопки «Поделиться».', 'err'); return; }
      document.execCommand('insertHTML', false, '<figure class="video" data-youtube="' + id + '" contenteditable="false"><img src="https://i.ytimg.com/vi/' + id + '/hqdefault.jpg" alt="Видео YouTube"></figure><p><br></p>');
      return;
    }
    if (kind === 'table') {
      var m = /(\d+)\D+(\d+)/.exec(prompt('Сколько столбцов и строк? Например: 3 на 4', '3 на 4') || '');
      if (!m) return;
      var cols = Math.min(+m[1], 8), rows = Math.min(+m[2], 40), cell = function (t) { var x = ''; for (var i = 0; i < cols; i++) x += t; return x; };
      var html = '<table><thead><tr>' + cell('<th>Заголовок</th>') + '</tr></thead><tbody>';
      for (var i = 1; i < rows; i++) html += '<tr>' + cell('<td><br></td>') + '</tr>';
      document.execCommand('insertHTML', false, html + '</tbody></table><p><br></p>');
    }
  }
  function link() {
    var url = prompt('Адрес ссылки (пусто: убрать ссылку)', 'https://');
    if (url && url !== 'https://') document.execCommand('createLink', false, url.trim());
    else document.execCommand('unlink');
  }
  $$('.ad-tools button').forEach(function (b) {
    b.addEventListener('mousedown', function (e) { e.preventDefault(); });
    b.addEventListener('click', function () {
      var cmd = b.getAttribute('data-cmd');
      restoreRange();
      if (b.hasAttribute('data-block')) setBlock(b.getAttribute('data-block'));
      else if (b.hasAttribute('data-wrap')) wrapInline(b.getAttribute('data-wrap'));
      else if (b.hasAttribute('data-insert')) insert(b.getAttribute('data-insert'));
      else if (cmd === 'link') link();
      else document.execCommand(cmd);
      ed.dirty = true; keepRange(); check();
    });
  });
  body.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); keepRange(); link(); ed.dirty = true; }
  });
  $('[data-body-file]').addEventListener('change', function (e) {
    var file = e.target.files[0]; e.target.value = '';
    if (!file) return;
    var range = ed.range;
    uploadImage(file).then(function (path) {
      var cap = (prompt('Подпись под картинкой (можно оставить пустой). Она же станет описанием для поисковиков.', '') || '').trim();
      ed.range = range; restoreRange();
      var img = '<img src="' + RAW + path + '" alt="' + esc(cap) + '">';
      document.execCommand('insertHTML', false, (cap ? '<figure>' + img + '<figcaption>' + esc(cap) + '</figcaption></figure>' : '<p>' + img + '</p>') + '<p><br></p>');
      ed.dirty = true; check();
    }).catch(function (err) { say(ev, err.message, 'err'); });
  });
  body.addEventListener('dragover', function (e) { if (e.dataTransfer && Array.prototype.some.call(e.dataTransfer.types, function (t) { return t === 'Files'; })) e.preventDefault(); });
  body.addEventListener('drop', function (e) {
    var file = e.dataTransfer && e.dataTransfer.files[0];
    if (!file || file.type.indexOf('image/') !== 0) return;
    e.preventDefault();
    var r = document.caretRangeFromPoint ? document.caretRangeFromPoint(e.clientX, e.clientY) : null;
    if (r) { var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); keepRange(); }
    var range = ed.range;
    uploadImage(file).then(function (path) {
      ed.range = range; restoreRange();
      document.execCommand('insertHTML', false, '<p><img src="' + RAW + path + '" alt=""></p>');
      ed.dirty = true; check();
      say(ev, 'Картинка добавлена. Нажмите на неё, чтобы написать описание.', 'ok');
    }).catch(function (err) { say(ev, err.message, 'err'); });
  });
  body.addEventListener('click', function (e) {
    $$('img.is-sel', body).forEach(function (i) { i.classList.remove('is-sel'); });
    if (e.target.tagName !== 'IMG' || e.target.closest('figure.video')) return;
    e.target.classList.add('is-sel');
    var alt = prompt('Описание картинки для поисковиков (alt):', e.target.getAttribute('alt') || '');
    if (alt !== null) { e.target.setAttribute('alt', alt.trim()); ed.dirty = true; }
  });

  // Вставка из Google Docs, Word и сайтов: остаются абзацы, подзаголовки, списки, жирный,
  // курсив, ссылки и таблицы; стили, шрифты и чужие картинки убираются.
  var KEEP = { P: 'p', H2: 'h2', H3: 'h3', H1: 'h2', H4: 'h3', H5: 'h3', H6: 'h3', UL: 'ul', OL: 'ol', LI: 'li', BLOCKQUOTE: 'blockquote',
    STRONG: 'strong', B: 'strong', EM: 'em', I: 'em', A: 'a', BR: 'br', TABLE: 'table', THEAD: 'thead', TBODY: 'tbody', TR: 'tr',
    TH: 'th', TD: 'td', IMG: 'img', HR: 'hr', FIGURE: 'figure', FIGCAPTION: 'figcaption', DIV: 'p', U: 'u', S: 's', STRIKE: 's',
    MARK: 'mark', SUP: 'sup', SUB: 'sub', CODE: 'code', PRE: 'pre' };
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

  /* ---------- проверка перед публикацией ---------- */
  function check() {
    var title = form.title.value.trim(), seo = (form.seoTitle.value.trim() || title), d = form.description.value.trim();
    var txt = (body.innerText || '').trim(), n = txt ? txt.split(/\s+/).length : 0;
    var imgs = $$('img', body).filter(function (i) { return !i.closest('figure.video'); });
    var noAlt = imgs.filter(function (i) { return !(i.getAttribute('alt') || '').trim(); }).length;
    var badLinks = $$('a', body).filter(function (a) {
      var h = a.getAttribute('href') || '';
      return !h || h === 'https://' || /localhost|127\.0\.0\.1|nslnv\.online|docs\.google\.com\/document/.test(h);
    }).length;
    var list = [
      { ok: title.length >= 15 && title.length <= 90, good: 'Заголовок нормальной длины', bad: 'Заголовок ' + title.length + ' симв.: лучше 15–90' },
      { ok: seo.length <= 65, good: 'Заголовок помещается в выдачу Google и Яндекса', bad: 'Заголовок для поисковиков ' + seo.length + ' симв.: в выдаче обрежется после 60–65' },
      { ok: d.length >= 70 && d.length <= 170, good: 'Описание для поиска и соцсетей ' + d.length + ' симв.', bad: d ? 'Описание ' + d.length + ' симв.: лучше 70–160' : 'Нет описания: поисковики возьмут случайный кусок текста' },
      { ok: !!ed.cover, good: 'Есть обложка', bad: 'Нет обложки: в блоге и в превью ссылки будет пустая карточка' },
      { ok: !ed.cover || !!form.coverAlt.value.trim(), good: 'У обложки есть описание', bad: 'У обложки нет описания для поисковиков' },
      { ok: !cats.length || !!form.category.value, good: 'Рубрика: ' + (catName(form.category.value) || 'нет'), bad: 'Не выбрана рубрика' },
      { ok: n >= 300, good: 'Текст ' + n + ' слов', bad: 'Текст ' + n + ' слов: для поиска лучше от 300' },
      { ok: n < 500 || $$('h2', body).length >= 2, good: 'Есть подзаголовки H2', bad: 'Длинный текст без подзаголовков H2: читать тяжело, оглавления не будет' },
      { ok: !noAlt, good: 'У картинок есть описания', bad: noAlt + ' карт. без описания: нажмите на картинку, чтобы его добавить' },
      { ok: !badLinks, good: 'Ссылки выглядят рабочими', bad: badLinks + ' ссыл. пустые или ведут на служебные адреса' }
    ];
    $('[data-checks]').innerHTML = '<p class="ad-check-list__h">Проверка перед публикацией</p>' + list.map(function (c) {
      return '<p class="' + (c.ok ? 'is-ok' : 'is-bad') + '">' + esc(c.ok ? c.good : c.bad) + '</p>';
    }).join('');
    $('[data-counter]').textContent = n + ' слов · около ' + Math.max(1, Math.round(n / 190)) + ' мин чтения';
    // Вторую языковую версию делает переводчик Google при публикации (Blog.gs), сайт показывает её по языку посетителя.
    var other = form.lang.value === 'en' ? 'Русская' : 'Английская', trLine = $('[data-tr]');
    if (trLine) trLine.textContent = ed.tr && ed.tr !== form.lang.value
      ? other + ' версия для сайта готова. Если поменяете текст, при публикации она переведётся заново.'
      : other + ' версия для сайта появится сама при публикации: статью переведёт переводчик Google.';
    var slug = form.slug.value || slugify(title) || 'adres-stati', desc = d || txt.slice(0, 160);
    var cut = function (x, k) { return x.length > k ? x.slice(0, k - 1) + '…' : x; };
    $('[data-snippet]').innerHTML =
      '<div class="ad-serp"><p class="ad-serp__h">Так статья будет выглядеть в Google и Яндексе</p>' +
      '<span class="ad-serp__url">vakmarketing.com › blog › ' + esc(slug) + '</span>' +
      '<span class="ad-serp__t">' + esc(cut((seo || 'Заголовок статьи') + ' — VAK Marketing', 64)) + '</span>' +
      '<span class="ad-serp__d">' + esc(cut(desc || 'Описание статьи', 160)) + '</span></div>' +
      '<div class="ad-og"><p class="ad-serp__h">Так ссылка будет выглядеть в Telegram, LinkedIn и WhatsApp</p>' +
      '<span class="ad-og__img">' + (ed.cover ? '<img src="' + RAW + esc(ed.cover) + '" alt="">' : '<i>нет обложки: будет общая картинка VAK</i>') + '</span>' +
      '<span class="ad-og__body"><b>' + esc(cut(seo || 'Заголовок статьи', 90)) + '</b><span>' + esc(cut(desc || '', 140)) + '</span><em>vakmarketing.com</em></span></div>';
    return list;
  }

  /* ---------- предпросмотр в новой вкладке, со стилями сайта ---------- */
  $('[data-preview]').addEventListener('click', function () {
    var w = window.open('', '_blank');
    if (!w) { say(ev, 'Браузер не дал открыть вкладку: разрешите всплывающие окна для этого сайта.', 'err'); return; }
    var c = catName(form.category.value), d = form.description.value.trim();
    w.document.write('<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
      '<title>Предпросмотр: ' + esc(form.title.value) + '</title><link rel="stylesheet" href="/assets/css/base.css?v=20261016-1">' +
      '<link rel="stylesheet" href="/assets/css/blog.css?v=20261103-1"><style>body{background:var(--bg);color:var(--ink);font-family:var(--f)}' +
      '.bl-main{padding-top:56px}.pv-note{position:fixed;top:0;left:0;right:0;z-index:9;padding:8px 16px;background:#7C5CFF;color:#fff;font-size:13px;text-align:center}</style></head>' +
      '<body class="bl"><p class="pv-note">Предпросмотр: так статья будет выглядеть на сайте. Видео на сайте будет плеером.</p><main class="bl-main"><article class="wrap bl-post">' +
      '<nav class="bl-crumbs"><a>Блог</a>' + (c ? '<span>/</span><a>' + esc(c) + '</a>' : '') + '</nav>' +
      '<h1 class="bl-title">' + esc(form.title.value) + '</h1><p class="bl-meta"><span>' + human(form.date.value) + '</span><span>' + $('[data-counter]').textContent.split('· ')[1] + '</span></p>' +
      (d ? '<p class="bl-intro">' + esc(d) + '</p>' : '') +
      (ed.cover ? '<figure class="bl-cover"><img src="' + RAW + esc(ed.cover) + '" alt=""></figure>' : '') +
      '<div class="bl-prose">' + toEditor(fromEditor(body.innerHTML)) + '</div></article></main></body></html>');
    w.document.close();
  });

  /* ---------- обзор для владельца ---------- */
  function showOverview() {
    var v = view('overview');
    say(v, 'Собираем данные…');
    Promise.all([api('list'), commits(), loadCats()]).then(function (r) {
      var list = r[0].posts.filter(function (p) { return p.slug; }), ev2 = events(r[1]), since = Date.now() - 30 * 864e5;
      var live = list.filter(function (p) { return stateOf(p) === 'published'; }).length;
      list = list.filter(function (p) { return p.status !== 'trash'; });
      var month = ev2.filter(function (e) { return e.kind === 'post' && e.what === 'публикация' && new Date(e.at) > since; }).length;
      say(v, '');
      $('[data-stats]', v).innerHTML = [[live, 'Опубликовано'], [list.length - live, 'В работе'], [month, 'Вышло за 30 дней'], [cats.length, 'Рубрики']]
        .map(function (x) { return '<div class="ad-stat"><b>' + x[0] + '</b><span>' + x[1] + '</span></div>'; }).join('');
      var people = {};
      ev2.forEach(function (e) {
        if (new Date(e.at) < since) return;
        var p = people[e.who] = people[e.who] || { pub: 0, edit: 0, last: e.at };
        if (e.what === 'публикация') p.pub++; else p.edit++;
      });
      var names = Object.keys(people).sort(function (a, b) { return people[b].pub - people[a].pub || people[b].edit - people[a].edit; });
      $('[data-people]', v).innerHTML = names.length ? names.map(function (n) {
        var p = people[n];
        return '<div class="ad-item"><span class="ad-item__title">' + esc(whoName(n)) + '</span><span class="ad-item__meta">публикаций: ' + p.pub +
          ' · других действий: ' + p.edit + ' · последний раз ' + when(p.last) + '</span></div>';
      }).join('') : '<p>За 30 дней действий не было.</p>';
      var row = function (p, extra) {
        return '<div class="ad-item"><a class="ad-item__title" href="#edit/' + esc(p.slug) + '">' + esc(p.title) + '</a><span class="ad-item__meta">' + extra + '</span></div>';
      };
      var waiting = list.filter(function (p) { return stateOf(p) === 'review'; });
      var planned = list.filter(function (p) { return stateOf(p) === 'scheduled'; }).sort(function (a, b) { return a.date.localeCompare(b.date); });
      $('[data-queue]', v).innerHTML =
        '<div><h2>Ждут проверки <span class="ad-dim">' + waiting.length + '</span></h2><div class="ad-list">' +
        (waiting.map(function (p) { return row(p, 'автор: ' + esc(whoName(p.author)) + (p.note ? ' · ' + esc(p.note) : '')); }).join('') || '<p>Пусто.</p>') + '</div></div>' +
        '<div><h2>Запланированы <span class="ad-dim">' + planned.length + '</span></h2><div class="ad-list">' +
        (planned.map(function (p) { return row(p, 'выйдет ' + human(p.date)); }).join('') || '<p>Пусто.</p>') + '</div></div>';
      var bySlug = {};
      list.forEach(function (p) { bySlug[p.title] = p.slug; });
      $('[data-feed]', v).innerHTML = ev2.slice(0, 40).map(function (e) {
        var t = e.title ? (bySlug[e.title] ? '<a href="#edit/' + esc(bySlug[e.title]) + '">«' + esc(e.title) + '»</a>' : '«' + esc(e.title) + '»') : '';
        return '<li><span>' + when(e.at) + '</span><b>' + esc(whoName(e.who)) + '</b> · ' + e.what + (t ? ' · ' + t : '') + '</li>';
      }).join('') || '<li>Пока пусто.</li>';
    }).catch(function (err) { say(v, err.message, 'err'); });
  }

  /* ---------- рубрики ---------- */
  function showCats() {
    var v = view('categories');
    say(v, 'Загружаем…');
    Promise.all([loadCats(), api('list')]).then(function (r) { posts = r[1].posts.filter(function (p) { return p.slug; }); say(v, ''); renderCats(); })
      .catch(function (err) { say(v, err.message, 'err'); });
  }
  function renderCats() {
    var box = $('[data-cats]');
    box.innerHTML = cats.length ? cats.map(function (c, i) {
      var n = posts.filter(function (p) { return p.category === c.slug; }).length;
      return '<div class="ad-item"><span class="ad-item__title">' + esc(c.name) + (c.nameEn ? ' <i class="ad-dim">/ ' + esc(c.nameEn) + '</i>' : '') + '</span>' +
        '<span class="ad-item__meta">vakmarketing.com/blog/category/' + esc(c.slug) + '/ · статей: ' + n + (c.description ? '<br>' + esc(c.description) : '') + '</span>' +
        '<span class="ad-item__side">' + (i ? '<button type="button" class="ad-link" data-cat-up="' + i + '" title="Выше">↑</button>' : '') +
        (i < cats.length - 1 ? '<button type="button" class="ad-link" data-cat-down="' + i + '" title="Ниже">↓</button>' : '') +
        '<button type="button" class="ad-link" data-cat-edit="' + i + '">Изменить</button>' +
        '<button type="button" class="ad-link ad-link--danger" data-cat-del="' + i + '">Удалить</button></span></div>';
    }).join('') : '<p>Рубрик пока нет. Добавьте первую: например, «Кейсы», «Аналитика», «PR».</p>';
  }
  function catsChanged(list, msg) {
    var v = $('[data-view="categories"]');
    say(v, 'Сохраняем…');
    return saveCats(list).then(function () { say(v, msg || 'Сохранено. На сайте изменения появятся через 1–2 минуты.', 'ok'); renderCats(); })
      .catch(function (err) { say(v, err.message, 'err'); });
  }
  $('[data-add-cat]').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.currentTarget;
    catsChanged(cats.concat([{ name: f.name.value.trim(), nameEn: f.nameEn.value.trim(), description: f.description.value.trim() }]))
      .then(function () { f.reset(); });
  });
  $('[data-cats]').addEventListener('click', function (e) {
    var t = e.target, i, list = cats.slice();
    if ((i = t.getAttribute('data-cat-up')) !== null) { i = +i; list.splice(i - 1, 0, list.splice(i, 1)[0]); catsChanged(list); }
    else if ((i = t.getAttribute('data-cat-down')) !== null) { i = +i; list.splice(i + 1, 0, list.splice(i, 1)[0]); catsChanged(list); }
    else if ((i = t.getAttribute('data-cat-edit')) !== null) {
      var c = list[+i], name = prompt('Название рубрики', c.name);
      if (name === null || !name.trim()) return;
      var en = prompt('Название на английском (можно пусто: переведётся само)', c.nameEn || '');
      var d = prompt('Описание для страницы рубрики (можно пусто)', c.description || '');
      list[+i] = { slug: c.slug, name: name.trim(), nameEn: (en || '').trim(), description: (d || '').trim(),
        descriptionEn: (d || '').trim() === (c.description || '') ? c.descriptionEn || '' : '' };
      catsChanged(list);
    } else if ((i = t.getAttribute('data-cat-del')) !== null) {
      var cc = list[+i], n = posts.filter(function (p) { return p.category === cc.slug; }).length;
      if (!confirm('Удалить рубрику «' + cc.name + '»?' + (n ? ' В ней ' + n + ' ст., они останутся без рубрики.' : ''))) return;
      list.splice(+i, 1); catsChanged(list);
    }
  });
  // «+ Новая» рядом с выбором рубрики в статье.
  $('[data-new-cat]').addEventListener('click', function () {
    var name = (prompt('Название новой рубрики', '') || '').trim();
    if (!name) return;
    say(ev, 'Создаём рубрику…');
    saveCats(cats.concat([{ name: name }])).then(function () {
      var c = cats.filter(function (x) { return x.name === name; })[0];
      if (c) form.category.value = c.slug;
      ed.dirty = true; check();
      say(ev, 'Рубрика «' + name + '» создана.', 'ok');
    }).catch(function (err) { say(ev, err.message, 'err'); });
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
    else if (h === '#categories') showCats();
    else if ((h === '#overview' || !h) && me.role === 'owner') showOverview();
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
