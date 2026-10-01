# Continuum website

Open `index.html` directly in a browser, or serve this directory with any static web server. Home, documentation, and the interactive Three.js scenes work from both `file://` and HTTP URLs. Keep the `assets` directory beside the HTML files.

The production 3D script is `assets/harness3d.bundle.js`. It includes the local Three.js modules in a classic script, so browsers do not need to load ES modules from a file URL. No server, package installation, or runtime CDN is required to view the site. Google Fonts is optional; system fonts are used when it is unavailable.

## Editing the 3D scene

Edit `harness3d.js`, then rebuild the checked-in browser bundle:

```sh
npm ci
npm run build
npm run check
```

Three.js r180 and its license are in `assets/vendor`. Geometry and textures are generated locally by the scene. Do not load `harness3d.js` directly from HTML; it is the ES module source for the bundle.

## Shared site navigation

Both pages use the same `.header` markup and styles, and `site.js` handles their navigation and scroll progress. Keep link labels and order consistent when editing either header. Documentation links use `index.html#…` for homepage sections; homepage links use local anchors.
