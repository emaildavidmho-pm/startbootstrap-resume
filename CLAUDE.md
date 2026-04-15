# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # Install dependencies
npm start            # Build then serve with live reload (browser-sync on dist/)
npm run build        # Full production build: clean → pug → scss → scripts → assets
npm run build:pug    # Compile src/pug/ → dist/ (HTML)
npm run build:scss   # Compile src/scss/styles.scss → dist/css/styles.css
npm run build:scripts # Copy src/js/scripts.js → dist/js/
npm run build:assets # Copy src/assets/ → dist/
npm run clean        # Delete dist/
npm run start:debug  # Build + serve in debug mode
```

There is no test suite and no linter configured.

## Architecture

This is a static site build pipeline. Source lives in `src/`, output goes to `dist/` (gitignored). The `scripts/` directory contains the Node.js build orchestration.

### Build pipeline

| Source | Tool | Output |
|---|---|---|
| `src/pug/*.pug` | pug + prettier | `dist/*.html` |
| `src/scss/styles.scss` | sass + postcss/autoprefixer | `dist/css/styles.css` |
| `src/js/scripts.js` | copy | `dist/js/scripts.js` |
| `src/assets/` | copy | `dist/assets/` |

The watch mode (`scripts/sb-watch.js` via chokidar) selectively re-renders only what changed. Editing a Pug layout/include/mixin triggers a full Pug re-render; editing a non-layout `.pug` file only re-renders that file.

### SCSS structure

Bootstrap variables must be overridden **before** the Bootstrap import. The load order in `styles.scss` is:

1. `_variables.scss` (imports from `variables/` — colors, typography, spacing)
2. Bootstrap (via `node_modules`)
3. `_global.scss` — body/heading base styles
4. `components/` — `_sidenav.scss`, `_icons.scss`
5. `sections/` — `_resume-section.scss`

Key design tokens (defined in `src/scss/variables/`):
- Primary color: `$orange: #bd5d38` (overrides Bootstrap's `$primary`)
- Body font: Muli; Heading font: Saira Extra Condensed
- Sidebar width: `$sidebar-base-width: 17rem`
- Mobile navbar height: `$navbar-base-height: 3.375rem`

The sidebar layout switches at Bootstrap's `lg` breakpoint: below `lg`, a top navbar with `padding-top` offsets body content; at `lg`+, the sidebar is fixed-left with `padding-left` offset.

### Pug conventions

- `src/pug/index.pug` is the single page template — all resume content is inline here (no partials/layouts currently).
- Pug files matching `includes/`, `mixins/`, or `pug/layouts/` paths are treated as non-entrypoints and not compiled directly.
- Compiled HTML is formatted by prettier with `printWidth: 1000` and `htmlWhitespaceSensitivity: 'ignore'`.

### JavaScript

`src/js/scripts.js` is minimal vanilla JS: activates Bootstrap ScrollSpy targeting `#sideNav` and collapses the responsive navbar on nav-link click.
