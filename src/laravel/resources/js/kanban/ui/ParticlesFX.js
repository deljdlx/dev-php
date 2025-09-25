// Fancy particle overlay: default is a cursor-following trail with hearts/stars/sparkles.
// Snow mode is still available via { effect: 'snow' }.

export function startParticles(options = {}) {
  const effect = options.effect || 'cursor';
  return effect === 'snow' ? startSnow(options) : startCursorTrail(options);
}

function commonSetup(zIndex = 5) {
  const canvas = document.createElement('canvas');
  canvas.className = 'particles-canvas';
  Object.assign(canvas.style, {
    position: 'fixed', left: '0', top: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: String(zIndex)
  });
  const ctx = canvas.getContext('2d');
  const resize = () => {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const w = window.innerWidth, h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  document.body.appendChild(canvas);
  return { canvas, ctx, resize };
}

function startCursorTrail(options = {}) {
  const cfg = {
    maxParticles: options.maxParticles ?? 180,
    spawnPerMove: options.spawnPerMove ?? 10,
    baseSize: options.baseSize ?? 6,
    sizeJitter: options.sizeJitter ?? 8,
    speed: options.speed ?? 0.8,
    friction: options.friction ?? 0.96,
    gravity: options.gravity ?? -0.02, // gentle float-up
    fade: options.fade ?? 0.025,
    zIndex: options.zIndex ?? 5,
    colors: options.colors ?? ['#FFD1DC', '#E7D1FF', '#C0F1FF', '#C8F7C5', '#FFE0B2', '#FFF5CC'], // pastels
    shapes: options.shapes ?? ['heart', 'star', 'circle', 'sparkle'],
    glow: options.glow ?? true,
    clickBurst: options.clickBurst ?? 24,
  };

  let raf = null; let running = true;
  const { canvas, ctx, resize } = commonSetup(cfg.zIndex);
  const particles = [];
  const rand = (a,b) => a + Math.random()*(b-a);
  const pick = (arr) => arr[(Math.random()*arr.length)|0];
  const clamp = (n,a,b)=>Math.max(a,Math.min(b,n));

  function spawn(x, y, n = cfg.spawnPerMove) {
    for (let i = 0; i < n; i++) {
      if (particles.length >= cfg.maxParticles) particles.shift();
      const angle = Math.random() * Math.PI * 2;
      const speed = rand(0.2, 1.2) * cfg.speed;
      const shape = pick(cfg.shapes);
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: rand(cfg.baseSize, cfg.baseSize + cfg.sizeJitter),
        life: 1,
        color: pick(cfg.colors),
        shape,
        rot: rand(0, Math.PI*2),
        spin: rand(-0.1, 0.1),
        scale: rand(0.8, 1.2),
      });
    }
  }

  function drawHeart(r) {
    const k = 0.5522847498; // bezier approximation
    const c = r;
    ctx.beginPath();
    ctx.moveTo(0, -c/3);
    ctx.bezierCurveTo(c, -c, c*1.2, 0, 0, c);
    ctx.bezierCurveTo(-c*1.2, 0, -c, -c, 0, -c/3);
    ctx.closePath();
  }
  function drawStar(r, spikes = 5) {
    const step = Math.PI / spikes;
    ctx.beginPath();
    for (let i = 0; i < 2*spikes; i++) {
      const rr = i % 2 === 0 ? r : r * 0.45;
      const a = i * step - Math.PI/2;
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
  }
  function drawSparkle(r) {
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(0, r);
    ctx.moveTo(-r, 0);
    ctx.lineTo(r, 0);
  }

  function drawParticle(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.scale(p.scale, p.scale);
    const alpha = clamp(p.life, 0, 1);
    ctx.globalAlpha = alpha;
    if (cfg.glow) { ctx.shadowColor = p.color; ctx.shadowBlur = 12; }
    ctx.fillStyle = p.color;
    ctx.strokeStyle = p.color;
    ctx.lineWidth = Math.max(1, p.size * 0.12);
    switch (p.shape) {
      case 'heart': drawHeart(p.size); ctx.fill(); break;
      case 'star': drawStar(p.size); ctx.fill(); break;
      case 'sparkle': drawSparkle(p.size); ctx.stroke(); break;
      default: ctx.beginPath(); ctx.arc(0, 0, p.size * 0.6, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }

  const onMove = (e) => spawn(e.clientX, e.clientY);
  const onClick = (e) => spawn(e.clientX, e.clientY, cfg.clickBurst);

  const tick = () => {
    if (!running) return;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vx *= cfg.friction;
      p.vy = p.vy * cfg.friction + cfg.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.spin;
      p.life -= cfg.fade;
      if (p.life <= 0) { particles.splice(i,1); continue; }
      drawParticle(p);
    }
    raf = requestAnimationFrame(tick);
  };

  const onResize = () => resize();
  window.addEventListener('resize', onResize);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('click', onClick);
  raf = requestAnimationFrame(tick);

  function stop(){
    running = false;
    if (raf) cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('click', onClick);
    try { canvas.remove(); } catch {}
  }
  return stop;
}

function startSnow(options = {}) {
  const cfg = {
    maxFlakes: options.maxFlakes ?? 220,
    baseSize: options.baseSize ?? 2.0,
    sizeJitter: options.sizeJitter ?? 3.5,
    baseVy: options.baseVy ?? 0.6,
    vyJitter: options.vyJitter ?? 0.7,
    swayAmp: options.swayAmp ?? 18,
    swayFreq: options.swayFreq ?? 0.8,
    rotSpeed: options.rotSpeed ?? 0.04,
    windEase: options.windEase ?? 0.0025,
    gustEveryMs: options.gustEveryMs ?? 5200,
    gustMax: options.gustMax ?? 0.6,
    layers: options.layers ?? 3,
    colors: options.colors ?? ['#ffffff', '#e6f7ff', '#f8fbff'],
    zIndex: options.zIndex ?? 5,
    glow: options.glow ?? true,
  };

  let raf = null; let running = true;
  const flakes = [];
  const wind = { value: 0, target: 0, lastChange: performance.now() };
  const { canvas, ctx, resize } = commonSetup(cfg.zIndex);
  const rand = (min, max) => min + Math.random() * (max - min);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  function mkFlake(spawnTop = true) {
    const w = window.innerWidth; const h = window.innerHeight;
    const layer = (Math.random() * cfg.layers) | 0; const depth = (layer + 1) / cfg.layers;
    const size = cfg.baseSize + Math.random() * cfg.sizeJitter * depth;
    const x = rand(-40, w + 40);
    const y = spawnTop ? rand(-60, -10) : rand(-h * 0.25, -10);
    const vy = cfg.baseVy + Math.random() * cfg.vyJitter * depth;
    const sway = cfg.swayAmp * (0.5 + Math.random()) * depth;
    const swayFreq = cfg.swayFreq * (0.7 + Math.random() * 0.6);
    const rot = Math.random() * Math.PI; const rotVel = (Math.random() - 0.5) * cfg.rotSpeed * (0.3 + depth);
    return { x, y, vy, size, layer, depth, baseX: x, sway, swayFreq, swayPhase: Math.random() * Math.PI * 2, rot, rotVel, color: pick(cfg.colors), twinklePhase: Math.random() * Math.PI * 2, twinkleFreq: rand(0.8, 1.6) };
  }
  for (let i = 0; i < cfg.maxFlakes; i++) flakes.push(mkFlake(false));

  function drawFlake(f) {
    const alpha = clamp(0.4 + Math.sin(f.twinklePhase) * 0.35, 0.25, 0.95) * (0.5 + f.depth * 0.5);
    ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.rot); ctx.globalAlpha = alpha;
    if (cfg.glow) { ctx.shadowColor = f.color; ctx.shadowBlur = 8 * f.depth; } else { ctx.shadowBlur = 0; }
    ctx.strokeStyle = f.color; ctx.lineWidth = Math.max(1, f.size * 0.15);
    const r = f.size;
    for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3; ctx.beginPath(); ctx.moveTo(-r * Math.cos(a), -r * Math.sin(a)); ctx.lineTo(r * Math.cos(a), r * Math.sin(a)); ctx.stroke(); }
    ctx.restore();
  }
  function maybeChangeWind(now) {
    if (now - wind.lastChange > cfg.gustEveryMs * (0.6 + Math.random() * 0.8)) { wind.target = rand(-cfg.gustMax, cfg.gustMax); wind.lastChange = now; }
    wind.value += (wind.target - wind.value) * cfg.windEase;
  }
  const onMouse = (e) => { const portion = (e.clientX / Math.max(1, window.innerWidth)) - 0.5; wind.target = clamp(portion * cfg.gustMax * 2, -cfg.gustMax, cfg.gustMax); };
  const tick = (now) => {
    if (!running) return; maybeChangeWind(now || performance.now());
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < flakes.length; i++) {
      const f = flakes[i]; f.swayPhase += f.swayFreq * 0.02; f.rot += f.rotVel; f.twinklePhase += f.twinkleFreq * 0.02; f.y += f.vy * (0.6 + f.depth * 0.8);
      const windDrift = wind.value * (0.5 + f.depth * 0.8); f.x = f.baseX + Math.sin(f.swayPhase) * f.sway + windDrift * 60; drawFlake(f);
    }
    const w = window.innerWidth, h = window.innerHeight;
    for (let i = flakes.length - 1; i >= 0; i--) { const f = flakes[i]; if (f.y > h + 20 || f.x < -80 || f.x > w + 80) { flakes[i] = mkFlake(true); } }
    raf = requestAnimationFrame(tick);
  };
  const { resize: onResize } = { resize };
  window.addEventListener('resize', onResize);
  window.addEventListener('mousemove', onMouse);
  raf = requestAnimationFrame(tick);
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); window.removeEventListener('mousemove', onMouse); try { document.body.removeChild(canvas); } catch {} }
  return stop;
}

export default startParticles;

// OO wrapper to isolate mouse FX lifecycle in a class API.
export class MouseFX {
  constructor(options = {}) {
    this.options = { ...options };
    this._stop = null;
  }
  start() {
    if (this._stop) return; // already running
    this._stop = startParticles(this.options);
  }
  stop() {
    if (this._stop) {
      try { this._stop(); } catch {}
      this._stop = null;
    }
  }
  isRunning() { return !!this._stop; }
  setEffect(effect) {
    if (this.options.effect === effect) return;
    this.stop();
    this.options.effect = effect;
    this.start();
  }
  updateOptions(patch = {}) {
    this.stop();
    this.options = { ...this.options, ...patch };
    this.start();
  }
}
