/* ============================================================
   Padi Tamil — the reading you are learning FOR

   Three bodies of real Tamil, unlocked as you go:

   1. ஆத்திசூடி (Aathichudi) — Avvaiyar, c. 12th century.
      One line of advice per letter, in alphabetical order. This is
      the actual book Tamil children have opened first for eight
      hundred years, and its twelve vowel lines map exactly onto the
      twelve vowels of Unit 1. So the oldest Tamil primer in
      existence becomes this app's Unit 1 reward, line by line.
      One of the lines is literally "never look down on numbers and
      letters". Avvaiyar wrote the marketing.

   2. திருக்குறள் (Thirukkural) — Thiruvalluvar, c. 2000 years old.
      Seven-word couplets. Kural 1 opens with the letter அ, the
      first letter this app teaches.

   3. Fables in graded Tamil — short, familiar, and told with the
      letters the learner has by then. Ending with the Avvaiyar
      naval-fruit story, which is about the humility of learning.
   ============================================================ */

var STORIES = (function () {

  /* ---- ஆத்திசூடி: one line per vowel, unlocked with that vowel ---- */
  var AATHICHUDI = [
    { v:'அ', t:'அறம் செய விரும்பு',      r:'a-Ram se-ya vi-rum-bu',        e:'Desire to do what is right.' },
    { v:'ஆ', t:'ஆறுவது சினம்',          r:'aa-Ru-va-thu si-nam',          e:'Anger is a thing to be cooled.' },
    { v:'இ', t:'இயல்வது கரவேல்',        r:'i-yal-va-thu ka-ra-vael',      e:'Never hide what you are able to give.' },
    { v:'ஈ', t:'ஈவது விலக்கேல்',        r:'ee-va-thu vi-lak-kael',        e:'Never stop another person from giving.' },
    { v:'உ', t:'உடையது விளம்பேல்',      r:'u-dai-ya-thu vi-Lam-bael',     e:'Never boast about what you own.' },
    { v:'ஊ', t:'ஊக்கமது கைவிடேல்',      r:'ook-ka-ma-thu kai-vi-dael',    e:'Never let go of your determination.' },
    { v:'எ', t:'எண் எழுத்து இகழேல்',    r:'eN e-zhuth-thu i-ga-zhael',    e:'Never look down on numbers and letters.' },
    { v:'ஏ', t:'ஏற்பது இகழ்ச்சி',       r:'aeR-pa-thu i-gazh-chi',        e:'To live by begging is a disgrace.' },
    { v:'ஐ', t:'ஐயம் இட்டு உண்',        r:'ai-yam it-tu uN',              e:'Give to those in need before you eat.' },
    { v:'ஒ', t:'ஒப்புரவு ஒழுகு',        r:'op-pu-ra-vu o-zhu-gu',         e:'Live generously among others.' },
    { v:'ஓ', t:'ஓதுவது ஒழியேல்',        r:'oa-thu-va-thu o-zhi-yael',     e:'Never stop learning.' },
    { v:'ஔ', t:'ஔவியம் பேசேல்',         r:'au-vi-yam pae-sael',           e:'Never speak out of envy.' }
  ];

  /* ---- திருக்குறள்: unlocked by level ---- */
  var KURALS = [
    { n:1, lvl:0,
      a:'அகர முதல எழுத்தெல்லாம் ஆதி', ar:'a-ga-ra mu-tha-la e-zhuth-thel-laam aa-thi',
      b:'பகவன் முதற்றே உலகு',          br:'ba-ga-van mu-thaR-Rae u-la-gu',
      e:'A is the first of all letters; the first of the world is God.',
      note:'The very first couplet of the Thirukkural is about the very first letter — அ. The one you learned first too.' },

    { n:396, lvl:1,
      a:'தொட்டனைத் தூறும் மணற்கேணி மாந்தர்க்குக்', ar:'thot-ta-naith thoo-Rum ma-NaR-kae-Ni maan-thark-kuk',
      b:'கற்றனைத் தூறும் அறிவு',                  br:'kat-Ra-naith thoo-Rum a-Ri-vu',
      e:'As deep as you dig a well in sand, water rises; as much as you learn, wisdom rises.',
      note:'Two thousand years old, and still the best description of what you are doing right now.' },

    { n:391, lvl:2,
      a:'கற்க கசடறக் கற்பவை கற்றபின்', ar:'kaR-ka ka-sa-da-Rak kaR-pa-vai kat-Ra-pin',
      b:'நிற்க அதற்குத் தக',            br:'niR-ka a-thaR-kuth tha-ka',
      e:'Learn thoroughly what is worth learning — then live by what you have learned.',
      note:'கல் (kal) is the root of both "learn" and "stone". You carve knowledge in.' },

    { n:100, lvl:3,
      a:'இனிய உளவாக இன்னாத கூறல்', ar:'i-ni-ya u-La-vaa-ga in-naa-tha koo-Ral',
      b:'கனிஇருப்பக் காய்கவர்ந் தற்று', br:'ka-ni-i-rup-pak kaay-ka-varn thaR-Ru',
      e:'To speak harshly when kind words exist is to pick an unripe fruit while ripe fruit hangs beside it.',
      note:'கனி is ripe fruit, காய் is unripe. You already know both words from Unit 4.' },

    { n:423, lvl:4,
      a:'எப்பொருள் யார்யார்வாய்க் கேட்பினும் அப்பொருள்', ar:'ep-po-ruL yaar-yaar-vaayk kaet-pi-num ap-po-ruL',
      b:'மெய்ப்பொருள் காண்பது அறிவு',                   br:'meyp-po-ruL kaaN-pa-thu a-Ri-vu',
      e:'Whatever is said, and by whoever says it, wisdom is to see the truth of the thing itself.',
      note:'மெய் means both "truth" and "body" — the real substance of a thing.' },

    { n:80, lvl:5,
      a:'அன்பின் வழியது உயிர்நிலை அஃதிலார்க்கு', ar:'an-bin va-zhi-ya-thu u-yir-ni-lai ah-thi-laark-ku',
      b:'என்புதோல் போர்த்த உடம்பு',                br:'en-bu-thoal poar-tha u-dam-bu',
      e:'The life that moves along the path of love is the living one. Without it, the body is bone wrapped in skin.',
      note:'Spot the ஃ in அஃதிலார்க்கு — that is āytham, the rare 247th letter. You have now met all of them.' }
  ];

  /* ---- fables in graded Tamil ---- */
  var FABLES = [
    { id:'crow', unlock:'u3', icon:'🐦',
      ta:'தாகமுள்ள காகம்', tar:'thaa-ga-muL-La kaa-gam', en:'The Thirsty Crow',
      blurb:'The first story every Tamil child is told.',
      lines:[
        { t:'ஒரு காகம் தாகமாக இருந்தது.',      r:'o-ru kaa-gam thaa-ga-maa-ga i-run-tha-thu', e:'A crow was thirsty.' },
        { t:'அது ஒரு குடத்தைக் கண்டது.',        r:'a-thu o-ru ku-dath-thaik kaN-da-thu',       e:'It saw a pot.' },
        { t:'குடத்தில் கொஞ்சம் தண்ணீர் இருந்தது.', r:'ku-dath-thil kon-jam thaN-Neer i-run-tha-thu', e:'There was a little water in the pot.' },
        { t:'காகத்தின் அலகு எட்டவில்லை.',        r:'kaa-gath-thin a-la-gu et-ta-vil-lai',       e:'The crow’s beak could not reach it.' },
        { t:'காகம் சிறு கற்களைப் போட்டது.',      r:'kaa-gam si-Ru kaR-ka-Laip poat-ta-thu',     e:'The crow dropped in small stones.' },
        { t:'தண்ணீர் மேலே வந்தது.',             r:'thaN-Neer mae-lae van-tha-thu',             e:'The water rose.' },
        { t:'காகம் தண்ணீரைக் குடித்தது.',        r:'kaa-gam thaN-Nee-raik ku-dith-tha-thu',     e:'The crow drank the water.' }
      ],
      moral:{ t:'அறிவு இருந்தால் வழி உண்டு.', r:'a-Ri-vu i-run-thaal va-zhi uN-du', e:'Where there is wit, there is a way.' } },

    { id:'tortoise', unlock:'u5', icon:'🐢',
      ta:'ஆமையும் முயலும்', tar:'aa-mai-yum mu-ya-lum', en:'The Tortoise and the Hare',
      blurb:'You know how it ends. Now read it in Tamil.',
      lines:[
        { t:'ஒரு முயலும் ஒரு ஆமையும் நண்பர்கள்.', r:'o-ru mu-ya-lum o-ru aa-mai-yum naN-bar-gaL', e:'A hare and a tortoise were friends.' },
        { t:'முயல் வேகமாக ஓடும்.',              r:'mu-yal vae-ga-maa-ga oa-dum',               e:'The hare ran fast.' },
        { t:'ஆமை மெதுவாக நடக்கும்.',            r:'aa-mai me-thu-vaa-ga na-dak-kum',           e:'The tortoise walked slowly.' },
        { t:'“நான் வெல்வேன்” என்று முயல் சொன்னது.', r:'naan vel-vaen en-Ru mu-yal son-na-thu',  e:'“I will win,” said the hare.' },
        { t:'பந்தயம் தொடங்கியது.',              r:'pan-tha-yam tho-dan-gi-ya-thu',             e:'The race began.' },
        { t:'முயல் வழியில் தூங்கியது.',          r:'mu-yal va-zhi-yil thoon-gi-ya-thu',         e:'The hare fell asleep along the way.' },
        { t:'ஆமை நிற்காமல் நடந்தது.',           r:'aa-mai niR-kaa-mal na-dan-tha-thu',         e:'The tortoise walked without stopping.' },
        { t:'ஆமை வென்றது.',                    r:'aa-mai ven-Ra-thu',                         e:'The tortoise won.' }
      ],
      moral:{ t:'விடாமுயற்சி வெற்றி தரும்.', r:'vi-daa-mu-yaR-si vet-Ri tha-rum', e:'Persistence gives victory.' } },

    { id:'fox', unlock:'u6', icon:'🦊',
      ta:'காக்கையும் நரியும்', tar:'kaak-kai-yum na-ri-yum', en:'The Crow and the Fox',
      blurb:'In the Tamil telling, it is a vadai.',
      lines:[
        { t:'ஒரு காக்கை ஒரு வடையை எடுத்தது.', r:'o-ru kaak-kai o-ru va-dai-yai e-duth-tha-thu', e:'A crow took a vadai.' },
        { t:'அது ஒரு மரத்தில் அமர்ந்தது.',     r:'a-thu o-ru ma-rath-thil a-mar-ntha-thu',       e:'It sat in a tree.' },
        { t:'ஒரு நரி அதைப் பார்த்தது.',        r:'o-ru na-ri a-thaip paar-tha-thu',              e:'A fox saw it.' },
        { t:'“உன் குரல் மிக இனிமை” என்றது.',   r:'un ku-ral mi-ga i-ni-mai en-Ra-thu',           e:'“Your voice is very sweet,” it said.' },
        { t:'காக்கை பாட வாயைத் திறந்தது.',     r:'kaak-kai paa-da vaa-yaith thi-Ran-tha-thu',    e:'The crow opened its mouth to sing.' },
        { t:'வடை கீழே விழுந்தது.',            r:'va-dai kee-zhae vi-zhun-tha-thu',              e:'The vadai fell down.' },
        { t:'நரி வடையை எடுத்துச் சென்றது.',    r:'na-ri va-dai-yai e-duth-thuch sen-Ra-thu',     e:'The fox took the vadai and left.' }
      ],
      moral:{ t:'புகழ்ச்சியை நம்பாதே.', r:'pu-gazh-chi-yai nam-baa-thae', e:'Do not trust flattery.' } },

    { id:'lion', unlock:'u7', icon:'🦁',
      ta:'சிங்கமும் எலியும்', tar:'sin-ga-mum e-li-yum', en:'The Lion and the Mouse',
      blurb:'The small repay the strong.',
      lines:[
        { t:'ஒரு சிங்கம் தூங்கியது.',           r:'o-ru sin-gam thoon-gi-ya-thu',            e:'A lion was sleeping.' },
        { t:'ஒரு சிறிய எலி அதன் மேல் ஓடியது.', r:'o-ru si-Ri-ya e-li a-than mael oa-di-ya-thu', e:'A small mouse ran over it.' },
        { t:'சிங்கம் எலியைப் பிடித்தது.',       r:'sin-gam e-li-yaip pi-dith-tha-thu',       e:'The lion caught the mouse.' },
        { t:'“என்னை விடு” என்று எலி கெஞ்சியது.', r:'en-nai vi-du en-Ru e-li ken-ji-ya-thu',  e:'“Let me go,” begged the mouse.' },
        { t:'சிங்கம் எலியை விட்டது.',           r:'sin-gam e-li-yai vit-ta-thu',             e:'The lion let the mouse go.' },
        { t:'பின்பு சிங்கம் வலையில் சிக்கியது.', r:'pin-bu sin-gam va-lai-yil sik-ki-ya-thu', e:'Later the lion was caught in a net.' },
        { t:'எலி வலையைக் கடித்தது.',           r:'e-li va-lai-yaik ka-dith-tha-thu',        e:'The mouse bit through the net.' },
        { t:'சிங்கம் தப்பியது.',                r:'sin-gam thap-pi-ya-thu',                  e:'The lion escaped.' }
      ],
      moral:{ t:'சிறியவரும் உதவ முடியும்.', r:'si-Ri-ya-va-rum u-tha-va mu-di-yum', e:'Even the small can help.' } },

    { id:'avvai', unlock:'u8', icon:'🌳',
      ta:'அவ்வையாரும் நாவல் பழமும்', tar:'av-vai-yaa-rum naa-val pa-zha-mum',
      en:'Avvaiyar and the Naval Fruit',
      blurb:'The greatest Tamil poet is humbled by a boy in a tree. Every Tamil knows this one.',
      lines:[
        { t:'அவ்வையார் ஒரு பெரிய தமிழ்ப் புலவர்.', r:'av-vai-yaar o-ru pe-ri-ya tha-mizhp pu-la-var', e:'Avvaiyar was a great Tamil poet.' },
        { t:'ஒரு நாள் அவர் நாவல் மரத்தடியில் அமர்ந்தார்.', r:'o-ru naaL a-var naa-val ma-rath-tha-di-yil a-mar-nthaar', e:'One day she sat beneath a naval tree.' },
        { t:'மரத்தில் ஒரு சிறுவன் இருந்தான்.',  r:'ma-rath-thil o-ru si-Ru-van i-run-thaan',   e:'A boy was up in the tree.' },
        { t:'“சுட்ட பழம் வேண்டுமா, சுடாத பழம் வேண்டுமா?”', r:'sut-ta pa-zham vaeN-du-maa, su-daa-tha pa-zham vaeN-du-maa', e:'“Do you want a burnt fruit, or an unburnt one?”' },
        { t:'அவ்வையார் சிரித்தார். “சுட்ட பழம்.”', r:'av-vai-yaar si-rith-thaar. sut-ta pa-zham', e:'Avvaiyar laughed. “A burnt one.”' },
        { t:'சிறுவன் மரத்தை உலுக்கினான்.',      r:'si-Ru-van ma-rath-thai u-luk-ki-naan',      e:'The boy shook the tree.' },
        { t:'பழங்கள் மணலில் விழுந்தன.',         r:'pa-zhan-gaL ma-Na-lil vi-zhun-tha-na',      e:'The fruits fell into the sand.' },
        { t:'அவ்வையார் மணலை ஊதினார்.',          r:'av-vai-yaar ma-Na-lai oo-thi-naar',         e:'Avvaiyar blew the sand away.' },
        { t:'“சுடுகிறதா?” என்று சிறுவன் கேட்டான்.', r:'su-du-gi-Ra-thaa en-Ru si-Ru-van kaet-taan', e:'“Is it hot, then?” asked the boy.' },
        { t:'அவ்வையார் தலைகுனிந்தார்.',         r:'av-vai-yaar tha-lai-ku-nin-thaar',          e:'Avvaiyar bowed her head.' }
      ],
      moral:{ t:'கற்றது கைமண் அளவு, கல்லாதது உலகளவு.',
              r:'kat-Ra-thu kai-maN a-La-vu, kal-laa-tha-thu u-la-ga-La-vu',
              e:'What I have learned is a handful of sand. What I have not learned is the size of the world.' } }
  ];

  /* ---- ranks, in Tamil, because the reward should be Tamil too ---- */
  var LEVELS = [
    { xp:0,    t:'துவக்கம்',      r:'thu-vak-kam',     e:'Beginning' },
    { xp:150,  t:'மாணவர்',        r:'maa-Na-var',      e:'Student' },
    { xp:400,  t:'வாசகர்',        r:'vaa-sa-gar',      e:'Reader' },
    { xp:850,  t:'அறிஞர்',        r:'a-Ri-gnar',       e:'Scholar' },
    { xp:1500, t:'புலவர்',        r:'pu-la-var',       e:'Poet' },
    { xp:2400, t:'கவிஞர்',        r:'ka-vi-gnar',      e:'Bard' },
    { xp:3600, t:'தமிழ்ச் சுடர்', r:'tha-mizh chu-dar', e:'Flame of Tamil' }
  ];

  function fable(id){ for (var i=0;i<FABLES.length;i++) if (FABLES[i].id===id) return FABLES[i]; return null; }
  function aathiFor(v){ for (var i=0;i<AATHICHUDI.length;i++) if (AATHICHUDI[i].v===v) return AATHICHUDI[i]; return null; }
  function levelFor(xp){
    var i = 0;
    for (var k=0;k<LEVELS.length;k++) if (xp >= LEVELS[k].xp) i = k;
    return i;
  }

  return {
    AATHICHUDI:AATHICHUDI, KURALS:KURALS, FABLES:FABLES, LEVELS:LEVELS,
    fable:fable, aathiFor:aathiFor, levelFor:levelFor
  };
})();
