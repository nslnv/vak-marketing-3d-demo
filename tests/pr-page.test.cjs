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
const chainOrder = { ru:['Инфоповод','Материал','Издание','Отклик','Доверие'], en:['News hook','Material','Outlet','Response','Trust'] };
for (const lang of ['ru', 'en']) {
  context.language = lang;
  const page = context.SERVICES.pr[lang];
  assert.deepEqual(Array.from(page.diagram.items, item => item[0]), chainOrder[lang], 'brief order: news hook → material → outlet → response → trust');
  assert.ok(!page.diagram.result, 'part 4: the chain ends at trust, no result pill');
  const chain = context.renderPrChain(page.diagram);
  assert.equal((chain.match(/<li /g) || []).length, 5);
  assert.equal((chain.match(/sp-pr-chain__arrow/g) || []).length, 4, 'arrows only between steps');
  assert.ok(!chain.includes('sp-pr-chain__result'));
  const steps = context.renderPrSteps(page.process);
  assert.equal((steps.match(/<li /g) || []).length, 6);
  for (const sector of page.sectors.items) assert.equal(sector[2].length, 4, 'four accent tags per sector');
  for (const html of [chain, steps]) assert.ok(!html.includes('undefined'));
}
const html = fs.readFileSync('site-3d/pr/index.html','utf8');
assert.ok(html.includes('pr-page.css?v='));
for (const route of ['strategy','linkedin','seo','localization']) {
  assert.ok(!fs.readFileSync(`site-3d/${route}/index.html`,'utf8').includes('pr-page.css'), 'styles stay on the PR route');
}
assert.ok(!source.includes('pr-orbit'), 'retired orbit diagram removed');
assert.ok(!source.includes('renderPrCasesWidget'), 'part 4: the cases block is gone from the PR page');
console.log('PR: RU/EN five-step chain without result pill, six steps, no cases block, tags and route isolation passed.');
