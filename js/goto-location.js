/* "Location" in the menu: skip the rest of the page and fall straight through the clouds.
   The opening view of the homepage is exactly the same picture as the start of the Location descent,
   so from the top we jump there invisibly and glide down; from anywhere else the screen dips to
   black first. Arriving from another page (?go=location) does the same. Any wheel/touch/key stops it. */
(() => {
  const desc = document.querySelector(".descent");
  const intro = document.querySelector(".ascent");
  if (!desc || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  // where the descent is back at the full mountain, and where its zoom out of the doorway starts (js/ascent.js)
  const D = () => window.GGF_DESCENT || { wide: 0.25, zoom: 0 };
  const span = () => desc.offsetHeight - innerHeight;
  const at = q => desc.offsetTop + span() * q;
  const jump = y => window.scrollTo({ top: y, left: 0, behavior: "instant" });
  let run = 0;

  function glide(from, to, ms) {
    const id = ++run, t0 = performance.now();
    const stop = () => { run++; };
    ["wheel", "touchstart", "keydown"].forEach(ev => addEventListener(ev, stop, { once: true, passive: true }));
    (function step(now) {
      if (id !== run) return;
      const t = Math.min(1, (now - t0) / ms), k = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      jump(from + (to - from) * k);
      if (t < 1) requestAnimationFrame(step);
    })(t0);
  }
  const dip = on => new Promise(res => {
    let veil = document.getElementById("loc-veil");
    if (!veil) { veil = document.createElement("div"); veil.id = "loc-veil"; document.body.appendChild(veil); }
    requestAnimationFrame(() => { veil.classList.toggle("on", on); setTimeout(res, on ? 380 : 0); });
  });

  async function go(fromOtherPage) {
    const atTop = intro && scrollY < intro.offsetHeight * 0.04;  // still looking at the mountain
    // From the very top the mountain is already on screen: carry straight on down.
    // From anywhere else: black fade, open close on the temple, pull back out to the mountain, then down.
    const fromTop = atTop && !fromOtherPage;
    const start = fromTop ? D().wide : D().zoom;
    if (!fromTop) await dip(true);
    jump(at(start));
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    dip(false);
    glide(at(start), at(1), fromTop ? 3000 : 4500);
  }

  document.addEventListener("click", e => {
    const a = e.target.closest && e.target.closest('a[href="#location"]');
    if (!a) return;
    e.preventDefault();
    go(false);
  });

  if (new URLSearchParams(location.search).get("go") === "location") {
    try { history.scrollRestoration = "manual"; history.replaceState(null, "", location.pathname); } catch (e) {}
    const veil = document.createElement("div"); veil.id = "loc-veil"; veil.className = "on"; document.body.appendChild(veil);
    addEventListener("load", () => setTimeout(() => go(true), 60));
  }
})();
