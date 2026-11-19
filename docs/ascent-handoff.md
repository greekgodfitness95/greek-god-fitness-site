# The Ascent – hand-over from the claude.ai design chat (18 Nov 2026)

Oliver designed the current site with Claude in a claude.ai chat, using a private tester page
(https://claude.ai/artifact/JUacA3N3RxK87wu8ba3vZU). Everything from that chat is now in this repo
and live on greekgodfitness.org (commit `4204397`, promoted 18 Nov 2026). This file is the full
picture so Claude Code can carry on. The short version is in `CLAUDE.md` ("The Ascent homepage").

## 1. Homepage scroll journey (`index.html`, `js/ascent.js`, `css/ascent.css`)

One sticky stage (`section.ascent`, 442vh) driven by a single rAF scroll handler; only transforms,
opacity and clip-path change. Timeline over the section's progress `p` (0–1):

| p | What happens |
|---|---|
| 0–0.26 × MT | Fly up to the temple frieze (clouds part). `MT = 342/620` keeps the original mountain pace after the corridor was removed. |
| 0.26–0.38 × MT | Zoom into the bronze doorway; plate fades out into darkness (`.mist`). |
| > 0.74 | Spartan (`#hero-stage`) is switched on (parked off-screen at `translate3d(-300vw)` before that – never `display:none`, or the video goes black in Chrome). Fades in 0.78–0.92. |
| then | `section.olympus` (sunset "Start Training Today" + gallery) → `section.chalk-band` (gold free-session band, 97 reviews) → `section.coach.coach-home` (Meet the Coach) → `section.descent` (Location). |

Constants at the top of `ascent.js`: `FX, FY, FW, DY` (frieze/door on the mountain picture),
`CX..CH` (sharp temple overlay), `PX..PH` (sharp peak overlay), `CITY_PIN`, `CITY_LOC_Y`, `SCENE_R`.

Pictures (`scenes/`):
- `mountain.webp` – mountain + temple (temple from Figma AI, baked in and colour/light-matched; Oliver's logo carved on the frieze).
- `temple-close.webp` + `peak-close.webp` – full-res overlays sized with width/height (not scale) so they stay sharp while zooming. Peak was upscaled with Real-ESRGAN.
- `olympus.webp` – sunset studio.
- `city.webp` – clouds + mountain base + Limassol seafront (Figma AI, composited onto the old mountain base; 1536×1264, taller than the screen).
- Source PNGs live in Oliver's Figma file `wwUHZUvxV8nqNyVK6y07Rm` (frames 2:2 temple, 3:3 city v1, 4:2 Limassol seafront).

Spartan → sunset seam: `.hero-stage.spartan::after` + `.olympus::before` blend through `#120705` (no hard line).

### Location descent (`section.descent`, now 570vh – see update below)
> **Update 18 Nov (Claude Code):** a short black hold (10vh – first 80vh, shortened the same day) and a 140vh zoom out from inside the temple doorway were added in front of the timeline below. The `q` numbers below still apply, but only to the last 320vh (`D_BLACK`, `D_ZOOM`, `D_OLD` in `js/ascent.js`). The old fade-in of the temple while Meet the Coach scrolls away was replaced by the black hold.

Progress `q`: 0–0.24 pull back from the temple to the exact opening view; 0.28–0.60 straight down
like a lift (no sideways move, no zoom) while the cloud bank rises; ~0.56–0.58 full white; 0.58–0.86
the city scene rises from below; 0.82–0.9 "LOCATION" + address; 0.86–0.93 gold pin + "Get directions"
(Google Business Profile link). The menu stays see-through (`nav.clear`) the whole time so it looks
like the top of the homepage. The Meet the Coach section sits above it; the temple close-up starts
fading in as the descent rises under it.

### Menu shortcuts
- Meet the Coach → `/#coach` (homepage section; `#coach{scroll-margin-top:-70px}` lands it flush).
- Location → `#location` on the homepage, `/?go=location` from other pages. `js/goto-location.js`:
  from the very top it glides q 0.25→1 (3 s); otherwise black dip, then q 0→1 (3.5 s). Any wheel/touch/key stops the glide.
- Contact → `#contact` (footer, every page).
- Page changes fade through black: `@view-transition` in `css/pop.css` + `js/page-fade.js` fallback.
- PT and Nutrition always open at the top (`js/start-top.js`, `js/pt-hero.js`) – the browser was carrying the long homepage's scroll position over and gliding them to the bottom.

## 2. Spartan (`src/GGFSpartan.tsx` → `js/hero.js`)
Build exactly as in CLAUDE.md (React 19.2.8, esbuild). Changes made in the chat:
- Phone: `PHONE_PITCH = 0`, `PHONE_YAW = 0.85`, `PHONE_START_FRAME = 0` – level head, left/right with tilt only.
- Upright phones load `/media/spartan-scrub-phone.mp4` (portrait 648×1080 cut, all-intra like the 4K file, ~4 MB) via `pickVideoSrc()`; desktops/tablets get the 14 MB 4K `/media/spartan-scrub-4k-small.mp4` (on github.io until 20 Nov).
- `window.GGFSpartan = { faceFront, faceTo(frame), jumpTo(frame), frame(), release() }` for scripted moves.
- Embers: only the wrapper at the top of `js/embers.js` changed (falls back to window size while the hero is hidden; ignores zero-size resizes). Ember code untouched.

## 3. Personal Training orbit (`js/orbit.js`, `media/`, `css/pt-hero.css`, `js/pt-hero.js`)
- Clip: Higgsfield, Gemini Omni Flash 1.2, 8 s, 4K, start frame = hero frame 135 (looking down-left at the PT link), **no end frame** (with an end frame the AI blended instead of orbiting). Original: Higgsfield asset `hf_20261117_153247_…mp4`.
- Re-encoded: aligned (ECC affine) + colour-matched to hero frame 135, first 16 frames dissolve from that exact frame. `spartan-orbit.mp4` 2560×1440 (desktop), `spartan-orbit-tall.mp4` 1296×2160 crop (phones). Plays at `SPEED = 1.6`.
- Click: head `faceTo(135)` (desktop is usually already there). Phone: if facing ahead it "nods" (`jumpTo(114)` under a fading snapshot) then turns to 135 – avoids the footage's route via looking up.
- End: no fade – "PERSONAL TRAINING" rises at his waist (same spot as UNLEASH YOUR INNER GOD), then the PT page opens on the clip's last frame (`media/spartan-back*.webp`); `sessionStorage ggf-orbit` skips the page fade for that hand-over.
- PT page: turned Spartan fixed behind the page, fades as the text scrolls up; woman and deadlift photos removed.
- Clip only downloads on hover/touch of the link. Nutrition has no orbit (Oliver chose PT only).

## 4. Other changes
- Nutrition: InBody 270 section between Andre's bio and "Book Your First Consultation" (`css/inbody.css`, poster layout, red→site yellow, text white, transparent machine `assets/inbody-270.webp`).
- Desktop menu: small white Inter caps on the right, no bar at the top of the journey; hamburger only ≤640px; Services dropdown transparent.
- Footer logo `assets/logo-footer.webp`; tab icons `favicon-32/48/192.png` (Spartan only), `apple-touch-icon.png`, schema logo `logo-google.png` (on black – Google shows logos on white and the lettering is white).

## 5. Open items / ideas Oliver has not decided yet
- InBody ribbon lettering: black on yellow (current) or white.
- Nutrition camera move like PT (another Higgsfield clip, ~54 credits – ask first).
- Real Google review quotes near "Book on WhatsApp"; what a session includes / prices on PT (never invent prices).
- Known: Spartan head can still glitch slightly when moving fast (from before).
- Security note: there is no `.vercelignore`, so repo files such as `CLAUDE.md` and `src/` are publicly downloadable on the live domain. This hand-over doc is excluded via `.vercelignore`; consider excluding `CLAUDE.md` too.

## 6. Testing that was used
Playwright + Chrome headless, desktop 1440×810 and phone 390×844 (`is_mobile`, `has_touch`); the
4K video from github.io was routed to a local copy. Checks: page errors, 404s, broken images,
sideways scroll, screenshots along each scroll timeline, head frame sequence on the orbit click,
simulated `deviceorientation` for phone tilt. Google Maps embeds are blocked in the claude.ai
preview, which is why the Location scene uses a picture + Google Maps link instead of an iframe.
