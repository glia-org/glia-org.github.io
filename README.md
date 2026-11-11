# glia-org.github.io

The page of the glia-org organisation at `https://glia-org.github.io/`: software by Paul Klemm. One page: the
wordmark and two sentences, a drawing of the five projects as one tissue, a band per project (Glia, Tanycyte,
Importin, Lemna, Moin Journal), the rules below and a foot. Each band is a miniature of that project's own page: its
palette, its type and fonts, its spacing and its hero, live where the project has one; the bands need not agree with
one another. Each band opens with the same banner in this page's own style (rule 9). Plain static files, served by
GitHub Pages.

## Files

| path | what |
|---|---|
| `index.html` | the page; the hero's two drawings are inline SVG between `<!-- hero:desktop -->` and `<!-- hero:phone -->` markers; each band follows an HTML comment that names the project's repository and commit it was taken from |
| `assets/site.css` | the frame's look: the page, the bands' container (`content-visibility: auto`, so a band off screen waits with its fonts and pictures), the bands' banners, then the hero's keyframes and its day and night paints |
| `assets/site.js` | the hero's loop only (524 bytes): sets `data-step` 1 to 6 on the figure on a 4-4-4-4-4-3 s clock; holds while the pause box is ticked; does nothing under reduced motion |
| `assets/bands/<project>.css` | each band's look, one file per band (`glia`, `tanycyte`, `importin`, `lemna`, `moin`); ported from the project's page with its classes, ids and keyframes prefixed (`gl-`, `ty-`, `im-`, `lm-`, `mj-`), its page-wide rules scoped to the band |
| `assets/bands/load.js` | fetches a band's script (its `data-js`) once the band is within one screen of the view |
| `assets/bands/glia.js` | Glia's hero from its page: the astrocyte field (WebGL 2) and the drawn window's playback |
| `assets/bands/lemna.js` | Lemna's demo from its page, without sound |
| `assets/fonts/` | Literata, a subset (below), with its licence `OFL.txt`; `glia/`: Cascadia Code, unmodified, with its licence; `lemna/`: Lemna's Latin file of Literata, unmodified, with its licence |
| `assets/favicon.svg`, `assets/apple-touch-icon.png` | a Literata *g*, outlined; the 16 px form in weight 600, larger in 400; the touch icon is the *g* on the dark ground, 180 px |
| `assets/img/<project>/` | each band's picture or still (provenance below) |
| `tools/hero/` | the generator of the hero's drawings (Python, standard library only) |
| `checks/site.py` | the checks below; run before every commit |
| `.github/workflows/pages.yml` | publishes the repository root once Pages is set to GitHub Actions |
| `.nojekyll` | tells GitHub Pages to serve the files as they are |

## Rules

1. **Plain static files.** No build step, no framework, no package manager.
2. **No third-party requests.** The font is self-hosted; no CDN, analytics, cookies or embeds. External URLs appear
   only as links, plus the canonical URL. `checks/site.py` enforces this.
3. **Every claim is true of the build** the band's banner names; numbers say where they were measured. No
   superlatives, no exclamation marks, no slogans; plain sentences with a verb, about 20 words at most. A caption says
   what its picture means; what the picture is (a screenshot and its date, or a drawing) and how the band is made go
   in the HTML comment before the band and in the table below, not on the page.
4. **Complete without JavaScript.** Without scripts the hero shows its resting state (the brief beside Glia, the
   written line in the app, today's page in the folder); the membranes still breathe and the cursors blink. Each band
   shows a still: Glia the PNG of its drawn window at rest, and its specimen pane stays empty; Lemna its stills
   (by day and by night); Tanycyte its screenshot; Importin's pore and Moin Journal's folder are CSS and run. Under
   `prefers-reduced-motion` nothing moves: no step, no keyframes, no blinking, no pause box; Glia's field is drawn
   once and its window stays at rest; Lemna shows its stills; Importin's letters stop where they are; Moin Journal's
   folder stands at the entry just filed. The drawing not shown at a width is `display: none`, so it does not animate.
5. **Phones get one column** and 16 px gutters; the hero switches to its phone drawing at 760 px and below. Each band
   keeps its own page's breakpoints (Glia 760 px, Importin 900 and 640 px, Lemna 760 px, Tanycyte and Moin Journal
   960 and 760 px); Glia's drawn window scrolls sideways on a phone, as on its page.
6. **Budget.** As transferred (text gzipped, as GitHub Pages serves it; of a light/dark pair of pictures the larger),
   checked by `checks/site.py`: what every load fetches (the page, the stylesheets, the two small scripts, Literata,
   the icons) at most 160 kB, and the whole page with every band's fonts, pictures and scripts at most 1.1 MB. On
   2026-11-11 `checks/site.py` counts 134.3 kB for every load (the page 36.0 kB, the six stylesheets 19.9 kB, the font
   75.0 kB) and 565.2 kB for the whole page, counting each band's stills too. Measured in headless Chrome at
   1400 × 1000 px on 2026-11-10: the first screen fetches 393.9 kB in 15 requests, Cascadia Code (218.8 kB) among
   them, since the top of Glia's band shows on that screen, with Glia's script (13.7 kB) and Tanycyte's screenshot
   (28.0 kB), which the browser fetches a screen ahead; the page with every band visited 409.6 kB in 16 requests
   (Lemna's script, 15.6 kB, more). Lemna's Latin file (224.2 kB) comes only for a character typed into its box that
   the subset lacks.
7. **One place for Glia's page.** Glia's page is not published, so its band has no link. An HTML comment in the
   links slot of Glia's banner holds the link (`href="/glia/"`) and where it goes once the page is published; it is
   the only place for that path.
8. **A band is its project's page in miniature.** Its look, type, rhythm and hero come from the project's own page
   at the commit its comment names (Tanycyte and Moin Journal have no page: from their face, brand and documents).
   The port keeps the page's code and prefixes its names; nothing is left on `window`. A live piece runs only while
   its band is in view (`IntersectionObserver`) and the tab is shown; Glia's WebGL context is made when its band first
   comes into the upper four fifths of the window. Where the project's page has a pause, the band has it: a click on
   Glia's window, Importin's box; Moin Journal's folder has one too. No sound.
9. **One banner per band.** Every band opens with the same strip: the project's name, its state,
   its links. Its structure, spacing and type are this page's (Literata at 15 px, one hairline under it); its colours
   are the band's own text, muted, line and accent. The state is one of `in development`, `pre-release v…` or
   `released v…`, with the platform. Links (Site, Source, Releases) appear only where they are public; a private
   repository reads `source private`, never a dead link. What the banner says is not said again in the band below.
   Plain HTML and CSS; nothing in it moves. At 960 px and below the name's column narrows; at 760 px and below the
   state and the links go under the name.

## Preview

Open `index.html` in a browser; no server is needed. `?nogl` shows Glia's band as a browser without WebGL 2 does.

## The hero

`python3 tools/hero/hero.py` rewrites the two inline drawings in `index.html` between their markers. The committed
`index.html` is the source of truth; run the generator only to change the drawing. The drawing's CSS (the shared
classes, the loop's moments, the day and night paints) is the last block of `assets/site.css` and is kept by hand.
`tools/hero/tissue.py` holds the drawing helpers (paths, tapering processes, cells, organelles). The generator was
approved as a live mockup on 2026-11-10; its output here differs from the mockup's in the labels' links (to the project
sections), the classes that tell the two drawings apart, line breaks, and Moin Journal's folder: the cloud, the
sync line and its moving dot are gone and the label reads `your folder`, since Moin Journal's build has no sync yet.

## Fonts

Literata by the Literata Project Authors, SIL Open Font License 1.1 (no Reserved Font Name), taken from Importin's
site (`site/assets/fonts/literata-latin.woff2`, 224 240 bytes, the Latin file of Lemna's page) and cut to the
characters this page sets in it, both axes (opsz 7 to 72, wght 200 to 900) kept, with fontTools:

```
pyftsubset literata-latin.woff2 --unicodes="U+0020-007E,U+00A0,U+00B7,U+00D7,U+00E9,U+2013-2014,U+2018-201D,U+2026" \
  --name-IDs='*' --notdef-outline --flavor=woff2 --output-file=assets/fonts/literata-latin.woff2
```

75 044 bytes. `checks/site.py` fails if text outside `<code>` and `<kbd>` uses a character outside this set; add it
to the set and cut the file again. A band set in a face of its own carries `data-face`, and its text is not held to
the set: Glia's band is all Cascadia Code, Tanycyte's Cascadia Code and the system's face, Moin Journal's folder the
system's face. Elsewhere code and keys are set in the system's monospaced face.

Cascadia Code © Microsoft Corporation, SIL Open Font License 1.1 with the Reserved Font Name "Cascadia Code":
`assets/fonts/glia/CascadiaCode.woff2` (218 824 bytes) and `OFL-CascadiaCode.txt`, the files Glia's page serves,
copied unmodified, so the name may stay. Glia's band and Tanycyte's use it.

Lemna's band sets its line in "Lemna Literata", two faces: this page's subset for the characters it holds, and
Lemna's Latin file (`assets/fonts/lemna/literata-latin.woff2`, 224 240 bytes, unmodified, with `OFL.txt`) for the
other Latin characters it holds (`unicode-range`, the two ranges apart). A visitor typing only those the subset holds
never fetches the larger file.

## Pictures, marks and ported code: where each comes from

| file | from (repository, commit, path) | licence |
|---|---|---|
| `assets/bands/glia.css`, `assets/bands/glia.js`, Glia's band in `index.html` (the lockup, the panes, the drawn window, the figure's `<defs>`) | glia.github.io 1e02732: `assets/site.css`, `assets/site.js` (the GPU piece, the drawn window's playback), `index.html` (sections 01 and 06); names prefixed `gl-`; the field's canvas covers the band, not the window; one fix: a wave fired inside a frame no longer starts a second chain of frames | Apache 2.0 |
| `assets/img/glia/window-drawing.png` | the drawn window of glia.github.io 1e02732 at rest (`?still`), captured in headless Chrome at 2×, scaled to 1240 px, 256 colours; the still without scripts or WebGL 2 | Apache 2.0 |
| `assets/fonts/glia/CascadiaCode.woff2`, `OFL-CascadiaCode.txt` | glia.github.io 1e02732 `assets/fonts/`, unmodified | OFL 1.1, Reserved Font Name "Cascadia Code" |
| `assets/bands/tanycyte.css`, Tanycyte's band | written here after tanycyte f03dc5f: `face/README.md`, `face/src/theme.rs` (Glia's mono for data, the system's face for prose, 13 px on 16 px rows), the face's screenshot; the key legend's keys are the library's | this repository's |
| `assets/img/tanycyte/lockup-light.svg`, `lockup-dark.svg` | tanycyte `assets/logo/out/` (unchanged at f03dc5f), by the system's appearance | MIT |
| `assets/img/tanycyte/library-screenshot.png` | tanycyte `docs/screenshot-fixture-library-open.png` (the face's `--snapshot` with fixture data, round 8, 2026-11-06, commit 1c6ee79), 256 colours; the repository has no drawn or animated brief | MIT |
| `assets/bands/importin.css`, Importin's band (header, lead, the pore with its pause box, "How it works") | importin 626fff9 (v0.1.1): `site/assets/site.css`, `site/index.html`; names and keyframes prefixed `im-`; its `site.js` (play in the pore, letters behind the whole window) is not ported, as it draws outside the band | Apache 2.0 |
| `assets/bands/lemna.css`, `assets/bands/lemna.js`, Lemna's band (header, the demo's stage) | lemna 2a325d6: `site/assets/site.css`, `site/index.html`, `site/assets/site.js` (last changed in ea059ad); names prefixed `lm-`; the sound (clicks, bed, their switches) and the Ambience tiles left out | Apache 2.0 |
| `assets/img/lemna/still-day.png`, `still-night.png` | lemna `site/assets/img/demo-day.png` and `demo-night.png` unchanged (12c6917, the same at 2a325d6), cut from the app's own offscreen renders of a build after v0.1.0 | Apache 2.0 |
| `assets/fonts/lemna/literata-latin.woff2`, `OFL.txt` | lemna 2a325d6 `site/assets/fonts/`, unmodified (the file importin's page serves) | OFL 1.1 |
| Glia's astrocyte and Tanycyte's fan (the marks in their bands' headings) | Glia's: the cells of the lockup in Glia's band (glia.github.io 1e02732 `index.html`, the same cells as its `assets/favicon.svg`), without the blink; Tanycyte's: the fan of `assets/img/tanycyte/lockup-*.svg` (tanycyte `assets/logo/out/`, f03dc5f) with its squircle clip, inline, its two colours taken from the band's palette | Apache 2.0 (Glia), MIT (Tanycyte) |
| `assets/bands/moin.css`, Moin Journal's band | written here from moin-journal 2de4f05: `assets/brand/abendlicht.json` (the palette), `assets/brand/logo/mark-light.svg` (the mark's paths in its heading, its colours from the palette), `README.md`, `docs/mac-app.md`, the design spec's store layout (5.1); the folder's names are ULIDs of the dates shown | the brand files CC0 1.0 (moin-journal's `ATTRIBUTION.md`) |
| Importin's eight facets, Lemna's line and caret (the marks in their bands' headers) | importin 626fff9 `site/index.html` (the header's mark, K7), lemna 2a325d6 `site/index.html` (the brand's mark, `site/assets/img/mark-M3.svg`) | Apache 2.0 |

Palettes: Glia, Tokyo Night as on Glia's page (dark only); Tanycyte, Tokyo Night Day's ground by day and Tokyo
Night's darkest by night; Importin, its page's violet dark (dark only); Lemna, its page's paper and warm dark; Moin
Journal, Abendlicht's paper and ink-blue. Facts in each band come from that project's README, site and documents as
of 2026-11-10.

## Checks

`python3 checks/site.py`: nothing loaded from another origin, every external URL a plain link, no placeholder, no
banned word or "!" at a sentence end, the font subset covering the page's text, every local file and `#fragment`
present, no id twice, every element closed, no network calls or `http` URLs in scripts (the bands' `data-js` scripts
among them), and the budget. It lists the external
links, the links to other pages of this site and the size of every file the page loads.

## Licence

Apache License 2.0 (`LICENSE`). Literata under the SIL Open Font License 1.1 (`assets/fonts/OFL.txt`, and
`assets/fonts/lemna/OFL.txt` beside Lemna's file); Cascadia Code under the SIL Open Font License 1.1
(`assets/fonts/glia/OFL-CascadiaCode.txt`).
