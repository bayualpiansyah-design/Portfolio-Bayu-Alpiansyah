/* ============================================================
   BAYU — Footer mini game (dino-style endless runner)
   Space / tap / click on the game area to jump.
   Speed +10% every 50 points (capped), best score in localStorage.
   ============================================================ */
(function () {
  "use strict";

  const footer = document.getElementById("gameFooter");
  const stage = document.getElementById("gfStage");
  const canvas = document.getElementById("gfCanvas");
  const overlay = document.getElementById("gfOverlay");
  const scoreEl = document.getElementById("gfScore");
  const bestEl = document.getElementById("gfBest");
  if (!footer || !stage || !canvas || !overlay) return;

  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Assets (light + dark preloaded, swapped on theme change) ---------- */
  const NAMES = ["character", "cloud", "road", "obstacle-1x2", "obstacle-2x1", "obstacle-2x2", "obstacle-1x3", "obstacle-3x1"];
  const sets = { light: {}, dark: {} };
  ["light", "dark"].forEach((mode) => {
    NAMES.forEach((n) => {
      const img = new Image();
      img.src = "assets/game/" + mode + "/" + n + ".svg";
      sets[mode][n] = img;
    });
  });
  let theme = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  let art = sets[theme];
  new MutationObserver(() => {
    theme = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    art = sets[theme];
    if (state !== "running") renderStatic();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  /* ---------- Obstacle catalogue (grid units of 56px; points per spec) ---------- */
  const TYPES = [
    { key: "obstacle-1x2", wu: 1, hu: 2, pts: 5 },
    { key: "obstacle-2x1", wu: 2, hu: 1, pts: 5 },
    { key: "obstacle-2x2", wu: 2, hu: 2, pts: 10 },
    { key: "obstacle-1x3", wu: 1, hu: 3, pts: 15 },
    { key: "obstacle-3x1", wu: 3, hu: 1, pts: 15 },
  ];

  /* ---------- Sizing ---------- */
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0, H = 0, S = 1, U = 56, CHAR = 80, ROAD_H = 136, GROUND = 0, CHAR_X = 32;

  function resize() {
    const r = stage.getBoundingClientRect();
    if (!r.width || !r.height) return;
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    S = W < 560 ? 0.6 : W < 900 ? 0.8 : 1;
    U = 56 * S;
    CHAR = 80 * S;
    ROAD_H = 136 * S;
    GROUND = H - ROAD_H;
    CHAR_X = 32 * S;
    if (state !== "running") renderStatic();
  }

  /* ---------- Game state ---------- */
  let state = "idle"; // idle | running | over
  let score = 0, best = 0, milestones = 0;
  let charY = 0, charVy = 0, onGround = true;
  let obstacles = [], clouds = [], roadX = 0;
  let rafId = null, lastT = 0, spawnGap = 0;
  let footerVisible = false, paused = false;

  try { best = parseInt(localStorage.getItem("gfBest"), 10) || 0; } catch (e) {}

  const pad = (n) => String(Math.min(n, 99999)).padStart(5, "0");
  scoreEl.textContent = pad(0);
  bestEl.textContent = pad(best);

  const BASE_SPEED = 360;
  const speedMult = () => Math.min(Math.pow(1.1, milestones), 2.5);
  const speed = () => BASE_SPEED * S * speedMult();
  const gravity = () => 3400 * S;
  const jumpV = () => Math.sqrt(2 * gravity() * (3 * U + 28 * S));
  const airTime = () => (2 * jumpV()) / gravity();

  function seedClouds() {
    clouds = [];
    const n = Math.max(3, Math.round(W / 320));
    for (let i = 0; i < n; i++) {
      clouds.push({
        x: (W / n) * i + Math.random() * (W / n) * 0.6,
        y: 20 * S + Math.random() * Math.max(40, GROUND * 0.35),
      });
    }
  }

  function decorObstacles() {
    obstacles = [
      makeObstacle(TYPES[0], W * 0.3),
      makeObstacle(TYPES[1], W * 0.82),
    ];
  }

  function makeObstacle(type, x) {
    return { x: x, w: type.wu * U, h: type.hu * U, img: type.key, pts: type.pts, passed: false };
  }

  function nextGap() {
    const air = speed() * airTime();
    return air * 1.6 + Math.random() * air * 1.4;
  }

  /* ---------- Sounds (Web Audio, created on first gesture) ---------- */
  let audio = null;
  function ensureAudio() {
    if (!audio) {
      try { audio = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    }
    if (audio.state === "suspended") audio.resume();
  }
  function tone(type, f0, f1, dur, vol, when) {
    if (!audio) return;
    const t = audio.currentTime + (when || 0);
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(audio.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }
  const sndJump = () => tone("square", 300, 640, 0.1, 0.08);
  const sndMilestone = () => { tone("sine", 660, 660, 0.09, 0.12); tone("sine", 990, 990, 0.14, 0.12, 0.09); };
  const sndOver = () => tone("sawtooth", 260, 60, 0.4, 0.14);

  /* ---------- Rendering ---------- */
  function drawScene() {
    ctx.clearRect(0, 0, W, H);
    clouds.forEach((c) => ctx.drawImage(art.cloud, c.x, c.y, 80 * S, 40 * S));
    // road: tiled strip pinned to the bottom
    const rw = 1232 * S;
    let x = roadX % rw;
    if (x > 0) x -= rw;
    for (; x < W; x += rw) ctx.drawImage(art.road, x, H - ROAD_H, rw, ROAD_H);
    obstacles.forEach((o) => ctx.drawImage(art[o.img], o.x, GROUND - o.h, o.w, o.h));
    // character (asset faces left; flip so it runs to the right)
    ctx.save();
    ctx.translate(CHAR_X + CHAR, GROUND - CHAR - charY);
    ctx.scale(-1, 1);
    ctx.drawImage(art.character, 0, 0, CHAR, CHAR);
    ctx.restore();
  }

  function renderStatic() {
    if (!W) return;
    if (!clouds.length) seedClouds();
    if (state === "idle" && !obstacles.length) decorObstacles();
    drawScene();
  }

  /* ---------- Game loop ---------- */
  function tick(t) {
    rafId = requestAnimationFrame(tick);
    if (!lastT) { lastT = t; return; }
    let dt = (t - lastT) / 1000;
    lastT = t;
    if (dt > 0.1) dt = 0.1; // tab switch guard

    const v = speed();
    roadX -= v * dt;

    clouds.forEach((c) => {
      c.x -= v * 0.25 * dt;
      if (c.x < -90 * S) { c.x = W + Math.random() * 120; c.y = 20 * S + Math.random() * Math.max(40, GROUND * 0.35); }
    });

    // character physics
    if (!onGround || charVy > 0) {
      charVy -= gravity() * dt;
      charY += charVy * dt;
      if (charY <= 0) { charY = 0; charVy = 0; onGround = true; }
    }

    // obstacles
    spawnGap -= v * dt;
    if (spawnGap <= 0) {
      const type = TYPES[Math.floor(Math.random() * TYPES.length)];
      obstacles.push(makeObstacle(type, W + type.wu * U));
      spawnGap = nextGap();
    }
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= v * dt;
      if (!o.passed && o.x + o.w < CHAR_X) {
        o.passed = true;
        score += o.pts;
        scoreEl.textContent = pad(score);
        const m = Math.floor(score / 50);
        if (m > milestones) { milestones = m; sndMilestone(); }
      }
      if (o.x + o.w < -U) obstacles.splice(i, 1);
    }

    // collision (forgiving hitboxes)
    const pad2 = 10 * S;
    const cx = CHAR_X + pad2, cy = GROUND - CHAR - charY + pad2 * 1.2;
    const cw = CHAR - pad2 * 2, ch = CHAR - pad2 * 1.2;
    for (const o of obstacles) {
      const ox = o.x + 4 * S, oy = GROUND - o.h + 4 * S, ow = o.w - 8 * S, oh = o.h - 4 * S;
      if (cx < ox + ow && cx + cw > ox && cy < oy + oh && cy + ch > oy) { gameOver(); break; }
    }

    drawScene();
  }

  function startLoop() {
    if (rafId == null) { lastT = 0; rafId = requestAnimationFrame(tick); }
  }
  function stopLoop() {
    if (rafId != null) { cancelAnimationFrame(rafId); rafId = null; }
  }

  /* ---------- State transitions ---------- */
  function startGame() {
    state = "running";
    score = 0; milestones = 0;
    charY = 0; charVy = 0; onGround = true;
    obstacles = [];
    spawnGap = nextGap() * 0.8;
    scoreEl.textContent = pad(0);
    overlay.classList.remove("is-visible");
    stage.classList.remove("is-idle");
    startLoop();
  }

  function jump() {
    if (onGround) {
      onGround = false;
      charVy = jumpV();
      charY = 0.01;
      sndJump();
    }
  }

  function gameOver() {
    state = "over";
    stopLoop();
    sndOver();
    if (score > best) {
      best = score;
      bestEl.textContent = pad(best);
      try { localStorage.setItem("gfBest", String(best)); } catch (e) {}
    }
    drawScene();
    setTimeout(() => {
      if (state === "over") {
        overlay.classList.add("is-visible");
        stage.classList.add("is-idle");
      }
    }, 450);
  }

  /* ---------- Input ---------- */
  function act() {
    if (reduceMotion) return;
    ensureAudio();
    if (state === "running") jump();
    else if (!paused) startGame();
  }

  document.addEventListener("keydown", (e) => {
    if (e.code !== "Space" || e.repeat) return;
    if (!footerVisible || reduceMotion) return;
    const tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select" || e.target.isContentEditable) return;
    e.preventDefault();
    act();
  });

  stage.addEventListener("pointerdown", (e) => {
    if (e.target.closest("a, button")) return;
    act();
  });

  /* ---------- Pause when footer leaves view / tab hidden ---------- */
  function setPaused(p) {
    if (p && state === "running") { paused = true; stopLoop(); }
    else if (!p && paused) { paused = false; if (state === "running") startLoop(); }
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      footerVisible = entries[0].isIntersecting;
      if (footerVisible && !W) resize();
      setPaused(!footerVisible);
    }, { threshold: 0.2 }).observe(footer);
  } else {
    footerVisible = true;
  }
  document.addEventListener("visibilitychange", () => setPaused(document.hidden || !footerVisible));

  /* ---------- Init ---------- */
  stage.classList.add("is-idle");
  if (reduceMotion) footer.classList.add("gf-static");

  if ("ResizeObserver" in window) {
    new ResizeObserver(resize).observe(stage);
  } else {
    window.addEventListener("resize", resize);
  }
  resize();
  window.addEventListener("load", resize);

  // first paint may race with SVG loading — repaint as assets land
  ["light", "dark"].forEach((mode) => {
    NAMES.forEach((n) => {
      const img = sets[mode][n];
      if (!img.complete) img.onload = () => { if (state !== "running") renderStatic(); };
    });
  });
})();
