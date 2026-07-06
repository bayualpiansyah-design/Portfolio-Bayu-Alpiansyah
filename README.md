# Portfolio — Bayu Alpiansyah

Personal portfolio website of **Bayu Alpiansyah**, a Product Designer based in Jakarta, Indonesia. Built from scratch with vanilla HTML, CSS, and JavaScript — no frameworks, no build tools.

🔗 **Live:** [bayualpiansyah-design.github.io/Portfolio-Bayu-Alpiansyah](https://bayualpiansyah-design.github.io/Portfolio-Bayu-Alpiansyah)

---

## Pages

| Page | File | Description |
|------|------|-------------|
| Home | `index.html` | Hero, selected work, stats, services, articles, testimonials |
| Work | `work.html` | 10 project cards with category filter |
| Case Study | `project.html` | SATUSEHAT Resep deep-dive |
| Articles | `articles.html` | Blog articles with search, filter & sort |
| About | `about.html` | Bio, timeline, certifications, tools |
| Contact | `contact.html` | Contact form, FAQ accordion |

---

## Features

- **Tri-lingual** — ID / EN / JP with one-click language switch, persisted via `localStorage`
- **Dark / Light mode** — dark by default; toggle saves preference
- **Custom cursor** — smooth ring with lerp lag effect
- **Page transitions** — clip-path exit + scale enter animation
- **Scroll reveal** — `IntersectionObserver` animates elements as they enter viewport
- **Animated counters** — numbers count up on scroll
- **Magnetic buttons** — subtle cursor-follow on interactive elements
- **3D tilt** — project cards tilt on hover
- **Portrait ornaments** — breathing glow, floating dots, cursor spotlight
- **Mega footer** — aurora orb, outline marquee name, live Jakarta clock
- **Articles** — search, category filter, date/A-Z sort; cards link to Medium
- **Contact form** — toast notification on submit
- **FAQ accordion** — smooth expand/collapse

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Markup | HTML5 (semantic) |
| Styling | CSS3 — custom properties, grid, clamp(), keyframe animations |
| Scripting | Vanilla JavaScript (ES6+) |
| Fonts | Instrument Serif · Manrope · Noto Sans JP (Google Fonts) |
| Icons | Inline SVG |
| Hosting | GitHub Pages |
| Dev server | `npx serve` |

---

## Project Structure

```
/
├── index.html          # Home
├── work.html           # Work gallery
├── project.html        # Case study
├── articles.html       # Articles
├── about.html          # About me
├── contact.html        # Contact
├── css/
│   └── style.css       # Design system + all styles (~1,200 lines)
└── js/
    ├── main.js         # All interactions & animations
    └── i18n.js         # Tri-lingual dictionary (ID / EN / JP)
```

---

## Running Locally

No install needed. Just serve the directory:

```bash
npx serve .
```

Then open [http://localhost:3000](http://localhost:3000).

---

## Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--brand` | `#3b5488` | Primary blue — buttons, accents |
| `--ink` | `#0f1218` / `#f6f6f2` | Body text (dark / light) |
| `--surface` | `#0f1218` / `#f6f6f2` | Page background |
| `--card` | `#171c26` / `#ffffff` | Card backgrounds |
| `--muted` | `#8a8f9e` / `#888` | Secondary text |

---

## Contact

- **Email** — [bayu.alpiansyah18@gmail.com](mailto:bayu.alpiansyah18@gmail.com)
- **LinkedIn** — [linkedin.com/in/bayu-alpiansyah](https://www.linkedin.com/in/bayu-alpiansyah/)
- **Medium** — [medium.com/@bayu.alpiansyah](https://medium.com/@bayu.alpiansyah)
- **Framer** — [bayux.framer.website](https://bayux.framer.website)

---

<p align="center">Designed & built with care in Jakarta · © 2026 Bayu Alpiansyah</p>
