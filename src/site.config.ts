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
  /** Tableau Public link. Empty until the dashboard is published. */
  url: string;
  /**
   * The Tableau dashboard's own height in px, from its Size panel. The width is always
   * 1200. null until confirmed: the embed then assumes 800 and `npm run check` warns.
   */
  height: number | null;
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
  /** Paragraphs under "What we found". null shows nothing. {tokens} come from stats.json. */
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
  'In 2019, 96% of low-income countries had high malaria with no dengue reporting, while 45% of high-income countries were dengue only.';

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
        'Before asking why some countries are more vulnerable, we need to know where the burden is and how it has changed. D1 introduces both diseases and their trend since 2000; D2 maps where rates are highest, where the cases are and which countries stay on top; D3 checks whether those trends hold in every region and country.',
      findings: [
        'Reported dengue is rising fast: among the {dengueConsistentN} countries that report consistently, it went from {denguePanel2000} cases per 100k in 2000 to {denguePanel2019} in 2019 and {denguePanel2024} in 2024.',
        'Estimated malaria in the {malariaEndemicN} endemic countries fell from {malariaRate2000} to {malariaRate2019} per 100k between 2000 and 2019 ({malariaChange2019}), then rose to {malariaRate2024} in 2024.',
        "The two diseases hit different places: in 2019, {malariaSSA2019} of estimated malaria cases were in Sub-Saharan Africa, while {dengueLAC2019} of reported dengue was in Latin America & Caribbean and {dengueEAP2019} in East Asia & Pacific. Africa's dengue is largely unreported before 2023, so part of this gap is reporting.",
      ],
      bridge: 'So what makes these places different? The next section tests the candidates.',
    },
    {
      number: 2,
      slug: 'drivers',
      title: 'Drivers',
      question: 'What drives it?',
      role: 'Objective 1',
      intro:
        'With the burden mapped, this section tests the candidate explanations. D4 looks at climate and D5 at development and infrastructure; D6 ranks every factor for each disease and shows how stable those links are over time. D7 compares countries with similar climates to separate climate from everything else.',
      findings: [
        'Heat is a precondition, not an explanation. Both diseases are almost absent in countries averaging below about 18-20 °C, yet among hot countries rates differ more than a thousandfold: in 2019 temperature explained only about a fifth of the variation in dengue rates, and rates kept rising past the lab-optimum range instead of peaking.',
        'Malaria behaves like a disease of poverty. In 2019 its typical rate fell from about 25,000 per 100,000 in low-income countries to near zero in upper-middle and high-income ones, and its strongest links were basic sanitation (r = -0.86), poverty (+0.81, though only 29 countries have poverty data) and drinking water (-0.79). It was more strongly tied to wealth than dengue in all {yearsMalariaStronger} years from {firstYear} to {lastYear}.',
        "Dengue does not follow wealth the same way. In 2019 it peaked in upper-middle-income countries, and water and sanitation barely mattered (r about -0.15). Its link with wealth is also unstable: near zero in the early 2000s, strongest in 2019 ({allDengueR2019}), and reversed by 2024 ({dengueR2024}) as more African countries began reporting. Contrary to our proposal, denser and more urban countries did not report more dengue.",
        "Holding climate fixed shows the split directly. Singapore's climate twins (2010-2023 averages) range from 90 dengue cases per 100,000 a year in Thailand to 3,852 in Seychelles, yet only two of them, Cambodia and Thailand, have malaria. Rich tropical places such as Singapore, New Caledonia and French Polynesia escape malaria but not dengue, so for wealthy tropical countries development alone will not remove dengue risk.",
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
      // D8b's takeaway already carries this part's finding.
      findings: null,
      bridge: 'Next, we test whether the global pattern holds in one city: Singapore.',
    },
    {
      number: 4,
      slug: 'singapore',
      title: 'Singapore',
      question: 'Singapore case study',
      role: 'Objective 3',
      intro:
        'Singapore is hot, wet, dense and rich. It has been certified malaria-free since 1982, yet still has recurring dengue outbreaks. D9 measures those waves, D10 tests whether weather leads them, and D11 and D12 zoom in on where outbreaks hit and whether housing explains them.',
      findings: [
        'Singapore reported {sgDengue2019} dengue cases per 100k in 2019, about {ratio2019} times the median for high-income countries ({hiMedian2019}, across {hiN2019} reporting countries).',
        sgMalariaStatus,
        "In monthly data for 2012-2024 ({sgLagMonths} months), temperature leads Singapore's dengue by about 1-2 months, but the link is weak (r about {sgTempLagR}), as is every other weather link.",
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
        'Comparing the same countries each year, income tracks malaria in all {yearsMalariaStronger} years from 2000 to 2024 (median r = {medianRMalaria}) but barely tracks dengue ({medianRDengue}).',
        sgMalariaStatus,
      ],
      bridge: null,
    },
  ],

  // One entry per Tableau view, in page order. `title` is the short tab label.
  // `height` is the Tableau dashboard's own height in px, from its Size panel; the width
  // is always 1200. While it is null the embed assumes 800 and `npm run check` warns.
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
        'Headline figures for the chosen year (countries reporting dengue, countries with malaria, reported dengue cases, estimated malaria cases) and how each disease has changed since 2000.',
      howTo: 'Move the year slider to update the figures.',
      takeaway: null,
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
        'A world map of cases per 100,000 for the chosen disease and year, beside the countries with the highest rates.',
      howTo: 'Choose a disease, year and number of countries; click a country in the bar chart to find it on the map.',
      takeaway: null,
      alt: null,
      owner: 'Warren',
      extra: false,
    },
    {
      id: 'D2b',
      title: 'Where the cases are',
      part: 1,
      question: 'Where are the cases, and are they rising?',
      url: 'https://public.tableau.com/views/G1T8_D1-D3_D10/D2bAtlas',
      height: 800,
      description:
        "A treemap of cases by country, sized by cases and coloured by the change from the year before, beside each region's share of cases since 2000.",
      howTo: "Choose a disease and year; hover over a box to see that country's cases and change.",
      takeaway: null,
      alt: null,
      owner: 'Warren',
      extra: false,
    },
    {
      id: 'D2c',
      title: 'Who stays on top',
      part: 1,
      question: 'Which countries stay on top?',
      url: 'https://public.tableau.com/views/G1T8_D1-D3_D10/D2cAtlas',
      height: 600,
      description:
        'How the 10 countries with the highest average rate ranked each year from 2010 to 2023, coloured by region.',
      howTo: 'Choose a disease, then hover over a line to follow one country.',
      takeaway: null,
      alt: null,
      owner: 'Warren',
      extra: false,
    },
    {
      id: 'D3a',
      title: 'Change by region',
      part: 1,
      question: 'Is dengue rising and malaria falling everywhere?',
      url: 'https://public.tableau.com/views/G1T8_D1-D3_D10/D3aTrends',
      height: 600,
      description: "Each region's dengue and malaria rates since 2000, indexed so that 2000 = 100.",
      howTo: 'Compare each line with the grey line at 100, which marks no change since 2000.',
      takeaway: null,
      alt: null,
      owner: 'Warren',
      extra: false,
    },
    {
      id: 'D3b',
      title: 'Drill down',
      part: 1,
      question: 'Where is each disease rising or falling?',
      url: 'https://public.tableau.com/views/G1T8_D1-D3_D10/D3bTrends',
      height: 750,
      description:
        "Year-on-year change by region, the countries that changed most between two chosen years, and any one country's history.",
      howTo:
        'Choose a disease and years, click a region in the heatmap, then click a line in the slope chart to see that country.',
      takeaway: null,
      alt: null,
      owner: 'Warren',
      extra: false,
    },
    {
      id: 'D4a',
      title: 'Hottest places',
      part: 2,
      question: "Is disease highest where it's hottest?",
      url: 'https://public.tableau.com/views/G1T8_D4-D7/D4a',
      height: 650,
      description:
        "A world map showing where each disease is, set against how hot each country is. Darker pink means a hotter country. Each dot is a country's cases per 100,000 people: the bigger the dot, the more cases (dots appear from 1 case per 100,000).",
      howTo:
        'Pick Dengue or Malaria and a year. Hover over any country, including those without a dot, for its exact figures.',
      takeaway:
        "Both diseases live in the hot belt around the equator: almost every large dot sits on a dark-pink country, while the cooler north is nearly empty. But they don't live in the same hot places. Malaria is overwhelmingly an African disease (nearly all estimated cases in 2019 were in Sub-Saharan Africa), while dengue is spread across Latin America, South and Southeast Asia and the Pacific. Much of Africa shows no dengue dot, which mostly means it isn't reported, not that it's absent.",
      whyItMatters:
        "This is the first clue to our main question: heat decides where a country can be vulnerable at all. But equally hot countries end up very differently, so heat can't be the whole answer. The next views test what else separates them.",
      alt: null,
      owner: 'Yubing',
      extra: false,
    },
    {
      id: 'D4b',
      title: 'Best temperature',
      part: 2,
      question: 'Is there a best temperature for the disease?',
      url: 'https://public.tableau.com/views/G1T8_D4-D7/D4b',
      height: 650,
      description:
        'Left, the typical (median) cases per 100,000 people among countries in each 2 °C band of average temperature; pale bars rest on fewer than 5 countries, so read them with caution. Right, every country plotted against its average temperature on a log scale (1 = 10, 2 = 100, 3 = 1,000 cases), with a grey trend line and a green band marking where lab studies find the disease spreads fastest (26–29 °C for dengue, 24–26 °C for malaria; Mordecai et al., 2019).',
      howTo: 'Switch disease and year, and hover over a bar or dot for details.',
      takeaway:
        'In 2019, dengue was almost absent in countries averaging below 18 °C, then the typical rate climbed from about 55 per 100,000 at 18–20 °C to about 190–200 at 24–28 °C. Malaria is near zero below 20 °C and reaches thousands per 100,000 in most bands above 22 °C. Lab studies predict a peak and then a fall, but country rates show no such fall: the typical dengue rate is highest in the hottest band, 28–30 °C (only 3 countries), and malaria peaks at 26–28 °C, above its lab optimum. And temperature explains only about a fifth of the differences in dengue between countries (R² = 0.22).',
      whyItMatters:
        'Temperature sets a threshold, not the level. Among hot countries, burden still varies more than a thousandfold, so something other than climate decides who actually gets sick.',
      alt: null,
      owner: 'Yubing',
      extra: false,
    },
    {
      id: 'D5a',
      title: 'Factor by factor',
      part: 2,
      question: 'How does each factor relate to dengue and malaria?',
      url: 'https://public.tableau.com/views/G1T8_D4-D7/D5a',
      height: 800,
      description:
        'Pick a factor in Compare against: temperature, rainfall, GDP per person, HDI, urbanisation, population density, clean water, sanitation, health spending or poverty. The card gives its correlation (r) with each disease, from −1 to 1 (closer to −1 or 1 is a stronger link), and says what it means in words. Below, every country is plotted for dengue (top, red) and malaria (bottom, blue), with grey trend lines.',
      howTo:
        'Switch to All factors at once for a grid showing which factors rise together; click a dot to find that country in every chart.',
      takeaway:
        "In 2019, malaria was tied most closely to basic infrastructure and poverty: sanitation (r = {rSanMalaria2019}), poverty (+0.81, though only 29 countries have poverty data), clean water ({rWaterMalaria2019}), HDI (−0.78), GDP per person ({rGdpMalaria2019}) and health spending (−0.68). For dengue the same factors barely register (sanitation {rSanDengue2019}, clean water {rWaterDengue2019}); its strongest links were GDP per person ({rGdpDengue2019}) and temperature ({rTempDengue2019}). Population density showed no link with either disease, and more urban countries reported less dengue (−0.38), the opposite of what we expected. The grid shows GDP, HDI and urbanisation rising together, so their separate effects can't be pulled apart.",
      whyItMatters:
        "The levers that line up with less malaria, such as sanitation, clean water and health spending, do little for dengue. Dengue's mosquito breeds in small pools of standing water around homes, so improving infrastructure alone is unlikely to bring dengue down the way it brings down malaria.",
      alt: null,
      owner: 'Yubing',
      extra: false,
    },
    {
      id: 'D5b',
      title: 'Richer, less disease?',
      part: 2,
      question: 'Does disease fall as countries get richer?',
      url: 'https://public.tableau.com/views/G1T8_D4-D7/D5b',
      height: 600,
      description:
        'Countries grouped into the four World Bank income groups, with dengue on top and malaria below. Each dot is a country; the grey box holds the middle half of countries and the line inside marks the typical one. The scale is logarithmic (1 = 10, 2 = 100, 3 = 1,000 cases per 100,000 people).',
      howTo: 'Move the year slider, and hover over a dot for the country and its exact figure.',
      takeaway:
        'In 2019, the typical malaria rate fell from about 25,000 per 100,000 people in low-income countries to 790 in lower-middle-income ones and near zero above that. Dengue does not fall the same way: it peaked in upper-middle-income countries (256 per 100,000) and was still present in high-income ones (14), including tropical islands such as New Caledonia (1,381) and Antigua and Barbuda (1,339). Only one low-income country, Yemen, reported a complete year of dengue, so that column says more about reporting than about risk.',
      whyItMatters:
        "Getting richer goes with the end of malaria but not of dengue, which is heaviest in fast-growing middle-income countries and persists in wealthy tropical ones. That is exactly Singapore's situation.",
      alt: null,
      owner: 'Yubing',
      extra: false,
    },
    {
      id: 'D6a',
      title: 'Scorecard',
      part: 2,
      question: 'Which factor matters most, for which disease?',
      url: 'https://public.tableau.com:9443/views/G1T8_D6-D8/d6aScorecard?:language=en-US&publish=yes&:sid=&:redirect=auth&:display_count=n&:origin=viz_share_link',
      height: 800,
      description: 'Correlation of ten climate and development factors with dengue and with malaria, with the number of countries behind each value.',
      howTo: 'Pick a year; read across a row to compare the two diseases.',
      takeaway: 'In 2019, basic sanitation tracked malaria strongly (r = −0.86) but dengue only weakly (r = −0.15).',
      alt: null,
      owner: 'Shredha',
      extra: false,
    },
    {
      id: 'D6c',
      title: 'How stable',
      part: 2,
      question: 'How stable is each correlation over time?',
      url: 'https://public.tableau.com:9443/views/G1T8_D6-D8/d6cStability?:language=en-US&publish=yes&:sid=&:redirect=auth&:display_count=n&:origin=viz_share_link',
      height: 800,
      description: 'Each factor’s correlation with the chosen disease in every year from 2000 to 2023.',
      howTo: 'Switch disease to see how each correlation moves across the years.',
      takeaway: 'Water, sanitation, income and health spending stayed strongly linked to malaria in every year from 2000 to 2023.',
      alt: null,
      owner: 'Shredha',
      extra: false,
    },
    {
      id: 'D7',
      title: 'Climate twins',
      part: 2,
      question: 'Does the same climate mean the same disease?',
      url: 'https://public.tableau.com/views/G1T8_D4-D7/D7Climatetwins',
      height: 800,
      description:
        'Pick a country in Compare with (Singapore by default). The table lists its climate twins: countries whose 2010–2023 average temperature and rainfall fall within the ranges set by the two sliders. Rows run from richest to poorest, with bars for temperature, rainfall, dengue, malaria, GDP per person and clean water, and a summary line above.',
      howTo: 'Click any country in the table to see its own twins.',
      takeaway:
        "Singapore's five twins (Seychelles, Thailand, Sri Lanka, El Salvador and Cambodia) all average 26.5–27.7 °C and 1,570–1,900 mm of rain a year, yet their dengue rates range from 90 per 100,000 a year in Thailand to 3,852 in Seychelles, a fortyfold gap. Malaria appears in only two of them: Cambodia (969), the poorest at about $5,300 per person with 74% clean-water access, and Thailand (26). Singapore, the richest at about $115,000, has no malaria but more dengue than Thailand or Cambodia. Choose Seychelles instead and its 18 twins include Liberia and Guinea, where malaria is heavy.",
      whyItMatters:
        "Holding climate fixed is the closest this data gets to a fair test. The same climate does not mean the same fate: wealth and infrastructure separate malaria, while dengue's gaps need other explanations, such as how cities are built and how well cases are reported, which the Singapore section explores.",
      alt: null,
      owner: 'Yubing',
      extra: false,
    },
    {
      id: 'D8a',
      title: 'Which disease where',
      part: 3,
      question: 'Which countries carry which disease?',
      url: 'https://public.tableau.com:9443/views/G1T8_D6-D8/D8aWhichcountries?:language=en-US&publish=yes&:sid=&:redirect=auth&:display_count=n&:origin=viz_share_link',
      height: 800,
      description:
        "Each country's dengue rate against its malaria rate, grouped by which disease is above its threshold, with the factor profiles of any countries you select.",
      howTo: 'Adjust the year and thresholds, then select countries in the scatter to compare their factor profiles.',
      takeaway: 'In 2019, Singapore was dengue only: malaria-free, with 281 dengue cases per 100,000.',
      alt: null,
      owner: 'Shredha',
      extra: false,
    },
    {
      id: 'D8b',
      title: 'By income and region',
      part: 3,
      question: 'How does it vary by income and region?',
      url: 'https://public.tableau.com:9443/views/G1T8_D6-D8/D8bIncomeandRegion?:language=en-US&publish=yes&:sid=&:redirect=auth&:display_count=n&:origin=viz_share_link',
      height: 800,
      description: 'How those groups split by income level, and the typical dengue and malaria rate in each region.',
      howTo: 'Adjust the year and thresholds to see how the groups shift.',
      takeaway: d8bTakeaway,
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
      url: 'https://public.tableau.com:9443/views/G1T8_D6-D8/d6bDumbbell?:language=en-US&publish=yes&:sid=&:redirect=auth&:display_count=n&:origin=viz_share_link',
      height: 800,
      description: "Each factor's correlation with dengue and with malaria side by side, sorted by the gap between them.",
      howTo: 'Pick a year; a longer line means the factor relates differently to each disease.',
      takeaway: 'In 2019, basic sanitation and drinking water separated the two diseases most.',
      alt: null,
      owner: 'Shredha',
      extra: false,
    },
    {
      id: 'D9a',
      title: 'Weekly waves',
      part: 4,
      question: "How big and regular are Singapore's dengue waves?",
      url: 'https://public.tableau.com:9443/views/HowbigandregularareSingaporesdenguewaves/HowbigandregularareSingaporesdenguewaves?:language=en-US&publish=yes&:sid=&:redirect=auth&:display_count=n&:origin=viz_share_link',
      height: null,
      description: null,
      howTo: null,
      takeaway: null,
      alt: null,
      owner: 'Yurae',
      extra: false,
    },
    {
      id: 'D9b',
      title: 'Peaks and worst years',
      part: 4,
      question: 'When does dengue peak, and which years were worst?',
      url: 'https://public.tableau.com:9443/views/Whendoesdenguepeakandwhichyearswereworst/Whendoesdenguepeakandwhichyearswereworst?:language=en-US&publish=yes&:sid=&:redirect=auth&:display_count=n&:origin=viz_share_link',
      height: null,
      description: null,
      howTo: null,
      takeaway: null,
      alt: null,
      owner: 'Yurae',
      extra: false,
    },
    {
      id: 'D10',
      title: 'Weather lag',
      part: 4,
      question: 'Does local weather lead dengue, and by how many months?',
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
      url: 'https://public.tableau.com:9443/views/Wheredidthe2020outbreakhitweekbyweek/Wheredidthe2020outbreakhitweekbyweek?:language=en-US&publish=yes&:sid=&:redirect=auth&:display_count=n&:origin=viz_share_link',
      height: null,
      description: null,
      howTo: null,
      takeaway: null,
      alt: null,
      owner: 'Yurae',
      extra: false,
    },
    {
      id: 'D11b',
      title: 'Hardest-hit subzones',
      part: 4,
      question: 'Which subzones were hit hardest in 2020?',
      url: 'https://public.tableau.com:9443/views/Whichsubzoneswerehithardestin2020/Whichsubzoneswerehithardestin2020?:language=en-US&publish=yes&:sid=&:redirect=auth&:display_count=n&:origin=viz_share_link',
      height: null,
      description: null,
      howTo: null,
      takeaway: null,
      alt: null,
      owner: 'Yurae',
      extra: false,
    },
    {
      id: 'D12a',
      title: 'Housing',
      part: 4,
      question: 'Does housing explain which subzones were hit?',
      url: 'https://public.tableau.com:9443/views/Doeshousingexplainwhichsubzoneswerehit/Doeshousingexplainwhichsubzoneswerehit?:language=en-US&publish=yes&:sid=&:redirect=auth&:display_count=n&:origin=viz_share_link',
      height: null,
      description: null,
      howTo: null,
      takeaway: null,
      alt: null,
      owner: 'Yurae',
      extra: false,
    },
    // Will show the current NEA clusters. Once it has a url, the site's own cluster map is hidden.
    {
      id: 'D12b',
      title: 'Do hotspots repeat?',
      part: 4,
      question: 'Are the same places hit again?',
      url: 'https://public.tableau.com:9443/views/Arethesameplaceshitagain/Arethesameplaceshitagain?:language=en-US&publish=yes&:sid=&:redirect=auth&:display_count=n&:origin=viz_share_link',
      height: null,
      description: null,
      howTo: null,
      takeaway: null,
      alt: null,
      owner: 'Yurae',
      extra: false,
    },
    {
      id: 'D13',
      title: 'Global meets Singapore',
      part: 5,
      question: 'Do the global risk factors hold inside Singapore?',
      url: 'https://public.tableau.com:9443/views/G1T8_D6-D8/D13GlobalmeetsSingapore?:language=en-US&publish=yes&:sid=&:redirect=auth&:display_count=n&:origin=viz_share_link',
      height: 800,
      description: 'Income against dengue and malaria in 2019 with Singapore highlighted, beside a factor-by-factor check of whether each global finding holds inside Singapore.',
      howTo: 'Compare each factor’s global finding with what was found inside Singapore.',
      // Was the answer sentence, which now opens the Conclusion.
      takeaway: null,
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
      'The dashboards are interactive: use their controls, click marks to filter or highlight, and hover over anything for details. Each one has an "Open in Tableau Public" link underneath.',
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
      value: '{factorCount2019}',
      text: 'climate and development factors, each with data for at least {factorMinCoverage2019} countries in 2019',
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
          'Factors: temp_c, precip_mm, gdp_pc_ppp, hdi, urban_pct, pop_density, water_basic_pct, sanitation_basic_pct and health_exp_pc, {factorCount2019} in all, each with a value for at least {factorMinCoverage2019} countries in 2019. Two columns are left out: rh_pct, which only Singapore has ({rhCountries2019} country in 2019), and poverty_pct, which has survey values for only {povertyCountries2019} countries in 2019.',
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
