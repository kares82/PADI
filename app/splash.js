/* ============================================================
   Padi Tamil — opening screen

   Short on purpose. This lands on the exact moment someone opens
   the app for their ten minutes, so it does something rather than
   just showing a logo, and then gets out of the way: the app's own
   name writes itself using the same pen-path engine that teaches
   handwriting in the lessons.

   Tapping anywhere skips it. ?nosplash skips it entirely.
   ============================================================ */

var Splash = (function () {

  var TOTAL   = 2600;   // long enough to read as writing, short enough not to nag
  var DRAW_BY = 1450;   // the word is finished by here
  var FAM = '"Noto Sans Tamil","Nirmala UI","Latha","Tamil Sangam MN",sans-serif';
  var WORD = 'படி';        // படி

  function cssVar(n){ return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  function rgba(hex, a){
    var m = String(hex || '').replace('#','');
    if (m.length === 3) m = m[0]+m[0]+m[1]+m[1]+m[2]+m[2];
    if (m.length !== 6) return 'rgba(0,0,0,' + a + ')';
    return 'rgba(' + parseInt(m.slice(0,2),16) + ',' + parseInt(m.slice(2,4),16) + ','
                   + parseInt(m.slice(4,6),16) + ',' + a + ')';
  }

  /* One canvas per cluster, sized from the glyph's real metrics. Placing
     the text at (pad + bearingLeft, pad + ascent) means the ink box is
     exactly pad..pad+w / pad..pad+h, so the normalised stroke data drops
     straight on without a pixel scan. */
  function prepare(cluster, px){
    var probe = document.createElement('canvas').getContext('2d');
    probe.font = px + 'px ' + FAM;
    var m = probe.measureText(cluster);
    var l = Math.abs(m.actualBoundingBoxLeft   || 0);
    var r = (m.actualBoundingBoxRight   != null) ? m.actualBoundingBoxRight   : m.width;
    var a = (m.actualBoundingBoxAscent  != null) ? m.actualBoundingBoxAscent  : px * 0.95;
    var d = (m.actualBoundingBoxDescent != null) ? m.actualBoundingBoxDescent : px * 0.45;

    var pad = Math.round(px * 0.16);
    var W = Math.ceil(l + r + pad * 2), H = Math.ceil(a + d + pad * 2);
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    var cv = document.createElement('canvas');
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    var x = cv.getContext('2d');
    x.scale(dpr, dpr);

    var box = { x:pad, y:pad, w:(l + r) || 1, h:(a + d) || 1 };
    var strokes = null;
    try { strokes = (typeof Strokes !== 'undefined') ? Strokes.get(cluster) : null; } catch (e){}

    return {
      cv:cv, ctx:x, px:px, box:box, cluster:cluster, strokes:strokes,
      originX: pad + l, originY: pad + a, W:W, H:H
    };
  }

  function ghost(part, colour){
    var x = part.ctx;
    x.clearRect(0, 0, part.W, part.H);
    x.font = part.px + 'px ' + FAM;
    x.textAlign = 'left'; x.textBaseline = 'alphabetic';
    x.fillStyle = colour;
    x.fillText(part.cluster, part.originX, part.originY);
  }

  function solid(part, colour){ ghost(part, colour); }

  function place(part, p){
    return [ part.box.x + p[0] * part.box.w, part.box.y + p[1] * part.box.h ];
  }

  function segmentsOf(part){
    if (!part.strokes || !part.strokes.length) return null;
    var paths = [], total = 0;
    part.strokes.forEach(function (st){
      var pts = st.map(function (p){ return place(part, p); });
      var segs = [], len = 0;
      for (var i = 1; i < pts.length; i++){
        var dx = pts[i][0] - pts[i-1][0], dy = pts[i][1] - pts[i-1][1];
        var d = Math.sqrt(dx*dx + dy*dy);
        segs.push({ a:pts[i-1], b:pts[i], d:d, at:len });
        len += d;
      }
      if (len > 0.5){ paths.push({ segs:segs, len:len }); total += len; }
    });
    return paths.length ? { paths:paths, total:total } : null;
  }

  function start(){
    var el = document.getElementById('splash');
    if (!el) return;

    var bail = /[?&]nosplash\b/.test(location.search);
    if (bail){ el.parentNode && el.parentNode.removeChild(el); return; }

    var stage  = el.querySelector('.sp-word');
    var roman  = el.querySelector('.sp-roman');
    var mean   = el.querySelector('.sp-mean');
    var line   = el.querySelector('.sp-line');
    var hint   = el.querySelector('.sp-hint');

    var done = false;
    function finish(){
      if (done) return;
      done = true;
      el.classList.add('sp-out');
      setTimeout(function (){ el.parentNode && el.parentNode.removeChild(el); }, 420);
    }
    el.addEventListener('click', finish);
    el.addEventListener('touchstart', finish, { passive:true });
    setTimeout(finish, TOTAL);
    setTimeout(function (){ hint && hint.classList.add('on'); }, 700);

    var reduced = false;
    try { reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e){}

    /* Fixed timers from the moment the splash opens, not chained to the
       drawing. requestAnimationFrame is throttled whenever the page is
       not compositing - a background tab, a phone waking up - and if the
       captions waited on the last stroke they would simply never appear. */
    var revealed = false;
    function reveal(){
      if (revealed) return;
      revealed = true;
      if (roman) setTimeout(function (){ roman.classList.add('on'); }, reduced ? 120 : DRAW_BY + 70 );
      if (mean)  setTimeout(function (){ mean.classList.add('on');  }, reduced ? 240 : DRAW_BY + 200);
      if (line)  setTimeout(function (){ line.classList.add('on');  }, reduced ? 360 : DRAW_BY + 330);
    }
    reveal();

    function run(){
      var inkCol   = cssVar('--ink')       || '#15302A';
      var accent   = cssVar('--gold-deep') || '#0E5C53';
      var faint    = rgba(inkCol, 0.10);

      var px = Math.min(120, Math.max(64, Math.round(window.innerWidth / 5.2)));
      var clusters = (typeof DATA !== 'undefined') ? DATA.clusters(WORD) : [WORD];
      var parts = clusters.map(function (c){ return prepare(c, px); });

      stage.innerHTML = '';
      parts.forEach(function (p){ stage.appendChild(p.cv); });

      // no stroke data, or the reader asked for less movement: just show it
      var timelines = parts.map(segmentsOf);
      if (reduced || timelines.some(function (t){ return !t; })){
        parts.forEach(function (p){ solid(p, inkCol); });
        stage.classList.add('on');
        return;
      }

      parts.forEach(function (p){ ghost(p, faint); });
      stage.classList.add('on');

      // whatever the frame rate did, the finished word is on screen in time
      setTimeout(function (){
        parts.forEach(function (p, i){ if (i >= idx) solid(p, inkCol); });
        idx = parts.length;
      }, DRAW_BY + 120);

      var grand = timelines.reduce(function (n, t){ return n + t.total; }, 0);
      var speed = grand / (DRAW_BY - 250);        // px per ms
      var idx = 0, drawn = 0, t0 = null;
      var brush = Math.max(5, px * 0.075);

      function frame(ts){
        if (t0 === null) t0 = ts;
        var dt = ts - t0; t0 = ts;
        drawn += speed * dt;

        if (idx >= parts.length) return;          // finished, or forced complete
        var part = parts[idx], tl = timelines[idx];
        var x = part.ctx;
        ghost(part, faint);
        x.strokeStyle = inkCol; x.lineWidth = brush; x.lineCap = 'round'; x.lineJoin = 'round';

        var used = 0, head = null;
        for (var k = 0; k < tl.paths.length; k++){
          var path = tl.paths[k];
          var upto = Math.max(0, Math.min(path.len, drawn - used));
          if (upto > 0){
            x.beginPath();
            for (var i = 0; i < path.segs.length; i++){
              var sg = path.segs[i];
              if (sg.at >= upto) break;
              var f = Math.min(1, (upto - sg.at) / (sg.d || 1));
              var hx = sg.a[0] + (sg.b[0] - sg.a[0]) * f;
              var hy = sg.a[1] + (sg.b[1] - sg.a[1]) * f;
              if (i === 0) x.moveTo(sg.a[0], sg.a[1]);
              x.lineTo(hx, hy);
              head = [hx, hy];
            }
            x.stroke();
          }
          used += path.len;
        }
        if (head && drawn < tl.total){
          x.fillStyle = accent;
          x.beginPath(); x.arc(head[0], head[1], brush * 0.62, 0, 7); x.fill();
        }

        if (drawn >= tl.total){
          solid(part, inkCol);                 // settle to the real glyph
          idx++; drawn = 0;
          if (idx >= parts.length) return;
        }
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    // the stroke paths come from the font, so it has to be here first
    var started = false;
    function go(){ if (started) return; started = true; try { run(); } catch (e){} }
    if (document.fonts && document.fonts.load){
      document.fonts.load('80px "Noto Sans Tamil"').then(go, go);
      setTimeout(go, 700);                     // never wait on a slow font
    } else {
      setTimeout(go, 60);
    }
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', start);
  else start();

  return { skip: function (){ var e = document.getElementById('splash'); if (e) e.click(); } };
})();
