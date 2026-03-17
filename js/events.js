'use strict';

// ══════════════════════════════════════════════════════════════════════════════
// EVENT BINDING
// ══════════════════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {

  // Initial render
  renderCategoryFilters();
  renderPatternList();

  // ── Pattern list click ─────────────────────────────────────────────────
  document.getElementById('patternList').addEventListener('click', e => {
    const item = e.target.closest('.pattern-item');
    if (!item) return;
    // Ad hoc favourite: load into ad hoc mode
    if (item.dataset.favId) {
      const favs = loadFavorites();
      const fav  = favs.find(f => f.type === 'adhoc' && f.id === item.dataset.favId);
      if (fav) {
        loadAdHocFavourite({
          name:      fav.label,
          _favId:    fav.id,
          ts:        fav.ts,
          _favBeats: fav.beats,
          _favBpm:   fav.bpm || 80,
        });
      }
      return;
    }
    // Library pattern
    const idx = +item.dataset.idx;
    const p = PATTERNS[idx];
    selectPattern(p);
    // Apply saved BPM if this pattern is a favourite
    const libFav = loadFavorites().find(f => f.type === 'library' && f.name === p.name);
    if (libFav) setTempo(libFav.bpm || 80);
  });

  document.getElementById('patternList').addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      const item = e.target.closest('.pattern-item');
      if (item) { e.preventDefault(); item.click(); }
    }
  });

  // ── Favourite toggle (library) or save (ad hoc) ────────────────────────
  document.getElementById('favBtn').addEventListener('click', () => {
    if (adHocMode) {
      if (loadedFavId) {
        // Already a favourite — remove it (toggle off)
        removeAdHocFavorite(loadedFavId);
        loadedFavId = null;
        updateFavoriteIndicator();
      } else {
        const hasAny = adHocBeats.some(b => b.on.some(Boolean));
        if (!hasAny) { alert('Add some notes first before saving to favourites.'); return; }
        loadedFavId = saveAdHocFavorite(adHocName || 'My Rhythm', adHocBeats, adHocTs);
        renderPatternList();
        updateFavoriteIndicator();
      }
    } else if (selectedPattern) {
      toggleLibraryFavorite(selectedPattern);
    }
  });

  // ── Search ────────────────────────────────────────────────────────────
  document.getElementById('searchInput').addEventListener('input', e => {
    searchQuery = e.target.value;
    renderPatternList();
  });

  // ── Category filters ──────────────────────────────────────────────────
  document.getElementById('catFilters').addEventListener('click', e => {
    const btn = e.target.closest('.cat-btn');
    if (!btn) return;
    activeCategory = btn.dataset.cat;
    renderCategoryFilters();
    renderPatternList();
  });

  // ── Tempo slider ──────────────────────────────────────────────────────
  document.getElementById('tempoSlider').addEventListener('input', e => {
    setTempo(+e.target.value);
  });

  document.getElementById('tempoNum').addEventListener('change', e => {
    setTempo(+e.target.value);
  });
  document.getElementById('tempoNum').addEventListener('keydown', e => {
    if (e.key === 'Enter') setTempo(+e.target.value);
  });

  // ── Preset buttons ────────────────────────────────────────────────────
  document.getElementById('presetBtns').addEventListener('click', e => {
    const btn = e.target.closest('.preset-btn');
    if (!btn) return;
    setTempo(+btn.dataset.bpm);
  });

  // ── Play / Stop ───────────────────────────────────────────────────────
  document.getElementById('playBtn').addEventListener('click', () => {
    if (!selectedPattern) return;
    if (isPlaying) {
      stopPlayback();
    } else {
      // Ensure audio is unlocked on iOS before starting — must be synchronous in click handler
      unlockAudio();
      const countIn = document.getElementById('countInCheck').checked;
      startPlayback(selectedPattern, currentBPM, countIn);
    }
  });

  // ── Mobile sidebar ────────────────────────────────────────────────────
  document.getElementById('burgerBtn').addEventListener('click', openSidebar);
  document.getElementById('overlay').addEventListener('click', closeSidebar);

  // ── Keyboard shortcuts ────────────────────────────────────────────────
  document.addEventListener('keydown', e => {
    // Space bar = play/stop (when not focused on input)
    if (e.code === 'Space' && document.activeElement.tagName !== 'INPUT') {
      e.preventDefault();
      document.getElementById('playBtn').click();
    }
  });

  // ── Init counting system ──────────────────────────────────────────────
  document.querySelectorAll('.counting-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.system === countingSystem));
  renderLegend();

  // ── Init tempo display ────────────────────────────────────────────────
  setTempo(80);

  // ── Auto-open sidebar on mobile at load ──────────────────────────────
  if (window.innerWidth < 768) {
    openSidebar();
    // Sidebar opens on mobile — content area is behind it, no message update needed
  }
});

// ── AD HOC MODE + ADVANCED EVENT BINDING ──────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('modeLibraryBtn').addEventListener('click', () => setMode('library'));
  document.getElementById('modeAdhocBtn').addEventListener('click',   () => setMode('adhoc'));

  // ── Counting system toggle ────────────────────────────────────────────
  document.getElementById('countingWrap').addEventListener('click', e => {
    const btn = e.target.closest('.counting-btn');
    if (!btn) return;
    countingSystem = btn.dataset.system;
    localStorage.setItem(COUNTING_KEY, countingSystem);
    document.querySelectorAll('.counting-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.system === countingSystem));
    renderLegend();
    if (adHocMode) {
      renderAdHocGrid();
    } else if (selectedPattern) {
      renderGrid(selectedPattern);
      const dispEl = document.getElementById('selectedDisplay');
      if (dispEl) dispEl.textContent = buildDisp(selectedPattern);
    }
  });

  document.getElementById('adhocTs').addEventListener('change', e => {
    adHocTs     = e.target.value;
    loadedFavId = null;
    adHocBeats  = adhocDefaultMeasure(adHocTs);
    renderAdHocGrid(); updateAdHocBeatCount();
    updateFavoriteIndicator();
    // Keep the time signature badge in sync
    const tsBadge = document.getElementById('adhocTsBadge');
    if (tsBadge) tsBadge.textContent = adHocTs;
  });

  document.getElementById('adhocRemoveBeatBtn').addEventListener('click', adhocRemoveLastBeat);
  document.getElementById('adhocAddBeatBtn').addEventListener('click',    adhocAddBeat);
  document.getElementById('adhocAddMeasureBtn').addEventListener('click', adhocAddMeasure);
  document.getElementById('adhocClearBtn').addEventListener('click',      adhocClear);

  // ── Ad hoc name inline editing ─────────────────────────────────────────
  function startAdHocNameEdit() {
    const nameEl = document.getElementById('selectedName');
    const input  = document.getElementById('adhocNameInput');
    input.value  = adHocName;
    nameEl.style.display = 'none';
    document.getElementById('nameEditBtn').style.display = 'none';
    input.style.display  = '';
    input.focus();
    input.select();
  }
  function finishAdHocNameEdit() {
    const nameEl = document.getElementById('selectedName');
    const input  = document.getElementById('adhocNameInput');
    adHocName = input.value.trim() || 'My Rhythm';
    nameEl.textContent   = adHocName;
    input.style.display  = 'none';
    nameEl.style.display = '';
    document.getElementById('nameEditBtn').style.display = '';
    if (loadedFavId) updateAdHocFavouriteLabel(loadedFavId, adHocName);
  }
  document.getElementById('nameEditBtn').addEventListener('click', startAdHocNameEdit);
  document.getElementById('selectedName').addEventListener('click', () => {
    if (adHocMode) startAdHocNameEdit();
  });
  const adhocNameInput = document.getElementById('adhocNameInput');
  adhocNameInput.addEventListener('blur', () => { if (adHocMode) finishAdHocNameEdit(); });
  adhocNameInput.addEventListener('keydown', e => {
    if (e.key === 'Enter')  { e.preventDefault(); adhocNameInput.blur(); }
    if (e.key === 'Escape') { adhocNameInput.value = adHocName; adhocNameInput.blur(); }
  });

  // Replace play button with mode-aware version
  const playBtn = document.getElementById('playBtn');
  const newBtn  = playBtn.cloneNode(true);
  playBtn.parentNode.replaceChild(newBtn, playBtn);

  newBtn.addEventListener('click', () => {
    unlockAudio();
    if (isPlaying) { stopPlayback(); return; }
    const countIn = document.getElementById('countInCheck').checked;
    if (adHocMode) {
      const hasAny = adHocBeats.some(b => b.on.some(Boolean));
      if (!hasAny) return;
      startPlayback(adhocToPattern(), currentBPM, countIn);
    } else {
      if (!selectedPattern) return;
      startPlayback(selectedPattern, currentBPM, countIn);
    }
  });

  document.getElementById('midiBtn').addEventListener('click', downloadMidi);

  document.addEventListener('keydown', e => {
    if (e.code === 'Space' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'SELECT') {
      e.preventDefault(); newBtn.click();
    }
  });
});
