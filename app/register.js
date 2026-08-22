/* ============================================================
   Padi Tamil — the spoken → written bridge
   ------------------------------------------------------------
   Tamil is strongly diglossic. What people speak (பேச்சுத் தமிழ்)
   and what is written, printed and read on the news
   (எழுத்துத் தமிழ்) are different systems. A fluent speaker can
   still be lost watching the news. That is not a vocabulary gap,
   it is a register gap — and it is mostly a small, regular set of
   verb endings.

   Every entry carries THREE spoken columns' worth of information:
     f  = formal / written  (identical everywhere in the world)
     IN = Indian  colloquial (Chennai / general Tamil Nadu)
     LK = Sri Lankan colloquial (Jaffna)

   ⚠ REVIEW NOTE
   The `f` and `IN` columns are high confidence. The `LK` column
   captures the well-attested Jaffna features — the -றன் / -றம் /
   -றியள் endings, retention of full -கள் plurals, ஒண்டு/மூண்டு
   for ஒன்று/மூன்று, and வாறன் for "I come". Sri Lankan Tamil
   varies (Jaffna vs Batticaloa vs Colombo vs up-country), so a
   native Jaffna speaker should read the LK column before launch.
   It is deliberately kept in one place so it is easy to correct.
   ============================================================ */

var REGISTER = (function () {

  /* ---- Unit 12: the reveal ---- */
  var RULES = [
    { h:'You are not bad at Tamil. Tamil has two forms.',
      p:'What you speak at home and what is written in books and read on the news are two different registers. Nobody speaks written Tamil casually — not even the newsreader, once the camera is off. You were never taught the second one. That is the whole problem.',
      demo:[{g:'பேச்சு',l:'what you speak'},{op:'≠'},{g:'எழுத்து',l:'what is written'}] },

    { h:'This is why the news loses you.',
      p:'Same sentence, same words, same meaning. Only the ending changed — and that ending is the thing standing between you and the six o’clock news.',
      demo:[{g:'போறேன்',l:'you say'},{op:'→'},{g:'போகிறேன்',l:'news says'}] },

    { h:'It is a handful of endings, not a second language.',
      p:'You are not starting from zero. You already own the vocabulary, the grammar and the ear. What you are missing is the formal coat the words put on — and it goes on the same way nearly every time.',
      demo:[{g:'-றேன்',l:'spoken'},{op:'→'},{g:'-கிறேன்',l:'written'},{op:'·'},{g:'-ங்க',l:'spoken'},{op:'→'},{g:'-கள்',l:'written'}] },

    { h:'Written Tamil is the same everywhere on earth.',
      p:'A Jaffna grandmother, a Madurai uncle and a Kuala Lumpur cousin do not speak alike. But they read exactly the same Tamil. Written Tamil is the one Tamil the whole world shares — which makes this the most useful thing you will learn.',
      demo:[{g:'யாழ்ப்பாணம்',l:'Jaffna'},{op:'='},{g:'சென்னை',l:'Chennai'},{op:'='},{g:'கோலாலம்பூர்',l:'KL'}] },

    { h:'So: you already speak it. Now read it.',
      p:'From here the app shows you your own sentences with their written clothes on. Nothing new to memorise — just the same Tamil, dressed for the news.',
      demo:[{g:'நீங்கள் ஏற்கனவே பேசுகிறீர்கள்',l:'you already speak it'}] }
  ];

  /* ---- Unit 13a: the present-tense endings, the core of the gap ---- */
  var ENDINGS = [
    { who:'I',              f:'-கிறேன்',   IN:'-றேன்',  LK:'-றன்'    },
    { who:'you',            f:'-கிறாய்',   IN:'-றே',    LK:'-றாய்'   },
    { who:'he',             f:'-கிறான்',   IN:'-றான்',  LK:'-றான்'   },
    { who:'she',            f:'-கிறாள்',   IN:'-றா',    LK:'-றாள்'   },
    { who:'he/she (polite)',f:'-கிறார்',   IN:'-றாரு',  LK:'-றார்'   },
    { who:'it',             f:'-கிறது',    IN:'-குது',  LK:'-குது'   },
    { who:'we',             f:'-கிறோம்',   IN:'-றோம்',  LK:'-றம்'    },
    { who:'you (plural)',   f:'-கிறீர்கள்', IN:'-றீங்க', LK:'-றியள்'  },
    { who:'they',           f:'-கிறார்கள்', IN:'-றாங்க', LK:'-றாங்கள்' }
  ];

  /* ---- Unit 13b: whole sentences you already say ---- */
  var BRIDGE = [
    { en:'I am going.',
      f:'நான் போகிறேன்.',  sf:'naan poa-gi-Raen',
      IN:'நான் போறேன்.',   sIN:'naan poa-Raen',
      LK:'நான் போறன்.',    sLK:'naan poa-Ran' },

    { en:'I am coming.',
      f:'நான் வருகிறேன்.', sf:'naan va-ru-gi-Raen',
      IN:'நான் வர்றேன்.',  sIN:'naan var-Raen',
      LK:'நான் வாறன்.',    sLK:'naan vaa-Ran' },

    { en:'What are you doing?',
      f:'நீ என்ன செய்கிறாய்?', sf:'nee en-na sey-gi-Raay',
      IN:'நீ என்ன பண்றே?',     sIN:'nee en-na paN-Rae',
      LK:'நீ என்ன செய்யிறாய்?', sLK:'nee en-na sey-yi-Raay' },

    { en:'Where are you going?',
      f:'நீங்கள் எங்கே போகிறீர்கள்?', sf:'neen-gaL en-gae poa-gi-Reer-gaL',
      IN:'நீங்க எங்க போறீங்க?',       sIN:'neen-ga en-ga poa-Reen-ga',
      LK:'நீங்கள் எங்க போறியள்?',      sLK:'neen-gaL en-ga poa-Ri-yaL' },

    { en:'They are eating.',
      f:'அவர்கள் சாப்பிடுகிறார்கள்.', sf:'a-var-gaL saap-pi-du-gi-Raar-gaL',
      IN:'அவங்க சாப்பிடுறாங்க.',      sIN:'a-van-ga saap-pi-du-Raan-ga',
      LK:'அவங்கள் சாப்பிடுறாங்கள்.',   sLK:'a-van-gaL saap-pi-du-Raan-gaL' },

    { en:'We are going home.',
      f:'நாங்கள் வீட்டுக்குப் போகிறோம்.', sf:'naan-gaL veet-tuk-kup poa-gi-Roam',
      IN:'நாங்க வீட்டுக்குப் போறோம்.',    sIN:'naan-ga veet-tuk-kup poa-Roam',
      LK:'நாங்கள் வீட்டுக்குப் போறம்.',    sLK:'naan-gaL veet-tuk-kup poa-Ram' },

    { en:'It is raining.',
      f:'மழை பெய்கிறது.', sf:'ma-zhai pey-gi-Ra-thu',
      IN:'மழை பெய்யுது.', sIN:'ma-zhai pey-yu-thu',
      LK:'மழை பெய்யுது.', sLK:'ma-zhai pey-yu-thu' },

    { en:'He is saying something.',
      f:'அவன் ஏதோ கூறுகிறான்.', sf:'a-van ae-thoa koo-Ru-gi-Raan',
      IN:'அவன் ஏதோ சொல்றான்.',  sIN:'a-van ae-thoa sol-Raan',
      LK:'அவன் ஏதோ சொல்லுறான்.', sLK:'a-van ae-thoa sol-lu-Raan' },

    { en:'I do not know.',
      f:'எனக்குத் தெரியாது.', sf:'e-nak-kuth the-ri-yaa-thu',
      IN:'எனக்குத் தெரியாது.', sIN:'e-nak-kuth the-ri-yaa-thu',
      LK:'எனக்குத் தெரியாது.', sLK:'e-nak-kuth the-ri-yaa-thu',
      same:true },

    { en:'The child is sleeping.',
      f:'குழந்தை தூங்குகிறது.', sf:'ku-zhan-thai thoon-gu-gi-Ra-thu',
      IN:'குழந்தை தூங்குது.',   sIN:'ku-zhan-thai thoon-gu-thu',
      LK:'குழந்தை தூங்குது.',   sLK:'ku-zhan-thai thoon-gu-thu' }
  ];

  /* ---- Unit 13c: plurals, pronouns and numbers ---- */
  var SWAPS = [
    { en:'they / those people', f:'அவர்கள்', IN:'அவங்க',  LK:'அவங்கள்' },
    { en:'you (plural)',        f:'நீங்கள்',  IN:'நீங்க',   LK:'நீங்கள்'  },
    { en:'we',                  f:'நாங்கள்',  IN:'நாங்க',   LK:'நாங்கள்'  },
    { en:'one',                 f:'ஒன்று',   IN:'ஒண்ணு',   LK:'ஒண்டு'   },
    { en:'two',                 f:'இரண்டு',  IN:'ரெண்டு',  LK:'ரெண்டு'  },
    { en:'three',               f:'மூன்று',  IN:'மூணு',    LK:'மூண்டு'  },
    { en:'no / not',            f:'இல்லை',   IN:'இல்ல',    LK:'இல்லை'   },
    { en:'now',                 f:'இப்போது', IN:'இப்போ',   LK:'இப்ப'    },
    { en:'very',                f:'மிகவும்', IN:'ரொம்ப',   LK:'நல்லா'   },
    { en:'but',                 f:'ஆனால்',   IN:'ஆனா',     LK:'ஆனா'     },
    { en:'because',             f:'ஏனெனில்', IN:'ஏன்னா',   LK:'ஏனெண்டா' },
    { en:'afterwards',          f:'பிறகு',   IN:'அப்புறம்', LK:'பிறகு'  },
    { en:'to do',               f:'செய்',    IN:'பண்ணு',   LK:'செய்'    },
    { en:'to say',              f:'கூறு',    IN:'சொல்லு',  LK:'சொல்லு'  },
    { en:'want / need',         f:'வேண்டும்', IN:'வேணும்',  LK:'வேணும்'  }
  ];

  /* ---- Unit 14: the three shapes that make news Tamil ---- */
  var NEWSPAT = [
    { title:'“has done” —  -உள்ளார் / -உள்ளது',
      note:'Newsreaders almost never use plain past tense. They use the perfect: not "announced" but "has announced". Spot this ending and half the sentence unlocks.',
      ex:[ { f:'அறிவித்துள்ளார்', s:'a-Ri-vith-thuL-Laar', en:'has announced' },
           { f:'நடைபெற்றுள்ளது',  s:'na-dai-pet-RuL-La-thu', en:'has taken place' },
           { f:'வெளியிட்டுள்ளது', s:'ve-Li-yit-tuL-La-thu', en:'has released' } ] },

    { title:'“they did” —  -னர்',
      note:'Written Tamil has a short third-person-plural past ending you will never hear in conversation. அவர்கள் வந்தார்கள் becomes simply வந்தனர்.',
      ex:[ { f:'வந்தனர்',    s:'van-tha-nar',   en:'they came' },
           { f:'கூறினர்',    s:'koo-Ri-nar',    en:'they said' },
           { f:'ஈடுபட்டனர்', s:'ee-du-pat-ta-nar', en:'they took part' } ] },

    { title:'“was done to” —  -படு',
      note:'The passive. Bolted onto a verb it means the thing was done to someone, without saying who did it. News runs on this.',
      ex:[ { f:'கைது செய்யப்பட்டார்', s:'kai-thu sey-yap-pat-taar', en:'was arrested' },
           { f:'வெளியிடப்பட்டது',     s:'ve-Li-yi-dap-pat-ta-thu',  en:'was released' },
           { f:'கூறப்பட்டுள்ளது',      s:'koo-Rap-pat-tuL-La-thu',   en:'it has been stated' } ] }
  ];

  /* ---- Unit 14b: the words the news actually uses ---- */
  var NEWSVOCAB = [
    { w:'அரசு',        s:'a-ra-su',          m:'government' },
    { w:'அமைச்சர்',     s:'a-mai-char',       m:'minister' },
    { w:'முதலமைச்சர்',  s:'mu-tha-la-mai-char', m:'chief minister' },
    { w:'தேர்தல்',      s:'thaer-thal',       m:'election' },
    { w:'மக்கள்',       s:'mak-kaL',          m:'the people / public' },
    { w:'மாணவர்கள்',    s:'maa-Na-var-gaL',   m:'students' },
    { w:'திட்டம்',      s:'thit-tam',         m:'scheme / plan' },
    { w:'அறிவிப்பு',    s:'a-Ri-vip-pu',      m:'announcement' },
    { w:'விபத்து',      s:'vi-path-thu',      m:'accident' },
    { w:'கனமழை',       s:'ka-na-ma-zhai',    m:'heavy rain' },
    { w:'விசாரணை',     s:'vi-saa-ra-Nai',    m:'investigation' },
    { w:'கைது',        s:'kai-thu',          m:'arrest' },
    { w:'நிலைமை',      s:'ni-lai-mai',       m:'situation' },
    { w:'தெரிவித்தார்', s:'the-ri-vith-thaar', m:'stated / informed' },
    { w:'நடைபெறும்',   s:'na-dai-pe-Rum',    m:'will take place' },
    { w:'காரணமாக',     s:'kaa-ra-Na-maa-ga', m:'because of' },
    { w:'தொடர்பாக',    s:'tho-dar-paa-ga',   m:'regarding' }
  ];

  /* ---- Unit 14c: read an actual headline ---- */
  var HEADLINES = [
    { w:'முதலமைச்சர் புதிய திட்டத்தை அறிவித்துள்ளார்.',
      s:'mu-tha-la-mai-char pu-thi-ya thit-tath-thai a-Ri-vith-thuL-Laar',
      m:'The chief minister has announced a new scheme.' },
    { w:'நேற்று கனமழை பெய்தது.',
      s:'naet-Ru ka-na-ma-zhai pey-tha-thu',
      m:'Heavy rain fell yesterday.' },
    { w:'தேர்தல் அடுத்த மாதம் நடைபெறும்.',
      s:'thaer-thal a-duth-tha maa-tham na-dai-pe-Rum',
      m:'The election will take place next month.' },
    { w:'விபத்தில் மூவர் காயமடைந்தனர்.',
      s:'vi-path-thil moo-var kaa-ya-ma-dain-tha-nar',
      m:'Three people were injured in the accident.' },
    { w:'அரசு புதிய அறிவிப்பை வெளியிட்டுள்ளது.',
      s:'a-ra-su pu-thi-ya a-Ri-vip-pai ve-Li-yit-tuL-La-thu',
      m:'The government has released a new announcement.' },
    { w:'மாணவர்கள் போராட்டத்தில் ஈடுபட்டனர்.',
      s:'maa-Na-var-gaL poa-raat-tath-thil ee-du-pat-ta-nar',
      m:'Students took part in a protest.' },
    { w:'நிலைமை குறித்து விசாரணை நடைபெற்றுள்ளது.',
      s:'ni-lai-mai ku-Rith-thu vi-saa-ra-Nai na-dai-pet-RuL-La-thu',
      m:'An investigation has taken place regarding the situation.' },
    { w:'அமைச்சர் இது குறித்து தெரிவித்தார்.',
      s:'a-mai-char i-thu ku-Rith-thu the-ri-vith-thaar',
      m:'The minister stated regarding this.' }
  ];

  /* which spoken column to show */
  function col(entry, variety){ return entry[variety === 'LK' ? 'LK' : 'IN']; }
  function say(entry, variety){ return entry[variety === 'LK' ? 'sLK' : 'sIN']; }

  var VARIETIES = [
    { id:'IN', label:'Indian Tamil',      note:'Tamil Nadu, Puducherry, and most of the Malaysian and Singaporean diaspora', eg:'நான் போறேன்' },
    { id:'LK', label:'Sri Lankan Tamil',  note:'Jaffna and the Sri Lankan diaspora in Canada, the UK and Australia',        eg:'நான் போறன்' }
  ];

  return {
    RULES:RULES, ENDINGS:ENDINGS, BRIDGE:BRIDGE, SWAPS:SWAPS,
    NEWSPAT:NEWSPAT, NEWSVOCAB:NEWSVOCAB, HEADLINES:HEADLINES,
    VARIETIES:VARIETIES, col:col, say:say
  };
})();
