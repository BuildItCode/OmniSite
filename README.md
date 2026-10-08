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

## Deploy to Railway

The root `Dockerfile` builds and checks the 3D bundle with Node, then serves the static site with Nginx. Only public site files are copied into the web root. No database, volume, secrets, or Node server are needed at runtime.

1. Commit and push these files, including the updated download links, to your GitHub repository.
2. In Railway, create a project from that GitHub repository (or connect it to an existing service). Use the repository root as the service root. Railway detects the `Dockerfile` automatically.
3. Leave custom build and start command overrides empty so the Dockerfile controls both steps.
4. In the service's deployment settings, set **Healthcheck Path** to `/healthz`.
5. Under **Settings → Networking → Public Networking**, choose **Generate Domain**. If prompted for a target port, use the service's `PORT` value, or `8080` when none is configured.

Nginx listens on all interfaces using Railway's `PORT` environment variable, with `8080` as the default. Railway handles public HTTPS. The container also provides a Docker healthcheck, but Railway's healthcheck path must be set separately as above.

After deployment, check `/`, `/docs.html`, and `/healthz`, and confirm the Windows and macOS download buttons for both Continuum and Continuum Design. Future pushes to the connected branch can trigger new deployments.

### Test the container locally

With Docker installed and running:

```sh
docker build -t continuum-site .
docker run --rm -p 8080:8080 continuum-site
```

Open `http://localhost:8080`. To verify a custom Railway-style port:

```sh
docker run --rm -e PORT=9090 -p 9090:9090 continuum-site
```

Official references: [Railway Dockerfiles](https://docs.railway.com/builds/dockerfiles), [healthchecks](https://docs.railway.com/deployments/healthchecks), and [public networking](https://docs.railway.com/networking/public-networking).
