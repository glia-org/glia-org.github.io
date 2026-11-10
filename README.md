# glia-org.github.io

The page of the glia-org organisation at `https://glia-org.github.io/`: software by Paul Klemm. One page: the
wordmark and two sentences, a drawing of the five projects as one tissue, a band per project in that project's own
palette, mark and type (Glia, Tanycyte, Importin, Lemna, Moin Journal), the rules below and a foot. Plain static
files, served by GitHub Pages.

## Files

| path | what |
|---|---|
| `index.html` | the page; the hero's two drawings are inline SVG between `<!-- hero:desktop -->` and `<!-- hero:phone -->` markers |
| `assets/site.css` | the look: the page, then one block per project band, then the hero's keyframes and its day and night paints |
| `assets/site.js` | the hero's loop only (523 bytes): sets `data-step` 1 to 6 on the figure on a 4-4-4-4-4-3 s clock; holds while the pause box is ticked; does nothing under reduced motion |
| `assets/fonts/` | Literata, a subset (below), with its licence `OFL.txt` |
| `assets/favicon.svg`, `assets/apple-touch-icon.png` | a Literata *g*, outlined; the 16 px form in weight 600, larger in 400; the touch icon is the *g* on the dark ground, 180 px |
| `assets/img/<project>/` | each band's picture (provenance below) |
| `tools/hero/` | the generator of the hero's drawings (Python, standard library only) |
| `checks/site.py` | the checks below; run before every commit |
| `.github/workflows/pages.yml` | publishes the repository root once Pages is set to GitHub Actions |
| `.nojekyll` | tells GitHub Pages to serve the files as they are |

## Rules

1. **Plain static files.** No build step, no framework, no package manager.
2. **No third-party requests.** The font is self-hosted; no CDN, analytics, cookies or embeds. External URLs appear
   only as links, plus the canonical URL. `checks/site.py` enforces this.
3. **Every claim is true of the build** the band's state line names; numbers say where they were measured. No
   superlatives, no exclamation marks, no slogans. Each picture says what it is: a screenshot with its date, or a
   drawing.
4. **Complete without JavaScript.** Without the script the hero shows its resting state (the brief beside Glia, the
   written line in the app, today's page in the folder); the membranes still breathe and the cursors blink. Under
   `prefers-reduced-motion` nothing moves: no step, no keyframes, no blinking, no pause box; Importin's pore stops
   where it is. The drawing not shown at a width is `display: none`, so it does not animate.
5. **Phones get one column** and 16 px gutters; the hero switches to its phone drawing at 760 px and below. The bands
   go to one column below 960 px.
6. **Budget.** First load at most 600 kB, at most 120 kB without images, counted as transferred (text gzipped, as
   GitHub Pages serves it; of a light/dark pair of pictures the larger). On 2026-11-10, measured by
   `checks/site.py`: 294.3 kB, of which 107.1 kB without images (the page with both inline drawings 26.2 kB, the font
   75.0 kB, the stylesheet 5.5 kB, the script 0.3 kB).
7. **One place for Glia's page.** Glia's page is not published, so its band has no link. An HTML comment at Glia's
   state line holds the link (`href="/glia/"`) and where it goes back once the page is published; it is the only
   place for that path.

## Preview

Open `index.html` in a browser; no server is needed.

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
to the set and cut the file again. Code and keys are set in the system's monospaced face. Glia's page serves Cascadia
Code; it is not used here, because the file is 218 824 bytes and its licence names it a Reserved Font Name, so a
subset would have to be renamed.

## Pictures and marks: where each comes from

| band | mark | picture | label on the page |
|---|---|---|---|
| Glia | the 20 × 20 pixel astrocyte of `glia.github.io/assets/favicon.svg`, its accent cell blinking (CSS) | `img/glia/window-drawing.png`: the drawn window of Glia's page (`glia.github.io`, commit 1e02732) at rest (`?still`), captured in headless Chrome at 2×, scaled to 1240 px, 256 colours | drawing, not a screenshot |
| Tanycyte | `tanycyte/assets/logo/out/lockup-light.svg` and `lockup-dark.svg`, by the system's appearance | `img/tanycyte/library-screenshot.png`: `tanycyte/docs/screenshot-fixture-library-open.png` (the face's `--snapshot` with fixture data, round 8, 2026-11-06), 256 colours | screenshot, 2026-11-06 |
| Importin | the eight facets of `importin/site/assets/favicon.svg` (its large form) | `img/importin/pore.svg`: `importin/docs/readme-hero.svg` unchanged, CSS keyframes inside | drawing |
| Lemna | `lemna/site/assets/img/mark-M3.svg`, the line in the text colour and the caret in the accent | `img/lemna/still-day.png`, `still-night.png`: `lemna/site/assets/img/demo-day.png` and `demo-night.png` unchanged, cut from the app's own offscreen renders (Lemna's commit 12c6917, 2026-11-06, a build after v0.1.0) | screenshot, 2026-11-06 |
| Moin Journal | `moin-journal/assets/brand/logo/mark-light.svg`, its three colours taken from the band (Abendlicht, `assets/brand/abendlicht.json`) | the same mark, large; the repository has no screenshot of the app | drawing |

Palettes: Glia, Tokyo Night as on Glia's page (dark only); Tanycyte, Tokyo Night Day's ground by day and Tokyo
Night's darkest by night with the lockups' colours; Importin, its page's violet dark (dark only); Lemna, its page's
paper and warm dark; Moin Journal, Abendlicht's paper and ink-blue. Facts in each band come from that project's
README, site and documents as of 2026-11-10.

## Checks

`python3 checks/site.py`: nothing loaded from another origin, every external URL a plain link, no placeholder, no
banned word or "!" at a sentence end, the font subset covering the page's text, every local file and `#fragment`
present, no id twice, every element closed, no network calls in scripts, and the budget. It lists the external
links, the links to other pages of this site and the size of every file the page loads.

## Licence

Apache License 2.0 (`LICENSE`). Literata under the SIL Open Font License 1.1 (`assets/fonts/OFL.txt`).
