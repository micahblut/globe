# Map data

`countries-110m.js` is a vendored, patched copy of `world-atlas`'s
`countries-110m.json` (1:110m scale country boundaries), embedded as a plain
JS file (`window.WORLD_ATLAS_110M = {...}`) instead of a `.json` file so it
loads via a `<script>` tag with no `fetch()` call.

`country-regions.js` contains ten TopoJSON objects under
`window.COUNTRY_REGIONS_TOPOLOGIES`, subdividing Japan, the United States,
China, India, Brazil, Russia, Canada, Australia, Indonesia, and the United
Kingdom into smaller trackable regions (Census Divisions, Federal Districts,
states/territories, etc., depending on the country). Each region's polygon
is clipped to its own country's boundary in `countries-110m.js`, so a
region's outer edge is always a subset of the boundary already used for the
rest of the map, with one documented exception: Russia's `NORTHWESTERN`,
`URAL`, `SIBERIAN`, and `FAR-EASTERN` districts keep their original,
unclipped geometry, because clipping them reliably corrupts the result (a
boolean-clip library limitation on very topologically complex polygons, not
a data problem) — see git history for the investigation if it ever needs
revisiting.

## Source & license

- Geometry: [Natural Earth](https://www.naturalearthdata.com/) Admin 0
  country boundaries, 1:110m scale, and
  [1:10m Admin 1 states and provinces](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-1-states-provinces/)
  (version `5.1.1`) for the prepared country regions. Natural Earth data is
  **public domain** — no permission or attribution required, for any use.
- Packaging: [`world-atlas`](https://github.com/topojson/world-atlas)
  (TopoJSON build of the Admin 0 boundaries), copyright Michael Bostock, ISC
  license (permissive; see full text below).

> Permission to use, copy, modify, and/or distribute this software for any
> purpose with or without fee is hereby granted, provided that the above
> copyright notice and this permission notice appear in all copies.
>
> THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
> WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
> MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY
> SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
> WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
> ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR
> IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
>
> Copyright 2013-2019 Michael Bostock

Three `world-atlas` features ship with no `id` (Kosovo, Somaliland, and
N. Cyprus — disputed/unrecognized territories with no ISO 3166-1 numeric
code); they've been patched with synthetic ids (`990`, `991`, `992`) outside
the real ISO range, since every feature needs a stable, unique id for D3's
data join and for `localStorage` keys.

## Updating these files

Refresh or replace either file with any equivalent dataset, as long as the
shapes documented above hold: `window.WORLD_ATLAS_110M` and
`window.COUNTRY_REGIONS_TOPOLOGIES` as TopoJSON, every country feature
carrying a stable unique `id`, and each subdivided country's regions
carrying a `regionKey`/`regionName` matching what `js/regions.js` expects
(see `COUNTRY_SUBDIVISIONS`). Keep region polygons clipped to their own
country's boundary to avoid seams against neighboring countries and the
rendering glitches that come with very complex, many-island polygons.
