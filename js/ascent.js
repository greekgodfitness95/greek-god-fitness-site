/* "The Ascent" – scroll-driven journey.
   Mountain -> temple doorway -> darkness -> the Spartan.
   One rAF loop; only transforms, opacity and clip-path change, so it stays smooth on phones. */
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = s => document.querySelector(s);
  const nav = $("#nav"), intro = $(".ascent"), stageEl = $("#stage"), plate = $("#plate"), detail = $("#detail"), peak = $("#peak");
  if (!intro || !plate) return;
  const hint = intro.querySelector(".hint"), cl = intro.querySelector(".clouds-left"), cr = intro.querySelector(".clouds-right");
  const back = intro.querySelector(".clouds-back"), mist = intro.querySelector(".mist");
  const spartan = $("#hero-stage");
  const oly = $(".olympus"), sunset = oly && oly.querySelector(".sunset");
  const gal = oly ? [...oly.querySelectorAll(".gallery img")] : [];
  const desc = $(".descent"), dPlate = desc && desc.querySelector(".d-plate"), dCB = desc && desc.querySelector(".d-cb"),
        dBank = desc && desc.querySelector(".d-bank"), dFog = desc && desc.querySelector(".d-fog"), dLoc = desc && desc.querySelector(".d-loc"),
        dScene = desc && desc.querySelector(".d-scene"), dPin = $("#d-pin"), dText = desc && desc.querySelector(".d-text"),
        dPeak = $("#d-peak"), dDetail = $("#d-detail");
  // Location descent, in vh of scrolling (must add up to the .descent height minus one screen, css/ascent.css):
  // a black hold after Meet the Coach, a zoom out from inside the temple doorway, then the original descent.
  const D_BLACK = 10, D_ZOOM = 140, D_OLD = 320, D_ALL = D_BLACK + D_ZOOM + D_OLD;
  // for the menu's Location shortcut (js/goto-location.js): where the zoom out starts, and where we are back at the full mountain
  window.GGF_DESCENT = { zoom: D_BLACK / D_ALL, wide: (D_BLACK + D_ZOOM + 0.25 * D_OLD) / D_ALL };
  // city picture (taller than the screen): Limassol seafront under the mountain. Fractions of the picture.
  const SCENE_R = 1264 / 1536, CITY_PIN = [0.511, 0.512], CITY_LOC_Y = 0.36, CITY_END = 0.20;
  const olyHead = oly ? [...oly.querySelectorAll(".olympus-inner h2, .olympus-inner .btn")] : [];

  // positions inside the pictures, as fractions of the picture
  const FX = 0.4993, FY = 0.2723, FW = 0.113, DY = 0.3247;          // mountain: lettering band, temple doorway (close-up door)
  const CX = 0.42637, CY = 0.22232, CW = 0.14412, CH = 0.17704; // sharp close-up of the temple, placed over the mountain picture
  const FYC = 0.2718, DOORW = 0.0123;                              // lettering band and door width on the close-up
  const PX = 0.30599, PY = 0.33565, PW = 0.39062, PH = 0.35880; // sharper copy of the mountain top around the temple
  const MT = 342 / 620;                                             // mountain timing: new scroll length / old

  let W = 0, H = 0, pw = 0, ph = 0, px = 0, py = 0, wasOn = null;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => 1 - Math.pow(1 - t, 3);
  const inout = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  function size() {
    W = stageEl.clientWidth || innerWidth; H = stageEl.clientHeight || innerHeight;
    pw = Math.max(W, H * 16 / 9); ph = pw * 9 / 16; px = (W - pw) / 2; py = (H - ph) / 2;
    for (const el of [plate, dPlate].filter(Boolean)) {
      el.style.width = pw + "px"; el.style.height = ph + "px"; el.style.left = px + "px"; el.style.top = py + "px";
    }
    queue();
  }
  // browsers drop a hidden video's picture; a tiny seek makes the current frame paint again
  const nudge = v => { if (v.readyState >= 1) { try { v.currentTime = Math.max(0.001, v.currentTime + 0.0001); } catch (e) {} } };
  const progress = sec => { const r = sec.getBoundingClientRect(); return clamp(-r.top / Math.max(1, r.height - H)); };

  // the walk follows the scroll through a short glide, so mouse-wheel steps don't jolt the camera
  let ps = null, lastT = 0;
  function frame(now) {
    ticking = false;
    const pRaw = progress(intro), p = pRaw;
    now = now || performance.now();
    const dt = Math.min(0.1, Math.max(0, (now - lastT) / 1000)); lastT = now;
    if (ps === null || Math.abs(p - ps) > 0.2) ps = p;
    else ps += (p - ps) * (1 - Math.exp(-dt / 0.14));
    if (Math.abs(p - ps) > 0.00005) queue(); else ps = p;
    if (nav) nav.classList.toggle("clear", p < 0.9 && intro.getBoundingClientRect().bottom > H * 0.5);
    if (reduce) return;

    // The mountain part keeps exactly its old pace: it used the first 39% of a 620vh scroll,
    // which is now the first 71% of a 342vh one (the corridor that followed is gone).
    {
    const p = pRaw * MT;
    /* 1. Mountain: fly up to the temple, then into its doorway */
    const z1 = inout(seg(p, 0.0, 0.26)), z2 = seg(p, 0.26, 0.38), shift = seg(p, 0.24, 0.36);
    const fill = Math.min(14, (W * 1.04) / (FW * pw));
    const sDoor = Math.min(48, Math.max(fill * 2, (W * 1.3) / (DOORW * pw))); // capped: keeps memory low on slow devices
    const S = (1 + (fill - 1) * z1) * Math.pow(sDoor / fill, z2);
    const fx = FX * pw, fy = lerp(FY, DY, shift) * ph;
    const rx = px + fx, ry = py + FY * ph;
    const sx = rx + (W / 2 - rx) * z1, sy = ry + (H * 0.42 - ry) * z1 + H * 0.08 * shift;
    const Tx = sx - px - S * fx, Ty = sy - py - S * fy;
    plate.style.transform = `translate3d(${Tx}px,${Ty}px,0) scale(${S})`;
    const plateOp = 1 - seg(p, 0.36, 0.39);
    // Phones (iPhone Safari especially) throw away huge picture layers to save memory, then show
    // only the temple when you scroll back to the top. So: once the screen is entirely inside the
    // solid part of the temple close-up (around the door), the mountain and peak behind it can't be
    // seen and stop being drawn - that is exactly when they would otherwise be blown up 10-48x.
    const dL = px + Tx + S * CX * pw, dT = py + Ty + S * CY * ph, dW = S * CW * pw, dH = S * CH * ph;
    const covered = dL + 0.22 * dW <= 0 && dL + 0.80 * dW >= W && dT + 0.19 * dH <= 0 && dT + 0.80 * dH >= H;
    plate.style.opacity = plateOp;
    plate.style.visibility = plateOp > 0 && !covered ? "visible" : "hidden";

    // lettering is drawn on top at real size, so it stays sharp at any zoom
    // the temple is baked into the mountain picture; this full-resolution copy sits exactly on top of it
    // so it stays sharp at any zoom (the mountain picture only has ~170px of temple)
    const dOp = plateOp;
    // sized with width/height (not scale) so the browser draws them from the full-resolution files
    // Never lay a picture out bigger than MAXPX; past that it is magnified instead (same look, far less
    // memory - beyond that size the picture is already shown larger than its own pixels anyway).
    const MAXPX = 4096;
    const lay = (el, x, y, w, h, hide) => {
      if (!el) return;
      const on = dOp > 0 && !hide;
      el.style.opacity = dOp.toFixed(3);
      el.style.visibility = on ? "visible" : "hidden";
      if (on) {
        const ew = S * w * pw, eh = S * h * ph, k = Math.min(1, MAXPX / Math.max(ew, eh));
        el.style.width = (ew * k) + "px"; el.style.height = (eh * k) + "px";
        el.style.transformOrigin = "0 0";
        el.style.transform = `translate3d(${px + Tx + S * x * pw}px,${py + Ty + S * y * ph}px,0)` + (k < 1 ? ` scale(${1 / k})` : "");
      }
    };
    lay(peak, PX, PY, PW, PH, covered);
    lay(detail, CX, CY, CW, CH, false);
    // the Greek God Fitness logo is carved into the temple pictures themselves (no separate lettering)

    const part = ease(seg(p, 0, 0.2));
    cl.style.transform = `translate3d(${-part * 45}%,${part * 18}%,0)`; cl.style.opacity = 1 - part * .95;
    cr.style.transform = `translate3d(${part * 45}%,${part * 18}%,0) scaleX(-1)`; cr.style.opacity = 1 - part * .95;
    back.style.opacity = .75 * (1 - seg(p, 0.1, 0.24));
    hint.style.opacity = 1 - seg(p, 0, 0.025);

    }

    /* 2. Through the doorway into darkness, and out of it the Spartan (glided scroll position from here) */
    {
    const p = ps;
    // darkness of the doorway (same moment as before), lifting as the Spartan appears
    mist.style.opacity = (seg(p * MT, 0.33, 0.38) * (1 - seg(p, 0.80, 0.90))).toFixed(3);

    /* 3. Out of the darkness, the Spartan fades in */
    // kept out of view until you are through the doorway, so the Spartan and embers cost nothing while you climb
    const heroOn = p > 0.74;
    const v = spartan.querySelector("video");
    if (v && !v.__ascent) {   // the Spartan clip reloads itself once it is fully downloaded; repaint when it does
      v.__ascent = true;
      v.addEventListener("loadeddata", () => { if (wasOn) nudge(v); });
    }
    if (heroOn !== wasOn) {
      // parked off-screen (not display:none) so the clip keeps its picture and the embers pause on their own
      spartan.style.transform = heroOn ? "none" : "translate3d(-300vw,0,0)";
      wasOn = heroOn;
      if (heroOn && v) nudge(v);
    }
    if (heroOn) spartan.style.opacity = ease(seg(p, 0.78, 0.92)).toFixed(3);
    spartan.classList.toggle("revealed", p > 0.93);
    }

    /* 6. Olympus: start close in, pull back fast, then the photos arrive */
    if (oly && sunset) {
      const r = oly.getBoundingClientRect();
      if (r.bottom > 0 && r.top < H) {
        const q = progress(oly), out = ease(seg(q, 0, 0.32));
        sunset.style.transform = `scale(${2.6 - 1.6 * out})`;
        olyHead.forEach(el => { el.style.opacity = seg(q, 0.18, 0.32); el.style.transform = `translate3d(0,${(1 - seg(q, 0.18, 0.32)) * 24}px,0)`; });
        gal.forEach((img, i) => {
          const s0 = 0.3 + (i % 4) * 0.06 + Math.floor(i / 4) * 0.12, t = ease(seg(q, s0, s0 + 0.22)), left = (i % 4) < 2;
          img.style.opacity = t;
          img.style.transform = `translate3d(${(1 - t) * (left ? -60 : 60)}vw,${(1 - t) * 30}px,0) rotate(${(1 - t) * (left ? -6 : 6)}deg)`;
        });
      }
    }

    /* 7. Location: pull right back out to the mountain, drop down through the clouds, land on the map */
    if (desc && !reduce) {
      const r = desc.getBoundingClientRect();
      if (r.bottom > 0 && r.top < H) {
        const qAll = progress(desc);
        // 1) black hold, 2) zoom out from inside the doorway (zt), 3) the original descent (q, unchanged timeline)
        const zt = clamp((qAll * D_ALL - D_BLACK) / D_ZOOM);
        const q = clamp((qAll * D_ALL - D_BLACK - D_ZOOM) / D_OLD);
        // pretend we are back at the very top of the homepage: the menu loses its dark bar too
        if (nav && r.top <= 1 && r.bottom > H * 0.5) nav.classList.add("clear");
        const pull = inout(seg(q, 0.0, 0.24)), down = inout(seg(q, 0.28, 0.60));
        // from close on the temple back out to the exact opening view, then straight down like a lift:
        // same size, no sideways movement, the picture only slides up
        let S = 3.0 - 2.0 * pull, ax = FX, ay = FY, sy = H * 0.42;
        if (zt < 1) {
          // coming back out of the doorway: same door zoom as the climb, reversed, ending exactly where the pull starts
          const k = inout(zt);
          const fill = Math.min(14, (W * 1.04) / (FW * pw));
          const sDoor = Math.min(48, Math.max(fill * 2, (W * 1.3) / (DOORW * pw)));
          S = sDoor * Math.pow(3.0 / sDoor, k);
          ay = lerp(DY, FY, k); sy = lerp(H * 0.5, H * 0.42, k);
        }
        const S0 = zt < 1 ? S : 3.0;   // the pull starts from the 3x view exactly as before (keeps the temple centred)
        let Tx = lerp(W / 2 - px - S0 * ax * pw, 0, pull), Ty = lerp(sy - py - S0 * ay * ph, 0, pull);
        Tx = Math.min(-px, Math.max(W - px - S * pw, Tx));
        Ty = Math.min(-py, Math.max(H - py - S * ph, Ty));
        Ty -= down * H * 1.1;
        // same memory guard as the climb: hide what the solid temple completely covers, cap picture sizes
        const dL = px + Tx + S * CX * pw, dT = py + Ty + S * CY * ph, dW = S * CW * pw, dH = S * CH * ph;
        const covered = dL + 0.22 * dW <= 0 && dL + 0.80 * dW >= W && dT + 0.19 * dH <= 0 && dT + 0.80 * dH >= H;
        dPlate.style.transform = `translate3d(${Tx}px,${Ty}px,0) scale(${S})`;
        const plateOp = seg(zt, 0, 0.09) * (1 - seg(q, 0.56, 0.58));   // fades up out of the black, inside the doorway
        const sharpOp = plateOp * (1 - seg(q, 0.28, 0.36));            // sharp temple + peak overlays, gone as we drop
        const sharp = (el, x, y, w, h, hide) => {
          if (!el) return;
          const on = sharpOp > 0 && !hide;
          el.style.opacity = sharpOp.toFixed(3);
          el.style.visibility = on ? "visible" : "hidden";
          if (on) {
            const ew = S * w * pw, eh = S * h * ph, kk = Math.min(1, 4096 / Math.max(ew, eh));
            el.style.width = (ew * kk) + "px"; el.style.height = (eh * kk) + "px";
            el.style.transform = `translate3d(${px + Tx + S * x * pw}px,${py + Ty + S * y * ph}px,0)` + (kk < 1 ? ` scale(${1 / kk})` : "");
          }
        };
        sharp(dPeak, PX, PY, PW, PH, covered);
        sharp(dDetail, CX, CY, CW, CH, false);
        desc.firstElementChild.style.background = down > 0 ? "#eef3f8" : "";
        dPlate.classList.toggle("sink", down > 0);   // below the picture there is only cloud
        dPlate.style.opacity = plateOp.toFixed(3);
        dPlate.style.visibility = plateOp > 0 && !covered ? "visible" : "hidden";
        dCB.style.opacity = (0.75 * seg(q, 0.12, 0.24)).toFixed(3);
        // the cloud bank rises to swallow the view, then parts
        const rise = inout(seg(q, 0.38, 0.58)), part = 0;
        dBank.style.transform = `translate3d(0,${(1 - rise) * 8 - rise * 80}%,0)`;   // the cloud bank rises straight up past you
        dBank.style.opacity = (seg(q, 0.05, 0.2) * (1 - part)).toFixed(3);
        const [cl2, cr2] = dBank.children;
        cl2.style.transform = `translateX(${-part * 60}%)`; cr2.style.transform = `translateX(${part * 60}%) scaleX(-1)`;
        dFog.style.opacity = seg(q, 0.53, 0.58).toFixed(3);
        // still going straight down: out of the bottom of the cloud the city scene rises into view from below
        // (its own top is cloud, so it joins the white seamlessly), and LOCATION appears once you have landed
        const show = seg(q, 0.555, 0.58), land = inout(seg(q, 0.58, 0.86));
        dLoc.style.opacity = show.toFixed(3);
        dLoc.style.visibility = show > 0 ? "visible" : "hidden";
        const sw = pw, sh = pw * SCENE_R;
        const sx = Math.min(0, Math.max(W - sw, W / 2 - CITY_PIN[0] * sw));   // narrow screens: keep the studio in the middle
        const sTop = lerp(H * 0.78, -CITY_END * sh, land);                   // the scene rises from below, straight up
        dScene.style.width = sw + "px"; dScene.style.height = sh + "px";
        dScene.style.transform = `translate3d(${sx}px,${sTop}px,0)`;
        dPin.style.left = (sx + CITY_PIN[0] * sw) + "px"; dPin.style.top = (sTop + CITY_PIN[1] * sh) + "px";
        dText.style.setProperty("--loc-y", ((sTop + CITY_LOC_Y * sh) / H * 100) + "%");
        dText.style.opacity = seg(q, 0.82, 0.9).toFixed(3);
        dPin.style.opacity = seg(q, 0.86, 0.93).toFixed(3);
      }
    }
  }

  let ticking = false;
  function queue() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  addEventListener("scroll", queue, { passive: true });
  addEventListener("resize", size);
  size(); frame();
})();
