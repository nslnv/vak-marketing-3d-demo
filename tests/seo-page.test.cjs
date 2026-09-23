const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('site-3d/assets/js/service-page.js', 'utf8');
const data = source.slice(source.indexOf('var SERVICES ='), source.indexOf('/* ---------- Content rendering'));
const renderers = source.slice(source.indexOf('function renderSeoPhases'), source.indexOf('function renderLinearSequence'));
const context = vm.createContext({
  esc: value => String(value == null ? '' : value).replaceAll('&','&amp;').replaceAll('<','&lt;'),
  renderHead: s => '<h2>' + s.title + '</h2>'
});
vm.runInContext(data + '\n' + renderers, context);
const tools = {
  ru:['Аудит текущих позиций и конкурентного поля','Сбор и кластеризация семантического ядра','Оптимизация структуры сайта под поисковые запросы','Технический SEO-аудит','Контент-стратегия под ключевые кластеры','Линкбилдинг и работа с внешними факторами','Мониторинг позиций и аналитика динамики','Репутация бренда в поисковой выдаче — SERP'],
  en:['Audit of current positions and competitor landscape','Keyword research and semantic clustering','Site structure optimisation for search intent','Technical SEO audit','Content strategy for priority clusters','Link building and external factors','Position monitoring and trend analysis','Brand reputation in search results — SERP']
};
for (const lang of ['ru', 'en']) {
  const page = context.SERVICES.seo[lang];
  assert.ok(page.proof.note.length > 60, '4.2 applied wording in place');
  assert.equal(page.scope.phases.length, 4, '4.3 four phases');
  const phases = context.renderSeoPhases(page.scope);
  assert.ok(!/\b0[1-4]\b/.test(phases), '4.3 phases are shown without numbers');
  for (const tool of tools[lang]) assert.ok(phases.includes(tool.replaceAll('&','&amp;')), 'tool kept: ' + tool);
  assert.equal(page.diagram.items.length, 4, '4.4 four steps');
  const steps = context.renderSeoSteps(page.diagram);
  assert.equal((steps.match(/sp-seo-steps__ring/g) || []).length, 4);
  assert.ok(!page.process, 'separate process block merged into the phases');
  for (const html of [phases, steps]) assert.ok(!html.includes('undefined'));
}
const html = fs.readFileSync('site-3d/seo/index.html','utf8');
assert.ok(html.includes('seo-page.css?v='));
for (const route of ['strategy','linkedin','pr','localization']) {
  assert.ok(!fs.readFileSync(`site-3d/${route}/index.html`,'utf8').includes('seo-page.css'), 'styles stay on the SEO route');
}
assert.ok(!source.includes('seo-loop'), 'retired loop diagram removed');
console.log('SEO: RU/EN applied copy, four phases without numbers, all tools, four-step line and route isolation passed.');
