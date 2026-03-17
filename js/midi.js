'use strict';

// ══════════════════════════════════════════════════════════════════════════════
// MIDI FILE BUILDER
// ══════════════════════════════════════════════════════════════════════════════

function buildMidi(pattern, bpm) {
  const PPQ            = 480;
  const NOTE_DUR       = 60;   // ticks — short, percussive
  const STRAIGHT_TICKS = 120;  // ticks per straight slot (4 × 120 = 480 = 1 beat)
  const TRIPLET_TICKS  = 160;  // ticks per triplet slot  (3 × 160 = 480 = 1 beat)
  const CH             = 9;    // MIDI channel 10 (0-indexed = 9), GM percussion

  const NOTE_MAP = { ta:36, ka:42, di:38, mi:46, ki:42, da:37 };
  const VEL_MAP  = { ta:100, ka:80, di:100, mi:80, ki:80, da:80 };

  const usPerBeat = Math.round(60000000 / bpm);

  // Collect note-on / note-off events with absolute tick positions
  const events = [];
  let tick = 0;
  pattern.beats.forEach(beat => {
    const slotTicks = beat.type === 'S' ? STRAIGHT_TICKS : TRIPLET_TICKS;
    beat.slots.forEach((syl, i) => {
      if (syl && NOTE_MAP[syl] !== undefined) {
        const t    = tick + i * slotTicks;
        const note = NOTE_MAP[syl];
        const vel  = VEL_MAP[syl];
        events.push({ t, msg: [0x90 | CH, note, vel] });
        events.push({ t: t + NOTE_DUR, msg: [0x80 | CH, note, 0] });
      }
    });
    tick += beat.slots.length * slotTicks;
  });

  // Sort by tick; note-off before note-on at the same tick
  events.sort((a, b) => a.t - b.t || (a.msg[0] & 0xF0) - (b.msg[0] & 0xF0));

  // Variable-length quantity encoder
  function vlq(n) {
    if (n === 0) return [0];
    const out = [];
    out.unshift(n & 0x7F);
    n >>>= 7;
    while (n > 0) { out.unshift((n & 0x7F) | 0x80); n >>>= 7; }
    return out;
  }

  // Build track bytes
  const track = [];
  // Tempo meta event at tick 0
  track.push(0x00, 0xFF, 0x51, 0x03,
    (usPerBeat >>> 16) & 0xFF, (usPerBeat >>> 8) & 0xFF, usPerBeat & 0xFF);

  let prev = 0;
  events.forEach(ev => {
    track.push(...vlq(ev.t - prev), ...ev.msg);
    prev = ev.t;
  });

  // End of track
  track.push(0x00, 0xFF, 0x2F, 0x00);

  // Assemble full MIDI file
  const tLen = track.length;
  const file = [
    // MThd
    0x4D,0x54,0x68,0x64, 0x00,0x00,0x00,0x06,
    0x00,0x00,           // format 0
    0x00,0x01,           // 1 track
    (PPQ >>> 8) & 0xFF, PPQ & 0xFF,
    // MTrk
    0x4D,0x54,0x72,0x6B,
    (tLen >>> 24)&0xFF, (tLen >>> 16)&0xFF, (tLen >>> 8)&0xFF, tLen&0xFF,
    ...track,
  ];
  return new Uint8Array(file);
}

function downloadMidi() {
  let pattern, filename;
  if (adHocMode) {
    const hasAny = adHocBeats.some(b => b.on.some(Boolean));
    if (!hasAny) return;
    pattern  = adhocToPattern();
    filename = (adHocName || 'my_rhythm').toLowerCase().replace(/[^a-z0-9]+/g, '_') + '_' + currentBPM + 'bpm.mid';
  } else {
    if (!selectedPattern) return;
    pattern  = selectedPattern;
    filename = selectedPattern.name.toLowerCase().replace(/[^a-z0-9]+/g, '_') + '_' + currentBPM + 'bpm.mid';
  }
  const data = buildMidi(pattern, currentBPM);
  const blob = new Blob([data], { type: 'audio/midi' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
