// Place notes drawer: shows the selected place's name and a notes field.
// Exposes a global `createPlaceDrawer` factory used by main.js. Knows
// nothing about localStorage/persistence -- it just renders and calls back
// via `onNoteChange`, the same separation globe.js keeps from storage.js.
(function (global) {
  const NOTE_SAVE_DEBOUNCE_MS = 400;

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  // Trims trailing punctuation (".", ",", ")", etc.) off of an auto-detected
  // bare URL so sentence punctuation right after a link doesn't get pulled
  // into the href.
  function linkifyBareUrl(url) {
    const trailingMatch = url.match(/[.,!?;:)\]]+$/);
    const trailing = trailingMatch ? trailingMatch[0] : "";
    const clean = trailing ? url.slice(0, -trailing.length) : url;
    if (!clean) return url;
    return (
      '<a href="' + clean + '" target="_blank" rel="noopener noreferrer">' + clean + "</a>" + trailing
    );
  }

  // Matches either a Markdown-style "[label](https://...)" link (groups 1-2)
  // or a bare "https://..." URL (group 3), in one pass, so a URL already
  // wrapped in a Markdown link is never re-linkified as a bare URL.
  const LINK_PATTERN = /\[([^\[\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<]+)/g;

  // Minimal note formatting: escape everything, then linkify. Only http(s)
  // URLs are ever turned into hrefs, so this can't be used to smuggle a
  // "javascript:" link in.
  function renderNoteHtml(rawText) {
    const escaped = escapeHtml(rawText);
    const withLinks = escaped.replace(LINK_PATTERN, function (match, mdLabel, mdUrl, bareUrl) {
      if (mdUrl) {
        return '<a href="' + mdUrl + '" target="_blank" rel="noopener noreferrer">' + mdLabel + "</a>";
      }
      return linkifyBareUrl(bareUrl);
    });
    return withLinks.replace(/\n/g, "<br>");
  }

  function createPlaceDrawer(options) {
    const drawer = options.drawer;
    const titleEl = options.titleEl;
    const closeBtn = options.closeBtn;
    const textarea = options.textarea;
    const viewEl = options.viewEl;
    const onNoteChange = options.onNoteChange;

    let currentId = null;
    let currentText = "";
    let saveTimer = null;
    let editing = false;

    function flushPendingSave() {
      if (!currentId || !saveTimer) return;
      clearTimeout(saveTimer);
      saveTimer = null;
      if (onNoteChange) onNoteChange(currentId, currentText);
    }

    function renderView() {
      if (currentText.trim()) {
        viewEl.innerHTML = renderNoteHtml(currentText);
      } else {
        viewEl.innerHTML = '<span class="drawer-notes-placeholder">Click to add notes…</span>';
      }
    }

    function enterEditMode() {
      if (editing || !currentId) return;
      editing = true;
      textarea.value = currentText;
      viewEl.hidden = true;
      textarea.hidden = false;
      textarea.focus();
    }

    function exitEditMode() {
      if (!editing) return;
      editing = false;
      flushPendingSave();
      textarea.hidden = true;
      viewEl.hidden = false;
      renderView();
    }

    function show(feature, noteText) {
      if (!feature) {
        hide();
        return;
      }
      if (editing) exitEditMode();
      currentId = String(feature.id);
      currentText = noteText || "";
      titleEl.textContent = (feature.properties && feature.properties.name) || feature.id;
      renderView();
      drawer.classList.remove("hidden");
      drawer.setAttribute("aria-hidden", "false");
    }

    function hide() {
      if (editing) exitEditMode();
      currentId = null;
      drawer.classList.add("hidden");
      drawer.setAttribute("aria-hidden", "true");
    }

    viewEl.addEventListener("click", enterEditMode);
    viewEl.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        enterEditMode();
      }
    });

    textarea.addEventListener("input", function () {
      currentText = textarea.value;
      if (!currentId) return;
      clearTimeout(saveTimer);
      saveTimer = setTimeout(flushPendingSave, NOTE_SAVE_DEBOUNCE_MS);
    });

    textarea.addEventListener("blur", exitEditMode);
    closeBtn.addEventListener("click", hide);

    return { show: show, hide: hide };
  }

  global.createPlaceDrawer = createPlaceDrawer;
})(window);
