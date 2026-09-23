const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('site-3d/assets/js/service-page.js', 'utf8');
const data = source.slice(source.indexOf('var SERVICES ='), source.indexOf('/* ---------- Content rendering'));
const renderers = source.slice(source.indexOf('function renderLocalizationRelay'), source.indexOf('function renderLinearSequence'));
const context = vm.createContext({
  esc: value => String(value == null ? '' : value).replaceAll('&','&amp;').replaceAll('<','&lt;'),
  renderHead: s => '<h2>' + s.title + '</h2>'
});
vm.runInContext(data + '\n' + renderers, context);
const groupSizes = [7, 5, 4, 8];
for (const lang of ['ru', 'en']) {
  const page = context.SERVICES.localization[lang];
  assert.ok(/смысл бизнеса|business meaning/.test(page.hero.title), '5.1 offer is the hero title');
  const allCopy = JSON.stringify(page);
  assert.ok(!/USD/.test(allCopy), '5.2 no price anchor');
  assert.ok(!/Blockchain|blockchain/.test(page.proof.items.map(i => i[1]).join(' ') + page.trust.note + page.meta.desc), '5.3 no Blockchain emphasis');
  assert.deepEqual(Array.from(page.sectors.groups, g => g[1].length), groupSizes, '5.3 every listed material kept');
  const groups = context.renderLocalizationGroups(page.sectors);
  assert.equal((groups.match(/class="sp-loc-group"/g) || []).length, 4);
  assert.equal(page.diagram.items.length, 5, '5.4 five-point sequence');
  const relay = context.renderLocalizationRelay(page.diagram);
  assert.ok(!/\b0[1-5]\b/.test(relay), 'relay points carry no indices');
  const steps = context.renderLocalizationSteps(page.process);
  assert.equal((steps.match(/<li /g) || []).length, 5);
  for (const html of [groups, relay, steps]) assert.ok(!html.includes('undefined'));
}
assert.equal(context.SERVICES.localization.ru.diagram.items[4][0], 'Готовый материал для аудитории');
const html = fs.readFileSync('site-3d/localization/index.html','utf8');
assert.ok(html.includes('localization-page.css?v=') && html.includes('<title>Перевод и локализация — VAK Marketing</title>'));
for (const route of ['strategy','linkedin','pr','seo']) {
  assert.ok(!fs.readFileSync(`site-3d/${route}/index.html`,'utf8').includes('localization-page.css'), 'styles stay on the localisation route');
}
console.log('Localisation: RU/EN offer, no price or blockchain emphasis, four full groups, five-point relay, compact steps and route isolation passed.');
