'use strict';

// ══════════════════════════════════════════════════════════════════════════════
// PATTERN DATA
// ══════════════════════════════════════════════════════════════════════════════
// Compact helpers
const _ = null;
const ta='ta', ka='ka', di='di', mi='mi', ki='ki', da='da';
const S = (...s) => ({ type:'S', slots:[...s] }); // straight 4 slots
const T = (...s) => ({ type:'T', slots:[...s] }); // triplet 3 slots

// Syllable name arrays used by ad hoc mode and favorites
const STRAIGHT_SYLS = ['ta', 'ka', 'di', 'mi'];
const TRIPLET_SYLS  = ['ta', 'ki', 'da'];

// Convert stored adHocBeats format ({ type, on[] }) to pattern beats format ({ type, slots[] })
function adHocBeatsToSlots(storedBeats) {
  return storedBeats.map(b => {
    const syls  = b.type === 'S' ? STRAIGHT_SYLS : TRIPLET_SYLS;
    const slots = b.on.map((on, i) => on ? syls[i] : null);
    return { type: b.type, slots };
  });
}

const PATTERNS = [

  // ── 1-BEAT STRAIGHT ───────────────────────────────────────────────────
  {name:"Quarter Note",            cat:"1-Beat Straight",    disp:"Ta",           ts:"4/4", bpm:80, beats:[S(ta,_,_,_)]},
  {name:"Two 8th Notes",           cat:"1-Beat Straight",    disp:"Ta · Di ·",    ts:"4/4", bpm:80, beats:[S(ta,_,di,_)]},
  {name:"Four 16th Notes",         cat:"1-Beat Straight",    disp:"Ta-ka-Di-mi",  ts:"4/4", bpm:80, beats:[S(ta,ka,di,mi)]},
  {name:"Gallop",                  cat:"1-Beat Straight",    disp:"Ta · · mi",    ts:"4/4", bpm:80, beats:[S(ta,_,_,mi)]},
  {name:"Reverse Gallop",          cat:"1-Beat Straight",    disp:"Ta-ka · ·",    ts:"4/4", bpm:80, beats:[S(ta,ka,_,_)]},
  {name:"8th + Two 16ths",         cat:"1-Beat Straight",    disp:"Ta · Di-mi",   ts:"4/4", bpm:80, beats:[S(ta,_,di,mi)]},
  {name:"Three 16ths + Rest",      cat:"1-Beat Straight",    disp:"Ta-ka-Di ·",   ts:"4/4", bpm:80, beats:[S(ta,ka,di,_)]},
  {name:"Funky Syncopation",       cat:"1-Beat Straight",    disp:"Ta-ka · mi",   ts:"4/4", bpm:80, beats:[S(ta,ka,_,mi)]},

  // ── 2-BEAT STRAIGHT ───────────────────────────────────────────────────
  {name:"Dotted Quarter + 8th",    cat:"2-Beat Straight",    disp:"Ta (hold) Di ·",     ts:"4/4", bpm:80, beats:[S(ta,_,_,_), S(_,_,di,_)]},
  {name:"8th-8th-Quarter",         cat:"2-Beat Straight",    disp:"Ta · Di ·  Ta",      ts:"4/4", bpm:80, beats:[S(ta,_,di,_), S(ta,_,_,_)]},
  {name:"Quarter + Two 8ths",      cat:"2-Beat Straight",    disp:"Ta  | Ta · Di ·",    ts:"4/4", bpm:80, beats:[S(ta,_,_,_), S(ta,_,di,_)]},
  {name:"Habanera",                cat:"2-Beat Straight",    disp:"Ta · · mi  Ta",      ts:"4/4", bpm:80, beats:[S(ta,_,_,mi), S(ta,_,_,_)]},
  {name:"Offbeat 8ths",            cat:"2-Beat Straight",    disp:"· ka · ·  · ka · ·", ts:"4/4", bpm:80, beats:[S(_,ka,_,_), S(_,ka,_,_)]},
  {name:"Cross Syncopation",       cat:"2-Beat Straight",    disp:"Ta · Di ·  · ka · ·",ts:"4/4", bpm:80, beats:[S(ta,_,di,_), S(_,ka,_,_)]},
  {name:"Mini-Tresillo",           cat:"2-Beat Straight",    disp:"Ta · · mi · · Di ·", ts:"4/4", bpm:80, beats:[S(ta,_,_,mi), S(_,_,di,_)]},
  {name:"Tumbling Landing",        cat:"2-Beat Straight",    disp:"Ta · Di-mi  Ta",     ts:"4/4", bpm:80, beats:[S(ta,_,di,mi), S(ta,_,_,_)]},

  // ── 1-MEASURE STRAIGHT ────────────────────────────────────────────────
  {name:"Tresillo",                cat:"1-Measure Straight", disp:"Ta · · · | ·Di · | · | Ta",  ts:"4/4", bpm:80, beats:[S(ta,_,_,_),S(_,_,di,_),S(_,_,_,_),S(ta,_,_,_)]},
  {name:"Anticipated Beat 3",      cat:"1-Measure Straight", disp:"Ta·Di · ka · · Ta · · Ta",  ts:"4/4", bpm:80, beats:[S(ta,_,di,_),S(_,ka,_,_),S(ta,_,_,_),S(ta,_,_,_)]},
  {name:"And of 4 Push",           cat:"1-Measure Straight", disp:"8ths × 3 | Ta · Di-mi",     ts:"4/4", bpm:80, beats:[S(ta,_,di,_),S(ta,_,di,_),S(ta,_,di,_),S(ta,_,di,mi)]},
  {name:"Rumba Clave 3-side",      cat:"1-Measure Straight", disp:"Ta · · · | ·Di | · | ··Di·",ts:"4/4", bpm:80, beats:[S(ta,_,_,_),S(_,_,di,_),S(_,_,_,_),S(_,_,di,_)]},
  {name:"Bossa Nova",              cat:"1-Measure Straight", disp:"Ta·Di · · · Ta·Di · Ta",    ts:"4/4", bpm:80, beats:[S(ta,_,di,_),S(_,_,_,_),S(ta,_,di,_),S(ta,_,_,_)]},

  // ── 2-MEASURE STRAIGHT ────────────────────────────────────────────────
  {name:"Son Clave 3-2",           cat:"2-Measure Straight", disp:"Tresillo | 2-side",          ts:"4/4", bpm:80,
   beats:[S(ta,_,_,_),S(_,_,di,_),S(_,_,_,_),S(ta,_,_,_),S(_,_,_,_),S(_,_,_,_),S(ta,_,_,_),S(_,_,di,_)]},
  {name:"Son Clave 2-3",           cat:"2-Measure Straight", disp:"2-side | Tresillo",          ts:"4/4", bpm:80,
   beats:[S(_,_,_,_),S(_,_,_,_),S(ta,_,_,_),S(_,_,di,_),S(ta,_,_,_),S(_,_,di,_),S(_,_,_,_),S(ta,_,_,_)]},
  {name:"Rumba Clave 3-2",         cat:"2-Measure Straight", disp:"Shifted tresillo | 2-side",  ts:"4/4", bpm:80,
   beats:[S(ta,_,_,_),S(_,_,di,_),S(_,_,_,_),S(_,_,di,_),S(_,_,_,_),S(_,_,_,_),S(ta,_,_,_),S(_,_,di,_)]},
  {name:"2-Bar Pop Phrase",        cat:"2-Measure Straight", disp:"8ths resolving | 8ths + push",ts:"4/4", bpm:80,
   beats:[S(ta,_,di,_),S(ta,_,di,_),S(ta,_,di,_),S(ta,_,_,_),S(ta,_,di,_),S(ta,_,di,_),S(ta,_,di,_),S(ta,_,di,mi)]},
  {name:"2-Bar R&B Phrase",        cat:"2-Measure Straight", disp:"Push bar | Resolving bar",    ts:"4/4", bpm:80,
   beats:[S(ta,_,_,_),S(ta,_,di,_),S(ta,_,_,_),S(ta,_,di,mi),S(ta,_,di,_),S(ta,_,_,_),S(ta,_,di,_),S(ta,_,_,_)]},
  {name:"Extended Tresillo",       cat:"2-Measure Straight", disp:"Tresillo | Tresillo no 3rd", ts:"4/4", bpm:80,
   beats:[S(ta,_,_,_),S(_,_,di,_),S(_,_,_,_),S(ta,_,_,_),S(ta,_,_,_),S(_,_,di,_),S(_,_,_,_),S(_,_,_,_)]},
  {name:"Blue Monday Stutter",     cat:"2-Measure Straight", disp:"Ta-ka · mi · ka · · (×2)",   ts:"4/4", bpm:80,
   beats:[S(ta,ka,_,mi),S(_,ka,_,_),S(ta,ka,_,mi),S(ta,_,_,_),S(ta,ka,_,mi),S(_,ka,_,_),S(ta,ka,_,mi),S(ta,_,_,_)]},

  // ── 1-BEAT TRIPLET ────────────────────────────────────────────────────
  {name:"Full Triplet",            cat:"1-Beat Triplet",     disp:"Ta-ki-da",     ts:"4/4", bpm:80, beats:[T(ta,ki,da)]},
  {name:"Shuffle Beat",            cat:"1-Beat Triplet",     disp:"Ta · da",      ts:"4/4", bpm:80, beats:[T(ta,_,da)]},
  {name:"Triplet Downbeat Only",   cat:"1-Beat Triplet",     disp:"Ta · ·",       ts:"4/4", bpm:80, beats:[T(ta,_,_)]},
  {name:"Triplet Middle + Up",     cat:"1-Beat Triplet",     disp:"· ki-da",      ts:"4/4", bpm:80, beats:[T(_,ki,da)]},
  {name:"Triplet Upbeat Only",     cat:"1-Beat Triplet",     disp:"· · da",       ts:"4/4", bpm:80, beats:[T(_,_,da)]},
  {name:"Triplet Down + Middle",   cat:"1-Beat Triplet",     disp:"Ta-ki ·",      ts:"4/4", bpm:80, beats:[T(ta,ki,_)]},

  // ── 2-BEAT TRIPLET ────────────────────────────────────────────────────
  {name:"Slow Blues Landing",      cat:"2-Beat Triplet",     disp:"Ta·da Ta",     ts:"4/4", bpm:80, beats:[T(ta,_,da),T(ta,_,_)]},

  // ── 1-MEASURE TRIPLET ─────────────────────────────────────────────────
  {name:"Gospel Shout Groove",     cat:"1-Measure Triplet",  disp:"Shuffle×2 | Ta-ki-da | Ta",ts:"4/4", bpm:80, beats:[T(ta,_,da),T(ta,_,da),T(ta,ki,da),T(ta,_,_)]},
  {name:"Quarter Note Triplet",    cat:"1-Measure Triplet",  disp:"3 evenly spaced over 4 beats",ts:"4/4", bpm:80, beats:[T(ta,_,_),T(_,_,da),T(_,_,_),T(ta,_,_)]},
  {name:"Afrobeat Triplet Clave",  cat:"1-Measure Triplet",  disp:"Ta·da Ta | Ta·da Ta·da",ts:"4/4", bpm:80, beats:[T(ta,_,da),T(ta,_,_),T(ta,_,da),T(ta,_,da)]},
  {name:"Slow Blues Measure",      cat:"1-Measure Triplet",  disp:"Shuffle × 3 | Ta",ts:"4/4", bpm:80, beats:[T(ta,_,da),T(ta,_,da),T(ta,_,da),T(ta,_,_)]},

  // ── MIXED FEEL ────────────────────────────────────────────────────────
  {name:"Swung 16ths",             cat:"Mixed Feel", disp:"16ths → Shuffle",      ts:"4/4", bpm:80, beats:[S(ta,ka,di,mi),S(ta,ka,di,mi),T(ta,_,da),T(ta,_,da)]},
  {name:"Triplet Stumble into Straight",cat:"Mixed Feel",disp:"Ta·da | 16ths ×3", ts:"4/4", bpm:80, beats:[T(ta,_,da),S(ta,ka,di,mi),S(ta,ka,di,mi),S(ta,ka,di,mi)]},
  {name:"Straight then Triplet Ending",cat:"Mixed Feel",disp:"8ths ×3 | Ta·da",   ts:"4/4", bpm:80, beats:[S(ta,_,di,_),S(ta,_,di,_),S(ta,_,di,_),T(ta,_,da)]},
  {name:"Afrobeat Hybrid",         cat:"Mixed Feel", disp:"8th×2 | Shuffle×2",    ts:"4/4", bpm:80, beats:[S(ta,_,di,_),S(ta,_,di,_),T(ta,_,da),T(ta,_,da)]},
  {name:"Shuffle Pickup into Straight",cat:"Mixed Feel",disp:"· · da | 16ths ×3", ts:"4/4", bpm:80, beats:[T(_,_,da),S(ta,ka,di,mi),S(ta,ka,di,mi),S(ta,ka,di,mi)]},
  {name:"Half-Measure Switch",     cat:"Mixed Feel", disp:"16th bar | Shuffle bar",ts:"4/4", bpm:80,
   beats:[S(ta,ka,di,mi),S(ta,ka,di,mi),S(ta,ka,di,mi),S(ta,ka,di,mi),T(ta,_,da),T(ta,_,da),T(ta,_,da),T(ta,_,da)]},
  {name:"Offbeat Landing",         cat:"Mixed Feel", disp:"· ka ×2 | · ki-da | · ka",ts:"4/4", bpm:80, beats:[S(_,ka,_,_),S(_,ka,_,_),T(_,ki,da),S(_,ka,_,_)]},

  // ── ODD METER — 3/4 ───────────────────────────────────────────────────
  {name:"Waltz Quarter Notes",     cat:"Odd Meter",  disp:"Ta | Ta | Ta",         ts:"3/4", bpm:80, beats:[S(ta,_,_,_),S(ta,_,_,_),S(ta,_,_,_)]},
  {name:"Waltz 8th Notes",         cat:"Odd Meter",  disp:"Ta-Di × 3",            ts:"3/4", bpm:80, beats:[S(ta,_,di,_),S(ta,_,di,_),S(ta,_,di,_)]},
  {name:"Waltz with 16th Run",     cat:"Odd Meter",  disp:"Ta | Ta | Ta-ka-Di-mi",ts:"3/4", bpm:80, beats:[S(ta,_,_,_),S(ta,_,_,_),S(ta,ka,di,mi)]},
  {name:"Waltz Syncopated",        cat:"Odd Meter",  disp:"Ta·Di-mi | · ka | Ta", ts:"3/4", bpm:80, beats:[S(ta,_,di,mi),S(_,ka,_,_),S(ta,_,_,_)]},

  // ── ODD METER — 5/4 ───────────────────────────────────────────────────
  {name:"Five Four — Five Quarters",cat:"Odd Meter", disp:"Ta × 5",               ts:"5/4", bpm:80, beats:[S(ta,_,_,_),S(ta,_,_,_),S(ta,_,_,_),S(ta,_,_,_),S(ta,_,_,_)]},
  {name:"Five Four — Three Plus Two",cat:"Odd Meter",disp:"[Ta-Di × 2 | Ta] + [Ta-Di | Ta]",ts:"5/4", bpm:80, beats:[S(ta,_,di,_),S(ta,_,di,_),S(ta,_,_,_),S(ta,_,di,_),S(ta,_,_,_)]},
  {name:"Five Four — Two Plus Three",cat:"Odd Meter",disp:"[Ta-Di | Ta] + [Ta-Di × 2 | Ta]",ts:"5/4", bpm:80, beats:[S(ta,_,di,_),S(ta,_,_,_),S(ta,_,di,_),S(ta,_,di,_),S(ta,_,_,_)]},
  {name:"Five Four Sparse",        cat:"Odd Meter",  disp:"Ta · · · Ta · · · · ·",ts:"5/4", bpm:80, beats:[S(ta,_,_,_),S(_,_,_,_),S(_,_,_,_),S(ta,_,_,_),S(_,_,_,_)]},
  {name:"Five Four Syncopated",    cat:"Odd Meter",  disp:"Ta-ka·mi | Ta·Di | ·ka | Ta-Di | Ta",ts:"5/4", bpm:80, beats:[S(ta,ka,_,mi),S(ta,_,di,_),S(_,ka,_,_),S(ta,_,di,_),S(ta,_,_,_)]},

  // ── ODD METER — 7/4 ───────────────────────────────────────────────────
  {name:"Seven Four — Seven Quarters",cat:"Odd Meter",disp:"Ta × 7",              ts:"7/4", bpm:80, beats:[S(ta,_,_,_),S(ta,_,_,_),S(ta,_,_,_),S(ta,_,_,_),S(ta,_,_,_),S(ta,_,_,_),S(ta,_,_,_)]},
  {name:"Seven Four — Four Plus Three",cat:"Odd Meter",disp:"[8ths × 4] + [8ths × 2 | Ta]",ts:"7/4", bpm:80, beats:[S(ta,_,di,_),S(ta,_,di,_),S(ta,_,di,_),S(ta,_,di,_),S(ta,_,di,_),S(ta,_,di,_),S(ta,_,_,_)]},
  {name:"Seven Four — Three Plus Four",cat:"Odd Meter",disp:"[8ths × 2 | Ta] + [8ths × 4]",ts:"7/4", bpm:80, beats:[S(ta,_,di,_),S(ta,_,di,_),S(ta,_,_,_),S(ta,_,di,_),S(ta,_,di,_),S(ta,_,di,_),S(ta,_,di,_)]},
  {name:"Seven Four — Two Plus Two Plus Three",cat:"Odd Meter",disp:"[Ta|Ta|Ta|Ta] + [8ths × 2 | Ta]",ts:"7/4", bpm:80, beats:[S(ta,_,_,_),S(ta,_,_,_),S(ta,_,_,_),S(ta,_,_,_),S(ta,_,di,_),S(ta,_,di,_),S(ta,_,_,_)]},
  {name:"Seven Four Money Feel",   cat:"Odd Meter",  disp:"Ta·Di·Ta | Ta·Di-mi·ka·Ta",ts:"7/4", bpm:80, beats:[S(ta,_,di,_),S(ta,_,_,_),S(_,_,_,_),S(ta,_,di,mi),S(_,ka,_,_),S(_,_,_,_),S(ta,_,_,_)]},

  // ── SONG SIGNATURES ───────────────────────────────────────────────────
  // Coldplay
  {name:"Viva La Vida",            cat:"Song Signatures", disp:"8ths → syncopated and-of-4 (2 bars)",ts:"4/4", bpm:80,
   beats:[S(ta,_,_,_),S(ta,_,_,_),S(ta,_,_,_),S(ta,_,di,_),S(_,_,di,_),S(_,_,di,_),S(ta,_,_,_),S(ta,_,_,_)]},
  {name:"A Sky Full of Stars",     cat:"Song Signatures", disp:"ta··mi | ··di | ··di | ta (×4 bars)", ts:"4/4", bpm:80,
   beats:[
     S(ta,_,_,mi),S(_,_,di,_),S(_,_,di,_),S(ta,_,_,_),   // M1
     S(ta,_,_,mi),S(_,_,di,_),S(_,_,di,_),S(_,_,di,_),   // M2
     S(ta,_,_,mi),S(_,_,di,_),S(_,_,di,_),S(_,_,di,_),   // M3
     S(ta,_,_,mi),S(_,_,di,_),S(_,_,di,_),S(ta,_,di,_),  // M4
   ]},
  {name:"Paradise — Intro",        cat:"Song Signatures", disp:"ta | ··di·mi | ta | [varies] (4 bars)", ts:"4/4", bpm:80,
   beats:[
     S(ta,_,_,_),S(_,_,di,mi),S(ta,_,_,_),S(_,_,_,_),    // M1
     S(ta,_,_,_),S(_,_,di,mi),S(ta,_,_,_),S(ta,_,_,_),   // M2
     S(ta,_,_,_),S(_,_,di,mi),S(ta,_,_,_),S(_,_,_,_),    // M3
     S(ta,_,_,_),S(_,_,di,mi),S(ta,_,_,_),S(ta,_,di,_),  // M4
   ]},
  {name:"Paradise — Verse",        cat:"Song Signatures", disp:"ta·di | ta·ka·di | ··di | ta·di·mi (2 bars)", ts:"4/4", bpm:80,
   beats:[
     S(ta,_,di,_),S(ta,ka,di,_),S(_,_,di,_),S(ta,_,di,mi),  // M1
     S(ta,_,di,_),S(ta,_,di,_), S(_,_,di,_),S(ta,_,di,mi),  // M2
   ]},
  // Depeche Mode
  {name:"Personal Jesus",          cat:"Song Signatures", disp:"12/8: ta | ta·da | ta | ta·da (2 bars)", ts:"4/4", bpm:80,
   beats:[
     T(ta,_,_),T(ta,_,da),T(ta,_,_),T(ta,_,da),  // M1
     T(_,_,da),T(ta,_,da),T(ta,_,_),T(ta,_,da),  // M2
   ]},
  {name:"Enjoy the Silence — Intro", cat:"Song Signatures", disp:"ta | ta·di | taka·di | ta·di (4 bars)", ts:"4/4", bpm:80,
   beats:[
     S(ta,_,_,_),S(ta,_,di,_),S(ta,ka,di,_),S(ta,_,di,_),  // M1
     S(ta,_,_,_),S(ta,_,di,_),S(ta,ka,di,_),S(ta,_,di,_),  // M2
     S(ta,_,_,_),S(ta,_,di,mi),S(ta,_,di,_),S(ta,_,di,_),  // M3
     S(ta,_,_,_),S(ta,_,di,_),S(ta,ka,di,_),S(ta,_,di,_),  // M4
   ]},
  {name:"Enjoy the Silence — Hook", cat:"Song Signatures", disp:"ta | ta·di | ··di | ta", ts:"4/4", bpm:80,
   beats:[S(ta,_,_,_),S(ta,_,di,_),S(_,_,di,_),S(ta,_,_,_)]},
  {name:"Another One Bites the Dust - Queen", cat:"Song Signatures", disp:"", ts:"4/4", bpm:80,
   beats:[S(ta,_,_,_),S(ta,_,_,_),S(ta,_,_,_),S(_,_,_,mi),
          S(ta,_,di,_),S(ta,_,di,mi),S(_,_,_,_),S(_,_,di,mi)]},
  {name:"Seven Nation Army",       cat:"Song Signatures", disp:"", ts:"4/4", bpm:124,
   beats:[
     S(ta,_,_,_),
     S(_,_,di,_),
     S(ta,_,_,mi),
     S(_,_,di,_),
     S(ta,_,_,_),
     S(_,_,_,_),
     S(ta,_,_,_),
     S(_,_,_,_),
   ]},
  {name:"The Less I Know The Better", cat:"Song Signatures", disp:"", ts:"4/4", bpm:118,
   beats:[
     S(ta,_,_,mi),
     S(ta,_,_,_),
     S(ta,ka,_,_),
     S(ta,_,_,_),
     S(ta,_,_,_),
     S(ta,ka,_,_),
     S(ta,ka,di,_),
     S(ta,_,_,_),
   ]}

];
