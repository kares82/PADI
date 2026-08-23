# -*- coding: utf-8 -*-
"""The build string in engine.js and the cache name in sw.js must agree.

They drifted once: a generator script aborted partway and bumped one but
not the other, so four deploys ran with a service-worker cache still named
after an older build. Nothing broke loudly, which is exactly the problem.

Run before pushing:  python tools/check-build.py
"""
import io, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
eng = io.open(os.path.join(ROOT,'app','engine.js'), encoding='utf-8').read()
sw  = io.open(os.path.join(ROOT,'sw.js'), encoding='utf-8').read()
b = re.search(r"var BUILD = '([^']+)'", eng)
c = re.search(r"var CACHE = 'padi-tamil-([^']+)'", sw)
if not b or not c:
    print('could not find BUILD in engine.js or CACHE in sw.js'); sys.exit(1)
if b.group(1) != c.group(1):
    print('MISMATCH  engine.js BUILD=%s  sw.js CACHE=padi-tamil-%s' % (b.group(1), c.group(1)))
    print('The service worker will keep serving the old cache name. Bump both.')
    sys.exit(1)
print('ok  build %s, sw cache matches' % b.group(1))
