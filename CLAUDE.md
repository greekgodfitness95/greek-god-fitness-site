# Greek God Fitness website – notes for Claude

Owner: Oliver Elia (greekgodfitness.org). Static HTML/CSS/JS, hosted on Vercel. Pushes to `main` build a staged production deployment but do **not** go live on their own (Vercel setting "auto-assign custom production domains" is off); going live is a separate **deploy** step.

## How Oliver wants work done
- Test thoroughly before showing anything; only report back when it is 95%+ of what was asked.
- Keep pages light and fast, especially on phones.
- Look for the more efficient way to do things and suggest it.
- Don't spend money or credits without asking first.

## Site structure
- `index.html`, `personal-training/index.html`, `nutrition/index.html`
- `css/style.css` – ends with the **molten-gold headings** block (approved, keep).
- `js/config.js` (contact links), `js/site.js` (menu).
- Hero (homepage):
  - `js/hero.js` – built from `src/GGFSpartan.tsx` with
    `esbuild src/hero-entry.tsx --bundle --minify --outfile=js/hero.js --define:process.env.NODE_ENV=\"production\" --jsx=automatic`
    (React 19). Always edit `src/GGFSpartan.tsx`, then rebuild – never hand-edit `hero.js` only.
  - Video: `https://greekgodfitness95.github.io/Greek-God-Fitness-assets/spartan-scrub-4k-small.mp4` (repo `greekgodfitness95/Greek-God-Fitness-assets`), 216 frames, 24 fps.
  - `js/embers.js` + `body_mask.png` – four-layer interactive embers. **Approved by Oliver as perfect: do not change the ember code** (section 2 in the file). Only the small wrapper at the top fits it to the hero box.
  - The heading "UNLEASH YOUR INNER GOD" is drawn by `index.html` (`.hero-heading`) in front of the embers; keep the wording.

## Current Spartan head behaviour
- Desktop (changed by Oliver, 18 Nov): the head only moves along ONE stretch of the footage, frames 63–141 – up to the viewer's right → Nutrition (right) → lower right → down (114) → lower left (Personal Training). `ARC_ONLY` / `ARC_FIRST` / `ARC_LAST` in `src/GGFSpartan.tsx`. The cursor's direction from the screen centre picks the frame; straight up / up-left (not covered) holds the current pose; he always walks neighbouring frames (no dissolve hops), so no glitches. Starts on frame 114. Scripted moves (`faceTo(135)` for the PT orbit) still work. `ARC_ONLY = false` restores the old follow-everywhere behaviour.
- Phone (`pointer: coarse`): `PHONE_TILT_ONLY = true` in `src/GGFSpartan.tsx` – he only ever looks **lower-left / down / lower-right**, chosen by phone tilt, never up (`PHONE_PITCH = -0.6`, `PHONE_YAW = 0.75`, starts on frame 114 facing down; restored 18 Nov at Oliver's request after the design chat had set it level, which made him look up in ~70% of frames). No finger steering, no idle look-around. Upright phones load a lighter portrait cut of the video (`/media/spartan-scrub-phone.mp4`, ~4 MB) instead of the 14 MB 4K file.
- `window.GGFSpartan` (from the hero) exposes `faceTo(frame)`, `jumpTo(frame)`, `frame()`, `release()` for scripted moves.
- iOS motion permission is requested only when the visitor taps the Spartan (inside `#hero-stage`, not on a link/button). Asking on any tap made iPhones show the prompt mid-tap and swallowed menu/hero link taps (fixed 16 Nov).
- Build with the same React the bundle uses (19.2.8): `npm install --no-save react@19.2.8 react-dom@19.2.8 esbuild@0.28`, then the esbuild command above.
- Phone menu (`css/style.css`, max-width media block): the Services links are always shown while the menu is open. A desktop hover rule used to collapse them under the finger, so Personal Training landed on Contact and Nutrition on nothing (fixed 16 Nov). Test phone menus with a hover-then-tap, not by tapping Services first.
- Dissolve snapshots (hero `startDissolve` and the phone "nod" in `js/orbit.js`) take their size from the video's own shape. They used to be fixed 16:9, which squashed the portrait phone video and made the Spartan flash "fat" when tilting (fixed 18 Nov). Never hard-code a 16:9 size for anything drawn from the phone video.
- Head glitches (18 Nov): fixed on desktop by the arc-only behaviour above. A Rodin 3D-model version (WebGL) was tried the same day and rejected by Oliver – it looked like a game character next to the photo-real video. Don't go back to 3D.

## The Ascent homepage (live 18 Nov 2026, designed with Oliver in a claude.ai tester)
- Scroll journey: mountain + temple (`scenes/mountain.webp`, sharp overlays `temple-close.webp`, `peak-close.webp`; Oliver's logo carved on the frieze) → through the temple door into darkness → Spartan + embers → sunset "Start Training Today" (`scenes/olympus.webp`) → gold free-session band → Meet the Coach → pull back to the mountain and drop straight down through the clouds → LOCATION over the Limassol seafront (`scenes/city.webp`, gold pin + Get directions). Code: `js/ascent.js`, `css/ascent.css`.
- Personal Training click (homepage Spartan): head settles on frame 135 (looking at the link), then the Higgsfield camera-orbit clip plays (`media/spartan-orbit*.mp4`, `js/orbit.js`) and the PT page opens on its last frame (`media/spartan-back*.webp`, `css/pt-hero.css`, `js/pt-hero.js`), text scrolls up over him while he fades. On phones he nods down first, then turns to the link.
- Orbit → PT hand-over has NO black frame (fixed 18 Nov, measured 8/8 clean with a frame-by-frame screen recording; it used to flash black ~5 in 6 times). Three parts, keep them: (1) `js/orbit.js` only shows the orbit once its first frame is painted (`requestVideoFrameCallback`); (2) before leaving, it lays the identical still `media/spartan-back*.webp` over the clip, because a playing video comes out black in the browser's page-transition snapshot; (3) the PT page holds that snapshot (`html.no-pf::view-transition-old`, up to 2.5 s in `css/pt-hero.css`) until its backdrop `<img class="bg">` has decoded and painted (`js/pt-hero.js`), then fades it out. The backdrop must stay a real `<img>`, not a CSS background (no way to know when a background is on screen).
- Menu: Meet the Coach → `/#coach`; Location → `/#location` or `/?go=location` plays the zoom-out + cloud descent automatically (`js/goto-location.js`); Contact → footer. Page changes fade through black (`js/page-fade.js`, view transitions). PT/Nutrition always open at the top (`js/start-top.js`).
- Nutrition: InBody 270 section (`css/inbody.css`, poster layout in site colours). Footer logo, tab icon and Google logo use Oliver's transparent logo (`assets/logo-footer.webp`, `favicon-*.png`, `logo-google.png`).
- Embers wrapper (top of `js/embers.js`) falls back to the window size while the hero is hidden; ember code itself unchanged.
- Coach → Location (18 Nov, Oliver's request): after Meet the Coach there is a short black hold (10vh, shortened from 80 on Oliver's request), then the view fades up inside the temple doorway and zooms out (140vh, the climb's door zoom in reverse, with sharp `#d-detail`/`#d-peak` overlays) to the 3x temple view, then the original 320vh descent. `.descent` is 570vh; constants `D_BLACK/D_ZOOM/D_OLD` in `js/ascent.js`; `window.GGF_DESCENT` tells `js/goto-location.js` where the zoom starts and where the full mountain is.
- Coach photo frame uses the photo's own shape (`aspect-ratio:599/665`), so the whole picture shows down to the hands (Oliver: show more of him). The photo itself ends at the waist; showing more needs a wider photo.
- Memory guard in `js/ascent.js` (18 Nov): once the screen is entirely inside the solid part of the temple close-up, `#plate` and `#peak` are hidden (they're covered anyway), and `#detail`/`#peak` are never laid out bigger than 4096px (magnified beyond that). Before, layers reached 26k px (phone) / 51k px (desktop) and iPhones dropped the mountain + sky, showing only the temple after scrolling back up. Verified pixel-identical frames old vs new.
- **Full hand-over from the design chat** (timeline numbers, constants, asset sources, how the orbit clip was made, open items): `docs/ascent-handoff.md`. Read it before changing the homepage journey, the orbit or the Location descent. (`.vercelignore` keeps `docs/`, `CLAUDE.md`, `README.md`, `package.json`, `src/` off the live site – checked 18 Nov after CLAUDE.md was found downloadable at greekgodfitness.org/CLAUDE.md. Anything new that is internal must be added there too.)

## Words Oliver uses
- **"push"** = commit and push to `main`. Vercel builds it (state READY) but greekgodfitness.org does **not** change yet. Give Oliver the build's preview URL if useful.
- **"deploy"** = make it live: promote the latest READY production deployment of `main` to greekgodfitness.org (Vercel connector `request_promote`, team `greek-god-fitness`, project `greek-god-fitness-site`), then confirm the domain serves it. If there are unpushed changes, push first.
- Log both to Olympus HQ (Dienekes): a `push` event on push, a `deploy` event when it goes live.
- When the stop-hook reminder asks to commit/push, just do it (Oliver approved this): a push is safe because it doesn't go live.
- **Deploy without asking (Oliver, 18 Nov):** once a change is finished and has passed testing (desktop + phone, no errors, what he asked for), push AND deploy it straight away, confirm the live domain serves it, and tell him it's live. Don't end with "say deploy". Still ask first for anything that costs money, deletes things, or that he hasn't approved (e.g. a big redesign he hasn't seen yet – show a preview first).

## The agent team (Olympus HQ)
Olympus HQ is a private 3D world showing who is working on what: https://claude.ai/artifact/YHbUtPccTBfy5JmmEFrpnk
**Keep Olympus HQ and greekgodfitness.org completely separate.** Olympus HQ is only Oliver's private viewing window: it shows the agents and the work. Never put it, link to it, or embed it on the website, and never let it change the website. The only connection is one-way: when work is done on the site, it gets logged to Olympus HQ.
Claude is **Zeus** and hands out the work. Do each job "as" the agent whose role fits, and log it to the world (see below).

| Agent | id | Role |
|---|---|---|
| Zeus | `zeus` | Claude – takes Oliver's requests, gives orders |
| Leonidas | `leonidas` | **Security Guard**, King of the Spartans – checks contact links, forms and code for anything unsafe or exposed. Hero (kind `hero`, look `king`) |
| Daedalus | `daedalus` | Master Builder – edits the site code |
| Dienekes | `dienekes` | Deployer – pushes to `main`, checks Vercel, rolls back if broken |
| Ariston | `ariston` | Scout – researches other websites for ideas |
| Kallias | `kallias` | Tester – checks desktop + phone, speed and errors before going live |
| Odysseus | `odysseus` | Search (SEO) – gets the site found on Google, e.g. "personal trainer Limassol". Hero (kind `hero`, look `wanderer`) |
| Hermes | `hermes` | **God of Speed** – Speed Guardian (keeps pages fast on phones, shrinks heavy images/video) and messenger: carries Zeus's orders to the agents. God (kind `god`, look `hermes`), lives at the Temple of Hermes |
| Argos | `argos` | Watchman – checks the site is up, no errors, warns if a deploy broke it |
| Homeros | `homeros` | Copywriter – page wording, offers and calls to action |
| Pythagoras | `pythagoras` | Analyst – reads visitor numbers (pages, phone vs computer, where people come from, where they drop off) and suggests what to change. Uses Vercel Web Analytics |
| Mnemosyne | `mnemosyne` | **Goddess of Memory** (female: long dark hair, laurel wreath, purple gown, golden scroll – kind `god`, look `goddess`) – keeps the records: updates CLAUDE.md and Oliver's key-moments file (`/home/user/Claude-Code-Key-Moments.md`, sent to him to download after every important change) so nothing is lost between sessions. God (kind `god`) |
| Cadmus | `cadmus` | Translator – builds and maintains a Greek version of the site (locals search in Greek, e.g. "γυμναστής Λεμεσός"). Not started yet |

Not added yet (suggested for later): Peitho (turns visitors into bookings), Calliope (articles/posts), Nike (reviews).

New agents: Spartans by default; a bigger role can be promoted to a god (`kind: "god"`) or a new god created.

### Weekly check-in (every Monday 08:39 Cyprus time)
A scheduled task (`trig_01VJBeCmG766nLzRvf2B7KkM`, "Olympus weekly check-in") fires into the original Claude Code session (`session_01UUP78rSra6P5Et9sSxusf7`, where the Vercel and Olympus HQ connections work). Read-only: Argos (site health), Pythagoras (last week's visitors), Odysseus (search & mentions), logged live in Olympus HQ, then a short report for Oliver. It never edits, pushes or deploys.

### Logging work to Olympus HQ
Use the artifact database tools (`db_write`) on the Olympus HQ artifact:
- When an agent starts a task: update `agents/<id>` with `status: "working"`, `project`, `task`; set back to `status: "idle"`, `task: ""` when done.
- Add an `events/<unique-id>` doc for each task, push, deploy and new project: `{ type: "task"|"push"|"deploy"|"project"|"note", agent, project, text, at: <ms timestamp> }`.
- Projects live in `projects/<id>` (the website is `ggf-site`). A new project gets a new temple.
- **Security threats:** when Leonidas finds something unsafe (exposed key, broken/unsafe form or link, vulnerable code), log `{ type: "threat", agent: "leonidas", project, text }`. Leonidas calls every Spartan into a phalanx in front of the Pantheon. When it's fixed, log `{ type: "secured", agent: "leonidas", project, text }` and they stand down.

## Analytics (Pythagoras)
- **Live since 16 Nov 2026.** Web Analytics is enabled in Vercel and the script is on all three pages. Read numbers with the Vercel connector (`count_pageviews` etc., project `greek-god-fitness-site`).
- Lesson: Vercel only serves `/_vercel/insights/script.js` from builds made *after* enabling Analytics, so if it is ever re-enabled, rebuild before deploying.
- It only collects data once Web Analytics is enabled for the project in the Vercel dashboard (Project → Analytics → Enable) and the code is deployed. Check both before reading numbers (Vercel connector analytics tools, team `greek-god-fitness`).
- Cost: free on Vercel's Hobby plan up to 50,000 events (page views) a month; beyond that collection pauses rather than charging. Ask Oliver before upgrading or adding any paid analytics.

## SEO (Odysseus)
Goal from Oliver: top 3 on Google for Limassol personal training; the brand is premium/luxury.
- Done 16 Nov 2026: keyword page titles ("… Personal Trainer in Limassol"), canonical + Open Graph tags, schema.org `HealthClub`/`LocalBusiness` JSON-LD on the homepage and `Service` on the other pages, `sitemap.xml`, `robots.txt`, hidden homepage `<h1>` mentions Limassol. Homepage title is exactly "Greek God Fitness | Personal Training in Limassol" (Oliver: no "luxury" in it).
- Per-page SEO (16 Nov): Personal Training + Nutrition pages have keyword descriptions and an FAQ section (`css/faq.css`, facts only from existing page copy – never invent prices/hours/claims); descriptive image alt texts on all pages.
- Keep the homepage meta description saying "Germasogeia, Cyprus" (Oliver's choice). Visible headings stay as designed.
- Homepage free-session band: says "Come in, train with us…" (not "Oliver"), and under the Book on WhatsApp button a small gold ★★★★★ "97 five-star reviews on Google" line links to the Google Business Profile (styles in `css/pop.css`). Update the number as reviews grow.
- The coach quote ("It would be a shame to grow old…") uses the same molten-gold shine as the titles; its rules live at the end of `css/pop.css` (the approved block in `style.css` is untouched).
- WhatsApp links in `js/config.js` pre-fill "Hi Oliver, I found Greek God Fitness on your website…" so enquiries from the site are recognisable. Andre's `dietWhatsapp` is left alone.
- Next (needs Oliver's Google account): Google Business Profile, Google Search Console (submit the sitemap), collect Google reviews. Opening hours: Monday–Friday 07:00–18:00, closed Saturday and Sunday (Oliver, 16 Nov) – in the homepage schema. Google Business Profile (~97 five-star reviews): https://maps.app.goo.gl/j6efqRGQ95VzjWyq8 – linked in the homepage schema (`sameAs`, `hasMap`) and from the address link in the Location section.

## AI search / GEO (Odysseus)
Goal: get recommended by ChatGPT, Claude, Gemini, Perplexity, Grok for Limassol personal training.
- `llms.txt` (site root) = plain fact sheet for AI assistants. Facts only from the site/Oliver; keep it in sync when hours, reviews count, services or contacts change.
- `robots.txt` explicitly allows AI search crawlers (OAI-SearchBot, ChatGPT-User, GPTBot, ClaudeBot, Claude-User, Claude-SearchBot, PerplexityBot, Perplexity-User, Google-Extended, Applebot-Extended, Bingbot). Vercel firewall: default only, nothing blocks AI bots (checked 17 Nov).
- Off-site (needs Oliver): Bing Places + Bing Webmaster Tools (ChatGPT search leans on Bing), Apple Business Connect, consistent listings and reviews beyond Google, local mentions/articles.
