# Map data

`countries-110m.js` is a vendored, patched copy of `world-atlas`'s
`countries-110m.json` (1:110m scale country boundaries), embedded as a plain
JS file (`window.WORLD_ATLAS_110M = {...}`) instead of a `.json` file so it
loads via a `<script>` tag with no `fetch()` call.

`japan-regions.js` contains eight prepared Japan regions, embedded as
`window.JAPAN_REGIONS_TOPOLOGY`. The source's 47 prefectures were merged
ahead of time into Hokkaido, Tohoku, Kanto, Chubu, Kansai, Chugoku, Shikoku,
and Kyushu/Okinawa. The browser therefore decodes only the eight shapes it
renders instead of merging prefectures at runtime. The topology is aggressively
simplified for globe rendering, from 7,473 source-topology arc points to 976.

`large-country-regions.js` contains nine separately quantized and simplified
TopoJSON objects under `window.LARGE_COUNTRY_REGIONS_TOPOLOGIES`. State and
province boundaries are merged ahead of time, so the browser decodes only the
final tracking shapes:

- United States: eight Census Divisions plus Pacific Coast, Alaska, and Hawaii
  (11 targets, 1,601 arc points).
- China: the six customary major geographical regions (6 targets, 825 arc
  points). Taiwan remains its existing independent country target.
- India: the five Zonal Councils plus the separate North Eastern Council
  (6 targets, 730 arc points).
- Brazil: the five official Major Regions (5 targets, 845 arc points).
- Russia: the eight Federal Districts (8 targets, 1,170 arc points). The
  geometry follows the base world map's internationally recognized country
  allocation rather than adding disputed Ukrainian territory.
- Canada: the five regions used by the Government of Canada's
  `Discover Canada` guide (5 targets, 2,241 arc points).
- Australia: the eight main states and territories (8 targets, 510 arc
  points). Jervis Bay and Lord Howe Island are included with New South Wales;
  Macquarie Island is included with Tasmania.
- Indonesia: seven broad island groups (7 targets, 910 arc points).
- United Kingdom: England, Scotland, Wales, and Northern Ireland (4 targets,
  349 arc points).

## Source & license

- Geometry: [Natural Earth](https://www.naturalearthdata.com/) Admin 0
  country boundaries, 1:110m scale. Natural Earth data is **public domain**
  — no permission or attribution required, for any use.
- Packaging: [`world-atlas`](https://github.com/topojson/world-atlas)
  (TopoJSON build of the above), copyright Michael Bostock, ISC license
  (permissive; see full text below). Fetched from
  `https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json` on
  2026-07-27.
- Prepared country regions: [Natural Earth 1:10m Admin 1 states and provinces](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-1-states-provinces/),
  version `5.1.1`. This supplies the source geometry for Japan, the United
  States, China, India, Brazil, Russia, Canada, Australia, Indonesia, and the
  United Kingdom. Natural Earth data is **public domain** and requires neither
  permission nor attribution. The relevant first-level administrative features
  were merged into the rendered regions before simplification. The official
  source ZIP was
  `https://naturalearth.s3.amazonaws.com/10m_cultural/ne_10m_admin_1_states_provinces.zip`;
  SHA-256:
  `EFC59726337323058F9446210ADC96673179CD344E053666EE3D28CB58BA2B05`.

The region memberships follow the U.S. Census Bureau's Census Divisions,
India's Ministry of Home Affairs Zonal Councils and North Eastern Council,
Brazil's IBGE Major Regions, Russia's current eight Federal Districts, and
the Government of Canada's five-region grouping. China's six-region grouping
follows the customary North, Northeast, East, South Central, Southwest, and
Northwest scheme represented in Natural Earth's Admin 1 properties. Australia
uses the Australian Bureau of Statistics' eight main states and territories.
The United Kingdom uses its four constituent countries. Indonesia uses the
customary seven-group island scheme: Sumatra, Java, Kalimantan, Sulawesi,
the Lesser Sunda Islands, the Maluku Islands, and Papua.

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

## Patched ids

Three features ship from `world-atlas` with no `id` (disputed/unrecognized
territories, which have no official ISO 3166-1 numeric code): **Kosovo**,
**Somaliland**, and **N. Cyprus**. A shared `undefined` id across multiple
features breaks D3's data join (ghost/duplicate shapes while rotating) and
would also collide as a single shared key in `localStorage`.

They've been assigned synthetic ids outside the real ISO numeric range (which
tops out at `894`), so every feature has a stable, unique id:

| Name       | Synthetic id |
| ---------- | ------------ |
| Kosovo     | `990`        |
| Somaliland | `991`        |
| N. Cyprus  | `992`        |

## Updating these files

To refresh from upstream and re-apply the patch, re-run the same steps: fetch
`countries-110m.json` from the `world-atlas` CDN, apply the id patch above to
any feature still missing an `id`, then re-embed it as
`window.WORLD_ATLAS_110M = <json>;` in `countries-110m.js`.

To refresh Japan, download Natural Earth's 1:10m Admin 1 shapefile and retain
the 47 features identified by `JP-01` through `JP-47`. Merge those prefectures
into the eight customary regions listed above, convert the resulting feature
collection to TopoJSON quantized to `1e4`, run `topojson-simplify` with
spherical triangle weighting at quantile `0.1`, requantize to `1e4`, and
embed it as `window.JAPAN_REGIONS_TOPOLOGY = <json>;` in
`japan-regions.js`.

To refresh the other prepared regions, use the same Natural Earth Admin 1
source and merge the state/province ISO codes into the memberships described
above. Build an independent TopoJSON object for each country, initially
quantized to `1e4`; simplify with spherical triangle weighting at quantiles
`0.02` for the United States, `0.03` for China, and `0.05` for India and
Brazil, `0.01` for Russia, `0.02` for Canada, Australia, and Indonesia, and
`0.03` for the United Kingdom; then requantize each to `1e4`. Embed the nine
topologies under
`window.LARGE_COUNTRY_REGIONS_TOPOLOGIES` in
`large-country-regions.js`.
