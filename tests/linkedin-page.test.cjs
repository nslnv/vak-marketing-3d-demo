const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('site-3d/assets/js/service-page.js', 'utf8');
const data = source.slice(source.indexOf('var SERVICES ='), source.indexOf('/* ---------- Content rendering'));
const renderers = source.slice(source.indexOf('function renderLinkedinFunnel'), source.indexOf('function renderLinearSequence'));
const context = vm.createContext({
  esc: value => String(value == null ? '' : value).replaceAll('&','&amp;').replaceAll('<','&lt;'),
  renderHead: s => '<h2>' + s.title + '</h2>'
});
vm.runInContext(data + '\n' + renderers, context);
for (const lang of ['ru', 'en']) {
  const page = context.SERVICES.linkedin[lang];
  assert.equal(page.scope.items.length, 6, 'six sequential funnel stages');
  assert.deepEqual(Array.from(page.process.items, item => item[1].length), [5, 6, 5], 'every task from the brief');
  const funnel = context.renderLinkedinFunnel(page.scope);
  assert.equal((funnel.match(/<li /g) || []).length, 6);
  assert.equal((funnel.match(/<svg /g) || []).length, 6);
  const icp = context.renderLinkedinIcpLine(page.diagram);
  assert.equal((icp.match(/<li /g) || []).length, 5, 'four milestones and the final outcome');
  assert.ok(icp.includes(page.diagram.core[0].replace('\n',' ')));
  const process = context.renderLinkedinProcess(page.process);
  assert.equal((process.match(/class="sp-linkedin-phase"/g) || []).length, 3);
  assert.equal((process.match(/<li>/g) || []).length, 16);
  for (const stage of page.process.items) for (const item of stage[1]) assert.ok(process.includes(item));
  for (const html of [funnel, icp, process]) assert.ok(!html.includes('undefined'));
}
const html = fs.readFileSync('site-3d/linkedin/index.html','utf8');
assert.ok(html.includes('linkedin-page.css?v='));
assert.ok(html.includes('service-page.js?v='));
for (const route of ['strategy','pr','seo','localization']) {
  assert.ok(!fs.readFileSync(`site-3d/${route}/index.html`,'utf8').includes('linkedin-page.css'), 'styles stay on the LinkedIn route');
}
console.log('LinkedIn: RU/EN funnel, 16 tasks, 5 milestones, and route isolation passed.');
