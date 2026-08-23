# Open items

Things spotted while using the app, to pick up next session.

## Fixed

- ~~**Unit 0, card 3: the coloured parts are messed up.**~~ Fixed 23 Aug.
  Each glyph was cropped to its own ink box and then forced to one CSS
  height, so the shared base letter rendered anywhere from 1.21x to 1.74x
  depending on which mark sat beside it. A card claiming "same letter
  every time" was resizing the letter in every cell. Glyph sets now share
  one vertical frame and display at 1:1.

## Still waiting on the user, from earlier

- ~~**Sound check.**~~ Moot now that real recordings ship. The English
  approximation only runs where no Tamil voice and no clips exist.
- ~~**Real Tamil audio.**~~ Done 22 Aug. Microsoft Valluvar (ta-IN) installed,
  all 561 clips recorded into `audio/` and committed, so the deployed app
  speaks real Tamil to every visitor regardless of their device.
- **Jaffna review of the `LK` column** in `app/register.js`. The Indian and
  formal columns are high confidence; the Sri Lankan one needs a native
  speaker before the app is shown around.
