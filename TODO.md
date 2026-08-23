# Open items

## Voice output is off

`VOICE = false` at the top of `app/engine.js`. That one line hides every
speaker button, stops the clip loader and makes `speak()` a no-op; the
scoring tones are not speech and still work. Flipping it back to `true` is
the whole job - verified by flipping it and watching the buttons return.

The 627 Microsoft Valluvar clips are still in `audio/` and still correct.
They are not good enough to learn from, so the plan is to re-record with
Sarvam Bulbul v3 and flip the switch. See `tools/make-audio-sarvam.ps1`.

Things spotted while using the app, to pick up next session.

## Fixed

- ~~**The voice output was unintelligible.**~~ Fixed 23 Aug. Three faults,
  found by measuring rather than listening:
  1. *Clips played on top of each other.* The speech path got one-voice-at-
     a-time free from `speechSynthesis.cancel()`; recorded clips are separate
     elements with no queue, so a screen that speaks as it renders piled onto
     the tap that got you there. Measured three Tamil voices sounding at once.
     Everything audible now goes through one channel, and leaving a screen
     stops it.
  2. *66 tappable words had no recording* - every Aathichudi and Kural word -
     so they fell through to the English approximation, which respells "ka"
     as "kuhh". Recorded; the app is now at 627 clips for 627 speakable
     strings, and the approximation can no longer fire on its own content.
  3. *One clip was genuinely off-pitch.* Pitch-tracking all 246 letter clips
     against the median for their own vowel (close vowels really do sit
     higher, so a single global baseline invents faults) found exactly one
     outlier: chi at 232 Hz where every other -i- syllable sits at 151.
     Re-recorded through SSML at a swept, not guessed, setting.

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
