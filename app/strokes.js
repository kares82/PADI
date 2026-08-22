/* ============================================================
   Padi Tamil — stroke extraction

   Works out the pen path for any Tamil glyph directly from the font
   that is actually rendering on this device: rasterise, thin to a 1px
   skeleton (Zhang-Suen), clean up, then walk the skeleton the way a
   hand would — always carrying on through the straightest continuation
   and only lifting the pen when nothing is left to join.

   Doing it at runtime rather than shipping a data file means the guide
   always matches the ghost letter the learner is looking at, whatever
   font their device fell back to.

   Coordinates come back normalised to the glyph's ink bounding box,
   so the caller maps them onto whatever size it drew the ghost at.

   tools/strokes.html is the visual harness for this same code.
   ============================================================ */

var Strokes = (function () {

  var N = 176;                       // extraction raster (square)
  var FONT = '"Noto Sans Tamil","Nirmala UI","Latha","Tamil Sangam MN",sans-serif';
  var CKEY = 'tamilpath.strokes.v1';
  var mem  = {};
  var disk = null;

  function loadDisk(){
    if (disk) return disk;
    try { disk = JSON.parse(localStorage.getItem(CKEY) || '{}'); }
    catch (e){ disk = {}; }
    return disk;
  }
  function saveDisk(){
    try { localStorage.setItem(CKEY, JSON.stringify(disk)); } catch (e){}
  }

  /* ---------- raster ---------- */
  function rasterize(ch){
    var c = document.createElement('canvas');
    c.width = c.height = N;
    var x = c.getContext('2d', { willReadFrequently:true });
    x.fillStyle = '#fff'; x.fillRect(0,0,N,N);
    x.fillStyle = '#000';
    x.font = Math.round(N*0.62) + 'px ' + FONT;
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(ch, N/2, N*0.52);
    var d = x.getImageData(0,0,N,N).data;
    var m = new Uint8Array(N*N);
    for (var i=0;i<N*N;i++) m[i] = d[i*4] < 128 ? 1 : 0;
    return m;
  }

  function bbox(m){
    var x0=1e9,y0=1e9,x1=-1,y1=-1, x, y;
    for (y=0;y<N;y++) for (x=0;x<N;x++) if (m[y*N+x]){
      if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y;
    }
    return { x0:x0, y0:y0, x1:x1, y1:y1, w:x1-x0, h:y1-y0 };
  }

  /* ---------- Zhang-Suen thinning ---------- */
  function thin(src){
    var m = Uint8Array.from(src);
    function g(x,y){ return (x<0||y<0||x>=N||y>=N) ? 0 : m[y*N+x]; }
    var changed = true, guard = 0;
    while (changed && guard++ < 120){
      changed = false;
      for (var step=0; step<2; step++){
        var del = [], x, y, k;
        for (y=1;y<N-1;y++) for (x=1;x<N-1;x++){
          if (!m[y*N+x]) continue;
          var p2=g(x,y-1),p3=g(x+1,y-1),p4=g(x+1,y),p5=g(x+1,y+1),
              p6=g(x,y+1),p7=g(x-1,y+1),p8=g(x-1,y),p9=g(x-1,y-1);
          var B = p2+p3+p4+p5+p6+p7+p8+p9;
          if (B<2 || B>6) continue;
          var seq = [p2,p3,p4,p5,p6,p7,p8,p9,p2], A = 0;
          for (k=0;k<8;k++) if (seq[k]===0 && seq[k+1]===1) A++;
          if (A!==1) continue;
          if (step===0){ if (p2*p4*p6) continue; if (p4*p6*p8) continue; }
          else         { if (p2*p4*p8) continue; if (p2*p6*p8) continue; }
          del.push(y*N+x);
        }
        if (del.length){ changed = true; for (k=0;k<del.length;k++) m[del[k]] = 0; }
      }
    }
    return m;
  }

  /* ---------- skeleton neighbourhood ----------
     A diagonal only counts as a link when it is not shortcutting two
     orthogonal steps that are already on the skeleton. Without this
     every diagonal staircase reads as a chain of junctions.          */
  var NB4 = [[1,0],[0,1],[-1,0],[0,-1]];
  var NBD = [[1,1],[-1,1],[-1,-1],[1,-1]];
  function mkNeigh(m){
    function on(x,y){ return x>=0 && y>=0 && x<N && y<N && !!m[y*N+x]; }
    return function (x,y){
      var out = [], i, d;
      for (i=0;i<4;i++){ d=NB4[i]; if (on(x+d[0],y+d[1])) out.push([x+d[0],y+d[1]]); }
      for (i=0;i<4;i++){ d=NBD[i];
        if (on(x+d[0],y+d[1]) && !on(x+d[0],y) && !on(x,y+d[1])) out.push([x+d[0],y+d[1]]);
      }
      return out;
    };
  }

  /* ---------- remove hairline spurs ---------- */
  function prune(m, minLen){
    var neigh = mkNeigh(m);
    function on(x,y){ return x>=0 && y>=0 && x<N && y<N && !!m[y*N+x]; }
    for (var pass=0; pass<5; pass++){
      var kill = [], x, y;
      for (y=0;y<N;y++) for (x=0;x<N;x++){
        if (!on(x,y) || neigh(x,y).length !== 1) continue;
        var path = [[x,y]], px=x, py=y, s=neigh(x,y)[0], cx=s[0], cy=s[1];
        while (path.length < minLen+2){
          var nb = neigh(cx,cy);
          if (nb.length !== 2) break;
          path.push([cx,cy]);
          var nxt = null;
          for (var i=0;i<nb.length;i++) if (nb[i][0]!==px || nb[i][1]!==py) nxt = nb[i];
          if (!nxt) break;
          px=cx; py=cy; cx=nxt[0]; cy=nxt[1];
        }
        if (path.length <= minLen && neigh(cx,cy).length > 2)
          for (var j=0;j<path.length;j++) kill.push(path[j]);
      }
      if (!kill.length) break;
      for (var k=0;k<kill.length;k++) m[kill[k][1]*N + kill[k][0]] = 0;
    }
    return m;
  }

  /* ---------- skeleton -> arcs ---------- */
  function arcsOf(m){
    var neigh = mkNeigh(m);
    function on(x,y){ return x>=0 && y>=0 && x<N && y<N && !!m[y*N+x]; }
    function deg(x,y){ return neigh(x,y).length; }
    function idx(x,y){ return y*N+x; }
    function ek(a,b){ return a<b ? a+'|'+b : b+'|'+a; }
    var used = {}, arcs = [], x, y, i;

    function walk(sx,sy,nx,ny){
      var pts = [[sx,sy]], px=sx, py=sy, cx=nx, cy=ny;
      for(;;){
        used[ek(idx(px,py), idx(cx,cy))] = 1;
        pts.push([cx,cy]);
        if (deg(cx,cy) !== 2) break;
        var nb = neigh(cx,cy), nxt = null;
        for (var j=0;j<nb.length;j++)
          if (!used[ek(idx(cx,cy), idx(nb[j][0],nb[j][1]))]) { nxt = nb[j]; break; }
        if (!nxt) break;
        px=cx; py=cy; cx=nxt[0]; cy=nxt[1];
      }
      return pts;
    }
    for (y=0;y<N;y++) for (x=0;x<N;x++){
      if (!on(x,y) || deg(x,y) === 2) continue;
      var nb = neigh(x,y);
      for (i=0;i<nb.length;i++)
        if (!used[ek(idx(x,y), idx(nb[i][0],nb[i][1]))]) arcs.push(walk(x,y,nb[i][0],nb[i][1]));
    }
    for (y=0;y<N;y++) for (x=0;x<N;x++){            // closed loops have no nodes
      if (!on(x,y) || deg(x,y) !== 2) continue;
      var nb2 = neigh(x,y);
      for (i=0;i<nb2.length;i++)
        if (!used[ek(idx(x,y), idx(nb2[i][0],nb2[i][1]))]){
          arcs.push(walk(x,y,nb2[i][0],nb2[i][1])); break;
        }
    }
    return arcs.filter(function(a){ return a.length > 2; });
  }

  /* ---------- arcs -> pen route ---------- */
  function route(arcs){
    function key(p){ return p[0]+','+p[1]; }
    function tanStart(p){ var k=Math.min(6,p.length-1); return Math.atan2(p[k][1]-p[0][1], p[k][0]-p[0][0]); }
    function tanEnd(p){ var n=p.length-1, k=Math.max(0,n-6); return Math.atan2(p[n][1]-p[k][1], p[n][0]-p[k][0]); }
    function turn(a,b){ var d = Math.abs(a-b) % (2*Math.PI); return d > Math.PI ? 2*Math.PI-d : d; }

    var A = arcs.map(function(p){
      return { pts:p, a:key(p[0]), b:key(p[p.length-1]), used:false };
    });
    function incident(k){
      return A.filter(function(x){ return !x.used && (x.a===k || x.b===k); });
    }
    function pickStart(){
      var best = null;
      A.forEach(function(x){
        if (x.used) return;
        [[x.a, x.pts[0]], [x.b, x.pts[x.pts.length-1]]].forEach(function(e){
          // topmost then leftmost; a true endpoint beats a mid-graph junction
          var score = e[1][1]*1000 + e[1][0] + (incident(e[0]).length === 1 ? 0 : 250000);
          if (!best || score < best.score) best = { score:score, key:e[0] };
        });
      });
      return best;
    }

    var strokes = [], guard = 0, any = true;
    while (any && guard++ < 120){
      any = A.some(function(x){ return !x.used; });
      if (!any) break;
      var st = pickStart(); if (!st) break;
      var cur = st.key, dir = Math.PI/4, pts = [];   // the first move tends down-right
      for(;;){
        var cands = incident(cur);
        if (!cands.length) break;
        var best = null;
        cands.forEach(function(x){
          var seq = (x.a === cur) ? x.pts : x.pts.slice().reverse();
          var t = turn(dir, tanStart(seq));
          if (!best || t < best.t) best = { x:x, seq:seq, t:t };
        });
        best.x.used = true;
        pts = pts.length ? pts.concat(best.seq.slice(1)) : best.seq.slice();
        dir = tanEnd(best.seq);
        cur = (best.x.a === cur && best.x.b !== best.x.a) ? best.x.b : best.x.a;
      }
      if (pts.length > 2) strokes.push(pts);
    }
    return strokes;
  }

  /* ---------- tidy ---------- */
  function pathLen(p){
    var t=0; for (var i=1;i<p.length;i++) t += Math.hypot(p[i][0]-p[i-1][0], p[i][1]-p[i-1][1]);
    return t;
  }
  function smooth(p){
    if (p.length < 5) return p;
    var out = [p[0]];
    for (var i=1;i<p.length-1;i++)
      out.push([ (p[i-1][0]+2*p[i][0]+p[i+1][0])/4, (p[i-1][1]+2*p[i][1]+p[i+1][1])/4 ]);
    out.push(p[p.length-1]);
    return out;
  }
  function simplify(p, eps){
    if (p.length < 3) return p;
    var maxD = 0, idx = 0;
    var ax=p[0][0], ay=p[0][1], bx=p[p.length-1][0], by=p[p.length-1][1];
    var dx=bx-ax, dy=by-ay, len=Math.hypot(dx,dy) || 1;
    for (var i=1;i<p.length-1;i++){
      var d = Math.abs((p[i][0]-ax)*dy - (p[i][1]-ay)*dx) / len;
      if (d > maxD){ maxD = d; idx = i; }
    }
    if (maxD > eps)
      return simplify(p.slice(0, idx+1), eps).slice(0,-1).concat(simplify(p.slice(idx), eps));
    return [p[0], p[p.length-1]];
  }

  /* ---------- public ---------- */
  function compute(ch){
    var raw = rasterize(ch);
    var bb  = bbox(raw);
    if (bb.w <= 0 || bb.h <= 0) return null;
    var sk  = prune(thin(raw), Math.round(N*0.07));
    var minLen = Math.max(bb.w, bb.h) * 0.16;
    var strokes = route(arcsOf(sk))
      .filter(function(p){ return pathLen(p) > minLen; })
      .map(function(p){ return simplify(smooth(p), N*0.013); });

    if (!strokes.length){                            // a bare dot, e.g. the pulli
      var cx = (bb.x0+bb.x1)/2, cy = (bb.y0+bb.y1)/2;
      strokes = [[[cx,cy],[cx+1,cy]]];
    }
    // normalise into the ink bounding box so the caller can place it at any size
    return strokes.map(function(p){
      return p.map(function(q){
        return [ +((q[0]-bb.x0)/bb.w).toFixed(3), +((q[1]-bb.y0)/bb.h).toFixed(3) ];
      });
    });
  }

  /* Returns an array of strokes, each an array of [x,y] in 0..1 of the
     glyph's ink box — or null if the glyph could not be rendered. */
  function get(ch){
    if (mem[ch]) return mem[ch];
    var d = loadDisk();
    if (d[ch]){ mem[ch] = d[ch]; return d[ch]; }
    var s;
    try { s = compute(ch); } catch (e){ s = null; }
    if (s){ mem[ch] = s; d[ch] = s; saveDisk(); }
    return s;
  }

  return { get:get, clear:function(){ mem={}; disk={}; saveDisk(); } };
})();
