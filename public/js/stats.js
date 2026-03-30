
class StatisticalEngine {
  constructor(seed = 42) {
    this._seed = seed;
  }

  _rand() {
    this._seed += 0x6d2b79f5;
    let t = this._seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  _clamp(v) { return Math.max(0, Math.min(1, v)); }

  sampleNormal(mean, stddev) {
    const u = Math.max(1e-9, this._rand());
    const v = Math.max(1e-9, this._rand());
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    return this._clamp(mean + stddev * z);
  }

  _sampleGamma(shape) {
    if (shape < 1) {
      return this._sampleGamma(1 + shape) * Math.pow(this._rand(), 1 / shape);
    }
    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);
    for (;;) {
      let x, v;
      do { x = (this._rand() * 2 - 1) * 4; v = 1 + c * x; } while (v <= 0);
      v = v * v * v;
      const u = this._rand();
      if (u < 1 - 0.0331 * (x * x) * (x * x)) return d * v;
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
    }
  }

  sampleBeta(mean, concentration = 20) {
    const alpha = mean * concentration;
    const beta  = (1 - mean) * concentration;
    const g1 = this._sampleGamma(alpha);
    const g2 = this._sampleGamma(beta);
    return g1 + g2 === 0 ? mean : this._clamp(g1 / (g1 + g2));
  }

  samplePoisson(lambda) {
    const L = Math.exp(-lambda);
    let k = 0, p = 1;
    do { k++; p *= this._rand(); } while (p > L);
    return this._clamp((k - 1) / 3000);
  }

  generateCityFactors(city) {
    return {
      d:  this.sampleNormal(city.d,  0.04),   
      h:  this.sampleNormal(city.h,  0.04),   
      im: this.sampleBeta(city.im,  18),      
      co: this.sampleNormal(city.co, 0.04),   
      av: city.av,                            
    };
  }

  generateConnectivity(lambda) {
    return Math.max(0.05, this.samplePoisson(lambda));
  }
}
