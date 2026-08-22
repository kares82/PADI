# Padi Tamil  ·  படி

**You already speak it.**

An app for Tamils anywhere in the world who can speak Tamil but cannot read or write it — and
who lose the thread the moment the news comes on. It teaches two things:

1. **The script**, in a way that does not begin with a wall of 247 letters.
2. **Written Tamil**, the formal register the news and every book actually uses — which is
   *not* the Tamil you speak, and is the reason fluent speakers still cannot follow a bulletin.

English interface throughout. No account, no internet needed after the first load, no build step.
Runs on a phone, a tablet or a computer.

---

## How to open it

**Easiest:** double-click `index.html`.

**Better:** double-click `start.bat`. It starts a tiny local server and opens the app at
`http://localhost:5177/`. Do it this way if you want offline mode and the "install to home
screen" option. Keep the black window open while you use the app.

### Putting it on a phone

1. Run `start.bat` on the computer.
2. Find the computer's local IP (`ipconfig` → *IPv4 Address*, e.g. `192.168.1.20`).
3. On the phone, open `http://192.168.1.20:5177/` (same Wi-Fi).
4. Browser menu → **Add to Home Screen**. It now behaves like a real app and works with the Wi-Fi off.

### Sound

The app takes audio from two places, in this order:

1. **Recorded clips** in `./audio` — always sound the same, work offline, never depend on the device.
2. **The device's own Tamil speech voice** — used for anything not recorded.

Out of the box there are no recordings, so it uses (2). If the device has no Tamil voice
either, the app says so on the home screen and stays silent; everything else still works.

**To install a Tamil voice**

- **Android:** Settings → Language & input → Text-to-speech → install Tamil
- **iPhone/iPad:** Settings → Accessibility → Spoken Content → Voices → Tamil
- **Windows:** Settings → Time & Language → Speech → Manage voices → Add voices → Tamil, then reboot

**To bake the sounds permanently into the app** (one-off)

This is the real fix: generate all 561 clips once, commit them, and the deployed app
speaks for everyone regardless of what their device has installed.

*Best quality — Google Cloud Text-to-Speech:*

    $env:GOOGLE_TTS_KEY = "AIza..."
    powershell -ExecutionPolicy Bypass -File tools\make-audio-google.ps1 -List
    powershell -ExecutionPolicy Bypass -File tools\make-audio-google.ps1 -Sample
    powershell -ExecutionPolicy Bypass -File tools\make-audio-google.ps1

`-List` shows every Tamil voice Google offers, `-Sample` renders eight clips so you can
listen before committing to the full run, `-Voice` forces a particular one, `-Rate`
changes the speaking speed (default 0.85, deliberately a little slow).

The corpus is 561 clips and about 4,400 characters — roughly 0.4% of Google's monthly
free tier, so a full run is free. Google does require a billing account on file to
enable the API, which is the only catch.

*No account — a Tamil voice installed in Windows:*

    powershell -ExecutionPolicy Bypass -File tools\make-audio.ps1

Free, but you have to add the voice first (Settings → Time & Language → Speech → Manage
voices → Add voices → Tamil, then reboot). `-SelfTest` proves the pipeline works without
needing Tamil installed.

**The API key never reaches the app.** It is used by the script, on your machine, to
produce static mp3 files. Calling a cloud TTS API from the page itself would put the key
in front of every visitor of a public repo, break offline use, and add a delay to every
tap — so the app never does that.

Regenerate `tools/audio-list.json` with `tools/audio-list.html` whenever you add new
words, then re-run the recorder.

---

## Why this app is different

Every Tamil course opens with the 247-letter grid. That grid is why people quit. It looks like
247 unrelated symbols to memorise, and it isn't.

**Tamil is a multiplication table.** 18 consonants × 12 vowels. The consonant never changes shape —
you just decorate it. So there are about **30 things to learn**, not 247. Unit 0 ("The Secret") does
nothing but prove this to you in five screens, before you memorise a single letter.

Everything else is built on methods that are well established in learning research:

| What it does | Why |
|---|---|
| **Word-first order** | You read `அம்மா` in unit 3, not unit 30. Letters are taught in the order that unlocks real words fastest, not alphabetical order. |
| **Spaced repetition (Leitner, 5 boxes)** | Reviews come back at 0 / 1 / 3 / 7 / 21 days. Get one wrong and it drops straight back to box 1. This is the single most evidence-backed technique in memorisation. |
| **Active recall, not re-reading** | Almost every screen makes you produce an answer. Recognising a letter you're shown is not the same as remembering it. |
| **Interleaving + minimal pairs** | The *Look-alike Clinic* drills `ர/ற`, `ல/ள/ழ`, `ண/ந/ன`, `த/ட` against each other using real word pairs (`கரி` charcoal vs `கறி` curry). These are the letters that make people give up; training them side by side is the only thing that works. |
| **Writing by tracing, scored** | You trace the letter with a finger and get a coverage score. Writing is motor memory — reading practice alone won't give it to you. |
| **An animated pen shows you the path first** | Press *Show me how to write it* and a pen draws the letter in front of you, stroke by stroke, before you try. See the note below on what this is and isn't. |
| **Two-strike catch-up** | Anything you miss comes back later in the same lesson, up to twice. Then the lesson ends, so you can never get trapped. |
| **Sound-first pronunciation hints** | Each consonant tells you *where in your mouth* it is made ("tongue on your top teeth", "curl the tongue back"). That's what separates the three L's and three N's. |
| **It teaches the register gap, not just the script** | Units 12–14 take sentences you already say and show them in their written clothes. Nobody else does this — every other Tamil app assumes you speak no Tamil at all. |

### The path

| Unit | What it is |
|---|---|
| 0 | **The Secret** — 5 rules. Nothing to memorise. |
| 1 | The 12 vowels — really just 6 sounds, short and long |
| 2 | The 12 vowel signs — the multiplication rule |
| 3 | `ப ம ய` — the cup family → read **அம்மா** |
| 4 | `க ச த` |
| 5 | `ந ன ண` — the three N sounds |
| 6 | `ல ள ழ` — the three L sounds |
| 7 | `ர ற வ ட` |
| 8 | `ங ஞ` — the last two |
| 9 | Look-alike Clinic |
| 10 | Real words |
| 11 | First sentences |
| **12** | **Why the News Sounds Different** — the two-register reveal |
| **13** | **Your Tamil → Written Tamil** — the nine endings, on one screen |
| **14** | **Reading the News** — the three shapes every headline is built from |

Plus, always available: the full **247 chart** (tap any cell to hear it and see how it is built)
and a free **writing pad**.

### Diglossia: the second half of the problem

Tamil has one of the widest spoken/written splits of any living language. பேச்சுத் தமிழ்
(what everyone speaks) and எழுத்துத் தமிழ் (what is written and read aloud on TV) are
different systems. This is why a fluent speaker with perfect reading skills would *still* be lost
watching the news — and why teaching the script alone is only half a solution.

The gap is regular, which is what makes it teachable:

| you say | the news says | |
|---|---|---|
| போறேன் | போகிறேன் | I go |
| பண்றேன் | செய்கிறேன் | I do |
| அவங்க | அவர்கள் | they |
| ஒண்ணு | ஒன்று | one |

Nine verb endings carry most of it. Unit 13 puts all nine on a single screen.

### Indian and Sri Lankan Tamil

Written Tamil is **identical everywhere on earth** — Jaffna, Chennai, Kuala Lumpur, Toronto.
Spoken Tamil is not. So on first run the app asks which Tamil you speak, and mirrors that back
at you:

|  | Indian (Chennai) | Sri Lankan (Jaffna) | Written |
|---|---|---|---|
| I go | நான் போறேன் | நான் போறன் | நான் போகிறேன் |
| we go | நாங்க போறோம் | நாங்கள் போறம் | நாங்கள் போகிறோம் |

Only the "you say" column changes; the written column never does. It is switchable any time
from the home screen.

> **⚠ Needs a native check before launch.** The formal and Indian columns are high confidence.
> The Sri Lankan column captures the well-attested Jaffna features — the `-றன்` / `-றம்` / `-றியள்`
> endings, retained `-கள்` plurals, `ஒண்டு`/`மூண்டு`, `வாறன்` for "I come" — but Sri Lankan Tamil
> varies (Jaffna vs Batticaloa vs Colombo vs up-country). Have a Jaffna speaker read the `LK`
> column in `app/register.js` before you ship. It is deliberately all in one place.

### About the writing animation

The pen path is not hand-drawn data and it is not copied from a stroke-order chart. The app
works it out from the font that is actually rendering on your screen: it rasterises the glyph,
thins it to a one-pixel skeleton, and walks that skeleton the way a hand would — starting at
the top-left and always carrying on through the straightest continuation, only lifting the pen
when there is nothing left to join. Most Tamil letters come out as a single continuous stroke,
which is how they are genuinely written.

Two honest caveats:

- **The shape is exact; the order and direction are a good heuristic, not doctrine.** For a
  letter written in one stroke there is little room for disagreement, but on a multi-stroke
  letter a Tamil teacher might start somewhere else. Treat it as a guide to follow, not a
  certificate.
- It costs about 10–15 ms per new letter and is then cached, so you will never notice it.

`tools/strokes.html` is a visual harness for the same code — open it to inspect the extracted
path, stroke order and direction for every glyph in the grid.

**Ten minutes a day beats two hours on Sunday.** Do the review queue first every time — that is
the part that actually moves things into long-term memory.

---

## Files

```
index.html              app shell
app/style.css           visual system
app/data.js             the script curriculum: letters, signs, words
app/register.js         the spoken→written bridge (the LK column lives here)
app/strokes.js          works out the pen path for any glyph, from the font
app/engine.js           storage, spaced repetition, audio, trace scoring + animation
app/ui.js               screens and the lesson engine
sw.js                   offline cache
manifest.webmanifest    makes it installable
start.bat               one-click launcher (Windows)
tools/make-audio.ps1    one-off recorder for offline audio
tools/audio-list.json   the 319 things that need a recording
tools/strokes.html      visual harness for the stroke extractor
audio/                  created by make-audio.ps1; absent until you run it
```

Progress is saved in the browser's `localStorage` under `tamilpath.v1` (which also stores which
spoken variety you picked). It stays on the device —
nothing is uploaded anywhere. "Reset progress" at the bottom of the home screen clears it.

### Adding your own words

Open `app/data.js` and add to the `W` object:

```js
{ w:'புத்தகம்', s:'put-tha-kam', m:'book' }
```

`w` = the Tamil, `s` = how to say it, `m` = the meaning. It is picked up automatically by the
lessons, the review queue and the word builder.
