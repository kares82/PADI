# -*- coding: utf-8 -*-
"""Padi Tamil - check the recorded clips.

Run after any recording run:  python tools/check-audio.py

This exists because the last three audio faults all survived checks that
only asked whether files existed. Every test here asks whether a property
holds instead:

  1. the manifest still describes the files that are actually on disk
  2. nothing is silent, truncated or a duplicate of its neighbour
  3. nothing is wildly off-pitch for the vowel it is saying

Needs ffmpeg on PATH and numpy. It reads nothing but audio/ and
tools/audio-list.json, so it is safe to run at any time.
"""
import io, json, os, subprocess, sys, wave, hashlib, tempfile
import numpy as np

ROOT  = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO = os.path.join(ROOT, 'audio')
LIST  = os.path.join(ROOT, 'tools', 'audio-list.json')
PULLI = u'்'
VOWEL_LETTERS = set(u'அஆஇஈஉஊஎஏஐஒஓஔ')
SIGNS = {'':'a', u'ா':'aa', u'ி':'i',  u'ீ':'ii', u'ு':'u',
         u'ூ':'uu', u'ெ':'e', u'ே':'ee', u'ை':'ai',
         u'ொ':'o',  u'ோ':'oo', u'ௌ':'au', PULLI:'(pulli)'}

fails = []
warns = []
def fail(m): fails.append(m); print('  FAIL  ' + m)
def warn(m): warns.append(m); print('  warn  ' + m)
def ok(m):   print('  ok    ' + m)


def decode(mp3, wav):
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',mp3,
                    '-ac','1','-ar','16000',wav], check=True)

def samples(wav):
    w = wave.open(wav,'rb'); sr = w.getframerate()
    d = w.readframes(w.getnframes()); w.close()
    return sr, np.frombuffer(d, dtype='<i2').astype(np.float64)

def pitch_median(s, sr):
    """Median F0 over the voiced frames, by autocorrelation."""
    win, hop = int(sr*0.032), int(sr*0.008)
    lo, hi = int(sr/350), int(sr/55)
    if len(s) < win*2: return 0.0
    pk = np.abs(s).max() or 1.0
    v = []
    for i in range(0, len(s)-win, hop):
        seg = s[i:i+win] - s[i:i+win].mean()
        if np.sqrt((seg**2).mean()) < pk*0.04: continue
        ac = np.correlate(seg, seg, 'full')[win-1:]
        if ac[0] <= 0: continue
        r = ac[lo:hi]/ac[0]
        k = int(np.argmax(r))
        if r[k] > 0.30: v.append(sr/(lo+k))
    return float(np.median(v)) if len(v) >= 6 else 0.0

def vowel_of(text):
    if len(text) == 1 and text in VOWEL_LETTERS: return '(vowel letter)'
    if len(text) == 1: return 'a'
    if len(text) == 2 and text[1] in SIGNS: return SIGNS[text[1]]
    return None


def main():
    if not os.path.isdir(AUDIO):
        print('No audio/ directory - nothing recorded yet.'); return 0
    idx  = json.load(io.open(os.path.join(AUDIO,'index.json'), encoding='utf-8'))
    lst  = json.load(io.open(LIST, encoding='utf-8'))

    print('\n1. manifest and list agree')
    if len(idx) != len(lst):
        fail('manifest has %d entries, list has %d' % (len(idx), len(lst)))
    bad = [i for i,t in enumerate(lst) if idx.get(t) != '%04d.mp3' % (i+1)]
    if bad:
        fail('%d items are not numbered by list position - the list was reordered '
             'or something was inserted, so recordings are attached to the wrong '
             'text. Re-record with -Force.' % len(bad))
        for i in bad[:5]:
            print('        position %d expects %04d.mp3, manifest says %s'
                  % (i+1, i+1, idx.get(lst[i])))
    else:
        ok('all %d clips numbered by list position' % len(lst))

    print('\n2. every clip is present and carries audio')
    missing = [f for f in idx.values() if not os.path.exists(os.path.join(AUDIO,f))]
    if missing: fail('%d files named in the manifest are not on disk: %s'
                     % (len(missing), ', '.join(missing[:5])))
    else: ok('all %d files present' % len(idx))

    tmp = tempfile.mkdtemp(prefix='padi-audio-')
    rows, hashes = [], {}
    for t, f in idx.items():
        p = os.path.join(AUDIO, f)
        if not os.path.exists(p): continue
        hashes.setdefault(hashlib.md5(open(p,'rb').read()).hexdigest(), []).append(f)
        wav = os.path.join(tmp, f[:-4] + '.wav')
        try: decode(p, wav)
        except Exception: fail('%s will not decode - the file is corrupt' % f); continue
        sr, s = samples(wav)
        dur = len(s)/sr if sr else 0.0
        peak = float(np.abs(s).max())/32768.0 if len(s) else 0.0
        rows.append((t, f, dur, peak, s, sr))

    silent = [(f,round(pk,4)) for _,f,_,pk,_,_ in rows if pk < 0.02]
    if silent: fail('%d clips are effectively silent: %s' % (len(silent), silent[:5]))
    else: ok('no silent clips')

    stub = [(f, round(d,3)) for t,f,d,_,_,_ in rows if d < 0.15]
    if stub: fail('%d clips are under 0.15s - too short to be speech: %s' % (len(stub), stub[:5]))
    else: ok('no truncated clips')

    dupes = {k:v for k,v in hashes.items() if len(v) > 1}
    if dupes:
        fail('%d groups of clips are byte-identical, so the synthesiser repeated '
             'itself: %s' % (len(dupes), list(dupes.values())[:3]))
    else: ok('all %d clips are distinct audio' % len(hashes))

    print('\n3. pitch is sane for the vowel being said')
    by_vowel = {}
    tracked = []
    for t, f, dur, pk, s, sr in rows:
        v = vowel_of(t)
        if not v: continue
        f0 = pitch_median(s, sr)
        if f0 <= 0: continue
        by_vowel.setdefault(v, []).append(f0)
        tracked.append((t, f, v, f0))
    if not tracked:
        warn('no single-glyph clips to measure')
    else:
        med = {v: float(np.median(a)) for v, a in by_vowel.items() if len(a) >= 4}
        # Compare each clip with its own vowel. Close vowels genuinely sit
        # higher than open ones, so one global baseline invents faults.
        out = [(t,f,v,f0,med[v]) for t,f,v,f0 in tracked
               if v in med and (f0 > med[v]*1.25 or f0 < med[v]*0.72)]
        if out:
            for t,f,v,f0,b in sorted(out, key=lambda r:-abs(r[3]/r[4]-1)):
                warn('%s (%s) is %.0f Hz where other "%s" syllables sit at %.0f (%+d%%)'
                     % (f, '+'.join('%04X'%ord(c) for c in t), f0, v, b,
                        round((f0/b-1)*100)))
        else:
            ok('%d letter clips all within range of their vowel' % len(tracked))
        print('        baseline by vowel: ' +
              '  '.join('%s %.0f' % (v, m) for v, m in sorted(med.items())))

    print('\n%s   %d failed, %d to look at\n'
          % ('PROBLEMS' if fails else 'All good.', len(fails), len(warns)))
    return 1 if fails else 0


if __name__ == '__main__':
    sys.exit(main())
