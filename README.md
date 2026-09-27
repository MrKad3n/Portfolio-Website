# Portfolio-Website

Portfolio website for college and job applications. Includes my activities, skills, projects,
leadership experience, work experience, and education.

Instead of a page you scroll, the site is an **exploratory map**: a tilted 3D plane you pan, zoom,
and rotate. Each nav item is a region of that map, and every credential, school, role, and award is
a marker floating above the terrain that you hover to preview and click to open.

## Running it

No build step and no dependencies — it is plain HTML, CSS, and JavaScript. Open `index.html`
directly, or serve the folder if you want images and `localStorage` to behave exactly like
production:

```bash
python -m http.server 8000
```

Then visit <http://localhost:8000>.

## Controls

| Action | Mouse / touch | Keyboard |
| --- | --- | --- |
| Travel | Drag the map | Arrow keys or `W` `A` `S` `D` |
| Zoom | Scroll or pinch | `+` / `-` |
| Rotate the map | Rotate button in the map panel | `Q` / `E` |
| Jump to a region | Nav bar, or click the minimap | `Tab` through markers |
| Open a marker | Click it | `Enter` on a focused marker |
| Whole-map overview | Overview button | `0` |
| Read everything as a list | Open index | `I` |
| Close a panel | Close button | `Esc` |

`Flat` in the map panel drops the tilt to a straight top-down view, which is also the better mode
for anyone who finds the perspective hard to read. The site honours `prefers-reduced-motion` by
turning off the floating, bobbing, and camera easing.

Markers start as dim beacons and reveal themselves as you get close, so the progress counter in the
corner tracks how much of the map has been surveyed. That progress is remembered in `localStorage`.

## Files

| File | What it does |
| --- | --- |
| `index.html` | Page shell: nav, HUD, dossier panel, index overlay, and the world container |
| `content.js` | **All content.** Regions, markers, copy, coordinates, terrain labels, and trails |
| `world.js` | The engine: camera, marker building, discovery, dossier, minimap, input |
| `styles.css` | Design tokens, the 3D terrain, markers, and every panel |
| `script.js` | The interactive particle field drifting behind the map |

## Editing content

Everything you would want to change lives in `content.js`. A marker looks like this:

```js
{
    id: 'cert-java',
    region: 'experience',       // which region it belongs to
    code: 'CERT',               // short symbol shown on the marker
    kind: 'Certification',      // chip at the top of the dossier
    title: 'IT Specialist — Java',
    short: 'Certiport IT Specialist certification',
    x: -390, y: 585, z: 105,    // position on the map, and how high it floats
    featured: true,             // optional: brighter beacon
    image: 'images/photo.jpg',  // optional
    meta: ['Certification', 'IT Specialist'],
    body: `<p>The long description shown in the dossier.</p>`,
    tags: ['Java', 'OOP'],
    link: { label: 'Email Me', href: 'mailto:...' }  // optional button
}
```

Coordinates are world units with Basecamp at `(0, 0)`; `x` grows east and `y` grows south. Keep
about **340 units between markers in the same row** or their floating cards will overlap, and give
neighbouring markers different `z` values so the cards separate vertically.

Adding a region to `REGIONS` automatically adds it to the nav bar, the minimap, and the index.

## Before publishing

- Replace the placeholder address in the `email` marker (`mailto:hello@example.com`).
- Swap the project markers in The Build Yards for real project write-ups and screenshots.
- Reread the first-person copy in Off the Clock and About so it sounds like you.
