/* ============================================================
   Padi Tamil — screens, router and the lesson engine
   ============================================================ */
(function () {

var app   = document.getElementById('app');
var top   = document.getElementById('topTitle');
var back  = document.getElementById('backBtn');
var sndBt = document.getElementById('soundBtn');
var dueDot= document.getElementById('dueDot');

/* ---------------- tiny DOM helper ---------------- */
function h(tag, attrs, kids){
  var e = document.createElement(tag);
  if (attrs) for (var k in attrs){
    if (k === 'class') e.className = attrs[k];
    else if (k === 'html') e.innerHTML = attrs[k];
    else if (k === 'text') e.textContent = attrs[k];
    else if (k.slice(0,2) === 'on') e.addEventListener(k.slice(2), attrs[k]);
    else if (attrs[k] === true) e.setAttribute(k,'');
    else if (attrs[k] != null && attrs[k] !== false) e.setAttribute(k, attrs[k]);
  }
  (kids||[]).forEach(function(c){
    if (c == null || c === false) return;
    e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return e;
}
function ta(txt, cls){ return h('span',{class:'glyph '+(cls||''), lang:'ta', text:txt}); }
function clear(){ app.innerHTML=''; }
function go(hash){ location.hash = hash; }

/* speaker button */
function spk(text, big){
  return h('button',{class:'speaker', 'aria-label':'Play sound', style: big?'font-size:28px':'',
    onclick:function(e){ e.stopPropagation(); Engine.speak(text); }},['🔊']);
}

/* ---------------- items ----------------
   Everything reviewable is normalised to this shape. */
function letterItem(ch){
  var c = DATA.cons(ch);
  if (c) return { id:'L:'+ch, kind:'letter', glyph:ch, label:c.lab, tip:c.tip, mn:c.mn, fam:c.fam, speak:ch };
  var v = DATA.vowel(ch);
  return { id:'L:'+ch, kind:'letter', glyph:ch, label:v.r, tip:v.say, mn:v.mn, fam:'vowel', speak:ch };
}
function signItem(s){
  var sg = DATA.sign(s);
  return { id:'S:'+(s||'a'), kind:'sign', sign:s, glyph:'க'+s, label:'k'+sg.r, vowel:sg.v, pos:sg.pos, note:sg.note, speak:'க'+s };
}
function wordItem(w){
  return { id:'W:'+w.w, kind:'word', glyph:w.w, label:w.s, meaning:w.m, speak:w.w };
}
/* a spoken -> written sentence pair, seen through the learner's own dialect */
function bridgeItem(b){
  var v = variety();
  return { id:'R:'+b.f, kind:'bridge', glyph:b.f, label:b.sf, meaning:b.en,
           spoken:REGISTER.col(b, v), spokenSay:REGISTER.say(b, v), same:!!b.same, speak:b.f };
}
function variety(){ return Engine.S.settings.variety === 'LK' ? 'LK' : 'IN'; }
function varietyLabel(){ return variety() === 'LK' ? 'Sri Lankan Tamil' : 'Indian Tamil'; }

/* ---------------- exercise generators ---------------- */

/* see the glyph -> choose the sound */
function exGlyphToSound(item, pool){
  var others = pool.filter(function(x){ return x.id !== item.id; });
  var near = others.filter(function(x){ return x.fam && x.fam === item.fam; });
  var picks = Engine.sample(near, 3);
  while (picks.length < 3 && others.length){
    var c = Engine.pick(others);
    if (picks.indexOf(c) < 0) picks.push(c);
    if (picks.length >= others.length) break;
  }
  return { type:'mc', item:item, prompt:'What sound is this?',
    show:'glyph', options:Engine.shuffle(picks.concat([item])), key:'label' };
}

/* hear / read the sound -> choose the glyph */
function exSoundToGlyph(item, pool){
  var others = pool.filter(function(x){ return x.id !== item.id; });
  var near = others.filter(function(x){ return x.fam && x.fam === item.fam; });
  var picks = Engine.sample(near, 3);
  while (picks.length < 3 && others.length){
    var c = Engine.pick(others);
    if (picks.indexOf(c) < 0) picks.push(c);
    if (picks.length >= others.length) break;
  }
  return { type:'mc', item:item, prompt:'Which letter says this?',
    show:'label', options:Engine.shuffle(picks.concat([item])), key:'glyph' };
}

/* consonant + sign -> which combined letter? */
function exBuild(item){
  var base = Engine.pick(['க','ம','ப','த','ந','ல','வ','ர']);
  var all  = DATA.SIGNS.filter(function(s){ return s.s !== item.sign; });
  var d    = Engine.sample(all, 3).map(function(s){ return { glyph:base+s.s, label:'x', id:'d:'+s.s }; });
  var right= { glyph:base+item.sign, label:item.label, id:item.id };
  return { type:'mc', item:item, prompt:'Put them together:',
    show:'formula', formula:[base, item.sign||'(nothing)'],
    options:Engine.shuffle(d.concat([right])), key:'glyph' };
}

/* read the word -> choose the meaning */
function exWordMeaning(item, pool){
  function usable(x){ return x.id !== item.id && x.meaning && x.meaning !== item.meaning; }
  var others = pool.filter(usable);
  // top the pool up so there are always four choices, even early on
  if (others.length < 3){
    var extra = DATA.ALLWORDS.map(wordItem).filter(usable);
    extra.forEach(function(x){
      if (!others.some(function(y){ return y.id === x.id; })) others.push(x);
    });
  }
  var picks = [], seen = {};
  Engine.shuffle(others).forEach(function(x){
    if (picks.length < 3 && !seen[x.meaning]){ seen[x.meaning] = 1; picks.push(x); }
  });
  return { type:'mc', item:item, prompt:'What does this word mean?',
    show:'word', options:Engine.shuffle(picks.concat([item])), key:'meaning' };
}

/* you say X - which one would the news print? */
function exBridge(item, pool){
  var others = pool.filter(function(x){ return x.id !== item.id; });
  var picks  = Engine.sample(others, 3);
  return { type:'mc', item:item, prompt:'You would say this. How is it written?',
    show:'spoken', options:Engine.shuffle(picks.concat([item])), key:'glyph' };
}

/* assemble the word from its letter blocks */
function exWordBuild(item){
  return { type:'build', item:item, parts:DATA.clusters(item.glyph) };
}

function exTrace(item){ return { type:'trace', item:item }; }

/* pick a random exercise appropriate to an item */
function randomEx(item, pool){
  if (item.kind === 'bridge')
    return Math.random() < 0.6 ? exBridge(item, pool) : exWordMeaning(item, pool);
  if (item.kind === 'word')
    return Math.random() < 0.72 ? exWordMeaning(item, pool) : exWordBuild(item);
  if (item.kind === 'sign')
    return Math.random() < 0.6 ? exBuild(item) : exGlyphToSound(item, pool);
  var r = Math.random();
  if (r < 0.45) return exGlyphToSound(item, pool);
  if (r < 0.85) return exSoundToGlyph(item, pool);
  return exTrace(item);
}

/* ---------------- lesson construction ---------------- */

function buildLesson(unit){
  var steps = [], i;

  if (unit.kind === 'reveal'){
    DATA.RULES.forEach(function(r,idx){ steps.push({ type:'rule', rule:r, n:idx+1 }); });
    return steps;
  }

  if (unit.kind === 'vowels'){
    var groups = [['அ','ஆ'],['இ','ஈ'],['உ','ஊ'],['எ','ஏ'],['ஒ','ஓ'],['ஐ','ஔ']];
    var pool = unit.letters.map(letterItem);
    groups.forEach(function(g){
      steps.push({ type:'teachPair', a:letterItem(g[0]), b:letterItem(g[1]),
                   linked: !!DATA.vowel(g[0]).mate });
      steps.push(exGlyphToSound(letterItem(Engine.pick(g)), pool));
    });
    for (i=0;i<6;i++) steps.push(randomEx(Engine.pick(pool), pool));
    steps.push(exTrace(letterItem('அ')));
    steps.push(exTrace(letterItem('இ')));
    return steps;
  }

  if (unit.kind === 'signs'){
    steps.push({ type:'teachSignRule' });
    var groups2 = [
      { title:'The right-hand stick', signs:['ா'] },
      { title:'On the shoulder',      signs:['ி','ீ'] },
      { title:'Under the tail  ⚠',    signs:['ு','ூ'] },
      { title:'On the LEFT',          signs:['ெ','ே','ை'] },
      { title:'Wrapped around',       signs:['ொ','ோ','ௌ'] }
    ];
    var spool = DATA.SIGNS.map(function(s){ return signItem(s.s); });
    groups2.forEach(function(g){
      steps.push({ type:'teachSignGroup', title:g.title, items:g.signs.map(signItem) });
      steps.push(exBuild(signItem(Engine.pick(g.signs))));
    });
    for (i=0;i<6;i++){
      var it = Engine.pick(spool.filter(function(x){ return x.sign; }));
      steps.push(Math.random()<0.5 ? exBuild(it) : exGlyphToSound(it, spool));
    }
    (unit.words||[]).forEach(function(w){ steps.push({ type:'teachWord', item:wordItem(w) }); });
    return steps;
  }

  if (unit.kind === 'cons'){
    var lpool = unit.letters.map(letterItem);
    // widen the distractor pool with the confusable neighbours
    var neighbours = [];
    DATA.CONS.forEach(function(c){
      if (unit.letters.indexOf(c.ch) < 0 && lpool.some(function(x){ return x.fam === c.fam; }))
        neighbours.push(letterItem(c.ch));
    });
    var qpool = lpool.concat(neighbours);

    unit.letters.forEach(function(ch){
      var it = letterItem(ch);
      steps.push({ type:'teach', item:it });
      steps.push(exTrace(it));
      steps.push(exGlyphToSound(it, qpool));
    });
    for (i=0;i<5;i++) steps.push(randomEx(Engine.pick(lpool), qpool));

    var wpool = (unit.words||[]).map(wordItem);
    wpool.slice(0,7).forEach(function(wi){
      steps.push({ type:'teachWord', item:wi });
      steps.push(exWordMeaning(wi, wpool));
    });
    if (wpool.length) steps.push(exWordBuild(Engine.pick(wpool.slice(0,7))));
    return steps;
  }

  if (unit.kind === 'clinic'){
    unit.pairs.forEach(function(p){
      steps.push({ type:'teachPairWords', pair:p });
      steps.push({ type:'pairQuiz', pair:p, want: Math.random()<0.5 ? 'a' : 'b' });
    });
    return steps;
  }

  if (unit.kind === 'diglossia'){
    REGISTER.RULES.forEach(function(r,idx){ steps.push({ type:'rule', rule:r, n:idx+1 }); });
    return steps;
  }

  if (unit.kind === 'bridge'){
    steps.push({ type:'endings' });
    var bpool = REGISTER.BRIDGE.map(bridgeItem);
    bpool.forEach(function(bi){
      steps.push({ type:'teachBridge', item:bi });
      steps.push(exBridge(bi, bpool));
    });
    steps.push({ type:'swaps' });
    for (i=0;i<5;i++) steps.push(randomEx(Engine.pick(bpool), bpool));
    return steps;
  }

  if (unit.kind === 'news'){
    REGISTER.NEWSPAT.forEach(function(pat){ steps.push({ type:'newsPattern', pat:pat }); });
    var nvocab = REGISTER.NEWSVOCAB.map(wordItem);
    Engine.sample(nvocab, 8).forEach(function(wi){
      steps.push({ type:'teachWord', item:wi });
      steps.push(exWordMeaning(wi, nvocab));
    });
    var heads = REGISTER.HEADLINES.map(wordItem);
    heads.forEach(function(hi){
      steps.push({ type:'teachWord', item:hi });
      steps.push(exWordMeaning(hi, heads));
    });
    return steps;
  }

  if (unit.kind === 'read'){
    var rp = (unit.words||[]).map(wordItem);
    var chosen = Engine.sample(rp, Math.min(10, rp.length));
    chosen.forEach(function(wi){
      steps.push({ type:'teachWord', item:wi });
      steps.push(exWordMeaning(wi, rp));
    });
    return steps;
  }
  return steps;
}

/* ---------------- lesson runner ---------------- */
var L = null;

function startLesson(unit){
  L = { unit:unit, steps:buildLesson(unit), i:0, right:0, wrong:0, redo:[], redoRounds:0 };
  Engine.touchStreak();
  drawStep();
}

function startReview(){
  var due = Engine.dueItems();
  if (!due.length){ renderReview(); return; }
  var items = due.slice(0, 20).map(idToItem).filter(Boolean);
  if (!items.length){ Engine.toast('Nothing reviewable right now'); return renderReview(); }
  var pool  = Engine.learnedIds().map(idToItem).filter(Boolean);
  var steps = items.map(function(it){
    var p = pool.filter(function(x){ return x.kind === it.kind; });
    return randomEx(it, p.length >= 4 ? p : pool);
  });
  L = { unit:{ id:'review', title:'Review', kind:'review' }, steps:steps, i:0, right:0, wrong:0, redo:[], redoRounds:0 };
  Engine.touchStreak();
  drawStep();
}

function idToItem(id){
  var k = id.slice(0,1), v = id.slice(2);
  if (k === 'L') return (DATA.cons(v) || DATA.vowel(v)) ? letterItem(v) : null;
  if (k === 'S') return DATA.sign(v === 'a' ? '' : v) ? signItem(v === 'a' ? '' : v) : null;
  if (k === 'W'){
    var i;
    for (i=0;i<DATA.ALLWORDS.length;i++)
      if (DATA.ALLWORDS[i].w === v) return wordItem(DATA.ALLWORDS[i]);
    var extra = REGISTER.NEWSVOCAB.concat(REGISTER.HEADLINES);
    for (i=0;i<extra.length;i++) if (extra[i].w === v) return wordItem(extra[i]);
  }
  if (k === 'R'){
    for (var j=0;j<REGISTER.BRIDGE.length;j++)
      if (REGISTER.BRIDGE[j].f === v) return bridgeItem(REGISTER.BRIDGE[j]);
  }
  return null;
}

function nextStep(){
  L.i++;
  if (L.i >= L.steps.length){
    // failed items come back — but only for two catch-up rounds, so a
    // lesson can never become an unescapable loop for someone struggling
    if (L.redo.length && L.redoRounds < 2){
      L.redoRounds++;
      L.steps = L.steps.concat(L.redo);
      L.redo = [];
    } else { return finishLesson(); }
  }
  drawStep();
}

function finishLesson(){
  var u = L.unit;
  if (u.id !== 'review'){
    Engine.S.units[u.id] = Engine.S.units[u.id] || {};
    Engine.S.units[u.id].done = true;
    Engine.save();
  }
  clear();
  var total = L.right + L.wrong;
  var pct = total ? Math.round(L.right/total*100) : 100;
  app.appendChild(h('div',{class:'card finish'},[
    h('div',{class:'em', text: pct>=80 ? '🎉' : pct>=50 ? '👍' : '💪'}),
    h('h2',{class:'h1', style:'margin-top:10px', text: u.id==='review' ? 'Review done' : u.title + ' complete'}),
    h('p',{class:'sub', text: total ? (L.right + ' of ' + total + ' correct — ' + pct + '%') : 'Now you know the trick. Everything after this is just practice.'}),
    h('p',{class:'sub', style:'margin-top:14px',
      text: !total ? 'Start with The 12 Vowels next — it is only 6 sounds wearing two coats each.'
           : pct>=80 ? 'These are going into your review queue. Come back tomorrow and they will stick.'
                     : 'The ones you missed will come back sooner. That is the whole trick — you do not need to get it right first time.'})
  ]));
  app.appendChild(h('div',{style:'height:14px'}));
  app.appendChild(h('button',{class:'btn', onclick:function(){ go('#/'); }},['Back to the path']));
  Engine.dingOK();
  refreshDue();
}

function progressBar(){
  var pct = Math.round(L.i / Math.max(1,L.steps.length) * 100);
  return h('div',{class:'progress-top'},[ h('i',{style:'width:'+pct+'%'}) ]);
}

function drawStep(){
  clear();
  app.appendChild(progressBar());
  var s = L.steps[L.i];
  if (!s) return finishLesson();
  ({
    rule:            stepRule,
    teach:           stepTeach,
    teachPair:       stepTeachPair,
    teachSignRule:   stepTeachSignRule,
    teachSignGroup:  stepTeachSignGroup,
    teachWord:       stepTeachWord,
    teachPairWords:  stepTeachPairWords,
    endings:         stepEndings,
    teachBridge:     stepTeachBridge,
    swaps:           stepSwaps,
    newsPattern:     stepNewsPattern,
    pairQuiz:        stepPairQuiz,
    mc:              stepMC,
    build:           stepBuild,
    trace:           stepTrace
  }[s.type] || function(){ nextStep(); })(s);
  window.scrollTo(0,0);
}

function contBtn(label){
  return h('button',{class:'btn', style:'margin-top:18px', onclick:nextStep},[label||'Got it →']);
}

/* ---------- teaching steps ---------- */

function stepRule(s){
  var d = h('div',{class:'demo'});
  s.rule.demo.forEach(function(p){
    if (p.op) d.appendChild(h('span',{class:'op', text:p.op}));
    else d.appendChild(h('div',{class:'u'},[ ta(p.g), h('span',{class:'lbl', text:p.l}) ]));
  });
  app.appendChild(h('div',{class:'card rule'},[
    h('div',{class:'n', text:s.n}),
    h('h3',{text:s.rule.h}),
    d,
    h('p',{text:s.rule.p})
  ]));
  app.appendChild(contBtn(s.n === DATA.RULES.length ? 'I get it — let me start →' : 'Next →'));
}

function stepTeach(s){
  Engine.ensure(s.item.id);
  app.appendChild(h('div',{class:'card teach'},[
    h('div',{class:'kicker', text:'New letter'}),
    ta(s.item.glyph,'glyph-xl'),
    h('div',{},[ h('span',{class:'roman', text:s.item.label}), spk(s.item.speak, true) ]),
    h('div',{class:'mnemo'},[ h('b',{text:'Say it: '}), s.item.tip ]),
    h('div',{class:'mnemo'},[ h('b',{text:'Remember the shape: '}), s.item.mn ])
  ]));
  app.appendChild(contBtn());
  Engine.speak(s.item.speak);
}

function stepTeachPair(s){
  Engine.ensure(s.a.id); Engine.ensure(s.b.id);
  function half(it){
    return h('div',{class:'', style:'flex:1;text-align:center'},[
      ta(it.glyph,'glyph-lg'),
      h('div',{},[ h('span',{class:'roman', style:'font-size:19px', text:it.label}), spk(it.speak) ]),
      h('div',{class:'tag', text:it.tip})
    ]);
  }
  app.appendChild(h('div',{class:'card'},[
    h('div',{class:'kicker center', text:'New vowels'}),
    h('div',{style:'display:flex;gap:8px;align-items:flex-start;margin-top:10px'},[
      half(s.a), h('div',{style:'align-self:center;color:var(--muted);font-weight:800;font-size:20px', text:'→'}), half(s.b)
    ]),
    h('div',{class:'mnemo'},[ h('b',{text:'Shape: '}), s.a.mn ]),
    h('div',{class:'mnemo'},[ h('b',{text:'Shape: '}), s.b.mn ])
  ]));
  app.appendChild(contBtn());
}

function stepTeachSignRule(){
  app.appendChild(h('div',{class:'card'},[
    h('div',{class:'kicker', text:'The rule'}),
    h('h3',{class:'h1', style:'margin:6px 0 10px', text:'One letter. Twelve outfits.'}),
    h('div',{class:'demo'},[
      h('div',{class:'u'},[ ta('க'), h('span',{class:'lbl',text:'ka'}) ]),
      h('div',{class:'u'},[ ta('கா'), h('span',{class:'lbl',text:'kaa'}) ]),
      h('div',{class:'u'},[ ta('கி'), h('span',{class:'lbl',text:'ki'}) ]),
      h('div',{class:'u'},[ ta('கு'), h('span',{class:'lbl',text:'ku'}) ]),
      h('div',{class:'u'},[ ta('கே'), h('span',{class:'lbl',text:'kae'}) ]),
      h('div',{class:'u'},[ ta('கோ'), h('span',{class:'lbl',text:'koa'}) ])
    ]),
    h('p',{class:'sub', style:'margin-top:12px', text:'The க never changes. Only the decoration around it changes. Learn the 12 decorations once and they work on all 18 consonants — that is 216 letters from 12 things.'}),
    h('div',{class:'mnemo'},[ h('b',{text:'And the dot: '}), 'க + ் = க் . The dot means "no vowel". It turns "ka" into a bare "k".' ])
  ]));
  app.appendChild(contBtn());
}

function stepTeachSignGroup(s){
  var box = h('div',{class:'card'},[
    h('div',{class:'kicker', text:s.title})
  ]);
  s.items.forEach(function(it){
    Engine.ensure(it.id);
    box.appendChild(h('div',{style:'display:flex;align-items:center;gap:14px;margin-top:14px;padding-top:14px;border-top:1px solid var(--line)'},[
      h('div',{style:'text-align:center;min-width:96px'},[
        ta(it.glyph,'glyph-lg'),
        h('div',{class:'roman', style:'font-size:17px', text:it.label})
      ]),
      h('div',{style:'flex:1'},[
        h('div',{style:'font-weight:800;font-size:16px'},[ 'sign ', ta(it.sign||'—'), ' → vowel ', ta(it.vowel) ]),
        h('div',{class:'tag', style:'margin-top:3px', text:it.pos}),
        h('div',{class:'tag', style:'margin-top:5px;color:var(--ink-2)', text:it.note})
      ]),
      spk(it.speak)
    ]));
  });
  app.appendChild(box);
  app.appendChild(contBtn());
}

function stepTeachWord(s){
  Engine.ensure(s.item.id);
  var parts = DATA.clusters(s.item.glyph);
  var chips = h('div',{class:'chips'});
  parts.forEach(function(p){
    if (p === ' '){ chips.appendChild(h('div',{style:'width:10px'})); return; }
    chips.appendChild(h('button',{class:'chip', onclick:function(){ Engine.speak(p); }},[
      document.createTextNode(p), h('small',{text:DATA.romanize(p)})
    ]));
  });
  app.appendChild(h('div',{class:'card wordcard'},[
    h('div',{class:'kicker', text:'Read this'}),
    h('div',{class:'w', lang:'ta', text:s.item.glyph}),
    h('div',{class:'say'},[ s.item.label, spk(s.item.speak, true) ]),
    h('div',{class:'mean', text:'“' + s.item.meaning + '”'}),
    h('div',{class:'tag', style:'margin-top:16px', text:'Tap each block to hear it'}),
    chips
  ]));
  app.appendChild(contBtn());
  Engine.speak(s.item.speak);
}

function stepTeachPairWords(s){
  app.appendChild(h('div',{class:'card'},[
    h('div',{class:'kicker center', text:'Look-alike pair'}),
    h('h3',{class:'h1 center', style:'margin:6px 0 4px', lang:'ta', text:s.pair.title}),
    h('p',{class:'sub center', style:'margin-bottom:14px', text:s.pair.hint}),
    h('div',{class:'pairbox'},[
      h('div',{onclick:function(){ Engine.speak(s.pair.a.w); }},[
        h('div',{class:'g', lang:'ta', text:s.pair.a.w}),
        h('div',{class:'s', text:s.pair.a.s}),
        h('div',{class:'m', text:s.pair.a.m})
      ]),
      h('div',{onclick:function(){ Engine.speak(s.pair.b.w); }},[
        h('div',{class:'g', lang:'ta', text:s.pair.b.w}),
        h('div',{class:'s', text:s.pair.b.s}),
        h('div',{class:'m', text:s.pair.b.m})
      ])
    ]),
    h('div',{class:'tag center', style:'margin-top:10px', text:'Tap either word to hear it'})
  ]));
  app.appendChild(contBtn());
}

function stepEndings(){
  var v = variety();
  var tbl = h('div',{style:'margin-top:6px'});
  tbl.appendChild(h('div',{style:'display:flex;gap:8px;padding:0 4px 8px;font-size:11.5px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:var(--muted)'},[
    h('div',{style:'flex:1.1', text:'who'}),
    h('div',{style:'flex:1', text:'you say'}),
    h('div',{style:'flex:0 0 18px'}),
    h('div',{style:'flex:1.2', text:'written'})
  ]));
  REGISTER.ENDINGS.forEach(function(e){
    tbl.appendChild(h('div',{style:'display:flex;gap:8px;align-items:center;padding:9px 4px;border-top:1px solid var(--line)'},[
      h('div',{style:'flex:1.1;font-size:13px;font-weight:700;color:var(--ink-2)', text:e.who}),
      h('div',{class:'glyph', style:'flex:1;font-size:19px', lang:'ta', text:e[v]}),
      h('div',{style:'flex:0 0 18px;color:var(--muted);font-weight:800', text:'\u2192'}),
      h('div',{class:'glyph', style:'flex:1.2;font-size:19px;color:var(--gold-deep);font-weight:600', lang:'ta', text:e.f})
    ]));
  });
  app.appendChild(h('div',{class:'card'},[
    h('div',{class:'kicker', text:'The whole gap, on one screen'}),
    h('h3',{class:'h1', style:'margin:6px 0 4px', text:'Nine endings'}),
    h('p',{class:'sub', text:'This is it. This is the thing standing between you and the news. Read down the two columns \u2014 the left is your mouth, the right is the page.'}),
    tbl
  ]));
  app.appendChild(contBtn());
}

function stepTeachBridge(s){
  Engine.ensure(s.item.id);
  app.appendChild(h('div',{class:'card wordcard'},[
    h('div',{class:'kicker', text: s.item.same ? 'Already identical' : 'You say \u2192 they write'}),
    h('div',{class:'mean', style:'font-size:20px;margin-bottom:16px', text:'\u201c' + s.item.meaning + '\u201d'}),
    h('div',{style:'background:var(--paper-2);border-radius:var(--r-md);padding:14px 12px'},[
      h('div',{class:'tag', style:'margin-bottom:4px', text:'you say  \u00b7  ' + varietyLabel()}),
      h('div',{class:'glyph', style:'font-size:clamp(24px,7vw,32px);font-weight:600', lang:'ta', text:s.item.spoken}),
      h('div',{class:'tag', style:'margin-top:2px', text:s.item.spokenSay})
    ]),
    h('div',{style:'font-size:24px;color:var(--muted);font-weight:800;margin:8px 0', text:'\u2193'}),
    h('div',{style:'background:var(--teal-soft);border:1px solid #B9DCD4;border-radius:var(--r-md);padding:14px 12px'},[
      h('div',{class:'tag', style:'margin-bottom:4px;color:var(--teal)', text:'written  \u00b7  news, books, everywhere'}),
      h('div',{class:'glyph', style:'font-size:clamp(24px,7vw,32px);font-weight:600', lang:'ta', text:s.item.glyph}),
      h('div',{class:'tag', style:'margin-top:2px'},[ s.item.label, spk(s.item.speak) ])
    ]),
    s.item.same ? h('div',{class:'mnemo', style:'text-align:left', text:'Nothing changed. Plenty of Tamil is already the same in both \u2014 you know more written Tamil than you think.'}) : null
  ]));
  app.appendChild(contBtn());
  Engine.speak(s.item.speak);
}

function stepSwaps(){
  var v = variety();
  var list = h('ul',{class:'list-clean'});
  REGISTER.SWAPS.forEach(function(w){
    list.appendChild(h('li',{},[
      h('span',{class:'glyph', style:'min-width:86px;font-size:21px', lang:'ta', text:w[v]}),
      h('span',{style:'color:var(--muted);font-weight:800;margin:0 4px', text:'\u2192'}),
      h('span',{class:'glyph', style:'flex:1;font-size:21px;color:var(--gold-deep);font-weight:600', lang:'ta', text:w.f}),
      h('span',{class:'s', style:'min-width:70px;text-align:right', text:w.en})
    ]));
  });
  app.appendChild(h('div',{class:'card'},[
    h('div',{class:'kicker', text:'Words that change clothes'}),
    h('h3',{class:'h1', style:'margin:6px 0 4px', text:'Same word, formal coat'}),
    h('p',{class:'sub', style:'margin-bottom:6px', text:'Written Tamil keeps the full endings that speech wears down. Watch the plurals get their \u0b95\u0bb3\u0bcd back.'}),
    list
  ]));
  app.appendChild(contBtn());
}

function stepNewsPattern(s){
  var box = h('div',{class:'card'},[
    h('div',{class:'kicker', text:'News pattern'}),
    h('h3',{class:'h1', style:'margin:6px 0 8px', lang:'ta', text:s.pat.title}),
    h('p',{class:'sub', text:s.pat.note})
  ]);
  s.pat.ex.forEach(function(e){
    box.appendChild(h('div',{style:'display:flex;align-items:flex-start;gap:8px;margin-top:14px;padding-top:12px;border-top:1px solid var(--line)'},[
      h('div',{style:'flex:1;min-width:0'},[
        h('div',{class:'glyph', style:'font-size:24px;font-weight:600;line-height:1.4;word-break:break-word', lang:'ta', text:e.f}),
        h('div',{class:'tag', text:e.s}),
        h('div',{style:'font-weight:700;font-size:14.5px;margin-top:3px', text:e.en})
      ]),
      h('div',{style:'flex:0 0 auto'},[ spk(e.f) ])
    ]));
  });
  app.appendChild(box);
  app.appendChild(contBtn());
}

/* ---------- quiz steps ---------- */

function verdict(ok, msg, extra){
  var v = h('div',{class:'verdict '+(ok?'ok':'no')},[
    h('div',{class:'msg'},[ ok?'✓':'✗', ' ', msg ])
  ]);
  if (extra) v.appendChild(h('div',{class:'sub', style:'margin-bottom:10px'},[extra]));
  v.appendChild(h('button',{class:'btn '+(ok?'teal':''), onclick:nextStep},['Continue →']));
  app.appendChild(v);
  if (ok){ Engine.dingOK(); Engine.buzz(20); } else { Engine.dingNo(); Engine.buzz([30,50,30]); }
}

function answered(step, ok){
  if (ok) L.right++; else { L.wrong++; if (step.item) L.redo.push(step); }
  if (step.item) Engine.grade(step.item.id, ok);
  refreshDue();
}

function stepMC(s){
  var head;
  if (s.show === 'glyph'){
    head = h('div',{class:'card teach'},[
      h('div',{class:'kicker', text:s.prompt}),
      ta(s.item.glyph,'glyph-xl'),
      spk(s.item.speak, true)
    ]);
  } else if (s.show === 'label'){
    head = h('div',{class:'card teach'},[
      h('div',{class:'kicker', text:s.prompt}),
      h('div',{class:'roman', style:'font-size:40px;margin:18px 0 4px', text:s.item.label}),
      h('div',{class:'tag', text:s.item.tip||''}),
      spk(s.item.speak, true)
    ]);
  } else if (s.show === 'formula'){
    head = h('div',{class:'card teach'},[
      h('div',{class:'kicker', text:s.prompt}),
      h('div',{class:'demo', style:'margin-top:14px'},[
        ta(s.formula[0]), h('span',{class:'op',text:'+'}),
        ta(s.formula[1]), h('span',{class:'op',text:'='}),
        h('span',{class:'op',text:'?'})
      ])
    ]);
  } else if (s.show === 'spoken'){
    head = h('div',{class:'card wordcard'},[
      h('div',{class:'kicker', text:s.prompt}),
      h('div',{class:'w', style:'font-size:clamp(25px,7.5vw,36px)', lang:'ta', text:s.item.spoken}),
      h('div',{class:'tag', style:'margin-top:4px', text:s.item.spokenSay}),
      h('div',{class:'mean', style:'font-size:16px;color:var(--muted)', text:'\u201c' + s.item.meaning + '\u201d'})
    ]);
  } else { /* word */
    head = h('div',{class:'card wordcard'},[
      h('div',{class:'kicker', text:s.prompt}),
      h('div',{class:'w', lang:'ta', text:s.item.glyph}),
      h('div',{class:'say'},[ s.item.label, spk(s.item.speak, true) ])
    ]);
  }
  app.appendChild(head);

  var glyphy = (s.key === 'glyph');
  // whole sentences cannot sit two-up in a grid
  var longAnswers = glyphy && s.options.some(function(o){ return String(o.glyph||'').length > 6; });
  var box = h('div',{class: (glyphy && !longAnswers) ? 'grid2' : 'grid1', style:'margin-top:14px'});
  var locked = false;

  s.options.forEach(function(o){
    var txt = o[s.key] != null ? o[s.key] : o.glyph;
    var btn = h('button',{class:'opt'+((glyphy && !longAnswers) ? ' big':''), lang: glyphy?'ta':null,
      style: longAnswers ? 'font-family:var(--ta);font-size:19px;font-weight:500;line-height:1.55;display:block;text-align:center;padding:16px 14px' : null},[
      document.createTextNode(txt)
    ]);
    if (!glyphy && o.kind === 'letter' && o.tip)
      btn.appendChild(h('small',{text:o.tip.split('.')[0]}));
    btn.addEventListener('click', function(){
      if (locked) return; locked = true;
      var ok = (o.id === s.item.id) || (txt === (s.item[s.key] != null ? s.item[s.key] : s.item.glyph));
      Array.prototype.forEach.call(box.children, function(c){ c.classList.add('dim'); });
      btn.classList.remove('dim'); btn.classList.add(ok?'ok':'no');
      if (!ok){
        Array.prototype.forEach.call(box.children, function(c,idx){
          var oo = s.options[idx];
          if (oo.id === s.item.id){ c.classList.remove('dim'); c.classList.add('ok'); }
        });
      }
      answered(s, ok);
      Engine.speak(s.item.speak);
      verdict(ok, ok ? 'Correct' : 'Not quite',
        ok ? null : h('span',{},[ ta(s.item.glyph,'glyph-md'), '  =  ', h('b',{text:s.item.label}),
             s.item.meaning ? '  ·  ' + s.item.meaning : '' ]));
    });
    box.appendChild(btn);
  });
  app.appendChild(box);
}

function stepBuild(s){
  var target = s.parts.filter(function(p){ return p !== ' '; });
  var chosen = [];
  var slots = h('div',{class:'slots'});
  var bank  = h('div',{class:'chips', style:'margin-top:14px'});
  var locked = false;

  app.appendChild(h('div',{class:'card wordcard'},[
    h('div',{class:'kicker', text:'Build the word'}),
    h('div',{class:'mean', style:'font-size:23px', text:'“' + s.item.meaning + '”'}),
    h('div',{class:'say'},[ s.item.label, spk(s.item.speak, true) ]),
    h('div',{style:'height:14px'}),
    slots
  ]));

  function redraw(){
    slots.innerHTML = '';
    if (!chosen.length) slots.appendChild(h('span',{class:'tag', text:'Tap the blocks below, in order'}));
    chosen.forEach(function(c,idx){
      slots.appendChild(h('button',{class:'chip', onclick:function(){
        if (locked) return;
        chosen.splice(idx,1); redraw(); syncBank();
      }},[ document.createTextNode(c.p), h('small',{text:DATA.romanize(c.p)}) ]));
    });
  }
  function syncBank(){
    Array.prototype.forEach.call(bank.children, function(el,i){
      var used = chosen.some(function(c){ return c.i === i; });
      el.classList.toggle('used', used);
    });
    check();
  }
  function check(){
    if (locked || chosen.length !== target.length) return;
    locked = true;
    var got = chosen.map(function(c){ return c.p; }).join('');
    var want = target.join('');
    var ok = got === want;
    answered(s, ok);
    Engine.speak(s.item.speak);
    verdict(ok, ok ? 'Perfect' : 'Close — here it is',
      h('span',{},[ ta(s.item.glyph,'glyph-md'), '  ', h('b',{text:s.item.label}) ]));
  }

  Engine.shuffle(target).forEach(function(p){
    var i = bank.children.length;
    bank.appendChild(h('button',{class:'chip', onclick:function(){
      if (locked) return;
      chosen.push({ p:p, i:i }); redraw(); syncBank();
    }},[ document.createTextNode(p), h('small',{text:DATA.romanize(p)}) ]));
  });
  redraw();
  app.appendChild(bank);
}

function stepPairQuiz(s){
  var want = s.pair[s.want], other = s.pair[s.want === 'a' ? 'b' : 'a'];
  Engine.ensure('W:'+want.w);
  var opts = Engine.shuffle([want, other]);
  var locked = false;

  app.appendChild(h('div',{class:'card teach'},[
    h('div',{class:'kicker', text:'Which one means this?'}),
    h('div',{style:'font-size:30px;font-weight:800;margin:16px 0 4px', text:'“'+want.m+'”'}),
    h('div',{class:'tag', text:s.pair.hint})
  ]));

  var box = h('div',{class:'grid2', style:'margin-top:14px'});
  opts.forEach(function(o){
    var btn = h('button',{class:'opt big', lang:'ta'},[ document.createTextNode(o.w) ]);
    btn.addEventListener('click', function(){
      if (locked) return; locked = true;
      var ok = o.w === want.w;
      btn.classList.add(ok?'ok':'no');
      answered({ item:wordItem(want) }, ok);
      Engine.speak(want.w);
      verdict(ok, ok?'Correct':'That was the other one',
        h('span',{},[ ta(want.w,'glyph-md'), ' = ', h('b',{text:want.s}), ' · ', want.m ]));
    });
    box.appendChild(btn);
  });
  app.appendChild(box);
}

function stepTrace(s){
  var size = Math.min(320, Math.max(220, window.innerWidth - 90));
  var hostWrap = h('div',{class:'trace-box'});
  var scoreEl  = h('div',{class:'score-ring center', style:'margin-top:12px', text:'Trace over the grey letter with your finger'});

  app.appendChild(h('div',{class:'card center'},[
    h('div',{class:'kicker', text:'Write it'}),
    h('div',{style:'display:flex;justify-content:center;align-items:center;gap:10px;margin:6px 0 14px'},[
      h('span',{class:'roman', text:s.item.label}), spk(s.item.speak)
    ]),
    hostWrap,
    scoreEl
  ]));

  var t = Engine.Trace(hostWrap, s.item.glyph, size);
  var done = false;

  if (t.hasGuide()){
    var demo = h('button',{class:'btn ghost sm', style:'width:100%;margin-top:10px', onclick:function(){
      scoreEl.textContent = 'Watch the pen, then copy it';
      t.play();
    }},['▶  Show me how to write it']);
    app.lastChild.appendChild(demo);
    // play it once automatically the first time the letter comes up
    setTimeout(function(){
      scoreEl.textContent = 'Watch the pen, then copy it';
      t.play(function(){ scoreEl.textContent = 'Now trace it yourself'; });
    }, 350);
  }

  var row = h('div',{class:'row', style:'margin-top:14px'},[
    h('button',{class:'btn ghost', onclick:function(){ t.stopPlay(); t.clear(); scoreEl.textContent='Trace over the grey letter with your finger'; }},['Clear']),
    h('button',{class:'btn', onclick:function(){
      if (done) return;
      if (!t.hasInk()){ Engine.toast('Draw over the letter first'); return; }
      t.stopPlay();
      var sc = t.score();
      done = true;
      var ok = sc >= 55;
      scoreEl.textContent = 'Match: ' + sc + '%';
      answered(s, ok);
      verdict(ok, ok ? (sc>=80 ? 'Beautiful' : 'Good enough — that is the shape') : 'Try to stay on the grey',
        ok ? null : 'Writing is muscle memory. It gets easier every single time — do not worry about the score.');
      row.remove();
    }},['Check my writing'])
  ]);
  app.appendChild(row);
  app.appendChild(h('div',{class:'note', style:'margin-top:12px',
    text:'Tip: use a finger on a phone/tablet, or hold the mouse button on a computer. Best of all — copy it onto real paper too.'}));
}

/* ---------------- screens ---------------- */

function unitState(idx){
  var u = DATA.UNITS[idx];
  var done = !!(Engine.S.units[u.id] && Engine.S.units[u.id].done);
  var prevDone = idx === 0 || !!(Engine.S.units[DATA.UNITS[idx-1].id] && Engine.S.units[DATA.UNITS[idx-1].id].done);
  return { done:done, open: done || prevDone, next: !done && prevDone };
}

function renderVarietyPicker(first){
  clear();
  top.textContent = first ? 'Welcome' : 'Your Tamil';
  back.hidden = !first ? false : true;

  app.appendChild(h('div',{class:'hero'},[
    h('div',{class:'big', lang:'ta', text:'\u0baa\u0b9f\u0bbf'}),
    h('div',{style:'font-size:19px;font-weight:800;margin-top:6px', text:'You already speak it.'}),
    h('p',{class:'sub', style:'margin-top:6px', text:'One question first, so the app can show you your own Tamil rather than somebody else\u2019s.'})
  ]));

  app.appendChild(h('div',{class:'h2', text:'Which Tamil do you speak?'}));
  REGISTER.VARIETIES.forEach(function(v){
    var on = Engine.S.settings.variety === v.id;
    app.appendChild(h('button',{class:'variety'+(on?' on':''), onclick:function(){
      Engine.S.settings.variety = v.id;
      Engine.save();
      Engine.toast(v.label + ' it is');
      go('#/');
      renderHome();
    }},[
      h('div',{style:'display:flex;align-items:baseline;gap:8px'},[
        h('b',{style:'font-size:18px;font-weight:800', text:v.label}),
        on ? h('span',{class:'pill', style:'font-size:11px', text:'current'}) : null
      ]),
      h('div',{class:'eg'},[
        h('span',{class:'tag', text:'you would say'}),
        h('div',{class:'glyph', style:'font-size:30px;font-weight:600;margin-top:2px', lang:'ta', text:v.eg}),
        h('div',{class:'tag', style:'margin-top:2px', text:'\u201cI am going\u201d'})
      ]),
      h('small',{style:'display:block;color:var(--muted);font-size:13.5px;font-weight:600;margin-top:10px', text:v.note})
    ]));
  });

  app.appendChild(h('div',{class:'note', style:'margin-top:14px'},[
    h('b',{text:'Only the \u201cyou say\u201d side changes. '}),
    'Written Tamil is identical everywhere \u2014 Jaffna, Chennai, Kuala Lumpur, Toronto. That is the whole point of learning it. You can switch this any time from the home screen.'
  ]));

  if (!first) return;
  app.appendChild(h('button',{class:'btn ghost', style:'margin-top:14px', onclick:function(){
    Engine.S.settings.variety = 'IN'; Engine.save(); renderHome();
  }},['Not sure \u2014 just pick one for me']));
}

function renderHome(){
  if (!Engine.S.settings.variety) return renderVarietyPicker(true);
  clear();
  top.textContent = 'Padi Tamil';
  back.hidden = true;

  var doneCount = DATA.UNITS.filter(function(u){ return Engine.S.units[u.id] && Engine.S.units[u.id].done; }).length;
  var due = Engine.dueItems().length;
  var known = Engine.learnedIds().length;

  app.appendChild(h('div',{class:'hero'},[
    h('div',{class:'big', lang:'ta', text:'வணக்கம்'}),
    h('div',{class:'sub', style:'margin-top:2px', text:'You already speak it. 10 minutes a day is enough.'}),
    h('div',{class:'streak'},[
      h('div',{},[ h('b',{text:String(Engine.S.streak.days||0)}), 'day streak' ]),
      h('div',{},[ h('b',{text:String(known)}), 'letters seen' ]),
      h('div',{},[ h('b',{text:Math.round(Engine.mastery()*100)+'%'}), 'locked in' ])
    ]),
    h('div',{class:'bar'},[ h('i',{style:'width:'+Math.round(doneCount/DATA.UNITS.length*100)+'%'}) ])
  ]));

  if (due > 0){
    app.appendChild(h('button',{class:'btn teal', style:'margin:12px 0 4px', onclick:function(){ go('#/review'); }},
      ['🔁  Review ' + due + ' item' + (due>1?'s':'') + ' due']));
    app.appendChild(h('p',{class:'tag center', style:'margin:6px 0 0',
      text:'Do this first. It is the part that actually makes it stick.'}));
  }

  app.appendChild(h('div',{class:'h2', text:'Your path'}));

  DATA.UNITS.forEach(function(u, idx){
    var st = unitState(idx);
    var cls = 'unit' + (st.done?' done':'') + (st.next?' next':'') + (st.open?'':' locked');
    var b = h('button',{class:cls, onclick:function(){
      if (!st.open){ Engine.toast('Finish the unit above first'); return; }
      go('#/unit/'+u.id);
    }},[
      h('div',{class:'bubble', lang:'ta'},[ st.done ? '✓' : u.icon ]),
      h('div',{class:'t'},[ h('b',{text:u.title}), h('small',{text:u.sub}) ]),
      h('div',{class:'chev', text:'›'})
    ]);
    app.appendChild(b);
  });

  if (!Engine.hasTamilVoice() && !Engine.hasClips()){
    var warn = h('div',{class:'note', style:'margin-top:14px'},[
      h('b',{text:'No Tamil voice found on this device. '}),
      'Everything still works — you just will not hear the letters spoken. On Android install a Tamil voice under Settings › Language › Text-to-speech. On iPhone, Settings › Accessibility › Spoken Content › Voices › Tamil. On Windows, Settings › Time & Language › Speech › Add voices › Tamil — then run tools\make-audio.ps1 once to bake the sounds into the app permanently.'
    ]);
    app.appendChild(warn);
    // the recordings manifest loads asynchronously; drop the notice if it turns up
    setTimeout(function(){ if (Engine.hasClips() || Engine.hasTamilVoice()) warn.remove(); }, 1200);
  }

  app.appendChild(h('div',{class:'h2', text:'More'}));
  app.appendChild(h('button',{class:'unit', onclick:function(){ go('#/grid'); }},[
    h('div',{class:'bubble'},['▦']),
    h('div',{class:'t'},[ h('b',{text:'The full 247 chart'}), h('small',{text:'Tap any letter to hear it and see how it is built'}) ]),
    h('div',{class:'chev', text:'›'})
  ]));
  app.appendChild(h('button',{class:'unit', onclick:function(){ go('#/write'); }},[
    h('div',{class:'bubble'},['✍️']),
    h('div',{class:'t'},[ h('b',{text:'Writing pad'}), h('small',{text:'Trace any letter, as many times as you like'}) ]),
    h('div',{class:'chev', text:'›'})
  ]));

  app.appendChild(h('button',{class:'unit', onclick:function(){ renderVarietyPicker(false); }},[
    h('div',{class:'bubble'},['\ud83d\udde3\ufe0f']),
    h('div',{class:'t'},[ h('b',{text:'Your spoken Tamil'}), h('small',{text:varietyLabel() + ' \u2014 tap to change'}) ]),
    h('div',{class:'chev', text:'\u203a'})
  ]));

  app.appendChild(h('div',{style:'height:20px'}));
  app.appendChild(h('button',{class:'btn ghost sm', style:'width:100%;opacity:.6', onclick:function(){
    if (confirm('Erase all progress and start over?')){ Engine.reset(); Engine.S.settings.variety=null; Engine.save(); renderHome(); }
  }},['Reset progress']));
}

function renderUnit(id){
  var u = null, idx = -1;
  DATA.UNITS.forEach(function(x,i){ if (x.id === id){ u = x; idx = i; } });
  if (!u) return renderHome();
  clear();
  top.textContent = u.title;
  back.hidden = false;

  var st = unitState(idx);
  app.appendChild(h('div',{class:'card center'},[
    h('div',{class:'bubble', style:'margin:0 auto 12px;width:70px;height:70px;font-size:34px;border-radius:22px;background:var(--paper-2);border:1px solid var(--line);display:grid;place-items:center;font-family:var(--ta)'},[u.icon]),
    h('h2',{class:'h1', text:u.title}),
    h('p',{class:'sub', text:u.sub}),
    st.done ? h('p',{class:'pill', style:'margin-top:12px', text:'✓ completed — repeat any time'}) : null
  ]));

  if (u.letters){
    var strip = h('div',{class:'chips', style:'margin-top:14px'});
    u.letters.forEach(function(ch){
      var it = letterItem(ch);
      strip.appendChild(h('button',{class:'chip', onclick:function(){ Engine.speak(ch); }},[
        document.createTextNode(ch), h('small',{text:it.label})
      ]));
    });
    app.appendChild(strip);
  }

  app.appendChild(h('button',{class:'btn', style:'margin-top:20px', onclick:function(){ startLesson(u); }},
    [ st.done ? 'Practise again' : 'Start' ]));

  if (u.words && u.words.length){
    app.appendChild(h('div',{class:'h2', text:'Words you will read'}));
    var list = h('ul',{class:'list-clean card', style:'padding:6px 16px'});
    u.words.slice(0,14).forEach(function(w){
      list.appendChild(h('li',{},[
        h('span',{class:'g', lang:'ta', text:w.w}),
        h('span',{class:'m'},[ w.m, h('div',{class:'s', text:w.s}) ]),
        spk(w.w)
      ]));
    });
    app.appendChild(list);
  }
  if (u.pairs){
    app.appendChild(h('div',{class:'h2', text:'Pairs in this clinic'}));
    var pl = h('ul',{class:'list-clean card', style:'padding:6px 16px'});
    u.pairs.forEach(function(p){
      pl.appendChild(h('li',{},[
        h('span',{class:'g', lang:'ta', text:p.a.w + ' / ' + p.b.w}),
        h('span',{class:'m'},[ p.a.m + ' / ' + p.b.m, h('div',{class:'s', text:p.hint}) ])
      ]));
    });
    app.appendChild(pl);
  }
}

function renderGrid(){
  clear();
  top.textContent = 'The 247 chart';
  back.hidden = false;

  app.appendChild(h('p',{class:'sub', style:'margin-bottom:12px'},[
    'Down the side: the 18 consonants. Across the top: the 12 vowels. Every cell is just the two glued together. ',
    h('b',{text:'Tap any cell.'})
  ]));

  var cols = [{s:DATA.PULLI, head:'்', lbl:'—'}].concat(
    DATA.SIGNS.map(function(sg){ return { s:sg.s, head:sg.v, lbl:sg.r }; })
  );

  var tbl = h('table',{class:'chart'});
  var thead = h('thead'), hr = h('tr');
  hr.appendChild(h('th',{text:'+'}));
  cols.forEach(function(c){ hr.appendChild(h('th',{lang:'ta', text:c.head})); });
  thead.appendChild(hr); tbl.appendChild(thead);

  var tb = h('tbody');
  DATA.CONS.forEach(function(c){
    var tr = h('tr');
    tr.appendChild(h('th',{lang:'ta', text:c.ch}));
    cols.forEach(function(col){
      var g = c.ch + col.s;
      var td = h('td',{lang:'ta', text:g, onclick:function(){ showCell(c, col, g, td); }});
      tr.appendChild(td);
    });
    tb.appendChild(tr);
  });
  tbl.appendChild(tb);
  app.appendChild(h('div',{class:'chart-wrap'},[tbl]));

  var panel = h('div',{class:'card', style:'margin-top:14px', id:'cellPanel'},[
    h('p',{class:'sub center', text:'Tap a cell above to break it apart.'})
  ]);
  app.appendChild(panel);
  app.appendChild(h('p',{class:'legend'},[
    '18 consonants × 12 vowels = 216, plus the 12 vowels themselves, plus ',
    h('span',{lang:'ta',text:'ஃ'}), ' = 247. That is the famous number — and you can already see it is just a times table.'
  ]));

  var lastTd = null;
  function showCell(c, col, g, td){
    if (lastTd) lastTd.classList.remove('hl');
    td.classList.add('hl'); lastTd = td;
    Engine.speak(g);
    var isPulli = col.s === DATA.PULLI;
    panel.innerHTML = '';
    panel.appendChild(h('div',{class:'demo', style:'margin:0 0 12px'},[
      h('div',{class:'u'},[ ta(c.ch), h('span',{class:'lbl', text:c.lab}) ]),
      h('span',{class:'op', text:'+'}),
      h('div',{class:'u'},[ ta(col.s || '∅'), h('span',{class:'lbl', text: isPulli ? 'dot (no vowel)' : col.head + ' ' + col.lbl }) ]),
      h('span',{class:'op', text:'='}),
      h('div',{class:'u'},[ ta(g), h('span',{class:'lbl', text: isPulli ? c.r : c.r + col.lbl }) ])
    ]));
    panel.appendChild(h('div',{class:'row'},[
      h('button',{class:'btn sm ghost', onclick:function(){ Engine.speak(g); }},['🔊 Hear it']),
      h('button',{class:'btn sm', onclick:function(){ go('#/write?g='+encodeURIComponent(g)); }},['✍️ Trace it'])
    ]));
    panel.appendChild(h('div',{class:'tag', style:'margin-top:10px', text:c.tip}));
  }
}

function renderReview(){
  clear();
  top.textContent = 'Review';
  back.hidden = true;
  var due = Engine.dueItems();
  var known = Engine.learnedIds().length;

  if (!known){
    app.appendChild(h('div',{class:'card finish'},[
      h('div',{class:'em', text:'🌱'}),
      h('h2',{class:'h1', style:'margin-top:8px', text:'Nothing to review yet'}),
      h('p',{class:'sub', text:'Finish your first lesson and things will start appearing here.'})
    ]));
    app.appendChild(h('button',{class:'btn', style:'margin-top:14px', onclick:function(){ go('#/'); }},['Go to the path']));
    return;
  }
  if (!due.length){
    var soon = Object.keys(Engine.S.srs).map(function(k){ return Engine.S.srs[k].due; }).sort(function(a,b){return a-b;})[0];
    var inDays = Math.max(0, soon - Engine.dayNum());
    app.appendChild(h('div',{class:'card finish'},[
      h('div',{class:'em', text:'✅'}),
      h('h2',{class:'h1', style:'margin-top:8px', text:'All caught up'}),
      h('p',{class:'sub', text:'Next review in ' + (inDays<=1 ? 'about a day' : inDays + ' days') + '. Learning happens in the gap — resting is part of the method.'})
    ]));
    app.appendChild(h('button',{class:'btn', style:'margin-top:14px', onclick:function(){ go('#/'); }},['Learn something new']));
    return;
  }

  app.appendChild(h('div',{class:'card center'},[
    h('div',{class:'kicker', text:'Spaced repetition'}),
    h('h2',{class:'h1', style:'margin:8px 0 4px', text:due.length + ' due today'}),
    h('p',{class:'sub', text:'Things you nearly forgot are the things worth practising. Getting one wrong is not failure — it is the review working.'})
  ]));
  app.appendChild(h('button',{class:'btn teal', style:'margin-top:16px', onclick:startReview},['Start review']));

  var boxes = [0,0,0,0,0];
  for (var id in Engine.S.srs) boxes[Engine.S.srs[id].box]++;
  var names = ['learning','1 day','3 days','1 week','3 weeks'];
  var list = h('ul',{class:'list-clean card', style:'margin-top:18px;padding:6px 16px'});
  boxes.forEach(function(n,i){
    list.appendChild(h('li',{},[
      h('span',{class:'m', text:'Box ' + (i+1) + ' · ' + names[i]}),
      h('span',{class:'pill', text:String(n)})
    ]));
  });
  app.appendChild(h('div',{class:'h2', text:'Where your letters are'}));
  app.appendChild(list);
}

function renderWrite(q){
  clear();
  top.textContent = 'Writing pad';
  back.hidden = true;

  var current = (q && q.g) || 'அ';
  var size = Math.min(340, Math.max(230, window.innerWidth - 80));
  var hostWrap = h('div',{class:'trace-box'});
  var scoreEl  = h('div',{class:'score-ring center', style:'margin-top:10px', text:'Trace the grey letter'});
  var t = null;

  var head = h('div',{class:'card center'},[
    h('div',{class:'kicker', id:'wLabel', text:''}),
    h('div',{style:'display:flex;justify-content:center;align-items:center;gap:8px;margin:4px 0 12px'},[
      h('span',{class:'roman', id:'wRoman', text:''}),
      h('button',{class:'speaker', onclick:function(){ Engine.speak(current); }},['🔊'])
    ]),
    hostWrap, scoreEl
  ]);
  app.appendChild(head);

  var showBtn = h('button',{class:'btn ghost sm', style:'width:100%;margin-top:12px', onclick:function(){
    scoreEl.textContent = 'Watch the pen, then copy it';
    t.play(function(){ scoreEl.textContent = 'Now trace it yourself'; });
  }},['▶  Show me how to write it']);
  app.appendChild(showBtn);

  app.appendChild(h('div',{class:'row', style:'margin-top:10px'},[
    h('button',{class:'btn ghost', onclick:function(){ t.stopPlay(); t.clear(); scoreEl.textContent='Trace the grey letter'; }},['Clear']),
    h('button',{class:'btn', onclick:function(){
      if (!t.hasInk()){ Engine.toast('Draw over the letter first'); return; }
      t.stopPlay();
      var sc = t.score();
      scoreEl.textContent = 'Match: ' + sc + '%  ' + (sc>=80?'— excellent':sc>=55?'— good':'— stay on the grey');
    }},['Check'])
  ]));

  function mount(){
    if (t) t.destroy();
    t = Engine.Trace(hostWrap, current, size);
    if (typeof showBtn !== 'undefined' && showBtn) showBtn.hidden = !t.hasGuide();
    document.getElementById('wLabel').textContent =
      DATA.cons(current) ? 'Consonant' : DATA.vowel(current) ? 'Vowel' : 'Letter';
    document.getElementById('wRoman').textContent = DATA.romanize(current);
    scoreEl.textContent = 'Trace the grey letter';
  }
  mount();

  function picker(title, chars){
    app.appendChild(h('div',{class:'h2', text:title}));
    var box = h('div',{class:'chips', style:'justify-content:flex-start'});
    chars.forEach(function(ch){
      box.appendChild(h('button',{class:'chip', onclick:function(){
        current = ch; mount(); Engine.speak(ch); window.scrollTo(0,0);
      }},[ document.createTextNode(ch), h('small',{text:DATA.romanize(ch)}) ]));
    });
    app.appendChild(box);
  }
  picker('Vowels', DATA.VOWELS.map(function(v){ return v.ch; }));
  picker('Consonants', DATA.CONS.map(function(c){ return c.ch; }));
  picker('க with every sign', DATA.SIGNS.map(function(s){ return 'க'+s.s; }).concat(['க'+DATA.PULLI]));

  app.appendChild(h('div',{class:'note', style:'margin-top:16px'},[
    h('b',{text:'How to actually learn to write: '}),
    'trace it here three times, then write it on paper three times without looking. The paper part is what moves it into your hand.'
  ]));
}

/* ---------------- router ---------------- */
function refreshDue(){
  var n = Engine.dueItems().length;
  dueDot.hidden = n === 0;
  Array.prototype.forEach.call(document.querySelectorAll('#tabbar a'), function(a){
    a.classList.toggle('on', a.getAttribute('href') === '#/' + (curTab==='/'?'':curTab));
  });
}
var curTab = '/';

function route(){
  var raw = location.hash.replace(/^#/,'') || '/';
  var qs = {}, qi = raw.indexOf('?');
  var path = raw;
  if (qi >= 0){
    path = raw.slice(0,qi);
    raw.slice(qi+1).split('&').forEach(function(kv){
      var p = kv.split('='); qs[p[0]] = decodeURIComponent(p[1]||'');
    });
  }
  var parts = path.split('/').filter(Boolean);

  if (!parts.length){ curTab='/'; renderHome(); }
  else if (parts[0] === 'unit'){ curTab='/'; renderUnit(parts[1]); }
  else if (parts[0] === 'grid'){ curTab='grid'; renderGrid(); }
  else if (parts[0] === 'review'){ curTab='review'; renderReview(); }
  else if (parts[0] === 'write'){ curTab='write'; renderWrite(qs); }
  else { curTab='/'; renderHome(); }
  refreshDue();
}

back.addEventListener('click', function(){
  if (L && L.i < L.steps.length && location.hash.indexOf('/unit/') < 0){ }
  history.length > 1 ? history.back() : go('#/');
});
sndBt.addEventListener('click', function(){
  Engine.S.settings.sound = !Engine.S.settings.sound;
  Engine.save();
  sndBt.textContent = Engine.S.settings.sound ? '🔊' : '🔇';
  sndBt.classList.toggle('muted-icon', !Engine.S.settings.sound);
  Engine.toast(Engine.S.settings.sound ? 'Sound on' : 'Sound off');
});
sndBt.textContent = Engine.S.settings.sound ? '🔊' : '🔇';

window.addEventListener('hashchange', route);
route();

})();
