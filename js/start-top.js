/* Open this page at the top. Arriving from the homepage, the browser can carry over the homepage's
   scroll position (far down, at the Spartan) and glide this page to the bottom. The visitor's own
   scrolling is never touched: this only applies until they first scroll, tap or press a key. */
(() => {
  if (location.hash) return;
  try { history.scrollRestoration = "manual"; } catch (e) {}
  document.documentElement.style.scrollBehavior = "auto";
  let user = false;
  const mine = () => { user = true; };
  ["wheel", "touchstart", "keydown", "mousedown"].forEach(ev => addEventListener(ev, mine, { passive: true, once: true }));
  const top = () => { if (!user && scrollY !== 0) window.scrollTo({ top: 0, left: 0, behavior: "instant" }); };
  top();
  addEventListener("DOMContentLoaded", top);
  addEventListener("load", top);
  addEventListener("pageshow", top);
  [50, 200, 600, 1200].forEach(ms => setTimeout(top, ms));
})();
