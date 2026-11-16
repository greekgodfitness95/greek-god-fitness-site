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
- Desktop: head follows the mouse in every direction (unchanged – keep exactly as is).
- Phone (`pointer: coarse`): `PHONE_TILT_ONLY = true` in `src/GGFSpartan.tsx` – he always looks down; left/right tilt picks lower-left / down / lower-right; no finger steering, no idle look-around; starts on frame 114.
- Known issue: the head still glitches somewhat when moving; Oliver wants to improve it later.

## Words Oliver uses
- **"push"** = commit and push to `main`. Vercel builds it (state READY) but greekgodfitness.org does **not** change yet. Give Oliver the build's preview URL if useful.
- **"deploy"** = make it live: promote the latest READY production deployment of `main` to greekgodfitness.org (Vercel connector `request_promote`, team `greek-god-fitness`, project `greek-god-fitness-site`), then confirm the domain serves it. If there are unpushed changes, push first.
- Log both to Olympus HQ (Dienekes): a `push` event on push, a `deploy` event when it goes live.
- When the stop-hook reminder asks to commit/push, just do it (Oliver approved this): a push is safe because it doesn't go live. Never **deploy** without Oliver saying "deploy".

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

New agents: Spartans by default; a bigger role can be promoted to a god (`kind: "god"`) or a new god created.

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
- Done 16 Nov 2026: keyword page titles ("… Personal Trainer in Limassol"), canonical + Open Graph tags, schema.org `HealthClub`/`LocalBusiness` JSON-LD on the homepage and `Service` on the other pages, `sitemap.xml`, `robots.txt`, hidden homepage `<h1>` mentions Limassol.
- Per-page SEO (16 Nov): Personal Training + Nutrition pages have keyword descriptions and an FAQ section (`css/faq.css`, facts only from existing page copy – never invent prices/hours/claims); descriptive image alt texts on all pages.
- Keep the homepage meta description saying "Germasogeia, Cyprus" (Oliver's choice). Visible headings stay as designed.
- WhatsApp links in `js/config.js` pre-fill "Hi Oliver, I found Greek God Fitness on your website…" so enquiries from the site are recognisable. Andre's `dietWhatsapp` is left alone.
- Next (needs Oliver's Google account): Google Business Profile, Google Search Console (submit the sitemap), collect Google reviews. Opening hours are not known yet – add them to the schema when Oliver gives them.
