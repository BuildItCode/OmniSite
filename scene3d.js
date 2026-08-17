/* OmniStack landing — three.js neon scene.
   Layers: wireframe grid floor, floating icosahedron core with orbiting
   rings and satellites, starfield, floating shards. Reacts to pointer + scroll.
   Loads three.js from CDN and falls back gracefully (static page stays fine). */
(() => {
  "use strict";

  const THREE_URLS = [
    "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js",
    "https://unpkg.com/three@0.160.0/build/three.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.min.js",
  ];

  const loadThree = (i = 0) =>
    new Promise((resolve, reject) => {
      if (i >= THREE_URLS.length) return reject(new Error("all CDN sources failed"));
      const s = document.createElement("script");
      s.src = THREE_URLS[i];
      s.onload = () => (window.THREE ? resolve(window.THREE) : loadThree(i + 1).then(resolve, reject));
      s.onerror = () => loadThree(i + 1).then(resolve, reject);
      document.head.appendChild(s);
    });

  loadThree().then(init).catch(() => {
    const c = document.getElementById("gl");
    if (c) c.style.display = "none"; // particles + gradients still carry the page
  });

  function init(THREE) {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = document.getElementById("gl");

    const CYAN = 0x00f0ff;
    const MAGENTA = 0xff2fd6;
    const VIOLET = 0x8b5cff;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(innerWidth, innerHeight);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05060e, 0.028);

    const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 200);
    camera.position.set(0, 2.1, 13);

    /* ── Neon grid floor ── */
    const grid = new THREE.GridHelper(160, 80, CYAN, VIOLET);
    grid.material.transparent = true;
    grid.material.opacity = 0.16;
    grid.position.y = -4.5;
    scene.add(grid);

    const grid2 = new THREE.GridHelper(160, 26, MAGENTA, MAGENTA);
    grid2.material.transparent = true;
    grid2.material.opacity = 0.05;
    grid2.position.y = -4.45;
    scene.add(grid2);

    /* ── Central core: nested wireframe icosahedra ── */
    const core = new THREE.Group();

    const outer = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.6, 1),
      new THREE.MeshBasicMaterial({ color: CYAN, wireframe: true, transparent: true, opacity: 0.5 })
    );
    core.add(outer);

    const inner = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.5, 0),
      new THREE.MeshBasicMaterial({ color: MAGENTA, wireframe: true, transparent: true, opacity: 0.75 })
    );
    core.add(inner);

    const nucleus = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.55, 0),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 })
    );
    core.add(nucleus);

    /* orbiting rings */
    const ring1 = new THREE.Mesh(
      new THREE.TorusGeometry(3.7, 0.015, 8, 128),
      new THREE.MeshBasicMaterial({ color: VIOLET, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
    );
    ring1.rotation.x = Math.PI / 2.4;
    core.add(ring1);

    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(4.4, 0.012, 8, 128),
      new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
    );
    ring2.rotation.x = Math.PI / 1.7;
    ring2.rotation.y = 0.5;
    core.add(ring2);

    /* satellites riding the rings */
    const satGeo = new THREE.SphereGeometry(0.09, 10, 10);
    const sat1 = new THREE.Mesh(satGeo, new THREE.MeshBasicMaterial({ color: MAGENTA }));
    const sat2 = new THREE.Mesh(satGeo, new THREE.MeshBasicMaterial({ color: CYAN }));
    const sat3 = new THREE.Mesh(satGeo, new THREE.MeshBasicMaterial({ color: 0xb6ff3c }));
    core.add(sat1, sat2, sat3);

    core.position.set(0, 1.6, 0);
    scene.add(core);

    /* ── Starfield ── */
    const STAR_COUNT = 900;
    const starPos = new Float32Array(STAR_COUNT * 3);
    const starCol = new Float32Array(STAR_COUNT * 3);
    const palette = [new THREE.Color(CYAN), new THREE.Color(MAGENTA), new THREE.Color(VIOLET), new THREE.Color(0xffffff)];
    for (let i = 0; i < STAR_COUNT; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 140;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 90 + 8;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 140 - 20;
      const c = palette[(Math.random() * palette.length) | 0];
      starCol[i * 3] = c.r;
      starCol[i * 3 + 1] = c.g;
      starCol[i * 3 + 2] = c.b;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute("color", new THREE.BufferAttribute(starCol, 3));
    const stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ size: 0.09, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false })
    );
    scene.add(stars);

    /* ── Floating shards ── */
    const shards = new THREE.Group();
    const shardGeo = new THREE.TetrahedronGeometry(0.32, 0);
    const shardMats = [
      new THREE.MeshBasicMaterial({ color: CYAN, wireframe: true, transparent: true, opacity: 0.55 }),
      new THREE.MeshBasicMaterial({ color: MAGENTA, wireframe: true, transparent: true, opacity: 0.55 }),
      new THREE.MeshBasicMaterial({ color: VIOLET, wireframe: true, transparent: true, opacity: 0.55 }),
    ];
    const shardData = [];
    for (let i = 0; i < 26; i++) {
      const m = new THREE.Mesh(shardGeo, shardMats[i % shardMats.length]);
      const angle = Math.random() * Math.PI * 2;
      const radius = 6 + Math.random() * 9;
      m.position.set(Math.cos(angle) * radius, Math.random() * 8 - 2.5, Math.sin(angle) * radius - 3);
      m.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      shardData.push({ m, speed: 0.2 + Math.random() * 0.6, phase: Math.random() * Math.PI * 2, y0: m.position.y });
      shards.add(m);
    }
    scene.add(shards);

    /* collect fadeable materials so the core dissolves as you scroll past the hero */
    const fadeMats = [];
    const track = (obj, base) => { obj.material.userData.base = base; fadeMats.push(obj.material); };
    track(outer, 0.5); track(inner, 0.75); track(nucleus, 0.9);
    track(ring1, 0.55); track(ring2, 0.35);
    track(sat1, 1); track(sat2, 1); track(sat3, 1);
    shardMats.forEach((m) => { m.userData.base = 0.55; fadeMats.push(m); });

    /* ── Pointer parallax ── */
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    addEventListener("mousemove", (e) => {
      pointer.tx = (e.clientX / innerWidth - 0.5) * 2;
      pointer.ty = (e.clientY / innerHeight - 0.5) * 2;
    }, { passive: true });

    /* ── Resize ── */
    addEventListener("resize", () => {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    }, { passive: true });

    /* ── Animate ── */
    const clock = new THREE.Clock();

    (function frame() {
      const t = clock.getElapsedTime();
      const scroll = window.__scrollRatio || 0;

      pointer.x += (pointer.tx - pointer.x) * 0.045;
      pointer.y += (pointer.ty - pointer.y) * 0.045;

      if (!reduceMotion) {
        outer.rotation.y = t * 0.18;
        outer.rotation.x = Math.sin(t * 0.22) * 0.25;
        inner.rotation.y = -t * 0.4;
        inner.rotation.z = t * 0.16;
        nucleus.rotation.y = t * 0.9;
        nucleus.scale.setScalar(1 + Math.sin(t * 2.4) * 0.14);

        ring1.rotation.z = t * 0.35;
        ring2.rotation.z = -t * 0.22;

        const a1 = t * 0.7, a2 = -t * 0.45 + 2.1, a3 = t * 0.55 + 4.2;
        sat1.position.set(Math.cos(a1) * 3.7, Math.sin(a1) * 3.7 * Math.sin(ring1.rotation.x), Math.sin(a1) * 1.4);
        sat2.position.set(Math.cos(a2) * 4.4, Math.sin(a2) * 1.1, Math.sin(a2) * 4.4 * 0.6);
        sat3.position.set(Math.cos(a3) * 3.7, Math.sin(a3) * 3.7 * Math.cos(ring1.rotation.x) * 0.6, Math.cos(a3) * -1.8);

        shardData.forEach(({ m, speed, phase, y0 }) => {
          m.position.y = y0 + Math.sin(t * speed + phase) * 0.8;
          m.rotation.x += 0.003 * speed;
          m.rotation.y += 0.004 * speed;
        });

        stars.rotation.y = t * 0.008;
        grid.position.z = (t * 0.6) % 2;

        core.position.y = 1.6 + Math.sin(t * 0.7) * 0.25 - scroll * 5;
        core.rotation.y = scroll * Math.PI * 1.4;
      }

      /* dissolve the core/shards once the hero is behind us — keeps text readable */
      const fade = Math.max(0, 1 - scroll * 14);
      fadeMats.forEach((m) => { m.opacity = m.userData.base * fade; });
      core.visible = fade > 0.01;
      shards.visible = fade > 0.01;

      camera.position.x = pointer.x * 1.6;
      camera.position.y = 2.1 - pointer.y * 1.1 + scroll * 3.2;
      camera.position.z = 13 - scroll * 3;
      camera.lookAt(0, 1.2 - scroll * 4, 0);

      renderer.render(scene, camera);
      requestAnimationFrame(frame);
    })();
  }
})();
