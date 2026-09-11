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
├── CAPTURE-TODO.md                   content the spec promised but omitted
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

## Before this goes live

Read `CAPTURE-TODO.md`. The spec described several strings as transcribed
verbatim that it does not actually contain, and the email address is missing.
Those gaps are marked in the source rather than filled with invented copy:

```bash
grep -rn "TODO(capture)" .
```
