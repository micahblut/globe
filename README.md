# Country Tracker

A single-page, static globe for tracking which countries and selected
subregions you've "visited" via YouTube travel videos. Progress is saved
automatically and can be backed up to a JSON file.

No build step, no dependencies to install — just open `index.html` in a
browser. World map data is vendored locally (`data/countries-110m.js`), so
the map itself works fully offline. D3 and TopoJSON (the rendering
libraries, not data) still load from a CDN, so you need an internet
connection at least once to render anything.

## Project structure

```
index.html          Page markup only (structure, panel, buttons)
css/styles.css       All styling. Color palette lives in the :root block at
                      the top of the file — tweak it to restyle the globe.
data/countries-110m.js Vendored, patched world map data. See data/README.md
                      for source, license, and why it's a local copy.
data/japan-regions.js Vendored public-domain Natural Earth geometry for
                      eight prepared Japan regions.
data/large-country-regions.js Prepared public-domain Natural Earth geometry
                      for USA, China, India, Brazil, Russia, Canada,
                      Australia, Indonesia, and the United Kingdom.
js/storage.js        localStorage autosave + JSON export/import backup logic
js/globe.js          D3 globe: rotation, zoom, hover tooltip, tap/click/
                      long-press gesture handling
js/regions.js        Replaces selected countries with smaller trackable areas
js/main.js           Entry point: loads map data, wires storage + globe + UI
```

Scripts are loaded as plain `<script>` tags (not ES modules) so the page
works when opened directly from disk (`file://`) without a local server.

## Backup / restore

- **Export Progress** downloads a `country-progress-YYYY-MM-DD.json` file
  containing the watched place ids and their names.
- **Import Progress** reads a previously exported JSON file and replaces your
  current progress with its contents (you'll get a confirmation prompt first,
  since it overwrites what's in `localStorage`).

## Collaborating

- Keep it dependency-free and build-step-free — that's the point of the
  project (open the file, it just works).
- `js/globe.js` is UI/rendering only; it has no knowledge of localStorage.
  `js/main.js` is the only place that talks to `CountryStorage`. Keep that
  separation when adding features so the globe stays reusable/testable.
- If you add new UI elements to the panel, put their styles in the
  "Progress / controls overlay panel" section of `css/styles.css`.
- Gesture detection in `js/globe.js` branches on the originating event's
  `type` (`"touchstart"` vs. `"mousedown"`, etc.), not viewport width — a
  touchscreen laptop should still get touch gestures. d3-drag attaches
  separate mouse/touch listener families rather than unified Pointer Events,
  so `sourceEvent` has no usable `pointerType` to check here. The panel's
  mobile layout, by contrast, uses `@media (pointer: coarse)` in CSS, which
  is unrelated but serves the same "is this a touch device" purpose.
