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

    // Combine mode: show confirmation instead of selecting
    if (combineMode) {
      let pattern = null;
      if (item.dataset.favId) {
        const favs = loadFavorites();
        const fav  = favs.find(f => f.type === 'adhoc' && f.id === item.dataset.favId);
        if (fav) pattern = { name: fav.label, cat: 'Ad Hoc', ts: fav.ts, beats: adHocBeatsToSlots(fav.beats) };
      } else {
        pattern = PATTERNS[+item.dataset.idx];
      }
      if (pattern) combineConfirmShow(pattern);
      return;
    }

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
    selectPattern(PATTERNS[idx]);
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

  // ── Star rating ──────────────────────────────────────────────────────
  document.getElementById('starRating').addEventListener('click', e => {
    const btn = e.target.closest('.star-btn');
    if (!btn) return;

    let key = null;
    if (!adHocMode && selectedPattern) {
      key = 'lib:' + selectedPattern.name;
    } else if (adHocMode && loadedFavId) {
      key = 'adhoc:' + loadedFavId;
    }
    if (!key) return;

    const star    = +btn.dataset.star;
    const current = getRating(key);
    setRating(key, current === star ? 0 : star); // tap same star = clear
    updateStarRating();
    renderPatternList(); // re-sort list
    updateNavButtons();  // re-sort affects position
  });

  // ── Search ────────────────────────────────────────────────────────────
  document.getElementById('searchInput').addEventListener('input', e => {
    searchQuery = e.target.value;
    renderPatternList();
    updateNavButtons();
  });

  // ── Category filters ──────────────────────────────────────────────────
  document.getElementById('catFilters').addEventListener('click', e => {
    const btn = e.target.closest('.cat-btn');
    if (!btn) return;
    activeCategory = btn.dataset.cat;
    renderCategoryFilters();
    renderPatternList();
    updateNavButtons();
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
    const raw = input.value.trim() || 'My Rhythm';
    adHocName = raw.replace(/\b\w/g, c => c.toUpperCase());
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

  // ── Pattern prev / next navigation ────────────────────────────────────
  document.getElementById('prevPatternBtn').addEventListener('click', () => navigatePattern(-1));
  document.getElementById('nextPatternBtn').addEventListener('click', () => navigatePattern(1));

  // ── Combine mode ──────────────────────────────────────────────────────
  document.getElementById('addPatternBtn').addEventListener('click', combineEnter);
  document.getElementById('combineCancelBtn').addEventListener('click', combineExit);
  document.getElementById('combineConfirmYes').addEventListener('click', combineConfirmAdd);
  document.getElementById('combineConfirmNo').addEventListener('click', () => {
    combinePendingPattern = null;
    document.getElementById('combineConfirmOverlay').style.display = 'none';
  });

  // ── Ad hoc code export ────────────────────────────────────────────────
  document.getElementById('adhocCodeBtn').addEventListener('click', () => {
    document.getElementById('codeModalPre').textContent = adhocToCode();
    document.getElementById('codeModalCopy').textContent = 'Copy to clipboard';
    document.getElementById('codeModalOverlay').style.display = 'flex';
  });
  document.getElementById('codeModalClose').addEventListener('click', () => {
    document.getElementById('codeModalOverlay').style.display = 'none';
  });
  document.getElementById('codeModalOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('codeModalOverlay'))
      document.getElementById('codeModalOverlay').style.display = 'none';
  });
  document.getElementById('codeModalCopy').addEventListener('click', () => {
    const code = document.getElementById('codeModalPre').textContent;
    navigator.clipboard.writeText(code).then(() => {
      const btn = document.getElementById('codeModalCopy');
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = 'Copy to clipboard'; }, 2000);
    });
  });

  document.addEventListener('keydown', e => {
    if (e.code === 'Space' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'SELECT') {
      e.preventDefault(); newBtn.click();
    }
  });

  // ── Tag filters (sidebar) ─────────────────────────────────────────────────
  document.getElementById('tagFilters').addEventListener('click', e => {
    const btn = e.target.closest('.tag-filter-btn');
    if (!btn) return;
    activeTag = btn.dataset.tag || null;
    renderTagFilters();
    renderPatternList();
    updateNavButtons();
  });

  // ── Tag edit modal ────────────────────────────────────────────────────────
  document.getElementById('tagsEditBtn').addEventListener('click', () => {
    if (!selectedPattern) return;
    document.getElementById('tagModalInput').value = getPatternTags(selectedPattern.name).join(', ');
    document.getElementById('tagModalOverlay').style.display = 'flex';
    document.getElementById('tagModalInput').focus();
  });

  function closeTagModal() {
    document.getElementById('tagModalOverlay').style.display = 'none';
  }

  function saveTagModal() {
    if (!selectedPattern) return;
    const raw = document.getElementById('tagModalInput').value;
    const tags = raw.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    setPatternTags(selectedPattern.name, tags);
    renderTagsRow(selectedPattern);
    renderTagFilters();
    renderPatternList();
    closeTagModal();
  }

  document.getElementById('tagModalSave').addEventListener('click', saveTagModal);
  document.getElementById('tagModalCancel').addEventListener('click', closeTagModal);
  document.getElementById('tagModalOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('tagModalOverlay')) closeTagModal();
  });
  document.getElementById('tagModalInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); saveTagModal(); }
    if (e.key === 'Escape') closeTagModal();
  });
});
