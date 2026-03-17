'use strict';

// ══════════════════════════════════════════════════════════════════════════════
// AUDIO ENGINE
// ══════════════════════════════════════════════════════════════════════════════
let audioCtx = null;

function ensureAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

// iOS Safari requires AudioContext to be resumed inside a direct user gesture.
// We unlock it on the very first touch/click anywhere on the page.
function unlockAudio() {
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  } else if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    // Play and immediately stop a silent buffer to fully unlock on iOS
    const buf = audioCtx.createBuffer(1, 1, 22050);
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    src.connect(audioCtx.destination);
    src.start(0);
    audioCtx.resume();
  }
}
document.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
document.addEventListener('click',      unlockAudio, { once: true });

// Sound parameters per syllable
const SOUND_PARAMS = {
  ta: { freq:220, amp:0.78, decay:0.14, type:'sine' },
  ka: { freq:680, amp:0.65, decay:0.07, type:'sine' },
  di: { freq:370, amp:0.70, decay:0.10, type:'sine' },
  mi: { freq:290, amp:0.65, decay:0.07, type:'sine' },
  ki: { freq:620, amp:0.65, decay:0.07, type:'sine' },
  da: { freq:240, amp:0.65, decay:0.12, type:'sine' },
};

function playClick(ctx, time, force) {
  // force=true for count-in clicks (always plays regardless of toggle)
  if (!force && !document.getElementById('metronomeCheck')?.checked) return;
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = 1100;
  osc.type = 'square';
  gain.gain.setValueAtTime(0.22, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.025);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + 0.03);
}

function playSyllable(ctx, syllable, time) {
  const p = SOUND_PARAMS[syllable];
  if (!p) return;
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = p.type;
  osc.frequency.setValueAtTime(p.freq, time);
  // slight frequency glide for expressiveness
  osc.frequency.exponentialRampToValueAtTime(p.freq * 0.85, time + p.decay);
  gain.gain.setValueAtTime(0.001, time);
  gain.gain.linearRampToValueAtTime(p.amp, time + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.001, time + p.decay);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + p.decay + 0.01);
}

// ── SCHEDULER ─────────────────────────────────────────────────────────────
const LOOKAHEAD  = 0.1;   // seconds to look ahead
const SCHED_INT  = 25;    // ms between scheduler runs

let schedulerTimer  = null;
let patternEvents   = [];  // flat list of slot events for one loop
let patternDuration = 0;   // total seconds for one loop
let nextEventTime   = 0;   // audioCtx time of next event to schedule
let nextEventIdx    = 0;   // index into patternEvents
let playStartTime   = 0;   // audioCtx time playback began (after count-in)
let isPlaying       = false;
let loopCount       = 0;

// Visual sync
let visualQueue     = [];  // [{audioTime, globalSlotIdx, beatIdx}]
let currentVisSlot  = -1;
let rafId           = null;

// Count-in state
let countInDuration = 0;
let inCountIn       = false;

// ── FLATTEN PATTERN ───────────────────────────────────────────────────────
function flattenPattern(pattern, bpm) {
  const beatDur = 60.0 / bpm;
  const events  = [];
  let t = 0;
  let gsi = 0; // global slot index

  pattern.beats.forEach((beat, beatIdx) => {
    const isTrip = beat.type === 'T';
    const nSlots = isTrip ? 3 : 4;
    const slotDur = beatDur / nSlots;

    beat.slots.forEach((syllable, slotIdx) => {
      events.push({
        time: t,
        beatIdx,
        slotIdx,
        globalSlotIdx: gsi++,
        syllable,
        isDownbeat: slotIdx === 0,
        slotDur,
        nSlots,
        isTrip,
      });
      t += slotDur;
    });
  });

  return { events, totalDuration: t };
}

// ── BUILD COUNT-IN EVENTS ─────────────────────────────────────────────────
function buildCountIn(pattern, bpm) {
  const beatDur = 60.0 / bpm;
  const ts      = parseInt(pattern.ts); // numerator
  const events  = [];
  for (let i = 0; i < ts; i++) {
    events.push({ time: i * beatDur, isClick: true, slotDur: beatDur });
  }
  return { events, totalDuration: ts * beatDur };
}

// ── SCHEDULER LOOP ────────────────────────────────────────────────────────
function scheduler() {
  const ctx = audioCtx;
  if (!ctx || !isPlaying) return;

  // Schedule count-in clicks
  if (inCountIn) {
    // Count-in is already scheduled in start(); no further scheduling needed
    // We'll just wait for it to finish
  }

  const now = ctx.currentTime;
  while (nextEventTime < now + LOOKAHEAD) {
    const ev = patternEvents[nextEventIdx];

    // Schedule audio
    if (ev.isDownbeat) playClick(ctx, nextEventTime, false);
    if (ev.syllable)   playSyllable(ctx, ev.syllable, nextEventTime);

    // Push to visual queue
    visualQueue.push({ audioTime: nextEventTime, globalSlotIdx: ev.globalSlotIdx, beatIdx: ev.beatIdx });

    // Advance
    nextEventTime += ev.slotDur;
    nextEventIdx++;

    // Loop
    if (nextEventIdx >= patternEvents.length) {
      nextEventIdx = 0;
      loopCount++;
      updateLoopCounter();
    }
  }

  schedulerTimer = setTimeout(scheduler, SCHED_INT);
}

// ── VISUAL LOOP ───────────────────────────────────────────────────────────
function visualLoop() {
  if (!isPlaying) return;

  const now = audioCtx ? audioCtx.currentTime : 0;

  // Process visual queue
  let newSlot = currentVisSlot;
  while (visualQueue.length > 0 && visualQueue[0].audioTime <= now) {
    const ev = visualQueue.shift();
    newSlot = ev.globalSlotIdx;
  }

  if (newSlot !== currentVisSlot) {
    updateActiveCell(newSlot);
    currentVisSlot = newSlot;
  }

  rafId = requestAnimationFrame(visualLoop);
}

// ── DOM CELL MANAGEMENT ───────────────────────────────────────────────────
function updateActiveCell(globalSlotIdx) {
  // Remove .active from previously active cell
  document.querySelectorAll('.slot-cell.active').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.beat-num.beat-active').forEach(el => el.classList.remove('beat-active'));

  if (globalSlotIdx < 0) return;

  // adHocMode is declared in state.js, loaded before audio.js
  const gridEl = document.getElementById(adHocMode ? 'adHocGrid' : 'rhythmGrid');
  const cell = gridEl ? gridEl.querySelector(`.slot-cell[data-gsi="${globalSlotIdx}"]`) : null;
  if (cell) {
    cell.classList.add('active');
    // Activate beat number
    const beatIdx = cell.dataset.beatIdx;
    const beatNum = document.querySelector(`.beat-num[data-beat="${beatIdx}"]`);
    if (beatNum) beatNum.classList.add('beat-active');
    // Scroll into view on mobile if needed
    cell.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }
}

function updateLoopCounter() {
  const el = document.getElementById('loopNum');
  if (el) el.textContent = loopCount;
}

// ── START / STOP ──────────────────────────────────────────────────────────
function startPlayback(pattern, bpm, doCountIn) {
  const ctx = ensureAudioCtx();
  stopPlayback(); // clear any prior state

  const flat = flattenPattern(pattern, bpm);
  patternEvents   = flat.events;
  patternDuration = flat.totalDuration;
  nextEventIdx    = 0;
  loopCount       = 0;
  currentVisSlot  = -1;
  visualQueue     = [];

  let startDelay = 0.05; // small buffer before first sound

  if (doCountIn) {
    const ci = buildCountIn(pattern, bpm);
    const ciStart = ctx.currentTime + startDelay;
    // Schedule count-in clicks immediately
    ci.events.forEach(ev => {
      playClick(ctx, ciStart + ev.time, true); // count-in always audible
    });
    startDelay += ci.totalDuration;
    inCountIn = true;
    setTimeout(() => { inCountIn = false; }, ci.totalDuration * 1000 + 50);
  }

  nextEventTime = ctx.currentTime + startDelay;
  isPlaying     = true;
  playStartTime = nextEventTime;

  scheduler();
  rafId = requestAnimationFrame(visualLoop);

  // UI updates
  const playBtn   = document.getElementById('playBtn');
  const playIcon  = document.getElementById('playIcon');
  const playLabel = document.getElementById('playLabel');
  const loopCtr   = document.getElementById('loopCounter');
  if (playBtn)   { playBtn.classList.add('playing'); }
  if (playIcon)  { playIcon.textContent = '■'; }
  if (playLabel) { playLabel.textContent = 'STOP'; }
  if (loopCtr)   { loopCtr.style.display = 'flex'; }
  updateLoopCounter();
}

function stopPlayback() {
  isPlaying = false;

  clearTimeout(schedulerTimer);
  schedulerTimer = null;

  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }

  visualQueue    = [];
  currentVisSlot = -1;

  // Clear highlights
  document.querySelectorAll('.slot-cell.active').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.beat-num.beat-active').forEach(el => el.classList.remove('beat-active'));

  // UI updates
  const playBtn   = document.getElementById('playBtn');
  const playIcon  = document.getElementById('playIcon');
  const playLabel = document.getElementById('playLabel');
  const loopCtr   = document.getElementById('loopCounter');
  if (playBtn)   { playBtn.classList.remove('playing'); }
  if (playIcon)  { playIcon.textContent = '▶'; }
  if (playLabel) { playLabel.textContent = 'PLAY'; }
  if (loopCtr)   { loopCtr.style.display = 'none'; }
}
