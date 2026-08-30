/* ==========================================================================
   VAK Marketing — сцена на WebGL.

   Образ страницы: оптический прибор. Слева в кадр входит рассеянный шум
   рынка, проходит через блок линз и выходит собранным пучком — это ровно
   то, что агентство делает с коммуникацией проекта.

   Всё считается на GPU: три стеклянные линзы с настоящим преломлением по
   процедурной кубической карте (с дисперсией по каналам), поток частиц,
   который живёт в вершинном шейдере, и звёзды. Ни одной внешней текстуры.
   ========================================================================== */

import * as THREE from '../vendor/three.module.min.js';

const canvas = document.getElementById('stage');
if (canvas) boot(canvas);

function boot(canvas) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse  = matchMedia('(pointer: coarse)').matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas, alpha: true, antialias: !coarse, powerPreference: 'high-performance'
    });
  } catch (e) { return; }                       // нет WebGL — остаётся CSS-фон
  document.documentElement.classList.add('has-webgl');

  renderer.setClearAlpha(0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  /* Потолок плотности пикселей. Ниже он ещё и подстраивается на ходу:
     сцена сама снижает разрешение, если кадры перестают укладываться
     в бюджет, и возвращает его обратно, когда запас появляется. */
  const DPR_MAX = coarse ? 1.4 : 1.6;
  const DPR_MIN = 1.0;
  const DPR_INTERACTION = coarse ? 1.15 : 1.30;
  let dprAutoCap = DPR_MAX, dprCap = DPR_MAX, audienceInMotion = false, aboutInMotion = false;
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 120);
  camera.position.set(0, 0, 7.2);

  /* ─────────── 1. процедурная кубическая карта окружения ───────────
     Она задаёт весь характер стекла: тёплый пурпурный ключ справа,
     холодный циан слева, мягкий фиолетовый верх и одна яркая точка. */
  /* Блики на металле и просветлениях — главный признак «дорогого» 3D.
     На десктопе кубическая карта в 512px держит тонкие софтбоксы чистыми,
     на touch-устройствах остаётся прежний экономный размер. */
  const envRT = new THREE.WebGLCubeRenderTarget(coarse ? 192 : 512);
  envRT.texture.generateMipmaps = false;
  envRT.texture.minFilter = THREE.LinearFilter;
  {
    const envScene = new THREE.Scene();
    envScene.add(new THREE.Mesh(
      new THREE.SphereGeometry(50, 32, 24),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        toneMapped: false,
        vertexShader: `
          varying vec3 vDir;
          void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `
          varying vec3 vDir;
          float lobe(vec3 d, vec3 l, float p){ return pow(max(dot(d, normalize(l)), 0.0), p); }
          void main(){
            vec3 d = normalize(vDir);
            vec3 c = vec3(0.008, 0.007, 0.022);
            c += vec3(0.045, 0.028, 0.115) * smoothstep(-0.75, 1.0, d.y);
            c += vec3(1.00, 0.30, 0.66) * lobe(d, vec3( 0.62, 0.38, -0.70),  5.0) * 0.62;
            c += vec3(0.34, 0.82, 1.00) * lobe(d, vec3(-0.78, 0.12,  0.60),  6.0) * 1.30;
            c += vec3(0.62, 0.58, 1.00) * lobe(d, vec3( 0.05, 1.00,  0.12),  2.2) * 0.72;
            c += vec3(1.00, 0.94, 1.00) * lobe(d, vec3( 0.34, 0.62,  0.70), 90.0) * 3.20;
            c += vec3(0.90, 0.70, 1.00) * lobe(d, vec3(-0.30,-0.85,  0.42), 40.0) * 0.55;
            // софтбоксы: узкие яркие полосы, они и лепят форму стекла
            float b1 = smoothstep(0.11, 0.0, abs(d.y - 0.42)) * smoothstep(1.0, 0.15, abs(d.x + 0.25));
            c += vec3(1.00, 0.98, 1.00) * b1 * 2.60;
            float b2 = smoothstep(0.07, 0.0, abs(d.x - 0.62)) * smoothstep(1.0, 0.10, abs(d.y - 0.10));
            c += vec3(0.80, 0.90, 1.00) * b2 * 1.85;
            float b3 = smoothstep(0.05, 0.0, abs(d.y + 0.50)) * smoothstep(1.0, 0.20, abs(d.z - 0.30));
            c += vec3(1.00, 0.55, 0.85) * b3 * 1.25;
            gl_FragColor = vec4(c, 1.0);
          }`
      })
    ));
    new THREE.CubeCamera(0.1, 100, envRT).update(renderer, envScene);
  }
  const ENV = envRT.texture;

  /* ─────────── 2. объектив ───────────
     Собран как настоящий прибор: задний фланец, три стеклянных элемента
     в оправах, девятилепестковая диафрагма, накатное кольцо, рёбра корпуса
     и передний безель. Диафрагма живая: лепестки поворачиваются вокруг
     своих осей и меняют просвет. */
  const rig = new THREE.Group();       // общий наклон и парение
  const optic = new THREE.Group();     // сам объектив
  rig.add(optic);
  scene.add(rig);

  /* Для About объектив собирается не как набор случайных колец, а как три
     настоящих инженерных модуля: входной, фокусный и выходной. Обычный
     маршрут Hero от этого не меняется; эти группы нужны только в момент
     контролируемой разборки. */
  const ABOUT_ASSEMBLY_NAMES = ['inlet', 'position', 'comms', 'content', 'output'];
  const aboutAssemblies = Object.fromEntries(
    ABOUT_ASSEMBLY_NAMES.map(name => [name, new THREE.Group()])
  );
  const aboutAssemblyNodes = Object.fromEntries(
    ABOUT_ASSEMBLY_NAMES.map(name => [name, []])
  );
  function stageAboutNode(name, node) {
    aboutAssemblyNodes[name].push(node);
    return node;
  }

  const V2 = THREE.Vector2;

  /* профиль двояковыпуклой линзы с фаской по кромке: фаска ловит свет
     и даёт ту самую тонкую яркую окантовку */
  function lensProfile(R, curve, edge) {
    const p = [], N = 40, ch = 0.020, Rc = R - ch;
    const sag = r => curve * Math.sqrt(Math.max(0, 1 - (r / R) ** 2));
    for (let i = 0; i <= N; i++) { const r = (i / N) * Rc; p.push(new V2(r, edge * 0.5 + sag(r))); }
    p.push(new V2(R, edge * 0.5 - ch * 0.6));
    p.push(new V2(R, -edge * 0.5 + ch * 0.6));
    for (let i = N; i >= 0; i--) { const r = (i / N) * Rc; p.push(new V2(r, -edge * 0.5 - sag(r))); }
    return p;
  }

  /* точёное кольцо: профиль с фасками, лату́нный вид даёт сам шейдер */
  function ringProfile(ri, ro, h) {
    const c = Math.min(0.045, h * 0.4);
    return [
      new V2(ri, 0), new V2(ri, h - c), new V2(ri + c, h),
      new V2(ro - c, h), new V2(ro, h - c),
      new V2(ro, c), new V2(ro - c, 0),
      new V2(ri + c, 0), new V2(ri, 0)
    ];
  }

  /* обечайка корпуса: труба со стенкой и фасками по торцам.
     Ступенчатые диаметры этих обечаек и делают силуэт прибора. */
  function shellProfile(ri, ro, z0, z1, ch) {
    ch = ch || 0.05;
    return [
      new V2(ri, z0), new V2(ro - ch, z0), new V2(ro, z0 + ch),
      new V2(ro, z1 - ch), new V2(ro - ch, z1), new V2(ri, z1), new V2(ri, z0)
    ];
  }

  const baseVert = `
    varying vec3 vN; varying vec3 vW; varying vec3 vP; varying vec3 vT;
    void main(){
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vW = wp.xyz; vP = position;
      vN = normalize(mat3(modelMatrix) * normal);
      // касательная вдоль окружности вокруг оси Y — нужна насечке на кольце
      vec3 tr = vec3(-position.z, 0.0, position.x);
      vT = normalize(mat3(modelMatrix) * (dot(tr, tr) > 1e-8 ? tr : vec3(1.0, 0.0, 0.0)));
      gl_Position = projectionMatrix * viewMatrix * wp;
    }`;

  const glassFrag = `
    uniform samplerCube uEnv;
    uniform vec3  uTint, uEdge, uAbs;
    uniform float uIor, uDisp, uAlpha, uGain, uCoat;
    varying vec3 vN; varying vec3 vW; varying vec3 vP; varying vec3 vT;
    void main(){
      vec3 N = normalize(vN);
      vec3 V = normalize(vW - cameraPosition);
      float ndv  = clamp(dot(N, -V), 0.0, 1.0);
      float fres = 0.04 + 0.96 * pow(1.0 - ndv, 4.4);

      float e = 1.0 / uIor;
      vec3 tr = vec3(
        textureCube(uEnv, refract(V, N, e - uDisp)).r,
        textureCube(uEnv, refract(V, N, e        )).g,
        textureCube(uEnv, refract(V, N, e + uDisp)).b
      );
      vec3 refl = textureCube(uEnv, reflect(V, N)).rgb;

      /* Просветляющее покрытие. У каждого элемента свой состав, и его цвет
         гуляет с углом: у настоящей оптики отблеск на просвете зелёный,
         лиловый или янтарный в зависимости от того, как смотришь. */
      vec3 coat = 0.5 + 0.5 * cos(6.2831853 *
                  (vec3(0.00, 0.33, 0.67) + (1.0 - ndv) * 1.15 + uCoat));
      refl *= mix(vec3(1.0), coat, 0.60);

      // выпуклая линза толще к центру: там стекло сильнее красит проходящий свет
      vec3 absorb = exp(-uAbs * pow(ndv, 0.7) * 1.7);
      vec3 col = mix(tr * uTint * absorb, refl, fres) * uGain;

      // вторичный блик от задней поверхности: слабый, но он и даёт «мокрое» стекло
      col += textureCube(uEnv, reflect(V, normalize(N + V * 0.32))).rgb
             * uTint * fres * 0.22;

      // острый блик от главного софтбокса
      float sp = pow(max(dot(reflect(V, N), normalize(vec3(-0.25, 0.78, 0.60))), 0.0), 240.0);
      col += vec3(1.0, 0.97, 1.0) * sp * 3.0;
      col += uEdge * pow(1.0 - ndv, 6.0) * 1.55;

      float a = uAlpha * clamp(0.32 + 0.80 * fres + 0.26 * length(col), 0.0, 1.0);
      gl_FragColor = vec4(col, a);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`;

  const glassUniforms = [];
  function glass(o) {
    const u = {
      uEnv:  { value: ENV },
      uTint: { value: new THREE.Color(o.tint) },
      uEdge: { value: new THREE.Color(o.edge) },
      uAbs:  { value: new THREE.Vector3(o.abs[0], o.abs[1], o.abs[2]) },
      uIor:  { value: o.ior },
      uDisp: { value: o.disp },
      uCoat: { value: o.coat || 0 },
      uAlpha:{ value: 1 },
      uGain: { value: 1 }
    };
    glassUniforms.push(u);
    return new THREE.ShaderMaterial({
      uniforms: u, vertexShader: baseVert, fragmentShader: glassFrag,
      transparent: true, depthWrite: false, side: THREE.FrontSide
    });
  }

  /* ── передний оптический элемент ────────────────────────────────────
     Боковые линзы дают объём, но в ракурсе первого экрана раньше не
     читалась сама «душа» объектива — просветлённый передний элемент.
     Этот отдельный тонкий слой добавляет реальное многослойное стекло:
     отражение окружения, тонкоплёночную интерференцию, концентрические
     каустики и едва заметный живой блик. Это не плоская текстура: цвет
     меняется от нормали, камеры и времени. */
  const opticalUniforms = [];
  function opticalFace(o) {
    const u = {
      uEnv:    { value: ENV },
      uTintA:  { value: new THREE.Color(o.tintA) },
      uTintB:  { value: new THREE.Color(o.tintB) },
      uT:      { value: 0 },
      uA:      { value: 1 },
      uEnergy: { value: 1 },
      uPhase:  { value: o.phase || 0 }
    };
    opticalUniforms.push(u);
    return new THREE.ShaderMaterial({
      uniforms: u,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      vertexShader: `
        varying vec2 vUv; varying vec3 vN; varying vec3 vW;
        void main(){
          vUv = uv;
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vW = wp.xyz;
          vN = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: `
        uniform samplerCube uEnv;
        uniform vec3 uTintA, uTintB;
        uniform float uT, uA, uEnergy, uPhase;
        varying vec2 vUv; varying vec3 vN; varying vec3 vW;
        void main(){
          vec2 p = vUv * 2.0 - 1.0;
          float r = length(p);
          vec3 N = normalize(vN);
          vec3 V = normalize(vW - cameraPosition);
          float facing = clamp(dot(N, -V), 0.0, 1.0);
          float fres = pow(1.0 - facing, 3.15);

          /* Тонкоплёночное покрытие: плотные, но очень мягкие кольца.
             Они проявляются только на стекле и делают поверхность глубже. */
          float film = 0.5 + 0.5 * sin(r * 31.0 - facing * 8.0 + uPhase + uT * 0.17);
          float fine = 0.5 + 0.5 * sin(r * 122.0 + uPhase * 2.0 - uT * 0.38);
          float rings = smoothstep(0.12, 0.92, r) * (0.42 * film + 0.18 * fine);
          float rim = smoothstep(0.66, 0.985, r);

          vec3 refl = textureCube(uEnv, reflect(V, N)).rgb;
          vec3 coat = mix(uTintA, uTintB, film);
          vec3 core = mix(uTintA * 0.16, uTintB * 0.12, fine);
          vec3 col = core;
          col += refl * (0.10 + fres * 0.92);
          col += coat * rings * (0.32 + 0.55 * fres) * uEnergy;
          col += mix(uTintA, vec3(1.0), 0.45) * rim * (0.08 + 0.47 * fres);

          /* Бегущий блик — узкая дорожка от софтбокса, не неоновый контур. */
          float sweep = exp(-pow(p.x * 0.72 + p.y * 0.33 + sin(uT * 0.28 + uPhase) * 0.15, 2.0) * 70.0);
          col += vec3(0.88, 0.97, 1.0) * sweep * (0.12 + 0.24 * fres);

          float alpha = (0.035 + rings * 0.13 + rim * 0.19 + fres * 0.36) * uA;
          gl_FragColor = vec4(col, alpha);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`
    });
  }

  /* металл: отражение окружения плюс насечка. Насечка честная — она
     возмущает нормаль по касательной, поэтому блики по ней бегут. */
  const metalFrag = `
    uniform samplerCube uEnv;
    uniform vec3 uBase, uSpec;
    uniform float uAlpha, uKnurl, uRough, uTicks;
    varying vec3 vN; varying vec3 vW; varying vec3 vP; varying vec3 vT;
    void main(){
      vec3 N = normalize(vN);
      if (!gl_FrontFacing) N = -N;              // изнутри тубуса грани смотрят на нас
      float groove = 1.0;
      float ang = atan(vP.z, vP.x);
      if (uKnurl > 0.5) {
        float g = sin(ang * uKnurl);
        N = normalize(N + vT * g * 1.25);
        groove = 0.38 + 0.62 * abs(g);
      } else {
        // микрошлифовка по окружности: даёт точёному металлу живой отблеск
        float br = sin(ang * 84.0) * 0.6 + sin(ang * 137.0) * 0.4;
        N = normalize(N + vT * br * 0.035);
        groove = 0.94 + 0.06 * br;
      }
      // гравированная шкала: узкие штрихи, каждый пятый ярче
      float tick = 0.0;
      if (uTicks > 0.5) {
        float idx = ang / 6.2831853 * uTicks;
        float f = abs(fract(idx) - 0.5) * 2.0;
        float major = smoothstep(0.72, 0.88, abs(fract(idx / 5.0) - 0.5) * 2.0);
        tick = smoothstep(0.84, 0.97, f) * (0.55 + 0.85 * major);
      }

      vec3 V = normalize(vW - cameraPosition);
      float ndv = clamp(dot(N, -V), 0.0, 1.0);
      vec3 R = reflect(V, N);
      vec3 refl = textureCube(uEnv, R).rgb;

      vec3 col = mix(uBase, refl * 1.25, (0.42 + 0.5 * pow(1.0 - ndv, 2.2)) * (1.0 - uRough * 0.45));
      col += uSpec * pow(max(dot(R, normalize(vec3(-0.25, 0.78, 0.60))), 0.0), 60.0) * 2.4;
      col += uSpec * pow(max(dot(R, normalize(vec3(0.70, 0.30, -0.62))), 0.0), 22.0) * 0.9;
      col += uSpec * pow(1.0 - ndv, 3.2) * 0.5;
      col *= groove;
      col += uSpec * tick * 1.25;

      gl_FragColor = vec4(col, uAlpha);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`;

  const metalUniforms = [];
  function metal(o) {
    o = o || {};
    const u = {
      uEnv:  { value: ENV },
      uBase: { value: new THREE.Color(o.base || 0x2b2440) },
      uSpec: { value: new THREE.Color(o.spec || 0xd7c9ff) },
      uKnurl:{ value: o.knurl || 0 },
      uTicks:{ value: o.ticks || 0 },
      uRough:{ value: o.rough || 0 },
      uAlpha:{ value: 1 }
    };
    metalUniforms.push(u);
    return new THREE.ShaderMaterial({
      uniforms: u, vertexShader: baseVert, fragmentShader: metalFrag,
      transparent: true, depthWrite: true,
      side: o.side || THREE.FrontSide
    });
  }

  const D = THREE.DoubleSide;
  const matBody  = metal({ side: D });
  const matRim   = metal({ base: 0x362c52, spec: 0xe4d8ff, side: D });
  const matKnurl = metal({ base: 0x241e38, knurl: 46, rough: 0.25, side: D });
  const matBlade = metal({ base: 0x1d1830, spec: 0xd6c6ff, rough: 0.30, side: D });
  const matScale = metal({ base: 0x241d3a, spec: 0xe6dcff, ticks: 60, rough: 0.30, side: D });
  const matDark  = metal({ base: 0x0c0a15, spec: 0x6c5ba8, rough: 0.92, side: D });
  let markRef = null;

  /* --- стеклянные элементы в оправах --- */
  const ELEMENTS = [
    { R: 0.84, curve: 0.22, edge: 0.09, z: -1.92, ior: 1.44, disp: 0.030, coat: 0.62,
      tint: 0xe4dcff, edge_: 0x7d5cff, abs: [0.34, 0.46, 0.14] },
    { R: 1.00, curve: 0.31, edge: 0.11, z: -0.30, ior: 1.53, disp: 0.046, coat: 0.18,
      tint: 0xfaf7ff, edge_: 0x9a7cff, abs: [0.18, 0.26, 0.12] },
    { R: 0.86, curve: 0.24, edge: 0.10, z:  1.62, ior: 1.47, disp: 0.034, coat: 0.86,
      tint: 0xdcf3ff, edge_: 0x4fd8ff, abs: [0.40, 0.20, 0.10] }
  ];

  ELEMENTS.forEach((el, elementIndex) => {
    const assembly = ['position', 'comms', 'output'][elementIndex];
    const g = new THREE.LatheGeometry(lensProfile(el.R, el.curve, el.edge), 128);
    const m = new THREE.Mesh(g, glass({
      tint: el.tint, edge: el.edge_, ior: el.ior, disp: el.disp, abs: el.abs, coat: el.coat
    }));
    m.rotation.x = Math.PI / 2;                 // ось линзы смотрит вдоль Z
    m.position.z = el.z;
    optic.add(m);
    stageAboutNode(assembly, m);

    const rim = new THREE.Mesh(
      new THREE.LatheGeometry(ringProfile(el.R + 0.010, el.R + 0.085, 0.11), 96), matRim
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.z = el.z + 0.055;
    optic.add(rim);
    stageAboutNode(assembly, rim);

  });

  /* --- диафрагма: девять лепестков ---
     Каждый лепесток ограничен хордой (она и рисует просвет) и дугой корпуса,
     поэтому за габарит оправы он не выходит ни при каком раскрытии.
     Просвет меняется сдвигом лепестка к оси, весь набор при этом
     медленно проворачивается — так ведёт себя настоящий механизм. */
  const IRIS_N = 9, IRIS_Z = 2.14, IRIS_OUT = 1.00, IRIS_A = 0.60;
  const blades = [];
  {
    const w = Math.tan(Math.PI / IRIS_N) * IRIS_A * 2.6;
    const shape = new THREE.Shape();
    const a1 = Math.atan2(IRIS_A, w), a0 = Math.atan2(IRIS_A, -w);
    shape.moveTo(-w, IRIS_A);
    shape.lineTo(w, IRIS_A);
    shape.lineTo(Math.cos(a1) * IRIS_OUT, Math.sin(a1) * IRIS_OUT);
    shape.absarc(0, 0, IRIS_OUT, a1, a0, false);
    shape.lineTo(-w, IRIS_A);
    // фаска по кромке лепестка: тонкая светлая линия по краю просвета
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.011, curveSegments: 28,
      bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.006, bevelSegments: 1
    });
    for (let i = 0; i < IRIS_N; i++) {
      const th = (i / IRIS_N) * Math.PI * 2;
      const b = new THREE.Mesh(geo, matBlade);
      b.userData.th = th;
      b.userData.z = IRIS_Z + i * 0.0040;
      b.rotation.order = 'ZXY';           // сначала наклон, потом разворот по кругу
      b.rotation.x = 0.11;
      b.rotation.z = th;
      b.position.set(0, 0, b.userData.z);
      optic.add(b);
      stageAboutNode('content', b);
      blades.push(b);
    }
    // пластина-обойма закрывает стык лепестков с корпусом
    const plate = new THREE.Mesh(
      new THREE.LatheGeometry(ringProfile(0.96, 1.08, 0.11), 96), matBody
    );
    plate.rotation.x = Math.PI / 2;
    plate.position.z = IRIS_Z - 0.05;
    optic.add(plate);
    stageAboutNode('content', plate);
  }

  /* --- корпус ---
     Силуэт собран ступенями: узкий хвостовик, тело, кольцо фокуса,
     кольцо со шкалой и раструб спереди. Обечайки открытые, между ними
     видно стекло, поэтому прибор не превращается в глухую трубу. */
  {
    const shell = (ri, ro, z0, z1, mat, seg) => {
      const m = new THREE.Mesh(
        new THREE.LatheGeometry(shellProfile(ri, ro, z0, z1), seg || 128), mat || matBody
      );
      m.rotation.x = Math.PI / 2;
      optic.add(m);
      return m;
    };

    stageAboutNode('inlet', shell(0.66, 0.82, -3.00, -2.34)); // хвостовик с байонетом
    stageAboutNode('comms', shell(1.02, 1.14, -1.52,  0.48)); // тело
    stageAboutNode('output', shell(1.10, 1.26,  1.24,  2.30)); // раструб

    // накатка: заднее кольцо у хвостовика и большое кольцо фокуса
    const knurlRing = (r, h, z, mat) => {
      const nodes = [];
      const m = new THREE.Mesh(
        new THREE.CylinderGeometry(r, r, h, 160, 1, true), mat
      );
      m.rotation.x = Math.PI / 2;
      m.position.z = z;
      optic.add(m);
      nodes.push(m);
      [-h / 2, h / 2].forEach(dz => {
        const e = new THREE.Mesh(new THREE.TorusGeometry(r + 0.012, 0.024, 8, 128), matRim);
        e.position.z = z + dz;
        optic.add(e);
        nodes.push(e);
      });
      return nodes;
    };
    knurlRing(0.94, 0.34, -1.94, metal({ base: 0x1e1830, knurl: 44, rough: 0.30, side: D }))
      .forEach(node => stageAboutNode('inlet', node));
    knurlRing(1.20, 0.50, -0.30, matKnurl)
      .forEach(node => stageAboutNode('comms', node));

    // кольцо со шкалой
    const scale = new THREE.Mesh(
      new THREE.LatheGeometry(ringProfile(1.14, 1.24, 0.16), 160), matScale
    );
    scale.rotation.x = Math.PI / 2;
    scale.position.z = 0.66;
    optic.add(scale);
    stageAboutNode('content', scale);

    // рёбра: связывают ступени и держат силуэт открытым
    const rods = (radius, len, z, n, phase) => {
      const nodes = [];
      const g = new THREE.CylinderGeometry(0.030, 0.030, len, 8);
      for (let i = 0; i < n; i++) {
        const th = (i / n) * Math.PI * 2 + phase;
        const r = new THREE.Mesh(g, matBody);
        r.rotation.x = Math.PI / 2;
        r.position.set(Math.cos(th) * radius, Math.sin(th) * radius, z);
        optic.add(r);
        nodes.push(r);
      }
      return nodes;
    };
    rods(0.88, 1.30, -1.98, 6, 0.26).forEach(node => stageAboutNode('inlet', node));
    rods(1.10, 0.90,  0.86, 6, 0.52).forEach(node => stageAboutNode('output', node));

    // внутренние бленды: гасят паразитный свет и дают глубину при взгляде внутрь
    [-1.10, 0.24, 1.10].forEach((z, i) => {
      const baffle = new THREE.Mesh(
        new THREE.LatheGeometry(ringProfile(0.56, 1.02, 0.03), 72), matDark
      );
      baffle.rotation.x = Math.PI / 2;
      baffle.position.z = z;
      optic.add(baffle);
      stageAboutNode(i === 0 ? 'inlet' : i === 1 ? 'content' : 'output', baffle);
    });

    // канавка под светофильтр в раструбе
    const groove = new THREE.Mesh(new THREE.TorusGeometry(1.235, 0.020, 8, 128), matDark);
    groove.position.z = 2.16;
    optic.add(groove);
    stageAboutNode('output', groove);

    // метка индекса: единственное тёплое пятно на приборе
    const mark = new THREE.Mesh(
      new THREE.SphereGeometry(0.038, 12, 10),
      new THREE.MeshBasicMaterial({ color: 0xffd7a0, transparent: true })
    );
    mark.position.set(0, 1.26, 0.66);
    optic.add(mark);
    stageAboutNode('content', mark);
    markRef = mark;

    // байонет сзади
    const tab = new THREE.BoxGeometry(0.26, 0.08, 0.09);
    for (let i = 0; i < 3; i++) {
      const th = (i / 3) * Math.PI * 2 + 0.5;
      const t = new THREE.Mesh(tab, matRim);
      t.position.set(Math.cos(th) * 0.74, Math.sin(th) * 0.74, -3.06);
      t.rotation.z = th;
      optic.add(t);
      stageAboutNode('inlet', t);
    }
  }

  /* --- передняя «корона» и силовая рамка ---
     До этого конструкцию в основном считывали кольца, поэтому при боковом
     ракурсе она могла выглядеть как аккуратная, но слишком абстрактная
     сборка. Передний модуль собирает силуэт: наружная рамка держит оправу,
     четыре распорки дают масштаб, а слой стекла и калибровочные дуги делают
     фокусный узел предметом, к которому хочется приблизиться. */
  const frontAssembly = new THREE.Group();
  optic.add(frontAssembly);

  const frontFace = new THREE.Mesh(
    new THREE.CircleGeometry(0.965, 160),
    opticalFace({ tintA: 0x62e4ff, tintB: 0xff7ac5, phase: 0.42 })
  );
  frontFace.position.z = 2.365;
  frontFace.renderOrder = 4;
  frontAssembly.add(frontFace);

  /* Второй, меньший слой находится на несколько миллиметров глубже. Из-за
     параллакса и разной фазы покрытия он даёт настоящий «колодец» внутри
     передней линзы, а не одну плоскую блестящую шайбу. */
  const frontInner = new THREE.Mesh(
    new THREE.CircleGeometry(0.685, 128),
    opticalFace({ tintA: 0xb4a2ff, tintB: 0x78eaff, phase: 2.14 })
  );
  frontInner.position.z = 2.342;
  frontInner.scale.setScalar(0.988);
  frontInner.renderOrder = 3;
  frontAssembly.add(frontInner);

  /* Тонкая двухступенчатая прижимная обойма — реальная механическая деталь
     передней линзы, а не UI-дуга. Она добавляет глубину оптическому колодцу
     и едет вместе с output-модулем в обе стороны раскладки. */
  const frontRetainer = new THREE.Group();
  frontRetainer.position.z = 2.382;
  frontAssembly.add(frontRetainer);
  const retainerRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.824, 0.014, 8, 160), matRim
  );
  retainerRim.renderOrder = 6;
  frontRetainer.add(retainerRim);
  const retainerGroove = new THREE.Mesh(
    new THREE.TorusGeometry(0.774, 0.006, 6, 160), matDark
  );
  retainerGroove.position.z = 0.007;
  retainerGroove.renderOrder = 7;
  frontRetainer.add(retainerGroove);

  const detailMats = [];
  function lightMetal(color, opacity) {
    const m = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity, depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    detailMats.push({ m, base: opacity });
    return m;
  }

  /* Калибровочные дуги: они намеренно разнесены на разных радиусах и не
     складываются в «HUD». Это гравировка/противовес механизма, которая
     медленно живёт вместе с оптикой. */
  const calibration = new THREE.Group();
  calibration.position.z = 2.395;
  frontAssembly.add(calibration);
  const cyanArc = lightMetal(0xa9edff, 0.32);
  const roseArc = lightMetal(0xffacd9, 0.20);
  const addArc = (radius, tube, sweep, rot, mat) => {
    const a = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 7, 120, sweep), mat);
    a.rotation.z = rot;
    calibration.add(a);
  };
  addArc(0.755, 0.009, Math.PI * 0.52,  0.18, cyanArc);
  addArc(0.755, 0.009, Math.PI * 0.39,  2.46, cyanArc);
  addArc(0.570, 0.006, Math.PI * 0.48, -1.28, roseArc);
  addArc(0.570, 0.006, Math.PI * 0.33,  1.18, roseArc);

  /* «Зрачок» — не свечение на весь экран, а концентратор сигнала в центре.
     Чёрная диафрагма перед ним остаётся читаемой, а узкий холодный обод
     подчёркивает глубину и направляет взгляд в оптический канал. */
  const pupil = new THREE.Mesh(
    new THREE.RingGeometry(0.34, 0.405, 96),
    lightMetal(0xc6f4ff, 0.25)
  );
  pupil.position.z = 2.407;
  pupil.renderOrder = 5;
  frontAssembly.add(pupil);

  /* Внешняя рамка делает переднюю часть собранной. Тор висит немного перед
     корпусом и соединён с ним четырьмя тонкими опорами — на широком экране
     эти детали читаются как аккуратная механика, на мобильном не утяжеляют
     силуэт благодаря общей прозрачности сцены. */
  const gimbal = new THREE.Group();
  frontAssembly.add(gimbal);
  const outerRing = new THREE.Mesh(new THREE.TorusGeometry(1.355, 0.027, 8, 160), matRim);
  outerRing.position.z = 1.94;
  gimbal.add(outerRing);
  const outerAccent = new THREE.Mesh(
    new THREE.TorusGeometry(1.325, 0.007, 6, 160), lightMetal(0x8f79ff, 0.17)
  );
  outerAccent.position.z = 1.965;
  gimbal.add(outerAccent);

  const braceGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.68, 8);
  for (let i = 0; i < 4; i++) {
    const th = i / 4 * Math.PI * 2 + Math.PI / 4;
    const brace = new THREE.Mesh(braceGeo, matBody);
    brace.rotation.x = Math.PI / 2;
    brace.position.set(Math.cos(th) * 1.27, Math.sin(th) * 1.27, 2.14);
    gimbal.add(brace);

    const bolt = new THREE.Mesh(new THREE.SphereGeometry(0.052, 12, 10), matRim);
    bolt.position.set(Math.cos(th) * 1.27, Math.sin(th) * 1.27, 2.47);
    gimbal.add(bolt);
  }

  /* Шестая подпись привязана не к новой декоративной детали, а к центру
     настоящей передней короны. Поэтому «Результат» едет со сборкой output
     как её финальная физическая точка и точно повторяет путь при реверсе. */
  const frontResultLabelAnchor = new THREE.Object3D();
  frontResultLabelAnchor.position.set(0, 0, 2.365);
  frontAssembly.add(frontResultLabelAnchor);

  /* Передняя корона остаётся цельной: лицо, рамка, распорки, калибровка и
     зрачок едут как один настоящий output-модуль, а не разлетаются на
     декоративные кусочки. */
  stageAboutNode('output', frontAssembly);

  /* Переподвешиваем уже созданные детали в пять самостоятельных, но
     исходно идентичных подузлов. attach сохраняет мировую геометрию, поэтому
     Hero остаётся пиксельно тем же до начала About-анимации. */
  scene.updateMatrixWorld(true);
  for (const name of ABOUT_ASSEMBLY_NAMES) {
    const assembly = aboutAssemblies[name];
    optic.add(assembly);
    for (const node of aboutAssemblyNodes[name]) assembly.attach(node);
    assembly.userData.aboutBase = {
      position: assembly.position.clone(),
      rotation: assembly.rotation.clone(),
      scale: assembly.scale.clone()
    };
  }
  gimbal.userData.aboutBase = {
    position: gimbal.position.clone(),
    rotation: gimbal.rotation.clone()
  };
  /* Пять модулей имеют очень разную физическую длину. Равный сдвиг каждого
     центра давал неровные воздушные зазоры. Поэтому раскладка строится по
     реальным внешним границам: зазоры между соседними деталями всегда равны
     и объект раскрывается ровной инженерной линией, а не «на глаз». */
  scene.updateMatrixWorld(true);
  function boundsInOptic(node) {
    const inverseOptic = new THREE.Matrix4().copy(optic.matrixWorld).invert();
    const bounds = new THREE.Box3().makeEmpty();
    node.traverse(child => {
      if (!child.isMesh || !child.geometry) return;
      if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();
      const localMatrix = new THREE.Matrix4().multiplyMatrices(inverseOptic, child.matrixWorld);
      bounds.union(child.geometry.boundingBox.clone().applyMatrix4(localMatrix));
    });
    return bounds;
  }
  const aboutAssemblyBounds = ABOUT_ASSEMBLY_NAMES.map(name => {
    const bounds = boundsInOptic(aboutAssemblies[name]);
    const minZ = bounds.min.z;
    const maxZ = bounds.max.z;
    return {
      name,
      node: aboutAssemblies[name],
      centerZ: (minZ + maxZ) * 0.5,
      minZ,
      maxZ,
      spanZ: Math.max(0.001, maxZ - minZ),
      /* Радиус снимаем с фактической геометрии модуля, а не задаём «на
         глаз». Он нужен только для редкой контактной пыли у стыков. */
      radius: Math.max(
        Math.abs(bounds.min.x), Math.abs(bounds.max.x),
        Math.abs(bounds.min.y), Math.abs(bounds.max.y)
      )
    };
  });
  function layoutAlongOpticalAxis(gap) {
    const total = aboutAssemblyBounds.reduce((sum, item) => sum + item.spanZ, 0)
      + gap * (aboutAssemblyBounds.length - 1);
    let cursor = -total * 0.5;
    return aboutAssemblyBounds.map(item => {
      const targetCenter = cursor + item.spanZ * 0.5;
      cursor += item.spanZ + gap;
      return new THREE.Vector3(0, 0, targetCenter - item.centerZ);
    });
  }
  /* На desktop зазор чуть шире: каждая часть читается отдельно, но вся
     раскладка всё ещё остаётся единым прибором в пределах сцены About. */
  const desktopAssemblyTravel = layoutAlongOpticalAxis(0.84);
  /* Телефон не получает «игрушечную» версию прибора. Детали раскрываются
     заметно, но остаются в спокойном осевом коридоре самой сцены About. */
  const mobileAssemblyTravel = layoutAlongOpticalAxis(0.30);
  const tabletAssemblyTravel = layoutAlongOpticalAxis(0.52);
  /* Короткий landscape даёт достаточно ширины, но мало высоты: ход шире,
     чем на телефоне, и всё ещё спокойнее tablet-варианта. */
  const landscapeAssemblyTravel = layoutAlongOpticalAxis(0.42);
  const aboutAssemblyMotion = aboutAssemblyBounds.map((item, i) => ({
    node: item.node,
    travel: desktopAssemblyTravel[i],
    mobileTravel: mobileAssemblyTravel[i],
    tabletTravel: tabletAssemblyTravel[i],
    landscapeTravel: landscapeAssemblyTravel[i],
    /* Лёгкий поворот ловит свет на кромках, но не нарушает ровную ось. */
    turn: [-0.018, -0.010, 0, 0.010, 0.018][i],
    pitch: 0,
    yaw: 0
  }));

  /* Редкая контактная пыль не является вторым эффектом поверх страницы.
     Каждое облако — ребёнок настоящего механического модуля, поэтому оно
     наследует его реальную осевую раскладку и тем же scroll-driven путём
     возвращается назад. Это создаёт воздух у стыков, а не «магические» лучи. */
  const ABOUT_DUST_COUNT = coarse ? 24 : 104;
  const aboutDust = aboutAssemblyBounds.map((item, index) => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(ABOUT_DUST_COUNT * 3);
    const seeds = new Float32Array(ABOUT_DUST_COUNT);
    const sides = new Float32Array(ABOUT_DUST_COUNT);
    const sizes = new Float32Array(ABOUT_DUST_COUNT);
    const tints = new Float32Array(ABOUT_DUST_COUNT);
    const edgeDepth = Math.min(0.24, item.spanZ * 0.22);

    for (let p = 0; p < ABOUT_DUST_COUNT; p++) {
      const seed = Math.random();
      const side = Math.random() < 0.5 ? -1 : 1;
      const atJoint = Math.random() < 0.72;
      const z = atJoint
        ? (side < 0
          ? item.minZ + Math.random() * edgeDepth
          : item.maxZ - Math.random() * edgeDepth)
        : THREE.MathUtils.lerp(item.minZ + edgeDepth, item.maxZ - edgeDepth, Math.random());
      const angle = Math.random() * Math.PI * 2;
      const radius = item.radius * (1.015 + Math.pow(Math.random(), 1.8) * 0.13);
      positions[p * 3] = Math.cos(angle) * radius;
      positions[p * 3 + 1] = Math.sin(angle) * radius * 0.88;
      positions[p * 3 + 2] = z;
      seeds[p] = seed;
      sides[p] = side;
      sizes[p] = 0.56 + Math.pow(Math.random(), 2.1) * 1.18;
      tints[p] = Math.random();
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    geometry.setAttribute('aSide', new THREE.BufferAttribute(sides, 1));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aTint', new THREE.BufferAttribute(tints, 1));
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 12);

    const uniforms = {
      uDrive: { value: 0 },
      uPresence: { value: 0 },
      uPx: { value: 1 }
    };
    const points = new THREE.Points(geometry, new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.NormalBlending,
      vertexShader: `
        attribute float aSeed, aSide, aSize, aTint;
        uniform float uDrive, uPresence, uPx;
        varying float vAlpha; varying vec3 vColor;
        void main(){
          float d = smoothstep(0.035, 0.94, uDrive);
          float motion = 4.0 * d * (1.0 - d);
          vec3 pos = position;
          vec2 outward = normalize(pos.xy + vec2(0.0001));
          /* Облако раскрывается наружу только вместе со своим модулем.
             На пике пыль оседает тонким следом у кромки, а не продолжает
             бесконтрольно лететь по экрану. */
          pos.xy += outward * (0.045 + 0.240 * aSeed) * d;
          pos.z += aSide * (0.030 + 0.180 * aSeed) * d;

          vec4 mv = modelViewMatrix * vec4(pos, 1.0);
          float settle = smoothstep(0.05, 0.20, uDrive);
          vAlpha = uPresence * settle * (0.130 + 0.200 * aSeed)
            * (0.60 + 0.40 * motion);
          vAlpha *= mix(0.45, 1.0, clamp((13.0 + mv.z) / 11.0, 0.0, 1.0));
          vec3 neutral = vec3(0.84, 0.83, 0.93);
          vec3 cool = vec3(0.60, 0.78, 0.88);
          vec3 warm = vec3(0.82, 0.64, 0.80);
          vColor = mix(neutral, cool, smoothstep(0.48, 0.86, aTint));
          vColor = mix(vColor, warm, smoothstep(0.86, 1.0, aTint));
          float size = aSize * uPx * (19.0 / max(1.2, -mv.z));
          gl_PointSize = min(size * (1.0 + 0.68 * d), 6.0 * uPx);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        varying float vAlpha; varying vec3 vColor;
        void main(){
          float d = length(gl_PointCoord - 0.5) * 2.0;
          float a = pow(max(0.0, 1.0 - d), 2.5);
          gl_FragColor = vec4(vColor, a * vAlpha);
          #include <colorspace_fragment>
        }`
    }));
    /* Металл пишет глубину, поэтому пыль рисуется сразу после корпуса:
       точки с дальней стороны честно отсеиваются, а через стекло остаётся
       только лёгкий физический след, а не наложение поверх детали. */
    points.renderOrder = 1;
    points.frustumCulled = false;
    item.node.add(points);
    return { points, uniforms, index };
  });
  /* Первые пять подписей получают положение от центров настоящих подузлов.
     Шестая привязана к лицу передней короны, но всё ещё использует drive
     output — это не шестая движущаяся сборка. При реверсе она возвращается
     вместе с тем же реальным модулем. */
  const aboutLabelAnchors = aboutAssemblyBounds.map(item => {
    const anchor = new THREE.Object3D();
    anchor.position.set(0, 0, item.centerZ);
    item.node.add(anchor);
    return anchor;
  });
  aboutLabelAnchors.push(frontResultLabelAnchor);
  const aboutLabelDriveIndices = [
    ...ABOUT_ASSEMBLY_NAMES.map((_, index) => index),
    ABOUT_ASSEMBLY_NAMES.indexOf('output')
  ];

  /* --- точка фокуса: мягкое свечение там, где поток собирается --- */
  const flare = new THREE.Mesh(
    new THREE.PlaneGeometry(1.9, 1.9),
    new THREE.ShaderMaterial({
      uniforms: { uC: { value: new THREE.Color(0xbfe9ff) }, uA: { value: 1 } },
      transparent: true, depthWrite: false, depthTest: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `varying vec2 vUv;
        void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `varying vec2 vUv; uniform vec3 uC; uniform float uA;
        void main(){
          float d = length(vUv - 0.5) * 2.0;
          float a = pow(max(0.0, 1.0 - d), 3.4) * 0.55 + pow(max(0.0, 1.0 - d), 14.0) * 0.9;
          gl_FragColor = vec4(uC, a * uA);
          #include <colorspace_fragment>
        }`
    })
  );
  flare.position.z = 2.35;
  flare.frustumCulled = false;
  rig.add(flare);

  /* --- мягкая тень-подложка ---
     Прибор без неё висит в пустоте. Тёмное пятно за ним слегка гасит фон,
     объект отделяется от страницы и получает вес. */
  const halo = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 9),
    new THREE.ShaderMaterial({
      uniforms: { uA: { value: 1 } },
      transparent: true, depthWrite: false, depthTest: false,
      vertexShader: `varying vec2 vUv;
        void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `varying vec2 vUv; uniform float uA;
        void main(){
          float d = length(vUv - 0.5) * 2.0;
          float a = pow(max(0.0, 1.0 - d), 2.2);
          gl_FragColor = vec4(0.020, 0.015, 0.045, a * uA);
        }`
    })
  );
  halo.position.z = -1.2;
  halo.renderOrder = -1;
  halo.frustumCulled = false;
  rig.add(halo);

  /* HTML-слой About: подписи закреплены за пятью реальными
     инженерными узлами единственного rig. */
  const aboutHost = document.getElementById('aboutStage');
  const aboutSection = document.getElementById('about');
  const aboutSide = document.querySelector('.about__side');
  const aboutModuleLabels = aboutHost
    ? Array.from(aboutHost.querySelectorAll('.about__module-label')) : [];
  const aboutLabelPoint = new THREE.Vector3();
  const aboutLabelCache = [];
  const aboutAssemblyDrive = new Float32Array(ABOUT_ASSEMBLY_NAMES.length);


  /* ─────────── 3. поток: шум слева, собранный сигнал справа ─────────── */
  const P_COUNT = coarse ? 1800 : 5200;
  const pGeo = new THREE.BufferGeometry();
  {
    const pos = new Float32Array(P_COUNT * 3);            // не используется, но нужен атрибут
    const seed = new Float32Array(P_COUNT);
    const ang  = new Float32Array(P_COUNT);
    const rad  = new Float32Array(P_COUNT);
    const off  = new Float32Array(P_COUNT);
    const sz   = new Float32Array(P_COUNT);
    const bok  = new Float32Array(P_COUNT);   // расфокусированные кружки
    for (let i = 0; i < P_COUNT; i++) {
      bok[i] = Math.random() < 0.026 ? 1 : 0;
      seed[i] = Math.random();
      ang[i]  = Math.random() * Math.PI * 2;
      rad[i]  = 0.12 + Math.pow(Math.random(), 0.74) * 1.30;
      off[i]  = Math.random();
      // мелкой пыли много, крупных искр мало: так поток выглядит шелковистым
      sz[i]   = 0.34 + Math.pow(Math.random(), 2.4) * 1.75;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    pGeo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    pGeo.setAttribute('aAng',  new THREE.BufferAttribute(ang, 1));
    pGeo.setAttribute('aRad',  new THREE.BufferAttribute(rad, 1));
    pGeo.setAttribute('aOff',  new THREE.BufferAttribute(off, 1));
    pGeo.setAttribute('aSz',   new THREE.BufferAttribute(sz, 1));
    pGeo.setAttribute('aBok',  new THREE.BufferAttribute(bok, 1));
    pGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 24);
  }

  const pUni = {
    uT:      { value: 0 },
    uSpread: { value: 1 },
    uBright: { value: 1 },
    uScale:  { value: 1 },
    uPx:     { value: 1 }
  };

  const stream = new THREE.Points(pGeo, new THREE.ShaderMaterial({
    uniforms: pUni,
    transparent: true, depthWrite: false, depthTest: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute float aSeed, aAng, aRad, aOff, aSz, aBok;
      uniform float uT, uSpread, uBright, uScale, uPx;
      varying float vA; varying vec3 vC; varying float vB;

      void main(){
        float sp = 0.55 + aSeed * 0.85;
        float t  = fract(aOff + uT * 0.030 * sp);
        float z  = mix(-7.0, 6.0, t);
        float zf = 2.35;                                  // фокус

        float order = smoothstep(zf - 0.7, zf + 0.9, z);   // 0 до фокуса, 1 после

        float before = aRad * uSpread * (0.78 + 0.52 * (-z) / 7.0);
        /* После фокуса разлёт у всех почти одинаковый: если оставить его
           пропорциональным личному радиусу, вместо шести лучей получается
           веер. Небольшой разброс по aSeed нужен только чтобы луч не был
           линией в один пиксель. */
        float after  = aRad * uSpread * pow(max(0.0, 1.0 - z / zf), 1.5) + 0.030 * aRad
                     + (0.34 + 0.15 * aSeed) * max(0.0, z - zf);
        float r = mix(before, after, step(0.0, z));

        /* Закрутка ограничена по величине: раньше в ней был линейный член
           от времени, он уводил угол сколь угодно далеко. Из-за этого номер
           ближайшего луча со временем менялся, и частицы перескакивали
           с луча на луч — поток на выходе «сыпался». */
        float a = aAng + z * 0.085 + sin(uT * 0.11 + aSeed * 6.283) * 0.55;

        /* Луч выбирается от собственного угла частицы, а не от плывущего:
           за частицей закреплено одно направление на всё время жизни,
           и она приходит в него плавно, без скачков. */
        float step6 = 6.2831853 / 6.0;
        float aRay = floor(aAng / step6 + 0.5) * step6;
        a = mix(a, aRay, order);

        vec3 pos = vec3(cos(a) * r, sin(a) * r * 0.88, z);

        // турбулентность живёт только слева от прибора и там она сильная
        float noiseZone = smoothstep(0.6, -4.5, z);
        pos.xy += vec2(sin(uT * 0.27 + aSeed * 31.0) + sin(uT * 0.61 + aSeed * 77.0) * 0.45,
                       cos(uT * 0.23 + aSeed * 19.0) + cos(uT * 0.53 + aSeed * 59.0) * 0.45)
                  * 0.30 * noiseZone;

        float k  = smoothstep(-2.6, 2.0, z);
        vec3 col = mix(vec3(0.30, 0.25, 0.58), vec3(0.78, 0.95, 1.0), k);
        col = mix(col, vec3(1.0, 0.60, 0.90), smoothstep(2.6, 5.2, z) * 0.75);
        vC = col;

        float focus = exp(-pow((z - zf) * 1.35, 2.0));
        /* Вход и выход растянуты: частица разгорается на дальнем краю кадра
           и гаснет уже за его пределами, поэтому нигде не видно, как она
           появляется или пропадает. */
        float fade  = smoothstep(0.0, 0.22, t) * (1.0 - smoothstep(0.84, 1.0, t));
        // мягкое мерцание: у каждой частицы своя фаза, разброс небольшой
        float tw = 0.80 + 0.20 * sin(uT * 0.9 + aSeed * 84.0);
        vA = fade * (0.030 + 0.070 * aSeed) * (1.0 + 4.4 * focus) * uBright * tw
             * (1.0 + 0.9 * order)      // упорядоченные лучи держат яркость
             * (1.0 + 0.8 * noiseZone); // и шум на входе виден, иначе истории нет

        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        // дальняя пыль тусклее ближней — это и даёт ощущение глубины потока
        vA *= mix(0.35, 1.0, clamp((14.0 + mv.z) / 12.0, 0.0, 1.0));

        /* Боке. Небольшая часть пыли живёт как расфокусированные кружки:
           чем дальше частица от точки фокуса, тем крупнее и мягче её диск.
           Ровно так ведёт себя настоящая оптика, и именно это читается
           как «снято объективом», а не «нарисованы точки». */
        float blur = smoothstep(0.25, 3.2, abs(z - zf));
        vB = aBok * blur;
        float size = aSz * uScale * uPx * (1.0 + 0.8 * focus) * (34.0 / max(1.2, -mv.z));
        gl_PointSize = mix(min(size, 22.0 * uPx),
                           min(size * (2.2 + 3.0 * blur), 32.0 * uPx), vB);
        vA = mix(vA, vA * 0.24, vB);
        gl_Position  = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying float vA; varying vec3 vC; varying float vB;
      void main(){
        float d = length(gl_PointCoord - 0.5) * 2.0;
        // мягкое ядро плюс ореол: точка перестаёт быть «кружком»
        float dot_ = pow(max(0.0, 1.0 - d), 2.2) * 0.75 + pow(max(0.0, 1.0 - d), 8.0) * 0.55;
        // у боке ровная заливка и чуть более яркая кромка — как у реального кружка нерезкости
        float bok = smoothstep(1.0, 0.88, d) * (0.42 + 0.58 * smoothstep(0.62, 0.97, d));
        float a = mix(dot_, bok, vB);
        gl_FragColor = vec4(vC, a * vA);
        #include <colorspace_fragment>
      }`
  }));
  stream.frustumCulled = false;
  stream.renderOrder = 1;
  rig.add(stream);

  /* ─────────── 4. звёзды: очень редкие, только атмосфера ─────────── */
  const S_COUNT = coarse ? 220 : 430;
  const sGeo = new THREE.BufferGeometry();
  {
    const p = new Float32Array(S_COUNT * 3), s = new Float32Array(S_COUNT);
    for (let i = 0; i < S_COUNT; i++) {
      const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
      const R = 26 + Math.random() * 22;
      p[i * 3]     = Math.sin(ph) * Math.cos(th) * R;
      p[i * 3 + 1] = Math.cos(ph) * R * 0.7;
      p[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * R - 8;
      s[i] = 0.5 + Math.random() * 1.6;
    }
    sGeo.setAttribute('position', new THREE.BufferAttribute(p, 3));
    sGeo.setAttribute('aSz', new THREE.BufferAttribute(s, 1));
  }
  const stUni = { uT: { value: 0 }, uPx: { value: 1 }, uA: { value: 1 } };
  const stars = new THREE.Points(sGeo, new THREE.ShaderMaterial({
    uniforms: stUni, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute float aSz; uniform float uT, uPx; varying float vTw;
      void main(){
        vTw = 0.55 + 0.45 * sin(uT * 0.55 + aSz * 42.0);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSz * uPx * (80.0 / max(1.0, -mv.z));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform float uA; varying float vTw;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.05, d);
        gl_FragColor = vec4(vec3(0.82, 0.80, 1.0), a * vTw * 0.42 * uA);
        #include <colorspace_fragment>
      }`
  }));
  stars.frustumCulled = false;
  scene.add(stars);

  /* ─────────── 5. хореография по прокрутке ───────────
     Ключевые кадры расставлены по доле прокрутки страницы. Между ними
     плавная интерполяция, поэтому объектив живёт непрерывно и нигде
     не перепрыгивает. */
  /* Каждый кадр привязан к своей секции страницы. Поле e — сглаживание
     отрезка, который с этого кадра начинается: 'soft' мягко трогается
     и мягко тормозит, 'in' разгоняется (для влёта), 'out' тормозит
     (для выхода), 'smooth' — ровный ход по умолчанию. */
  const KEYS = [
    /* первый экран: прибор целиком, три четверти спереди-справа */
    { t: 0.000, sec: 'hero', p: 0.5000, cz: 7.2, cy:  0.00, x:  2.02, y: -0.04, z: -0.2, rx: -0.20, ry:  0.88, s: 0.46, sp: 1.00, br: 1.00, op: 1.00, ro:  0.000 },
    /* About — вход начинается до якоря секции: при прямом переходе #about
       объектив уже собран под заголовком, а не вылетает из левого края. */
    { t: 0.106, sec: 'about', aboutSlot: 0, p:-0.0800, cz: 7.5, cy:  0.08, x: -1.10, y: -1.04, z:  0.10, rx: -0.07, ry:  0.76, s: 0.31, sp: 0.78, br: 0.52, op: 0.76, ro: -0.010 },
    /* Якорная посадка удерживает цельный прибор под H2. Поэтому прямой
       переход к #about не может попасть в фазу крупного раскрытия поверх
       заголовка или текста справа. Нулевая производная в этой точке делает
       последующий подъём к центру мягким в обоих направлениях scroll. */
    { t: 0.112, sec: 'about', p: 0.1900, cz: 7.5, cy:  0.08, x: -1.10, y: -1.04, z:  0.10, rx: -0.07, ry:  0.76, s: 0.31, sp: 0.78, br: 0.52, op: 0.76, ro: -0.010 },
    /* Раскрытие начинается только после посадки: объект успевает пройти
       свободную нижнюю зону и затем оказывается на центральной оси сцены.
       Разлёт деталей остаётся симметричным относительно подписей. */
    { t: 0.120, sec: 'about', aboutSlot: 1, p: 0.3900, cz: 7.5, cy:  0.08, x: -0.92, y:  0.24, z: -0.05, rx: -0.07, ry:  0.76, s: 0.58, sp: 0.84, br: 0.52, op: 0.76, ro: -0.010 },
    /* Неподвижная центральная опора. Она даёт сцене время раскрыться и
       гарантирует мягкий старт ухода: PCHIP покидает эту точку с нулевой
       скоростью, но далее проходит K2 без искусственной остановки. */
    { t: 0.124, sec: 'about', aboutBeat: 'centerHold', p: 0.6500, cz: 7.5, cy:  0.08, x: -0.92, y:  0.24, z: -0.05, rx: -0.07, ry:  0.76, s: 0.58, sp: 0.84, br: 0.52, op: 0.76, ro: -0.010 },
    /* Пока пять узлов садятся обратно, сам прибор почти неподвижен: это
       даёт глазу время увидеть именно механическую сборку, без одновременного
       зума и резкого уноса вправо. */
    { t: 0.127, sec: 'about', aboutSlot: 2, p: 0.9100, cz: 7.5, cy: 0.07, x: -1.44, y: -0.44, z: -0.08, rx:-0.075, ry: 0.78, s: 0.56, sp: 0.86, br: 0.51, op: 0.72, ro: -0.009 },
    /* После точной сборки объект медленно сжимается и дрейфует по одной
       диагонали. К моменту Figures он уже достаточно мал и правее метрик —
       никакого броска за край и никакого прохода через текст. */
    { t: 0.129, sec: 'about', p: 0.9250, cz: 7.51, cy:  0.06, x: -1.28, y: -0.64, z: -0.11, rx: -0.08, ry: 0.80, s: 0.545, sp: 0.88, br: 0.50, op: 0.67, ro: -0.008 },
    { t: 0.130, sec: 'about', p: 0.9400, cz: 7.53, cy:  0.04, x: -1.02, y: -0.67, z: -0.16, rx: -0.09, ry: 0.83, s: 0.515, sp: 0.91, br: 0.49, op: 0.60, ro: -0.007 },
    { t: 0.131, sec: 'about', p: 0.9550, cz: 7.55, cy:  0.02, x: -0.72, y: -0.71, z: -0.22, rx: -0.10, ry: 0.86, s: 0.475, sp: 0.94, br: 0.47, op: 0.51, ro: -0.006 },
    { t: 0.132, sec: 'about', p: 0.9700, cz: 7.58, cy:  0.00, x: -0.38, y: -0.76, z: -0.30, rx: -0.12, ry: 0.89, s: 0.425, sp: 0.97, br: 0.45, op: 0.41, ro: -0.005 },
    { t: 0.133, sec: 'about', aboutSlot: 3, p: 0.9820, cz: 7.60, cy: -0.01, x:  0.13, y: -0.81, z: -0.37, rx: -0.13, ry: 0.92, s: 0.390, sp: 0.99, br: 0.44, op: 0.34, ro: -0.004 },
    { t: 0.135, sec: 'about', p: 0.9910, cz: 7.62, cy: -0.03, x:  0.63, y: -0.88, z: -0.46, rx: -0.14, ry: 0.96, s: 0.345, sp: 1.02, br: 0.43, op: 0.25, ro: -0.003 },
    { t: 0.136, sec: 'about', p: 0.9980, cz: 7.64, cy: -0.05, x:  1.23, y: -0.96, z: -0.56, rx: -0.16, ry: 1.00, s: 0.300, sp: 1.04, br: 0.42, op: 0.17, ro: -0.002 },
    /* В Figures прибор остаётся фоновым: плавно уменьшается и уходит
       вправо-вниз, тогда как сами метрики сохраняют полный приоритет. */
    { t: 0.145, sec: 'figures', p: 0.0200, cz: 7.67, cy: -0.07, x:  1.83, y: -1.12, z: -0.68, rx: -0.17, ry: 1.05, s: 0.255, sp: 1.07, br: 0.41, op: 0.10, ro: -0.001 },
    { t: 0.149, sec: 'figures', p: 0.1000, cz: 7.73, cy: -0.10, x:  2.38, y: -1.44, z: -0.90, rx: -0.19, ry: 1.12, s: 0.205, sp: 1.12, br: 0.40, op: 0.05, ro:  0.001 },
    { t: 0.152, sec: 'figures', p: 0.1800, cz: 7.79, cy: -0.13, x:  2.88, y: -1.78, z: -1.12, rx: -0.21, ry: 1.19, s: 0.165, sp: 1.17, br: 0.39, op: 0.018, ro:  0.003 },
    { t: 0.153, sec: 'figures', p: 0.2500, cz: 7.84, cy: -0.16, x:  3.30, y: -2.10, z: -1.32, rx: -0.23, ry: 1.25, s: 0.140, sp: 1.22, br: 0.38, op: 0.00, ro:  0.004 },
    /* цифры: продолжает диагональ вниз, а не возвращается наверх сразу
       после сборки. */
    { t: 0.165, sec: 'figures', p: 0.5287, cz: 7.86, cy: -0.12, x:  4.20, y: -2.00, z: -1.52, rx: -0.22, ry:  1.40, s: 0.25, sp: 1.23, br: 0.40, op: 0.00, ro:  0.000 },
    /* с кем работаем: поворачивается к зрителю передом, начинается сближение */
    { t: 0.226, sec: 'audience', p: 0.3684, cz: 6.6, cy: -0.02, x:  3.30, y: -0.08, z:  0.2, rx:  0.06, ry:  0.72, s: 0.36, sp: 1.30, br: 0.46, op: 0.42, ro:  0.016 },
    /* Услуги: макро на кольце фокуса у правого края, видно накатку и шкалу.
       Секция закреплена под колоду и занимает около 40% всей прокрутки, поэтому
       кадров здесь три, а не один: с одним прибор на все пять экранов листания
       практически замирал. Кольцо медленно проворачивается, пока идут карточки. */
    /* Средний кадр — исходная поза, она уже была принята заказчиком. Крайние
       только доворачивают прибор вокруг неё: размер и яркость держатся на том
       же уровне, потому что справа лежит список услуг, а секция теперь идёт
       пять экранов, и любой прирост тут же съедает его строки. */
    { t: 0.300, sec: 'services', p: 0.1200, cz: 5.2, cy:  0.00, x:  2.98, y:  0.06, z:  1.2, rx: -0.12, ry:  0.56, s: 0.68, sp: 1.30, br: 0.44, op: 0.25, ro:  0.020 },
    { t: 0.332, sec: 'services', p: 0.4032, cz: 5.0, cy:  0.00, x:  2.95, y:  0.10, z:  1.4, rx: -0.10, ry:  0.44, s: 0.72, sp: 1.30, br: 0.46, op: 0.26, ro:  0.026 },
    { t: 0.380, sec: 'services', p: 0.7300, cz: 5.0, cy:  0.02, x:  3.02, y:  0.14, z:  1.5, rx: -0.08, ry:  0.32, s: 0.72, sp: 1.30, br: 0.46, op: 0.26, ro:  0.032 },
    /* клиенты: отходит к правому полю и затихает — стена имён должна читаться */
    { t: 0.436, sec: 'clients', p: 0.5570, cz: 5.6, cy:  0.02, x:  3.30, y:  0.26, z:  0.3, rx: -0.12, ry:  0.62, s: 0.40, sp: 1.30, br: 0.36, op: 0.22, ro:  0.012 },
    /* граница клиентов и кейсов: разгон к диафрагме, она растёт в кадре */
    { t: 0.482, sec: 'cases', p: 0.1058, cz: 4.8, cy:  0.00, x:  1.00, y:  0.00, z:  2.35, rx: -0.02, ry:  0.16, s: 0.80, sp: 1.10, br: 0.58, op: 0.26, ro:  0.048 },
    /* кейсы: мы внутри тубуса, кольца оправ идут тоннелем по краям кадра */
    { t: 0.548, sec: 'cases', p: 0.6200, cz: 4.0, cy:  0.00, x:  0.00, y:  0.00, z:  1.55, rx:  0.02, ry:  0.02, s: 1.32, sp: 1.00, br: 0.30, op: 0.32, ro: -0.058 },
    /* Фаундер и команда — редакционные портретные блоки. Здесь 3D остаётся
       только едва заметной атмосферой за левым полем: ни линии, ни стекло
       не проходят через лицо, имя или описание. На compact-экране она
       выключается полностью в resolveKeys. */
    { t: 0.647, sec: 'founder', p: 0.3825, cz: 6.8, cy:  0.10, x: -5.35, y:  1.00, z: -4.2, rx:  0.24, ry: -1.35, s: 0.20, sp: 1.30, br: 0.26, op: 0.06, portraitOp: 0.06, ro:  0.020 },
    { t: 0.777, sec: 'team', p: 0.5259, cz: 7.8, cy: -0.02, x: -5.85, y: -1.25, z: -4.8, rx: -0.34, ry: -2.40, s: 0.16, sp: 1.45, br: 0.22, op: 0.035, portraitOp: 0.035, ro:  0.000 },
    /* партнёры: ныряет вниз за кадр */
    { t: 0.855, sec: 'partners', p: 0.4740, cz: 7.6, cy:  0.00, x: -1.20, y: -3.70, z: -4.0, rx: -0.50, ry: -3.10, s: 0.32, sp: 1.50, br: 0.18, op: 0.08, ro:  0.000 },
    /* форма: возвращается за стеклянную панель, передом к зрителю */
    { t: 0.930, sec: 'contact', p: 0.4087, cz: 6.8, cy:  0.00, x:  1.72, y: -0.10, z: -0.4, rx: -0.16, ry: -0.34, s: 0.45, sp: 0.90, br: 0.95, op: 0.86, ro:  0.000 },
    /* подвал: уходит вверх */
    { t: 1.000, sec: 'footer', p: 0.2321, cz: 7.6, cy:  0.24, x:  0.62, y:  1.05, z: -2.6, rx: -0.26, ry: -0.18, s: 0.34, sp: 1.00, br: 0.58, op: 0.40, ro:  0.000 }
  ];
  /* resolveKeys восстанавливает значения при resize: после просмотра mobile
     desktop-координаты не должны оставаться сжатыми и наоборот. */
  const ABOUT_DESKTOP_POSES = [
    /* Входная поза нужна только для обычной прокрутки: она лежит до якоря
       #about, поэтому по ссылке сразу видна собранная модель под H2. */
    { cz:7.5, cy: .08, x:-1.10, y:-1.04, z: .10, rx:-.07, ry:.76, s:.31, sp:.78, br:.52, op:.76, ro:-.010 },
    { cz:7.5, cy: .08, x:-.92, y: .24, z:-.05, rx:-.07, ry:.76, s:.58, sp:.84, br:.52, op:.76, ro:-.010 },
    { cz:7.5, cy:.07, x:-1.44, y:-.44, z:-.08, rx:-.075, ry:.78, s:.56, sp:.86, br:.51, op:.72, ro:-.009 },
    { cz:7.60, cy:-.01, x:.13, y:-.81, z:-.37, rx:-.13, ry:.92, s:.39, sp:.99, br:.44, op:.34, ro:-.004 }
  ];
  /* Отдельная мобильная постановка. Координаты ведут модель ровно через
     прямоугольник #aboutStage: она приходит снизу-слева, раскрывается по
     центру, собирается и спокойно уходит до начала основного текста. */
  const ABOUT_COMPACT_POSES = [
    { cz:7.3, cy: .08, x:-2.10, y: .12, z: .10, rx:-.07, ry:.76, s:.36, sp:.78, br:.52, op:.76, ro:-.010 },
    { cz:7.4, cy: .08, x:-0.20, y:2.10, z:-.03, rx:-.07, ry:.77, s:.52, sp:.82, br:.52, op:.76, ro:-.009 },
    { cz:7.5, cy: .06, x:-0.08, y:2.80, z:-.08, rx:-.075,ry:.79, s:.46, sp:.86, br:.50, op:.70, ro:-.008 },
    { cz:7.6, cy: .02, x: 1.10, y:3.20, z:-.32, rx:-.12, ry:.90, s:.28, sp:.98, br:.42, op:.22, ro:-.004 }
  ];
  const FIELDS = ['cz', 'cy', 'x', 'y', 'z', 'rx', 'ry', 's', 'sp', 'br', 'op', 'ro'];
  /* ResolveKeys меняет p/pose мобильных ключей на лету. Храним неизменную
     desktop-копию, чтобы поворот устройства или resize возвращал точную
     исходную траекторию, а не оставлял в PCHIP сжатые phone-координаты. */
  const ABOUT_KEY_BLUEPRINT = KEYS.filter(k => k.sec === 'about').map(k => {
    const blueprint = { p: k.p };
    for (const field of FIELDS) blueprint[field] = k[field];
    return blueprint;
  });

  /* Монотонный кубический сплайн (PCHIP) вместо покадрового сглаживания.
     Кусочные кривые давали разрыв скорости на стыках: отрезок заканчивался
     разгоном, а следующий начинался с нуля, и в этом месте движение
     спотыкалось. Сплайн непрерывен по скорости во всех кадрах сразу,
     а монотонность гарантирует, что кривая не выскочит за значения
     соседних кадров (важно для прозрачности и масштаба). */
  /* Поле t — доля ОБЩЕЙ прокрутки, и она едет, стоит любой секции изменить
     высоту (закреплённая колода услуг добавляет несколько экранов). Поэтому
     каждый кадр дополнительно привязан к своей секции: sec — её id, p — доля
     высоты секции, на которой кадр стоит. Значения sec/p сняты с исходной
     вёрстки, так что картинка осталась ровно та же, но теперь она держится
     за секции, а не за суммарную длину страницы. */
  function resolveKeys() {
    const max = document.documentElement.scrollHeight - innerHeight;
    if (max <= 0) return;
    /* Порог совпадает с CSS-разметкой. Иначе телефон в landscape случайно
       попадал в desktop-сцену: 3D шёл через текст, а подписи уже были скрыты. */
    const compactAbout = innerWidth <= 900;
    /* На mobile всё действие происходит в экранной зоне сцены до начала
       copy; на desktop остаётся длинная режиссура с отдельной паузой. */
    const aboutKeyP = compactAbout ? [0.07, 0.22, 0.40, 0.54] : [-0.08, 0.39, 0.91, 0.982];
    const aboutPoses = compactAbout ? ABOUT_COMPACT_POSES : ABOUT_DESKTOP_POSES;
    /* Сначала всегда возвращаем полный desktop-маршрут: этот вызов идёт и
       при смене ориентации, когда прежняя compact-версия уже успела
       переписать промежуточные exit-ключи. */
    KEYS.filter(k => k.sec === 'about').forEach((k, index) => {
      const blueprint = ABOUT_KEY_BLUEPRINT[index];
      if (!blueprint) return;
      k.p = blueprint.p;
      for (const field of FIELDS) k[field] = blueprint[field];
    });
    for (const k of KEYS) {
      if (k.aboutSlot == null) continue;
      k.p = aboutKeyP[k.aboutSlot];
      Object.assign(k, aboutPoses[k.aboutSlot]);
    }
    if (compactAbout) {
      /* Между основными ключами desktop есть несколько очень плотных
         выходных кадров. На телефоне они раньше оставались с desktop p,
         ломали порядок PCHIP и тянули модель через copy. Собираем их в одну
         короткую, строго возрастающую траекторию внутри #aboutStage. */
      const compactKeys = KEYS.filter(k => k.sec === 'about');
      const compactP = [0.07, 0.22, 0.30, 0.40, 0.43, 0.46, 0.49, 0.52, 0.54, 0.56, 0.58];
      const lerpPose = (a, b, t) => {
        const pose = {};
        for (const field of FIELDS) pose[field] = THREE.MathUtils.lerp(a[field], b[field], t);
        return pose;
      };
      compactKeys.forEach((k, index) => {
        const pose = index === 0 ? ABOUT_COMPACT_POSES[0]
          : index === 1 || index === 2 ? ABOUT_COMPACT_POSES[1]
          : index === 3 ? ABOUT_COMPACT_POSES[2]
          : index >= 4 && index <= 7
            ? lerpPose(ABOUT_COMPACT_POSES[2], ABOUT_COMPACT_POSES[3], (index - 3) / 5)
            : ABOUT_COMPACT_POSES[3];
        k.p = compactP[index] || compactP[compactP.length - 1];
        for (const field of FIELDS) k[field] = pose[field];
      });
    }
    /* На портретных блоках в вертикальном режиме нет свободного поля рядом
       с copy, поэтому прибор не уменьшается до полупрозрачного шума, а
       скрывается полностью. При возврате на desktop берём исходную тихую
       атмосферную прозрачность из отдельного поля, без накопления мутаций
       после resize. */
    for (const k of KEYS) {
      if (k.portraitOp != null) k.op = compactAbout ? 0 : k.portraitOp;
    }
    let prev = 0;
    for (let i = 0; i < KEYS.length; i++) {
      const k = KEYS[i];
      const el = document.getElementById(k.sec)
              || (k.sec === 'footer' ? document.querySelector('footer') : null);
      if (!el) continue;
      let top = 0;
      for (let nd = el; nd; nd = nd.offsetParent) top += nd.offsetTop;
      let t = (top + k.p * el.offsetHeight - innerHeight / 2) / max;
      if (i === 0) t = 0;
      else if (i === KEYS.length - 1) t = 1;
      // кадры обязаны идти строго по возрастанию, иначе сплайн разваливается
      k.t = Math.min(1, Math.max(i === 0 ? 0 : prev + 1e-4, t));
      prev = k.t;
    }
    const about = document.getElementById('about');
    if (about) {
      let top = 0;
      for (let nd = about; nd; nd = nd.offsetParent) top += nd.offsetTop;
      /* Вход начинается ещё на выходе из Hero, а финальный кадр держится
         до нижней границы About — у зрителя есть время увидеть результат
         до того, как основной прибор уйдёт к следующей секции. */
      aboutStart = Math.max(0, (top - innerHeight * 0.55) / max);
      aboutEnd = Math.min(1, (top + about.offsetHeight - innerHeight * 0.18) / max);
      if (aboutEnd <= aboutStart + 0.04) aboutEnd = Math.min(1, aboutStart + 0.04);
      /* Внутренний процент секции и реальный процент 3D-сцены различаются:
         анимация начинается ещё до верхней границы About. Сохраняем точки
         маршрута в координатах самой сцены, чтобы сборка точно закончилась
         в центре в тот же момент, когда общий маршрут туда приходит. */
      const aboutRange = Math.max(1e-5, aboutEnd - aboutStart);
      const resolvedBeats = aboutBeats.slice();
      const resolvedNamedBeats = { ...aboutNamedBeats };
      for (const k of KEYS) {
        const beat = Math.min(1, Math.max(0, (k.t - aboutStart) / aboutRange));
        if (k.aboutSlot != null) resolvedBeats[k.aboutSlot] = beat;
        if (k.aboutBeat) resolvedNamedBeats[k.aboutBeat] = beat;
      }
      aboutBeats = resolvedBeats;
      aboutNamedBeats = resolvedNamedBeats;
    }
    buildSlopes();
  }

  const SLOPE = {};
  function buildSlopes() {
    const n = KEYS.length;
    for (const f of FIELDS) {
      const d = new Array(n - 1), m = new Array(n);
      for (let i = 0; i < n - 1; i++) d[i] = (KEYS[i + 1][f] - KEYS[i][f]) / (KEYS[i + 1].t - KEYS[i].t);
      m[0] = d[0];
      m[n - 1] = d[n - 2];
      for (let i = 1; i < n - 1; i++) {
        if (d[i - 1] * d[i] <= 0) { m[i] = 0; continue; }
        const h0 = KEYS[i].t - KEYS[i - 1].t, h1 = KEYS[i + 1].t - KEYS[i].t;
        const w1 = 2 * h1 + h0, w2 = h1 + 2 * h0;
        m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
      }
      SLOPE[f] = m;
    }
  }
  buildSlopes();

  const K = {};
  function sampleKeys(t) {
    let i = 0;
    while (i < KEYS.length - 2 && t > KEYS[i + 1].t) i++;
    const a = KEYS[i], b = KEYS[i + 1], h = b.t - a.t;
    let u = (t - a.t) / h;
    u = Math.min(1, Math.max(0, u));
    const u2 = u * u, u3 = u2 * u;
    const h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u;
    const h01 = -2 * u3 + 3 * u2,    h11 = u3 - u2;
    for (const f of FIELDS) {
      K[f] = h00 * a[f] + h10 * h * SLOPE[f][i] + h01 * b[f] + h11 * h * SLOPE[f][i + 1];
    }
  }

  /* ─────────── 6. цикл ─────────── */
  let W = 0, H = 0, dpr = 1, xk = 1, yk = 0, sk = 1, ok = 1;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const cur = { x: 0, y: 0, z: 0, rx: 0, ry: 0, s: 1, cz: 7.2, cy: 0, ro: 0 };
  let scrollT = 0, scrollS = 0, scrollPrev = 0, scrollV = 0, started = false;
  let aboutStart = 0, aboutEnd = 0;
  /* Значения заменяются resolveKeys после расчёта фактической высоты About. */
  let aboutBeats = [0.19, 0.75, 0.82, 0.84];
  let aboutNamedBeats = { centerHold: 0.65 };
  /* Вступительная строка принадлежит только первому подлёту. После начала
     раскрытия она тихо уходит и не возвращается во время обратной сборки. */
  let aboutFlowIntroConsumed = false;
  let tuneAcc = 0, tuneN = 0;

  /* Критически задемпфированная пружина: доводит значение до цели без перелёта
     и без рывков, независимо от частоты кадров. smooth — время «доводки» в секундах. */
  const vel = {};
  function damp(current, target, key, smooth, dt) {
    const omega = 2 / smooth;
    const x = omega * dt;
    const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
    const change = current - target;
    const v = vel[key] || 0;
    const temp = (v + omega * change) * dt;
    vel[key] = (v - omega * temp) * exp;
    return target + (change + temp) * exp;
  }

  function easeRange(value, from, to) {
    const p = Math.min(1, Math.max(0, (value - from) / Math.max(1e-5, to - from)));
    return p * p * (3 - 2 * p);
  }

  /* У механической сцены свой, более мягкий профиль. У quintic smootherstep
     нулевая не только скорость, но и ускорение на границах диапазона: детали
     не стартуют/тормозят рывком, даже если скролл идёт мелкими шагами. */
  function easeAbout(value, from, to) {
    const p = Math.min(1, Math.max(0, (value - from) / Math.max(1e-5, to - from)));
    return p * p * p * (p * (p * 6 - 15) + 10);
  }

  /* HTML остаётся доступным и переводимым, а связь с WebGL получается
     геометрической: у каждого имени свой проецируемый якорь внутри узла.
     Пишем только transform и только при реальном изменении значения: это
     сохраняет плавность тяжёлой 3D-сборки без принудительного layout на RAF. */
  function updateAboutModuleLabels(drives, compact, visibility, settled, railMix) {
    if (!aboutHost || !aboutModuleLabels.length) return;
    const rect = aboutHost.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2 || rect.bottom <= 0 || rect.top >= H) return;

    rig.updateMatrixWorld(true);
    camera.updateMatrixWorld();
    /* Держим расчётную ширину в точности в границах CSS clamp: иначе на
       узком desktop JS оставлял 52px от центра, а реальная подпись была
       шириной 124px и могла на несколько пикселей выйти за viewport. */
    const labelWidth = compact ? 76 : Math.min(150, Math.max(124, W * 0.10));
    const halfLabel = labelWidth * 0.5;
    /* Сцена обычно имеет безопасные боковые поля, но на границе desktop
       sticky-контейнер может оказаться чуть шире viewport. Ограничиваем
       координаты также экраном: подписи не обрезаются, а их пиковой ряд
       всё ещё строится между теми же физическими крайними якорями. */
    const minPosition = Math.max(halfLabel, halfLabel - rect.left);
    const maxPosition = Math.min(rect.width - halfLabel, W - halfLabel - rect.left);
    /* Шаг рассчитывается по той же безопасной полосе, что и крайние точки.
       Тогда компенсация правого overflow не может вытолкнуть первую подпись
       за левый край (и наоборот) на узком desktop. */
    const minGap = compact ? 54 : Math.min(154, Math.max(0,
      (maxPosition - minPosition) / Math.max(1, aboutModuleLabels.length - 1)
    ));
    const positions = [];
    for (let i = 0; i < aboutModuleLabels.length; i++) {
      aboutLabelAnchors[i].getWorldPosition(aboutLabelPoint);
      aboutLabelPoint.project(camera);
      const screenX = (aboutLabelPoint.x * 0.5 + 0.5) * W;
      const desired = Math.max(minPosition, Math.min(maxPosition, screenX - rect.left));
      positions.push(i ? Math.max(desired, positions[i - 1] + minGap) : desired);
    }
    const overflow = positions[positions.length - 1] - maxPosition;
    if (overflow > 0) {
      for (let i = 0; i < positions.length; i++) positions[i] -= overflow;
    }
    const underflow = minPosition - positions[0];
    if (underflow > 0) {
      for (let i = 0; i < positions.length; i++) positions[i] += underflow;
    }
    /* На пике раскрытия все шесть подписей образуют ровный ряд. Крайние
       точки остаются честными 3D-якорями: слева — входной модуль, справа —
       центр передней короны. Поэтому «Результат» не превращается в HUD и не
       отрывается от output, а большое пустое расстояние перед ним исчезает.
       До и после пика каждая подпись возвращается к своему якорю тем же
       scroll-driven профилем, без таймера и без разрыва при реверсе. */
    if (!compact && positions.length > 2 && railMix > 0) {
      const first = positions[0];
      const last = positions.length - 1;
      const railStep = (positions[last] - first) / last;
      for (let i = 1; i < last; i++) {
        const evenPosition = first + railStep * i;
        positions[i] = THREE.MathUtils.lerp(positions[i], evenPosition, railMix);
      }
    }
    for (let i = 0; i < aboutModuleLabels.length; i++) {
      const label = aboutModuleLabels[i];
      /* На раскрытии имена появляются вслед за своими узлами. После того как
         вся система открылась, они уходят одним спокойным аккордом — передняя
         часть не исчезает раньше остальных и не ломает чтение сборки. */
      /* Подпись следует за своим узлом и на раскрытии, и на обратной сборке.
         Раньше settled принудительно удерживал весь ряд видимым даже после
         того, как соответствующая деталь уже вернулась в корпус. */
      const moduleReveal = easeRange(drives[aboutLabelDriveIndices[i]] || 0, 0.38, 0.88);
      const reveal = Math.max(0, visibility) * moduleReveal;
      const localX = Math.round((positions[i] - rect.width * 0.5) * 10) / 10;
      const opacity = Math.round(reveal * 1000) / 1000;
      const offset = Math.round((1 - reveal) * 60) / 10;
      const cached = aboutLabelCache[i] || (aboutLabelCache[i] = {});
      if (cached.x !== localX) label.style.setProperty('--module-x', `${localX}px`);
      if (cached.opacity !== opacity) label.style.setProperty('--module-opacity', `${opacity}`);
      if (cached.offset !== offset) label.style.setProperty('--module-offset', `${offset}px`);
      cached.x = localX;
      cached.opacity = opacity;
      cached.offset = offset;
    }
  }

  function applyDpr() {
    dpr = Math.min(devicePixelRatio || 1, dprCap);
    renderer.setPixelRatio(dpr);
    renderer.setSize(W, H, false);
    pUni.uPx.value = dpr * (coarse ? 0.85 : 1);
    for (const dust of aboutDust) dust.uniforms.uPx.value = dpr * (coarse ? 0.80 : 1);
    stUni.uPx.value = dpr;
  }

  /* При раскрытии гармошки браузер пересчитывает четыре текстовые колонки.
     На этот короткий отрезок 3D-сцена рисуется с чуть меньшей плотностью,
     а затем возвращается к автоматически подобранному качеству. */
  function syncDprCap() {
    /* Нельзя менять render buffer прямо в видимом полёте: даже один resize
       воспринимается как подёргивание стекла. Автонастройка применится между
       сценами, а не в момент раскрытия или интерактивной гармошки. */
    const next = dprAutoCap;
    if (next === dprCap) return;
    dprCap = next;
    applyDpr();
  }
  window.__vakAudienceMotion = function (active) {
    if (audienceInMotion === active) return;
    audienceInMotion = active;
    tuneAcc = 0; tuneN = 0;
    syncDprCap();
  };
  function setAboutPerformance(active) {
    if (aboutInMotion === active) return;
    aboutInMotion = active;
    tuneAcc = 0; tuneN = 0;
    /* Число частиц и DPR здесь намеренно не меняются: quality pop заметнее,
       чем небольшая экономия GPU. Плотность задана один раз при запуске. */
  }

  function resize() {
    W = innerWidth; H = innerHeight;
    applyDpr();
    camera.aspect = W / H;
    camera.fov = W / H < 0.85 ? 44 : 34;         // на вертикальных экранах шире
    camera.updateProjectionMatrix();
    xk = Math.min(1, Math.max(0.24, (W / H) / 1.65));
    // на вертикальных экранах прибор уходит ниже текста и уменьшается
    const portrait = W / H < 0.85;
    yk = portrait ? -1.78 : 0;
    sk = portrait ? 0.64 : 1;
    ok = portrait ? 0.78 : 1;
    /* WebGL живёт в глобальном canvas, а подписи — в левой grid-колонке.
       На desktop сдвигаем только их host в координаты viewport: тогда
       реальные проецируемые X-якоря не съезжают влево и не обрезаются. */
    if (aboutHost && aboutSide) {
      if (W <= 900) aboutHost.style.removeProperty('--about-stage-center');
      else {
        const sideRect = aboutSide.getBoundingClientRect();
        aboutHost.style.setProperty('--about-stage-center', `${Math.round(W * 0.5 - sideRect.left)}px`);
      }
    }
  }

  function readScroll() {
    const max = document.documentElement.scrollHeight - innerHeight;
    scrollT = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
  }

  addEventListener('resize', () => { resize(); resolveKeys(); readScroll(); }, { passive: true });
  addEventListener('scroll', readScroll, { passive: true });
  /* Колода услуг задаёт свою высоту уже после разбора вёрстки, поэтому она
     дёргает пересчёт сама — иначе кадры считались бы по старой длине. */
  window.__vakRelayout = () => { resolveKeys(); readScroll(); };
  if (!coarse) addEventListener('pointermove', e => {
    pointer.tx = (e.clientX / innerWidth - 0.5) * 2;
    pointer.ty = (e.clientY / innerHeight - 0.5) * 2;
  }, { passive: true });

  resize(); resolveKeys(); readScroll();
  /* При открытии ссылки с якорем или после восстановления scroll-позиции
     первое изображение должно соответствовать странице сразу, без длинного
     пролёта от нулевой точки. */
  scrollS = scrollT;
  scrollPrev = scrollT;

  const clock = new THREE.Clock();
  let time = 0, paused = false;
  document.addEventListener('visibilitychange', () => { paused = document.hidden; });

  function frame() {
    requestAnimationFrame(frame);
    if (paused) return;
    step();
  }
  function step(dtForce) {
    const dt = dtForce !== undefined ? dtForce : Math.min(0.05, clock.getDelta());
    if (!reduced) time += dt;

    /* Автоподстройка разрешения. Раз в полсекунды смотрим на средний шаг
       кадра: не укладываемся в бюджет — снижаем плотность пикселей, есть
       запас — возвращаем. Дешевле любого другого рычага, потому что цена
       кадра здесь почти целиком заливка. */
    if (dtForce === undefined && !aboutInMotion) {
      tuneAcc += dt; tuneN++;
      if (tuneN >= 30) {
        const avg = tuneAcc / tuneN;
        tuneAcc = 0; tuneN = 0;
        if (avg > 0.0225 && dprAutoCap > DPR_MIN) {
          dprAutoCap = Math.max(DPR_MIN, dprAutoCap - 0.15); syncDprCap();
        } else if (avg < 0.0140 && dprAutoCap < DPR_MAX) {
          dprAutoCap = Math.min(DPR_MAX, dprAutoCap + 0.10); syncDprCap();
        }
      }
    }

    /* Одна спокойная кинематическая доводка на всём сайте. Раньше About
       переключал модель на прямой scroll, а соседние секции — на пружину:
       именно на границах появлялся заметный толчок. 190 мс снимают резкость
       wheel-шагов и одинаково отрабатывают ход вперёд и точный реверс. */
    const rawAboutProgress = (scrollT - aboutStart) / Math.max(1e-5, aboutEnd - aboutStart);
    const isInsideAbout = rawAboutProgress >= -0.08 && rawAboutProgress <= 1.12;
    scrollS = reduced ? scrollT : damp(scrollS, scrollT, 'st', 0.19, dt);
    /* Reduced motion — не пустой Hero, а спокойный статичный предметный
       кадр. После Hero он просто не рисуется: никакого scroll-driven
       перелёта, раскладки или резкой смены состояния. */
    sampleKeys(reduced ? 0 : scrollS);

    /* Таймлайн About: прилёт сверху-слева → крупное раскрытие в центре →
       пауза → обратная сборка на месте → длинный плавный выход вправо-вниз.
       Всё считается из scroll-позиции, поэтому движение вверх — точный реверс. */
    const aboutProgress = Math.min(1, Math.max(0, (scrollS - aboutStart) / Math.max(1e-5, aboutEnd - aboutStart)));
    const aboutEnter = easeRange(aboutProgress, 0.00, 0.08);
    const aboutLand = easeRange(aboutProgress, 0.03, 0.27);
    /* Весь mobile-layout (включая короткий landscape) использует отдельную
       сцену About. Это тот же breakpoint, что у CSS, поэтому модель никогда
       не попадает в desktop-хореографию поверх одноколоночного copy. */
    const compactAbout = W <= 900;
    const portraitLayout = W / Math.max(H, 1) < 0.85;
    const compactTablet = compactAbout && W > 600 && H > 560;
    const aboutArrive = Math.min(0.72, Math.max(0.22, aboutBeats[1] || 0.37));
    const aboutLeave = Math.min(0.94, Math.max(aboutArrive + 0.24, aboutBeats[2] || 0.73));
    const aboutCenterHold = compactAbout ? 0.39
      : Math.min(aboutLeave - 0.06, Math.max(aboutArrive + 0.10, aboutNamedBeats.centerHold || aboutArrive + 0.20));
    /* Раскрытие и сборка — одна механическая фраза, прочитанная в обе
       стороны. Поэтому у них одно и то же окно scroll-длины, одинаковые
       каскад и quintic-профиль: обратный проход не «догоняет» раскрытие и
       не превращает центральную паузу в ожидание. */
    const openSpan = Math.max(0.06, aboutCenterHold - aboutArrive);
    const closeSpan = Math.max(0.06, aboutLeave - aboutCenterHold);
    const moduleGaps = Math.max(1, aboutAssemblyMotion.length - 1);
    /* На desktop окно занимает большую, но не всю свободную дугу: у модели
       остаются мягкие подлёт, пауза в центре и собранный выход. На mobile
       сохранён безопасный короткий диапазон до fade сцены. */
    const cascadeWindow = compactAbout ? 0.208
      : Math.max(0.06, Math.min(openSpan, closeSpan) * 0.84);
    const cascadeDuration = compactAbout ? 0.120 : cascadeWindow * 0.64;
    const cascadeStep = (cascadeWindow - cascadeDuration) / moduleGaps;
    const openStart = compactAbout ? 0.09
      : aboutArrive + (openSpan - cascadeWindow) * 0.50;
    const closeStart = compactAbout ? 0.33
      : aboutCenterHold + (closeSpan - cascadeWindow) * 0.50;
    aboutAssemblyDrive.fill(0);
    let aboutOpen = 0;
    for (let i = 0; i < aboutAssemblyMotion.length; i++) {
      const openFrom = openStart + i * cascadeStep;
      const openTo = openFrom + cascadeDuration;
      /* Обратная волна повторяет тот же темп и расстояние, но в зеркальном
         порядке: от передней короны к заднему замку. */
      const closeFrom = closeStart + (moduleGaps - i) * cascadeStep;
      const closeTo = closeFrom + cascadeDuration;
      /* На телефоне та же реальная механика, только с более плотным,
         осевым ходом: она остаётся читабельной и не спорит с текстом. */
      const drive = easeAbout(aboutProgress, openFrom, openTo)
        * (1 - easeAbout(aboutProgress, closeFrom, closeTo));
      aboutAssemblyDrive[i] = drive;
      aboutOpen = Math.max(aboutOpen, drive);
    }
    if (aboutOpen > 0.018) aboutFlowIntroConsumed = true;
    /* Технический контроллер включается лишь тогда, когда обычный маршрут
       уже привёл цельный объект в центр. На выходе он совпадает с K2 до
       последней координаты — поэтому переход не смешивает две траектории. */
    const aboutAfterBeat = compactAbout ? 0 : Math.min(0.998, Math.max(
      aboutLeave + 0.02,
      aboutBeats[3] || aboutLeave + 0.045
    ));
    /* На узком desktop сохраняем всю крупную сцену целиком в кадре: не
       обрезаем переднюю корону ради масштаба. Подстройка входит и выходит
       вместе с маршрутом, поэтому не создаёт скачок на входе или выходе. */
    const mobileStageScale = compactAbout
      ? 0.90 + Math.min(1, Math.max(0, (W - 390) / 510)) * 0.28 : 1;
    const aboutViewportFit = compactAbout ? mobileStageScale : Math.min(1, Math.max(0.86,
      0.86 + Math.max(0, W - 900) * 0.14 / 340
    ));
    const aboutFitPresence = compactAbout ? easeAbout(aboutProgress, 0.06, 0.17)
      * (1 - easeAbout(aboutProgress, 0.44, 0.58)) : easeAbout(
      aboutProgress, aboutArrive - 0.10, aboutArrive + 0.02
    ) * (1 - easeAbout(rawAboutProgress, aboutAfterBeat - 0.01, aboutAfterBeat + 0.10));
    const aboutScaleFit = THREE.MathUtils.lerp(1, aboutViewportFit, aboutFitPresence);
    const aboutTechnical = compactAbout
      ? easeAbout(aboutProgress, 0.07, 0.16) * (1 - easeAbout(aboutProgress, 0.56, 0.66))
      : easeAbout(aboutProgress, aboutArrive - 0.085, aboutArrive + 0.045)
        * (1 - easeAbout(rawAboutProgress, aboutAfterBeat - 0.01, aboutAfterBeat + 0.10));
    const aboutIris = compactAbout
      ? easeAbout(aboutProgress, 0.16, 0.29) * (1 - easeAbout(aboutProgress, 0.42, 0.54))
      : easeAbout(aboutProgress, openStart + cascadeStep, openStart + cascadeDuration)
        * (1 - easeAbout(aboutProgress, closeStart + cascadeStep, closeStart + cascadeStep + cascadeDuration));
    const aboutExitFlight = compactAbout ? 0 : easeRange(aboutProgress, closeStart, aboutLeave);
    const aboutLabelVisibility = compactAbout ? 0 : easeAbout(aboutOpen, 0.04, 0.18);
    const aboutLabelsSettled = !compactAbout && aboutProgress >= openStart + cascadeDuration + cascadeStep * moduleGaps;
    /* После раскрытия все шесть подписей спокойно приходят в единый ряд,
       а перед сборкой тем же scroll-driven профилем возвращаются к своим
       геометрическим якорям. */
    const aboutLabelRail = compactAbout ? 0
      : easeAbout(aboutProgress,
        openStart + cascadeDuration + cascadeStep * moduleGaps * 0.675,
        openStart + cascadeDuration + cascadeStep * moduleGaps * 1.075
      ) * (1 - easeAbout(aboutProgress,
        closeStart + cascadeDuration * 0.38,
        closeStart + cascadeDuration * 0.72
      ));
    /* В About всегда один и тот же оригинальный rig: после последней детали
       он остаётся собранным, а затем просто продолжает общую траекторию.
       На узком экране между коротким прилётом и Figures лежит живая колонка
       текста. Там объект не должен просвечивать сквозь copy/CTA: он мягко
       уходит до текста и столь же мягко возвращается уже ниже него. */
    /* На телефоне после CTA начинается плотный блок цифр. Возвращать туда
       крупный полупрозрачный прибор бессмысленно: он перекрывает метрики и
       ломает чтение. Поэтому компактная версия мягко исчезает до copy и
       появляется снова лишь за пределами первой полосы Figures. Desktop
       при этом продолжает непрерывный видимый пролёт без этой страховки. */
    const compactLateReturn = compactAbout
      ? easeAbout(rawAboutProgress, 1.52, 1.70)
      : 1;
    const reducedHeroVisibility = reduced && scrollT < aboutStart ? 1 : 0;
    const aboutRigVisibility = reduced ? reducedHeroVisibility : compactAbout
      /* На узком портрете ракета красиво завершает пролёт ещё до H2: дальше
         начинается плотная текстовая композиция, которой не нужен стеклянный
         слой поверх букв. Обратный scroll проходит тот же мягкий fade назад. */
      ? 1 - easeAbout(aboutProgress, 0.43, 0.55) * (1 - compactLateReturn)
      : 1;
    if (aboutSection) {
      aboutSection.classList.toggle('about--labels', aboutLabelVisibility > 0.02);
      aboutSection.classList.toggle('about--flow-intro', !aboutFlowIntroConsumed && aboutProgress > 0.01);
    }
    /* Качество WebGL фиксируется до входа в видимую сцену и держится до
       полного выхода. Это убирает даже разовый визуальный скачок DPR прямо
       во время раскрытия или сборки. */
    setAboutPerformance(isInsideAbout);

    /* Скорость и направление прокрутки. Прибор на них реагирует: кренится
       в сторону движения, слегка поджимает диафрагму и разгоняет поток.
       Работает одинаково вниз и вверх, только знак крена меняется. */
    const rawV = (scrollS - scrollPrev) / Math.max(dt, 1e-4);
    scrollPrev = scrollS;
    scrollV += (rawV - scrollV) * Math.min(1, dt * 3.4);
    const vv = Math.max(-1, Math.min(1, scrollV * 0.48));
    const va = Math.abs(vv);
    const mechanicalV = vv * (1 - aboutTechnical);

    pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 2.6);
    pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 2.6);

    cur.x  = K.x * xk;
    cur.y  = K.y + yk;
    cur.z  = K.z;
    cur.s  = K.s * sk * aboutScaleFit;
    cur.cz = K.cz;
    cur.cy = K.cy;
    cur.ro = K.ro;
    /* Углы следуют за тем же уже сглаженным scrollS. Отдельная пружина
       включалась и выключалась на About, оставляя в ней старую скорость и
       создавая лишний крен на границах. */
    cur.rx = K.rx;
    cur.ry = K.ry;

    const breathe = reduced ? 0 : Math.sin(time * 0.42) * 0.055 * (1 - aboutTechnical);

    /* Для desktop вся пространственная траектория всегда идёт по одному
       PCHIP-маршруту K. Технический режим управляет только механикой
       разборки и спокойствием камеры — он больше не подменяет летящий rig
       второй кривой. Поэтому в K2 нет stop/go, а K3 не создаёт второй
       handoff. Компактный режим оставляет короткую отдельную позу. */
    const landingLift = compactAbout ? aboutEnter * (1 - aboutLand) * 0.08 : 0;
    const aboutCenterPose = compactAbout ? ABOUT_COMPACT_POSES[1] : ABOUT_DESKTOP_POSES[1];
    const aboutExitPose = compactAbout ? ABOUT_COMPACT_POSES[2] : ABOUT_DESKTOP_POSES[2];
    const aboutAfterPose = compactAbout ? ABOUT_COMPACT_POSES[3] : ABOUT_DESKTOP_POSES[3];
    const aboutFlight = compactAbout ? easeRange(aboutProgress, 0.43, 0.58) : aboutExitFlight;
    const aboutAfterFlight = compactAbout ? 0 : easeRange(aboutProgress, aboutLeave, aboutAfterBeat);
    const transitionX = THREE.MathUtils.lerp(aboutCenterPose.x, aboutExitPose.x, aboutFlight);
    const transitionY = THREE.MathUtils.lerp(aboutCenterPose.y, aboutExitPose.y, aboutFlight);
    const transitionZ = THREE.MathUtils.lerp(aboutCenterPose.z, aboutExitPose.z, aboutFlight);
    const transitionRx = THREE.MathUtils.lerp(aboutCenterPose.rx, aboutExitPose.rx, aboutFlight);
    const transitionRy = THREE.MathUtils.lerp(aboutCenterPose.ry, aboutExitPose.ry, aboutFlight);
    const transitionScale = THREE.MathUtils.lerp(aboutCenterPose.s, aboutExitPose.s, aboutFlight);
    const transitionCy = THREE.MathUtils.lerp(aboutCenterPose.cy, aboutExitPose.cy, aboutFlight);
    const transitionCz = THREE.MathUtils.lerp(aboutCenterPose.cz, aboutExitPose.cz, aboutFlight);
    const transitionRo = THREE.MathUtils.lerp(aboutCenterPose.ro, aboutExitPose.ro, aboutFlight);
    const transitionOpacity = THREE.MathUtils.lerp(aboutCenterPose.op, aboutExitPose.op, aboutFlight);
    const lockedAboutX = THREE.MathUtils.lerp(transitionX, aboutAfterPose.x, aboutAfterFlight) * xk;
    const lockedAboutY = THREE.MathUtils.lerp(transitionY, aboutAfterPose.y, aboutAfterFlight) + yk;
    const lockedAboutZ = THREE.MathUtils.lerp(transitionZ, aboutAfterPose.z, aboutAfterFlight);
    const lockedAboutRx = THREE.MathUtils.lerp(transitionRx, aboutAfterPose.rx, aboutAfterFlight);
    const lockedAboutRy = THREE.MathUtils.lerp(transitionRy, aboutAfterPose.ry, aboutAfterFlight);
    const lockedAboutScale = THREE.MathUtils.lerp(transitionScale, aboutAfterPose.s, aboutAfterFlight) * sk * aboutScaleFit;
    const lockedAboutCy = THREE.MathUtils.lerp(transitionCy, aboutAfterPose.cy, aboutAfterFlight);
    const lockedAboutCz = THREE.MathUtils.lerp(transitionCz, aboutAfterPose.cz, aboutAfterFlight);
    const lockedAboutRo = THREE.MathUtils.lerp(transitionRo, aboutAfterPose.ro, aboutAfterFlight);
    const lockedAboutOpacity = THREE.MathUtils.lerp(transitionOpacity, aboutAfterPose.op, aboutAfterFlight);
    const aboutPoseMix = 0;
    const rigX = cur.x * (1 - aboutPoseMix) + lockedAboutX * aboutPoseMix;
    const rigY = cur.y * (1 - aboutPoseMix) + lockedAboutY * aboutPoseMix;
    const rigZ = cur.z * (1 - aboutPoseMix) + lockedAboutZ * aboutPoseMix;
    const rigRx = cur.rx * (1 - aboutPoseMix) + lockedAboutRx * aboutPoseMix;
    const rigRy = cur.ry * (1 - aboutPoseMix) + lockedAboutRy * aboutPoseMix;
    /* В landscape у Hero сохраняется просторный кадр, а внутри About модель
       мягко входит в тот же компактный масштаб, что и на телефоне. */
    const compactStagePresence = compactAbout
      ? easeAbout(aboutProgress, 0.05, 0.16) * (1 - easeAbout(aboutProgress, 0.48, 0.62))
      : 0;
    const compactLandscapeY = compactAbout && !portraitLayout ? -1.78 * compactStagePresence : 0;
    const compactLandscapeScale = compactAbout && !portraitLayout
      ? THREE.MathUtils.lerp(1, 0.78, compactStagePresence) : 1;
    const rigScale = (cur.s * (1 - aboutPoseMix) + lockedAboutScale * aboutPoseMix) * compactLandscapeScale;
    /* Вся desktop-траектория уже заложена в PCHIP-ключи: отдельный боковой
       корректирующий манёвр здесь создавал S-образную дугу перед центром.
       Поэтому вход, раскрытие и уход живут на одной непрерывной кривой. */
    rig.position.set(rigX, rigY + compactLandscapeY + breathe + landingLift, rigZ);
    rig.rotation.set(
      rigRx + pointer.y * 0.045 * (1 - aboutTechnical) - mechanicalV * 0.022,
      rigRy + time * 0.006 * (1 - aboutTechnical) + pointer.x * 0.070 * (1 - aboutTechnical),
      Math.sin(time * 0.24) * 0.012 * (1 - aboutTechnical) + mechanicalV * 0.028
    );
    rig.scale.setScalar(rigScale);

    // диафрагма дышит и подбирается на быстрой прокрутке, как при съёмке в проводке
    const freeMechanics = 1 - aboutTechnical;
    const shut = (reduced ? 0.10
      : ((Math.sin(time * 0.17) * 0.5 + 0.5) * 0.13 + va * 0.055) * freeMechanics) + aboutIris * 0.13;
    const spin = reduced ? 0 : shut * 0.24;
    for (let i = 0; i < blades.length; i++) {
      const b = blades[i], th = b.userData.th + spin;
      b.rotation.z = th;
      b.rotation.x = 0.11;
      b.position.set(Math.sin(th) * shut, -Math.cos(th) * shut, b.userData.z);
    }

    for (let i = 0; i < aboutAssemblyMotion.length; i++) {
      const motion = aboutAssemblyMotion[i];
      const base = motion.node.userData.aboutBase;
      const drive = aboutAssemblyDrive[i];
      const travel = compactAbout
        ? (!portraitLayout ? motion.landscapeTravel : (compactTablet ? motion.tabletTravel : motion.mobileTravel))
        : motion.travel;
      motion.node.position.copy(base.position).addScaledVector(travel, drive);
      motion.node.rotation.copy(base.rotation);
      motion.node.rotation.x += (motion.pitch || 0) * drive;
      motion.node.rotation.y += (motion.yaw || 0) * drive;
      motion.node.rotation.z += motion.turn * drive;
    }
    /* Контактная пыль читает тот же drive, что и механика. В ней нет
       raw wheel velocity или таймера: на одном scroll-кадре рисунок всегда
       одинаков, а движение вверх становится точным обратным следом. */
    const aboutDustPresence = aboutTechnical * aboutRigVisibility * (coarse ? 0.62 : 1);
    for (const dust of aboutDust) {
      dust.uniforms.uDrive.value = aboutAssemblyDrive[dust.index];
      dust.uniforms.uPresence.value = aboutDustPresence;
    }
    gimbal.position.copy(gimbal.userData.aboutBase.position);
    gimbal.rotation.copy(gimbal.userData.aboutBase.rotation);

    /* В момент точной сборки ни курсор, ни скорость скролла не должны
       незаметно менять ракурс: на одной позиции скролла кадр всегда один и
       тот же. После выхода из технического режима обычная «жизнь» возвращается. */
    const cameraFree = 1 - aboutTechnical;
    const cameraCy = cur.cy * (1 - aboutPoseMix) + lockedAboutCy * aboutPoseMix;
    const cameraCz = cur.cz * (1 - aboutPoseMix) + lockedAboutCz * aboutPoseMix;
    const cameraRo = cur.ro * (1 - aboutPoseMix) + lockedAboutRo * aboutPoseMix;
    camera.position.set(
      pointer.x * 0.16 * cameraFree,
      cameraCy + pointer.y * -0.10 * cameraFree,
      cameraCz
    );
    camera.lookAt(0, 0, 0);
    camera.rotateZ(cameraRo - vv * 0.010 * cameraFree);
    flare.quaternion.copy(camera.quaternion);   // блик всегда лицом к камере
    halo.quaternion.copy(camera.quaternion);
    if (aboutLabelVisibility > 0.002) {
      updateAboutModuleLabels(aboutAssemblyDrive, compactAbout, aboutLabelVisibility, aboutLabelsSettled, aboutLabelRail);
    }

    pUni.uT.value = time;
    stUni.uT.value = time;
    /* Большой осевой поток остаётся атмосферой Hero. Пока механика
       раскрыта, он спокойно оседает, освобождая место физической пыли у
       самих стыков — без двух конкурирующих particle-историй. */
    const aboutDustGate = aboutTechnical * aboutRigVisibility;
    pUni.uSpread.value = K.sp * (1 + va * 0.035) * THREE.MathUtils.lerp(1, 0.76, aboutDustGate);
    pUni.uBright.value = K.br * ok * aboutRigVisibility * (1 + va * 0.10) * (1 - aboutOpen * 0.82);
    pUni.uScale.value  = 0.85 + K.s * 0.45;
    stUni.uA.value = 0.35 + (1 - scrollS) * 0.65;

    rig.visible = aboutRigVisibility > 0.006;
    const displayOpacity = K.op * (1 - aboutPoseMix) + lockedAboutOpacity * aboutPoseMix;
    const op = displayOpacity * ok * aboutRigVisibility;
    for (const u of glassUniforms) { u.uAlpha.value = op; u.uGain.value = 0.85 + op * 0.40; }
    for (const u of metalUniforms) u.uAlpha.value = op * 0.92;
    for (const u of opticalUniforms) {
      u.uT.value = time;
      u.uA.value = op;
      u.uEnergy.value = 0.76 + K.br * 0.44 + va * 0.055;
    }
    /* Малые движения отдельного узла создают жизнь внутри прибора, но не
       спорят с общей хореографией по прокрутке. Важный момент: скорость
       ниже, чем у частиц — это механика высокого класса, а не спиннер. */
    calibration.rotation.z = (time * 0.045 + pointer.x * 0.030) * freeMechanics;
    gimbal.rotation.z = (-time * 0.018 + pointer.x * 0.012) * freeMechanics;
    frontInner.rotation.z = -time * 0.026 * freeMechanics;
    const focusPulse = 1 + (reduced ? 0 : (Math.sin(time * 0.78) * 0.009 + va * 0.008) * freeMechanics);
    pupil.scale.setScalar(focusPulse);
    for (const d of detailMats) d.m.opacity = d.base * op * (0.82 + K.br * 0.22);
    if (markRef) markRef.material.opacity = op;
    flare.material.uniforms.uA.value = K.br * ok * aboutRigVisibility * 0.34;
    halo.material.uniforms.uA.value = op * 0.85;

    renderer.render(scene, camera);

    if (!started) { started = true; canvas.classList.add('is-ready'); }
  }


  frame();
}
