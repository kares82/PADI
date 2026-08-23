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

  /* A shared vertical frame for a whole row.

     Cropping each glyph to its own ink box and then forcing every image
     to one CSS height made the base letter a different size in every
     cell - க came out 44% larger beside கா than beside கு. On a card
     whose entire claim is "same letter every time", the picture was
     contradicting the sentence.

     So a set is measured once for its tallest ascent and deepest
     descent, and every glyph in it is drawn into that same frame, on
     the same baseline. Only the width varies, which is honest: the
     marks really do sit on different sides. */
  function frameFor(texts, px){
    var a = 0, d = 0;
    texts.forEach(function (t){
      var m = metrics(t, px);
      if (m.a > a) a = m.a;
      if (m.d > d) d = m.d;
    });
    return { a:a, d:d };
  }

  function build(base, sign, px, frame){
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var F   = px * dpr;                       // work at device resolution
    var pad = Math.round(F * 0.14);
    var searchMax = F * 0.8;

    var mm = metrics(base + sign, F);
    var mb = metrics(base, F);

    var ascent  = frame ? frame.a * dpr : Math.max(mm.a, mb.a);
    var descent = frame ? frame.d * dpr : Math.max(mm.d, mb.d);

    var W = Math.ceil(pad * 2 + Math.max(mm.l + mm.r, mb.l + mb.r + searchMax));
    var H = Math.ceil(pad * 2 + ascent + descent);
    var originX = pad + mm.l;
    var baseY   = pad + ascent;

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

    var bestDx = 0, best = -Infinity, dx;
    for (dx = 0; dx <= searchMax; dx += 2){
      var b = ink(base, dx), inside = 0, outside = 0;
      for (var i = 3; i < b.length; i += 4){
        if (b[i] > 90){ if (whole[i] > 90) inside++; else outside++; }
      }
      var score = inside - outside * 2;
      if (score > best){ best = score; bestDx = dx; }
    }
    var baseInk = ink(base, bestDx);

    /* Crop horizontally only. Trimming vertically too is what destroyed
       the shared baseline, since every glyph has a different ink height. */
    var x0 = W, x1 = -1, px_, py;
    for (py = 0; py < H; py++) for (px_ = 0; px_ < W; px_++){
      if (whole[(py * W + px_) * 4 + 3] > 40){
        if (px_ < x0) x0 = px_;
        if (px_ > x1) x1 = px_;
      }
    }
    if (x1 < 0) return null;
    var m2 = Math.round(F * 0.07);
    x0 = Math.max(0, x0 - m2);
    x1 = Math.min(W - 1, x1 + m2);
    var cw = x1 - x0 + 1;

    var col = colours();
    var out = document.createElement('canvas');
    out.width = cw; out.height = H;
    var oc = out.getContext('2d');
    var img = oc.createImageData(cw, H);
    for (py = 0; py < H; py++) for (px_ = 0; px_ < cw; px_++){
      var src = (py * W + (px_ + x0)) * 4;
      var a = whole[src + 3];
      if (!a) continue;
      var c = (baseInk[src + 3] > 90) ? col.base : col.mark;
      var dst = (py * cw + px_) * 4;
      img.data[dst] = c[0]; img.data[dst+1] = c[1]; img.data[dst+2] = c[2];
      img.data[dst+3] = a;
    }
    oc.putImageData(img, 0, 0);
    out._cssW = cw / dpr;
    out._cssH = H / dpr;
    return out;
  }

  /* Returns an <img> of base+sign, base in the page's ink, mark in the
     accent. Pass the frame from frameFor() when several glyphs are shown
     together, so they share a baseline and the base letter never
     changes size between them. */
  function el(base, sign, px, frame){
    px = px || 60;
    var fk = frame ? ('|' + Math.round(frame.a) + ',' + Math.round(frame.d)) : '';
    var key = base + '|' + sign + '|' + px + '|' + themeKey() + fk;
    var rec = cache[key];
    if (!rec){
      var c = build(base, sign, px, frame);
      rec = cache[key] = c ? { src:c.toDataURL(), w:c._cssW, h:c._cssH } : null;
    }
    var img = document.createElement('img');
    img.alt = base + sign;
    if (rec){
      img.src = rec.src;
      img.style.cssText = 'width:' + rec.w + 'px;height:' + rec.h + 'px;display:block';
    } else {
      img.style.cssText = 'display:block';
    }
    return img;
  }

  return { el:el, frameFor:frameFor };
})();
