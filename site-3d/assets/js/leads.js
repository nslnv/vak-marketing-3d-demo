/* Отправка заявок с сайта. Основной путь — наш приёмник на Google Apps Script
   (docs/leads-telegram/Code.gs): пересылает заявку ботом в Telegram и письмом на hello@,
   отвечает за 1–3 секунды. Если он не ответил, заявка уходит запасным путём через
   FormSubmit (письмо на hello@, бывает до минуты). window.vakSend(payload) возвращает
   Promise, который выполняется, когда заявка ушла хотя бы одним путём. */
(function () {
  'use strict';
  var RELAY = 'https://script.google.com/macros/s/AKfycbyEsh4G_SMcSX0Jgc5TX5T5EzaVhynD4Sxz6F9iFTDGQ14gprT0J6Yu7j5BlHvC7WV-DA/exec';
  var BACKUP = 'https://formsubmit.co/ajax/hello@vakmarketing.com';

  function post(url, body, type, ms) {
    var ctrl = 'AbortController' in window ? new AbortController() : null;
    var timer = ctrl && ms ? setTimeout(function () { ctrl.abort(); }, ms) : 0;
    return fetch(url, {
      method: 'POST', keepalive: true, signal: ctrl ? ctrl.signal : undefined,
      headers: { 'Content-Type': type, 'Accept': 'application/json' }, body: body
    }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    }).then(function (res) {
      clearTimeout(timer);
      if (!res || String(res.success) !== 'true') throw new Error(res && res.message);
      return res;
    }, function (err) {
      clearTimeout(timer);
      throw err;
    });
  }

  window.vakSend = function (payload) {
    var body = JSON.stringify(payload);
    // text/plain не вызывает предварительный запрос, который Apps Script не обслуживает.
    return post(RELAY, body, 'text/plain;charset=utf-8', 20000).catch(function () {
      return post(BACKUP, body, 'application/json', 0);
    });
  };
})();
