# Pillars Hub Application

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Project](#running-the-project)
- [Tabler UI](#tabler-ui)

## Prerequisites

Before you begin, ensure you have met the following requirements:

- **Node.js**: Use Node.js 20.19+ on the 20.x release line, or Node.js 22.12+ (required by Vite 7). You can download it from [Node.js](https://nodejs.org/).
- **NPM**: Node Package Manager (NPM) is required, which is included with Node.js.

## Installation

Follow these steps to set up the project on your local machine:

1. **Clone the Repository**  
   Open your terminal and run the following command to clone the repository:

   ```bash
   git clone https://github.com/PillarsHub/Application.git
   ```

2. **Navigate to the Project Directory**  
   Change directory into the project folder:

   ```bash
   cd Application
   ```

3. **Install Dependencies**  
   Install the required Node.js dependencies using NPM:

   ```bash
   npm install
   ```

## Running the Project

Once the installation is complete, you can start the development server with the following command:

```bash
npm run dev
```

This will start the application, and you should be able to access it in your web browser at [http://localhost:3000](http://localhost:3000).

## Tabler UI

The application uses `@tabler/core`, pinned to **1.7.3** in `package.json` and `package-lock.json`. There is no separate Bootstrap runtime: interactive components use `window.tabler` and the existing `data-bs-*` attributes.

`npm run dev` and `npm run build` automatically run `scripts/sync-tabler.mjs`. It copies the CSS, JavaScript, flag/payment images, and vector map runtime from the installed package to the ignored `public/vendor/tabler/` directory. Both the application and sandboxed HTML widgets load these same-origin assets. To refresh them manually, run `npm run sync:tabler`.

For future upgrades, install an exact `@tabler/core` version, update the `?v=` cache version in `index.html` and `src/features/widgets/components/htmlFrame.jsx`, and review [Tabler's upgrade guides](https://docs.tabler.io/ui/getting-started/upgrade). Keep `data-bs-navbar-position="combined"` on the root element so the sidebar and search header remain visible together. The app starts in light mode to preserve existing branding.

Tabler 1.7 requires modern browsers: Chrome/Edge 123+, Firefox 128+, or Safari/iOS Safari 17.5+. Validate desktop/mobile navigation, custom themes, modals, overlays, charts, and HTML widgets after changing the version.
