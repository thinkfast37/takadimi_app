'use strict';

// ══════════════════════════════════════════════════════════════════════════════
// AD HOC MODE
// ══════════════════════════════════════════════════════════════════════════════

function adhocDefaultMeasure(ts) {
  const n = parseInt(ts.split('/')[0]);
  const beats = [];
  for (let i = 0; i < n; i++) beats.push({ type: 'S', on: [false,false,false,false] });
  return beats;
}

function adhocAddBeat() {
  adHocBeats.push({ type: 'S', on: [false,false,false,false] });
  renderAdHocGrid(); updateAdHocBeatCount();
}

function adhocAddMeasure() {
  const n = parseInt(adHocTs.split('/')[0]);
  for (let i = 0; i < n; i++) adHocBeats.push({ type: 'S', on: [false,false,false,false] });
  renderAdHocGrid(); updateAdHocBeatCount();
}

function adhocClear() {
  if (isPlaying) stopPlayback();
  adHocName   = 'My Rhythm';
  loadedFavId = null;
  adHocBeats  = adhocDefaultMeasure(adHocTs);
  document.getElementById('selectedName').textContent = adHocName;
  renderAdHocGrid(); updateAdHocBeatCount();
  updateFavoriteIndicator();
}

function adhocRemoveBeat(idx) {
  if (adHocBeats.length <= 1) return;
  if (isPlaying) stopPlayback();
  adHocBeats.splice(idx, 1);
  renderAdHocGrid(); updateAdHocBeatCount();
}

function adhocToggleBeatType(idx, targetType) {
  if (isPlaying) stopPlayback();
  const beat = adHocBeats[idx];
  if (beat.type === targetType) return;
  beat.type = targetType;
  beat.on   = targetType === 'S' ? [false,false,false,false] : [false,false,false];
  renderAdHocGrid();
}

function adhocToggleCell(beatIdx, slotIdx) {
  const beat  = adHocBeats[beatIdx];
  beat.on[slotIdx] = !beat.on[slotIdx];
  const syls  = beat.type === 'S' ? STRAIGHT_SYLS : TRIPLET_SYLS;
  const cell  = document.querySelector(
    `.slot-cell.editable[data-beat-idx="${beatIdx}"][data-slot-idx="${slotIdx}"]`
  );
  if (!cell) return;
  const isOn = beat.on[slotIdx];
  const syl  = syls[slotIdx];
  cell.classList.toggle('on', isOn);
  cell.classList.toggle('has-syllable', isOn);
  cell.dataset.syl = isOn ? syl : '';
  cell.textContent = isOn ? syl : '·';
}

function updateAdHocBeatCount() {
  const el  = document.getElementById('adhocBeatCount');
  if (el) el.textContent = adHocBeats.length + ' beat' + (adHocBeats.length !== 1 ? 's' : '');
  const rem = document.getElementById('adhocRemoveBeatBtn');
  if (rem) rem.disabled = adHocBeats.length <= 1;
}

function adhocRemoveLastBeat() {
  if (adHocBeats.length <= 1) return;
  if (isPlaying) stopPlayback();
  adHocBeats.pop();
  renderAdHocGrid(); updateAdHocBeatCount();
}

function adhocToCode() {
  const name = (adHocName || 'My Rhythm').replace(/"/g, '\\"');
  const beatLines = adHocBeats.map(b => {
    const syls  = b.type === 'S' ? STRAIGHT_SYLS : TRIPLET_SYLS;
    const slots = b.on.map((on, i) => on ? syls[i] : '_');
    return '    ' + b.type + '(' + slots.join(',') + ')';
  });
  return '{\n'
       + '  name: "' + name + '",\n'
       + '  cat:  "Category Name",\n'
       + '  disp: "",\n'
       + '  ts:   "' + adHocTs + '",\n'
       + '  beats: [\n'
       + beatLines.join(',\n') + ',\n'
       + '  ]\n'
       + '}';
}

function adhocToPattern() {
  const beats = adHocBeats.map(b => {
    const syls  = b.type === 'S' ? STRAIGHT_SYLS : TRIPLET_SYLS;
    const slots = b.on.map((on, i) => on ? syls[i] : null);
    return { type: b.type, slots };
  });
  return { name:'Ad Hoc', cat:'Ad Hoc', disp:'', ts: adHocTs, beats };
}

function renderAdHocGrid() {
  const grid = document.getElementById('adHocGrid');
  if (!grid) return;
  const bpm   = parseInt(adHocTs.split('/')[0]);
  const total = adHocBeats.length;
  const nMeas = Math.ceil(total / bpm);
  let gsi = 0, html = '';

  for (let m = 0; m < nMeas; m++) {
    const mStart = m * bpm;
    const mEnd   = Math.min(mStart + bpm, total);
    html += '<div class="measure-row">';
    if (nMeas > 1) html += '<div class="measure-label">Measure ' + (m+1) + '</div>';
    html += '<div class="beats-row">';

    for (let b = mStart; b < mEnd; b++) {
      const beat   = adHocBeats[b];
      const isTrip = beat.type === 'T';
      const syls   = isTrip ? TRIPLET_SYLS : STRAIGHT_SYLS;
      html += '<div class="beat-group">';
      // Beat num + remove button
      html += '<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px">'
            + '<div class="beat-num" data-beat="' + b + '">' + (b+1) + '</div>'
            + '<button class="remove-beat-btn" data-remove-beat="' + b + '" title="Remove beat">&times;</button>'
            + '</div>';
      // Beat type toggle
      html += '<div class="beat-type-toggle">'
            + '<button class="beat-type-btn' + (!isTrip ? ' active' : '') + '" data-type-beat="' + b + '" data-target-type="S">16</button>'
            + '<button class="beat-type-btn' + (isTrip  ? ' active' : '') + '" data-type-beat="' + b + '" data-target-type="T">3</button>'
            + '</div>';
      // Slots
      html += '<div class="slots-row">';
      for (let s = 0; s < syls.length; s++) {
        const isOn  = beat.on[s];
        const syl   = syls[s];
        const label = getSylLabel(beat.type, s, b - mStart + 1);
        const cls   = 'slot-cell editable' + (isTrip ? ' triplet' : '') + (isOn ? ' on has-syllable' : '');
        html += '<div class="' + cls + '" data-gsi="' + gsi + '" data-beat-idx="' + b + '" data-slot-idx="' + s + '" data-syl="' + (isOn?syl:'') + '" title="' + label + '">' + (isOn ? label : '·') + '</div>';
        gsi++;
      }
      html += '</div></div>'; // slots-row, beat-group
      if (b < mEnd - 1) html += '<div class="beat-sep"></div>';
    }
    html += '</div></div>'; // beats-row, measure-row
  }

  grid.innerHTML = html;

  grid.querySelectorAll('.slot-cell.editable').forEach(cell => {
    cell.addEventListener('click', () => adhocToggleCell(+cell.dataset.beatIdx, +cell.dataset.slotIdx));
  });
  grid.querySelectorAll('.beat-type-btn').forEach(btn => {
    btn.addEventListener('click', () => adhocToggleBeatType(+btn.dataset.typeBeat, btn.dataset.targetType));
  });
  grid.querySelectorAll('.remove-beat-btn').forEach(btn => {
    btn.addEventListener('click', () => adhocRemoveBeat(+btn.dataset.removeBeat));
  });
}

// Load a saved ad hoc favourite into ad hoc mode
function loadAdHocFavourite(favPattern) {
  adHocName    = favPattern.name || 'My Rhythm';
  loadedFavId  = favPattern._favId || null;
  setMode('adhoc');
  if (favPattern._favBpm) setTempo(favPattern._favBpm);
  adHocTs    = favPattern.ts;
  adHocBeats = JSON.parse(JSON.stringify(favPattern._favBeats));
  // Sync dropdown
  const tsSelect = document.getElementById('adhocTs');
  if (tsSelect) tsSelect.value = adHocTs;
  const tsBadge = document.getElementById('adhocTsBadge');
  if (tsBadge) tsBadge.textContent = adHocTs;
  renderAdHocGrid();
  updateAdHocBeatCount();
  if (window.innerWidth < 768) closeSidebar();
}

function setMode(mode) {
  if (isPlaying) stopPlayback();
  adHocMode = (mode === 'adhoc');

  // Sidebar controls
  document.getElementById('libraryControls').style.display  = adHocMode ? 'none' : 'contents';
  document.getElementById('modeLibraryBtn').classList.toggle('active', !adHocMode);
  document.getElementById('modeAdhocBtn').classList.toggle('active', adHocMode);

  // Grid sections
  document.getElementById('gridSection').style.display   = adHocMode ? 'none' : (selectedPattern ? 'block' : 'none');
  document.getElementById('adHocSection').style.display  = adHocMode ? 'block' : 'none';

  // Controls + transport
  document.getElementById('controlsRow').style.display   = adHocMode ? 'flex' : (selectedPattern ? 'flex' : 'none');
  document.getElementById('transportRow').style.display  = adHocMode ? 'flex' : (selectedPattern ? 'flex' : 'none');

  // Keep patternInfo block always visible — populate with ad hoc values or restore library state
  const emptyState  = document.getElementById('emptyState');
  const selectedDiv = document.getElementById('selectedInfo');
  const nameEl      = document.getElementById('selectedName');
  const metaEl      = document.getElementById('selectedMeta');
  const dispEl      = document.getElementById('selectedDisplay');

  if (adHocMode) {
    // Show the info block with fixed ad hoc values — layout stays identical
    emptyState.style.display  = 'none';
    selectedDiv.style.display = 'block';
    nameEl.textContent        = adHocName;
    nameEl.classList.add('adhoc-name');
    document.getElementById('nameEditBtn').style.display = '';
    metaEl.innerHTML          = '<span class="badge badge-cat">Custom</span>'
                              + '<span class="badge badge-ts" id="adhocTsBadge">' + adHocTs + '</span>';
    dispEl.innerHTML          = '&nbsp;'; // empty but holds space so layout doesn't shift
  } else {
    // Restore library state
    nameEl.classList.remove('adhoc-name');
    document.getElementById('nameEditBtn').style.display = 'none';
    if (selectedPattern) {
      emptyState.style.display  = 'none';
      selectedDiv.style.display = 'block';
      nameEl.textContent        = selectedPattern.name;
      metaEl.innerHTML          = '<span class="badge badge-cat">' + selectedPattern.cat + '</span>'
                                + '<span class="badge badge-ts">' + selectedPattern.ts + '</span>';
      dispEl.textContent        = buildDisp(selectedPattern);
    } else {
      emptyState.style.display  = '';
      selectedDiv.style.display = 'none';
    }
  }
  updateFavoriteIndicator();

  if (adHocMode && adHocBeats.length === 0) {
    adHocBeats = adhocDefaultMeasure(adHocTs);
    renderAdHocGrid();
    updateAdHocBeatCount();
  }
}
