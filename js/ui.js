'use strict';

// ══════════════════════════════════════════════════════════════════════════════
// UI — RENDERING + CONTROLS
// ══════════════════════════════════════════════════════════════════════════════

// ── COUNTING SYSTEM HELPERS ────────────────────────────────────────────────
// Returns the display label for a slot based on the active counting system.
// beatType: 'S' (straight 16th) or 'T' (triplet)
// slotIdx:  0-3 for S, 0-2 for T
// beatNum:  1-based beat number within the measure (used for 'and-a' system)
function getSylLabel(beatType, slotIdx, beatNum) {
  if (countingSystem === 'takadimi') {
    return beatType === 'S' ? STRAIGHT_SYLS[slotIdx] : TRIPLET_SYLS[slotIdx];
  }
  // 'and-a' system
  if (beatType === 'S') return [String(beatNum), 'e', '&', 'a'][slotIdx];
  return [String(beatNum), '&', 'a'][slotIdx];
}

// Generates a short readable description of a pattern using the active
// counting system.  Any non-null slot is "active"; display label from getSylLabel.
function buildDisp(pattern) {
  if (!pattern || !pattern.beats || !pattern.beats.length) return '';
  const bpMeasure = beatsPerMeasure(pattern.ts);
  return pattern.beats.map((beat, beatIdx) => {
    const beatNum = (beatIdx % bpMeasure) + 1;
    const active  = beat.slots
      .map((syl, si) => (syl !== null ? getSylLabel(beat.type, si, beatNum) : null))
      .filter(Boolean);
    return active.length ? active.join('·') : '—';
  }).join(' | ');
}

// ── RENDER PATTERN LIST ───────────────────────────────────────────────────
function renderPatternList() {
  const filtered = getFiltered();
  const listEl   = document.getElementById('patternList');
  const countEl  = document.getElementById('patternCount');

  countEl.textContent = `${filtered.length} pattern${filtered.length !== 1 ? 's' : ''}`;

  if (filtered.length === 0) {
    listEl.innerHTML = '<div class="no-results">No patterns found</div>';
    return;
  }

  listEl.innerHTML = filtered.map((p) => {
    const nBeats = p.beats.length;
    const rating = getRating(patternRatingKey(p));
    const starsHtml = rating > 0 ? `<span class="p-rating">${'★'.repeat(rating)}</span>` : '';
    if (p._isFavAdHoc) {
      return `
        <div class="pattern-item" data-fav-id="${p._favId}" role="button" tabindex="0"
             style="flex-direction:row;align-items:center;padding-right:8px;gap:0">
          <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px">
            <div class="pattern-item-name">${p.name}</div>
            <div class="pattern-item-meta">
              <span class="p-cat">Ad Hoc</span>
              <span class="p-ts">${p.ts}</span>
              <span class="p-hits">${nBeats} beat${nBeats !== 1 ? 's' : ''}</span>
              ${starsHtml}
            </div>
          </div>
        </div>`;
    }
    const idx    = PATTERNS.indexOf(p);
    const isSelc = selectedPattern === p;
    return `
      <div class="pattern-item${isSelc ? ' selected' : ''}" data-idx="${idx}" role="button" tabindex="0">
        <div class="pattern-item-name">${p.name}</div>
        <div class="pattern-item-meta">
          <span class="p-cat">${p.cat}</span>
          <span class="p-ts">${p.ts}</span>
          <span class="p-hits">${nBeats} beat${nBeats !== 1 ? 's' : ''}</span>
          ${starsHtml}
        </div>
      </div>`;
  }).join('');

  // Scroll selected item into view
  const selEl = listEl.querySelector('.selected');
  if (selEl) selEl.scrollIntoView({ block: 'nearest' });
}

// ── RENDER CATEGORY FILTERS ───────────────────────────────────────────────
function renderCategoryFilters() {
  const cats   = getCategories();
  const ctnr   = document.getElementById('catFilters');
  ctnr.innerHTML = cats.map(c =>
    `<button class="cat-btn${activeCategory === c ? ' active' : ''}" data-cat="${c}">${c}</button>`
  ).join('');
}

// ── LEGEND ────────────────────────────────────────────────────────────────
function renderLegend() {
  const el = document.getElementById('legend');
  if (!el) return;
  const sw = (label, color, borderAlpha, text) =>
    `<div class="legend-item">` +
    `<div class="legend-swatch" style="color:${color};border-color:${borderAlpha};background:var(--surface3)">${label}</div>` +
    `${text}</div>`;
  const rest =
    `<div class="legend-item"><div class="legend-swatch" ` +
    `style="color:var(--text-muted);border-color:var(--border);background:var(--surface2)"> · </div>Rest</div>`;

  if (countingSystem === 'takadimi') {
    el.innerHTML =
      sw('ta',  'var(--c-ta)', 'rgba(240,160,32,0.4)',  'Straight downbeat') +
      sw('ka',  'var(--c-ka)', 'rgba(79,195,247,0.4)',  '16th e (2nd slot)') +
      sw('di',  'var(--c-di)', 'rgba(129,199,132,0.4)', '8th and (3rd slot)') +
      sw('mi',  'var(--c-mi)', 'rgba(206,147,216,0.4)', '16th a (4th slot)') +
      sw('ta',  'var(--c-ta)', 'rgba(240,160,32,0.4)',  'Triplet downbeat') +
      sw('ki',  'var(--c-ki)', 'rgba(77,208,225,0.4)',  'Triplet 2nd') +
      sw('da',  'var(--c-da)', 'rgba(255,183,77,0.4)',  'Triplet 3rd') +
      rest;
  } else {
    el.innerHTML =
      sw('1',   'var(--c-ta)', 'rgba(240,160,32,0.4)',  'Beat (downbeat)') +
      sw('e',   'var(--c-ka)', 'rgba(79,195,247,0.4)',  '16th e — straight only') +
      sw('&amp;','var(--c-di)','rgba(129,199,132,0.4)', '8th note (&amp;)') +
      sw('a',   'var(--c-mi)', 'rgba(206,147,216,0.4)', '16th a / triplet 3rd') +
      sw('&amp;','var(--c-ki)','rgba(77,208,225,0.4)',  'Triplet 2nd') +
      rest;
  }
}

// ── RENDER GRID ───────────────────────────────────────────────────────────
function renderGrid(pattern) {
  const grid = document.getElementById('rhythmGrid');
  if (!pattern) { grid.innerHTML = ''; return; }

  const bpm_per_measure = beatsPerMeasure(pattern.ts);
  const totalBeats      = pattern.beats.length;
  const nMeasures       = Math.ceil(totalBeats / bpm_per_measure);

  let gsi       = 0; // global slot index
  let beatGlobal = 0;
  let html      = '';

  for (let m = 0; m < nMeasures; m++) {
    const mStart = m * bpm_per_measure;
    const mEnd   = Math.min(mStart + bpm_per_measure, totalBeats);
    const beatsInThisMeasure = mEnd - mStart;

    html += `<div class="measure-row">`;
    if (nMeasures > 1) {
      html += `<div class="measure-label">Measure ${m + 1}</div>`;
    }
    html += `<div class="beats-row">`;

    for (let b = 0; b < beatsInThisMeasure; b++) {
      const beatIdx  = mStart + b;
      const beat     = pattern.beats[beatIdx];
      const isTrip   = beat.type === 'T';
      const nSlots   = isTrip ? 3 : 4;
      const beatNum  = beatGlobal + 1;

      html += `<div class="beat-group">`;
      html += `<div class="beat-num" data-beat="${beatIdx}">${beatNum}</div>`;
      html += `<div class="slots-row">`;

      beat.slots.forEach((syl, si) => {
        const hasSyl  = syl !== null;
        const classes = [
          'slot-cell',
          hasSyl ? 'has-syllable' : '',
          isTrip ? 'triplet' : '',
        ].filter(Boolean).join(' ');

        const label   = getSylLabel(beat.type, si, b + 1);
        const display = hasSyl ? label : '·';

        html += `<div class="${classes}" data-gsi="${gsi}" data-beat-idx="${beatIdx}" data-syl="${syl||''}"
                  title="${hasSyl ? label : 'rest'}">${display}</div>`;
        gsi++;
      });

      html += `</div>`; // slots-row
      html += `</div>`; // beat-group

      // Add visual separator between beats (not after the last one in the measure)
      if (b < beatsInThisMeasure - 1) {
        html += `<div class="beat-sep"></div>`;
      }

      beatGlobal++;
    }

    html += `</div>`; // beats-row
    html += `</div>`; // measure-row
  }

  grid.innerHTML = html;
}

// ── STAR RATING INDICATOR ─────────────────────────────────────────────────
function updateStarRating() {
  const el = document.getElementById('starRating');
  if (!el) return;

  let key = null;
  if (!adHocMode && selectedPattern) {
    key = 'lib:' + selectedPattern.name;
  } else if (adHocMode && loadedFavId) {
    key = 'adhoc:' + loadedFavId;
  }

  el.style.display = key ? 'flex' : 'none';
  if (!key) return;

  const rating = getRating(key);
  el.querySelectorAll('.star-btn').forEach(btn => {
    btn.classList.toggle('filled', +btn.dataset.star <= rating);
  });
}

// ── FAVOURITE INDICATOR ────────────────────────────────────────────────────
function updateFavoriteIndicator() {
  updateStarRating();
  const btn = document.getElementById('favBtn');
  if (!btn) return;
  if (adHocMode) {
    btn.style.display = '';
    btn.textContent = loadedFavId ? '♥' : '♡';
    btn.classList.toggle('favorited', !!loadedFavId);
    return;
  }
  if (!selectedPattern) {
    btn.style.display = 'none';
    return;
  }
  btn.style.display = '';
  const isFav = isLibraryFavorite(selectedPattern.name);
  btn.textContent = isFav ? '♥' : '♡';
  btn.classList.toggle('favorited', isFav);
}

// ── PATTERN NAVIGATION ───────────────────────────────────────────────────
// Library-only filtered list used for prev/next navigation
function getNavList() {
  return getFiltered().filter(p => !p._isFavAdHoc);
}

function updateNavButtons() {
  const row     = document.getElementById('patternNavRow');
  const prevBtn = document.getElementById('prevPatternBtn');
  const nextBtn = document.getElementById('nextPatternBtn');
  const posEl   = document.getElementById('patternNavPos');
  if (!row) return;

  if (adHocMode || !selectedPattern) { row.style.display = 'none'; return; }

  const list = getNavList();
  const idx  = list.indexOf(selectedPattern);

  if (idx === -1 || list.length <= 1) { row.style.display = 'none'; return; }

  row.style.display = 'flex';
  prevBtn.disabled  = idx === 0;
  nextBtn.disabled  = idx === list.length - 1;
  posEl.textContent = `${idx + 1} / ${list.length}`;
}

function navigatePattern(dir) {
  if (adHocMode || !selectedPattern) return;
  const list = getNavList();
  const next = list[list.indexOf(selectedPattern) + dir];
  if (next) selectPattern(next);
}

// ── SELECT PATTERN ────────────────────────────────────────────────────────
function selectPattern(pattern) {
  if (isPlaying) stopPlayback();

  selectedPattern = pattern;

  // Apply tempo: use favourite's saved BPM if present, otherwise the pattern's own default
  const libFav = loadFavorites().find(f => f.type === 'library' && f.name === pattern.name);
  setTempo(libFav?.bpm || pattern.tempo);

  // Update info section
  const emptyState  = document.getElementById('emptyState');
  const selectedDiv = document.getElementById('selectedInfo');
  const nameEl      = document.getElementById('selectedName');
  const metaEl      = document.getElementById('selectedMeta');
  const dispEl      = document.getElementById('selectedDisplay');

  emptyState.style.display  = 'none';
  selectedDiv.style.display = 'block';
  nameEl.textContent        = pattern.name;
  metaEl.innerHTML          = `
    <span class="badge badge-cat">${pattern.cat}</span>
    <span class="badge badge-ts">${pattern.ts}</span>`;
  dispEl.textContent = buildDisp(pattern);

  // Show controls + transport + grid
  document.getElementById('controlsRow').style.display  = 'flex';
  document.getElementById('transportRow').style.display = 'flex';
  document.getElementById('gridSection').style.display  = 'block';

  renderGrid(pattern);
  renderPatternList(); // update selected state in list
  updateFavoriteIndicator();
  updateStarRating();
  updateNavButtons();

  // Close sidebar on mobile
  if (window.innerWidth < 768) closeSidebar();
}

// ── TEMPO ─────────────────────────────────────────────────────────────────
let _bpmPersistTimer = null;
function _persistBpmToFav() {
  clearTimeout(_bpmPersistTimer);
  _bpmPersistTimer = setTimeout(() => {
    if (!adHocMode && selectedPattern) {
      const favs = loadFavorites();
      const fav = favs.find(f => f.type === 'library' && f.name === selectedPattern.name);
      if (fav) { fav.bpm = currentBPM; saveFavorites(favs); }
    } else if (adHocMode && loadedFavId) {
      const favs = loadFavorites();
      const fav = favs.find(f => f.type === 'adhoc' && f.id === loadedFavId);
      if (fav) { fav.bpm = currentBPM; saveFavorites(favs); }
    }
  }, 600);
}

function setTempo(bpm) {
  bpm = Math.max(40, Math.min(220, Math.round(bpm)));
  currentBPM = bpm;

  const slider = document.getElementById('tempoSlider');
  const numEl  = document.getElementById('tempoNum');
  if (slider) slider.value = bpm;
  if (numEl)  numEl.value  = bpm;

  // Update preset button highlight
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.classList.toggle('active', +btn.dataset.bpm === bpm);
  });

  // If playing, restart with new tempo
  if (isPlaying) {
    const countIn = !combineMode && document.getElementById('countInCheck')?.checked;
    if (adHocMode) {
      startPlayback(adhocToPattern(), currentBPM, countIn);
    } else if (selectedPattern) {
      startPlayback(selectedPattern, currentBPM, countIn);
    }
  }

  // Persist new BPM into the currently-loaded favourite (debounced — never blocks audio scheduler)
  _persistBpmToFav();
}

// ── SIDEBAR (mobile) ──────────────────────────────────────────────────────
function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('overlay').classList.add('visible');
  document.body.style.overflow = 'hidden';
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('visible');
  document.body.style.overflow = '';
}
