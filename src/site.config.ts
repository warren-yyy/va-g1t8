/*
 * All editable site content lives in this one file.
 *
 * Each entry in `dashboards` is one Tableau view (D2a, D2b...), shown as one tab.
 * To publish a view: paste its Tableau Public link into `url`, copy its height from
 * the dashboard's Size panel into `height`, then run `npm run check`. See README.md.
 *
 * Rendering rules
 * - Empty url on a core view: a "Dashboard coming soon" panel, no Tableau script.
 * - Empty url on an extra view: hidden completely. No view is an extra at the moment.
 * - null description, howTo or takeaway: that line is left out, with no placeholder.
 * - null alt: the question is used as the alt text.
 *
 * Numbers in text
 * - {tokens} are filled from src/data/stats.json, which scripts/build-data.ts
 *   computes from the CSVs and checks against the expected values.
 * - Every number on the site must show its year. If a takeaway has a number and
 *   no year, add a `takeawayNote` that gives the scope, as D10 does.
 */

export interface Dashboard {
  id: string;
  title: string;
  part: number;
  question: string;
  /**
   * True leaves out the question line under the tab title. Use it when the Tableau dashboard
   * already shows `question` as its own title, so it is not said twice. Leave it off (the
   * default) when the dashboard's title is different, as with D1 and D2a.
   */
  hideQuestion?: boolean;
  /** Tableau Public link. Empty until the dashboard is published. */
  url: string;
  /**
   * The Tableau dashboard's own height in px, from its Size panel. null until confirmed:
   * the embed then assumes 800 and `npm run check` warns.
   */
  height: number | null;
  /** The dashboard's width in px from its Size panel, only when it is not 1200. */
  width?: number;
  /** What is on the dashboard, in a sentence or two. null shows nothing. */
  description: string | null;
  howTo: string | null;
  takeaway: string | null;
  /** Optional scope shown under the takeaway, so its numbers carry their years. */
  takeawayNote?: string;
  /** "Why it matters", shown after the takeaway. null shows nothing. */
  whyItMatters?: string | null;
  /** Falls back to the question when null. */
  alt: string | null;
  owner: string;
  extra: boolean;
}

export interface Part {
  number: number;
  slug: string;
  title: string;
  question: string;
  role: string;
  /** Why these dashboards are grouped together. */
  intro: string;
  /** Paragraphs under "Key takeaways". null shows nothing. {tokens} come from stats.json. */
  findings: string[] | null;
  /** One sentence leading into the next section. null shows nothing. */
  bridge: string | null;
}

export interface NavItem {
  label: string;
  href: string;
}

/** A separate page, added to the navbar automatically. The page itself is src/app/<slug>/page.tsx. */
export interface ExtraPage {
  slug: string;
  label: string;
}

/** A number that describes the data, not a result. It counts up as it scrolls in. */
export interface StatTile {
  id: string;
  /** The year or years the number describes. */
  year: string;
  /** A {token}, so the number is computed and checked by scripts/build-data.ts. */
  value: string;
  text: string;
}

export interface ProblemSection {
  title: string;
  /** Draft for the team to edit. */
  intro: string;
  dataTitle: string;
  /** The user guide the course requires, at the end of #problem. Plain visible text. */
  guideTitle: string;
  guide: string[];
}

export interface DatasetRow {
  name: string;
  use: string;
  files: string;
}

export interface SourceLink {
  label: string;
  href: string;
}

export interface MethodNote {
  title: string;
  /** Each string is a paragraph. {tokens} come from src/data/stats.json. */
  body: string[];
}

export interface DataMethods {
  /** The section heading and its navbar label. The section's id stays #data-methods. */
  title: string;
  /** One sentence, always visible, saying what the section holds. */
  intro: string;
  /** One line of caveats, always visible. */
  keyLimits: string;
  /** The summary of the one collapsible block, which holds everything below the team. */
  detailsSummary: string;
  datasets: DatasetRow[];
  cleaning: string[];
  methods: MethodNote[];
  /** Shown word for word on the page, for transparency. */
  closestYearNote: string;
  limitations: string[];
  sources: SourceLink[];
}

export interface KeyFinding {
  /** The part this finding sums up. Its item links to that part's section. */
  part: number;
  /** {tokens} come from src/data/stats.json. */
  text: string;
}

/** The Conclusion section, text only, between Part 5 and Data, methods & limitations. */
export interface Conclusion {
  title: string;
  /** The answer to the main question. Shows a "Draft" tag until D13 has a url. */
  answer: string;
  /** One per part, in part order. */
  keyFindings: KeyFinding[];
  /** Paragraphs under "What this means". null shows nothing, not even the heading. */
  implications: string[] | null;
  /** The closing line, which ends in a link to Data, methods & limitations. */
  closingLead: string;
}

export interface SiteConfig {
  site: {
    name: string;
    course: string;
    group: string;
    mainQuestion: string;
    scope: string;
  };
  navigation: NavItem[];
  extraPages: ExtraPage[];
  parts: Part[];
  dashboards: Dashboard[];
  team: string[];
  problem: ProblemSection;
  statTiles: StatTile[];
  conclusion: Conclusion;
  dataMethods: DataMethods;
}

// Each of these appears in two places, so it is written once.

// DRAFT until D13 is built. It opens the Conclusion, with a "Draft" tag while D13's url is empty.
const answerSentence =
  'Heat shapes where both diseases can spread; wealth tracks who stays sick, strongly for malaria and barely for dengue.';

// D8b's takeaway, which is also the Conclusion's key finding for Part 3.
const d8bTakeaway =
  "**Malaria fades as countries get richer; dengue doesn't.** In 2019, nearly all low-income countries had high malaria, with dengue low or unreported. Among high-income countries, very few still had high malaria. The dengue-only group grows with income because richer countries lose their malaria, not because their dengue rises. The regions tell the same story from another angle: high malaria dominates Sub-Saharan Africa, while high dengue, alone or with malaria, is concentrated in Latin America and the Caribbean, East Asia and the Pacific, and South Asia. **Our conclusion: wealth takes countries out of the malaria group, but not out of the dengue group.**";

// In Part 4's findings and in Part 5's.
const sgMalariaStatus =
  "Our data counts {sgMalaria2019} malaria cases for Singapore in 2019, because WHO doesn't list it as endemic. WHO certified it malaria-free in 1982.";

const config: SiteConfig = {
  site: {
    name: 'IS428 G1T8',
    course: 'IS428 Visual Analytics for Business Intelligence, Singapore Management University',
    group: 'Group G1T8',
    mainQuestion: 'Why are some countries more vulnerable to mosquito-borne diseases than others?',
    scope: 'Dengue and malaria, global 2000-2024, then Singapore as a case study.',
  },

  // Anchors to the sections of the one page. Items in extraPages are added to the end
  // of this list automatically.
  navigation: [
    { label: 'Home', href: '/#home' },
    { label: '1 Burden', href: '/#burden' },
    { label: '2 Drivers', href: '/#drivers' },
    { label: '3 Dengue vs Malaria', href: '/#dengue-vs-malaria' },
    { label: '4 Singapore', href: '/#singapore' },
    { label: '5 Global meets Singapore', href: '/#global-meets-singapore' },
    { label: 'Conclusion', href: '/#conclusion' },
    { label: 'Data, methods & limitations', href: '/#data-methods' },
  ],

  // Empty for now. The user guide is a block at the end of #problem (problem.guide), not a
  // page. README.md has the steps for adding a page.
  extraPages: [],

  // intro, findings and bridge are drafts for the team to edit. Every number in findings
  // is a {token} computed and checked by scripts/build-data.ts.
  parts: [
    {
      number: 1,
      slug: 'burden',
      title: 'Burden',
      question: 'Where is the burden?',
      role: 'Sets the scene',
      intro:
        "Before asking why some countries are more vulnerable to mosquito-borne diseases than others, we first need to know where each disease is most common and how that has changed since 2000. We measure this as the rate: cases per 100,000 people, which lets large and small countries be compared fairly. D1 introduces the two diseases and how each disease has changed since 2000. D2 maps where each disease's rates are highest, where most of the cases are, and which countries stay at the top. D3 checks whether the global trends hold in every region, then lets you pick a region and look at its countries one by one. Dengue figures are cases that countries reported; malaria figures are WHO estimates.",
      findings: [
        'Dengue is rising fast, and in waves. Among the countries that report it consistently, the dengue rate in 2019 was about {dengueMultiple2019} times what it was in 2000, and it reached its highest level yet in 2024. It climbs through outbreak years that hit many countries at once, and each big outbreak has been larger than the last.',
        "Malaria is falling, but slowly and unevenly. In the countries where it is endemic, the rate fell by {malariaDrop2019} between 2000 and 2019, then edged back up. Some regions got rid of it almost completely, but Sub-Saharan Africa improved more slowly, so a growing share of the world's malaria is there.",
        'The two diseases hit different places in different ways. Almost all malaria ({malariaSSA2019} of estimated cases in 2019) is in Sub-Saharan Africa, and the same countries top the list year after year. Dengue is concentrated in Latin America & the Caribbean and Asia, and its leaders change with each outbreak, rich countries like Singapore included. Africa had no complete dengue reports before 2023, so part of this difference is about reporting.',
      ],
      bridge:
        'So what makes some countries more vulnerable than others, and why does the answer seem to differ by disease? The next section tests ten possible factors, from climate and wealth to clean water, sanitation and how crowded a country is, to see which ones go with more of each disease.',
    },
    {
      number: 2,
      slug: 'drivers',
      title: 'Drivers',
      question: 'What drives it?',
      role: 'Objective 1',
      intro:
        'With the burden mapped, this section tests the possible explanations. D6 first ranks every factor for each disease and shows how stable those links are over time; D4 then looks at climate and D5 at development and infrastructure. D7 compares countries with similar climates to separate climate from everything else.',
      findings: [
        'Heat decides where these diseases can exist, but not how bad they get. Almost no cooler country has either disease, yet hot countries range from a handful of cases to thousands.',
        'Malaria follows poverty. Out of the ten factors we tested, poor sanitation, unsafe water and low development track malaria most closely, and that has held in every year from 2000 to 2023. As countries gain clean water, toilets and higher incomes, malaria becomes very rare, even in places with the same climate as heavily affected ones.',
        "Dengue doesn't follow poverty in the same way. Clean water and sanitation barely matter for it in any year from 2000 to 2023, no single factor explains much of it, and its link with wealth keeps shifting over time. Even rich countries with good water and sanitation, such as Singapore, still have a lot of dengue.",
      ],
      bridge: 'A country can therefore be resilient to one disease and vulnerable to the other. The next section maps where that split happens.',
    },
    {
      number: 3,
      slug: 'dengue-vs-malaria',
      title: 'Dengue vs Malaria',
      question: 'Dengue vs malaria',
      role: 'Objective 2',
      intro:
        "The same factor may not work the same way for both diseases. D8 groups countries by whether they carry dengue, malaria, both or neither, and D6b shows which factors separate the two diseases most.",
      findings: [
        'Many countries carry one disease but not the other. In 2019, Singapore had {sgDengue2019} dengue cases per 100k and no malaria, while countries such as Brazil, Nicaragua and Lao PDR carried both.',
        'Malaria fades as countries get richer, but dengue does not: in 2019, 96% of low-income countries had high malaria, while 45% of high-income countries had high dengue but low malaria.',
        'Clean water and sanitation separate the two diseases most: where sanitation and water are poor, malaria is far more common but dengue barely changes, while temperature tracks both about equally.',
      ],
      bridge: 'Next, we test whether the global pattern holds in one city: Singapore.',
    },
    {
      number: 4,
      slug: 'singapore',
      title: 'Singapore',
      question: 'Singapore case study',
      role: 'Objective 3',
      intro:
        'Singapore is hot, wet, dense and rich. It has been certified malaria-free since 1982, yet still has recurring dengue outbreaks. D9 measures those waves, D10 tests whether weather leads them, and D11 and D12 zoom in on where the 2020 outbreak hit, whether housing explains it, and whether the same places are hit again.',
      findings: [
        'Singapore reported {sgDengue2019} dengue cases per 100k in 2019, about {ratio2019} times the median for high-income countries ({hiMedian2019}, across {hiN2019} reporting countries).',
        sgMalariaStatus,
        'Dengue comes in irregular waves: the largest from 2012 to 2024 were in 2020, peaking at 1,792 cases in one week, and 2022.',
        "In monthly data for 2012-2024 ({sgLagMonths} months), temperature leads Singapore's dengue by about 1-2 months, but the link is weak (r about {sgTempLagR}), as is every other weather link.",
        'The 2020 outbreak was worst in the Central region, led by Woodleigh (about 32 cluster cases per 1,000 residents), and housing type does not explain which subzones were hit.',
      ],
      bridge: "The next section sets Singapore's results against the global ones.",
    },
    {
      number: 5,
      slug: 'global-meets-singapore',
      title: 'Global meets Singapore',
      question: 'Global meets Singapore',
      role: 'Brings it together',
      intro:
        'D13 puts the global findings and the Singapore findings side by side, factor by factor, to answer the main question.',
      // The answer sentence is in the Conclusion, just after this section.
      findings: [
        'Comparing the same countries each year, income closely tracks malaria in all {yearsMalariaStronger} years from 2000 to 2024 but barely tracks dengue.',
        'Singapore fits the malaria pattern but breaks the dengue one: certified malaria-free since 1982, yet in 2019 its dengue rate was about {ratio2019} times the high-income median ({hiMedian2019} per 100k).',
        'Water and sanitation tell the same story: Singapore has universal access to both and no malaria, yet still has dengue, just as across countries they matter for malaria but barely for dengue.',
        'Inside Singapore, heat still matters but weakly: warmer months are followed by more dengue 1-2 months later (monthly data, 2012-2024). Rainfall, which goes with more dengue across countries, does not in Singapore.',
        'Crowding points the same way at both scales: more urban countries report less dengue, and in 2020 denser Singapore subzones had lower dengue cluster rates.',
      ],
      bridge: null,
    },
  ],

  // One entry per Tableau view, in page order. `title` is the short tab label.
  // `height` is the Tableau dashboard's own height in px, from its Size panel; the width
  // is 1200 unless `width` says otherwise. While height is null the embed assumes 800 and
  // `npm run check` warns.
  // Seeded description and howTo text are drafts for owners to confirm.
  dashboards: [
    {
      id: 'D1',
      title: 'Two diseases',
      part: 1,
      question: 'What are the two diseases, and how have they moved since 2000?',
      url: 'https://public.tableau.com/views/G1T8_D1-D3_D10/D1Home',
      height: 600,
      description:
        "The top row gives four headline figures for the year you choose: how many countries reported a full year of dengue, how many had malaria according to WHO estimates, how many dengue cases were reported, and how many malaria cases WHO estimates there were. Below, the line chart shows how each disease has changed since 2000. Both lines start at 100, which stands for each disease's own rate in 2000, so 200 means the rate doubled and 50 means it halved: the 100 is a starting point, not a number of cases. The dengue line covers only countries that reported dengue consistently, so the trend isn't distorted by countries starting or stopping reporting; the malaria line covers the countries where malaria is endemic. The side scale goes up in tenfold steps so both lines fit on one chart.",
      howTo:
        "The year slider changes the four figures only; the line chart always shows every year. Hover over a line to see that year's value.",
      takeaway:
        "**Since 2000, dengue and malaria have moved in opposite directions.** Dengue has risen steeply: by 2023, its rate was about ten times what it was in 2000. It didn't rise smoothly but in waves, with a big outbreak every few years, each larger than the last. Malaria has gone the other way, but slowly. Its rate fell by about a quarter between 2000 and 2019, and fewer countries had malaria at all. Yet there were almost as many malaria cases in 2019 as in 2000: the rate fell mainly because populations grew while the number of cases stayed level. Since 2019, the rate has been creeping back up. **Our conclusion: dengue is a growing problem that arrives in outbreaks, while malaria has retreated from many countries but hasn't gone down in total.**",
      whyItMatters:
        "Both diseases are carried by mosquitoes, **yet they're heading in opposite directions**. That suggests what makes a country vulnerable to one disease may not be what makes it vulnerable to the other, which is the idea the rest of this site tests. Next, we look at where each disease's rates are highest ([Where are rates highest?](#d2a)).",
      alt: null,
      owner: 'Warren',
      extra: false,
    },
    {
      id: 'D2a',
      title: 'Highest rates',
      part: 1,
      question: 'Where are rates highest?',
      url: 'https://public.tableau.com/views/G1T8_D1-D3_D10/D2aAtlas',
      height: 650,
      description:
        "A world map of each country's rate for the chosen disease and year, red for dengue and blue for malaria. The darker the colour, the higher the rate, and each colour band is ten times the one before. A blank country has no complete figures for that year. Beside the map, the bar chart ranks the countries with the highest rates, coloured by region. Countries with fewer than 1 million people are left out of the ranking so tiny islands don't crowd it out, but they still appear on the map.",
      howTo:
        'Pick Dengue or Malaria, and use "Show top _ countries" to set how many countries the bar chart ranks. Hover over a country on the map for its exact rate, or click a bar to find that country on the map.',
      takeaway:
        "**The places hit hardest by dengue are not the places hit hardest by malaria.** In 2019, the countries with the highest dengue rates were all in Latin America and Asia, led by Nicaragua, Honduras and Brazil; Singapore, one of the richest countries in the world, was 12th. The highest malaria rates were all in Sub-Saharan Africa, where the worst-hit countries had about 2 malaria cases for every 5 people in a single year. No country in the top 12 for one disease is in the top 12 for the other. Most of Africa is blank on the dengue map: no Sub-Saharan country reported complete dengue figures before 2023, so the blank means missing reports, not necessarily missing dengue. **Our conclusion: each disease has its own hotspots, and they barely overlap.**",
      whyItMatters:
        'Because the two diseases are concentrated in different countries, **what makes a country vulnerable is probably not the same for both**. Part 2 tests what explains the difference. Rates show where the risk to each person is highest; next, we look at where most of the cases are ([Where are the cases, and are they rising?](#d2b)).',
      alt: null,
      owner: 'Warren',
      extra: false,
    },
    {
      id: 'D2b',
      title: 'Where the cases are',
      part: 1,
      question: 'Where are the cases, and are they rising?',
      hideQuestion: true,
      url: 'https://public.tableau.com/views/G1T8_D1-D3_D10/D2bAtlas',
      height: 800,
      description:
        "On the left, a treemap of the chosen year. Each box is a country: the bigger the box, the more cases it had, and countries from the same region sit next to each other. The colour shows how the country's cases changed from the year before: red means more, green means fewer, and the darker the colour, the bigger the change. Beige means there's no figure for the year before. On the right, each bar shows how one year's cases were split between regions, from 2000 to 2023.",
      howTo:
        "Pick Dengue or Malaria and a year; the year changes the treemap only. Hover over a box to see that country's cases and change, or over a bar to see each region's share.",
      takeaway:
        "**Dengue cases jump up and down together; malaria cases barely move.** 2019 was a big dengue outbreak year, which is why almost every box is red: most countries reported more dengue than the year before, and more than half of them at least doubled. In a typical year, a country's dengue cases rise or fall by half or more. Switch to malaria and the boxes turn pale, because most countries' malaria cases change only a little from one year to the next. The bars show where the cases are over time. Latin America & the Caribbean has had the largest share of dengue in almost every year since 2000, and the rest shifts with where outbreaks strike. Malaria has become more and more concentrated in Sub-Saharan Africa, not because Africa's rate rose, but because other regions, especially South Asia, cut their malaria much faster. Africa's population has also grown so quickly that it now has more malaria cases than in 2000, even though each person's risk has fallen. **Our conclusion: dengue's burden rises and falls with outbreaks, while malaria's is steady and increasingly African.**",
      whyItMatters:
        "Two different kinds of burden call for two different explanations. **Dengue's comes and goes, while malaria's stays in the same places**, and Africa now carries almost all of it. Next, we check whether the same countries stay at the top year after year ([Which countries stay on top?](#d2c)).",
      alt: null,
      owner: 'Warren',
      extra: false,
    },
    {
      id: 'D2c',
      title: 'Who stays on top',
      part: 1,
      question: 'Which countries stay on top?',
      hideQuestion: true,
      url: 'https://public.tableau.com/views/G1T8_D1-D3_D10/D2cAtlas',
      height: 600,
      description:
        'The 10 countries with the highest average rate of the chosen disease from 2010 to 2023, and where each ranked every year, from 1 (highest) to 10. Each line is a country, coloured by region. A flat line means a country kept its place; a zigzag means it moved up and down. Countries with fewer than 1 million people are left out. 2024 is left out because many more countries, mostly in Sub-Saharan Africa, report complete dengue figures that year, which would shift the ranks.',
      howTo: 'Pick Dengue or Malaria, then hover over a line to follow one country through the years.',
      takeaway:
        "**Dengue's top countries keep swapping places; malaria's stay put.** Most of the dengue top ten are in Latin America, joined by Sri Lanka, Malaysia and Singapore. Their order changes almost every year as outbreaks come and go: Paraguay was first in 2020 and last two years later. Nicaragua is the exception, ranked first in almost every year since 2016. Switch to malaria and the lines flatten out. All ten countries are in Sub-Saharan Africa, only two have ever ranked first, and most hold roughly the same place year after year. **Our conclusion: high malaria is a lasting feature of the same countries, while high dengue comes and goes with outbreaks.**",
      whyItMatters:
        "Because malaria stays in the same countries year after year, whatever drives it probably changes slowly. Dengue's top ten includes some of the poorest countries in the Americas alongside Singapore, one of the richest in the world, which raises **a question Part 2 takes up: does what protects a country from one disease protect it from the other?** Next, we check whether the global trends from D1 hold in every region ([Is dengue rising and malaria falling everywhere?](#d3a)).",
      alt: null,
      owner: 'Warren',
      extra: false,
    },
    {
      id: 'D3a',
      title: 'Change by region',
      part: 1,
      question: 'Is dengue rising and malaria falling everywhere?',
      hideQuestion: true,
      url: 'https://public.tableau.com/views/G1T8_D1-D3_D10/D3aTrends',
      height: 600,
      description:
        "One row per region, with dengue in red and malaria in blue from 2000. As in D1, each line starts at 100, the region's own rate in 2000, and the grey line marks no change. The side scale goes up in tenfold steps so very different changes fit. A region with no dengue line has no countries that reported dengue consistently, and a malaria line that stops means the region got rid of malaria.",
      howTo:
        "Read each line against the grey line: above it means a higher rate than in 2000, below it means lower. Hover over a line for that year's figures.",
      takeaway:
        "**Dengue has risen in every region we can measure, while malaria has fallen in almost every region, at very different speeds.** Every dengue line ends well above the grey line; the Middle East's climbs steepest only because the region started with very few cases. For malaria, Europe & Central Asia got rid of it completely by 2015, and South Asia came close, cutting it by more than 90% between 2000 and 2023. Sub-Saharan Africa carries most of the world's malaria, but it improved more slowly than most other regions, and its line has barely moved since 2015. In the Middle East, North Africa, Afghanistan & Pakistan region, malaria rose again after a surge in Pakistan from 2022, and by 2023 it was back above its 2000 level. **Our conclusion: the global trends hold in most regions, but the region with the most malaria has improved the least.**",
      whyItMatters:
        'A global average can hide very different stories. **Malaria fell least where it was worst**, so the gap between the most and least affected regions has grown, and gaps like this are what our main question asks about. Next, we look below the regions at individual countries ([Where is each disease rising or falling?](#d3b)).',
      alt: null,
      owner: 'Warren',
      extra: false,
    },
    {
      id: 'D3b',
      title: 'Drill down',
      part: 1,
      question: 'Where is each disease rising or falling?',
      hideQuestion: true,
      url: 'https://public.tableau.com/views/G1T8_D1-D3_D10/D3bTrends',
      height: 750,
      description: [
        'Three linked charts, from regions down to a single country:',
        [
          "- Heatmap: how each region's rate changed from one year to the next. Red means it rose and blue means it fell; a grey row means the region has no data for that disease.",
          "- Slope chart: click a region to see up to 20 of its countries, each one's rate in the two years you choose. A line going up means the rate rose between those years, and the side scale goes up in tenfold steps.",
          "- Country trend: click a country in the slope chart to see its full history. The bars show each year's rate. The line is a moving average: each point averages that year with the years before it, which evens out one-off outbreak years so the overall trend is easier to see. A malaria line flat at 0 means malaria isn't endemic in that country.",
        ].join('\n'),
      ].join('\n\n'),
      howTo:
        "Pick a disease and the two years to compare (From and To). Click a region in the heatmap, then click a country's line in the slope chart. The Moving average control sets how many years each point on the line averages. The view opens on East Asia & Pacific and Singapore.",
      takeaway:
        "**Dengue swings from year to year, often in many regions at once, while malaria changes slowly and steadily.** In the dengue heatmap, whole columns turn the same colour: in 2019 dengue rose in every region with data, and in 2020 it fell in every one. The malaria heatmap is much paler and more often blue than red: small falls, year after year. The slope chart shows the same contrast between countries. Within East Asia & Pacific, dengue rose between 2010 and 2024 in countries such as Malaysia, Singapore and Thailand, and fell in others such as Lao PDR and Viet Nam, while malaria fell in almost every country in the region, and Cambodia, Lao PDR and Viet Nam now have almost none. Singapore's own history shows the dengue pattern clearly: quiet years broken by large outbreaks, the biggest in 2020, with a moving average that ends well above where it started. One caution: a few extreme changes in the heatmap, such as East Asia & Pacific's in 2022, partly reflect which countries reported that year, not only real change, because China has no complete dengue record for 2022. **Our conclusion: dengue rises and falls with outbreaks that strike many places at once, rich ones included, while malaria declines slowly and steadily.**",
      whyItMatters:
        "Outbreaks that rise and fall across many regions in the same years suggest that **vulnerability to dengue changes from year to year, not just from country to country**, while malaria's steady decline points to conditions that change gradually. Singapore has been free of malaria for decades, yet it still has large dengue outbreaks. Part 4 returns to Singapore in detail; first, Part 2 tests what explains why some countries are more vulnerable than others ([Which factor matters most, for which disease?](#d6a)).",
      alt: null,
      owner: 'Warren',
      extra: false,
    },
    {
      id: 'D6a',
      title: 'Scorecard',
      part: 2,
      question: 'Which factor matters most, for which disease?',
      hideQuestion: true,
      url: 'https://public.tableau.com:9443/views/G1T8_D6-D8/d6aScorecard?:language=en-US&publish=yes&:sid=&:redirect=auth&:display_count=n&:origin=viz_share_link',
      height: 800,
      description:
        "A scorecard of how strongly each of ten factors is linked to each disease across countries. Each coloured cell is a correlation (r) from −1 to 1 that shows how strong that link is: green means countries with more of that factor have more cases, purple means they have fewer, and pale means little or no link. The two count columns show how many countries each r value is calculated from, which tells you how reliable it is: the more countries, the more reliable the value. Factors are grouped into climate, demographic, infrastructure and socioeconomic.",
      howTo:
        'Move the year slider. Read across a row to compare the two diseases, and check the country counts: a value based on few countries, such as poverty, is less reliable.',
      takeaway:
        "**Malaria is tied to basic services and development; dengue mostly isn't.** Countries with poor sanitation and unsafe drinking water had far more malaria, while the same factors made little difference to dengue. Income, human development and health spending also followed malaria more closely than dengue. Heat is the one factor that matters in much the same way for both: hotter countries reported more of each disease. How crowded a country is made almost no difference to either. Poverty looks important for both, but only a small number of countries have poverty data, so treat it with caution. **Our conclusion: both diseases need heat, but malaria also depends on how developed a country is, and dengue largely doesn't.**",
      whyItMatters:
        "This is the clearest answer to *which factor matters most*: for ==malaria it is sanitation and clean water, while for dengue no infrastructure factor stands out==. But one year could be a fluke, so the next view checks how stable these links are over time ([How stable is each correlation over time?](#d6c)).",
      alt: null,
      owner: 'Shredha',
      extra: false,
    },
    {
      id: 'D6c',
      title: 'How stable',
      part: 2,
      question: 'How stable is each correlation over time?',
      hideQuestion: true,
      url: 'https://public.tableau.com:9443/views/G1T8_D6-D8/d6cStability?:language=en-US&publish=yes&:sid=&:redirect=auth&:display_count=n&:origin=viz_share_link',
      height: 800,
      description:
        "Each small chart follows one factor's correlation (r) with the chosen disease, year by year from 2000 to 2023. Charts are grouped and coloured by type of factor, and the dotted line marks 0, meaning no link. A line that stays on one side of 0 is a stable finding; one that wanders across 0 is not.",
      howTo: 'Choose Dengue or Malaria, then hover over a line for the exact value in any year.',
      takeaway:
        "**For malaria, the links are rock-steady.** From 2000 to 2023, countries with better sanitation, cleaner water, higher incomes, more human development and more health spending consistently had less malaria, and hotter countries consistently had more. Only poverty jumps around, because few countries have poverty data. **For dengue, the links are weaker and less settled.** Heat and rainfall point the same way throughout, but water and sanitation make little difference for most of the period, and the link with income was close to non-existent in the 2000s and only became clear from the mid-2010s. **Our conclusion: malaria's link to infrastructure is a lasting pattern, not a one-year result, while dengue has no infrastructure factor that holds steadily over time.**",
      whyItMatters:
        "Because the malaria pattern holds year after year, it supports our main finding that ==vulnerability depends on the disease==. Next, we look at climate on its own, starting with where each disease sits against how hot each country is ([Is disease highest where it's hottest?](#d4a)).",
      alt: null,
      owner: 'Shredha',
      extra: false,
    },
    {
      id: 'D4a',
      title: 'Hottest places',
      part: 2,
      question: "Is disease highest where it's hottest?",
      hideQuestion: true,
      url: 'https://public.tableau.com/views/G1T8_D4-D7/D4a',
      height: 650,
      description:
        "A world map showing where each disease is, set against how hot each country is. Darker pink means a hotter country. Each dot is a country's cases per 100,000 people: the bigger the dot, the more cases (dots appear from 1 case per 100,000).",
      howTo:
        'Pick Dengue or Malaria and a year. Hover over any country, including those without a dot, for its exact figures.',
      takeaway:
        "**Both diseases live in the hot belt around the equator**: almost every large dot sits on a dark-pink country, while the cooler north is nearly empty. But they don't live in the *same* hot places. Malaria is overwhelmingly an African disease (nearly all estimated cases in 2019 were in Sub-Saharan Africa), while dengue is concentrated in Latin America and the Caribbean, followed by East and Southeast Asia, the Pacific and South Asia. Much of Africa shows no dengue dot, which mostly means it isn't reported, not that it's absent. **Our conclusion: a country has to be hot to carry either disease, but being hot doesn't decide which one it gets.**",
      whyItMatters:
        "This is the climate clue to our main question: heat decides *where* a country can be vulnerable at all. But **equally hot countries end up very differently**, so heat can't be the whole answer. The next view looks at how far temperature really goes ([Is there a best temperature for the disease?](#d4b)).",
      alt: null,
      owner: 'Yubing',
      extra: false,
    },
    {
      id: 'D4b',
      title: 'Best temperature',
      part: 2,
      question: 'Is there a best temperature for the disease?',
      hideQuestion: true,
      url: 'https://public.tableau.com/views/G1T8_D4-D7/D4b',
      height: 650,
      description:
        "Two views of the same question: does disease rise with temperature? On the left, countries are grouped into 2 °C temperature bands, and each bar shows the typical number of cases per 100,000 people in that band. Pale bars are based on fewer than 5 countries, so they're less reliable. On the right, every country is a dot, placed by its average temperature and its cases. The side scale jumps in tenfold steps (1, 10, 100, 1,000) so small and large figures fit on one chart. The grey line shows the overall trend, and the green band marks the temperatures where lab studies find the disease spreads fastest.",
      howTo:
        'Switch between dengue and malaria and move the year. Hover over a bar to see how many countries it covers, or over a dot to see the country.',
      takeaway:
        "Dengue and malaria are **rare in cooler countries**: in every year we checked from 2005 to 2024, countries averaging below about 18 °C had almost no cases, while warmer countries had far more. The few exceptions are countries whose national average hides warmer regions, such as mountainous Bhutan and Nepal, or Argentina with its hot north. Beyond that, the two diseases behave differently. Dengue is usually highest in countries averaging about 22–26 °C, close to what lab studies predict; the very hottest band holds only a handful of countries, so its bar jumps around from year to year. Malaria is heaviest in the hottest countries, even hotter than lab studies would predict. Both diseases need the same warmth, so temperature alone can't explain why some hot countries have malaria and others have dengue. And at the same temperature, countries still differ hugely: some report a handful of cases, others thousands. **Our conclusion: climate decides whether a country can have these diseases, but not how much it suffers or which disease it suffers from.**",
      whyItMatters:
        "Climate decides where these diseases can exist, but **it doesn't explain the differences our main question is about**. To find out why one hot country suffers far more than another, and why the two diseases split, we turn to how developed each country is ([How does each factor relate to dengue and malaria?](#d5a)).",
      alt: null,
      owner: 'Yubing',
      extra: false,
    },
    {
      id: 'D5a',
      title: 'Factor by factor',
      part: 2,
      question: 'How does each factor relate to dengue and malaria?',
      hideQuestion: true,
      url: 'https://public.tableau.com/views/G1T8_D4-D7/D5a',
      height: 800,
      description:
        "This view tests the possible reasons a country might be more vulnerable, one at a time. Pick a factor in Compare against. The options cover climate (temperature, rainfall), wealth and development (GDP per person, the UN's Human Development Index, health spending, poverty), basic services (clean water, sanitation) and how people live (urban share, population density). The card scores how closely that factor tracks each disease across countries, from −1 to 1: near 0 means no link, near −1 or 1 a strong one, and a minus sign means countries with more of that factor tend to have fewer cases. Below, every country is a dot, with dengue on top and malaria below. The line through the dots shows the overall trend: a steep line means a strong link, a flat one a weak link. All factors at once shows a grid comparing every factor with every other, to reveal which ones rise and fall together.",
      howTo:
        'Choose a factor in Compare against and a year. Switch to All factors at once to see which factors move together, and click a dot to find that country in every chart.',
      takeaway:
        "**Malaria is a disease of poor living conditions.** Of all the factors we tested, it is most closely tied to basic sanitation, clean water, poverty and overall development: where these are poor, malaria is common, and where they're good, it is very rare. **Dengue doesn't work that way.** Good water and sanitation make little difference to it, and some countries with both still have a lot of dengue. In 2019, the factors most linked to dengue were wealth and heat, and even those links were only moderate, so no single factor explains why some countries have far more dengue than others. How crowded a country is makes no difference to either disease. One result looks surprising at first: more urban countries report less dengue. But urban countries also tend to be richer, and among countries of similar wealth, city living makes much less difference. So wealth, more than city living, is linked to lower dengue. **Our conclusion: what makes a country vulnerable depends on the disease. Poor living conditions explain malaria, but not dengue.**",
      whyItMatters:
        "This is the heart of our answer: **vulnerability is disease-specific.** A country that improves sanitation, clean water and incomes can become almost free of malaria and still be vulnerable to dengue, which is exactly Singapore's situation. Next, we look at wealth on its own: what happens to each disease as countries get richer ([Does disease fall as countries get richer?](#d5b)).",
      alt: null,
      owner: 'Yubing',
      extra: false,
    },
    {
      id: 'D5b',
      title: 'Richer, less disease?',
      part: 2,
      question: 'Does disease fall as countries get richer?',
      hideQuestion: true,
      url: 'https://public.tableau.com/views/G1T8_D4-D7/D5b',
      height: 600,
      description:
        "Countries grouped into the World Bank's four income groups, from low to high income, with dengue on top and malaria below. Each dot is a country. The grey box covers the middle half of countries in each group, and the line inside it marks the typical country. The side scale counts tenfold steps: 1 means 10, 2 means 100 and 3 means 1,000 cases per 100,000 people.",
      howTo: 'Move the year slider, and hover over a dot for the country and its exact figure.',
      takeaway:
        "**As countries get richer, malaria drops sharply.** From 2005 to 2024, roughly one person in four or five caught malaria each year in the typical low-income country, while in upper-middle- and high-income countries almost no one did. Dengue doesn't follow that pattern: in every one of those years, setting aside low-income countries, it was heaviest in upper-middle-income countries, fast-growing places such as Brazil, Mexico and Malaysia. It was lower but still present in high-income countries, including Singapore and several tropical islands. Very few low-income countries report dengue at all, so that column says more about reporting than about risk. **Our conclusion: getting richer goes with the end of malaria, but not with the end of dengue.**",
      whyItMatters:
        "This shows the split behind our main question in its simplest form: **richer countries escape malaria, but not dengue.** That's why a rich country like Singapore can be free of malaria yet still have large dengue outbreaks. Comparisons across countries still mix climate with wealth, since hotter countries tend to be poorer, so the last view compares countries that share the same climate ([Does the same climate mean the same disease?](#d7)).",
      alt: null,
      owner: 'Yubing',
      extra: false,
    },
    {
      id: 'D7',
      title: 'Climate twins',
      part: 2,
      question: 'Does the same climate mean the same disease?',
      hideQuestion: true,
      url: 'https://public.tableau.com/views/G1T8_D4-D7/D7Climatetwins',
      height: 800,
      description:
        'Pick a country, and the table finds its “climate twins”: countries whose average temperature and rainfall from 2010 to 2023 are close to it. Twins are listed from richest to poorest, and the chosen country is highlighted in dark grey. Each row has bars for temperature, rainfall, dengue, malaria, GDP per person and access to clean water, so you can see at a glance whether countries with the same weather end up with the same diseases. The line above the table gives the range of dengue across these countries and how many of them have malaria. Disease figures are yearly averages per 100,000 people. A blank dengue cell means the country never reported a full year of dengue.',
      howTo:
        'Choose a country in Compare with (Singapore is the default). The two sliders set how close “the same climate” has to be: widen them to get more twins, or narrow them for closer matches. Click any country in the table to see its own twins.',
      takeaway:
        "**Countries with almost the same weather as Singapore end up with very different amounts of dengue and malaria.** Singapore has five climate twins: Seychelles, Thailand, Sri Lanka, El Salvador and Cambodia. Their dengue rates are far apart: Seychelles has about forty times as much dengue as Thailand. And being rich doesn't seem to protect against dengue: Singapore, the richest of the six, has more dengue than Thailand or Cambodia. Malaria works differently. Cambodia, the poorest of the six, is the only one where malaria is common. Thailand has very little, and the other four have almost none. The same pattern shows up for other countries. For example, if you pick Seychelles, its 18 climate twins include some of the poorest countries in West Africa, such as Guinea and Liberia, where roughly one person in three catches malaria every year. Its richest twins, such as Singapore and Trinidad and Tobago, have almost none. **Our conclusion: the same climate does not mean the same disease. Being richer goes with having less malaria, but not with having less dengue.**",
      whyItMatters:
        "Hotter countries also tend to be poorer, so it's hard to tell whether heat or poverty is doing the damage. Comparing countries with the same climate is the closest our data gets to a fair test, because it takes heat and rain out of the picture. What's left matches what we found earlier: malaria follows wealth and basic services like clean water and toilets, but dengue doesn't. Its differences probably come from something else, such as how cities are built, how mosquitoes are controlled and how well cases are reported. Next, we look at where in the world each disease dominates ([Which countries carry which disease?](#d8a)).",
      alt: null,
      owner: 'Yubing',
      extra: false,
    },
    {
      id: 'D8a',
      title: 'Which disease where',
      part: 3,
      question: 'Which countries carry which disease?',
      hideQuestion: true,
      url: 'https://public.tableau.com:9443/views/G1T8_D6-D8/D8aWhichcountries?:language=en-US&publish=yes&:sid=&:redirect=auth&:display_count=n&:origin=viz_share_link',
      height: 800,
      description:
        "Every country is placed by its dengue rate (across) and its malaria rate (up); both scales jump in tenfold steps, so 1 means 10, 2 means 100 and 3 means 1,000 cases per 100,000 people. The dashed lines are the thresholds: a country right of the vertical line has high dengue, and one above the horizontal line has high malaria. That splits countries into four profiles, shown by colour. Select countries to draw their profiles in the chart below, where each factor is rescaled from 0 (the lowest country that year) to 1 (the highest), so you can see where each country stands on climate, wealth and basic services.",
      howTo:
        'Move the year and change the thresholds to see countries switch profile. Click the dots to select countries, compare their lines below, and click empty space to clear.',
      takeaway:
        "**Significant numbers of countries carry one disease but not the other.** Singapore is a clear example: in 2019 it had heavy dengue and no malaria, while countries such as Brazil, Nicaragua and Lao PDR carried both. The profiles show what separates the groups: countries with high malaria tend to have low income, low health spending and poor sanitation, while dengue-high, malaria-low countries such as Singapore sit near the top on all three. Both groups are hot. **Our conclusion: a country can be resilient to malaria and vulnerable to dengue at the same time, and infrastructure is what tells the two apart.**",
      whyItMatters:
        "This is the split behind our main question, shown country by country. ==A country that has left malaria behind can still be vulnerable to dengue==, because the things that go with less malaria (income, health spending and sanitation) don't appear to protect against dengue. ==Heat is shared by both groups, so it can't be what separates them.== Next, we step back to see how the four profiles spread across income levels and regions ([How does it vary by income and region?](#d8b)).",
      alt: null,
      owner: 'Shredha',
      extra: false,
    },
    {
      id: 'D8b',
      title: 'By income and region',
      part: 3,
      question: 'How does it vary by income and region?',
      hideQuestion: true,
      url: 'https://public.tableau.com:9443/views/G1T8_D6-D8/D8bIncomeandRegion?:language=en-US&publish=yes&:sid=&:redirect=auth&:display_count=n&:origin=viz_share_link',
      height: 800,
      description:
        "Two summaries of the four profiles from the previous view. The top chart takes the countries in each World Bank income group and shows what share fall into each profile; the bottom chart does the same for each region. High means at least 10 cases per 100,000 people a year, the default thresholds in the previous view. Countries with low malaria and no complete dengue record are left out.",
      howTo: 'Move the year slider, and hover over a profile to highlight it in both charts.',
      takeaway: d8bTakeaway,
      whyItMatters:
        "The split follows income for malaria and geography for both diseases. ==Richer countries lose their malaria but not their dengue==, and the regions show where each disease concentrates: malaria in Sub-Saharan Africa, dengue across Latin America, Asia and the Pacific. Next, we pin down which factors separate the two diseases most ([Which factors separate dengue from malaria?](#d6b)).",
      alt: null,
      owner: 'Shredha',
      extra: false,
    },
    // In Part 3 on purpose: it answers that section's question.
    {
      id: 'D6b',
      title: 'What separates them',
      part: 3,
      question: 'Which factors separate dengue from malaria?',
      hideQuestion: true,
      url: 'https://public.tableau.com:9443/views/G1T8_D6-D8/d6bDumbbell?:language=en-US&publish=yes&:sid=&:redirect=auth&:display_count=n&:origin=viz_share_link',
      height: 800,
      description:
        "For each factor, the red dot is its correlation (r) with dengue and the blue dot its correlation with malaria, from −1 to 1. The grey line joins the two: the longer the line, the more differently that factor relates to each disease. Factors are sorted with the biggest gap at the top.",
      howTo: 'Move the year slider, and hover over a dot for its exact value.',
      takeaway:
        "**Basic services separate the two diseases most.** In 2019, sanitation and clean water showed the biggest difference: where they were poor, malaria was far more common, but dengue barely changed. Poverty and human development also separate the two diseases, with malaria showing the stronger link. At the other end, temperature barely separates them at all: hotter countries have more of both. **Our conclusion: heat is shared, but clean water, sanitation and development are what set malaria apart from dengue.**",
      whyItMatters:
        "This explains how a country can escape one disease and not the other: ==better water and sanitation go with far less malaria but barely touch dengue==. Singapore, with universal clean water and sanitation, is the natural test case, so the next section looks inside it.",
      alt: null,
      owner: 'Shredha',
      extra: false,
    },
    {
      id: 'D9a',
      title: 'Weekly waves',
      part: 4,
      question: "How big and regular are Singapore's dengue waves?",
      hideQuestion: true,
      url: 'https://public.tableau.com:9443/views/HowbigandregularareSingaporesdenguewaves/HowbigandregularareSingaporesdenguewaves?:language=en-US&publish=yes&:sid=&:redirect=auth&:display_count=n&:origin=viz_share_link',
      height: 600,
      description:
        "Every week of dengue in Singapore from 2012 to 2024. The orange line is the number of cases reported each week, and the blue line is a moving average that smooths out week-to-week noise so the waves stand out. The grey line marks the average week across the whole period, so anything above it is a busier-than-usual week.",
      howTo:
        "Change *Average over (weeks)* to smooth the blue line more or less. Hover over either line for the exact count in any week.",
      takeaway:
        "**Singapore's dengue comes in waves, but not on a regular cycle.** Waves came in 2013, 2014, 2016, 2019, 2020, 2022 and 2024, with gaps of one to three years between them, and 2017-2018 stayed well below the average almost all the time. The waves are also very different in size. **The 2020 wave was the largest, peaking at 1,792 cases in a single week, and 2022 came close**: both were roughly twice the height of any wave before 2019. **Our conclusion: dengue keeps coming back in Singapore, and some waves are far bigger than others.**",
      takeawayNote: "Singapore, weekly cases, 2012-2024. 2012-2022 from the MOH weekly bulletin (dengue fever and DHF), 2023-2024 from OpenDengue.",
      whyItMatters:
        "Singapore has the clean water, sanitation and income that go with ==almost no malaria==, yet it still has large dengue outbreaks, which matches the global finding that development barely touches dengue. Because the waves are irregular, the next view asks when in the year they peak and which years were worst ([When does dengue peak, and which years were worst?](#d9b)).",
      alt: null,
      owner: 'Yurae',
      extra: false,
    },
    {
      id: 'D9b',
      title: 'Peaks and worst years',
      part: 4,
      question: 'When does dengue peak, and which years were worst?',
      hideQuestion: true,
      url: 'https://public.tableau.com:9443/views/Whendoesdenguepeakandwhichyearswereworst/Whendoesdenguepeakandwhichyearswereworst?:language=en-US&publish=yes&:sid=&:redirect=auth&:display_count=n&:origin=viz_share_link',
      height: 600,
      description:
        "Two views of the same weekly cases. On the left, each row is a year and each column a week of the year (weeks 1-53): the darker the square, the more cases that week. On the right, each bar is how much a year's total cases changed from the year before. Bars above zero are rises and bars below are falls. 2012 has no bar because there is no earlier year to compare it with.",
      howTo:
        "Read along a row to see when that year's cases built up and peaked. Hover over a square for its weekly count, or over a bar for the exact change.",
      takeaway:
        "**Most big waves peak in the middle of the year.** In 2013, 2014, 2019, 2020 and 2022 the darkest weeks fall roughly between weeks 20 and 35 (about May to August), though 2016's wave came at the very start of the year. **The size of a year swings hard.** The biggest jumps were 2022 (about +490% on 2021), 2019 (about +380%) and 2013 (about +370%). 2020 rose a further 120% or so on an already-high 2019, which made 2019-2020 a two-year outbreak. Big years were followed by sharp falls: about -80% in 2017, -85% in 2021 and -70% in 2023. **Our conclusion: dengue follows a mid-year season, but how big each season gets changes a lot from year to year.**",
      takeawayNote: "Singapore, weekly cases, 2012-2024.",
      whyItMatters:
        "A regular mid-year peak points to a seasonal cause, such as weather. But ==the size of the waves changes far more than the seasons do==, so something beyond the calendar must decide how bad a year gets. The next view tests whether local weather leads dengue ([Does local weather lead dengue, and by how many months?](#d10)).",
      alt: null,
      owner: 'Yurae',
      extra: false,
    },
    {
      id: 'D10',
      title: 'Weather lag',
      part: 4,
      question: 'Does local weather lead dengue, and by how many months?',
      hideQuestion: true,
      url: 'https://public.tableau.com/views/G1T8_D1-D3_D10/D10WeatherLag',
      height: 800,
      description:
        "How strongly each weather variable tracks dengue at lags of 0-6 months, the chosen weather series overlaid on monthly dengue cases, a month-by-month scatter, and Singapore's typical year.",
      howTo: 'Choose a weather variable and a lag in months, then compare the charts.',
      takeaway:
        'Temperature leads dengue by about 1-2 months, but the link is weak (r about {sgTempLagR}), as is every other weather link.',
      takeawayNote: 'Singapore, monthly data, 2012-2024 (156 months).',
      alt: null,
      owner: 'Warren',
      extra: false,
    },
    {
      id: 'D11a',
      title: 'Week by week',
      part: 4,
      question: 'Where did the 2020 outbreak hit, week by week?',
      hideQuestion: true,
      url: 'https://public.tableau.com:9443/views/Wheredidthe2020outbreakhitweekbyweek/Wheredidthe2020outbreakhitweekbyweek?:language=en-US&publish=yes&:sid=&:redirect=auth&:display_count=n&:origin=viz_share_link',
      height: 600,
      width: 1000,
      description:
        "Singapore's 2020 outbreak, week by week. The map shows the active dengue clusters in the chosen week: the darker the blue, the more cluster cases nearby. The chart on the right shows active cluster cases in each of Singapore's five regions from February to June 2020, and the grey band marks the Circuit Breaker period, when most people had to stay home. Only cases in clusters are counted; sporadic and imported cases are left out.",
      howTo:
        "Change the week to watch the clusters spread across the map. Hover over a line for a region's count in that week.",
      takeaway:
        "**Before Circuit Breaker, the outbreak was small and spread out.** In the week ending 21 February 2020, the clusters were scattered across the island, and the North-East and West regions had the most cluster cases. **Then cases took off from April, during Circuit Breaker, in every region, and fastest in the Central region.** By June, the Central region had passed 3,000 active cluster cases, about twice the North-East (about 1,600). The East (about 900) and West (about 600) followed, and the North stayed below 200. **Our conclusion: the 2020 outbreak grew while people were at home, and it grew most in the Central region.**",
      takeawayNote: "2020 clusters only, February to June; sporadic and imported cases are excluded. Source: Scientific Data 2022 (Figshare).",
      whyItMatters:
        "The outbreak ==grew fastest while people spent their days at home==, which suggests homes and the areas around them mattered more than workplaces. Regions are large, though, so the next view looks at the smaller subzones within them to find exactly where cases per resident were highest ([Which subzones were hit hardest in 2020?](#d11b)).",
      alt: null,
      owner: 'Yurae',
      extra: false,
    },
    {
      id: 'D11b',
      title: 'Hardest-hit subzones',
      part: 4,
      question: 'Which subzones were hit hardest in 2020?',
      hideQuestion: true,
      url: 'https://public.tableau.com:9443/views/Whichsubzoneswerehithardestin2020/Whichsubzoneswerehithardestin2020?:language=en-US&publish=yes&:sid=&:redirect=auth&:display_count=n&:origin=viz_share_link',
      height: 600,
      width: 1000,
      description:
        "Where the 2020 outbreak hit hardest, for the number of people who live there. The map shades each subzone by its 2020 cluster cases per 1,000 residents: the redder, the higher the rate. The bars on the right list the 15 subzones with the highest rates, coloured by region.",
      howTo:
        "Hover over a subzone on the map or a bar for its rate. Click a bar to find that subzone on the map.",
      takeaway:
        "**A handful of subzones stand far above the rest.** Woodleigh had by far the highest rate in 2020, about 32 cluster cases per 1,000 residents, nearly three times the next subzone, Mount Emily (about 12). Lorong Chuan, Cairnhill and Potong Pasir follow at about 8-10. Most of the island is pale, with rates near zero. **Nine of the top 15 subzones are in the Central region**, four are in the North-East and two in the West. Rates are per resident, so a subzone with few residents can rank high from a modest number of cases. **Our conclusion: the worst of the 2020 outbreak was concentrated in a few, mostly central, subzones.**",
      takeawayNote: "2020 clusters only; sporadic and imported cases are excluded. Residents from Census 2020.",
      whyItMatters:
        "If dengue hits only some neighbourhoods hard, the next question is ==what those neighbourhoods have in common==. Several of the hardest-hit, such as Woodleigh, Mount Emily and Cairnhill, are mostly private housing, so the next view tests whether housing explains the pattern ([Does housing explain which subzones were hit?](#d12a)).",
      alt: null,
      owner: 'Yurae',
      extra: false,
    },
    {
      id: 'D12a',
      title: 'Housing',
      part: 4,
      question: 'Does housing explain which subzones were hit?',
      hideQuestion: true,
      url: 'https://public.tableau.com:9443/views/Doeshousingexplainwhichsubzoneswerehit/Doeshousingexplainwhichsubzoneswerehit?:language=en-US&publish=yes&:sid=&:redirect=auth&:display_count=n&:origin=viz_share_link',
      height: 550,
      description:
        "Whether the type of housing in a subzone explains how hard the 2020 outbreak hit it. On the left, each dot is a subzone, placed by the housing factor you choose (across) and its 2020 cluster cases per 1,000 residents (up). The grey line is the overall trend: the steeper it is, the stronger the link. On the right, each bar shows the mix of homes (condo, HDB or landed) in the hardest-hit subzones, from the highest rate down.",
      howTo:
        "Choose a *Housing factor* to change what the dots are plotted against. Hover over a dot to see which subzone it is, and scroll the bars to see more subzones.",
      takeaway:
        "**Housing does not explain where the 2020 outbreak hit.** With landed homes as the factor, the trend line rises only slightly, and most subzones have low rates whether they have no landed homes or nearly all landed homes. Woodleigh, the hardest-hit, stands alone at the top with only about 10% landed homes. The hardest-hit subzones cover every kind of housing: Woodleigh, Mount Emily, Cairnhill and Institution Hill are mostly condos, Sembawang Hills and Seletar Hills mostly landed homes, and Potong Pasir, Aljunied and Chong Boon mostly HDB. **Our conclusion: no single type of housing protects a subzone or puts it at risk.**",
      takeawayNote: "2020 clusters; housing mix from Census 2020.",
      whyItMatters:
        "Private condos and landed homes, the ==wealthier kinds of housing, were among the worst hit==. That echoes the global finding that being better off barely protects against dengue. If housing doesn't mark out the risky places, perhaps past outbreaks do, so the next view checks whether the same places are hit again ([Are the same places hit again?](#d12b)).",
      alt: null,
      owner: 'Yurae',
      extra: false,
    },
    // Shows the current NEA clusters, so the site's own cluster map is hidden while it has a url.
    {
      id: 'D12b',
      title: 'Do hotspots repeat?',
      part: 4,
      question: 'Are the same places hit again?',
      hideQuestion: true,
      url: 'https://public.tableau.com:9443/views/Arethesameplaceshitagain/Arethesameplaceshitagain?:language=en-US&publish=yes&:sid=&:redirect=auth&:display_count=n&:origin=viz_share_link',
      height: 550,
      description:
        "Whether the places hit in 2020 are being hit again now. The map colours each subzone by whether it had dengue clusters in 2020 only (orange), in 2020 and again now (red), or in neither (grey). \"Now\" means the clusters NEA listed as active on 23 October 2026. The bars on the right show the size of today's largest clusters in places that were also hit in 2020.",
      howTo:
        "Hover over a subzone for its name and status, or over a bar for the cluster's location and number of cases.",
      takeaway:
        "**Most places hit in 2020 are clear today.** Most of the subzones with 2020 clusters are orange, and only a handful are red, hit both in 2020 and now. **But the places that are hit again hold today's largest clusters.** Ho Ching Road is by far the biggest, at about 100 cases, several times the next largest, Bishan Street 12 (about 15) and Lentor Gardens / Tung Po Avenue (about 12). The rest have only a few cases each. **Our conclusion: hotspots rarely come back, but when they do, the outbreak can be large.**",
      takeawayNote: "Current clusters as of 23 October 2026, compared with the 2020 clusters.",
      whyItMatters:
        "Past outbreaks are ==a poor guide to where the next one will be==, so Singapore cannot focus only on its old hotspots: control has to cover the whole island. Together with the weak weather and housing links, this shows that Singapore's dengue risk does not follow the simple factors that explain the global picture. The next section sets these results against the global ones.",
      alt: null,
      owner: 'Yurae',
      extra: false,
    },
    {
      id: 'D13',
      title: 'Global meets Singapore',
      part: 5,
      question: 'Do the global risk factors hold inside Singapore?',
      hideQuestion: true,
      url: 'https://public.tableau.com:9443/views/G1T8_D6-D8/D13GlobalmeetsSingapore?:language=en-US&publish=yes&:sid=&:redirect=auth&:display_count=n&:origin=viz_share_link',
      height: 800,
      description:
        "On the left, every country is placed by GDP (across) against dengue (top) and malaria (bottom) in 2019, with Singapore highlighted; the grey lines show the overall trend, and both side scales jump in tenfold steps. On the right, each row compares a factor's pattern across countries with the same factor inside Singapore, and the last column says whether it holds. Singapore has no local malaria, so the Singapore column tests dengue only.",
      howTo:
        'Read each row from left to right, then check the verdict. Hover over a dot in the chart for a country’s exact figures.',
      takeaway:
        "**Some global patterns hold inside Singapore, and some break.** Heat holds, weakly: warmer months are followed by more dengue a month or two later, matching how hotter countries report more dengue. Rainfall doesn't: wet months are followed by slightly fewer cases, the opposite of the global pattern. Crowding points the same way as it does globally: denser subzones had lower dengue cluster rates in 2020, just as more urban countries report less dengue, although urban countries are also richer, so this is the same direction rather than proof of the same cause. Water and sanitation fit the global pattern too: Singapore has universal access to both and no malaria, yet still has dengue, just as across countries they matter for malaria but barely for dengue. Income is where Singapore stands out. It fits the malaria pattern, with no malaria at all, but breaks the dengue one: it is one of the richest countries, yet in 2019 its dengue rate was many times the typical high-income country's. Across the years, income tracked malaria in every year but barely tracked dengue. **Our conclusion: wealth explains resilience to malaria but not to dengue, while heat sets the stage for both.**",
      whyItMatters:
        "This answers our main question. Countries are vulnerable for different reasons depending on the disease: ==malaria follows poverty and poor basic services, while dengue follows heat and persists even in rich, well-serviced cities like Singapore==. Tackling one disease therefore does not solve the other.",
      alt: null,
      owner: 'Shredha',
      extra: false,
    },
  ],

  team: ['Warren', 'Yubing', 'Shredha', 'Yurae'],

  // The section under the hero. Its tiles describe the data, not results.
  problem: {
    title: 'The problem',
    intro:
      "Dengue and malaria are both spread by mosquitoes, but they do not strike the same places, and their burden has moved in opposite directions since 2000. A country's risk could come from its climate (heat, rain and humidity), from how developed it is (income, health spending, clean water and sanitation), or from how its people live (urbanisation and density). This project tests those factors against {yearsCovered} years of country data ({firstYear}-{lastYear}) to see which matter most for each disease, then checks whether the global pattern holds inside Singapore, a hot, dense, high-income city that eliminated malaria but still has large dengue outbreaks.",
    dataTitle: 'The data',
    guideTitle: 'How to use this site',
    guide: [
      'Use the navbar to jump to any section.',
      "Each section's tabs switch between its dashboard views.",
      'The dashboards are interactive: use their controls, click marks to filter or highlight, and hover over anything for details. Each one has a "View on Tableau Public" link in its toolbar, at the bottom left.',
      'Best viewed on a desktop screen.',
    ],
  },

  // {tokens} come from src/data/stats.json.
  statTiles: [
    {
      id: 'years',
      year: '{firstYear}-{lastYear}',
      value: '{yearsCovered}',
      text: 'years of country data, {firstYear}-{lastYear}',
    },
    {
      id: 'malaria-endemic',
      year: '{firstYear}-{lastYear}',
      value: '{malariaEndemicN}',
      text: 'malaria-endemic countries with WHO estimates',
    },
    {
      id: 'dengue-reporting',
      year: '2019',
      value: '{dengueComplete2019}',
      text: 'countries and territories with complete dengue reporting in 2019',
    },
    {
      id: 'factors',
      year: '2019',
      // Ten: the nine in {factorCount2019} plus poverty, which D6a also scores. A literal, not a token.
      value: '10',
      text: 'climate and development factors in 2019: nine with data for at least {factorMinCoverage2019} countries, and poverty for {povertyCountries2019}',
    },
  ],

  // Text only, after Part 5. The key findings are drafts for the team to edit; each item
  // links to its part. Every number is a {token} from stats.json, and each one with a number
  // carries its year or years.
  conclusion: {
    title: 'Conclusion',
    answer: answerSentence,
    keyFindings: [
      {
        part: 1,
        text: 'Reported dengue rose from {denguePanel2000} to {denguePanel2024} cases per 100k between 2000 and 2024 among consistent reporters, while estimated malaria in endemic countries fell {malariaDrop2019} by 2019 before rising again.',
      },
      {
        part: 2,
        text: 'In 2019, hotter countries reported more of both diseases (r = {rTempDengue2019} for dengue, {rTempMalaria2019} for malaria), but basic sanitation, clean water and income tracked far less malaria (r = {rSanMalaria2019}, {rWaterMalaria2019}, {rGdpMalaria2019}) and only a little less dengue ({rSanDengue2019}, {rWaterDengue2019}, {rGdpDengue2019}).',
      },
      { part: 3, text: d8bTakeaway },
      {
        part: 4,
        text: 'Singapore reported {sgDengue2019} dengue cases per 100k in 2019, about {ratio2019} times the high-income median, and its weather links are weak: in monthly data for 2012-2024, temperature leads dengue by about 1-2 months (r about {sgTempLagR}).',
      },
      {
        part: 5,
        text: 'Comparing the same countries each year, income tracks malaria in all {yearsMalariaStronger} years from 2000 to 2024 (median r = {medianRMalaria}) but barely tracks dengue ({medianRDengue}), which is how a rich country can be malaria-free yet carry heavy dengue.',
      },
    ],
    // For the team to write. While null, the "What this means" heading is left out too.
    implications: null,
    closingLead: 'Every figure has limits; see',
  },

  // The last section on the page. Its heading, intro, key limits and team are always
  // visible; everything else sits in one collapsible block, which opens by itself when a
  // link points at the section or anything inside it.
  dataMethods: {
    title: 'Data, methods & limitations',
    intro: 'Where every number on this site comes from, how it was computed, and what it cannot tell you.',
    keyLimits:
      "Key limits: dengue figures are reported cases and malaria figures are WHO estimates, so they aren't directly comparable; correlations show association, not cause; some regions report little or no dengue data.",
    detailsSummary: 'Full data, methods and limitations',

    datasets: [
      {
        name: 'OpenDengue V1.3, national extract',
        use: 'Reported dengue cases by country, per year and per month. A country-year counts as complete when its reports cover at least 350 days; incomplete years are left blank.',
        files: 'global_country_year.csv, global_country_month.csv',
      },
      {
        name: 'OpenDengue V1.3, temporal extract',
        use: 'Singapore weekly dengue for the years after the data.gov.sg bulletin ends (2023-2024).',
        files: 'sg_weekly_disease.csv',
      },
      {
        name: 'WHO Global Health Observatory',
        use: 'Estimated malaria cases and incidence. Countries WHO does not list are marked "Not endemic" and given zero cases.',
        files: 'global_country_year.csv',
      },
      {
        name: 'World Bank indicators',
        use: 'Population, density, urban share, GDP per capita (PPP), basic water, basic sanitation, health spending per capita, plus region and income group.',
        files: 'global_country_year.csv, sg_population.csv',
      },
      {
        name: 'Our World in Data, ERA5 climate',
        use: 'Monthly surface temperature and annual precipitation by country. Annual temperature is kept only for years with all 12 months.',
        files: 'global_country_year.csv, global_country_month.csv',
      },
      {
        name: 'UNDP Human Development Index',
        use: "HDI by country and year, from the 2025 report's composite index time series.",
        files: 'global_country_year.csv',
      },
      {
        name: 'World Bank Poverty and Inequality Platform',
        use: 'Poverty headcount at $3.00 a day, national level, survey years only with no gap-filling.',
        files: 'global_country_year.csv',
      },
      {
        name: 'Global Dengue Observatory',
        use: 'Current-season dengue by country, 2025-2026, including months marked "Unobserved". Not used for any headline number or the globe.',
        files: 'gdo_current_season.csv',
      },
      {
        name: 'data.gov.sg, weekly infectious disease bulletin',
        use: 'Singapore weekly cases by disease, 2012-2022.',
        files: 'sg_weekly_disease.csv',
      },
      {
        name: 'data.gov.sg, Changi climate station',
        use: "Monthly rainfall, temperature and humidity, lagged 0-6 months against dengue. Also fills Singapore's climate in the global table, because the country averages skip it.",
        files: 'sg_monthly_lagged.csv, global_country_year.csv, global_country_month.csv',
      },
      {
        name: 'data.gov.sg, Master Plan 2019 subzones',
        use: 'Subzone boundaries and areas for Singapore.',
        files: 'mp2019_subzones.geojson, sg_subzone_profile.csv',
      },
      {
        name: 'data.gov.sg, Census 2020 dwellings by subzone',
        use: 'Residents and housing type by subzone.',
        files: 'sg_subzone_profile.csv',
      },
      {
        name: 'data.gov.sg, HDB property information, located with OneMap',
        use: 'Median completion year of HDB blocks per subzone, counting blocks completed up to 2020.',
        files: 'sg_subzone_profile.csv',
      },
      {
        name: 'data.gov.sg / NEA, dengue clusters',
        use: 'Active dengue clusters on the day the file was downloaded (2026-10-23).',
        files: 'nea_clusters_now.geojson',
      },
      {
        name: 'figshare, dengue outbreak Singapore 2020',
        use: 'Weekly dengue cluster records for the 2020 outbreak, matched to subzones.',
        files: 'sg_clusters_2020.csv',
      },
      {
        name: 'Disease reference, written in the notebook',
        use: 'Pathogen, vector and Wikipedia link for each disease.',
        files: 'disease_info.csv',
      },
    ],

    // From the cleaning notebook, which is also on the page as a download.
    cleaning: [
      'Dengue: reports are summed by country and year. A country-year counts as complete when its reports cover at least 350 days, and an incomplete year is left blank rather than undercounted.',
      'Malaria: WHO estimates only. Every country WHO does not list is marked "Not endemic" and given zero cases.',
      'Rates per 100k use World Bank population. A territory without a population figure has no rate.',
      'Climate: annual temperature is kept only for years with all 12 months. Country averages skip Singapore, so its values come from the Changi station.',
      'Singapore weekly cases join the data.gov.sg bulletin (2012-2022) to OpenDengue (2023-2024). Each week counts towards the month its midpoint falls in.',
      'Weather lag: each month of dengue is paired with the weather from 0 to 6 months earlier.',
      'Singapore subzones: 2020 cluster records and HDB blocks are matched to Master Plan 2019 subzones. Points just outside a subzone snap to the nearest one within 200 m.',
    ],

    // Each number here is asserted by scripts/build-data.ts.
    methods: [
      {
        title: 'Dengue among consistent reporters, 2000-2024: {denguePanel2000} to {denguePanel2024}',
        body: [
          'A country reports consistently when dengue_complete = 1 in at least 20 of the 24 years 2000-2023: {dengueConsistentN} countries. For each year, their summed dengue_cases are divided by their summed population, counting only their complete rows with both values, and multiplied by 100,000. Holding the set of countries fixed keeps the trend from reflecting who started reporting.',
        ],
      },
      {
        title: 'Endemic malaria, 2000-2024: {malariaRate2000} to {malariaRate2024}',
        body: [
          'The {malariaEndemicN} countries with malaria_status = "Endemic", the same set in every year. Summed malaria_cases_est over summed population, times 100,000. A row with no case estimate adds its population but no cases. 2019 is {malariaRate2019}, {malariaChange2019} on 2000.',
        ],
      },
      {
        title: 'Where each disease is, 2019: {malariaSSA2019} and {dengueLAC2019}',
        body: [
          "Each region's share of the 2019 total. Malaria: estimated cases across the endemic countries, {malariaSSA2019} in Sub-Saharan Africa. Dengue: reported cases across rows with dengue_complete = 1, {dengueLAC2019} in Latin America & Caribbean and {dengueEAP2019} in East Asia & Pacific.",
        ],
      },
      {
        title: 'What tracks each disease, 2019: temperature, sanitation, water and income',
        body: [
          "r is the Pearson correlation between each factor and log10(1 + rate per 100k), as D6a's scorecard computes it, with log10 for gdp_pc_ppp. Dengue uses the 2019 rows with dengue_complete = 1, and malaria the endemic countries, each only where both the factor and the rate have a value: {driverDengueNMin2019}-{driverDengueNMax2019} countries for dengue and {driverMalariaNMin2019}-{driverMalariaNMax2019} for malaria.",
          'Dengue: temp_c {rTempDengue2019}, sanitation_basic_pct {rSanDengue2019}, water_basic_pct {rWaterDengue2019}, gdp_pc_ppp {rGdpDengue2019}. Malaria, in the same order: {rTempMalaria2019}, {rSanMalaria2019}, {rWaterMalaria2019}, {rGdpMalaria2019}.',
          "Malaria's income r here ({rGdpMalaria2019}) differs from the all-countries {allMalariaR2019} under Income and disease, which also counts the countries given zero cases as not endemic.",
        ],
      },
      {
        title: 'The data, in four numbers',
        body: [
          'Years: the distinct years in the country-year table, {firstYear}-{lastYear} ({yearsCovered}). Malaria-endemic countries: as above, {malariaEndemicN}. Complete dengue reporting: rows with dengue_complete = 1 in 2019 ({dengueComplete2019}).',
          'Factors: ten in all. Nine are temp_c, precip_mm, gdp_pc_ppp, hdi, urban_pct, pop_density, water_basic_pct, sanitation_basic_pct and health_exp_pc, each with a value for at least {factorMinCoverage2019} countries in 2019. The tenth is poverty_pct, which has survey values for only {povertyCountries2019} countries in 2019, so its scores are the least reliable. One column is left out: rh_pct, which only Singapore has ({rhCountries2019} country in 2019).',
        ],
      },
      {
        title: 'Singapore dengue, 2019: {sgDengue2019}',
        body: [
          'dengue_per_100k for Singapore in 2019 is {sgDengueExact2019}. The comparison is the median across the {hiN2019} high-income countries with a dengue rate that year, Singapore included, which is {hiMedianExact2019}. The ratio rounds to {ratio2019}x.',
        ],
      },
      {
        title: 'Singapore malaria, 2019: {sgMalaria2019}',
        body: [
          "malaria_per_100k for Singapore in 2019. This is a status, not a measurement: the cleaning gives zero cases to every country WHO doesn't list as endemic. WHO certified Singapore malaria-free in 1982.",
        ],
      },
      {
        title: 'Income and disease, 2000-2024: {medianRMalaria} vs {medianRDengue}',
        body: [
          'r is the Pearson correlation between log10(gdp_pc_ppp) and ln(1 + rate per 100k), using countries with both rates and GDP in that year. The same countries are compared for both diseases, between {nMin} and {nMax} of them a year.',
          "The finding in Global meets Singapore and the Conclusion uses the median of the {yearsCovered} yearly values: {medianRMalaria} for malaria and {medianRDengue} for dengue. Malaria's link is stronger, by absolute r, in all {yearsMalariaStronger} years. Every yearly value is in the table below.",
        ],
      },
      {
        title: 'Complete dengue reporting, 2019: {dengueComplete2019}',
        body: [
          'Rows with dengue_complete = 1 in 2019. {dengueNoPop2019} of these territories lack population, which leaves {dengueUsable2019} usable rates.',
        ],
      },
      {
        title: 'The globe: latest available year per country',
        body: [
          'For each country and disease, the latest year with a rate. Dengue covers {globeDengueN} countries and territories: {globeDengueLatest} from 2024, the rest back to {globeDengueMinYear}. Malaria is 2024 everywhere except Mauritius (2021).',
          'Singapore shows {sgDengue2024} per 100k on the globe (2024) and {sgDengue2019} in the Singapore findings (2019). Both are labelled with their year, so the difference is intended.',
        ],
      },
      {
        title: 'Weather lag in Singapore, 2012-2024: r about {sgTempLagR}',
        body: [
          'Pearson r between monthly weather at the Changi station and monthly dengue cases over {sgLagMonths} months, for lags of 0 to 6 months. Temperature at 1 and 2 months is the strongest of all these links, at about {sgTempLagR}.',
        ],
      },
    ],

    closestYearNote:
      'All available countries, 2019: malaria {allMalariaR2019} ({allMalariaN2019} countries), dengue {allDengueR2019} ({allDengueN2019}). Same {sameN2019} countries, 2019: {sameMalariaR2019} vs {sameDengueR2019}. 2019 is the closest of the {yearsCovered} years.',

    // Each claim here that has a number is asserted by scripts/build-data.ts.
    limitations: [
      'Dengue is reported cases and surveillance differs by country. Malaria is WHO estimates. They are not directly comparable, and low reported dengue in poorer countries may partly reflect weaker surveillance.',
      'No Sub-Saharan African country has a dengue rate before 2023 (3 in 2023, 19 in 2024). Only 1 low-income country has a dengue rate in 2019.',
      'The dengue-income correlation shifts with which countries report: from {dengueR2021} in 2021 to {dengueR2024} in 2024, when African reporting expands (3 Sub-Saharan countries in 2023, 19 in 2024).',
      '{dengueComplete2019} countries and territories have complete dengue reporting in 2019, but {dengueNoPop2019} lack population, leaving {dengueUsable2019} usable rates.',
      "The globe's dengue colours mix years from {globeDengueMinYear} to {globeDengueMaxYear}.",
      'Correlations show association, not cause.',
      'Singapore weather links use monthly data for 2012-2024 ({sgLagMonths} months), and all are weak.',
      'Humidity is in the data for Singapore only, from the Changi station (2000-2024). Country-level humidity was never added to the global table, so global comparisons cover temperature and rainfall.',
      'The country-year table behind every headline number is annual and ends in 2024. The monthly global file also ends in 2024. The Global Dengue Observatory file runs to 2026 but feeds no number on this site.',
    ],

    sources: [
      { label: 'OpenDengue master repository', href: 'https://github.com/OpenDengue/master-repo' },
      { label: 'WHO GHO: estimated malaria cases', href: 'https://ghoapi.azureedge.net/api/MALARIA_EST_CASES' },
      { label: 'WHO GHO: estimated malaria incidence', href: 'https://ghoapi.azureedge.net/api/MALARIA_EST_INCIDENCE' },
      { label: 'World Bank Open Data', href: 'https://data.worldbank.org/' },
      { label: 'Our World in Data: monthly surface temperature', href: 'https://ourworldindata.org/grapher/average-monthly-surface-temperature' },
      { label: 'Our World in Data: annual precipitation', href: 'https://ourworldindata.org/grapher/average-precipitation-per-year' },
      { label: 'UNDP Human Development Reports data', href: 'https://hdr.undp.org/sites/default/files/2025_HDR/HDR25_Composite_indices_complete_time_series.csv' },
      { label: 'World Bank Poverty and Inequality Platform', href: 'https://pip.worldbank.org/' },
      { label: 'Global Dengue Observatory', href: 'https://globaldengueobservatory.org/' },
      { label: 'data.gov.sg: weekly infectious disease bulletin', href: 'https://data.gov.sg/datasets/d_ca168b2cb763640d72c4600a68f9909e/view' },
      { label: 'data.gov.sg: Changi rainfall', href: 'https://data.gov.sg/datasets/d_b16d06b83473fdfcc92ed9d37b66ba58/view' },
      { label: 'data.gov.sg: Changi temperature', href: 'https://data.gov.sg/datasets/d_755290a24afe70c8f9e8bcbf9f251573/view' },
      { label: 'data.gov.sg: Changi humidity', href: 'https://data.gov.sg/datasets/d_e3b1111a26b2aefef4f386c068d4ca5d/view' },
      { label: 'data.gov.sg: Master Plan 2019 subzones', href: 'https://data.gov.sg/datasets/d_8594ae9ff96d0c708bc2af633048edfb/view' },
      { label: 'data.gov.sg: Census 2020 dwellings by subzone', href: 'https://data.gov.sg/datasets/d_7f243956483d5901f237e6f87b096636/view' },
      { label: 'data.gov.sg: HDB property information', href: 'https://data.gov.sg/datasets/d_17f5382f26140b1fdae0ba2ef6239d2f/view' },
      { label: 'data.gov.sg: NEA dengue clusters', href: 'https://data.gov.sg/datasets/d_dbfabf16158d1b0e1c420627c0819168/view' },
      { label: 'figshare: dengue outbreak Singapore 2020', href: 'https://doi.org/10.6084/m9.figshare.20417658' },
      { label: 'OneMap', href: 'https://www.onemap.gov.sg/' },
      { label: 'Wikipedia: dengue fever', href: 'https://en.wikipedia.org/wiki/Dengue_fever' },
      { label: 'Wikipedia: malaria', href: 'https://en.wikipedia.org/wiki/Malaria' },
    ],
  },
};

export default config;
