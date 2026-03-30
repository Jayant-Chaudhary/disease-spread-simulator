
const BASE_SCALE = 80;

class Graph {
  constructor() {
    this.cityFactors  = [];  
    this.edgeList     = [];  
    this.adjList      = [];  
  }

 
  build(cities, edges, variant, statsEngine) {
    const n = cities.length;
    this.cityFactors = cities.map(c => statsEngine.generateCityFactors(c));
    this.adjList     = Array.from({length: n}, () => []);
    this.edgeList    = [];

    const r0 = VARIANTS[variant].r0;

    edges.forEach(([a, b, lambda, dist]) => {
      const conn = statsEngine.generateConnectivity(lambda);
      const w    = this._computeWeight(a, b, conn, dist, r0);

      const idxAB = this.edgeList.length;
      this.edgeList.push({ a, b, w, conn, lambda, dist, active: true });
      this.adjList[a].push(idxAB);

      const idxBA = this.edgeList.length;
      this.edgeList.push({ a: b, b: a, w, conn, lambda, dist, active: true });
      this.adjList[b].push(idxBA);
    });
  }

  _computeWeight(a, b, conn, dist, r0) {
    const fa = this.cityFactors[a];
    const fb = this.cityFactors[b];

    const baseTime       = dist / (conn * BASE_SCALE);
    const spreadFactor   = fa.d * (1 - fa.co);
    const resistFactor   = (1 - fb.im) * (1 - fb.h) * fb.av;
    const r0Multiplier   = r0 / 2.5;

    const raw = baseTime * spreadFactor * resistFactor * r0Multiplier;
    return Math.max(0.5, raw); 
  }

  recomputeWeights(variant) {
    const r0 = VARIANTS[variant].r0;
    this.edgeList.forEach((e, idx) => {
      const w = this._computeWeight(e.a, e.b, e.conn, e.dist, r0);
      this.edgeList[idx].w     = w;
      this.edgeList[idx + 1].w = w;
    });
  }

  lockCity(cityIdx) {
    this.edgeList.forEach(e => {
      if (e.a === cityIdx || e.b === cityIdx) e.active = false;
    });
  }

  getNeighbors(cityIdx) {
    return this.adjList[cityIdx]
      .map(idx => this.edgeList[idx])
      .filter(e => e.active);
  }

  getEdgeBetween(a, b) {
    return this.edgeList.find(e => e.a === a && e.b === b);
  }

  reset() {
    this.edgeList.forEach(e => e.active = true);
  }
}
