/* GGF homepage hero embers.
   The approved four-layer ember effect (section 2 below is unchanged from the tested version),
   fitted to the hero box on the homepage instead of the whole window. */
(() => {
const stage = document.getElementById("hero-stage");
if (!stage) return;

// The ember code measures "the screen" and reads mouse positions. Here those mean the hero box.
let innerWidth = stage.clientWidth, innerHeight = stage.clientHeight;
const resizeFns = [];
const toLocal = p => { const r = stage.getBoundingClientRect(); return { clientX: p.clientX - r.left, clientY: p.clientY - r.top }; };
const addEventListener = (type, fn, opts) => {
  if (type === "resize") { resizeFns.push(fn); return; }
  if (type === "pointermove") return window.addEventListener(type, e => fn(toLocal(e)), opts);
  if (type === "touchmove") return window.addEventListener(type, e => { if (e.touches.length) fn({ touches: [toLocal(e.touches[0])] }); }, opts);
  return window.addEventListener(type, fn, opts);
};
new ResizeObserver(() => {
  innerWidth = stage.clientWidth; innerHeight = stage.clientHeight;
  resizeFns.forEach(f => f());
}).observe(stage);

// Pause the embers while the hero is scrolled out of view (saves battery and CPU).
let visible = true, waiting = [];
new IntersectionObserver(entries => {
  visible = entries[entries.length - 1].isIntersecting;
  if (visible) { const w = waiting; waiting = []; w.forEach(cb => window.requestAnimationFrame(cb)); }
}).observe(stage);
const requestAnimationFrame = cb => { if (visible) window.requestAnimationFrame(cb); else waiting.push(cb); };

/* Shared: where the 16:9 picture sits on screen (cover-fit, like object-fit: cover) */
const PIC = { w: 0, h: 0, x: 0, y: 0 };
const fitPic = () => {
  const W = innerWidth, H = innerHeight, sc = Math.max(W / 16, H / 9);
  PIC.w = 16 * sc; PIC.h = 9 * sc; PIC.x = (W - PIC.w) / 2; PIC.y = (H - PIC.h) / 2;
};
fitPic();

/* ===================== 2. INTERACTIVE EMBERS — four depth layers ===================== */
(() => {
  // ---- easy settings ----
  const FULL_UNTIL = 0.70;     // embers are at full strength below this height (fraction of picture height, 0 = top)
  const GONE_AT = 0.55;        // ...and have faded out completely by this height (a little above his belt)
  const RISE = 28;             // average float-up speed (px per second on a 1000px-tall screen)
  const SWIRL = 26;            // strength of the swirling air currents
  const SWIRL_SIZE = 260;      // size of the swirls (px on a 1000px-tall screen)
  const SWIRL_CHANGE = 0.12;   // how quickly the swirl pattern slowly changes
  const TRAIL = 0.45;          // length of the soft glow trail behind each ember (seconds of travel)
  const SMOKE = 1.3;           // strength of the glowing red smoke haze (0 = none)
  const FIRE_GLOW = 1;         // warm firelight from below (0 = none)
  const PUSH_RADIUS = 150;     // how close the mouse has to be to push embers (px on a 1000px-tall screen)
  const PUSH = 1.0;            // how hard the mouse pushes them away
  const SPREAD = 0.2;          // used by the smoke

  // The four layers, back to front. "behind" layers are hidden wherever his body is.
  const LAYERS = [
    { name: "far",    behind: true,  count: 150, size: [0.5, 1.1], speed: 0.45, swirl: 0.6, spread: 0.42, bright: 0.5,  halo: 0.10, push: 0.4 },
    { name: "cloak",  behind: true,  count: 110, size: [1.0, 2.1], speed: 0.7,  swirl: 0.8, spread: 0.24, bright: 0.85, halo: 0.14, push: 0.7 },
    { name: "body",   behind: false, count: 150, size: [1.8, 3.6], speed: 1.0,  swirl: 1.0, spread: 0.13, bright: 1.15, halo: 0.2,  push: 1.0 },
    { name: "close",  behind: false, count: 16,  size: [7, 13],    speed: 1.6,  swirl: 1.3, spread: 0.36, bright: 0.5,  halo: 0.0,  push: 1.2, dark: true },
  ];

  const cv = document.getElementById("embers"), ctx = cv.getContext("2d");
  const scv = document.getElementById("smoke"), sx = scv.getContext("2d");
  let W = 0, H = 0, DPR = 1, S = 1, on = true, rect = PIC;
  const sm = document.createElement("canvas"), sctx = sm.getContext("2d");
  const resize = () => {
    DPR = Math.min(devicePixelRatio || 1, 1.5);
    W = innerWidth; H = innerHeight; S = H / 1000; fitPic();
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    scv.width = Math.round(W / 2); scv.height = Math.round(H / 2);
    sm.width = Math.max(64, Math.round(W / 5)); sm.height = Math.max(32, Math.round(H / 5));
  };
  resize(); addEventListener("resize", resize);

  const bottomY = () => Math.min(H, rect.y + rect.h);
  const topY = () => rect.y + rect.h * GONE_AT;
  const beltY = topY;
  const fullY = () => Math.min(bottomY() - 10 * S, rect.y + rect.h * FULL_UNTIL);
  const centreX = () => rect.x + rect.w * 0.5;

  // his silhouette (thighs to head), used to hide the back layers behind him
  const bodyMask = new Image(); bodyMask.src = "body_mask.png";

  // ---- smoke texture: fractal noise, tinted like smoke lit from below by fire ----
  const NW = 256, NH = 256, noise = document.createElement("canvas");
  noise.width = NW; noise.height = NH;
  {
    const lat = (n, seed) => { const g = new Float32Array((n + 1) * (n + 1)); let x = seed;
      for (let i = 0; i < g.length; i++) { x = (x * 16807) % 2147483647; g[i] = x / 2147483647; }
      for (let i = 0; i <= n; i++) { g[i * (n + 1) + n] = g[i * (n + 1)]; g[n * (n + 1) + i] = g[i]; } return g; };
    const val = new Float32Array(NW * NH);
    let amp = 1, tot = 0;
    for (const [n, seed] of [[4, 11], [8, 23], [16, 37], [32, 53]]) {
      const g = lat(n, seed);
      for (let y = 0; y < NH; y++) for (let x = 0; x < NW; x++) {
        const fx = x / NW * n, fy = y / NH * n, ix = fx | 0, iy = fy | 0, tx = fx - ix, ty = fy - iy;
        const qx = tx * tx * (3 - 2 * tx), qy = ty * ty * (3 - 2 * ty), r = n + 1;
        const a = g[iy * r + ix], b = g[iy * r + ix + 1], c = g[(iy + 1) * r + ix], d = g[(iy + 1) * r + ix + 1];
        val[y * NW + x] += amp * (a + (b - a) * qx + (c - a) * qy + (a - b - c + d) * qx * qy);
      }
      tot += amp; amp *= 0.5;
    }
    const id = noise.getContext("2d").createImageData(NW, NH);
    for (let i = 0; i < val.length; i++) {
      let v = val[i] / tot; v = Math.max(0, (v - 0.3) / 0.7); v = Math.pow(v, 1.4);
      id.data[i * 4] = 200; id.data[i * 4 + 1] = 28 + 40 * v; id.data[i * 4 + 2] = 4;
      id.data[i * 4 + 3] = Math.min(255, v * 255);
    }
    noise.getContext("2d").putImageData(id, 0, 0);
  }

  const glow = document.createElement("canvas"); glow.width = glow.height = 64;
  { const g = glow.getContext("2d"), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, "rgba(255,95,30,1)"); r.addColorStop(0.3, "rgba(230,50,12,.35)"); r.addColorStop(1, "rgba(150,15,0,0)");
    g.fillStyle = r; g.fillRect(0, 0, 64, 64); }
  // soft, out-of-focus blob for the close, darker layer
  const bokeh = document.createElement("canvas"); bokeh.width = bokeh.height = 64;
  { const g = bokeh.getContext("2d"), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, "rgba(175,32,8,1)"); r.addColorStop(0.45, "rgba(150,24,6,.8)"); r.addColorStop(0.75, "rgba(110,14,2,.3)"); r.addColorStop(1, "rgba(80,8,0,0)");
    g.fillStyle = r; g.fillRect(0, 0, 64, 64); }

  const gauss = () => { let u = 0; while (!u) u = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.2832 * Math.random()); };
  const rand = (a, b) => a + Math.random() * (b - a);

  // Swirling air: the curl of a smooth, slowly changing field, so embers drift together in swirls.
  const psi = (x, y, t) => {
    const k = 6.2832 / (SWIRL_SIZE * S);
    return Math.sin(x * k + t * 0.7) * Math.cos(y * k * 0.8 - t * 0.5)
         + 0.6 * Math.sin((x * 0.6 + y) * k * 1.7 + t * 0.9 + 1.3)
         + 0.35 * Math.cos((x - y * 0.7) * k * 2.9 - t * 1.2 + 2.1);
  };
  const curl = (x, y, t) => {
    const e = 4 * S, q = SWIRL_SIZE * S / 6.2832 / (2 * e);
    return [(psi(x, y + e, t) - psi(x, y - e, t)) * q, -(psi(x + e, y, t) - psi(x - e, y, t)) * q];
  };

  const spawn = (p, L, anywhere) => {
    p.L = L;
    p.x = centreX() + gauss() * rect.w * L.spread;
    const by = bottomY(), top = topY();
    p.y = anywhere ? rand(top, by) : by + rand(0, 40 * S) + (L.dark ? 60 * S : 0);
    p.base = L.speed * rand(0.7, 1.3) * RISE * S;
    p.vx = 0; p.vy = -p.base;
    p.thick = rand(L.size[0], L.size[1]);
    p.heat = rand(0.7, 1); p.cool = rand(0.05, 0.18);
    p.fl = rand(0.6, 2.2);
    p.spin = Math.random() < 0.3 ? rand(1.2, 3.5) : 0;
    p.ph = rand(0, 6.28); p.turb = rand(0.7, 1.3); p.tOff = rand(0, 0.6);
    return p;
  };
  const layers = LAYERS.map(L => ({ L, ps: Array.from({ length: L.count }, () => spawn({}, L, true)) }));

  const m = { x: -1e4, y: -1e4, vx: 0, vy: 0, t: performance.now(), active: false };
  const move = (x, y) => {
    const now = performance.now(), dt = Math.max(8, now - m.t) / 1000;
    if (m.active) { m.vx += ((x - m.x) / dt - m.vx) * 0.5; m.vy += ((y - m.y) / dt - m.vy) * 0.5; }
    m.x = x; m.y = y; m.t = now; m.active = true;
  };
  addEventListener("pointermove", e => move(e.clientX, e.clientY));
  addEventListener("touchmove", e => move(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
  addEventListener("touchend", () => { m.active = false; m.x = m.y = -1e4; });
  document.addEventListener("mouseleave", () => { m.active = false; m.x = m.y = -1e4; });

  const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const heightAlpha = y => {
    const by = bottomY();
    return smooth(by + 25 * S, by - 25 * S, y) * (1 - smooth(fullY(), topY(), y));
  };

  const updateAndDraw = (P, L, dt, t, R, moving) => {
    const by = bottomY(), top = topY();
    for (const p of P) {
      const dx = p.x - m.x, dy = p.y - m.y, d = Math.hypot(dx, dy);
      if (d < R && d > 0.1) {
        const f = (1 - d / R) ** 2 * PUSH * L.push, strength = (90 + 700 * moving) * S;
        p.vx += (dx / d * strength + m.vx * 0.8 * moving) * f * dt * 6;
        p.vy += (dy / d * strength + m.vy * 0.8 * moving) * f * dt * 6;
      }
      const [cx, cy] = curl(p.x, p.y, t * SWIRL_CHANGE * 3 + p.tOff);
      const tx = cx * SWIRL * S * p.turb * L.swirl, ty = -p.base + cy * SWIRL * S * p.turb * 0.8 * L.swirl;
      p.vx += (tx - p.vx) * Math.min(1, dt * 0.9);
      p.vy += (ty - p.vy) * Math.min(1, dt * 0.9);
      const sp = Math.hypot(p.vx, p.vy), cap = 600 * S;
      if (sp > cap) { p.vx *= cap / sp; p.vy *= cap / sp; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.y < top - 40 * S || p.x < -80 || p.x > W + 80 || p.y > H + 200 * S) { spawn(p, L, false); continue; }

      let a = heightAlpha(p.y) * L.bright * (0.72 + 0.28 * Math.sin(t * p.fl + p.ph));
      if (p.spin) a *= 0.45 + 0.55 * Math.abs(Math.sin(t * p.spin + p.ph));
      if (a < 0.015) continue;
      const w = p.thick * Math.max(0.7, S);
      const ux = p.vx / (sp || 1), uy = p.vy / (sp || 1);

      if (L.dark) {   // close to the camera: big, soft, darker red, out of focus
        const L2 = Math.min(sp * TRAIL * 0.8, w * 2.5), r = w * 1.6;
        ctx.globalAlpha = a * 0.55;
        for (let i = 0; i < 3; i++) {
          const k = i / 2, px = p.x - ux * L2 * k, py = p.y - uy * L2 * k, rr = r * (1 - 0.25 * k);
          ctx.drawImage(bokeh, px - rr, py - rr, rr * 2, rr * 2);
        }
        continue;
      }
      const rise = Math.max(0, Math.min(1, (by - p.y) / Math.max(1, by - top)));
      const heat = Math.max(0.25, p.heat - rise * p.cool * 3);
      const g = Math.round(38 + 52 * heat), b = Math.round(10 + 22 * heat * heat);
      if (L.halo) {
        ctx.globalAlpha = a * L.halo; const gs = w * 3.5;
        ctx.drawImage(glow, p.x - gs, p.y - gs, gs * 2, gs * 2);
      }
      const Lt = Math.min(sp * TRAIL, w * 9);
      ctx.strokeStyle = `rgb(${Math.round(200 + 55 * heat)},${g},${b})`;
      ctx.globalAlpha = a * 0.18; ctx.lineWidth = w * 0.6;
      ctx.beginPath(); ctx.moveTo(p.x - ux * Lt, p.y - uy * Lt); ctx.lineTo(p.x - ux * Lt * 0.35, p.y - uy * Lt * 0.35); ctx.stroke();
      ctx.globalAlpha = a * 0.4; ctx.lineWidth = w * 0.85;
      ctx.beginPath(); ctx.moveTo(p.x - ux * Lt * 0.4, p.y - uy * Lt * 0.4); ctx.lineTo(p.x - ux * Lt * 0.1, p.y - uy * Lt * 0.1); ctx.stroke();
      ctx.globalAlpha = a * (0.55 + 0.45 * heat); ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(p.x - ux * Lt * 0.12, p.y - uy * Lt * 0.12); ctx.lineTo(p.x + 0.01, p.y); ctx.stroke();
      if (heat > 0.7 && w > 1.6) {
        ctx.globalAlpha = a * (heat - 0.6) * 0.8;
        ctx.strokeStyle = "rgb(255,125,55)"; ctx.lineWidth = w * 0.45;
        ctx.beginPath(); ctx.moveTo(p.x - ux * Lt * 0.08, p.y - uy * Lt * 0.08); ctx.lineTo(p.x + 0.01, p.y); ctx.stroke();
      }
    }
  };

  let last = performance.now();
  const frame = now => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (document.hidden) { requestAnimationFrame(frame); return; }
    m.vx *= Math.pow(0.02, dt); m.vy *= Math.pow(0.02, dt);
    const R = PUSH_RADIUS * S, moving = Math.min(1, Math.hypot(m.vx, m.vy) / 600);
    const t = now / 1000, top = topY(), by = bottomY();

    sx.setTransform(1, 0, 0, 1, 0, 0); sx.clearRect(0, 0, scv.width, scv.height);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H);
    if (!on) { requestAnimationFrame(frame); return; }

    {
      const k2 = scv.width / W;
      sx.setTransform(k2, 0, 0, k2, 0, 0);
      if (FIRE_GLOW > 0) {
        const fl = 0.8 + 0.12 * Math.sin(t * 1.7) + 0.08 * Math.sin(t * 4.3 + 1);
        const rg = sx.createRadialGradient(centreX(), by + 40 * S, 0, centreX(), by + 40 * S, rect.w * 0.33);
        rg.addColorStop(0, `rgba(255,90,20,${0.22 * fl * FIRE_GLOW})`); rg.addColorStop(0.5, `rgba(200,40,8,${0.08 * fl * FIRE_GLOW})`); rg.addColorStop(1, "rgba(120,10,0,0)");
        sx.globalCompositeOperation = "lighter"; sx.fillStyle = rg;
        sx.save(); sx.translate(centreX(), by); sx.scale(1, 0.55); sx.translate(-centreX(), -by);
        sx.fillRect(centreX() - rect.w * 0.4, by - rect.h, rect.w * 0.8, rect.h * 1.2); sx.restore();
      }
      if (SMOKE > 0) {
        const k = sm.width / W, bandTop = top - (by - top) * 0.15, bandH = (by - bandTop) * 1.1;
        sctx.setTransform(1, 0, 0, 1, 0, 0); sctx.globalCompositeOperation = "source-over";
        sctx.clearRect(0, 0, sm.width, sm.height);
        const tile = rect.w * k * 0.55;
        for (const [sp, off, a] of [[5, 0, 0.8], [9, 0.37, 0.6]]) {
          const oy = (t * sp * S * k) % tile, ox = (off * tile + Math.sin(t * 0.05 + off * 9) * tile * 0.08 + tile * 4) % tile;
          sctx.globalAlpha = a;
          for (let x = -ox; x < sm.width; x += tile)
            for (let y = bandTop * k - oy; y < (bandTop + bandH) * k; y += tile)
              sctx.drawImage(noise, x, y, tile, tile);
        }
        sctx.globalAlpha = 1; sctx.globalCompositeOperation = "destination-in";
        const vg = sctx.createLinearGradient(0, by * k, 0, top * k);
        vg.addColorStop(0, "rgba(0,0,0,.35)"); vg.addColorStop(0.25, "rgba(0,0,0,1)"); vg.addColorStop(0.7, "rgba(0,0,0,.55)"); vg.addColorStop(1, "rgba(0,0,0,0)");
        sctx.fillStyle = vg; sctx.fillRect(0, 0, sm.width, sm.height);
        const hg = sctx.createLinearGradient(0, 0, sm.width, 0), cx = centreX() * k / sm.width, sw = rect.w * SPREAD * 1.8 * k / sm.width;
        hg.addColorStop(0, "rgba(0,0,0,0)"); hg.addColorStop(Math.max(0, cx - sw), "rgba(0,0,0,0)");
        hg.addColorStop(cx, "rgba(0,0,0,1)"); hg.addColorStop(Math.min(1, cx + sw), "rgba(0,0,0,0)"); hg.addColorStop(1, "rgba(0,0,0,0)");
        sctx.fillStyle = hg; sctx.fillRect(0, 0, sm.width, sm.height);
        sx.globalCompositeOperation = "lighter"; sx.globalAlpha = Math.min(1, 0.55 * SMOKE);
        sx.drawImage(sm, 0, 0, W, H); sx.globalAlpha = 1;
      }
    }


    ctx.lineCap = "round";
    // back layers (behind him)...
    ctx.globalCompositeOperation = "lighter";
    for (const { L, ps } of layers) if (L.behind) updateAndDraw(ps, L, dt, t, R, moving);
    // ...cut out wherever his body is
    if (bodyMask.complete && bodyMask.naturalWidth) {
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "destination-out";
      ctx.drawImage(bodyMask, rect.x, rect.y, rect.w, rect.h);
    }
    // front layers (over his body, then close to the camera)
    for (const { L, ps } of layers) if (!L.behind) {
      ctx.globalCompositeOperation = L.dark ? "source-over" : "lighter";
      updateAndDraw(ps, L, dt, t, R, moving);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  const btn = document.getElementById("toggle");
  btn.addEventListener("click", () => { on = !on; btn.textContent = "Embers: " + (on ? "on" : "off"); });
})();
})();
