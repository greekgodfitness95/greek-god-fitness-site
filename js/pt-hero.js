/* Personal Training: as the page scrolls up over the turned Spartan, he slowly fades into the dark. */
(() => {
  // Arriving from the Spartan's orbit: the page opens on the very same picture, so no fade at all.
  let fromOrbit = false;
  try { fromOrbit = sessionStorage.getItem("ggf-orbit") === "1"; } catch (e) {}
  if (fromOrbit) {
    document.documentElement.classList.add("no-pf");
    addEventListener("pagereveal", e => {
      const vt = e.viewTransition; if (!vt) return;
      [vt.ready, vt.finished, vt.updateCallbackDone].forEach(pr => pr && pr.catch(() => {}));
      vt.skipTransition();
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
