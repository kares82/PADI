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

- **Sound check.** padi-dpk.pages.dev/tools/sound-check — tap through, mark
  what sounds wrong, send the list. The respellings are reasoned, not heard.
- **Real Tamil audio.** `Add-WindowsCapability -Online -Name
  "Language.TextToSpeech~~~ta-IN~0.0.1.0"` in an Administrator PowerShell,
  then reboot. Removes the retroflex problem instead of working around it,
  and lets `tools/make-audio.ps1` bake proper recordings in for everyone.
- **Jaffna review of the `LK` column** in `app/register.js`. The Indian and
  formal columns are high confidence; the Sri Lankan one needs a native
  speaker before the app is shown around.
