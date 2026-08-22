/* ============================================================
   Padi Tamil — engine
   Storage · spaced repetition · audio · trace scoring · helpers
   ============================================================ */

var Engine = (function () {

  var BUILD = '2026-08-22.8';

  /* ---------------- storage ---------------- */
  var KEY = 'tamilpath.v1';
  var S = {
    srs: {},        // id -> {box, due, seen, ok, bad}
    units: {},      // unitId -> {done:true, best:n}
    streak: { last:null, days:0 },
    stats: { answers:0, correct:0 },
    settings: { sound:true, variety:null, hideEnglish:false, theme:'mayil', scheme:'auto', themePicked:false },
    game: { xp:0, todayXp:0, day:null, goal:60, seenLevel:0, read:{} }
  };

  function today(){
    var d = new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }
  function dayNum(){ return Math.floor(Date.now()/864e5); }

  /* A fresh, complete state. load() starts from this every time rather
     than merging onto whatever happens to be in memory, so re-reading
     after the store has been emptied really does empty the app. */
  function blank(){
    return {
      srs:{}, units:{},
      streak:{ last:null, days:0 },
      stats:{ answers:0, correct:0 },
      settings:{ sound:true, variety:null, hideEnglish:false,
                 theme:'mayil', scheme:'auto', themePicked:false },
      game:{ xp:0, todayXp:0, day:null, goal:60, seenLevel:0, read:{} },
      savedAt:0
    };
  }

  function load(){
    var p = {};
    try{
      var raw = localStorage.getItem(KEY);
      if (raw) p = JSON.parse(raw) || {};
    }catch(e){ p = {}; }
    // S is handed out by reference as Engine.S, so reset it in place
    var base = blank(), k;
    for (k in base) if (base.hasOwnProperty(k)) S[k] = base[k];
    for (k in p) if (p.hasOwnProperty(k)) S[k] = p[k];
    /* Fill in field by field, not object by object. Replacing a whole
       sub-object only helps when it is entirely absent; a save written
       by an older version has the object but not the newer keys inside
       it, and those stay undefined. That is how S.game.todayXp becomes
       NaN the first time it is incremented. Every field the app reads
       is defaulted individually. */
    function fill(obj, defs){
      if (!obj || typeof obj !== 'object') obj = {};
      for (var k in defs) if (defs.hasOwnProperty(k) && obj[k] === undefined) obj[k] = defs[k];
      return obj;
    }
    function num(v, d){ return (typeof v === 'number' && isFinite(v)) ? v : d; }

    S.srs   = (S.srs   && typeof S.srs   === 'object') ? S.srs   : {};
    S.units = (S.units && typeof S.units === 'object') ? S.units : {};
    S.streak   = fill(S.streak,   { last:null, days:0 });
    S.stats    = fill(S.stats,    { answers:0, correct:0 });
    S.settings = fill(S.settings, { sound:true, variety:null, hideEnglish:false, theme:'mayil', scheme:'auto', themePicked:false });
    S.game     = fill(S.game,     { xp:0, todayXp:0, day:null, goal:60, seenLevel:0, read:{} });
    if (!S.settings.theme) S.settings.theme = 'mayil';
    /* The default was 'ink' for a few days. Anyone who opened the app in
       that window has it saved and would never see the current default,
       so move them across once - unless they picked it on purpose. */
    if (S.settings.theme === 'ink' && !S.settings.themePicked) S.settings.theme = 'mayil';
    S.game.read = (S.game.read && typeof S.game.read === 'object') ? S.game.read : {};
    S.game.xp        = num(S.game.xp, 0);
    S.game.todayXp   = num(S.game.todayXp, 0);
    S.game.goal      = Math.max(10, num(S.game.goal, 60));
    S.game.seenLevel = num(S.game.seenLevel, 0);
    S.streak.days    = num(S.streak.days, 0);
    S.stats.answers  = num(S.stats.answers, 0);
    S.stats.correct  = num(S.stats.correct, 0);
    if(S.settings.variety===undefined) S.settings.variety=null;
  }
  var loadedAt = 0;
  function save(){
    try{
      S.savedAt = Date.now();
      loadedAt = S.savedAt;
      localStorage.setItem(KEY, JSON.stringify(S));
    }catch(e){}
  }

  /* Every window keeps its own copy of S in memory and save() writes the
     whole object, so two open copies of the app quietly overwrite each
     other - the second one to save wipes whatever the first did. Re-read
     from disk whenever another window writes, or when this window is
     brought back to the front. Returns true if anything actually moved. */
  function reload(){
    var before = JSON.stringify([S.srs, S.units, S.game, S.streak, S.stats]);
    load();
    loadedAt = S.savedAt || 0;
    applyTheme(); applyScheme();
    return JSON.stringify([S.srs, S.units, S.game, S.streak, S.stats]) !== before;
  }
  function diskIsNewer(){
    try{
      var raw = localStorage.getItem(KEY);
      if (!raw) return false;
      var t = (JSON.parse(raw) || {}).savedAt || 0;
      return t > loadedAt;
    }catch(e){ return false; }
  }
  function reset(){ S.srs={}; S.units={}; S.streak={last:null,days:0}; S.stats={answers:0,correct:0};
    S.game={xp:0,todayXp:0,day:null,goal:60,seenLevel:0,read:{}}; save(); }

  function touchStreak(){
    var t = today();
    if (S.streak.last === t) return;
    var y = new Date(Date.now()-864e5);
    var yStr = y.getFullYear()+'-'+String(y.getMonth()+1).padStart(2,'0')+'-'+String(y.getDate()).padStart(2,'0');
    S.streak.days = (S.streak.last === yStr) ? S.streak.days+1 : 1;
    S.streak.last = t;
    save();
  }

  /* ---------------- spaced repetition (Leitner) ----------------
     5 boxes. Right -> move up. Wrong -> straight back to box 1.
     Intervals in days: 0 (again today), 1, 3, 7, 21.            */
  var GAPS = [0, 1, 3, 7, 21];

  function itemId(kind, val){ return kind + ':' + val; }

  function ensure(id){
    if (!S.srs[id]) S.srs[id] = { box:0, due:dayNum(), seen:0, ok:0, bad:0 };
    return S.srs[id];
  }

  function grade(id, correct){
    var it = ensure(id);
    it.seen++;
    S.stats.answers++;
    if (correct){
      it.ok++; S.stats.correct++;
      it.box = Math.min(it.box+1, GAPS.length-1);
      award(10 + it.box * 2);          // deeper boxes are worth more
    } else {
      it.bad++; it.box = 0;
      award(3);                        // getting it wrong is still practice
    }
    it.due = dayNum() + GAPS[it.box];
    save();
    return it;
  }

  function dueItems(){
    var n = dayNum(), out = [];
    for (var id in S.srs) if (S.srs[id].due <= n) out.push(id);
    // weakest first
    out.sort(function(a,b){ return S.srs[a].box - S.srs[b].box; });
    return out;
  }

  function learnedIds(){ var o=[]; for(var id in S.srs) o.push(id); return o; }

  function mastery(){
    var total=0, sum=0;
    for (var id in S.srs){ total++; sum += S.srs[id].box/(GAPS.length-1); }
    return total ? sum/total : 0;
  }

  /* ---------------- experience, levels, daily goal ----------------
     Points are deliberately generous and impossible to lose. The job
     of this layer is to make coming back tomorrow feel worth it, not
     to punish anybody for getting a letter wrong. */
  function award(n){
    var t = today();
    if (S.game.day !== t){ S.game.day = t; S.game.todayXp = 0; }
    S.game.xp += n;
    S.game.todayXp += n;
    save();
    return S.game.xp;
  }
  function todayXp(){ return (S.game.day === today()) ? S.game.todayXp : 0; }
  function level(){ return STORIES.levelFor(S.game.xp); }
  function levelInfo(){
    var i = level(), cur = STORIES.LEVELS[i], next = STORIES.LEVELS[i+1] || null;
    var floor = cur.xp, ceil = next ? next.xp : cur.xp;
    return { i:i, cur:cur, next:next,
             into: S.game.xp - floor,
             span: next ? (ceil - floor) : 1,
             pct: next ? Math.min(100, Math.round((S.game.xp - floor) / (ceil - floor) * 100)) : 100 };
  }
  /* returns the new level if the learner just crossed a threshold */
  function checkLevelUp(){
    var l = level();
    if (l > (S.game.seenLevel || 0)){ S.game.seenLevel = l; save(); return l; }
    return -1;
  }
  function markRead(id){ S.game.read[id] = true; save(); }
  function hasRead(id){ return !!S.game.read[id]; }

  /* ---------------- audio ----------------
     Two sources, in order of preference:
       1. recorded clips in ./audio (made by tools/make-audio.ps1)
       2. the browser's own Tamil speech voice
     Recorded clips win because they always sound the same and never
     depend on what the device happens to have installed. */
  var clips = null;                 // text -> filename, once loaded
  var clipCache = {};

  function loadClips(){
    if (typeof fetch !== 'function') return;
    fetch('audio/index.json', { cache:'no-cache' })
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(j){ if (j && typeof j === 'object') clips = j; })
      .catch(function(){ /* no recordings, or opened via file:// — fine */ });
  }

  /* One rule for turning displayed text into an audio key, shared by the
     player and the clip generator so the two can never drift apart.
     Tapping a word inside a story hands us things like "“un" or
     "irunthathu." - quotes and a trailing full stop are artefacts of
     splitting a sentence, not part of the word. Sentence-final
     punctuation is kept on real sentences, where it carries prosody. */
  function speakKey(text){
    var t = String(text == null ? '' : text)
      .replace(/[“”‘’"']/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (t.indexOf(' ') < 0) t = t.replace(/[.,!?;:—-]+$/, '');
    return t;
  }

  function playClip(text){
    if (!clips || !clips[text]) return false;
    var a = clipCache[text];
    if (!a){
      a = new Audio('audio/' + clips[text]);
      a.preload = 'auto';
      clipCache[text] = a;
    }
    try { a.currentTime = 0; var pr = a.play(); if (pr && pr.catch) pr.catch(function(){}); return true; }
    catch (e){ return false; }
  }

  function hasClips(){ return !!clips; }

  var voice = null, voicesReady = false;

  function pickVoice(){
    if (!('speechSynthesis' in window)) return null;
    var vs = speechSynthesis.getVoices() || [];
    var i;
    for (i=0;i<vs.length;i++) if (/^ta([-_]|$)/i.test(vs[i].lang)) return vs[i];
    for (i=0;i<vs.length;i++) if (/tamil/i.test(vs[i].name)) return vs[i];
    return null;
  }
  function initVoices(){
    if (!('speechSynthesis' in window)) return;
    voice = pickVoice(); voicesReady = !!voice;
    speechSynthesis.onvoiceschanged = function(){ voice = pickVoice(); voicesReady = !!voice; };
  }
  function hasTamilVoice(){ return !!voice; }

  function speak(text, rate){
    if (!S.settings.sound) return false;
    var key = speakKey(text);
    if (!key) return false;
    if (playClip(key)) return true;
    if (!('speechSynthesis' in window)) return false;
    try{
      var u = new SpeechSynthesisUtterance(key);
      if (voice) u.voice = voice;
      u.lang = 'ta-IN';
      u.rate = rate || 0.72;
      u.pitch = 1;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
      return true;
    }catch(e){ return false; }
  }

  /* small synthesised feedback tones — no audio files needed */
  var actx = null;
  function tone(freqs, dur){
    if (!S.settings.sound) return;
    try{
      actx = actx || new (window.AudioContext||window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      freqs.forEach(function(f,i){
        var o = actx.createOscillator(), g = actx.createGain();
        o.type='sine'; o.frequency.value=f;
        var t0 = actx.currentTime + i*0.085;
        g.gain.setValueAtTime(0.0001,t0);
        g.gain.exponentialRampToValueAtTime(0.16,t0+0.012);
        g.gain.exponentialRampToValueAtTime(0.0001,t0+(dur||0.18));
        o.connect(g); g.connect(actx.destination);
        o.start(t0); o.stop(t0+(dur||0.18)+0.02);
      });
    }catch(e){}
  }
  function dingOK(){ tone([660, 880], 0.16); }
  function dingNo(){ tone([200], 0.24); }
  function buzz(ms){ if (navigator.vibrate) try{ navigator.vibrate(ms); }catch(e){} }

  /* ---------------- theme ---------------- */
  function cssVar(n){ return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  function themeInk(alpha){
    var m = String(cssVar('--ink') || '#0F172A').replace('#','');
    if (m.length === 3) m = m[0]+m[0]+m[1]+m[1]+m[2]+m[2];
    return 'rgba(' + parseInt(m.slice(0,2),16) + ',' + parseInt(m.slice(2,4),16) + ','
                   + parseInt(m.slice(4,6),16) + ',' + alpha + ')';
  }
  function applyTheme(name){
    if (name){ S.settings.theme = name; S.settings.themePicked = true; }
    document.documentElement.setAttribute('data-theme', S.settings.theme || 'mayil');
    if (name) save();
  }
  /* 'auto' follows the device; 'light' and 'dark' override it. Most people
     keep the whole phone dark, so without this they can never reach a
     theme's light side. */
  function applyScheme(mode){
    if (mode) S.settings.scheme = mode;
    var m = S.settings.scheme || 'auto';
    if (m === 'light' || m === 'dark') document.documentElement.setAttribute('data-scheme', m);
    else document.documentElement.removeAttribute('data-scheme');
    if (mode) save();
  }
  function isDark(){
    var m = S.settings.scheme || 'auto';
    if (m === 'dark') return true;
    if (m === 'light') return false;
    return matchMedia('(prefers-color-scheme: dark)').matches;
  }

  /* ---------------- trace canvas ---------------- */
  /* Renders a ghost glyph, lets the user draw over it, and scores
     how much of the glyph's ink they covered vs how much they
     spilled outside it. */
  function Trace(host, glyph, size){
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    host.innerHTML = '';
    host.style.width = size+'px';
    host.style.height = size+'px';

    function mk(){
      var c = document.createElement('canvas');
      c.width = size*dpr; c.height = size*dpr;
      host.appendChild(c);
      var x = c.getContext('2d');
      x.scale(dpr,dpr);
      return x;
    }
    var gx = mk();   // ghost / target mask
    var ax = mk();   // animated pen guide
    var ux = mk();   // user ink

    var FAM = '"Noto Sans Tamil","Nirmala UI","Latha","Tamil Sangam MN",sans-serif';
    var brush = Math.max(9, size*0.055);
    var pad = brush * 0.9;

    /* Size the letter to FIT. A fixed font size clipped every wide form
       - anything with a mark on the left or both sides, which is over
       half the grid - and because the score is measured against this
       same ghost, a clipped target also scored the learner unfairly.
       Glyph metrics scale linearly with font size, so one measurement
       at a reference size gives the exact scale in one shot. */
    var fs, drawX, drawY;
    (function fit(){
      var ref = 100;
      var probe = document.createElement('canvas').getContext('2d');
      probe.font = ref + 'px ' + FAM;
      var m = probe.measureText(glyph);
      var l = Math.abs(m.actualBoundingBoxLeft || 0);
      var r = (m.actualBoundingBoxRight   != null) ? m.actualBoundingBoxRight   : m.width;
      var a = (m.actualBoundingBoxAscent  != null) ? m.actualBoundingBoxAscent  : ref*0.95;
      var d = (m.actualBoundingBoxDescent != null) ? m.actualBoundingBoxDescent : ref*0.45;
      var wRef = Math.max(1, l + r), hRef = Math.max(1, a + d);
      var avail = size - pad*2;
      fs = Math.min(size*0.74, avail/wRef*ref, avail/hRef*ref);
      var k = fs/ref;
      drawX = pad + (avail - wRef*k)/2 + l*k;   // centre on the ink, not the advance
      drawY = pad + (avail - hRef*k)/2 + a*k;
    })();
    var font = fs + 'px ' + FAM;

    function drawGhost(){
      gx.clearRect(0,0,size,size);
      gx.font = font; gx.textAlign='left'; gx.textBaseline='alphabetic';
      // fatten the target a little so honest near-misses still count
      gx.lineWidth = brush*0.5; gx.lineJoin='round';
      gx.strokeStyle = 'rgba(0,0,0,1)'; gx.fillStyle='rgba(0,0,0,1)';
      gx.strokeText(glyph, drawX, drawY);
      gx.fillText(glyph, drawX, drawY);
    }
    // hidden mask kept in a separate buffer, then repaint ghost faintly
    var mask, ink = null;
    function buildMask(){
      drawGhost();
      mask = gx.getImageData(0,0,size*dpr,size*dpr).data;
      // ink bounding box, in CSS pixels — where the guide strokes get mapped
      var x0=1e9,y0=1e9,x1=-1,y1=-1, W=size*dpr;
      for (var i=3;i<mask.length;i+=4){
        if (mask[i] <= 55) continue;
        var px=((i-3)/4)%W, py=Math.floor(((i-3)/4)/W);
        if(px<x0)x0=px; if(px>x1)x1=px; if(py<y0)y0=py; if(py>y1)y1=py;
      }
      ink = (x1 < 0) ? null : { x:x0/dpr, y:y0/dpr, w:(x1-x0)/dpr, h:(y1-y0)/dpr };
      gx.clearRect(0,0,size,size);
      gx.font = font; gx.textAlign='left'; gx.textBaseline='alphabetic';
      gx.fillStyle = themeInk(isDark() ? 0.30 : 0.20);
      gx.fillText(glyph, drawX, drawY);
    }
    buildMask();

    ux.lineWidth = brush; ux.lineCap='round'; ux.lineJoin='round';
    ux.strokeStyle = themeInk(1);

    var drawing=false, last=null, any=false;
    function pt(e){
      var r = host.getBoundingClientRect();
      var t = e.touches ? e.touches[0] : e;
      return { x:(t.clientX-r.left)*(size/r.width), y:(t.clientY-r.top)*(size/r.height) };
    }
    function down(e){ e.preventDefault(); stopPlay(); drawing=true; any=true; last=pt(e); ux.beginPath(); ux.moveTo(last.x,last.y); ux.lineTo(last.x+0.1,last.y+0.1); ux.stroke(); }
    function move(e){ if(!drawing) return; e.preventDefault(); var p=pt(e); ux.beginPath(); ux.moveTo(last.x,last.y); ux.lineTo(p.x,p.y); ux.stroke(); last=p; }
    function up(){ drawing=false; }

    host.addEventListener('pointerdown',down);
    host.addEventListener('pointermove',move);
    window.addEventListener('pointerup',up);
    host.addEventListener('touchstart',down,{passive:false});
    host.addEventListener('touchmove',move,{passive:false});
    window.addEventListener('touchend',up);

    /* ---- animated pen guide ---- */
    var raf = null, guide = null;
    function guideStrokes(){
      if (guide !== null) return guide;
      guide = (typeof Strokes !== 'undefined' && ink) ? Strokes.get(glyph) : null;
      return guide;
    }
    function place(p){ return [ ink.x + p[0]*ink.w, ink.y + p[1]*ink.h ]; }

    function stopPlay(){
      if (raf) cancelAnimationFrame(raf);
      raf = null;
      ax.clearRect(0,0,size,size);
    }

    function play(onEnd){
      var gs = guideStrokes();
      if (!gs || !gs.length){ if (onEnd) onEnd(false); return false; }
      stopPlay();
      // flatten into timed segments, with a pause where the pen lifts
      var paths = gs.map(function(st){
        var pts = st.map(place), L = 0, segs = [];
        for (var i=1;i<pts.length;i++){
          var d = Math.hypot(pts[i][0]-pts[i-1][0], pts[i][1]-pts[i-1][1]);
          segs.push({ a:pts[i-1], b:pts[i], d:d, at:L }); L += d;
        }
        return { segs:segs, len:L };
      }).filter(function(p){ return p.len > 1; });
      if (!paths.length){ if (onEnd) onEnd(false); return false; }

      var total = paths.reduce(function(t,p){ return t + p.len; }, 0);
      var SPEED = Math.max(120, total / 2.6);   // px per second: ~2.6s per letter
      var LIFT  = 260;                          // ms pause between strokes
      var pi = 0, travelled = 0, t0 = null, lifting = 0;
      var accent = getComputedStyle(document.body).getPropertyValue('--gold').trim() || '#E8A33D';

      function frame(ts){
        if (t0 === null) t0 = ts;
        var dt = ts - t0; t0 = ts;
        if (lifting > 0){ lifting -= dt; raf = requestAnimationFrame(frame); return; }
        travelled += SPEED * dt / 1000;

        var path = paths[pi];
        ax.clearRect(0,0,size,size);
        // strokes already finished stay faintly on screen
        ax.strokeStyle = accent; ax.lineCap='round'; ax.lineJoin='round';
        for (var k=0;k<pi;k++){
          ax.globalAlpha = 0.30; ax.lineWidth = brush*0.5;
          drawUpTo(paths[k], paths[k].len);
        }
        ax.globalAlpha = 0.95; ax.lineWidth = brush*0.55;
        var head = drawUpTo(path, Math.min(travelled, path.len));
        // the pen itself
        if (head){
          ax.globalAlpha = 1;
          ax.fillStyle = accent;
          ax.beginPath(); ax.arc(head[0], head[1], brush*0.42, 0, 7); ax.fill();
          ax.fillStyle = '#fff';
          ax.beginPath(); ax.arc(head[0], head[1], brush*0.16, 0, 7); ax.fill();
        }
        ax.globalAlpha = 1;

        if (travelled >= path.len){
          pi++; travelled = 0; lifting = LIFT;
          if (pi >= paths.length){
            raf = requestAnimationFrame(function(){
              ax.globalAlpha = 0.3; ax.lineWidth = brush*0.5; ax.strokeStyle = accent;
              ax.clearRect(0,0,size,size);
              paths.forEach(function(p){ drawUpTo(p, p.len); });
              ax.globalAlpha = 1;
              setTimeout(function(){ ax.clearRect(0,0,size,size); }, 700);
              raf = null;
              if (onEnd) onEnd(true);
            });
            return;
          }
        }
        raf = requestAnimationFrame(frame);
      }
      function drawUpTo(path, upto){
        var last = null;
        ax.beginPath();
        for (var i=0;i<path.segs.length;i++){
          var s = path.segs[i];
          if (s.at >= upto) break;
          var f = Math.min(1, (upto - s.at) / (s.d || 1));
          var x = s.a[0] + (s.b[0]-s.a[0])*f, y = s.a[1] + (s.b[1]-s.a[1])*f;
          if (i === 0) ax.moveTo(s.a[0], s.a[1]);
          ax.lineTo(x, y);
          last = [x,y];
        }
        ax.stroke();
        return last;
      }
      raf = requestAnimationFrame(frame);
      return true;
    }

    return {
      play: play,
      stopPlay: stopPlay,
      hasGuide: function(){ var g = guideStrokes(); return !!(g && g.length); },
      clear: function(){ ux.clearRect(0,0,size,size); any=false; },
      hasInk: function(){ return any; },
      score: function(){
        if (!any) return 0;
        var u = ux.getImageData(0,0,size*dpr,size*dpr).data;
        var gT=0, uT=0, hit=0, spill=0;
        for (var i=3;i<u.length;i+=4){
          var g = mask[i] > 55, k = u[i] > 55;
          if (g) gT++;
          if (k){ uT++; if (g) hit++; else spill++; }
        }
        if (!uT || !gT) return 0;
        var cover = hit/gT;                 // how much of the letter you covered
        var waste = spill/uT;               // how much you scribbled outside
        return Math.max(0, Math.min(100, Math.round(cover*112 - waste*70)));
      },
      destroy: function(){
        stopPlay();
        host.removeEventListener('pointerdown',down);
        host.removeEventListener('pointermove',move);
        window.removeEventListener('pointerup',up);
      }
    };
  }

  /* ---------------- misc helpers ---------------- */
  function shuffle(a){
    a = a.slice();
    for (var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; }
    return a;
  }
  function sample(a,n){ return shuffle(a).slice(0,n); }
  function pick(a){ return a[Math.floor(Math.random()*a.length)]; }

  var toastTimer=null;
  function toast(msg){
    var el = document.getElementById('toast');
    el.textContent = msg; el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ el.classList.remove('show'); }, 2200);
  }

  load();
  loadedAt = S.savedAt || 0;
  applyTheme();
  applyScheme();
  initVoices();
  loadClips();

  return {
    S:S, save:save, reload:reload, diskIsNewer:diskIsNewer, reset:reset, touchStreak:touchStreak, today:today, dayNum:dayNum,
    itemId:itemId, ensure:ensure, grade:grade, dueItems:dueItems, learnedIds:learnedIds,
    BUILD:BUILD, applyTheme:applyTheme, applyScheme:applyScheme, isDark:isDark, award:award, todayXp:todayXp, level:level, levelInfo:levelInfo,
    checkLevelUp:checkLevelUp, markRead:markRead, hasRead:hasRead,
    mastery:mastery, GAPS:GAPS,
    speak:speak, speakKey:speakKey, hasTamilVoice:hasTamilVoice, hasClips:hasClips, dingOK:dingOK, dingNo:dingNo, buzz:buzz,
    Trace:Trace, shuffle:shuffle, sample:sample, pick:pick, toast:toast
  };
})();
