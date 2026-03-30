
const CITIES = [
  { name:'Mumbai',    tier:'Top', nx:0.21, ny:0.60, d:0.95, h:0.80, im:0.75, co:0.70, av:0.55 },
  { name:'Delhi',     tier:'Top', nx:0.37, ny:0.21, d:0.90, h:0.75, im:0.70, co:0.65, av:0.60 },
  { name:'Bangalore', tier:'Top', nx:0.34, ny:0.74, d:0.80, h:0.85, im:0.65, co:0.75, av:0.45 },
  { name:'Chennai',   tier:'Top', nx:0.47, ny:0.77, d:0.75, h:0.80, im:0.70, co:0.72, av:0.58 },
  { name:'Kolkata',   tier:'Top', nx:0.71, ny:0.41, d:0.85, h:0.65, im:0.68, co:0.60, av:0.65 },
  { name:'Jaipur',    tier:'Mid', nx:0.29, ny:0.31, d:0.55, h:0.50, im:0.50, co:0.55, av:0.60 },
  { name:'Lucknow',   tier:'Mid', nx:0.53, ny:0.29, d:0.52, h:0.48, im:0.48, co:0.50, av:0.62 },
  { name:'Bhopal',    tier:'Mid', nx:0.37, ny:0.49, d:0.48, h:0.45, im:0.45, co:0.48, av:0.58 },
  { name:'Shimla',    tier:'Low', nx:0.35, ny:0.09, d:0.20, h:0.30, im:0.35, co:0.65, av:0.70 },
  { name:'Patna',     tier:'Low', nx:0.64, ny:0.32, d:0.35, h:0.28, im:0.38, co:0.40, av:0.68 },
];

const EDGES = [
  [0, 1, 2500, 1415],   // Mumbai  ↔ Delhi
  [0, 2, 1800,  984],   // Mumbai  ↔ Bangalore
  [0, 3, 1400, 1338],   // Mumbai  ↔ Chennai
  [0, 5,  450, 1153],   // Mumbai  ↔ Jaipur
  [1, 4, 1600, 1472],   // Delhi   ↔ Kolkata
  [1, 6, 1200,  555],   // Delhi   ↔ Lucknow
  [1, 5,  900,  281],   // Delhi   ↔ Jaipur
  [1, 8,  300,  370],   // Delhi   ↔ Shimla
  [2, 3, 1100,  346],   // Bangalore ↔ Chennai
  [2, 7,  200, 1058],   // Bangalore ↔ Bhopal
  [3, 4,  350, 1659],   // Chennai ↔ Kolkata
  [4, 9,  700,  594],   // Kolkata ↔ Patna
  [4, 6,  400,  984],   // Kolkata ↔ Lucknow
  [6, 9,  600,  497],   // Lucknow ↔ Patna
  [6, 5,  500,  571],   // Lucknow ↔ Jaipur
  [5, 7,  250,  614],   // Jaipur  ↔ Bhopal
];

const VARIANTS = {
  covid:   { r0: 2.5, sev: 1.0, color: '#4f8ef7', label: 'Original COVID-19', desc: 'Moderate spread, high severity' },
  delta:   { r0: 5.0, sev: 1.4, color: '#ffb703', label: 'Delta',             desc: 'Faster spread, very severe'   },
  omicron: { r0: 8.0, sev: 0.8, color: '#9b72cf', label: 'Omicron',           desc: 'Fastest spread, lower severity' },
};
