/*
 * All editable site content lives in this one file.
 *
 * To publish a dashboard: paste its Tableau Public link into `url`, then run
 * `npm run check`. See README.md for the full steps.
 *
 * Rendering rules
 * - Empty url on a core dashboard: a "Dashboard coming soon" panel, no Tableau script.
 * - Empty url on an extra dashboard (D7, D12): hidden completely.
 * - null howTo or takeaway: that line is left out, with no placeholder.
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
  howTo: string | null;
  takeaway: string | null;
  /** Optional scope shown under the takeaway, so its numbers carry their years. */
  takeawayNote?: string;
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

export interface StatTilePairValue {
  disease: 'dengue' | 'malaria';
  label: string;
  value: string;
}

export interface StatTile {
  id: string;
  /** The year or years the numbers on this tile describe. */
  year: string;
  text: string;
  value?: string;
  /** Only 281 and 82 count up. */
  countUp?: boolean;
  pair?: StatTilePairValue[];
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
  intro: string;
  datasets: DatasetRow[];
  cleaning: string[];
  methods: MethodNote[];
  /** Shown word for word on the page, for transparency. */
  closestYearNote: string;
  limitations: string[];
  sources: SourceLink[];
}

export interface SiteConfig {
  site: {
    name: string;
    course: string;
    group: string;
    mainQuestion: string;
    scope: string;
  };
  answerSentence: string;
  navigation: NavItem[];
  extraPages: ExtraPage[];
  parts: Part[];
  dashboards: Dashboard[];
  team: string[];
  statTiles: StatTile[];
  dataMethods: DataMethods;
}

const answerSentence =
  'Heat shapes where both diseases can spread; wealth tracks who stays sick, strongly for malaria and barely for dengue.';

const config: SiteConfig = {
  site: {
    name: 'IS428 G1T8',
    course: 'IS428 Visual Analytics for Business Intelligence, Singapore Management University',
    group: 'Group G1T8',
    mainQuestion: 'Why are some countries more vulnerable to mosquito-borne diseases than others?',
    scope: 'Dengue and malaria, global 2000-2024, then Singapore as a case study.',
  },

  // DRAFT until D13 is built. It is the first of the Conclusion's findings, and shows a
  // "Draft" tag for as long as D13's url is empty.
  answerSentence,

  // Anchors to the sections of the one page. Items in extraPages are added to the end
  // of this list automatically.
  navigation: [
    { label: 'Home', href: '/#home' },
    { label: '1 Burden', href: '/#burden' },
    { label: '2 Drivers', href: '/#drivers' },
    { label: '3 Dengue vs Malaria', href: '/#dengue-vs-malaria' },
    { label: '4 Singapore', href: '/#singapore' },
    { label: '5 Conclusion', href: '/#conclusion' },
    { label: 'Data & Methods', href: '/#data-methods' },
  ],

  // Empty for now. Do not add a user guide, poster or report page until the course
  // is confirmed to require them. README.md has the steps for adding a page.
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
        'Before asking why some countries are more vulnerable, we need to know where the burden is and how it has changed. D1 introduces both diseases and their global trend since 2000, D2 shows where cases concentrate and which countries lead, and D3 checks whether those trends hold in every region.',
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
        'With the burden mapped, this section tests the candidate explanations. D4 looks at climate, D5 at development and infrastructure, and D6 ranks every factor side by side for each disease. D7 compares countries with similar climates to separate climate from everything else.',
      findings: null,
      bridge: null,
    },
    {
      number: 3,
      slug: 'dengue-vs-malaria',
      title: 'Dengue vs Malaria',
      question: 'Dengue vs malaria',
      role: 'Objective 2',
      intro:
        "The same factor may not work the same way for both diseases. D8 groups countries by whether they carry dengue, malaria, both or neither, to show where the two diseases' risk profiles split.",
      // D8's takeaway already carries this part's finding.
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
        "Our data counts {sgMalaria2019} malaria cases for Singapore in 2019, because WHO doesn't list it as endemic. WHO certified it malaria-free in 1982.",
        "In monthly data for 2012-2024 ({sgLagMonths} months), temperature leads Singapore's dengue by about 1-2 months, but the link is weak (r about {sgTempLagR}), as is every other weather link.",
      ],
      bridge: "The last section sets Singapore's results against the global ones.",
    },
    {
      number: 5,
      slug: 'conclusion',
      title: 'Conclusion',
      question: 'Global meets Singapore',
      role: 'Conclusion',
      intro:
        'D13 puts the global findings and the Singapore findings side by side, factor by factor, to answer the main question.',
      // The answer sentence shows a "Draft" tag until D13 has a url.
      findings: [
        answerSentence,
        'Comparing the same countries each year, income tracks malaria in all {yearsMalariaStronger} years from 2000 to 2024 (median r = {medianRMalaria}) but barely tracks dengue ({medianRDengue}).',
      ],
      bridge: null,
    },
  ],

  // howTo seeds are drafts taken from the workbook's controls. Owners confirm them.
  dashboards: [
    {
      id: 'D1',
      title: 'Home',
      part: 1,
      question: 'What are the two diseases, and how have they moved since 2000?',
      url: '',
      howTo: 'Pick a year to update the map and figures, then click a disease to load its Wikipedia summary.',
      takeaway: null,
      alt: 'Map, headline figures, divergence chart and disease picker.',
      owner: 'Warren',
      extra: false,
    },
    {
      id: 'D2',
      title: 'Atlas',
      part: 1,
      question: 'Where is each disease concentrated, and which countries lead?',
      url: '',
      howTo: 'Choose a disease, year and Top N, then click a region to filter or a country to highlight it.',
      takeaway: null,
      alt: 'Dengue and malaria maps, bump chart, region share and Top N chart.',
      owner: 'Warren',
      extra: false,
    },
    {
      id: 'D3',
      title: 'Trends',
      part: 1,
      question: 'Is dengue rising and malaria falling everywhere?',
      url: '',
      howTo:
        'Choose a disease, smoothing window and year range, click a region to update the slope chart, then click a country there to open it in the explorer.',
      takeaway: null,
      alt: 'Regional trends, slope chart, year-on-year heatmap and country explorer.',
      owner: 'Warren',
      extra: false,
    },
    {
      id: 'D4',
      title: 'Climate',
      part: 2,
      question: 'How do temperature, rain and humidity relate to each disease?',
      url: '',
      howTo: null,
      takeaway: null,
      alt: null,
      owner: 'Yubing',
      extra: false,
    },
    {
      id: 'D5',
      title: 'Development',
      part: 2,
      question: 'Do income, services and urbanisation track burden?',
      url: '',
      howTo: null,
      takeaway: null,
      alt: null,
      owner: 'Yubing',
      extra: false,
    },
    {
      id: 'D6',
      title: 'Scorecard',
      part: 2,
      question: 'Which factor matters most, for which disease?',
      url: '',
      howTo: null,
      takeaway: null,
      alt: null,
      owner: 'Shredha',
      extra: false,
    },
    {
      id: 'D7',
      title: 'Climate twins',
      part: 2,
      question: 'Why do countries with the same climate differ?',
      url: '',
      howTo: null,
      takeaway: null,
      alt: null,
      owner: 'Yubing',
      extra: true,
    },
    {
      id: 'D8',
      title: 'Resilient vs vulnerable',
      part: 3,
      question: 'Which countries carry one disease but not the other?',
      url: 'https://public.tableau.com/views/G1T8_D6-D8/D8ResilientvsVulnerable?:language=en-US&publish=yes&:sid=&:redirect=auth&:display_count=n&:origin=viz_share_link',
      howTo: 'Move the year slider and the two thresholds, then click a group in any chart to list its countries.',
      takeaway: 'In 2019, 96% of low-income countries had high malaria with no dengue reporting, while 45% of high-income countries were dengue only.',
      alt: 'World map, dengue-versus-malaria scatter, income-group bars and a country list, grouping countries by whether dengue, malaria or both exceed a threshold.',
      owner: 'Shredha',
      extra: false,
    },
    {
      id: 'D9',
      title: 'Singapore pulse',
      part: 4,
      question: "How big and regular are Singapore's dengue waves?",
      url: '',
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
      url: '',
      howTo: 'Choose a weather variable and a lag in months, then compare the charts.',
      takeaway:
        'Temperature leads dengue by about 1-2 months, but the link is weak (r about {sgTempLagR}), as is every other weather link.',
      takeawayNote: 'Singapore, monthly data, 2012-2024 (156 months).',
      alt: 'Overlay, scatter, lag profile and average-year charts.',
      owner: 'Warren',
      extra: false,
    },
    {
      id: 'D11',
      title: '2020 hotspots',
      part: 4,
      question: 'Where did the 2020 outbreak hit, week by week?',
      url: '',
      howTo: null,
      takeaway: null,
      alt: null,
      owner: 'Yurae',
      extra: false,
    },
    {
      id: 'D12',
      title: 'Housing and persistence',
      part: 4,
      question: 'Does housing explain the hotspots, and do they repeat?',
      url: '',
      howTo: null,
      takeaway: null,
      alt: null,
      owner: 'Yurae',
      extra: true,
    },
    {
      id: 'D13',
      title: 'Global meets Singapore',
      part: 5,
      question: 'Do the global risk factors hold inside Singapore?',
      url: '',
      howTo: null,
      // Was the answer sentence, which now leads the Conclusion's findings just below.
      takeaway: null,
      alt: null,
      owner: 'TBD',
      extra: false,
    },
  ],

  team: ['Warren', 'Yubing', 'Shredha', 'Yurae'],

  // Homepage stat tiles. {tokens} come from src/data/stats.json.
  statTiles: [
    {
      id: 'sg-dengue',
      year: '2019',
      value: '{sgDengue2019}',
      countUp: true,
      text: 'reported dengue cases per 100k in Singapore, 2019: about {ratio2019}x the high-income median ({hiMedian2019}, across {hiN2019} reporting countries)',
    },
    {
      id: 'sg-malaria',
      year: '2019',
      value: '{sgMalaria2019}',
      text: "malaria cases counted for Singapore in our data, because WHO doesn't list it as endemic (2019). WHO-certified malaria-free since 1982.",
    },
    {
      id: 'income-link',
      year: '2000-2024',
      pair: [
        { disease: 'malaria', label: 'Malaria', value: '{medianRMalaria}' },
        { disease: 'dengue', label: 'Dengue', value: '{medianRDengue}' },
      ],
      text: 'Income tracks malaria in every year since 2000 (median r = {medianRMalaria}) but barely tracks dengue ({medianRDengue}). Same countries compared each year.',
    },
    {
      id: 'reporting',
      year: '2019',
      value: '{dengueComplete2019}',
      countUp: true,
      text: 'countries and territories with complete dengue reporting in 2019 ({dengueUsable2019} have a usable rate)',
    },
  ],

  // Data & Methods page.
  dataMethods: {
    intro:
      'Where every number on this site comes from, how it was computed, and what it cannot tell you. A script in the repository recomputes the headline numbers from the cleaned CSVs and stops if any of them change.',

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
          "The tile shows the median of the 25 yearly values: {medianRMalaria} for malaria and {medianRDengue} for dengue. Malaria's link is stronger, by absolute r, in all {yearsMalariaStronger} years.",
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
          'Singapore shows {sgDengue2024} per 100k on the globe (2024) and {sgDengue2019} on the stat tile (2019). Both are labelled with their year, so the difference is intended.',
        ],
      },
      {
        title: 'Weather lag in Singapore, 2012-2024: r about 0.19',
        body: [
          'Pearson r between monthly weather at the Changi station and monthly dengue cases over {sgLagMonths} months, for lags of 0 to 6 months. Temperature at 1 and 2 months is the strongest of all these links, at about 0.19.',
        ],
      },
    ],

    closestYearNote:
      'All available countries, 2019: malaria {allMalariaR2019} ({allMalariaN2019} countries), dengue {allDengueR2019} ({allDengueN2019}). Same {sameN2019} countries, 2019: {sameMalariaR2019} vs {sameDengueR2019}. 2019 is the closest of the 25 years.',

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
      'The country-year table behind every headline number is annual and ends in 2024. The monthly global file also ends in 2024. The Global Dengue Observatory file runs to 2026 but feeds no number on this page or the homepage.',
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
