# TAKADIMI — Project Context

This document provides full context for any AI assistant (Claude Code, Cursor, etc.) working on this project. Read it before making any changes.

---

## What This Project Is

TAKADIMI is a web-based rhythm practice tool that teaches musical rhythm using a syllable system:

| Syllable | Position | Subdivision |
|----------|----------|-------------|
| **ta** | Beat 1 (downbeat) | Straight 16th slot 1 |
| **ka** | "e" | Straight 16th slot 2 |
| **di** | "and" | Straight 16th slot 3 |
| **mi** | "a" | Straight 16th slot 4 |
| **ta** | Triplet downbeat | Triplet slot 1 |
| **ki** | Triplet 2nd | Triplet slot 2 |
| **da** | Triplet 3rd | Triplet slot 3 |

Students select or build rhythm patterns, set a tempo, and hear the syllables played back with accurate timing while a visual indicator highlights each cell on a beat grid.

---

## Repositories

| Repo | URL | Purpose |
|------|-----|---------|
| Web app | https://github.com/thinkfast37/takadimi_app | The practice web UI (this repo) |
| Video scripts | https://github.com/thinkfast37/takadimi_project | Python scripts for generating practice videos |

The web app is hosted on GitHub Pages. The single deployable file is `index.html`.

---

## Web App — File Structure

The entire web application is a **single file: `index.html`**. There is no build process, no backend, no dependencies except Google Fonts. It runs entirely in the browser.

### Sections inside index.html (in order):

1. **`<head>`** — Google Fonts imports (Bebas Neue, JetBrains Mono, DM Sans)
2. **`<style>`** — All CSS, organized with section comments
3. **`<body>`** — Two-panel layout: sidebar + main panel
4. **`<script>`** — All JavaScript, organized with section comments

---

## Architecture

### CSS Design System
- **Theme**: Dark hardware sequencer aesthetic — near-black backgrounds, amber (#f0a020) as primary accent
- **CSS Variables**: All colors, fonts, spacing defined as `--var-name` in `:root`
- **Fonts**: Bebas Neue (display/branding), JetBrains Mono (grid/syllables), DM Sans (UI)
- **Breakpoint**: `767px` — below this is mobile layout
- **Mobile**: Sidebar becomes a fixed drawer, hidden by default, opens via hamburger button. On page load, sidebar auto-opens on mobile.

### JavaScript Sections
1. **PATTERN DATA** — The `PATTERNS` array (the entire pattern library)
2. **AUDIO ENGINE** — Web Audio API synthesizer + lookahead scheduler
3. **UI STATE** — Selected pattern, BPM, search query, category filter
4. **EVENT BINDING** — All DOM event listeners
5. **AD HOC MODE** — Ad hoc grid state, rendering, mode switching

---

## Pattern Data Format

Each pattern is an object in the `PATTERNS` array:

```javascript
{
  name: "Pattern Name",           // Display name
  cat:  "Category Name",          // Used for sidebar category filter
  disp: "ta | ta·di | ta",       // Human-readable description (short)
  ts:   "4/4",                   // Time signature (numerator determines beats per measure)
  beats: [                       // Array of beat objects
    S(ta, _, di, _),             // Straight beat: 4 slots (ta/ka/di/mi), _ = null = rest
    T(ta, _, da),                // Triplet beat: 3 slots (ta/ki/da)
  ]
}
```

### Helper shorthands (defined at top of PATTERNS section):
```javascript
const _ = null;
const ta='ta', ka='ka', di='di', mi='mi', ki='ki', da='da';
const S = (...s) => ({ type:'S', slots:[...s] }); // straight, 4 slots
const T = (...s) => ({ type:'T', slots:[...s] }); // triplet, 3 slots
```

### Multi-measure patterns
For patterns longer than one measure, just add more beat objects. The grid renderer automatically divides by the time signature numerator to determine measure boundaries:
```javascript
beats: [
  S(ta,_,_,_), S(_,_,di,_), S(ta,_,_,_), S(ta,_,di,_),  // M1
  S(ta,_,_,_), S(_,_,di,_), S(ta,_,_,_), S(ta,_,di,mi), // M2
]
```

---

## Pattern Categories

| Category | Description |
|----------|-------------|
| 1-Beat Straight | Single beat, 16th-note subdivisions |
| 2-Beat Straight | Two beats, 16th-note subdivisions |
| 1-Measure Straight | Full 4/4 measure, straight |
| 2-Measure Straight | Two-bar phrases, straight |
| 1-Beat Triplet | Single beat, triplet subdivisions |
| 2-Beat Triplet | Two beats, triplet subdivisions |
| 1-Measure Triplet | Full measure, triplet subdivisions |
| Mixed Feel | Patterns combining straight and triplet beats |
| Odd Meter | 3/4, 5/4, 7/4 patterns |
| Song Signatures | Named grooves from specific songs |

---

## Song Signatures — Critical Design Rule

**Song Signatures must capture the rhythmic groove of the primary melodic/harmonic instrument** (guitar, bass, piano, strings, synth) — **never the drum pattern**.

The name IS the practice cue. Students recognise songs by their instrumental hook, not the drumbeat.

When adding or correcting Song Signatures:
- Identify the most iconic instrumental groove in the song
- Transcribe only that groove using takadimi notation
- Use the pattern name as written (e.g. "Viva La Vida", not "Viva La Vida Strings")
- A song may have multiple grooves (intro, verse, chorus) — add each as a separate pattern with a suffix: `"Paradise — Intro"`, `"Paradise — Verse"`
- If a song's groove cannot be accurately represented in this system, omit it

### Takadimi Transcription Format
When the owner transcribes a pattern, they use this shorthand (one beat per group):

```
ta       = slot 1 only     → S(ta,_,_,_)
ta di    = slots 1 & 3     → S(ta,_,di,_)
ta ka di = slots 1, 2, 3   → S(ta,ka,di,_)
ta di mi = slots 1, 3, 4   → S(ta,_,di,mi)
ta mi    = slots 1 & 4     → S(ta,_,_,mi)
di       = slot 3 only     → S(_,_,di,_)
(blank)  = all rests       → S(_,_,_,_)
```

For triplet beats (12/8 feel):
```
ta       = T(ta,_,_)
ta da    = T(ta,_,da)
da       = T(_,_,da)
ta ki da = T(ta,ki,da)
```

---

## Audio Engine

- Uses **Web Audio API** exclusively — no audio files, all sounds synthesized in real-time
- **Lookahead scheduler**: checks every 25ms, schedules 100ms ahead using `AudioContext.currentTime` for sample-accurate timing (not setTimeout alone, which drifts)
- Each syllable has a distinct synthesized tone (sine wave oscillator with frequency glide and amplitude envelope)
- Beat click is a 1100Hz square wave (short, sharp)
- **iOS unlock**: A silent buffer is played on first `touchstart` to unlock AudioContext on iOS Safari. `unlockAudio()` is also called synchronously in the play button click handler.
- Metronome click can be toggled on/off independently of syllables
- Count-in (one measure of clicks before playback) is optional

### Syllable frequencies:
| Syllable | Frequency | Character |
|----------|-----------|-----------|
| ta | 220Hz | Warm, anchoring |
| ka | 680Hz | Bright, high |
| di | 370Hz | Mid, clear |
| mi | 290Hz | Soft, low-mid |
| ki | 620Hz | Bright (triplet) |
| da | 240Hz | Warm (triplet) |

---

## UI Layout

```
┌─────────────────┬──────────────────────────────────────┐
│   SIDEBAR       │   MAIN PANEL                         │
│                 │                                      │
│  [Library|AdHoc]│  Pattern name (or "My Rhythm")       │
│                 │  Category badge | Time sig badge     │
│  [Library mode] │  Pattern description (or &nbsp;)     │
│  Search input   │                                      │
│  Category pills │  Tempo slider + BPM presets          │
│  Pattern list   │  Options (metronome, count-in)       │
│                 │                                      │
│  [Ad Hoc mode]  │  [PLAY] button + loop counter        │
│  Time sig select│                                      │
│  +Beat +Measure │  Rhythm Grid (library or ad hoc)     │
│  Clear          │  Legend                              │
│  Hint text      │                                      │
│                 │                                      │
│  ☕ Buy coffee  │                                      │
└─────────────────┴──────────────────────────────────────┘
```

**Mobile**: Sidebar is a fixed drawer (85% width, max 320px), hidden off-screen, opened by hamburger button in top bar. Auto-opens on page load.

---

## Ad Hoc Mode

Allows students to build custom patterns by clicking cells on an editable grid.

**State**: `adHocBeats` array of `{ type: 'S'|'T', on: [bool...] }`, plus `adHocName` string (default `'My Rhythm'`)

**Key behaviours**:
- All cells start as rests (off) when a beat is created
- Switching a beat between 16th (S) and triplet (T) clears that beat's selections
- Changing time signature resets the entire pattern
- The info block always shows: editable title (default "My Rhythm"), category="Custom", time sig from dropdown
- The rhythm name is editable inline — clicking the name or the ✎ pencil icon activates an input; Enter/blur saves, Escape cancels
- `adHocName` persists across beat/TS changes; Clear resets it to "My Rhythm"
- Loading a saved ad hoc favourite restores that favourite's name
- The ♡ heart button in the main panel saves the rhythm to favourites using the current `adHocName` (no prompt)
- The sidebar "Save to Favourites" button is hidden — the main panel heart replaces it
- This keeps the layout identical to library mode — no jarring shifts when switching modes
- Play is blocked if no cells are selected

---

## Key Decisions & Principles

1. **No layout shift between modes** — the pattern info block (name, badges, description) is always visible and populated in both library and ad hoc modes
2. **Free tempo slider** (40–220 BPM) with 6 preset buttons for the original video tempos (57, 67, 80, 90, 104, 120)
3. **No audio files** — everything synthesized. This keeps the app a single HTML file
4. **Tempo changes during playback** restart playback immediately at the new tempo
5. **Mobile sidebar auto-opens** on page load (width < 768px) since users can't do anything without it
6. **Pattern extensibility** — adding patterns only requires appending to the `PATTERNS` array. No other code changes needed.
7. **Song Signatures correction project** is ongoing — many patterns are being corrected one by one with input from the project owner who transcribes the correct grooves

---

## Donation

Buy Me a Coffee link is embedded in the sidebar footer:
`https://buymeacoffee.com/stevetakadimi`

---

## What NOT to Change Without Discussion

- The audio engine scheduler architecture (lookahead + AudioContext timing)
- The iOS audio unlock strategy (silent buffer on touchstart)
- The overall single-file architecture
- The CSS design system colors/fonts
- The pattern data format (S/T/slots structure)
- Song Signatures patterns — these are being carefully corrected by the owner and should not be auto-generated or modified without explicit instruction

---

## Current Status

- Web app is live on GitHub Pages
- Song Signatures category is actively being corrected (instrument grooves, not drum patterns)
- Video generation scripts exist in a separate repo but YouTube upload is pending (daily limit issues)
- Ad Hoc mode recently added and working
- Mobile layout and iOS audio issues have been fixed

---

## Related Files

| File | Repo | Purpose |
|------|------|---------|
| `index.html` | takadimi_app | The entire web application |
| `patterns.py` | takadimi_project | Pattern definitions for video generation (must stay in sync with index.html patterns) |
| `generate_videos.py` | takadimi_project | Video rendering script |
| `youtube_metadata.csv` | takadimi_project | YouTube upload metadata |

**Important**: When patterns are added or corrected in `index.html`, the same changes must be made to `patterns.py` in the video scripts repo to keep them in sync.
