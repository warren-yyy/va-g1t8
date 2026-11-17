# IS428 G1T8: mosquito-borne disease dashboards

**Why are some countries more vulnerable to mosquito-borne diseases than others?**

A website for IS428 Visual Analytics for Business Intelligence (SMU) that presents 13 Tableau dashboards as a story on one long page: dengue and malaria globally from 2000 to 2024, then Singapore as a case study. Group G1T8: Warren, Yubing, Shredha, Yurae.

It is a Next.js static export, prerendered to HTML in `out/`, with no server. All the editable content is in one file, [`src/site.config.ts`](src/site.config.ts).

## The page

Everything is on `/`, in this order. Each section's id is its link, and the navbar links to them.

| Section | Id | What it holds |
| --- | --- | --- |
| Hero | `#home` | The main question and the globe. Exactly one screen tall. |
| The problem | `#problem` | The question in prose, then four numbers about the data. |
| Part 1 Burden | `#burden` | D1-D3 |
| Part 2 Drivers | `#drivers` | D4-D7 |
| Part 3 Dengue vs Malaria | `#dengue-vs-malaria` | D8 |
| Part 4 Singapore | `#singapore` | D9-D12, then the NEA cluster map |
| Part 5 Conclusion | `#conclusion` | D13 |
| Data & Methods | `#data-methods` | Datasets, cleaning, downloads, how each number was computed, limitations, sources, team |

Each part shows, in order: a kicker, its question as the title, `intro`, the dashboard tabs, "What we found" (`findings`), and one sentence into the next part (`bridge`).

**Tabs.** A part's dashboards are tabs ("D1 Home", "D2 Atlas"...). Only the selected tab's dashboard loads, and only once it is within about 800px of the screen. A dashboard that has loaded stays loaded when you switch tabs, so its filters are kept. A part with one dashboard (Part 3 and Part 5 today) shows it without a tab bar. Arrow keys, Home and End move between tabs; Enter or Space selects.

**Deep links.** `/#d4` scrolls to Part 2 and selects D4. Choosing a tab updates the address bar the same way, so you can copy a link to any dashboard.

**Old links.** `/burden`, `/drivers`, `/dengue-vs-malaria`, `/singapore`, `/conclusion` and `/data-methods`, with or without `.html`, redirect permanently to the matching section. The redirects are in [`vercel.json`](vercel.json), so they work on Vercel and in `npm run preview`, but **not in `npm run dev`**.

## Commands

| Command | What it does |
| --- | --- |
| `npm install` | Install everything. Do this once. |
| `npm run dev` | Work on the site at http://localhost:3000 |
| `npm run build` | Build the static site into `out/` |
| `npm run preview` | Serve `out/` at http://localhost:4173, with the `vercel.json` redirects. Set `PORT` to change the port. |
| `npm run check` | Show each dashboard's and part's status, and fail on a malformed link |
| `npm run typecheck` | Check the types |
| `npm run lint` | Run ESLint |
| `npm run data` | Recompute the numbers from the CSVs (needs the source data) |
| `npm run refresh:clusters` | Download the latest NEA dengue clusters |

## Make a change

`main` is protected, so nobody can push to it directly. Every change goes through a branch and a pull request, and another group member must approve it before it can merge. You can't approve your own pull request, and you need Write access to the repo.

1. Get the latest `main` and create a branch:

   ```
   git switch main
   git pull
   git switch -c d4-link
   ```

2. Make your change, then run `npm run check` and `npm run build`.
3. Commit and push your branch:

   ```
   git add .
   git commit -m "Add the D4 Tableau link"
   git push -u origin d4-link
   ```

4. On GitHub, open a pull request into `main` and ask a group member to review it.
5. Once it's approved, merge it and delete the branch.

## Swap in a Tableau link

Each owner does this when their dashboard is published.

1. In Tableau Public, open your dashboard, choose **Share**, and copy the link.
2. In `src/site.config.ts`, find your dashboard and paste the link into `url`. Query strings and `/app/profile/...` links are fine, because the site cleans them up.
3. Run `npm run check`. It shows your link as `set`, and fails if the link is malformed.
4. Commit on your branch and open a pull request, as in [Make a change](#make-a-change).

If `check` rejects a `/shared/...` link, open the dashboard's own page in Tableau Public and copy that link instead.

Fix the dashboard's size at **1200 x 800** in Tableau. The site scales it down on smaller screens. It never scales it up.

Until a core dashboard has a `url`, its panel says "Dashboard coming soon". The extras (D7, D12) get no tab until they have one. A part can have at most 4 embeds; `npm run check` fails above that.

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

## Fill in the text

Everything is in `src/site.config.ts`. While a field is `null`, it is left off the page, with no placeholder. The seeded text is a draft for the team to edit.

Each part (`parts`):

- `intro`: why these dashboards are grouped together, in two or three sentences.
- `findings`: the paragraphs under "What we found", or `null`.
- `bridge`: one sentence leading into the next part, or `null`.

Each dashboard (`dashboards`):

- `description`: what is on the dashboard, in a sentence or two.
- `howTo`: one line on how to use its controls. The seeded ones are drafts taken from the workbook, for owners to confirm.
- `takeaway`: the finding, in a sentence.
- `takeawayNote`: optional. Every number on the site must show its year, so if a takeaway has a number and no year, give the scope here, as D10 does.
- `alt`: optional. What the dashboard contains, for screen readers. It falls back to the question.

`npm run check` lists which of these are still empty.

**Numbers.** Write every number in text as a `{token}`, such as `{sgDengue2019}`. Tokens come from `src/data/stats.json`, which `npm run data` computes and checks against the CSVs, and the build fails on an unknown one. To add a number, compute and `expect` it in `scripts/build-data.ts`, add it to `tokens`, and run `npm run data`.

Only state what a dashboard or a script in this repo shows. Never describe the data as live: the global data is annual and ends in 2024.

The answer sentence is one value, `answerSentence`. It leads the Conclusion's findings, marked as a draft until D13 has a `url`, and the tag then goes away by itself.

## Regenerate the data

The generated files are committed, so a deploy never needs the source CSVs. You only need this if the cleaned data changes.

```
npm run data
```

It reads the CSVs from `SOURCE_DATA_DIR`, which defaults to the group's path on Warren's machine. Set it to your own copy if yours is elsewhere:

```
# PowerShell
$env:SOURCE_DATA_DIR="path\to\cleaned_data_final"; npm run data

# macOS, Linux or Git Bash
SOURCE_DATA_DIR="path/to/cleaned_data_final" npm run data
```

It computes each headline number, checks it against the value the site states, and **stops without writing anything** if one differs. If that happens because the data really changed, update the expected value in `scripts/build-data.ts` and the wording in `src/site.config.ts` together.

It writes `src/data/stats.json`, `public/data/globe.json`, `public/data/countries-50m.json`, `public/data/countries-50m-lite.json` and `src/data/sg-subzones.json`.

## Refresh the clusters

The cluster map in the Singapore section is a dated snapshot of NEA's dengue clusters. To update it:

```
npm run refresh:clusters
```

It downloads the file from data.gov.sg in Node, then rewrites `src/data/nea-clusters.json` and `public/data/sg-clusters-map.svg`, and the page label shows the new date. Commit both files on a branch and open a pull request. If the download fails, nothing is written and the old snapshot stays.

It cannot run in the browser: the file it needs is on S3 with no CORS header. To seed from the data pack instead, use `npm run refresh:clusters -- --from-file=path/to/nea_clusters_now.geojson`.

## Add an extra page

Do not build a user guide, poster or report page until the course is confirmed to require one.

1. Add it to `extraPages` in `src/site.config.ts`: `{ slug: 'user-guide', label: 'User guide' }`. The navbar picks it up automatically, after the section links.
2. Create `src/app/user-guide/page.tsx`:

   ```tsx
   import type { Metadata } from 'next';

   export const metadata: Metadata = { title: 'User guide', description: 'How to use this site.' };

   export default function Page() {
     return (
       <div className="part part--page">
         <header className="part__head">
           <h1 className="part__title">User guide</h1>
         </header>
       </div>
     );
   }
   ```

3. Run `npm run check`, which fails if the route is missing, then `npm run build`.

## Deploy on Vercel

1. In Vercel, choose **Add New > Project** and import `warren-yyy/va-g1t8` from GitHub.
2. Keep the detected framework, **Next.js**, and the default settings. No environment variables are needed.
3. Deploy. Every pull request merged into `main` then deploys again.

Vercel reads [`vercel.json`](vercel.json) for the redirects from the old part URLs.

To test the exact output first: `npm run build`, then `npm run preview`.

## How a few things work

- **Viz height is 827, not 800.** Tableau draws a 27px toolbar under the dashboard, inside the same iframe. At 800 the toolbar is clipped and the inner page scrolls. The one constant is `VIZ_SIZE` in `src/lib/tableau.ts`.
- **Native scrolling only.** Lenis was removed: the page has Tableau iframes throughout, and Lenis cannot see wheel events over an iframe. Nav clicks glide with CSS `scroll-behavior: smooth` (instant under reduced motion), and `scroll-padding-top` keeps section titles clear of the header. `InitialScroll` turns smooth scrolling on only after the first jump to a hash, because Chrome otherwise animates that jump too and stops partway.
- **A tab hidden mid-load restarts its viz.** Tableau never finishes loading a viz whose panel is hidden while it loads, so `DashboardEmbed` discards an unfinished viz when its panel hides and starts a fresh one when the panel is visible again. A viz that has finished loading is kept.
- **Two map files.** Drawing full 50m takes 50-80ms a frame, so the globe rotates on `countries-50m-lite.json`, simplified from the same shapes at build time, and fetches full 50m the first time it stops.
- **`scripts/fix-export-paths.ts`** runs after every build. It works around a Next.js export bug on Windows that breaks link prefetching. On Linux, including Vercel, it finds nothing to do.
