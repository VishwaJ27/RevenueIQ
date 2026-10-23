# RevenueIQ — Revenue Intelligence Inbox

RevenueIQ is a responsive, light-themed **sales and customer-conversation review workspace**. It helps managers inspect imported calls and meetings, understand activity patterns, review evidence-backed routing suggestions, resolve exceptions, and export an organized review package.

Built with **React 19, TypeScript, Vite, Tailwind CSS, Recharts, and Lucide icons**. The application runs client-side; imported workspace state is stored in the current browser's **IndexedDB**.

## Features

- **Overview dashboard:** KPIs, call/meeting breakdown, transcript coverage, routing distribution, source activity visualizations, and revision status based on uploaded records.
- **Imports & History:** upload compatible assessment JSON batches; identify repeated records; update existing records by revision rather than duplicating them; inspect import activity.
- **Intelligence Inbox:** search and filter imported records, inspect source metadata, review state, and available transcript evidence.
- **Conversation Intelligence:** review evidence-linked suggested categories and conversation summaries. The analysis is **deterministic, curated, and source-checked**; it is not powered by a live AI model.
- **Manager route overrides:** choose a route, record a reason, and retain manual decisions across source updates in the same browser.
- **Manager Brief & Exports:** download a ZIP containing routed record JSON files, CSV reports, a manifest, and a manager brief with grounded findings.
- **Light UI:** responsive layouts, readable records, charts, and accessible focus styling.

## Getting started

**Requirements:** Node.js 22.12 or newer and npm.

```bash
npm install
npm run dev
```

Open the local URL shown in the terminal (normally `http://localhost:5173`).

To confirm a production build:

```bash
npm run build
npm run preview
```

## Usage

1. Open **Imports & History** and upload compatible JSON source files.
2. Explore metrics and visualizations in **Overview**.
3. Open **Intelligence Inbox** to find and inspect a source record.
4. Use **Conversation Intelligence** to review supporting transcript evidence and save an optional manager routing correction.
5. Open **Manager Brief & Exports** to download the export ZIP.

Repeated imports should not multiply existing unique records. Later source revisions should update the matching record while preserving saved manual decisions. Verify these behaviors with your own authorized test data before presenting results.

**Data model note:** The app is designed around the expected call/meeting JSON schema; it is not a universal parser for arbitrary JSON. Its empty state is intentional: source records are not bundled into the deployed application.

## Data and analysis limitations

- Data, corrections, and import history are saved to IndexedDB **per browser and website origin**. They do not sync across devices or visitors, and can be lost if browser site data is cleared.
- Classification and insights are based on available, source-checked evidence; records with no usable transcript do not receive invented conversation analysis.
- The dashboard does **not** infer unsupported sales amounts, conversions, or pipeline values.
- Source inputs and exported packages can contain personal or confidential information. Keep them out of public repositories and only share them with authorized reviewers.

## Netlify deployment

This repository includes `netlify.toml` for single-page application routing and Node.js 22 builds.

1. Push this source repository to GitHub (avoid committing private data and generated exports).
2. In Netlify, choose **Add new project → Import an existing project**, and connect the GitHub repository.
3. Set build command to `npm run build`, publish directory to `dist`, and deploy the `main` branch.
4. Open the deployed URL in a private/incognito browser and verify the empty state, uploads, persistence, routing, and export downloads.

Netlify builds the site automatically from source; do **not** commit `node_modules/` or `dist/`.

## Project structure

```text
src/
  components/       Layout, interface, and analytics charts
  context/          Workspace state
  lib/              Parsing, persistence, analysis, and exports
  pages/            Dashboard, imports, inbox, intelligence, exports
public/             Static assets (if present)
index.html          Vite entry point
netlify.toml        Netlify build and SPA configuration
package.json        Dependencies and npm scripts
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start development server |
| `npm run build` | Type-check and produce `dist/` |
| `npm run preview` | Preview the built application |
| `npm run typecheck` | TypeScript project checks |
