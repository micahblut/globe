// Persistence layer: localStorage autosave + JSON export/import backup.
// Exposes a global `CountryStorage` object used by main.js.
(function (global) {
  const STORAGE_KEY = "countryTracker.watchedIds";
  const NOTES_STORAGE_KEY = "countryTracker.notesByPlaceId";

  function loadWatchedIds() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return new Set();
      const parsed = JSON.parse(raw);
      return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
    } catch (err) {
      console.warn("Could not read saved progress, starting fresh.", err);
      return new Set();
    }
  }

  function saveWatchedIds(watchedIds) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(watchedIds)));
  }

  function loadNotes() {
    try {
      const raw = localStorage.getItem(NOTES_STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (err) {
      console.warn("Could not read saved notes, starting fresh.", err);
      return {};
    }
  }

  function saveNotes(notesByPlaceId) {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notesByPlaceId));
  }

  // Drops blank entries so exports/localStorage don't accumulate empty
  // strings for places a user typed into and then cleared.
  function cleanNotes(notesByPlaceId) {
    const cleaned = {};
    Object.keys(notesByPlaceId || {}).forEach((id) => {
      const text = typeof notesByPlaceId[id] === "string" ? notesByPlaceId[id].trim() : "";
      if (text) cleaned[id] = notesByPlaceId[id];
    });
    return cleaned;
  }

  function exportProgress(watchedIds, placeNamesById, notesByPlaceId) {
    const ids = Array.from(watchedIds);
    const payload = {
      exportedAt: new Date().toISOString(),
      watchedCountryIds: ids,
      watchedCountryNames: ids
        .map((id) => placeNamesById[id] || id)
        .sort((a, b) => a.localeCompare(b)),
      notesByPlaceId: cleanNotes(notesByPlaceId),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const dateStr = payload.exportedAt.slice(0, 10);

    const link = document.createElement("a");
    link.href = url;
    link.download = `country-progress-${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function importProgress(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          const ids = Array.isArray(data.watchedCountryIds)
            ? data.watchedCountryIds
            : [];
          const notesByPlaceId = cleanNotes(
            data.notesByPlaceId && typeof data.notesByPlaceId === "object"
              ? data.notesByPlaceId
              : {}
          );
          resolve({ watchedIds: new Set(ids.map(String)), notesByPlaceId });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  global.CountryStorage = {
    loadWatchedIds,
    saveWatchedIds,
    loadNotes,
    saveNotes,
    exportProgress,
    importProgress,
  };
})(window);
