# Greek God Fitness – website

Plain HTML/CSS pages plus one small script for the Spartan hero.
Nothing needs building to publish: Vercel serves these files as they are.

## Pages
- `index.html` – Home (Spartan hero, Meet the Coach, gallery, location map)
- `personal-training/index.html` – /personal-training
- `nutrition/index.html` – /nutrition

## Things you will edit most
- **Links** (phone, WhatsApp, Instagram, Facebook, TikTok, Book a Session):
  open `js/config.js` and replace each `"#"`.
- **Text**: open the page's `index.html` and change the words between the tags.
- **Photos**: replace the files in `assets/` using the same file names.
- **Colours and sizes**: `css/style.css` (gold is `--gold` at the top).
- **Hero heading / video address**: top of `src/GGFSpartan.tsx`, then rebuild the hero
  with `npm install` and `npm run build:hero` (this rewrites `js/hero.js`).

## Hero video
The video is loaded from GitHub Pages:
`https://greekgodfitness95.github.io/Greek-God-Fitness-assets/spartan-scrub-4k-small.mp4`
Keep that file online, or change `VIDEO_SRC` in `src/GGFSpartan.tsx` and rebuild.
