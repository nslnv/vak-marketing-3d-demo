const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('site-3d/assets/js/scene.js', 'utf8');
const spring = source.slice(source.indexOf('  const vel = {};'), source.indexOf('  function easeRange'));
function simulate(hz, smooth, reverse = false) {
  const ctx = vm.createContext({});
  vm.runInContext(spring + '\nthis.advance = damp;', ctx);
  let value = 0, maxStep = 0;
  for (let i = 0; i < hz * 4; i++) {
    const target = reverse && i >= hz ? 0 : 1;
    const next = ctx.advance(value, target, 'scroll', smooth, 1 / hz);
    assert.ok(Number.isFinite(next));
    assert.ok(next >= -1e-6 && next <= 1 + 1e-6, 'no range overshoot');
    maxStep = Math.max(maxStep, Math.abs(next - value));
    value = next;
  }
  assert.ok(Math.abs(value - (reverse ? 0 : 1)) < .0001, 'settles after release');
  return maxStep;
}
for (const hz of [30, 60, 120]) {
  assert.ok(simulate(hz, .38) < simulate(hz, .19) * .56, 'gentler scroll step');
  simulate(hz, .38, true);
}
// Only performance gating may use raw progress, never visual choreography.
const rawUses = source.split('\n').filter(line => line.includes('rawAboutProgress'));
assert.equal(rawUses.length, 2);
assert.ok(!/rigRy \+ time \*/.test(source), 'idle rig rotation must not accumulate');
assert.ok(!/rotation\.z = [^;\n]*\btime \* (?:0\.045|0\.018|0\.026)/.test(source));
assert.ok(source.includes('frameOpenAssembly(easeAbout(aboutOpen, 0, 1))'), 'centred opening retained');
const keys = source.slice(source.indexOf('  const KEYS = ['), source.indexOf('  /* ResolveKeys'));
const exitStart = source.indexOf('    if (!compactAbout) {\n      // Distribute');
const exitCode = source.slice(exitStart, source.indexOf('    if (compactAbout) {', exitStart));
const choreography = vm.createContext({compactAbout:false, THREE:{MathUtils:{lerp:(a,b,t)=>a+(b-a)*t}}});
vm.runInContext(keys + '\nthis.endBefore = {...KEYS.filter(k=>k.sec === "about").at(-1)};', choreography);
vm.runInContext(exitCode + '\nthis.exit = KEYS.filter(k=>k.sec === "about" && k.p > .91);', choreography);
assert.ok(Math.abs(choreography.exit[0].y - (-.07)) < .1, 'no sudden downward kick after assembly');
for (const f of ['x','y','z','rx','ry','s','op']) {
  assert.ok(Math.abs(choreography.exit.at(-1)[f] - choreography.endBefore[f]) < 1e-8, 'outbound route preserved');
}
console.log('Scene motion: 30/60/120 Hz, reversal, bounded idle and centred opening passed.');
