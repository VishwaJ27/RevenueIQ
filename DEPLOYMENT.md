# RevenueIQ deployment / access guide

1. Run `npm install`, `npm run build`, then `npm run preview` locally. Do not deploy until the build works.
2. Confirm no private data is under `public/`, `src/`, `.env`, or the Git repository; the app starts empty by design.
3. **Netlify:** create a site from a *private* repository (build: `npm run build`; publish: `dist`) or drag/drop the built `dist` directory. `netlify.toml` includes SPA fallback.
4. **Vercel:** import the *private* repository, select Vite and output `dist`; `vercel.json` includes SPA fallback.
5. Open the deployed link in an incognito browser. Confirm `/`, `/inbox`, `/imports`, `/intelligence`, `/exports` all open and reload without 404 errors.
6. Confirm the deployed link is accessible to the authorized reviewer without permission requests. Share the private JSON inputs separately using the recruiter's approved channel; do NOT publish them as website assets.
7. Import both deliveries in a reviewer-like browser session. Confirm 44 records and 18 usable conversations. Export ZIP and inspect manifest. Repeat the update replay using Reset.
8. Paste your **actual** live URL into the final recruiter reply. The source package is not itself proof of deployment.

## Security warning
The hosted frontend is public code even if it was built from a private repo. Reviewers import the privately supplied test inputs into their own browser. Browser storage is not shared across devices. An unauthenticated public URL cannot securely preload confidential records for everyone; do not add raw source data to the deploy just for convenience.
