import React, { useEffect, useRef, type RefObject } from "react";

/* =====================================================================
   GGF SPARTAN – hero video that follows the mouse / phone tilt,
   WITH the heading, logo and buttons drawn INSIDE it so nothing can
   hide them. Everything you may want to change is in this first block.
   ===================================================================== */
const VIDEO_SRC =
  "https://greekgodfitness95.github.io/Greek-God-Fitness-assets/spartan-scrub-4k-small.mp4";

const HEADING = "UNLEASH YOUR INNER GOD";
const HEADING_FONT_SIZE = 44;          // px at 1440 wide (shrinks on small screens)
const HEADING_COLOR = "#e8b923";       // gold
const HEADING_FROM_BOTTOM = "9%";      // distance of the heading from the bottom edge
const FONT = "inherit";                // or e.g. '"Montserrat", sans-serif'

const LOGO_URL = "";                   // paste your logo link here (empty = no logo)
const LOGO_WIDTH = 120;                // px
const LOGO_TOP = 90;                   // px from the top
const LOGO_LEFT = 40;                  // px from the left

// Optional buttons drawn over the video. Leave the list empty to show none.
const BUTTONS: { label: string; href: string }[] = [
  // { label: "PERSONAL TRAINING", href: "/personal-training" },
  // { label: "NUTRITION PLAN", href: "/nutrition-plan" },
];


// Every frame has a labelled head pose. The hook finds the frame matching where the cursor,
// finger or phone tilt points, then plans the smoothest route to it through the clip.
// The route can walk frame by frame, or hop between two frames that look almost identical
// (see JUMPS) with a very short dissolve, so he never has to swing off in the wrong direction.
const FPS = 24;
const FRAME_COUNT = 216;

// [frame, yaw, pitch]  yaw: -1 = facing screen-left, +1 = screen-right  pitch: -1 = down, +1 = up
const KEYS: [number, number, number][] = [
  [0, 0, 0], [6, 0, 0.1], [12, 0, 0.25], [18, 0, 0.4], [21, -0.2, 0.5], [24, -0.45, 0.5],
  [27, -0.6, 0.6], [30, -0.8, 0.7], [33, -0.9, 0.75], [36, -0.95, 0.75], [42, -0.95, 0.75],
  [45, -0.9, 0.7], [48, -0.75, 0.6], [51, -0.45, 0.5], [54, -0.1, 0.35], [57, 0.1, 0.3],
  [60, 0.3, 0.3], [63, 0.5, 0.3], [66, 0.65, 0.3], [69, 0.7, 0.25], [72, 0.75, 0.15],
  [75, 0.8, 0.1], [78, 0.85, 0.05], [81, 0.85, -0.05], [84, 0.85, -0.1], [87, 0.85, -0.2],
  [90, 0.85, -0.3], [93, 0.8, -0.4], [96, 0.7, -0.5], [99, 0.6, -0.55], [102, 0.45, -0.55],
  [105, 0.3, -0.6], [108, 0.15, -0.65], [111, 0.05, -0.7], [114, 0, -0.75],
  [117, 0, -0.75], [120, -0.1, -0.7], [123, -0.2, -0.65], [126, -0.3, -0.6],
  [129, -0.4, -0.55], [132, -0.55, -0.5], [135, -0.65, -0.45], [138, -0.75, -0.4],
  [141, -0.85, -0.35], [144, -0.95, -0.3], [147, -0.95, -0.2], [150, -0.9, -0.15],
  [153, -0.85, -0.05], [156, -0.8, 0], [159, -0.75, 0.05], [162, -0.7, 0.15],
  [165, -0.65, 0.2], [168, -0.7, 0.3], [171, -0.7, 0.4], [174, -0.7, 0.5],
  [177, -0.65, 0.55], [180, -0.65, 0.6], [183, -0.65, 0.65], [186, -0.65, 0.7],
  [189, -0.6, 0.7], [192, -0.55, 0.6], [195, -0.5, 0.55], [198, -0.35, 0.5],
  [201, -0.2, 0.4], [204, -0.1, 0.3], [207, 0, 0.2], [210, 0, 0.1], [213, 0, 0.05],
  [215, 0, 0],
];

const YAW = new Float32Array(FRAME_COUNT);
const PITCH = new Float32Array(FRAME_COUNT);
for (let k = 0; k < KEYS.length - 1; k++) {
  const [f0, y0, p0] = KEYS[k];
  const [f1, y1, p1] = KEYS[k + 1];
  for (let f = f0; f <= f1; f++) {
    const t = (f - f0) / (f1 - f0);
    YAW[f] = y0 + (y1 - y0) * t;
    PITCH[f] = p0 + (p1 - p0) * t;
  }
}

// Pairs of frames that look nearly the same: [frameA, frameB, difference x 1000].
// He may hop between them (either direction) to take a shortcut. The last few entries are
// bigger hops between a level and a bowed head (extra cost) used only when nothing else connects.
const JUMPS: number[] = [
  6, 213, 22, 6, 214, 22, 7, 212, 22, 7, 213, 22, 8, 211, 24, 8, 212, 22, 9, 209, 35,
  9, 210, 29, 9, 211, 25, 10, 206, 54, 10, 207, 48, 10, 208, 41, 10, 211, 29, 11, 57, 62,
  11, 205, 61, 11, 211, 34, 12, 57, 56, 12, 210, 41, 13, 57, 49, 13, 210, 48, 14, 57, 44,
  14, 209, 54, 15, 57, 40, 15, 59, 64, 15, 209, 59, 16, 57, 38, 16, 58, 51, 16, 209, 64,
  17, 56, 41, 17, 57, 38, 18, 56, 41, 19, 56, 42, 20, 56, 45, 21, 55, 48, 22, 55, 50,
  23, 54, 51, 24, 53, 51, 25, 52, 49, 26, 52, 48, 27, 51, 42, 28, 50, 40, 29, 50, 36,
  30, 49, 33, 30, 194, 64, 31, 49, 31, 31, 194, 59, 31, 195, 61, 32, 48, 27, 32, 193, 56,
  32, 194, 58, 33, 47, 24, 33, 192, 52, 33, 193, 54, 34, 46, 22, 34, 47, 22, 34, 191, 49,
  34, 192, 50, 35, 46, 19, 35, 190, 47, 36, 45, 16, 36, 190, 45, 36, 191, 47, 37, 45, 16,
  37, 187, 45, 37, 189, 44, 37, 190, 45, 38, 187, 44, 38, 189, 44, 39, 187, 43,
  40, 187, 43, 41, 177, 60, 41, 178, 56, 41, 179, 52, 41, 180, 50, 41, 181, 48,
  41, 182, 46, 41, 183, 45, 41, 184, 44, 41, 185, 44, 41, 187, 42, 42, 176, 65,
  42, 186, 43, 42, 187, 42, 42, 188, 43, 42, 189, 43, 42, 190, 44, 43, 187, 43,
  43, 189, 43, 44, 187, 43, 44, 188, 43, 44, 189, 43, 44, 190, 44, 45, 189, 44,
  46, 190, 44, 46, 191, 44, 47, 192, 46, 48, 193, 47, 48, 194, 49, 49, 194, 49,
  49, 195, 50, 50, 196, 52, 50, 197, 55, 51, 197, 56, 51, 198, 56, 52, 199, 58,
  52, 200, 59, 53, 201, 61, 53, 202, 62, 54, 203, 63, 54, 204, 65, 131, 145, 63,
  131, 148, 63, 132, 145, 58, 133, 145, 53, 135, 152, 64, 136, 150, 54, 136, 151, 59,
  137, 149, 48, 139, 149, 48, 0, 120, 778, 1, 119, 778, 1, 121, 778, 3, 120, 779,
  6, 119, 781, 115, 207, 787, 114, 208, 788, 118, 214, 784, 119, 210, 784, 121, 213, 781,
  121, 215, 780,
];

const REACH = 0.9; // how far toward the edges of the pose range the screen edges map
const IDLE_AFTER = 2500; // ms without input before a phone starts looking around by itself
const TILT_RANGE = 20; // degrees of phone tilt that reach the full head turn
const SMOOTH = 0.22; // 0..1, how quickly the aimed pose follows the cursor
const MAX_STEP = 8; // most frames he may travel per screen refresh (higher = faster turns)
const MAX_POSE_STEP = 0.16; // most head rotation allowed in one step (smaller = finer, slower travel)
const OFF_LINE = 3; // how strongly routes that wander away from a straight head turn are avoided
const HOP_COST = 0.12; // base cost of a dissolve hop (higher = fewer hops, longer walks)
const HOP_DIFF = 6; // extra hop cost per unit of visual difference
const AIM_WEIGHT = 12; // how much it matters to end exactly on the aimed pose
const STAY = 0.01; // do not move for improvements smaller than this (stops shimmer)
const FADE_MS = 170; // length of the soft dissolve used on a hop
const NEUTRAL_FRAME = 0; // facing the viewer, level

// Hop table as an adjacency list: HOPS[frame] = [[otherFrame, cost], ...]
const HOPS: [number, number][][] = Array.from({ length: FRAME_COUNT }, () => []);
for (let i = 0; i < JUMPS.length; i += 3) {
  const a = JUMPS[i], b = JUMPS[i + 1];
  const cost = HOP_COST + (HOP_DIFF * JUMPS[i + 2]) / 1000;
  HOPS[a].push([b, cost]);
  HOPS[b].push([a, cost]);
}

const mod = (n: number) => ((n % FRAME_COUNT) + FRAME_COUNT) % FRAME_COUNT;
const poseGap = (a: number, b: number) =>
  Math.hypot(YAW[a] - YAW[b], PITCH[a] - PITCH[b]);

// Distance from point (px, py) to the segment (ax, ay) -> (bx, by).
const segDist = (px: number, py: number, ax: number, ay: number, bx: number, by: number) => {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 < 1e-9 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
};

const cost = new Float32Array(FRAME_COUNT);
const prev = new Int16Array(FRAME_COUNT);
const hopped = new Uint8Array(FRAME_COUNT); // 1 if the edge into this frame is a hop
const done = new Uint8Array(FRAME_COUNT);
const off = new Float32Array(FRAME_COUNT);

// Cheapest routes from `src` to every frame. A route is cheap when it is short and stays
// close to the straight line from the current pose to the aimed pose.
const planRoutes = (src: number, aimYaw: number, aimPitch: number, lastDir: number) => {
  const sy = YAW[src], sp = PITCH[src];
  for (let f = 0; f < FRAME_COUNT; f++) {
    off[f] = segDist(YAW[f], PITCH[f], sy, sp, aimYaw, aimPitch);
    cost[f] = 1e9;
    prev[f] = -1;
    hopped[f] = 0;
    done[f] = 0;
  }
  cost[src] = 0;
  for (let iter = 0; iter < FRAME_COUNT; iter++) {
    let u = -1, best = 1e9;
    for (let f = 0; f < FRAME_COUNT; f++) {
      if (!done[f] && cost[f] < best) { best = cost[f]; u = f; }
    }
    if (u < 0) break;
    done[u] = 1;
    for (const s of [1, -1]) {
      const v = mod(u + s);
      let w = poseGap(u, v) * (1 + OFF_LINE * off[v]);
      if (u === src && lastDir === -s) w += 0.08; // mild preference for not reversing
      if (best + w < cost[v]) { cost[v] = best + w; prev[v] = u; hopped[v] = 0; }
    }
    for (const [v, c] of HOPS[u]) {
      const w = c * (1 + OFF_LINE * off[v]);
      if (best + w < cost[v]) { cost[v] = best + w; prev[v] = u; hopped[v] = 1; }
    }
  }
};

function useMouseScrubVideo(
  videoRef: RefObject<HTMLVideoElement | null>,
) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let targetYaw = 0, targetPitch = 0; // from the cursor / finger / tilt
    let yaw = 0, pitch = 0; // eased toward the target
    let shown = NEUTRAL_FRAME; // frame last sent to the video (where he is now)
    let lastDir = 0; // direction of the last walking step, +1 / -1 (0 after a hop)
    let seeking = false;
    let cancelled = false;
    let blobUrl: string | null = null;
    let raf = 0;
    let lastInput = performance.now();
    let lastTouch = -1e9;
    let tiltBase: { b: number; g: number } | null = null;
    const coarse = window.matchMedia("(pointer: coarse)").matches; // phone / tablet

    // A second layer used to dissolve over a skipped stretch of footage (see tick()).
    let canvas: HTMLCanvasElement | null = null;
    let ctx2d: CanvasRenderingContext2D | null = null;
    let pendingFade = false;
    try {
      canvas = document.createElement("canvas");
      canvas.width = 1920; // the dissolve layer only shows for a split second, so it need not be full 4K
      canvas.height = 1080;
      const cs = getComputedStyle(video);
      Object.assign(canvas.style, {
        position: cs.position === "fixed" ? "fixed" : "absolute", top: "0", left: "0", width: "100%", height: "100%",
        objectFit: "cover", objectPosition: cs.objectPosition,
        zIndex: cs.zIndex === "auto" ? "0" : cs.zIndex,
        pointerEvents: "none", opacity: "0",
      });
      canvas.setAttribute("aria-hidden", "true");
      video.insertAdjacentElement("afterend", canvas);
      ctx2d = canvas.getContext("2d");
    } catch {
      canvas = null;
      ctx2d = null;
    }
    const startDissolve = () => {
      if (!canvas || !ctx2d || video.readyState < 2) return;
      try {
        ctx2d.drawImage(video, 0, 0, canvas.width, canvas.height); // freeze the old frame on top
        canvas.style.transition = "none";
        canvas.style.opacity = "1";
        pendingFade = true;
      } catch {
        /* drawing is optional, the cut just becomes hard */
      }
    };

    // Download the whole clip into memory so every seek is local. Without this the
    // browser may fetch parts of the file over the network while you move, which is lag.
    const src = video.currentSrc || video.src;
    if (src) {
      fetch(src)
        .then((r) => (r.ok ? r.blob() : Promise.reject()))
        .then((b) => {
          if (cancelled) return;
          blobUrl = URL.createObjectURL(b);
          video.src = blobUrl; // "loadedmetadata" below puts it back on the right frame
        })
        .catch(() => {});
    }

    const timeOf = (frame: number) =>
      Math.min((frame + 0.25) / FPS, Math.max(video.duration - 0.001, 0));

    const seek = (frame: number) => {
      if (!isFinite(video.duration)) return;
      seeking = true;
      shown = frame;
      video.currentTime = timeOf(frame);
    };

    const tick = () => {
      const now = performance.now();
      if (coarse && now - lastInput > IDLE_AFTER) {
        // Nobody is touching or tilting: let him look around slowly on his own.
        const t = (now - lastInput - IDLE_AFTER) / 1000;
        targetYaw = 0.8 * Math.sin(t * 0.45);
        targetPitch = 0.45 * Math.sin(t * 0.3 + 1);
      }
      yaw += (targetYaw - yaw) * SMOOTH;
      pitch += (targetPitch - pitch) * SMOOTH;

      if (!seeking) {
        const here = shown;
        planRoutes(here, yaw, pitch, lastDir);
        // The frame to head for: close to the aimed pose, and not too costly to reach.
        const aimCost = (f: number) => {
          const dy = YAW[f] - yaw, dp = PITCH[f] - pitch;
          return AIM_WEIGHT * (dy * dy + dp * dp);
        };
        let goal = here;
        let goalScore = aimCost(here) - STAY;
        for (let f = 0; f < FRAME_COUNT; f++) {
          const s = cost[f] + aimCost(f);
          if (s < goalScore) { goalScore = s; goal = f; }
        }
        if (goal !== here) {
          // Rebuild the route here -> goal.
          const route: number[] = [goal];
          while (route[route.length - 1] !== here) route.push(prev[route[route.length - 1]]);
          route.reverse();
          const edges = route.length - 1;
          if (hopped[route[1]]) {
            // A shortcut between two near-identical frames: hop with a soft dissolve.
            lastDir = 0;
            startDissolve();
            seek(route[1]);
          } else {
            // Walk along the route; take smaller steps where the footage turns fast, and
            // slow down as the goal gets close.
            let n = 1;
            let turned = poseGap(route[0], route[1]);
            const limit = Math.max(1, Math.min(MAX_STEP, Math.round(edges * 0.3)));
            while (n < limit && !hopped[route[n + 1]]) {
              const g = poseGap(route[n], route[n + 1]);
              if (turned + g > MAX_POSE_STEP) break;
              turned += g;
              n++;
            }
            lastDir = mod(route[1] - here) === 1 ? 1 : -1;
            seek(route[n]);
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };

    const aim = (x: number, y: number) => {
      lastInput = performance.now();
      targetYaw = (x / window.innerWidth - 0.5) * 2 * REACH;
      targetPitch = (0.5 - y / window.innerHeight) * 2 * REACH;
    };

    const onPointerMove = (e: PointerEvent) => aim(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      lastTouch = performance.now();
      aim(e.touches[0].clientX, e.touches[0].clientY);
    };

    // iOS only paints seeked frames of a paused video after it has been "played" once
    // from a user gesture, so do that on the first touch.
    let unlocked = false;
    const unlock = () => {
      if (unlocked) return;
      unlocked = true;
      video.play().then(() => { video.pause(); seeking = false; seek(shown); }).catch(() => {});
    };
    const onTouchStart = (e: TouchEvent) => { unlock(); onTouch(e); };

    // Phone tilt: right tilt -> looks right, top edge tilted away -> looks up.
    // Neutral is wherever the phone is held, and it re-centres slowly.
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return;
      if (!tiltBase) tiltBase = { b: e.beta, g: e.gamma };
      tiltBase.b += (e.beta - tiltBase.b) * 0.003;
      tiltBase.g += (e.gamma - tiltBase.g) * 0.003;
      if (performance.now() - lastTouch < 1500) return; // a finger on the screen wins
      lastInput = performance.now();
      const clamp = (v: number) => Math.max(-1, Math.min(1, v));
      targetYaw = clamp((e.gamma - tiltBase.g) / TILT_RANGE) * REACH;
      targetPitch = clamp(-(e.beta - tiltBase.b) / TILT_RANGE) * REACH;
    };

    // The listener is harmless until the sensor is allowed. Android sends events right
    // away. iOS needs a one-time permission prompt, which must be triggered by a tap.
    type IOSOrientation = { requestPermission?: () => Promise<string> };
    let asked = false;
    const askTilt = () => {
      if (asked) return;
      asked = true;
      const D = DeviceOrientationEvent as unknown as IOSOrientation;
      if (typeof D.requestPermission !== "function") return;
      D.requestPermission()
        .then((r) => { if (r === "granted") window.addEventListener("deviceorientation", onTilt); })
        .catch(() => {});
    };
    const onTouchEnd = () => askTilt();
    const onSeeked = () => {
      seeking = false;
      if (pendingFade && canvas) {
        pendingFade = false;
        void canvas.offsetWidth; // make the browser register opacity 1 before fading out
        canvas.style.transition = `opacity ${FADE_MS}ms linear`;
        canvas.style.opacity = "0";
      }
    };
    const onReady = () => seek(shown);

    video.addEventListener("seeked", onSeeked);
    video.addEventListener("loadedmetadata", onReady);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    if (coarse) {
      window.addEventListener("deviceorientation", onTilt);
      window.addEventListener("touchend", onTouchEnd, { passive: true });
    }
    if (video.readyState >= 1) onReady();
    raf = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      canvas?.remove();
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("loadedmetadata", onReady);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("deviceorientation", onTilt);
    };
  }, [videoRef]);
}

export default function GGFSpartan() {
  const videoRef = useRef<HTMLVideoElement>(null);
  useMouseScrubVideo(videoRef);

  return (
    <div
      style={{
        position: "relative", width: "100%", height: "100%",
        overflow: "hidden", isolation: "isolate", background: "#000",
      }}
    >
      <video
        ref={videoRef}
        src={VIDEO_SRC + "#t=0.001"}
        muted
        playsInline
        preload="auto"
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", objectPosition: "50% center", zIndex: 0,
        }}
      />
      <div
        style={{
          position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
          background: "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.65) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
          background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent, rgba(0,0,0,0.5))",
        }}
      />

      {/* ---- everything below is drawn on top of the video ---- */}
      {LOGO_URL && (
        <img
          src={LOGO_URL}
          alt="Greek God Fitness"
          style={{ position: "absolute", zIndex: 5, top: LOGO_TOP, left: LOGO_LEFT, width: LOGO_WIDTH, height: "auto" }}
        />
      )}

      <div
        style={{
          position: "absolute", zIndex: 5, left: 0, right: 0, bottom: HEADING_FROM_BOTTOM,
          textAlign: "center", pointerEvents: "none",
          fontFamily: FONT, fontWeight: 700, letterSpacing: "0.12em",
          fontSize: `clamp(20px, ${(HEADING_FONT_SIZE / 1440) * 100}vw, ${HEADING_FONT_SIZE}px)`,
          color: HEADING_COLOR, textShadow: "0 2px 12px rgba(0,0,0,0.8)",
        }}
      >
        {HEADING}
      </div>

      {BUTTONS.length > 0 && (
        <div
          style={{
            position: "absolute", zIndex: 5, left: 0, right: 0, bottom: "2%",
            display: "flex", justifyContent: "center", gap: 48, flexWrap: "wrap",
          }}
        >
          {BUTTONS.map((b) => (
            <a
              key={b.label}
              href={b.href}
              style={{
                fontFamily: FONT, fontWeight: 700, letterSpacing: "0.1em", fontSize: 18,
                color: HEADING_COLOR, textDecoration: "underline", textShadow: "0 2px 12px rgba(0,0,0,0.8)",
              }}
            >
              {b.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
