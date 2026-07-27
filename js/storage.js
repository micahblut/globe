// Persistence layer: localStorage autosave + JSON export/import backup.
// Exposes a global `CountryStorage` object used by main.js.
(function (global) {
  const STORAGE_KEY = "countryTracker.watchedIds";

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

  function exportProgress(watchedIds, countryNamesById) {
    const ids = Array.from(watchedIds);
    const payload = {
      exportedAt: new Date().toISOString(),
      watchedCountryIds: ids,
      watchedCountryNames: ids
        .map((id) => countryNamesById[id] || id)
        .sort((a, b) => a.localeCompare(b)),
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
          resolve(new Set(ids.map(String)));
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
    exportProgress,
    importProgress,
  };
})(window);
