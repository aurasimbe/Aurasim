# AURASIM — storefront themes

Two design directions for the AURASIM Shopify store (aurasim.be), built on top of a duplicate of the
store's Horizon theme. Only the files in these folders are added/overwritten; everything else
(layout, password page, Horizon sections) stays Horizon.

| Folder | Shopify theme | Direction |
|---|---|---|
| `monolith/` + `shared/` | AURASIM — A (Monolith) | Black editorial, centred, thin frames, full-bleed photography |
| `spectrum/` + `shared/` | AURASIM — B (Spectrum) | Colour-driven: the selected aura tints the page, oversized type, expanding panels |

Brand system (both): `#0B0B0C` black, `#F5F0E8` off-white, `#D32F2F` red, `#8A8A8E` grey,
Archivo Black + IBM Plex Mono, square elements, fade-in on scroll.
Aura colours: Yellow `#FFCC00`, Blue `#2F6FED`, Red `#D32F2F`, Pink `#E8399C`, Orange `#FF7A1A`.

Product photos are grouped by colour through their alt text (`AURA Tee — Red`, …), so new photos
only need the colour name in their alt text to land in the right gallery.

Validate with `node check.js` after assembling `build/` (see commit history).
