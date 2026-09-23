const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('site-3d/assets/js/service-page.js', 'utf8');
const data = source.slice(source.indexOf('var SERVICES ='), source.indexOf('/* ---------- Content rendering'));
const renderers = source.slice(source.indexOf('function renderPrChain'), source.indexOf('function renderTrust'));
const context = vm.createContext({
  esc: value => String(value == null ? '' : value).replaceAll('&','&amp;').replaceAll('<','&lt;'),
  renderHead: s => '<h2>' + s.title + '</h2>',
  language: 'ru'
});
vm.runInContext(data + '\n' + renderers, context);
const chainOrder = { ru:['Повод','Материал','Издание','Отклик','Доверие'], en:['Occasion','Material','Outlet','Response','Trust'] };
for (const lang of ['ru', 'en']) {
  context.language = lang;
  const page = context.SERVICES.pr[lang];
  assert.deepEqual(Array.from(page.diagram.items, item => item[0]), chainOrder[lang], 'brief order: occasion → material → outlet → response → trust');
  assert.equal(page.diagram.result.length, 3, 'traffic / partnerships / sales after trust');
  const chain = context.renderPrChain(page.diagram);
  assert.equal((chain.match(/<li /g) || []).length, 5);
  assert.equal((chain.match(/sp-pr-chain__arrow/g) || []).length, 4, 'arrows only between steps');
  assert.ok(chain.includes('sp-pr-chain__result'));
  const steps = context.renderPrSteps(page.process);
  assert.equal((steps.match(/<li /g) || []).length, 6);
  const cases = context.renderPrCasesWidget();
  assert.equal((cases.match(/class="sp-pr-case"/g) || []).length, 3);
  assert.ok(cases.includes('tabindex="0"'), 'rail is keyboard scrollable');
  assert.ok(!cases.includes('15+') && !cases.includes('1,2 млн') && !cases.includes('1.2 M'), 'placeholder 1GHS figures stay off the PR page');
  for (const sector of page.sectors.items) assert.equal(sector[2].length, 4, 'four accent tags per sector');
  for (const html of [chain, steps, cases]) assert.ok(!html.includes('undefined'));
}
const html = fs.readFileSync('site-3d/pr/index.html','utf8');
assert.ok(html.includes('pr-page.css?v='));
for (const route of ['strategy','linkedin','seo','localization']) {
  assert.ok(!fs.readFileSync(`site-3d/${route}/index.html`,'utf8').includes('pr-page.css'), 'styles stay on the PR route');
}
assert.ok(!source.includes('pr-orbit'), 'retired orbit diagram removed');
console.log('PR: RU/EN five-step chain, result, six steps, cases widget, tags and route isolation passed.');
