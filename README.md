# RevenueIQ — Revenue Intelligence Inbox

A browser-first, evidence-based manager workspace for the **Revenue Intelligence Inbox** practical assessment. React 19 + TypeScript + Vite + Tailwind CSS. Includes imports, revision-aware deduplication, persisted manual routing, extended source-grounded visualizations, dashboards, conversation review, and ZIP exports.

## Get running (Windows / VS Code)

Install Node.js **22.12+** (or a compatible newer LTS), open this folder in VS Code, then run:

```powershell
npm install
npm run dev
```

Open the local URL shown (usually http://localhost:5173). To check a release build:

```powershell
npm run build
npm run preview
```

The app runs entirely in the browser and saves imported state in **IndexedDB** for the current origin/browser profile. No account, server, API key, or third-party AI account is required.

## Load the assessment data

**Do not put the supplied source files inside `public/`, `src/`, or a public repository.** Extract the candidate assessment ZIP privately and find `candidate/data/01_initial.json` and `candidate/data/02_update.json`.

1. Open **Imports & History** and upload `01_initial.json`. Verify **44 records**, **30 calls**, **14 meetings**, **17** usable texts.
2. Upload the initial file again (including reordered record arrays) and confirm **44**, not 88.
3. In **Intelligence Inbox**, find `M07`, set a manual route other than its suggestion, and save a reason.
4. Upload `02_update.json`. Confirm **44 records**, now **18** usable texts, and **M07 at revision 2**.
5. Re-upload initial JSON. M07 must remain at revision 2; its manual route must not change.
6. Refresh the browser. The updated M07 transcript and manual route must remain.
7. Open **Conversation Intelligence** for evidence-linked findings, then **Manager Brief & Exports** to download `RevenueIQ-Exports.zip`.

**Reviewer startup:** the hosted frontend starts empty to avoid publishing assessment data. A reviewer needs the two separately supplied private JSON files. Import both in order for a post-update review; reset the workspace from Imports to perform the complete replay from scratch. An empty hosted app is not a preloaded dataset demonstration.

## Metric definitions

- **Selected activities:** number of distinct source keys (`source_type` + `source_id`); not total sales interactions in the company.
- **Calls / meetings:** distinct records by source type. The single source activity day is **21 August 2026, Asia/Kolkata**.
- **Usable-text coverage:** records with a nonempty call transcript or meeting transcript turn divided by selected records.
- **Source person:** call `rep_name` or meeting `organizer_email` (not an inferred attendee, salesperson or account owner).
- **Review and route counts:** classifications of imported, current records; a record can have secondary routes. A manually saved route takes precedence over the suggested primary.
- **Missing text:** cannot receive fabricated transcript analysis. No sales revenue, close rates, pipeline values, multiday trends or invented outcomes are shown.

## Analysis and evidence

Routing and summaries for the supplied 18 usable conversations are curated, deterministic and checked against exact call excerpts or numbered meeting turns **at runtime**. There are no live LLM calls. An evidence mismatch becomes an explicit non-current state. This is a selected sample, not a statistically representative sales funnel.

Three notable evidence-backed insights: M03 prepaid-vs-credit product mismatch (Sales), M07 customer product/UI issues (Customer Success), and C10 contact preference/unsolicited follow-up concern (Outreach & Coaching). The manager brief links those decisions to source excerpts. A considered and rejected decision was to treat every outbound/external interaction as a sales opportunity.

## Export structure

The **Download complete ZIP** action creates a new archive locally on each click. It contains `revenueiq-exports/manifest.json`, a `manager-brief/2026-08-21.md`, `reports/activity-summary.csv`, `reports/review-status.csv`, and record JSON files in active route folders. Each manifest entry includes source identity, source revision, suggested/effective routes, override/reason, evidence counts, freshness and active paths. An old route removed by a manual override does not appear as an active output path on the new export. The archive includes confidential source content: share privately with authorized reviewers only.

## Automated source-level release audit

This repository contains `scripts/release-audit.cjs`, which checks record counts, revision replay, M07 override, 18 grounded analyses, export consistency and source syntax. Its current environment-specific TypeScript import points to a globally installed compiler; for normal machines, use `npm run build` and the UI replay above. A portable test runner is provided as `scripts/release-audit-portable.cjs` and requires `npm install` first.

```powershell
npm run audit -- "C:\path\to\candidate\data"
```

This is **not** a substitute for production build and actual browser/IndexedDB checks.

## Deployment and reviewer access

Vercel and Netlify SPA routing configuration is included. For Netlify, connect a private Git repository or upload the compiled `dist` directory; build command `npm run build`, publish directory `dist`. For Vercel, framework Vite, build `npm run build`, output `dist`. Follow `DEPLOYMENT.md` for access/security checks. **No live deployment URL is included**: you must deploy in an account you control and confirm permissions yourself.

## Privacy

Never commit assessment source records or their exported analyses to a public repository. Do not place them in `public/` or embed them as JS assets. Keep deployable frontend separate from the private reviewer inputs and exports. IndexedDB is per browser/origin; it does not synchronize between reviewer sessions or devices. For reviewers to open a prepopulated state, you must perform imports in their own browser or provide them the private test inputs for self-service import.

## Submission status and remaining steps

The application source and tests are packaged. You must still verify a clean `npm install` and `npm run build`, test the browser replay, deploy or provide local startup instructions, privately deliver the final exported ZIP, add the required **five slides** and **three-minute continuous narrated screen recording**, and state approximate personal work time. See `SUBMISSION_CHECKLIST.md`.

Approximate candidate time spent: **fill in your own actual effort** (not guessed by the app).

## Light-theme dashboard additions

The overview contains additional source-only visualizations: transcript availability donut, current suggested/effective routing distribution, source timestamp activity chart, and source revision health. Counts update after JSON imports and manual routing decisions. No revenue estimates or sales conversion metrics are inferred.

Import UI accepts compatible batches generically, without mentioning evaluation fixture filenames. Source data is still private to the browser.
