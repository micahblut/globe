# Map data

`countries-110m.js` is a vendored, patched copy of `world-atlas`'s
`countries-110m.json` (1:110m scale country boundaries), embedded as a plain
JS file (`window.WORLD_ATLAS_110M = {...}`) instead of a `.json` file so it
loads via a `<script>` tag with no `fetch()` call.

## Source & license

- Geometry: [Natural Earth](https://www.naturalearthdata.com/) Admin 0
  country boundaries, 1:110m scale. Natural Earth data is **public domain**
  — no permission or attribution required, for any use.
- Packaging: [`world-atlas`](https://github.com/topojson/world-atlas)
  (TopoJSON build of the above), copyright Michael Bostock, ISC license
  (permissive; see full text below). Fetched from
  `https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json` on
  2026-07-27.

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

## Updating this file

To refresh from upstream and re-apply the patch, re-run the same steps: fetch
`countries-110m.json` from the `world-atlas` CDN, apply the id patch above to
any feature still missing an `id`, then re-embed it as
`window.WORLD_ATLAS_110M = <json>;` in `countries-110m.js`.
