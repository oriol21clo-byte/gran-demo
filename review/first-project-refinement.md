# Project 1: architectural refinement from supplied views

Base: `0727ed12344af25ff0996d8e1570e92b3c5a6d6f`.

Changed only the first portfolio model and its two white-tower tier definitions.
White towers now have twelve-edge recessed-corner footprints, offset wings,
three larger height stages, facade windows on every exposed return and
footprint-following parapets. Grey towers have rounded instanced pilasters.
Glazing follows vertical bays instead of alternating randomly between floors.
The courtyard gallery now includes white slatted infill. Existing six-tower
placement, landscaping, gold/terracotta finishes, VPM-only mode, lighting and
rotation remain available.

## Review

Download `first-project-refinement.html` from this folder and open it in a
WebGL-enabled browser. It is self-contained and requires no installation.
It embeds the repository's Three.js r128, OrbitControls, model builder, Viewer,
render scale and approved project lighting. Controls provide five views,
day/night, rotation and zoom. This is a review artifact, not the public site.

## Validation and limits

- `node tests/pricing.cjs`: PASS.
- `node tests/geometry.cjs`: PASS for all four projects. Project 1: 216,646
  triangles, 75 meshes; finite geometry and instance transforms. Added raycast
  regression checks that the white facade corner is physically recessed.
- Model JavaScript and all embedded preview scripts pass `node --check`.
- `index.html` diff is limited to the first project's two white-tower tiers;
  Viewer, automatic rotation, other project definitions and site text unchanged.
- Browser visual validation is **not complete**. Managed Chrome reports
  “WebGL недоступен”; local Chromium cannot launch because socket creation is
  denied. No screenshot is presented as evidence of a rendered 3D result.
- DOM/scene suites were not run: jsdom is absent from this checkout.
- Dimensions, floor counts and hidden details are estimates from images;
  this revision does not establish surveyed or exact 1:1 correspondence.

## Rollback and publication

Do not merge or publish until the user has reviewed and approved a specific
commit. Before merge, compare the PR head to the approved SHA and current main.
Rollback uses a separate reverting PR; do not rewrite main history. The base
commit preserves the original version of the changed files.
