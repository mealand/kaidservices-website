# Kaid Services Limited — kaidservices.com

The official website for **Kaid Services Limited**, an architecture and construction company working on industrial, commercial, residential and government projects.

**Current phase:** a "Watch it rise" coming-soon page. It previews the digitally tracked Kaid platform: design selection → Bill of Quantities → live execution monitoring → inventory and spend tracking → commissioning and handover.

## Tech stack

| Concern | Choice |
| --- | --- |
| Build tool | [Vite](https://vitejs.dev): static output, hashed assets |
| 3D hero | [three.js](https://threejs.org), procedural tower and crane, lazy-loaded |
| Animation | [GSAP](https://gsap.com) + ScrollTrigger |
| Smooth scroll | [Lenis](https://lenis.darkroom.engineering) |
| Signup endpoint | PHP 8 (`public/api/subscribe.php`), runs on the Namecheap host |
| Deploy | GitHub Actions → FTPS → Namecheap `public_html` |

All visual media (the 3D tower, sector illustrations and the live-camera feed) is generated in code. There are no stock assets or licences to manage.

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
npm run preview    # serve dist/ locally
npm run assets     # regenerate favicons + og-image.png from SVG
```

Requires Node 20+ (see `.nvmrc`).

## Project structure

```
├── index.html                 # Coming-soon page (semantic markup, SEO, OG tags)
├── 404.html                   # Branded not-found page
├── public/                    # Copied verbatim to dist/
│   ├── .htaccess              # HTTPS, caching, compression, security headers
│   ├── api/subscribe.php      # Launch-list signup (stores outside web root)
│   ├── favicon.svg, *.png     # Icons + social share image
│   ├── robots.txt, sitemap.xml, site.webmanifest
├── src/
│   ├── main.js                # Entry: wires up all modules
│   ├── config.js              # ← Launch date, email, endpoint
│   ├── styles/
│   │   ├── tokens.css         # Design tokens (colour, type, spacing, motion)
│   │   ├── base.css           # Reset, typography, buttons, utilities
│   │   └── components/        # One file per page section
│   └── scripts/
│       ├── core/motion.js     # GSAP/ScrollTrigger/Lenis setup, reduced-motion flag
│       ├── modules/           # Preloader, hero, countdown, sectors, process, feed, form…
│       ├── three/             # WebGL tower scene
│       └── illustrations/     # Procedural SVG sector drawings
├── scripts/generate-assets.mjs
└── .github/workflows/deploy.yml
```

## Common edits

- **Launch date / contact email**: `src/config.js`. The email also appears in `index.html` (footer, JSON-LD) and `public/api/subscribe.php`.
- **Colours and fonts**: `src/styles/tokens.css`.
- **Copy**: `index.html`.

## Accessibility and performance

- Honours `prefers-reduced-motion`: animations, smooth scroll and the WebGL loop are disabled.
- The three.js chunk is code-split and loads behind the preloader. The WebGL and canvas loops pause when off-screen or when the tab is hidden.
- Semantic landmarks, skip link, labelled form, `aria-live` form status, and focus-visible styles.

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md).
