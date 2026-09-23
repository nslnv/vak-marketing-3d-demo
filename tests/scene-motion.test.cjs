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
assert.ok(source.includes('frameOpenAssembly(easeAbout(aboutOpen, 0, 1), assemblyCenterPresence)'), 'centering remains active through closing');
assert.ok(source.includes('layoutAlongOpticalAxis(0.95)'), 'compact desktop joints');
assert.ok(source.includes('turn: 0'), 'no decorative module twists');
const ease = source.slice(source.indexOf('  function easeAbout('), source.indexOf('\n  /* HTML', source.indexOf('  function easeAbout(')));
const assembly = source.slice(source.indexOf('    const openSpan ='), source.indexOf('    /* Технический контроллер включается'));
for (const compactAbout of [false, true]) {
  const ctx = vm.createContext({compactAbout, aboutCenterHold:.60, aboutArrive:.36,
    aboutLeave:.85, aboutAssemblyMotion:Array(5).fill({}), aboutAssemblyDrive:Array(5).fill(0)});
  vm.runInContext(ease + '\nthis.sampleOpening = function(aboutProgress){' + assembly + '\nreturn {drive:[...aboutAssemblyDrive], end:closeStart+cascadeDuration};};', ctx);
  let previous = 0;
  for (let i = 0; i <= 1000; i++) {
    const p = i / 1000;
    const {drive, end} = ctx.sampleOpening(p);
    assert.ok(drive.every(v=>v === drive[0]), 'all modules share the same opening and closing phase');
    assert.ok(Math.abs(drive[0]-previous) < .04, 'no sudden mechanical step');
    assert.ok(end < (compactAbout ? .56 : .85), 'fully assembled before departure');
    assert.equal(ctx.sampleOpening(p).drive[0], drive[0], 'same pose in either scroll direction');
    previous = drive[0];
  }
}
const keys = source.slice(source.indexOf('  const KEYS = ['), source.indexOf('  /* ResolveKeys'));
const exitStart = source.indexOf('    if (!compactAbout) {\n      // Distribute');
const exitCode = source.slice(exitStart, source.indexOf('    if (compactAbout) {', exitStart));
const choreography = vm.createContext({compactAbout:false, THREE:{MathUtils:{lerp:(a,b,t)=>a+(b-a)*t}}});
vm.runInContext(keys + '\nthis.endBefore = {...KEYS.filter(k=>k.sec === "about").at(-1)};', choreography);
vm.runInContext('this.stationary = KEYS.filter(k=>k.sec === "about" && k.p >= .39 && k.p <= .91);', choreography);
for (const pose of choreography.stationary) for (const f of ['x','y','z','rx','ry','s','cz','cy','ro']) {
  assert.equal(pose[f], choreography.stationary[0][f], 'fixed rig pose through opening, hold and closing');
}
vm.runInContext(exitCode + '\nthis.exit = KEYS.filter(k=>k.sec === "about" && k.p > .91);', choreography);
assert.ok(Math.abs(choreography.exit[0].y - (-.07)) < .1, 'no sudden downward kick after assembly');
for (const f of ['x','y','z','rx','ry','s','op']) {
  assert.ok(Math.abs(choreography.exit.at(-1)[f] - choreography.endBefore[f]) < 1e-8, 'outbound route preserved');
}
console.log('Scene motion: 30/60/120 Hz, reversal, bounded idle and centred opening passed.');
