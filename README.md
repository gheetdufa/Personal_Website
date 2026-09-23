# Dheer's little room

My interactive 3D portfolio, live at [dheerguda.com](https://dheerguda.com/).

Explore two connected rooms: browse my paintings, sit at the computer to open projects, hop onto the bed for my profile, read hand-picked research on the bookshelf, cycle favorite games on the TV, or spend time with Zuko. The opening wordmark becomes objects that populate the room. Lighting follows local time, with reduced-motion and keyboard controls available.

## Development

Requires Node.js 20.19 or newer.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5173/. Run `npm run check` for syntax validation and interaction tests.

The JavaScript, CSS, and HTML at the repository root are authored static files; no compilation step is needed. `assets/` contains artwork and project images, and `vendor/` contains Three.js and its MIT license. Tests use real scene geometry and a simulated DOM. Existing asset URLs from the previous portfolio remain available.

## Publishing

GitHub Pages publishes the root of `main` automatically after a push. Keep `CNAME` set to `dheerguda.com` and preserve `.nojekyll`. The custom domain, HTTPS configuration, and Pages branch settings remain unchanged.

## Main files

- `main.js`, `world.js`, `rooms.js`, and `navigation.js`: rooms, movement, interactions, and lighting.
- `intro-wordmark.js` and `room-intro.js`: the original letter reveal and room assembly sequence.
- `project-screens.js`, `desk-experience.js`, and `projects.js`: the physical monitor desktop and project windows.
- `wall-gallery.js` and `painting-photos.js`: original paintings and the animated gallery.
- `bed-experience.js`, `about-screen.js`, and `profile-ui.js`: bedside tablet and accessible profile/contact cards, including Human and Agent views.
- `bookshelf.js` and `reading-list.js`: the hand-picked reading collection. The retained research-feed module is not active in this mode.
- `television.js`, `switch-console.js`, and `zuko.js`: game screens, console, and dog interactions.
- `room-time.js` and `racing-sim.js`: local-time lighting, clock, racing yoke, and pedals.

Game artwork source attribution is recorded in `assets/games/sources.json`. Nintendo Smash artwork comes from its official game site; copyrights remain with the respective owners. The bundled Instrument Serif font includes its OFL license. Room artwork and photographs were supplied by Dheer.
