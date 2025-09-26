// All particle effects removed. Keeping a minimal no-op API to avoid breaking imports.
// Soft mouse trail effect (gentle, low alpha, smooth fade)
export function startParticles(options = {}) {
  const effect = options.effect || 'trail';
  return startSoftTrail(options);
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

function startSoftTrail(options = {}) {
  const cfg = {
    maxParticles: options.maxParticles ?? 140,
    spawnPerMove: options.spawnPerMove ?? 6,
    baseSize: options.baseSize ?? 2.6,
    sizeJitter: options.sizeJitter ?? 1.8,
    friction: options.friction ?? 0.92,
    gravity: options.gravity ?? -0.006,
    fade: options.fade ?? 0.03,
    zIndex: options.zIndex ?? 5,
    color: options.color ?? '#ffffff',
    baseAlpha: options.baseAlpha ?? 0.65,
    glow: options.glow ?? true,
    clickBurst: options.clickBurst ?? 12,
  };

  let raf = null; let running = true;
  const { canvas, ctx, resize } = commonSetup(cfg.zIndex);
  const parts = [];
  const clamp = (n,a,b)=>Math.max(a,Math.min(b,n));

  let last = { x: window.innerWidth/2, y: window.innerHeight/2 };
  let pending = 0; // distance accumulator for even spacing

  function spawnAt(x, y, n = 1) {
    for (let i=0; i<n; i++) {
      if (parts.length >= cfg.maxParticles) parts.shift();
      const angle = Math.random() * Math.PI * 2;
      const sp = Math.random() * 0.4; // gentle initial drift
      parts.push({
        x, y,
        vx: Math.cos(angle) * sp,
        vy: Math.sin(angle) * sp,
        size: cfg.baseSize + Math.random()*cfg.sizeJitter,
        alpha: cfg.baseAlpha,
      });
    }
  }

  function drawParticle(p) {
    ctx.save();
    ctx.globalAlpha = clamp(p.alpha,0,1);
    if (cfg.glow) { ctx.shadowColor = cfg.color; ctx.shadowBlur = 6; }
    ctx.fillStyle = cfg.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  const onMove = (e) => {
    const x = e.clientX, y = e.clientY;
    const dx = x - last.x, dy = y - last.y;
    const dist = Math.hypot(dx, dy);
    // spawn particles spaced ~every 8px for a continuous soft tail
    const spacing = 8;
    pending += dist;
    while (pending >= spacing) {
      const t = (dist === 0) ? 0 : (1 - (pending - spacing)/dist);
      const sx = last.x + dx * t;
      const sy = last.y + dy * t;
      spawnAt(sx, sy, 1);
      pending -= spacing;
    }
    last.x = x; last.y = y;
  };
  const onClick = (e) => spawnAt(e.clientX, e.clientY, cfg.clickBurst);

  function tick(){
    if (!running) return;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for (let i=parts.length-1; i>=0; i--) {
      const p = parts[i];
      p.vx *= cfg.friction; p.vy = p.vy*cfg.friction + cfg.gravity;
      p.x += p.vx; p.y += p.vy;
      p.alpha -= cfg.fade;
      if (p.alpha <= 0.02) { parts.splice(i,1); continue; }
      drawParticle(p);
    }
    raf = requestAnimationFrame(tick);
  }

  const onResize = () => resize();
  const onVisibility = () => { if (document.hidden) { if (raf) cancelAnimationFrame(raf); raf = null; } else if (!raf) { raf = requestAnimationFrame(tick); } };
  window.addEventListener('resize', onResize);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('click', onClick);
  document.addEventListener('visibilitychange', onVisibility);
  raf = requestAnimationFrame(tick);

  function stop(){
    running = false; if (raf) cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('click', onClick);
    document.removeEventListener('visibilitychange', onVisibility);
    try { canvas.remove(); } catch {}
  }
  return stop;
}

export default startParticles;

export class MouseFX {
  constructor(options = {}) { this.options = { ...options }; this._stop = null; }
  start() { if (this._stop) return; this._stop = startParticles(this.options); }
  stop() { if (!this._stop) return; try { this._stop(); } catch{} this._stop = null; }
  isRunning() { return !!this._stop; }
  setEffect(effect) { if (this.options.effect === effect) return; this.stop(); this.options.effect = effect; this.start(); }
  updateOptions(patch = {}) { this.stop(); this.options = { ...this.options, ...patch }; this.start(); }
}
