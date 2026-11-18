/* Personal Training: the Spartan turns his head back to the front, then - as one continuous shot - the
   camera circles round behind him, he looks over his right shoulder, and he stays turned while
   "PERSONAL TRAINING" appears at his waistline and the Personal Training page takes over.
   The orbit clip starts on exactly the same picture as his front-facing frame, so the hand-over from the
   head-tracking video to the orbit is invisible. It only downloads once someone points at / touches the link. */
(() => {
  const stage = document.getElementById("hero-stage");
  const link = stage && stage.querySelector(".side-left");
  if (!stage || !link) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;   // plain link for them

  const PT_FRAME = 135;
  const NOD_FRAME = 114;                                 // facing straight ahead, head down                                  // the head-tracking frame the orbit clip starts on (looking down at this link)
  const SPEED = 1.6;                                      // 1 = as rendered (8 s); 1.6 = about 5 s
  // tall screens (phones) get a portrait cut of the 4K footage so it is as sharp as the Spartan himself
  const SRC = innerWidth / innerHeight < 0.6 ? "/media/spartan-orbit-tall.mp4" : "/media/spartan-orbit.mp4";
  let wrap, vid, title, busy = false;

  function build() {
    if (wrap) return;
    wrap = document.createElement("div");
    wrap.className = "orbit";
    wrap.setAttribute("aria-hidden", "true");
    vid = document.createElement("video");
    vid.muted = true; vid.playsInline = true; vid.preload = "auto";
    vid.setAttribute("muted", ""); vid.setAttribute("playsinline", "");
    vid.src = SRC;
    wrap.append(vid, Object.assign(document.createElement("i"), { className: "v1" }), Object.assign(document.createElement("i"), { className: "v2" }));
    stage.appendChild(wrap);
    title = document.createElement("div");
    title.className = "hero-heading pt-late";
    title.setAttribute("aria-hidden", "true");
    title.textContent = "PERSONAL TRAINING";
    stage.appendChild(title);
    vid.load();
  }
  ["pointerenter", "touchstart", "focus"].forEach(ev => link.addEventListener(ev, build, { passive: true, once: true }));

  const wait = ms => new Promise(r => setTimeout(r, ms));
  const within = (p, ms) => Promise.race([p, wait(ms).then(() => null)]);
  const ready = v => v.readyState >= 2 ? Promise.resolve(true)
    : within(new Promise(r => v.addEventListener("loadeddata", () => r(true), { once: true })), 4000);

  link.addEventListener("click", async e => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button > 0) return;   // new-tab clicks behave normally
    e.preventDefault();
    if (busy) return;
    busy = true;
    build();
    const go = () => { try { sessionStorage.setItem("ggf-orbit", "1"); } catch (e) {} location.href = link.href; };
    stage.classList.add("orbiting");                       // headline, links and embers step back

    // 1. his head settles on the frame where he is looking down at Personal Training (he is usually already there)
    const api = window.GGFSpartan;
    // On a phone he is usually facing straight ahead. The footage only gets from there to the button by
    // looking up and round first, so instead he gives a quick nod straight down (a short dissolve to the
    // facing-down frame) and then turns along real footage directly to the button.
    const coarse = matchMedia("(pointer: coarse)").matches;
    const cur = api && api.frame ? api.frame() : -1;
    if (api && api.jumpTo && coarse && (cur <= 15 || cur >= 198)) {
      const hv = stage.querySelector("#hero-root video");
      const snap = document.createElement("canvas");
      snap.className = "nod";
      try {
        snap.width = 960; snap.height = 540;
        snap.getContext("2d").drawImage(hv, 0, 0, 960, 540);
        stage.querySelector("#hero-root").after(snap);
        await within(api.jumpTo(NOD_FRAME), 1500);
        requestAnimationFrame(() => { snap.style.opacity = "0"; });
        setTimeout(() => snap.remove(), 400);
      } catch (err) { snap.remove(); }
    }
    const faced = api ? await within(api.faceTo ? api.faceTo(PT_FRAME) : api.faceFront(), 5000) : null;

    // 2. the orbit picks up from that very frame
    if (!(await ready(vid))) return go();
    vid.defaultPlaybackRate = vid.playbackRate = SPEED;
    try { await vid.play(); } catch (err) { return go(); }
    if (!faced) wrap.classList.add("soft");                 // head did not make it to the front: blend instead
    wrap.classList.add("on");

    // 3. no fade: he stays turned, "PERSONAL TRAINING" rises at his waistline, and the Personal
    //    Training page (which opens on this exact picture) takes over
    const back = new Image(); back.src = innerWidth / innerHeight < 0.6 ? "/media/spartan-back-tall.webp" : "/media/spartan-back.webp";
    vid.addEventListener("timeupdate", function end() {
      if (vid.duration && vid.currentTime > vid.duration - 0.8 * SPEED) {
        vid.removeEventListener("timeupdate", end);
        title.classList.add("on");
      }
    });
    vid.addEventListener("ended", () => setTimeout(go, 450), { once: true });
    setTimeout(go, 12000);                                  // never get stuck
  });

  // coming back with the browser's back button: the normal, mouse-following Spartan again
  addEventListener("pageshow", () => {
    busy = false; stage.classList.remove("orbiting");
    if (window.GGFSpartan) window.GGFSpartan.release();
    if (wrap) { wrap.classList.remove("on", "out", "soft"); title.classList.remove("on"); try { vid.pause(); vid.currentTime = 0; } catch (e) {} }
  });
})();
