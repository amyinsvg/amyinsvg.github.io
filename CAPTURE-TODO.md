# Still to capture from Cargo

Everything here is content the build spec **said** was transcribed but did not
actually include. None of it was invented to fill the gap — inventing
plausible bio and case study prose would be impossible to distinguish from the
real thing later, which is worse than an obvious hole.

All of it is **unrecoverable once `amyinsvg.cargo.site` lapses.**

Find every one of these in the source with:

```bash
grep -rn "TODO(capture)" .
```

The rendered stand-ins are all tagged `data-capture="…"` in the markup:

```bash
grep -rn "data-capture" .
```

---

## Blocking deploy

1. **The email address.** Spec §6 lists "email link" in the Info block but
   never records the address. It is needed in two places, and both currently
   read `hello@example.com` (IANA-reserved, so it cannot reach a stranger by
   accident):
   - `index.html` — the Info block link
   - `assets/js/contact.js` — `CONTACT_EMAIL`, the contact form's failure-state
     fallback

   The failure state exists so a message is never silently lost. With a
   placeholder address it loses them anyway. Fix this first.

## Content the spec promised but does not contain

2. **The five Info paragraphs** (`index.html`, §6). The spec says "the five
   paragraphs from the live site verbatim" and then records only a topic for
   each: *Chinese-American designer / biotech background / Types & Tomes /
   currently taking on work / Chunky Melon named after Melon*. Those topic
   descriptors are what currently renders.

3. **Both case study body paragraphs** (`work/types-and-tomes/index.html`, §7).
   The spec gives opening fragments that trail off mid-sentence:
   - "Types & Tomes is a small-batch craft brand rooted in…"
   - "The brand runs on a tight core system…"

   Both render exactly as the spec has them, ellipsis included.

4. **The four deliverables** (§7). The spec says "Deliverables list (4 items,
   transcribe verbatim)" and does not list them. Four marked placeholders hold
   the layout.

5. **Alt text for six of the seven placeholder images.** Only the 16-9 case
   study image had its string captured ("Types & Tomes brand identity —
   monotype logo and typewriter mark"). The other six carry descriptive
   stand-ins that say so. Per §5 each string moves to the `alt` attribute when
   a real image replaces the box.

6. **Placement of the two in-body case study links** (§7). Which links to keep
   and mute is specified; where they sit in the prose is not, because the prose
   around them was not captured. They currently sit on their own line.

## Open questions, deliberately not resolved here

7. **`--c-ink-mute` status.** The hex is `#606060` either way, so nothing
   renders differently — but the spec and the build request disagree about
   whether that value is *confirmed* or *provisional*. §3, the §4 notes, and
   the §12 checklist all record it as sampled and confirmed. The build request
   describes it as "a placeholder for a colour that was never captured". Noted
   in `assets/css/tokens.css`, not settled.

8. **The style-to-element mapping** (§4). The Cargo panel gave the 17 styles
   but not which element used which. §4's mapping — and therefore every place
   a `.t-*` class is applied in the markup — is inferred from the style names
   and the live markup. Reasonable, unverified, and only checkable against the
   original Cargo editor. Noted in `assets/css/main.css`.

9. **Heading 2's weight.** Captured at 700, but it folds into DM Mono, which
   has no Bold, so it is set at Medium 500 per §4. If 500 reads too light the
   spec's named fallback is moving all six mono styles to IBM Plex Mono (OFL,
   runs to 700) — a design decision, not a build one. Not taken.

## Still outstanding from the spec's own §12 list

- [ ] Full-page screenshots at desktop, tablet and phone widths — the only way
      to check this rebuild against the original
- [ ] Any custom CSS in the Cargo editor
- [ ] Original image files for the Types & Tomes case study

## Known-stale, flagged for Amy, deliberately NOT fixed

§6 marks both of these as stale and explicitly not the build's to correct.
They are transcribed as found:

- "Booking Q3 2026" (Info → Currently)
- "Based in California" (Info → Studio)
