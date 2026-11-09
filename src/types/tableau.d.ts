// The parts of the Tableau Embedding API v3 this site uses.
declare module 'https://public.tableau.com/javascripts/api/tableau.embedding.3.latest.min.js' {
  export const TableauEventType: {
    readonly FirstInteractive: 'firstinteractive';
    readonly VizLoadError: 'vizloaderror';
  };
}
