/**
 * Заявки с vakmarketing.com → Telegram и почта hello@ (Google Apps Script, веб-приложение).
 *
 * Сайт шлёт POST с JSON как text/plain (без preflight), скрипт пересылает заявку ботом
 * во все чаты из TG_CHATS, письмом на MAIL_TO (ответ уходит клиенту через Reply-To)
 * и отвечает {"success":"true"}, если сработал хотя бы один путь. Токен бота в код сайта не попадает.
 *
 * Свойства скрипта (Настройки проекта → Свойства скрипта):
 *   TG_TOKEN  — токен бота от @BotFather, вставляет владелец;
 *   TG_CHATS  — id чатов-получателей через запятую;
 *   TG_INVITE — код приглашения, его создаёт setup();
 *   TG_OFFSET — служебный номер последнего прочитанного обновления Telegram.
 * Получатели: setup() пишет в журнал ссылку t.me/<бот>?start=<код>. Кто откроет её и нажмёт
 * Start (или отправит код боту в группе), через несколько минут добавится триггером syncChats.
 * Просто написать боту мало: в заявках личные данные, случайные люди их получать не должны.
 * Такие чаты копятся в TG_PENDING; showPending() показывает их в журнале, approvePending()
 * подключает всех из списка, approvePending('Даниил') — только тех, чьё имя содержит строку.
 * Команда /stop в чате отписывает его от заявок.
 */
var FIELDS_MAX = 20, VALUE_MAX = 1500, MAIL_TO = 'hello@vakmarketing.com';

function doPost(e) {
  try {
    var data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (data.website_url) return reply_(true);            // поле-ловушка заполнено: это бот
    var text = format_(data);
    if (!text) return reply_(false);
    var tg = send_(text);
    var mail = mail_(data);
    return reply_(tg > 0 || mail);
  } catch (err) {
    console.error(err);
    return reply_(false);
  }
}

function mail_(data) {
  try {
    var rows = [], plain = [];
    fields_(data).forEach(function (f) {
      rows.push('<tr><td style="padding:6px 12px;border:1px solid #ddd;font-weight:bold;vertical-align:top">' + esc_(f[0]) +
        '</td><td style="padding:6px 12px;border:1px solid #ddd">' + esc_(f[1]).replace(/\n/g, '<br>') + '</td></tr>');
      plain.push(f[0] + ': ' + f[1]);
    });
    var opts = {
      name: 'Сайт VAK Marketing',
      htmlBody: '<table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">' + rows.join('') + '</table>'
    };
    var replyTo = String(data._replyto || data.Email || '').trim();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyTo)) opts.replyTo = replyTo;
    MailApp.sendEmail(MAIL_TO, subject_(data), plain.join('\n'), opts);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

// Проверка, что веб-приложение отвечает.
function doGet() {
  return reply_(true);
}

/** Запускать вручную: создаёт код приглашения, подбирает новых получателей и пишет в журнал ссылку. */
function setup() {
  var p = PropertiesService.getScriptProperties();
  var token = p.getProperty('TG_TOKEN');
  if (!token) throw new Error('Сначала добавьте свойство скрипта TG_TOKEN с токеном бота');
  if (!p.getProperty('TG_INVITE')) p.setProperty('TG_INVITE', Utilities.getUuid().replace(/-/g, '').slice(0, 12));
  var me = tg_(token, 'getMe', {});
  if (!me.ok) throw new Error('Telegram: ' + me.description);
  syncChats_();
  console.log('Ссылка для получателей: https://t.me/' + me.result.username + '?start=' + p.getProperty('TG_INVITE'));
  console.log('Получатели сейчас: ' + (chats_().join(', ') || 'нет'));
}

// Для триггера по времени.
function syncChats() {
  syncChats_();
}

function syncChats_() {
  var p = PropertiesService.getScriptProperties();
  var token = p.getProperty('TG_TOKEN'), code = p.getProperty('TG_INVITE');
  var offset = Number(p.getProperty('TG_OFFSET') || 0);
  var res = tg_(token, 'getUpdates', { offset: offset, timeout: 0 });
  if (!res.ok) throw new Error('Telegram: ' + res.description);
  var ids = chats_(), added = [], removed = [], pending = pending_();
  (res.result || []).forEach(function (u) {
    offset = Math.max(offset, u.update_id + 1);
    var m = u.message || u.channel_post;
    if (!m || !m.chat) return;
    var id = String(m.chat.id), text = String(m.text || '');
    if (/^\/stop\b/.test(text) && ids.indexOf(id) >= 0) {
      ids.splice(ids.indexOf(id), 1);
      removed.push(id);
    } else if (code && text.indexOf(code) >= 0 && ids.indexOf(id) < 0) {
      ids.push(id);
      added.push(id);
      delete pending[id];
    } else if (ids.indexOf(id) < 0) {
      pending[id] = chatName_(m.chat);
    }
  });
  p.setProperty('TG_OFFSET', String(offset));
  p.setProperty('TG_CHATS', ids.join(','));
  p.setProperty('TG_PENDING', JSON.stringify(pending));
  added.forEach(function (id) { welcome_(token, id); });
  removed.forEach(function (id) {
    tg_(token, 'sendMessage', { chat_id: id, text: 'Заявки с сайта сюда больше не приходят.' });
  });
  return added;
}

/** Запускать вручную: показывает в журнале, кто написал боту без приглашения. */
function showPending() {
  syncChats_();
  var pending = pending_();
  console.log(Object.keys(pending).map(function (id) { return id + ' — ' + pending[id]; }).join('\n') || 'Никто не ждёт');
}

/** Запускать вручную: подключает ожидающих; с аргументом — только тех, чьё имя его содержит. */
function approvePending(filter) {
  syncChats_();
  var p = PropertiesService.getScriptProperties(), token = p.getProperty('TG_TOKEN');
  var pending = pending_(), ids = chats_(), done = [];
  Object.keys(pending).forEach(function (id) {
    if (typeof filter === 'string' && filter && pending[id].toLowerCase().indexOf(filter.toLowerCase()) < 0) return;
    if (ids.indexOf(id) < 0) ids.push(id);
    done.push(pending[id]);
    delete pending[id];
    welcome_(token, id);
  });
  p.setProperty('TG_CHATS', ids.join(','));
  p.setProperty('TG_PENDING', JSON.stringify(pending));
  console.log('Подключены: ' + (done.join(', ') || 'никто') + '. Получатели: ' + ids.length);
}

function pending_() {
  try { return JSON.parse(PropertiesService.getScriptProperties().getProperty('TG_PENDING') || '{}'); } catch (e) { return {}; }
}

function chatName_(chat) {
  var name = chat.title || [chat.first_name, chat.last_name].filter(Boolean).join(' ');
  return (name + (chat.username ? ' @' + chat.username : '')).trim() || String(chat.id);
}

function welcome_(token, id) {
  tg_(token, 'sendMessage', { chat_id: id, text: 'Готово: сюда будут приходить заявки с сайта vakmarketing.com. Отписаться: /stop' });
}

// Поля заявки без служебных (_subject, _replyto…) и ловушки: [[название, значение], …].
function fields_(data) {
  var out = [];
  Object.keys(data).forEach(function (k) {
    if (k.charAt(0) === '_' || k === 'website_url' || out.length >= FIELDS_MAX) return;
    var v = String(data[k] == null ? '' : data[k]).trim();
    if (v) out.push([k, v.slice(0, VALUE_MAX)]);
  });
  return out;
}

function subject_(data) {
  return data._subject ? String(data._subject).slice(0, 200) : 'Заявка с сайта VAK Marketing';
}

function format_(data) {
  var lines = fields_(data).map(function (f) { return '<b>' + esc_(f[0]) + ':</b> ' + esc_(f[1]); });
  if (lines.length < 2) return '';
  return '<b>' + esc_(subject_(data)) + '</b>\n\n' + lines.join('\n');
}

function send_(text) {
  var token = PropertiesService.getScriptProperties().getProperty('TG_TOKEN');
  var sent = 0;
  chats_().forEach(function (chat) {
    var r = tg_(token, 'sendMessage', { chat_id: chat, text: text, parse_mode: 'HTML', disable_web_page_preview: true });
    if (r.ok) sent++;
    else console.error('chat ' + chat + ': ' + r.description);
  });
  return sent;
}

function chats_() {
  return (PropertiesService.getScriptProperties().getProperty('TG_CHATS') || '')
    .split(',').map(function (c) { return c.trim(); }).filter(String);
}

function tg_(token, method, body) {
  var r = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/' + method, {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true, payload: JSON.stringify(body)
  });
  return JSON.parse(r.getContentText());
}

function reply_(ok) {
  return ContentService.createTextOutput(JSON.stringify({ success: ok ? 'true' : 'false' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function esc_(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
