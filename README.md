# IS428 G1T8: mosquito-borne disease dashboards

**Why are some countries more vulnerable to mosquito-borne diseases than others?**

A website for IS428 Visual Analytics for Business Intelligence (SMU) that presents its Tableau dashboards, split into 24 views, as a story on one long page: dengue and malaria globally from 2000 to 2024, then Singapore as a case study. Group G1T8: Warren, Yubing, Shredha, Yurae.

It is a Next.js static export, prerendered to HTML in `out/`, with no server. All the editable content is in one file, [`src/site.config.ts`](src/site.config.ts).

## The page

Everything is on `/`, in this order. Each section's id is its link, and the navbar links to them.

| Section | Id | What it holds |
| --- | --- | --- |
| Hero | `#home` | The main question, centred, above the globe and its legend, which are centred together as one unit. Exactly one screen tall. |
| The problem | `#problem` | The question in prose, a card for each disease, four numbers about the data, then how to use the site. |
| Part 1 Burden | `#burden` | D1, D2a-D2c, D3a-D3b |
| Part 2 Drivers | `#drivers` | D6a, D6c, D4a-D4b, D5a-D5b, D7 |
| Part 3 Dengue vs Malaria | `#dengue-vs-malaria` | D8a, D8b, D6b |
| Part 4 Singapore | `#singapore` | D9a-D9b, D10, D11a-D11b, D12a-D12b, then the NEA cluster map until D12b is published |
| Part 5 Global meets Singapore | `#global-meets-singapore` | D13 |
| Conclusion | `#conclusion` | Text only: the answer, one key finding per part, "What this means" once written, and a link to the limits |
| Data, methods & limitations | `#data-methods` | Always visible: a one-line intro, the key limits and the team. In one collapsible block: limitations, datasets, cleaning, how each number was computed, the r-by-year table, downloads and sources |

The navbar collapses into a menu below 1200px wide, where its eight links no longer fit.

Each part shows, in order: a kicker, its question as the title, `intro`, the view tabs, "Key takeaways" (`findings`), and one sentence into the next part (`bridge`).

**Tabs.** A part's views are tabs ("D1 Two diseases", "D2a Highest rates"...). Only the selected tab's view loads, and only once it is within about 800px of the screen. A view that has loaded stays loaded when you switch tabs, so its filters are kept. Views differ in height, so switching tabs can change the length of the page below the tab bar; the tab bar itself stays where it is. A part with one view (Part 5 today) shows it without a tab bar. Arrow keys, Home and End move between tabs; Enter or Space selects.

**The collapsible block.** "Full data, methods and limitations" is the site's only `<details>`, and `npm run build` fails if any other appears. It opens by itself when the page loads or the hash changes to `#data-methods` or anything inside that section (`#limitations`, `#sources`...), and when a link to one of those is clicked. See `src/components/MethodsDetails.tsx`.

**Deep links.** A view's id in lower case is its link: `/#d2b` scrolls to Part 1 and selects D2b, and `/#d6b` opens Part 3 on D6b. Choosing a tab updates the address bar the same way, so you can copy a link to any view.

Links from before the split still work, and open the first view of the old dashboard: `#d2` opens D2a, `#d3` D3a, `#d4` D4a, `#d5` D5a, `#d6` D6a, `#d8` D8a, `#d9` D9a, `#d11` D11a and `#d12` D12a. The list is `LEGACY_ANCHORS` in [`src/lib/anchors.ts`](src/lib/anchors.ts).

**Old links.** `/burden`, `/drivers`, `/dengue-vs-malaria`, `/singapore`, `/conclusion` and `/data-methods`, with or without `.html`, redirect permanently to the matching section. `/conclusion` goes to the Conclusion; Part 5 is now `#global-meets-singapore`, and `#d13` still opens D13. The redirects are in [`vercel.json`](vercel.json), so they work on Vercel and in `npm run preview`, but **not in `npm run dev`**.

## Commands

| Command | What it does |
| --- | --- |
| `npm install` | Install everything. Do this once. |
| `npm run dev` | Work on the site at http://localhost:3000 |
| `npm run build` | Build the static site into `out/` |
| `npm run preview` | Serve `out/` at http://localhost:4173, with the `vercel.json` redirects. Set `PORT` to change the port. |
| `npm run check` | Show each view's and part's status, warn on an unconfirmed height, and fail on a malformed link |
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

Each owner does this when their view is published.

1. In Tableau Public, open your view, choose **Share**, and copy the link.
2. In `src/site.config.ts`, find your view and paste the link into `url`. Query strings and `/app/profile/...` links are fine, because the site cleans them up.
3. Set its `height` (see [Set a view's height](#set-a-views-height)) if it is still `null`.
4. Run `npm run check`. It shows your link as `set`, and fails if the link is malformed.
5. Commit on your branch and open a pull request, as in [Make a change](#make-a-change).

If `check` rejects a `/shared/...` link, open the view's own page in Tableau Public and copy that link instead.

Until a core view has a `url`, its panel says "Dashboard coming soon". An extra view (`extra: true`) gets no tab at all until it has one; no view is an extra at the moment. A part can have at most 8 views; `npm run check` fails above that.

## The views

Each Tableau dashboard is split into views that answer one question each, and each view is one tab. `title` is the tab label, so the tab reads "D2a Highest rates". Heights marked "not confirmed" use 800 until set.

| ID | Title | Part | Owner | Type | Height |
| --- | --- | --- | --- | --- | --- |
| D1 | Two diseases | 1 | Warren | core | 600 |
| D2a | Highest rates | 1 | Warren | core | 650 |
| D2b | Where the cases are | 1 | Warren | core | 800 |
| D2c | Who stays on top | 1 | Warren | core | 600 |
| D3a | Change by region | 1 | Warren | core | 600 |
| D3b | Drill down | 1 | Warren | core | 750 |
| D4a | Hottest places | 2 | Yubing | core | not confirmed |
| D4b | Best temperature | 2 | Yubing | core | not confirmed |
| D5a | Factor by factor | 2 | Yubing | core | not confirmed |
| D5b | Richer, less disease? | 2 | Yubing | core | not confirmed |
| D6a | Scorecard | 2 | Shredha | core | not confirmed |
| D6c | How stable | 2 | Shredha | core | not confirmed |
| D7 | Climate twins | 2 | Yubing | core | not confirmed |
| D8a | Which disease where | 3 | Shredha | core | not confirmed |
| D8b | By income and region | 3 | Shredha | core | not confirmed |
| D6b | What separates them | 3 | Shredha | core | not confirmed |
| D9a | Weekly waves | 4 | Yurae | core | not confirmed |
| D9b | Peaks and worst years | 4 | Yurae | core | not confirmed |
| D10 | Weather lag | 4 | Warren | core | 800 |
| D11a | Week by week | 4 | Yurae | core | not confirmed |
| D11b | Hardest-hit subzones | 4 | Yurae | core | not confirmed |
| D12a | Housing | 4 | Yurae | core | not confirmed |
| D12b | Do hotspots repeat? | 4 | Yurae | core | not confirmed |
| D13 | Global meets Singapore | 5 | Shredha | core | not confirmed |

D6b sits in Part 3 on purpose: it answers that section's question. D7 stays a single view. `npm run check` prints this table from the config, so it is the up-to-date version.

**Cluster map.** D12b will show the current NEA clusters. Until D12b has a `url`, the Singapore section shows the site's own cluster map under its tabs; once it has one, that map is hidden.

### Add a view

1. In `src/site.config.ts`, add an entry to `dashboards` where it should appear: tabs follow the order of the list within each part. Copy a neighbouring entry and change `id` (the next letter, such as `D9c`), `title` (a short tab label), `part`, `question`, `owner` and `extra`. Leave `url` as `''` and the text fields as `null` until you have them.
2. Set its `height` as below, or leave it `null` for now.
3. If the view's part intro names dashboards, check it still reads correctly.
4. Run `npm run check`, then `npm run build`.

### Set a view's height

Views should be 1200 px wide; only the height differs.

1. In Tableau, open the dashboard and look at the **Size** panel on the **Dashboard** pane. Size should be **Fixed size**, 1200 wide.
2. Copy the height into the view's `height`, as a number of px: `height: 650`. Set it to the dashboard's real height: a larger number leaves empty space under the view.
3. If the dashboard is not 1200 wide, also set `width` (D11a and D11b are `width: 1000`). The site scales it up to fill the same 1200 px as the others; resizing it to 1200 in Tableau is sharper, and then `width` can be removed.
4. Run `npm run check`. The height column shows the dashboard height and the iframe height (27 more, for Tableau's toolbar).

While `height` is `null`, the site assumes 800 and `npm run check` warns "height not confirmed". If it is too small, the toolbar is clipped and the dashboard scrolls inside its frame. The site scales a view down on smaller screens and never scales it up.

## Fill in the text

Everything is in `src/site.config.ts`. While a field is `null`, it is left off the page, with no placeholder. The seeded text is a draft for the team to edit.

Each part (`parts`):

- `intro`: why these views are grouped together, in two or three sentences.
- `findings`: the paragraphs under "Key takeaways", or `null`.
- `bridge`: one sentence leading into the next part, or `null`.

Each view (`dashboards`):

- `description`: what is on the view, in a sentence or two. Describe what it shows, not what it finds.
- `howTo`: one line on how to use its controls. The seeded ones are drafts taken from the workbook, for owners to confirm.
- `takeaway`: the finding, in a sentence.
- `takeawayNote`: optional. Every number on the site must show its year, so if a takeaway has a number and no year, give the scope here, as D10 does.
- `height`: the dashboard height in px. See [Set a view's height](#set-a-views-height).
- `alt`: optional. What the view contains, for screen readers. It falls back to the question.
- `hideQuestion`: optional. Set `true` to leave out the question line under the tab title, when your Tableau dashboard already shows the view's `question` as its own title, so it is not said twice. Leave it off if the dashboard's title is different (D1 and D2a keep the line).
- `whyItMatters`: optional. The "so what" of the view. Setting it switches the view to the labelled layout (below).

`npm run check` lists which of these are still empty.

**Labelled layout.** A view with `whyItMatters` shows four headed sections instead of the plain description, how-to and takeaway: `description` under "What this dashboard shows", `howTo` under "How to use the dashboard", then below the embed `takeaway` under "Key insight" (in a callout box) and `whyItMatters` under "Why this matters". Write `description` for what is drawn and how to read it, `howTo` for what the viewer can click or pick, `takeaway` for the finding with its numbers, and `whyItMatters` for what it means for our question and what the next view tests. A view without `whyItMatters` looks as before, and `takeawayNote` still works in both layouts.

**Formatting inside view text** (`description`, `howTo`, `takeaway`, `whyItMatters`; not `findings`): `**bold**` shows in light blue, so use it for one or two phrases per paragraph, such as the key finding and the "Our conclusion" sentence, and not in `description` or `howTo`. `*italic*` stresses a single word. `[link text](#d5a)` links to another view and opens its tab. `npm run check` fails on a link to a view that does not exist, and on a stray `*` that would show as a raw asterisk. A text with an apostrophe goes in `"double quotes"`.

**Numbers.** Write every number in text as a `{token}`, such as `{sgDengue2019}`. Tokens come from `src/data/stats.json`, which `npm run data` computes and checks against the CSVs, and the build fails on an unknown one. To add a number, compute and `expect` it in `scripts/build-data.ts`, add it to `tokens`, and run `npm run data`.

Only state what a view or a script in this repo shows. Never describe the data as live: the global data is annual and ends in 2024.

The Conclusion is `conclusion` in `src/site.config.ts`:

- `answer`: the answer sentence. It shows a "Draft until D13 is published" tag until D13 has a `url`, and the tag then goes away by itself.
- `keyFindings`: one `{ part, text }` per part, shown as a list where each item links to its part. Part 3's is D8b's takeaway, written once and used in both places.
- `implications`: the paragraphs under "What this means", or `null`. While it is `null`, the heading is left out too.

`npm run check` shows whether `implications` is still empty.

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

It writes `src/data/stats.json`, `public/data/globe.json`, `public/data/countries-50m.json`, `public/data/countries-50m-lite.json`, `src/data/sg-subzones.json` and `src/data/diseases.json`.

## Refresh the clusters

The cluster map in the Singapore section is a dated snapshot of NEA's dengue clusters. To update it:

```
npm run refresh:clusters
```

It downloads the file from data.gov.sg in Node, then rewrites `src/data/nea-clusters.json` and `public/data/sg-clusters-map.svg`, and the page label shows the new date. Commit both files on a branch and open a pull request. If the download fails, nothing is written and the old snapshot stays.

It cannot run in the browser: the file it needs is on S3 with no CORS header. To seed from the data pack instead, use `npm run refresh:clusters -- --from-file=path/to/nea_clusters_now.geojson`.

## Add an extra page

The user guide is not a page: it is the "How to use this site" block at the end of `#problem`, written in `problem.guide` in `src/site.config.ts`. Add a page only for something else the course requires, such as a poster or report.

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

- **The iframe is 27px taller than the view.** Tableau draws a 27px toolbar under the dashboard, inside the same iframe. With an iframe only as tall as the dashboard, the toolbar is clipped and the inner page scrolls. `vizSize(height, width)` in `src/lib/tableau.ts` is the one place this is worked out: `width` wide (1200 by default), `height` + 27 tall, 800 + 27 while `height` is `null`.
- **Disease cards.** The Dengue and Malaria cards in `#problem` show the pathogen, vector and Wikipedia link from `disease_info.csv`, which `npm run data` copies into `src/data/diseases.json`. Only those three fields are used.
- **Native scrolling only.** Lenis was removed: the page has Tableau iframes throughout, and Lenis cannot see wheel events over an iframe. Nav clicks glide with CSS `scroll-behavior: smooth` (instant under reduced motion), and `scroll-padding-top` keeps section titles clear of the header. `InitialScroll` turns smooth scrolling on only after the first jump to a hash, because Chrome otherwise animates that jump too and stops partway.
- **A tab hidden mid-load restarts its viz.** Tableau never finishes loading a viz whose panel is hidden while it loads, so `DashboardEmbed` discards an unfinished viz when its panel hides and starts a fresh one when the panel is visible again. A viz that has finished loading is kept.
- **Two map files.** Drawing full 50m takes 50-80ms a frame, so the globe rotates on `countries-50m-lite.json`, simplified from the same shapes at build time, and fetches full 50m the first time it stops.
- **`scripts/check-build.ts`** runs after every build, after the path fix. It fails the build unless the built HTML has exactly one `<details>`, inside `#data-methods`.
- **`scripts/fix-export-paths.ts`** runs after every build. It works around a Next.js export bug on Windows that breaks link prefetching. On Linux, including Vercel, it finds nothing to do.
