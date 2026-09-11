# amyinsvg.github.io

Static migration of `amyinsvg.cargo.site`, built before the Cargo
subscription lapsed. **A migration, not a redesign** — the tokens, type scale
and copy were captured from the live site and are reproduced as found, not
improved.

Plain HTML and CSS. No framework, no build step, no npm, no dependencies to
install. `.nojekyll` is present so GitHub Pages serves the files directly.

## Deploy

Settings → Pages → deploy from branch, root. Nothing else to configure.

No `CNAME` and no DNS: the site is a user site at `amyinsvg.github.io`, which
is also the canonical URL and the base for the absolute URLs in the metadata.
If a custom domain is added later, that means a `CNAME` file plus DNS, **and**
updating the `canonical` / `og:url` on all five pages.

## Local preview

Any static server. Relative asset paths mean `file://` mostly works too, but a
server is closer to production:

```bash
python3 -m http.server 8000
```

Two things behave differently locally, both on purpose:

- **The contact form will fail.** The Web3Forms form is registered to
  `amyinsvg.github.io`, and submissions from other origins are rejected. That
  domain restriction is what protects a deliberately public access key — do
  not weaken it to make local testing convenient. Stub `window.fetch` to
  exercise the UI states instead; see below.
- **`404.html` is only served by GitHub Pages**, not by `http.server`. Open it
  directly to check it.

## Layout

```
/
├── index.html                        home — hero, 3 projects, info
├── 404.html
├── .nojekyll
├── contact/
│   ├── index.html                    the real contact page
│   └── thanks/index.html             no-JS POST redirect target
├── work/
│   └── types-and-tomes/index.html    case study — reusable template
└── assets/
    ├── css/{tokens.css, main.css}
    ├── fonts/                        the three OFL families, Latin woff2
    ├── img/favicon.svg
    └── js/contact.js
```

`contact/thanks/` and `assets/js/` are additions to the spec's §2 tree — §8
requires a redirect target for the no-JS path, and the overlay needs somewhere
to live.

## Fonts

Three of the four families are self-hosted; one is not, and that asymmetry is
deliberate.

| Family | Licence | Loaded from |
|---|---|---|
| Inter Tight | SIL OFL | `assets/fonts/` |
| Instrument Serif | SIL OFL | `assets/fonts/` |
| DM Mono | SIL OFL | `assets/fonts/` |
| General Sans | ITF Free Font License | **Fontshare CDN — do not self-host** |

**General Sans must stay on the CDN.** It is free for commercial use, but the
ITF licence forbids redistributing the font files and requires ITF's *written
consent* to self-host it as a webfont. This repository is public, and a public
GitHub Pages repo is a public server, so committing the `.woff2` would be
redistribution. There is a comment saying so at every `<link>`. If you came
here to make the loading consistent: get written consent first.

**Monument Grotesk is not used anywhere.** Dinamo's licence excludes storing
the files on publicly available servers. Both styles that used it fold into
DM Mono per spec §4 — which is why Heading 2 is Medium 500 rather than the
captured 700 (DM Mono has no Bold).

Self-hosted faces are Latin-subset `woff2`, only the weights the design uses,
all `font-display: swap`. The Inter Tight roman is Google's variable Latin
instance declared over `font-weight: 500 600`, so one file covers Medium and
SemiBold at the same payload two static instances would have cost.

## Page shell

Worth understanding before changing any layout, because the obvious reading is
the wrong one.

**Yellow is the page background, not a border.** The cream areas are separate
stacked blocks in a centred column, with the page showing through the gaps
between them — a stack of cards on a coloured page, not one field with
sections inside it. An earlier version of the build spec described it as an
inset frame; that was wrong and `--frame-inset` is gone.

Two nested layers, both from Cargo's own Local Page Settings:

| Layer | Value | Source |
|---|---|---|
| `.page` | 50% of viewport, centred | Cargo "Width 50" |
| `.block` | cream, inset 4.1% of the page each side → 45.9% of viewport | Cargo "Inset 3"; measured 45.8 / 45.9 / 45.9 / 46.1 |
| gap | 8.54% of page width = 9.3% of the cream's own width | measured 142px against a 1530px column |

The header sits on the yellow above the first block, aligned to the column,
and is static rather than sticky — it has no background of its own, so
sticking it would drag transparent text over the cream as it scrolls.

The hero fills the first screen with the name bottom-left. Note that the
**first screen** is `100svh` — the hero is `100svh` minus the header and gap —
rather than the hero block alone being `100svh`, which would push the
bottom-aligned name below the fold. `svh` not `vh`, so the block doesn't jump
when mobile browser chrome shows and hides.

On mobile the 50% column does not hold: Cargo's "Maximize Page Width" is on,
so the page goes full width with reduced padding and a small inset retained so
the yellow still reads. Cargo's "Scale 140%" is a rendering mechanic, not CSS;
it is honoured as a single 1.15x root-size bump so all 17 styles keep their
proportions, not by multiplying every size by 1.4.

**One caveat, deliberately unresolved:** Cargo's captured settings are scoped
to the Cover page only. Every other section is a separate Cargo page with its
own settings, which will differ — at minimum 100% Height does not apply to
them. The Cover values are applied to every block as the best available
approximation, so **the non-hero blocks are not verified.** Screenshotting
each page's two settings panels before the subscription lapses would settle it.

## Tokens

`assets/css/tokens.css` holds every colour, family, size and spacing value.
Nothing is hardcoded anywhere else — the one unavoidable exception is
`assets/img/favicon.svg`, because an SVG file cannot read CSS custom
properties. Its two hex values are commented with the tokens they mirror.

## Contact form

`/contact/index.html` is a **real page**, built first; the overlay is layered
on top of it. That order is the point:

- JS off or broken → the Contact link navigates, the form native-POSTs to
  Web3Forms, which redirects to `/contact/thanks/`
- middle-click, cmd-click, open-in-new-tab → not intercepted, navigates
- JS working → the same form opens in a native `<dialog>` and submits by
  `fetch`, so the result renders in place

Triggered from all three places §8 asks for: the header `Contact` link, the
email address in the Info block, and `Let's talk →`.

The `access_key` in the markup is **public by design** and safe to commit — it
ships in client-side HTML by definition, like a Firebase web config key. The
domain restriction, not secrecy, is what protects it.

### Testing the three states locally

The live endpoint will reject localhost, which is correct. Stub the network
call in the browser console, then submit:

```js
// STATE 2 — sent
window.fetch = () => Promise.resolve(new Response(JSON.stringify({success:true, message:"ok"}), {status:200}));
```

```js
// STATE 3 — failed, server rejected. Typed text must survive.
window.fetch = () => Promise.resolve(new Response(JSON.stringify({success:false, message:"Domain not allowed"}), {status:403}));
```

```js
// STATE 3 — failed, network down
window.fetch = () => Promise.reject(new Error("Failed to fetch"));
```

State 1 (sending) is visible in between; to hold it, resolve after a delay.

The failure state deliberately keeps every field intact and surfaces the email
address as a fallback. A form that silently swallows a message is worse than
no form.

## Content status

All copy is transcribed verbatim from the live Cargo site. The one exception is
the alt text on the three homepage project blocks: the source has no images
there, so nothing existed to transcribe and those three strings were written
rather than captured. They are marked in the source:

```bash
grep -rn 'data-alt-source="written"' .
```

Replace them when real images land; per spec §5 the string then moves to the
`alt` attribute. Two strings are knowingly stale and left as found, flagged for
Amy rather than corrected here: "Booking Q3 2026".
