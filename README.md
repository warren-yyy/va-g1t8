# IS428 G1T8: mosquito-borne disease dashboards

**Why are some countries more vulnerable to mosquito-borne diseases than others?**

A website for IS428 Visual Analytics for Business Intelligence (SMU) that presents 13 Tableau dashboards as a story: dengue and malaria globally from 2000 to 2024, then Singapore as a case study. Group G1T8: Warren, Yubing, Shredha, Yurae.

It is a Next.js static export. Every page is prerendered to HTML in `out/`, with no server. All the editable content is in one file, [`src/site.config.ts`](src/site.config.ts).

## Commands

| Command | What it does |
| --- | --- |
| `npm install` | Install everything. Do this once. |
| `npm run dev` | Work on the site at http://localhost:3000 |
| `npm run build` | Build the static site into `out/` |
| `npm run preview` | Serve `out/` at http://localhost:4173. Set `PORT` to change the port. |
| `npm run check` | Show each dashboard's status, and fail on a malformed link |
| `npm run typecheck` | Check the types |
| `npm run lint` | Run ESLint |
| `npm run data` | Recompute the numbers from the CSVs (needs the source data) |
| `npm run refresh:clusters` | Download the latest NEA dengue clusters |

## Swap in a Tableau link

Each owner does this when their dashboard is published.

1. In Tableau Public, open your dashboard, choose **Share**, and copy the link.
2. In `src/site.config.ts`, find your dashboard and paste the link into `url`. Query strings and `/app/profile/...` links are fine, because the site cleans them up.
3. Run `npm run check`. It shows your link as `set`, and fails if the link is malformed.
4. Commit.

If `check` rejects a `/shared/...` link, open the dashboard's own page in Tableau Public and copy that link instead.

Fix the dashboard's size at **1200 x 800** in Tableau. The site scales it down on smaller screens. It never scales it up.

Until a core dashboard has a `url`, its panel says "Dashboard coming soon". The extras (D7, D12) stay hidden until they have one, and do not count towards the part's total on the homepage.

| ID | Title | Part | Owner | Type |
| --- | --- | --- | --- | --- |
| D1 | Home | 1 | Warren | core |
| D2 | Atlas | 1 | Warren | core |
| D3 | Trends | 1 | Warren | core |
| D4 | Climate | 2 | Yubing | core |
| D5 | Development | 2 | Yubing | core |
| D6 | Scorecard | 2 | Shredha | core |
| D7 | Climate twins | 2 | Yubing | extra |
| D8 | Resilient vs vulnerable | 3 | Shredha | core |
| D9 | Singapore pulse | 4 | Yurae | core |
| D10 | Weather lag | 4 | Warren | core |
| D11 | 2020 hotspots | 4 | Yurae | core |
| D12 | Housing and persistence | 4 | Yurae | extra |
| D13 | Global meets Singapore | 5 | TBD | core |

After swapping in D1's link, click a disease and check that the Wikipedia panel updates. That panel relies on a Tableau URL action, so it can only be tested with the real dashboard.

## Fill in howTo and takeaway

Both are in the dashboard's entry in `src/site.config.ts`. While a field is `null`, that line is left off the page, with no placeholder.

- `howTo`: one line on how to use the dashboard's controls. The seeded ones are drafts taken from the workbook, for owners to confirm.
- `takeaway`: the finding, in a sentence.
- `takeawayNote`: optional. Every number on the site must show its year, so if a takeaway has a number and no year, give the scope here, as D10 does.
- `alt`: optional. What the dashboard contains, for screen readers. It falls back to the question.

Only state what a dashboard or a script in this repo shows. Never describe the data as live: the global data is annual and ends in 2024.

The answer sentence is one value, `answerSentence`. The homepage marks it as a draft until D13 has a `url`, and the tag then goes away by itself.

## Regenerate the data

The generated files are committed, so a deploy never needs the source CSVs. You only need this if the cleaned data changes.

```
npm run data
```

It reads the CSVs from `SOURCE_DATA_DIR`, which defaults to the group's path on Warren's machine. Set it to your own copy if yours is elsewhere:

```
SOURCE_DATA_DIR="path/to/cleaned_data_final" npm run data
```

It computes each headline number, checks it against the value the site states, and **stops without writing anything** if one differs. If that happens because the data really changed, update the expected value in `scripts/build-data.ts` and the wording in `src/site.config.ts` together.

It writes `src/data/stats.json`, `public/data/globe.json`, `public/data/countries-50m.json`, `public/data/countries-50m-lite.json` and `src/data/sg-subzones.json`.

## Refresh the clusters

The small map on the homepage is a dated snapshot of NEA's dengue clusters. To update it:

```
npm run refresh:clusters
```

It downloads the file from data.gov.sg in Node, then rewrites `src/data/nea-clusters.json` and `public/data/sg-clusters-map.svg`, and the page label shows the new date. Commit both files. If the download fails, nothing is written and the old snapshot stays.

It cannot run in the browser: the file it needs is on S3 with no CORS header. To seed from the data pack instead, use `npm run refresh:clusters -- --from-file=path/to/nea_clusters_now.geojson`.

## Add an extra page

Do not build a user guide, poster or report page until the course is confirmed to require one.

1. Add it to `extraPages` in `src/site.config.ts`: `{ slug: 'user-guide', label: 'User guide' }`. The navbar picks it up automatically.
2. Create `src/app/user-guide/page.tsx`:

   ```tsx
   import type { Metadata } from 'next';

   export const metadata: Metadata = { title: 'User guide', description: 'How to use this site.' };

   export default function Page() {
     return (
       <div className="part">
         <header className="part__head">
           <h1 className="part__title">User guide</h1>
         </header>
       </div>
     );
   }
   ```

3. Run `npm run check`, which fails if the route is missing, then `npm run build`.

## Deploy on Vercel

1. Push this repo to GitHub.
2. In Vercel, choose **Add New > Project** and import the repo.
3. Keep the detected framework, **Next.js**, and the default settings. No environment variables are needed.
4. Deploy. Every push to `main` then deploys again.

To test the exact output first: `npm run build`, then `npm run preview`.

## How a few things work

- **Viz height is 827, not 800.** Tableau draws a 27px toolbar under the dashboard, inside the same iframe. At 800 the toolbar is clipped and the inner page scrolls. The one constant is `VIZ_SIZE` in `src/lib/tableau.ts`.
- **Part pages scroll natively.** Lenis cannot see wheel events over an iframe, so it runs on the homepage and Data & Methods only. To change that, set `smoothScrollOnPartPages`.
- **Two map files.** Drawing full 50m takes about 53ms a frame, so the globe rotates on `countries-50m-lite.json`, simplified from the same shapes at build time, and fetches full 50m the first time it stops.
- **`scripts/fix-export-paths.ts`** runs after every build. It works around a Next.js export bug on Windows that breaks link prefetching. On Linux, including Vercel, it finds nothing to do.
