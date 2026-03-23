'use strict';

// ══════════════════════════════════════════════════════════════════════════════
// SHARED MUTABLE STATE
// Declared with var so they are accessible as globals across all script files.
// ══════════════════════════════════════════════════════════════════════════════
var selectedPattern = null;
var currentBPM      = 80;
var searchQuery     = '';
var activeCategory  = 'All';

// Ad hoc mode state (also used by audio.js for grid targeting)
var adHocMode    = false;
var adHocTs      = '4/4';
var adHocBeats   = [];
var adHocName    = 'My Rhythm';
var loadedFavId  = null; // id of the ad hoc favourite currently loaded, or null

// Combine mode state
var combineMode           = false;
var combineAddedCount     = 0;
var combinePrevMode       = null;    // 'library' | 'adhoc'
var combinePrevPattern    = null;
var combinePendingPattern = null;

// ══════════════════════════════════════════════════════════════════════════════
// COUNTING SYSTEM
// ══════════════════════════════════════════════════════════════════════════════
const COUNTING_KEY = 'takadimi_counting_system';
var countingSystem = localStorage.getItem(COUNTING_KEY) || 'takadimi';

// ══════════════════════════════════════════════════════════════════════════════
// FAVOURITES
// Storage: localStorage (persists per browser; Chrome profile sync not available
// to web pages without a backend — data is local to each browser instance).
// ══════════════════════════════════════════════════════════════════════════════
const FAVORITES_KEY = 'takadimi_favorites';

function loadFavorites() {
  try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'); }
  catch { return []; }
}

function saveFavorites(favs) {
  try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs)); }
  catch (e) { alert('Could not save to favourites — storage may be full or unavailable (e.g. private browsing).'); }
}

function isLibraryFavorite(patternName) {
  return loadFavorites().some(f => f.type === 'library' && f.name === patternName);
}

function toggleLibraryFavorite(pattern) {
  const favs = loadFavorites();
  const idx  = favs.findIndex(f => f.type === 'library' && f.name === pattern.name);
  if (idx >= 0) favs.splice(idx, 1);
  else          favs.push({ type: 'library', name: pattern.name, bpm: currentBPM });
  saveFavorites(favs);
  updateFavoriteIndicator();
  if (activeCategory === '♥') renderPatternList();
}

function saveAdHocFavorite(label, beats, ts) {
  const favs = loadFavorites();
  const id = Date.now().toString();
  favs.push({ type: 'adhoc', id, label, ts, beats: JSON.parse(JSON.stringify(beats)), bpm: currentBPM });
  saveFavorites(favs);
  return id;
}

function updateAdHocFavouriteLabel(id, label) {
  const favs = loadFavorites();
  const fav  = favs.find(f => f.type === 'adhoc' && f.id === id);
  if (fav) { fav.label = label; saveFavorites(favs); renderPatternList(); }
}

function removeAdHocFavorite(id) {
  saveFavorites(loadFavorites().filter(f => !(f.type === 'adhoc' && f.id === id)));
  if (activeCategory === '♥') renderPatternList();
}

// Build a display-ready pattern list including library + ad hoc favourites
function getFavouritePatterns() {
  const favs = loadFavorites();
  const results = [];
  favs.forEach(f => {
    if (f.type === 'library') {
      const p = PATTERNS.find(p => p.name === f.name);
      if (p) results.push(p);
    } else if (f.type === 'adhoc') {
      results.push({
        name:        f.label,
        cat:         'Compose',
        disp:        '',
        ts:          f.ts,
        beats:       adHocBeatsToSlots(f.beats),
        _favId:      f.id,
        _favBeats:   f.beats,  // original adHocBeats-format, for loading back
        _isFavAdHoc: true,
        _favBpm:     f.bpm || 80,
      });
    }
  });
  return results.sort((a, b) => getRating(patternRatingKey(b)) - getRating(patternRatingKey(a)));
}

// ══════════════════════════════════════════════════════════════════════════════
// RATINGS
// Stored as { key: stars } where key = 'lib:PatternName' or 'adhoc:favId'
// ══════════════════════════════════════════════════════════════════════════════
const RATINGS_KEY = 'takadimi_ratings';

function loadRatings() {
  try { return JSON.parse(localStorage.getItem(RATINGS_KEY) || '{}'); }
  catch { return {}; }
}

function saveRatings(ratings) {
  try { localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings)); }
  catch {}
}

function getRating(key) {
  return loadRatings()[key] || 0;
}

function setRating(key, stars) {
  const ratings = loadRatings();
  if (stars === 0) delete ratings[key];
  else ratings[key] = stars;
  saveRatings(ratings);
}

// Returns the localStorage key for rating a given pattern object
function patternRatingKey(p) {
  if (p._isFavAdHoc) return 'adhoc:' + p._favId;
  return 'lib:' + p.name;
}

// ── CATEGORIES ────────────────────────────────────────────────────────────
function getCategories() {
  const seen = new Set();
  PATTERNS.forEach(p => seen.add(p.cat));
  return ['All', '♥', ...seen];
}

// ── FILTERED PATTERNS ─────────────────────────────────────────────────────
function getFiltered() {
  if (activeCategory === '♥') return getFavouritePatterns();
  const q = searchQuery.toLowerCase().trim();
  return PATTERNS.filter(p => {
    const catMatch = activeCategory === 'All' || p.cat === activeCategory;
    if (!catMatch) return false;
    if (!q) return true;
    return p.name.toLowerCase().includes(q) ||
           p.cat.toLowerCase().includes(q) ||
           p.disp.toLowerCase().includes(q);
  }).sort((a, b) => getRating(patternRatingKey(b)) - getRating(patternRatingKey(a)));
}

// ── MEASURES PER PATTERN ──────────────────────────────────────────────────
function beatsPerMeasure(ts) {
  return parseInt(ts.split('/')[0]);
}
