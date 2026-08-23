# Open items

Things spotted while using the app, to pick up next session.

## Reported 22 Aug 2026 — not yet investigated

- **Unit 0, card 3: the coloured parts are messed up.**
  That is the *"There are twelve marks. That is the whole system."* card —
  the row of க கா கி கீ கு கூ கெ கே கை கொ கோ கௌ where the base letter is
  drawn in ink and the added mark in the accent colour, by `app/compose.js`.
  No detail yet on *how* it is wrong; ask before assuming.
  Worth checking first: the twelve images are laid out in `.viz.wrap` by
  `stepRule()` in `app/ui.js`, and each is a cropped PNG whose height is
  fixed but whose width varies per glyph — the fused ு/ூ forms and the
  wrap-around ொ/ோ/ௌ are the likeliest to look wrong.

## Still waiting on the user, from earlier

- ~~**Sound check.**~~ Moot now that real recordings ship. The English
  approximation only runs where no Tamil voice and no clips exist.
- ~~**Real Tamil audio.**~~ Done 22 Aug. Microsoft Valluvar (ta-IN) installed,
  all 561 clips recorded into `audio/` and committed, so the deployed app
  speaks real Tamil to every visitor regardless of their device.
- **Jaffna review of the `LK` column** in `app/register.js`. The Indian and
  formal columns are high confidence; the Sri Lankan one needs a native
  speaker before the app is shown around.
