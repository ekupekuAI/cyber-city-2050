# CYBER CITY 2050 — The Future Is Connected.

A mobile-first microsite for the CYBER CITY 2050 event. Visitors scan the QR code on the printed
poster, land here and switch the city on by connecting its three systems (AI, TRANSPORT, ENERGY)
to the central hub. When all three are linked, the page shows the final message:
**The Future Is Connected.**

It is a plain static site. There is no build step, no framework, no database, no login and no backend.

```
index.html    page structure and copy
styles.css    design tokens, layout, SVG states, reduced-motion rules
app.js        isometric city renderer (inline SVG) and interaction logic
favicon.svg   icon
```

## Design system

| Token      | Value     | Use                                   |
|------------|-----------|---------------------------------------|
| `--ink`    | `#111820` | type, line work, shaded faces         |
| `--signal` | `#FF5A36` | connections, active states, lights    |
| `--paper`  | `#F3EFE5` | background, lit faces                 |

Typefaces: **Archivo** (display, expanded width) and **IBM Plex Mono** (labels), both loaded from Google Fonts.
The page uses no photos and no gradients. The city is drawn as an inline SVG axonometric by `app.js`.
Shading comes from flat fills and a line hatch.

## Behaviour

- Tap a node on the map, or use the list of systems below it. Both use the same logic and work with a keyboard.
- Each activation draws an orange connection from the hub to that node, then lights up its district.
- When all three nodes are connected, the network closes, the hub ring draws, and a success panel replaces the controls.
- **Restart** puts the city back offline.
- **Reduced motion:** the site follows the OS `prefers-reduced-motion` setting. You can also turn motion off with the
  *Reduce motion* button in the header, and the choice is saved in `localStorage`. With reduced motion, lines appear
  without animation and the pulsing, spinning and shuttling stop.
- Screen readers hear progress through a polite live region. Focus moves to the success message when the city is complete.

## Run locally

You can open `index.html` in a browser directly. To test on a phone on the same Wi-Fi network, serve the folder instead:

```bash
python -m http.server 8080
```

or

```bash
npx serve .
```

Then open `http://localhost:8080` (or `http://<your-computer-ip>:8080` on the phone).

## Deploy to Vercel

**Dashboard:** push this folder to a GitHub repository, then go to vercel.com → *Add New → Project* → import the repo.
Set *Framework Preset* to **Other**, leave the build command empty, set the output directory to `.` and deploy.

**CLI:**

```bash
npx vercel --prod
```

Accept the defaults (no build command, current directory as output).

## Deploy to GitHub Pages

1. Create a repository and push these files to the root of the `main` branch.
2. In the repository, go to **Settings → Pages**.
3. Under *Build and deployment*, set **Source: Deploy from a branch**, **Branch: `main` / `(root)`**, then save.
4. After about a minute the site is live at `https://<user>.github.io/<repo>/`.

All asset paths are relative, so the site also works from a project sub-path.

## Connecting the poster

Once the site is deployed, make the poster's QR code from the final URL with any QR generator, and print it at
a minimum of about 2 × 2 cm with a quiet margin. Scan the printed proof with a few phones before the full print run.
Nothing in the site itself depends on the QR code.
