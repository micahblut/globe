// App entry point: loads world map data, wires up the globe, the progress
// panel, and localStorage/export/import persistence.
(function () {
  const stage = document.getElementById("stage");
  const tooltip = document.getElementById("tooltip");
  const hint = document.getElementById("hint");
  const loading = document.getElementById("loading");

  const progressCountEl = document.getElementById("progress-count");
  const panelHelp = document.getElementById("panel-help");
  const exportBtn = document.getElementById("export-btn");
  const importBtn = document.getElementById("import-btn");
  const importInput = document.getElementById("import-input");
  const zoomInBtn = document.getElementById("zoom-in");
  const zoomOutBtn = document.getElementById("zoom-out");
  const dartModeBtn = document.getElementById("dart-mode-btn");

  // Coarse-pointer devices (touch) get a two-step gesture (tap to select,
  // long-press to toggle) since there's no hover to preview a country first.
  const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
  const DEFAULT_HELP_TEXT = isTouchDevice
    ? "Tap a country to select it, then long-press to mark it watched."
    : "Click a country to mark it watched.";
  panelHelp.textContent = DEFAULT_HELP_TEXT;

  let watchedIds = CountryStorage.loadWatchedIds();
  let countryNamesById = {};
  let totalCountries = 0;

  function isWatched(id) {
    return watchedIds.has(String(id));
  }

  function updateProgress() {
    progressCountEl.textContent = `${watchedIds.size} / ${totalCountries}`;
  }

  function nameOf(d) {
    return (d.properties && d.properties.name) || String(d.id);
  }

  const globeApi = createGlobe({
    stage,
    tooltip,
    hint,
    isWatched,
    initialZoomTicks: isTouchDevice ? 2 : 0,
    onSelectCountry(d) {
      if (!d) {
        panelHelp.textContent = DEFAULT_HELP_TEXT;
        return;
      }
      panelHelp.textContent = isTouchDevice
        ? `${nameOf(d)} selected — long-press to mark watched.`
        : `${nameOf(d)} selected — click it to mark watched.`;
    },
    onToggleCountry(d) {
      const id = String(d.id);
      const nowWatched = !watchedIds.has(id);
      if (nowWatched) {
        watchedIds.add(id);
      } else {
        watchedIds.delete(id);
      }
      CountryStorage.saveWatchedIds(watchedIds);
      globeApi.refreshWatched();
      updateProgress();
      if (isTouchDevice) {
        panelHelp.textContent = `${nameOf(d)} marked ${nowWatched ? "watched" : "unwatched"}.`;
      }
    },
  });

  zoomInBtn.addEventListener("click", () => globeApi.zoomIn());
  zoomOutBtn.addEventListener("click", () => globeApi.zoomOut());

  dartModeBtn.addEventListener("click", () => {
    dartModeBtn.disabled = true;
    globeApi.throwDart().then((target) => {
      dartModeBtn.disabled = false;
      if (!target) {
        panelHelp.textContent = "Every country is already watched — nothing left to dart!";
      }
    });
  });

  exportBtn.addEventListener("click", () => {
    CountryStorage.exportProgress(watchedIds, countryNamesById);
  });

  importBtn.addEventListener("click", () => importInput.click());

  importInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const confirmed = confirm(
      "Importing will replace your current progress with the contents of this file. Continue?"
    );
    if (!confirmed) {
      importInput.value = "";
      return;
    }

    try {
      watchedIds = await CountryStorage.importProgress(file);
      CountryStorage.saveWatchedIds(watchedIds);
      globeApi.refreshWatched();
      updateProgress();
    } catch (err) {
      alert("Could not import that file. Make sure it's a JSON file exported from this tracker.");
      console.error(err);
    } finally {
      importInput.value = "";
    }
  });

  // World map data: vendored in data/countries-110m.js (see data/README.md
  // for source, license, and why it's a patched local copy rather than a
  // CDN fetch). Every feature has a stable, unique `id` (used as our
  // storage key) and a `properties.name` (used for tooltip/export labels).
  const world = window.WORLD_ATLAS_110M;

  if (world) {
    const countries = topojson.feature(world, world.objects.countries).features;
    totalCountries = countries.length;
    countries.forEach((c) => {
      countryNamesById[c.id] = (c.properties && c.properties.name) || c.id;
    });

    loading.style.display = "none";
    globeApi.setCountries(countries);
    updateProgress();
    dartModeBtn.disabled = false;
  } else {
    loading.textContent = "Could not load world data. Is data/countries-110m.js missing?";
    console.error("window.WORLD_ATLAS_110M was not set — check that data/countries-110m.js loaded.");
  }
})();
