import { reducedMotion } from '../core/motion.js';

/**
 * Simulated "live site camera": a procedurally animated construction scene with
 * a slewing tower crane, rising floors, moving crew and a tracked delivery truck.
 * Rendered to <canvas> at ~30fps and paused whenever it is off-screen.
 */
const COL = {
  skyTop: '#0b1218',
  skyLow: '#1a2631',
  far: '#111a22',
  ground: '#0a0f14',
  steel: '#9fb6c8',
  steelDim: '#4b5d6c',
  slab: '#c9d6e0',
  facade: '#16212b',
  window: '#ffb35c',
  accent: '#ff6a13',
  track: '#4fd1a1',
};
const STATUSES = ['LVL 07 · SLAB POUR', 'LVL 07 · REBAR CHECK ✓', 'DELIVERY · CEMENT ×200', 'CRANE · LIFT 14 / 22', 'QA · COLUMN C4 PASSED'];

export function initLiveFeed() {
  const screen = document.querySelector('[data-feed]');
  const canvas = screen?.querySelector('[data-feed-canvas]');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const timeEl = screen.querySelector('[data-feed-time]');
  const statusEl = screen.querySelector('[data-feed-status]');

  let W = 0;
  let H = 0;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

  // Static layers, rebuilt on resize.
  let skyline = [];
  const noise = document.createElement('canvas');
  noise.width = noise.height = 256;
  {
    const nctx = noise.getContext('2d');
    const img = nctx.createImageData(256, 256);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    nctx.putImageData(img, 0, 0);
  }

  function resize() {
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    skyline = [];
    let x = 0;
    while (x < W) {
      const w = W * (0.03 + Math.random() * 0.06);
      skyline.push([x, w, H * (0.08 + Math.random() * 0.22)]);
      x += w + W * 0.004;
    }
    if (!running) draw(performance.now());
  }

  const groundY = () => H * 0.8;

  function bracket(x, y, w, h, label, color) {
    const c = Math.min(w, h) * 0.25;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x, y + c); ctx.lineTo(x, y); ctx.lineTo(x + c, y);
    ctx.moveTo(x + w - c, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + c);
    ctx.moveTo(x + w, y + h - c); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w - c, y + h);
    ctx.moveTo(x + c, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + h - c);
    ctx.stroke();
    ctx.font = `${Math.max(9, W * 0.012)}px "JetBrains Mono", monospace`;
    const tw = ctx.measureText(label).width + 8;
    ctx.fillStyle = color;
    ctx.fillRect(x, y - 15, tw, 13);
    ctx.fillStyle = '#071014';
    ctx.fillText(label, x + 4, y - 5);
  }

  function draw(now) {
    const t = now / 1000;
    const gy = groundY();

    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, gy);
    sky.addColorStop(0, COL.skyTop);
    sky.addColorStop(1, COL.skyLow);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Subtle handheld camera drift
    ctx.save();
    const zoom = 1.02 + Math.sin(t * 0.1) * 0.01;
    ctx.translate(W / 2, H / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-W / 2 + Math.sin(t * 0.3) * 2, -H / 2 + Math.cos(t * 0.23) * 1.5);

    // Far skyline
    ctx.fillStyle = COL.far;
    for (const [x, w, h] of skyline) ctx.fillRect(x, gy - h, w, h);

    // Ground + perspective lines
    ctx.fillStyle = COL.ground;
    ctx.fillRect(-20, gy, W + 40, H - gy + 20);
    ctx.strokeStyle = 'rgba(143,184,214,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = -10; i <= 10; i++) {
      ctx.moveTo(W / 2 + i * W * 0.02, gy);
      ctx.lineTo(W / 2 + i * W * 0.16, H + 20);
    }
    for (let k = 1; k < 5; k++) {
      const y = gy + (H - gy) * (k / 5) ** 1.6;
      ctx.moveTo(-20, y);
      ctx.lineTo(W + 20, y);
    }
    ctx.stroke();

    // Building under construction — floors rise on a 60s cycle
    const bx = W * 0.3;
    const bw = W * 0.3;
    const fh = H * 0.052;
    const totalFloors = 11;
    const cycle = (t % 60) / 60;
    const built = 4 + cycle * (totalFloors - 4);
    const full = Math.floor(built);
    const part = built - full;

    for (let i = 0; i < full; i++) {
      const y = gy - (i + 1) * fh;
      const enclosed = i < full - 2;
      if (enclosed) {
        ctx.fillStyle = COL.facade;
        ctx.fillRect(bx, y, bw, fh);
        for (let k = 0; k < 8; k++) {
          const on = Math.sin(i * 7.3 + k * 3.1 + Math.floor(t / 3)) > 0.55;
          ctx.fillStyle = on ? COL.window : 'rgba(143,184,214,0.12)';
          ctx.globalAlpha = on ? 0.75 : 1;
          ctx.fillRect(bx + bw * (0.05 + k * 0.118), y + fh * 0.28, bw * 0.08, fh * 0.46);
        }
        ctx.globalAlpha = 1;
      }
      // Frame
      ctx.strokeStyle = enclosed ? COL.steelDim : COL.steel;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let c = 0; c <= 6; c++) {
        const cx = bx + (bw * c) / 6;
        ctx.moveTo(cx, y);
        ctx.lineTo(cx, y + fh);
      }
      ctx.stroke();
      ctx.fillStyle = COL.slab;
      ctx.fillRect(bx - 3, y - 2, bw + 6, 3);
    }
    // Floor in progress: columns rising, formwork glowing
    const py = gy - (full + 1) * fh;
    ctx.strokeStyle = COL.accent;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let c = 0; c <= 6; c++) {
      const cx = bx + (bw * c) / 6;
      ctx.moveTo(cx, py + fh);
      ctx.lineTo(cx, py + fh - fh * Math.min(1, part * 1.6));
    }
    ctx.stroke();
    if (part > 0.6) {
      ctx.fillStyle = COL.accent;
      ctx.fillRect(bx - 3, py - 2, (bw + 6) * ((part - 0.6) / 0.4), 3);
    }
    // Scaffold on the right face
    ctx.strokeStyle = 'rgba(159,182,200,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const sx = bx + bw + 4;
    const topY = gy - (full + 1) * fh;
    for (let x = sx; x <= sx + W * 0.03; x += W * 0.015) { ctx.moveTo(x, gy); ctx.lineTo(x, topY); }
    for (let y = gy; y >= topY; y -= fh / 2) { ctx.moveTo(sx, y); ctx.lineTo(sx + W * 0.03, y); }
    ctx.stroke();

    // Tower crane
    const mx = W * 0.72;
    const top = H * 0.1;
    ctx.strokeStyle = COL.steel;
    ctx.lineWidth = 1;
    ctx.beginPath();
    const mw = W * 0.012;
    ctx.moveTo(mx - mw, gy); ctx.lineTo(mx - mw, top);
    ctx.moveTo(mx + mw, gy); ctx.lineTo(mx + mw, top);
    for (let y = gy, k = 0; y > top; y -= mw * 2, k++) {
      ctx.moveTo(mx - mw, y);
      ctx.lineTo(mx + mw, y - mw * 2);
      ctx.moveTo(mx - mw, y);
      ctx.lineTo(mx + mw, y);
    }
    ctx.stroke();
    const slew = Math.sin(t * 0.18) * 0.9 + 0.35; // radians around the mast
    const proj = Math.cos(slew);
    const jibL = W * 0.46 * proj;
    const cjL = -W * 0.12 * proj;
    ctx.beginPath();
    ctx.moveTo(mx + cjL, top); ctx.lineTo(mx - jibL, top);
    ctx.moveTo(mx + cjL, top - 4); ctx.lineTo(mx - jibL, top - 2);
    ctx.moveTo(mx, top); ctx.lineTo(mx, top - H * 0.06);
    ctx.lineTo(mx - jibL * 0.7, top - 3);
    ctx.moveTo(mx, top - H * 0.06); ctx.lineTo(mx + cjL, top - 4);
    const steps = 18;
    for (let i = 0; i < steps; i++) {
      const x0 = mx - (jibL * i) / steps;
      const x1 = mx - (jibL * (i + 0.5)) / steps;
      ctx.moveTo(x0, top); ctx.lineTo(x1, top - 3);
    }
    ctx.stroke();
    ctx.fillStyle = COL.steelDim;
    ctx.fillRect(mx + cjL - Math.sign(proj) * 10 - 6, top - 2, 12, 12); // counterweight
    ctx.fillStyle = COL.accent;
    ctx.fillRect(mx - 6, top + 2, 12, 9); // cab

    // Trolley + load
    const trolley = mx - jibL * (0.45 + Math.sin(t * 0.27) * 0.3);
    const loadY = top + H * (0.25 + Math.sin(t * 0.4) * 0.12);
    ctx.strokeStyle = COL.accent;
    ctx.beginPath();
    ctx.moveTo(trolley, top);
    ctx.lineTo(trolley, loadY);
    ctx.stroke();
    const lw = W * 0.06;
    ctx.fillStyle = '#c9d6e0';
    ctx.fillRect(trolley - lw / 2, loadY, lw, 4);
    ctx.fillRect(trolley - lw / 2, loadY + 6, lw, 4);

    // Crew on the working deck
    const crew = [];
    for (let i = 0; i < 4; i++) {
      const wx = bx + bw * (0.15 + 0.7 * (0.5 + 0.5 * Math.sin(t * (0.25 + i * 0.07) + i * 2)));
      const wy = gy - full * fh;
      crew.push([wx, wy]);
      ctx.fillStyle = i === 1 ? COL.accent : '#e8ecf0';
      ctx.fillRect(wx - 1.5, wy - 8, 3, 6);
      ctx.beginPath();
      ctx.arc(wx, wy - 10, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Delivery truck crossing the foreground
    const tp = (t % 22) / 22;
    const tx = -W * 0.2 + tp * W * 1.4;
    const ty = gy + (H - gy) * 0.45;
    const tw = W * 0.12;
    const th = H * 0.06;
    ctx.fillStyle = '#26343f';
    ctx.fillRect(tx, ty - th, tw * 0.72, th);
    ctx.fillStyle = '#3a4c5a';
    ctx.fillRect(tx + tw * 0.74, ty - th * 0.75, tw * 0.26, th * 0.75);
    ctx.fillStyle = '#0a0f14';
    for (const wx of [0.15, 0.55, 0.88]) {
      ctx.beginPath();
      ctx.arc(tx + tw * wx, ty, th * 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Tracking overlays (drawn in screen space)
    if (tx > 0 && tx + tw < W) bracket(tx - 6, ty - th - 6, tw + 12, th + 12, 'TRUCK 0.97', COL.track);
    const cx0 = Math.min(...crew.map((c) => c[0])) - 8;
    const cx1 = Math.max(...crew.map((c) => c[0])) + 8;
    bracket(cx0, crew[0][1] - 18, cx1 - cx0, 22, `CREW ×${crew.length} 0.94`, COL.track);
    bracket(trolley - lw / 2 - 6, loadY - 6, lw + 12, 22, 'LOAD 2.4T', COL.accent);

    // Sensor noise
    ctx.globalAlpha = 0.07;
    ctx.globalCompositeOperation = 'overlay';
    const ox = Math.random() * 256;
    const oy = Math.random() * 256;
    for (let x = -ox; x < W; x += 256) for (let y = -oy; y < H; y += 256) ctx.drawImage(noise, x, y);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  // HUD clock + rotating status
  const pad = (n) => String(n).padStart(2, '0');
  let statusIdx = 0;
  let lastSec = -1;
  function updateHud() {
    const d = new Date();
    const s = d.getSeconds();
    if (s === lastSec) return;
    lastSec = s;
    timeEl.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(s)}`;
    if (s % 4 === 0) statusEl.textContent = STATUSES[statusIdx++ % STATUSES.length];
  }

  // Loop (~30fps), paused when off-screen or tab hidden
  let running = false;
  let raf = 0;
  let last = 0;
  const loop = (now) => {
    raf = requestAnimationFrame(loop);
    if (now - last < 33) return;
    last = now;
    draw(now);
    updateHud();
  };
  const play = () => {
    if (running || reducedMotion || document.hidden) return;
    running = true;
    raf = requestAnimationFrame(loop);
  };
  const pause = () => {
    running = false;
    cancelAnimationFrame(raf);
  };

  new ResizeObserver(resize).observe(canvas);
  let onScreen = false;
  new IntersectionObserver(([e]) => {
    onScreen = e.isIntersecting;
    onScreen ? play() : pause();
  }).observe(canvas);
  document.addEventListener('visibilitychange', () => (document.hidden ? pause() : onScreen && play()));

  resize();
  updateHud();
}
