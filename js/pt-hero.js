/* Personal Training: as the page scrolls up over the turned Spartan, he slowly fades into the dark. */
(() => {
  // Arriving from the Spartan's orbit: the page opens on the very same picture, so no fade at all.
  let fromOrbit = false;
  try { fromOrbit = sessionStorage.getItem("ggf-orbit") === "1"; } catch (e) {}
  if (fromOrbit) {
    // The browser still holds a picture of the homepage's last orbit frame - the very same picture this
    // page opens on. Keep that picture up for a moment (css/pt-hero.css, html.no-pf) instead of skipping
    // the transition: skipping showed this page's first frame, which is black until the backdrop is
    // drawn, so there was a one-frame black flash between the orbit and this page (fixed 18 Nov).
    document.documentElement.classList.add("no-pf");
    // Start drawing the backdrop picture right away (it can take over half a second on a phone)...
    const pic = document.querySelector(".pt-backdrop img.bg");
    const drawn = (pic && pic.decode ? pic.decode().catch(() => {}) : Promise.resolve())
      .then(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 120)))));
    addEventListener("pagereveal", e => {
      const vt = e.viewTransition; if (!vt) return;
      [vt.ready, vt.finished, vt.updateCallbackDone].forEach(pr => pr && pr.catch(() => {}));
      // ...and only let go of the held orbit frame once this page's picture is on screen
      // (css/pt-hero.css holds it for up to 2.5 s; this skips to the short final fade as soon as we're ready).
      vt.ready.then(() => drawn).then(() => {
        document.documentElement.getAnimations({ subtree: true })
          .filter(a => a.effect && String(a.effect.pseudoElement || "").startsWith("::view-transition"))
          .forEach(a => { const d = a.effect.getComputedTiming().duration; if (d > 0) a.currentTime = Math.max(a.currentTime || 0, d * 0.92); });
      }).catch(() => {});
    });
    addEventListener("load", () => { try { sessionStorage.removeItem("ggf-orbit"); } catch (e) {} });
  }
  // Always open at the top. Arriving from the homepage, the browser could carry over the homepage's
  // scroll position (which is far down, at the Spartan) and then glide the page to the bottom.
  // The visitor's own scrolling is never touched: this only applies until they first scroll/tap/press a key.
  if (!location.hash) {
    try { history.scrollRestoration = "manual"; } catch (e) {}
    let user = false;
    const mine = () => { user = true; };
    ["wheel", "touchstart", "keydown", "mousedown"].forEach(ev => addEventListener(ev, mine, { passive: true, once: true }));
    const top = () => { if (!user && scrollY !== 0) window.scrollTo({ top: 0, left: 0, behavior: "instant" }); };
    top();
    addEventListener("DOMContentLoaded", top);
    addEventListener("load", top);
    addEventListener("pageshow", top);
    [50, 200, 600, 1200].forEach(ms => setTimeout(top, ms));
  }

  const bg = document.querySelector(".pt-backdrop");
  if (!bg) return;
  let ticking = false;
  const update = () => {
    ticking = false;
    const t = Math.min(1, Math.max(0, scrollY / (innerHeight * 0.85)));
    bg.style.opacity = (1 - t * t * (3 - 2 * t)).toFixed(3);
    bg.style.visibility = t >= 1 ? "hidden" : "visible";
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener("resize", update);
  update();
})();
