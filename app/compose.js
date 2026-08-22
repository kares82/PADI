/* ============================================================
   Padi Tamil — two-colour glyph composer

   The single most important idea in the app is that a Tamil letter
   is a base consonant plus a vowel mark. Telling a beginner that is
   useless: they cannot yet see which pixels are the base and which
   are the mark, so க கா கி கு reads as four unrelated shapes.

   So we show it. This renders a combined glyph with the base letter
   in ink and the added mark in gold.

   Finding the base inside the combined form is not trivial, because
   Tamil marks attach on the right (ா), the shoulder (ி), underneath
   (ு), the LEFT (ெ ே ை) and both sides at once (ொ ோ ௌ). A left-side
   mark pushes the base rightwards by its own width. Rather than
   hard-code any of that, we slide the base across the combined glyph
   and keep the offset where its ink best fits inside — which works
   for every attachment style, including the fused உ/ஊ forms where
   the base itself is slightly reshaped.
   ============================================================ */

var Compose = (function () {

  var FONT  = '"Noto Sans Tamil","Nirmala UI","Latha","Tamil Sangam MN",sans-serif';
  var cache = {};

  function cssVar(n){ return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  function rgb(hex, fallback){
    var m = String(hex || '').replace('#','');
    if (m.length === 3) m = m[0]+m[0]+m[1]+m[1]+m[2]+m[2];
    if (m.length !== 6) return fallback;
    return [parseInt(m.slice(0,2),16), parseInt(m.slice(2,4),16), parseInt(m.slice(4,6),16)];
  }
  /* the base letter takes the page's ink, the added mark the accent,
     so the picture recolours itself with whatever theme is chosen */
  function colours(){
    return { base: rgb(cssVar('--ink'), [21,48,42]),
             mark: rgb(cssVar('--gold-deep'), [14,92,83]) };
  }
  function themeKey(){
    var dark = (typeof Engine !== 'undefined' && Engine.isDark)
      ? Engine.isDark() : matchMedia('(prefers-color-scheme: dark)').matches;
    return (document.documentElement.getAttribute('data-theme') || 'mayil') + (dark ? 'd' : 'l');
  }

  /* Actual glyph metrics, so the scratch canvas is never too small.
     கௌ is the widest form in the grid and a fixed-size canvas clipped
     its right-hand flourish clean off. */
  function metrics(text, F){
    var x = document.createElement('canvas').getContext('2d');
    x.font = F + 'px ' + FONT;
    var m = x.measureText(text);
    return {
      l: (m.actualBoundingBoxLeft   != null) ? Math.abs(m.actualBoundingBoxLeft)  : 0,
      r: (m.actualBoundingBoxRight  != null) ? m.actualBoundingBoxRight           : m.width,
      a: (m.actualBoundingBoxAscent != null) ? m.actualBoundingBoxAscent          : F * 0.95,
      d: (m.actualBoundingBoxDescent!= null) ? m.actualBoundingBoxDescent         : F * 0.45
    };
  }

  function build(base, sign, px){
    var F = px;
    var pad = Math.round(F * 0.22);
    var searchMax = F * 0.8;                 // how far the base may be slid

    var mm = metrics(base + sign, F);
    var mb = metrics(base, F);

    // wide enough for the combined glyph AND for the base at full offset
    var W = Math.ceil(pad * 2 + Math.max(mm.l + mm.r, mb.l + mb.r + searchMax));
    var H = Math.ceil(pad * 2 + Math.max(mm.a, mb.a) + Math.max(mm.d, mb.d));
    var originX = pad + mm.l;
    var baseY   = pad + Math.max(mm.a, mb.a);

    function ink(text, dx){
      var c = document.createElement('canvas');
      c.width = W; c.height = H;
      var x = c.getContext('2d', { willReadFrequently:true });
      x.font = F + 'px ' + FONT;
      x.textAlign = 'left'; x.textBaseline = 'alphabetic';
      x.fillStyle = '#000';
      x.fillText(text, originX + dx, baseY);
      return x.getImageData(0, 0, W, H).data;
    }

    var whole = ink(base + sign, 0);

    // slide the bare base across and keep the offset that sits most
    // neatly inside the combined glyph
    var bestDx = 0, best = -Infinity, dx;
    for (dx = 0; dx <= searchMax; dx += 2){
      var b = ink(base, dx), inside = 0, outside = 0;
      for (var i = 3; i < b.length; i += 4){
        if (b[i] > 90){ if (whole[i] > 90) inside++; else outside++; }
      }
      var score = inside - outside * 2;          // punish ink that spills out
      if (score > best){ best = score; bestDx = dx; }
    }
    var baseInk = ink(base, bestDx);

    // ink bounding box of the combined glyph, so the result crops tight
    var x0 = W, y0 = H, x1 = -1, y1 = -1, px_, py;
    for (py = 0; py < H; py++) for (px_ = 0; px_ < W; px_++){
      if (whole[(py * W + px_) * 4 + 3] > 40){
        if (px_ < x0) x0 = px_; if (px_ > x1) x1 = px_;
        if (py < y0) y0 = py;   if (py > y1) y1 = py;
      }
    }
    if (x1 < 0) return null;
    var m2 = Math.round(px * 0.07);
    x0 = Math.max(0, x0 - m2); y0 = Math.max(0, y0 - m2);
    x1 = Math.min(W - 1, x1 + m2); y1 = Math.min(H - 1, y1 + m2);
    var cw = x1 - x0 + 1, chh = y1 - y0 + 1;

    var col = colours();
    var out = document.createElement('canvas');
    out.width = cw; out.height = chh;
    var oc = out.getContext('2d');
    var img = oc.createImageData(cw, chh);
    for (py = 0; py < chh; py++) for (px_ = 0; px_ < cw; px_++){
      var src = ((py + y0) * W + (px_ + x0)) * 4;
      var a = whole[src + 3];
      if (!a) continue;
      var c = (baseInk[src + 3] > 90) ? col.base : col.mark;
      var dst = (py * cw + px_) * 4;
      img.data[dst] = c[0]; img.data[dst+1] = c[1]; img.data[dst+2] = c[2];
      img.data[dst+3] = a;
    }
    oc.putImageData(img, 0, 0);
    return out;
  }

  /* Returns an <img> showing base+sign, base in ink, mark in gold.
     `sign` may be '' (just the bare letter) or the pulli. */
  function el(base, sign, px){
    px = px || 60;
    var key = base + '|' + sign + '|' + px + '|' + themeKey();
    if (!cache[key]){
      var c = build(base, sign, px);
      cache[key] = c ? c.toDataURL() : null;
    }
    var img = document.createElement('img');
    img.alt = base + sign;
    img.style.cssText = 'height:' + Math.round(px * 1.25) + 'px;width:auto;display:block';
    if (cache[key]) img.src = cache[key];
    return img;
  }

  return { el:el };
})();
