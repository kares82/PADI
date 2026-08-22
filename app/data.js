/* ============================================================
   Padi Tamil — curriculum data
   ------------------------------------------------------------
   Teaching order is WORD-FIRST, not alphabet-first.
   You read அம்மா in unit 3, not unit 30.
   ============================================================ */

var DATA = (function () {

  /* ---- 12 vowels (உயிர் எழுத்து) -------------------------
     Taught as 6 SHORT/LONG pairs + 2 compounds.
     The long one is almost always the short one plus a mark. */
  var VOWELS = [
    { ch:'அ', r:'a',   say:'a  as in "about"',      len:'short', mate:'ஆ',
      mn:'A person sitting upright. The plainest sound in Tamil — a soft "uh".' },
    { ch:'ஆ', r:'aa',  say:'aa as in "father"',     len:'long',  mate:'அ',
      mn:'Same as அ, but with a tail stretching right — the tail = hold it longer.' },
    { ch:'இ', r:'i',   say:'i  as in "sit"',        len:'short', mate:'ஈ',
      mn:'A curling vine. Short and quick.' },
    { ch:'ஈ', r:'ee',  say:'ee as in "see"',        len:'long',  mate:'இ',
      mn:'The same vine with an extra loop on top. Extra loop = extra length.' },
    { ch:'உ', r:'u',   say:'u  as in "put"',        len:'short', mate:'ஊ',
      mn:'A hook, like an umbrella handle.' },
    { ch:'ஊ', r:'oo',  say:'oo as in "food"',       len:'long',  mate:'உ',
      mn:'The same hook with a second curl added. Longer shape, longer sound.' },
    { ch:'எ', r:'e',   say:'e  as in "bed"',        len:'short', mate:'ஏ',
      mn:'A curling trunk.' },
    { ch:'ஏ', r:'ae',  say:'ay as in "say"',        len:'long',  mate:'எ',
      mn:'The same trunk wearing a hat on top. Hat = long.' },
    { ch:'ஐ', r:'ai',  say:'ai as in "eye"',        len:'—',     mate:null,
      mn:'A compound: a + i slid together. Say "ah-ee" fast and you get it.' },
    { ch:'ஒ', r:'o',   say:'o  as in "not"',        len:'short', mate:'ஓ',
      mn:'A rounded mouth with a tail.' },
    { ch:'ஓ', r:'oa',  say:'o  as in "go"',         len:'long',  mate:'ஒ',
      mn:'Same rounded mouth, now with a hat. Hat = long.' },
    { ch:'ஔ', r:'au',  say:'ow as in "cow"',        len:'—',     mate:null,
      mn:'A compound: a + u. The rarest vowel — you will barely meet it.' }
  ];

  /* ---- 18 consonants (மெய் எழுத்து) ----------------------
     `r`  = short roman used when building syllables
     `lab`= unique display label used in quizzes
     `tip`= where the sound is made in your mouth  */
  var CONS = [
    { ch:'க', r:'k',  lab:'ka',  tip:'back of throat. Between vowels it softens to "ga"/"ha".', fam:'stop',
      mn:'A walking stick with a hooked handle.' },
    { ch:'ச', r:'ch', lab:'cha', tip:'tip of tongue behind teeth. Often said "sa" too.', fam:'stop',
      mn:'A chair seen from the side.' },
    { ch:'த', r:'th', lab:'tha · soft', tip:'tongue TOUCHING your top front teeth — soft, like "th" in "this".', fam:'dental',
      mn:'A flag on a pole with a loop at the foot.' },
    { ch:'ப', r:'p',  lab:'pa',  tip:'both lips. Between vowels it softens to "ba".', fam:'cup',
      mn:'A cup with a tall left wall. THE base shape of the ப ம ய family.' },
    { ch:'ம', r:'m',  lab:'ma',  tip:'both lips, humming.', fam:'cup',
      mn:'The ப cup with a closed loop added on the left. Cup + loop = ma.' },
    { ch:'ய', r:'y',  lab:'ya',  tip:'like "y" in "yes".', fam:'cup',
      mn:'The ப cup with a hook trailing off the right. Cup + tail = ya.' },
    { ch:'ந', r:'n',  lab:'na · teeth', tip:'tongue on your top TEETH. Pairs with த.', fam:'dental',
      mn:'Mirror-cousin of த. Same neighbourhood of the mouth, same neighbourhood of shape.' },
    { ch:'ன', r:'n',  lab:'na · ridge', tip:'tongue on the RIDGE just behind your teeth. The everyday "n".', fam:'nnn',
      mn:'The most common n. Flat-bottomed, sits on the line.' },
    { ch:'ண', r:'N',  lab:'na · curled', tip:'tongue CURLED BACK to the roof. Deeper, hollower n.', fam:'retro',
      mn:'A knot with a curl — the curl reminds you to curl your tongue.' },
    { ch:'ல', r:'l',  lab:'la · plain', tip:'ordinary English "l".', fam:'lll',
      mn:'A ladle.' },
    { ch:'ள', r:'L',  lab:'la · curled', tip:'tongue CURLED BACK to the roof, then "l".', fam:'retro',
      mn:'ல with a loop dropped underneath — the loop = curl your tongue.' },
    { ch:'ழ', r:'zh', lab:'zha · deep', tip:'the famous Tamil sound. Curl your tongue back, do NOT touch, and say "rl". As in "tamiZH".', fam:'lll',
      mn:'A curl inside a curl. The letter that gives தமிழ் its name.' },
    { ch:'ர', r:'r',  lab:'ra · soft', tip:'a light single tap, like Spanish "pero".', fam:'rrr',
      mn:'A bent rod.' },
    { ch:'ற', r:'R',  lab:'ra · hard', tip:'a harder, trilled r. Doubled (ற்ற) it becomes "tt".', fam:'rrr',
      mn:'ர that ate too much — same rod, bigger belly.' },
    { ch:'வ', r:'v',  lab:'va',  tip:'lips softly together, between "v" and "w".', fam:'soft',
      mn:'A vase.' },
    { ch:'ட', r:'T',  lab:'ta · curled', tip:'tongue CURLED BACK. Between vowels it becomes "da".', fam:'retro',
      mn:'A tub. Curl your tongue like the curl of the tub.' },
    { ch:'ங', r:'ng', lab:'nga', tip:'the "ng" in "sing". Almost only appears before க.', fam:'nasal',
      mn:'Rare. If you see it, a க is coming next.' },
    { ch:'ஞ', r:'ny', lab:'nya', tip:'the "ny" in "canyon". Almost only appears before ச.', fam:'nasal',
      mn:'Rare. If you see it, a ச is coming next.' }
  ];

  /* ---- the 12 vowel signs -------------------------------
     `pos` is the real, teachable geometry of the script. */
  var SIGNS = [
    { s:'',   v:'அ', r:'a',  pos:'nothing',            note:'The bare letter ALREADY says "a". This is the #1 thing beginners miss.' },
    { s:'ா', v:'ஆ', r:'aa', pos:'stick on the right', note:'One straight stick to the right = hold the vowel longer.' },
    { s:'ி', v:'இ', r:'i',  pos:'hook on top-right',  note:'A small hook riding on the shoulder.' },
    { s:'ீ', v:'ஈ', r:'ee', pos:'bigger hook on top-right', note:'Same shoulder, fatter hook. Bigger = longer.' },
    { s:'ு', v:'உ', r:'u',  pos:'curl at bottom-right', note:'⚠ The shape MORPHS to fit each letter. The only irregular pair.' },
    { s:'ூ', v:'ஊ', r:'oo', pos:'double curl at bottom-right', note:'⚠ Also morphs. Learn கு கூ, சு சூ … by eye, not by rule.' },
    { s:'ெ', v:'எ', r:'e',  pos:'hook on the LEFT',   note:'Written BEFORE the letter, but spoken AFTER it.' },
    { s:'ே', v:'ஏ', r:'ae', pos:'bigger hook on the LEFT', note:'Same left hook, longer sound.' },
    { s:'ை', v:'ஐ', r:'ai', pos:'double hook on the LEFT', note:'Two humps on the left.' },
    { s:'ொ', v:'ஒ', r:'o',  pos:'LEFT hook + RIGHT stick', note:'It is literally ெ + ா wrapped around the letter.' },
    { s:'ோ', v:'ஓ', r:'oa', pos:'LEFT hook + RIGHT stick', note:'It is literally ே + ா. Same trick, longer sound.' },
    { s:'ௌ', v:'ஔ', r:'au', pos:'LEFT hook + RIGHT flourish', note:'Rare. ெ on the left, a flourish on the right.' }
  ];

  var PULLI = '்'; // ் — the dot that kills the vowel

  /* ---- words, grouped by the unit that unlocks them ---- */
  var W = {
    u2:[
      { w:'கை', s:'kai',   m:'hand' },
      { w:'கோ', s:'koa',   m:'king' },
      { w:'கா', s:'kaa',   m:'grove' }
    ],
    u3:[
      { w:'அம்மா', s:'am-maa', m:'mother' },
      { w:'அப்பா', s:'ap-paa', m:'father' },
      { w:'மாமா',  s:'maa-maa', m:'uncle' },
      { w:'பை',    s:'pai',    m:'bag' },
      { w:'மை',    s:'mai',    m:'ink' },
      { w:'பூ',    s:'poo',    m:'flower' },
      { w:'பாம்பு', s:'paam-bu', m:'snake' },
      { w:'பாய்',  s:'paay',   m:'mat' }
    ],
    u4:[
      { w:'தாய்',  s:'thaay', m:'mother' },
      { w:'பசு',   s:'pa-su', m:'cow' },
      { w:'கதை',   s:'ka-thai', m:'story' },
      { w:'காகம்', s:'kaa-kam', m:'crow' },
      { w:'காய்',  s:'kaay',  m:'raw fruit' },
      { w:'பாசம்', s:'paa-sam', m:'affection' },
      { w:'சாமி',  s:'saa-mi', m:'god' },
      { w:'மாசம்', s:'maa-sam', m:'month' }
    ],
    u5:[
      { w:'நான்',   s:'naan',   m:'I' },
      { w:'நீ',     s:'nee',    m:'you' },
      { w:'நாய்',   s:'naay',   m:'dog' },
      { w:'கண்',    s:'kaN',    m:'eye' },
      { w:'பணம்',   s:'pa-Nam', m:'money' },
      { w:'மனம்',   s:'ma-nam', m:'mind' },
      { w:'மீன்',   s:'meen',   m:'fish' },
      { w:'தேன்',   s:'thaen',  m:'honey' },
      { w:'நண்பன்', s:'naN-ban', m:'friend' },
      { w:'நதி',    s:'na-thi', m:'river' }
    ],
    u6:[
      { w:'பல்',   s:'pal',     m:'tooth' },
      { w:'கல்',   s:'kal',     m:'stone' },
      { w:'மலை',   s:'ma-lai',  m:'mountain' },
      { w:'தமிழ்', s:'tha-mizh', m:'Tamil' },
      { w:'பழம்',  s:'pa-zham', m:'fruit' },
      { w:'கிளி',  s:'ki-Li',   m:'parrot' },
      { w:'பால்',  s:'paal',    m:'milk' },
      { w:'மழை',   s:'ma-zhai', m:'rain' },
      { w:'நிலா',  s:'ni-laa',  m:'moon' },
      { w:'ஆள்',   s:'aaL',     m:'person' }
    ],
    u7:[
      { w:'மரம்',   s:'ma-ram',  m:'tree' },
      { w:'ஊர்',    s:'oor',     m:'town' },
      { w:'வா',     s:'vaa',     m:'come' },
      { w:'வீடு',   s:'vee-du',  m:'house' },
      { w:'மாடு',   s:'maa-du',  m:'cow' },
      { w:'ஆடு',    s:'aa-du',   m:'goat' },
      { w:'காற்று', s:'kaat-tru', m:'wind' },
      { w:'நேரம்',  s:'nae-ram', m:'time' },
      { w:'படம்',   s:'pa-dam',  m:'picture' },
      { w:'சாவி',   s:'saa-vi',  m:'key' },
      { w:'கடல்',   s:'ka-dal',  m:'sea' },
      { w:'ஆறு',    s:'aa-Ru',   m:'river' },
      { w:'விளக்கு', s:'vi-Lak-ku', m:'lamp' },
      { w:'வாழை',   s:'vaa-zhai', m:'banana' }
    ],
    u8:[
      { w:'தங்கை',   s:'thang-gai', m:'younger sister' },
      { w:'தங்கம்',  s:'thang-gam', m:'gold' },
      { w:'சங்கு',   s:'sang-gu',   m:'conch' },
      { w:'ஞாயிறு',  s:'nyaa-yi-Ru', m:'Sunday' },
      { w:'எங்கே',   s:'eng-gae',   m:'where' },
      { w:'இங்கே',   s:'ing-gae',   m:'here' },
      { w:'அங்கே',   s:'ang-gae',   m:'there' },
      { w:'ஞாபகம்',  s:'nyaa-pa-kam', m:'memory' }
    ]
  };

  /* ---- minimal pairs: the look-alike / sound-alike clinic ---- */
  var PAIRS = [
    { title:'ர  vs  ற',  hint:'ர is a light tap. ற is a hard trill.',
      a:{ w:'கரி', s:'ka-ri', m:'charcoal' }, b:{ w:'கறி', s:'ka-Ri', m:'curry' } },
    { title:'ல  vs  ழ',  hint:'ல is a plain l. ழ curls the tongue back without touching.',
      a:{ w:'வலி', s:'va-li', m:'pain' },     b:{ w:'வழி', s:'va-zhi', m:'way / path' } },
    { title:'ன  vs  ண',  hint:'ன is the everyday n. ண curls the tongue back.',
      a:{ w:'மனம்', s:'ma-nam', m:'mind' },   b:{ w:'மணம்', s:'ma-Nam', m:'fragrance' } },
    { title:'ல  vs  ள',  hint:'ள is ல with the tongue curled back.',
      a:{ w:'கல்', s:'kal', m:'stone' },      b:{ w:'கள்', s:'kaL', m:'toddy' } },
    { title:'த  vs  ட',  hint:'த is on the teeth (soft). ட curls back (hard).',
      a:{ w:'பாதம்', s:'paa-tham', m:'foot' }, b:{ w:'பாடம்', s:'paa-dam', m:'lesson' } },
    { title:'ர  vs  ற (2)', hint:'Same rod, bigger belly on ற.',
      a:{ w:'வேர்', s:'vaer', m:'root' },     b:{ w:'வேறு', s:'vae-Ru', m:'different' } }
  ];

  var SENTENCES = [
    { w:'வணக்கம்.', s:'va-Nak-kam', m:'Hello. / Greetings.' },
    { w:'நன்றி.',   s:'nan-Ri',     m:'Thank you.' },
    { w:'இது என் வீடு.', s:'i-thu en vee-du', m:'This is my house.' },
    { w:'அது ஒரு நாய்.', s:'a-thu o-ru naay', m:'That is a dog.' },
    { w:'உங்கள் பெயர் என்ன?', s:'un-gaL pe-yar en-na', m:'What is your name?' },
    { w:'என் பெயர் மாலா.', s:'en pe-yar maa-laa', m:'My name is Mala.' },
    { w:'நான் தமிழ் படிக்கிறேன்.', s:'naan tha-mizh pa-dik-ki-Raen', m:'I am learning Tamil.' },
    { w:'எனக்கு பசிக்கிறது.', s:'e-nak-ku pa-sik-ki-Ra-thu', m:'I am hungry.' },
    { w:'நீ எப்படி இருக்கிறாய்?', s:'nee ep-pa-di i-ruk-ki-Raay', m:'How are you?' },
    { w:'வா, போகலாம்.', s:'vaa, poa-ga-laam', m:'Come, let us go.' }
  ];

  /* ---- Unit 0. One idea per card, and every one of them SHOWN.
         An abstract claim about a script you cannot read yet is noise;
         the same claim with the base letter picked out in colour is
         the moment it clicks. `viz` names the picture ui.js draws. ---- */
  var RULES = [
    { viz:'oneLetter',
      h:'Start with one letter.',
      p:'This is a Tamil letter. It says \u201cka\u201d. Tap the speaker and hear it.\n\nAnd here is the good news you never got with English: Tamil is honest. A letter makes the same sound every single time. There is no \u201ccough, dough, through\u201d in Tamil. Learn a letter once and you can read it forever.' },

    { viz:'oneMark', base:'\u0b95', sign:'\u0bbe', from:'ka', to:'kaa',
      h:'One small mark changes the sound.',
      p:'Look at the coloured part. That is the only thing I added \u2014 one stroke on the right. \u201cka\u201d has become \u201ckaa\u201d. Just held a bit longer.\n\nThe plain part is your original letter. It is still sitting right there, untouched. Tap the picture to take the mark off and put it back.' },

    { viz:'twelve', base:'\u0b95',
      h:'There are twelve marks. That is the whole system.',
      p:'Same letter every time. Only the coloured part changes.\n\nThis is the row that scares people in every Tamil book, because it is printed in one colour and looks like twelve new letters to memorise. It is not. It is one letter wearing twelve different hats.' },

    { viz:'dot', base:'\u0b95',
      h:'A dot on top switches the vowel off.',
      p:'Sometimes you want the bare consonant \u2014 just \u201ck\u201d, with no vowel after it. Tamil has one mark for that: a dot on the head.\n\nThat dot is called a pu\u1e37\u1e37i. You will see it constantly, on the end of words like \u0baa\u0bbe\u0bb2\u0bcd (paal, milk).' },

    { viz:'everyLetter', bases:['\u0bae','\u0baa','\u0ba4'],
      h:'The same twelve marks fit every letter.',
      p:'You are not learning the marks again for each new letter. Learn them once on \u0b95 and they behave identically on \u0bae, on \u0baa, on all eighteen consonants.\n\nThat is the whole trick. It is why Tamil looks enormous and is actually small.' },

    { viz:'maths',
      h:'So you learn about 30 things, not 247.',
      p:'18 consonants \u00d7 12 marks = 216 combinations. Add the 12 vowels standing alone, plus one rare extra symbol, and you get the famous 247 that every Tamil chart throws at you on page one.\n\nBut you never learn 247 of anything. You learn 18 letters and 12 marks, and the rest is multiplication. Thirty things. You can do thirty things.' }
  ];

  /* ---- the path ---------------------------------------- */
  var UNITS = [
    { id:'u0',  kind:'reveal',  icon:'🔑', title:'The Secret',
      sub:'5 rules. No memorising. Read this first.' },

    { id:'u1',  kind:'vowels',  icon:'அ',  title:'The 12 Vowels',
      sub:'uyir ezhuthu — really just 6 sounds, each short and long',
      letters:['அ','ஆ','இ','ஈ','உ','ஊ','எ','ஏ','ஐ','ஒ','ஓ','ஔ'] },

    { id:'u2',  kind:'signs',   icon:'ா',  title:'The 12 Signs',
      sub:'The multiplication rule — turn ka into kaa, ki, kee, ku …',
      words:W.u2 },

    { id:'u3',  kind:'cons',    icon:'ம',  title:'ப · ம · ய', roman:'pa · ma · ya',
      sub:'The cup family — you will read am-maa (mother) today',
      letters:['ப','ம','ய'], words:W.u3 },

    { id:'u4',  kind:'cons',    icon:'க',  title:'க · ச · த', roman:'ka · cha · tha',
      sub:'The three commonest stops',
      letters:['க','ச','த'], words:W.u4 },

    { id:'u5',  kind:'cons',    icon:'ந',  title:'ந · ன · ண', roman:'na · na · na',
      sub:'Three different N sounds — teeth, ridge, curled',
      letters:['ந','ன','ண'], words:W.u5 },

    { id:'u6',  kind:'cons',    icon:'ழ',  title:'ல · ள · ழ', roman:'la · la · zha',
      sub:'Three different L sounds — including the zha in “Tamizh”',
      letters:['ல','ள','ழ'], words:W.u6 },

    { id:'u7',  kind:'cons',    icon:'ர',  title:'ர · ற · வ · ட', roman:'ra · ra · va · ta',
      sub:'Two R sounds — soft and hard — plus va and ta',
      letters:['ர','ற','வ','ட'], words:W.u7 },

    { id:'u8',  kind:'cons',    icon:'ங',  title:'ங · ஞ', roman:'nga · nya',
      sub:'The last two. Rare, easy, and then you are done.',
      letters:['ங','ஞ'], words:W.u8 },

    { id:'u9',  kind:'clinic',  icon:'⚖',  title:'Look-alike Clinic',
      sub:'The look-alike letters that trip absolutely everyone up',
      pairs:PAIRS },

    { id:'u10', kind:'read',    icon:'📖', title:'Real Words',
      sub:'Everything you have learned, mixed together',
      words:[].concat(W.u3,W.u4,W.u5,W.u6,W.u7,W.u8) },

    { id:'u11', kind:'read',    icon:'💬', title:'First Sentences',
      sub:'Say hello, say thank you, say your name',
      words:SENTENCES },

    /* ---- part two: from the Tamil you speak to the Tamil that is written ---- */
    { id:'u12', kind:'diglossia', icon:'📺', title:'Why the News Sounds Different',
      sub:'You are not bad at Tamil. Tamil has two forms.' },

    { id:'u13', kind:'bridge',    icon:'🌉', title:'Your Tamil → Written Tamil',
      sub:'The endings that turn what you say into what is printed' },

    { id:'u14', kind:'news',      icon:'📰', title:'Reading the News',
      sub:'The three shapes every headline is built from' }
  ];

  /* every word the app can ever quiz on, in one flat list */
  var ALLWORDS = [];
  ['u2','u3','u4','u5','u6','u7','u8'].forEach(function(k){ ALLWORDS = ALLWORDS.concat(W[k]); });
  ALLWORDS = ALLWORDS.concat(SENTENCES);
  PAIRS.forEach(function(p){ ALLWORDS.push(p.a); ALLWORDS.push(p.b); });

  /* ---- helpers ----------------------------------------- */

  // Split Tamil text into grapheme clusters (base + its marks).
  function clusters(text){
    var out = [], i, c, code, comb;
    for (i = 0; i < text.length; i++){
      c = text.charAt(i); code = text.charCodeAt(i);
      comb = (code >= 0x0BBE && code <= 0x0BCD) || code === 0x0BD7;
      if (comb && out.length) out[out.length-1] += c;
      else out.push(c);
    }
    return out;
  }

  function cons(ch){ for(var i=0;i<CONS.length;i++) if(CONS[i].ch===ch) return CONS[i]; return null; }
  function vowel(ch){ for(var i=0;i<VOWELS.length;i++) if(VOWELS[i].ch===ch) return VOWELS[i]; return null; }
  function sign(s){ for(var i=0;i<SIGNS.length;i++) if(SIGNS[i].s===s) return SIGNS[i]; return null; }

  // "கா" -> "kaa" ; "க்" -> "k" ; "அ" -> "a"
  function romanize(cluster){
    var v = vowel(cluster);
    if (v) return v.r;
    var base = cluster.charAt(0), rest = cluster.slice(1);
    var c = cons(base);
    if (!c) return cluster;
    if (rest === PULLI) return c.r;
    var sg = sign(rest);
    return c.r + (sg ? sg.r : '');
  }

  function romanizeWord(w){
    return clusters(w).map(romanize).join('');
  }

  // consonants introduced up to and including a unit index
  function lettersThrough(unitIdx){
    var out = [];
    for (var i=0;i<=unitIdx && i<UNITS.length;i++){
      if (UNITS[i].letters) out = out.concat(UNITS[i].letters);
    }
    return out;
  }

  return {
    VOWELS:VOWELS, CONS:CONS, SIGNS:SIGNS, PULLI:PULLI,
    UNITS:UNITS, RULES:RULES, PAIRS:PAIRS, SENTENCES:SENTENCES, WORDS:W, ALLWORDS:ALLWORDS,
    clusters:clusters, cons:cons, vowel:vowel, sign:sign,
    romanize:romanize, romanizeWord:romanizeWord, lettersThrough:lettersThrough
  };
})();
