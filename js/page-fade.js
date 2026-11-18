/* Moving between pages: the old page fades out to black, the new one fades in.
   Chrome, Edge and Safari do this with the browser's own page transition (see pop.css);
   other browsers get the same effect from this script. */
(() => {
  const native = "onpagereveal" in window;   // browser does cross-page transitions itself
  if (native) return;
  if (!document.documentElement.classList.contains("no-pf")) document.documentElement.classList.add("pf");
  addEventListener("pageshow", () => document.documentElement.classList.remove("pf-out"));
  document.addEventListener("click", e => {
    const a = e.target.closest && e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || a.target === "_blank") return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || (url.pathname === location.pathname && url.hash)) return;   // same page jump
    if (a.closest(".hero-stage")) return;                                                                // the Spartan's own moves
    e.preventDefault();
    document.documentElement.classList.add("pf-out");
    setTimeout(() => { location.href = a.href; }, 420);
  });
})();
