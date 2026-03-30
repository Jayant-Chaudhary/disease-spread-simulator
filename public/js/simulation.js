

class Simulation {
  constructor() {
    this.statsEngine = new StatisticalEngine(42);
    this.graph       = new Graph();
    this.dijkstra    = new DijkstraEngine(this.graph);
    this.renderer    = new Renderer('mc');
    this.ui          = new UI();

    this.variant   = 'covid';
    this.pzIdx     = null;
    this.selIdx    = null;
    this.lockMode  = false;
    this.simDone   = false;
    this.cityState = Array(CITIES.length).fill('healthy');
    this.animTid   = null;

    window._simState = this;

    this._init();
    this._bindEvents();
  }

  _init() {
    this.statsEngine = new StatisticalEngine(42);
    this.graph.build(CITIES, EDGES, this.variant, this.statsEngine);
    this.dijkstra    = new DijkstraEngine(this.graph);
    this.cityState   = Array(CITIES.length).fill('healthy');
    this.renderer.resize();
    this.ui.buildFactors(this.graph.cityFactors);
    this.ui.buildCityList(this.cityState, this.pzIdx, null, i => this.handleCityClick(i));
    this.ui.clearLog();
    this.ui.clearPath();
    this.ui.clearOrderTable();
    this.ui.updateStats(0, CITIES.length, null, 0);
    this.ui.setStep(1);
    this._draw();
  }

  _draw() {
    this.renderer.draw({
      graph:     this.graph,
      cityState: this.cityState,
      pzIdx:     this.pzIdx,
      selIdx:    this.selIdx,
      simDone:   this.simDone,
      dijkstra:  this.simDone ? this.dijkstra : null,
    });
  }

  _bindEvents() {
    window.addEventListener('resize', () => {
      this.renderer.resize();
      this._draw();
    });

    const canvas = this.renderer.canvas;

    canvas.addEventListener('click', e => {
      const rect = canvas.getBoundingClientRect();
      const hit  = this.renderer.hitTest(e.clientX - rect.left, e.clientY - rect.top);
      if (hit !== -1) this.handleCityClick(hit);
    });

    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      const mx   = e.clientX - rect.left;
      const my   = e.clientY - rect.top;
      const hit  = this.renderer.hitTest(mx, my);
      if (hit !== -1) {
        canvas.style.cursor = 'pointer';
        this.ui.showTooltip(
          hit,
          this.simDone ? this.dijkstra.infectionDay : null,
          this.cityState,
          this.pzIdx,
          mx, my,
          canvas.width, canvas.height
        );
      } else {
        canvas.style.cursor = 'default';
        this.ui.hideTooltip();
      }
    });

    canvas.addEventListener('mouseleave', () => this.ui.hideTooltip());
  }

  handleCityClick(i) {
    if (!this.simDone) { this.selectPatientZero(i); return; }
    if (this.lockMode) { this.lockCity(i); return; }
    this.showPath(i);
  }

  selectPatientZero(i) {
    this.pzIdx = i;
    this.ui.setRunEnabled(true);
    this.ui.setStatus('Patient zero: <b>' + CITIES[i].name + '</b> — now click Run Simulation');
    this.ui.setStep(3);
    this.ui.buildCityList(this.cityState, this.pzIdx, null, i => this.handleCityClick(i));
    this._draw();
  }

  run() {
    if (this.pzIdx === null) return;
    this.ui.setRunEnabled(false);
    this.ui.setStatus('Running Dijkstra\'s algorithm — finding <b>fastest spread routes</b>...');
    this.simDone = true;
    this.cityState[this.pzIdx] = 'infected';

    this.dijkstra.run(this.pzIdx, CITIES.length);
    const entries = this.dijkstra.getDayByDay(this.pzIdx);
    const order   = this.dijkstra.getInfectionOrder(this.pzIdx);

    this.ui.buildOrderTable(order, this.pzIdx);
    this.ui.clearLog();

    const delay = 1400 / +document.getElementById('spd').value;
    let step = 0;

    const tick = () => {
      if (step >= entries.length) {
        this.ui.showLockBtn(true);
        this.ui.setStatus('Done! Click any city to <b>trace its spread path</b>, or lock down cities to see the impact.');
        this.ui.setStep(4);
        this._finalStats();
        this.ui.buildCityList(this.cityState, this.pzIdx, this.dijkstra.infectionDay, i => this.handleCityClick(i));
        this._draw();
        return;
      }
      const [day, idxs] = entries[step];
      idxs.forEach(i => { if (i !== this.pzIdx) this.cityState[i] = 'infected'; });
      this.ui.addLogEntry(day, idxs);

      const inf = this.cityState.filter(s => s === 'infected').length;
      const lk  = this.cityState.filter(s => s === 'locked').length;
      this.ui.updateStats(inf, CITIES.length - inf - lk, day, lk);
      this.ui.buildCityList(this.cityState, this.pzIdx, this.dijkstra.infectionDay, i => this.handleCityClick(i));
      this._draw();
      step++;
      this.animTid = setTimeout(tick, delay);
    };
    tick();
  }

  _finalStats() {
    const entries = this.dijkstra.getDayByDay(this.pzIdx);
    const lastDay = entries.length ? entries[entries.length - 1][0] : 0;
    const inf     = this.cityState.filter(s => s === 'infected').length;
    const lk      = this.cityState.filter(s => s === 'locked').length;
    this.ui.updateStats(inf, CITIES.length - inf - lk, lastDay, lk);
  }

  showPath(dst) {
    this.selIdx = dst;
    const path = this.dijkstra.reconstructPath(dst);
    this.ui.showPath(path, this.dijkstra.infectionDay, this.pzIdx);
    this._draw();
  }

  toggleLockMode() {
    this.lockMode = !this.lockMode;
    this.ui.setLockActive(this.lockMode);
    this.ui.setStatus(
      this.lockMode
        ? 'Click a city on the map to <b>lock it down</b> — Dijkstra will rerun'
        : 'Click any city to trace its <b>spread path</b>'
    );
  }

  lockCity(i) {
    if (i === this.pzIdx) return;
    this.cityState[i] = 'locked';
    this.graph.lockCity(i);
    this.lockMode = false;
    this.ui.setLockActive(false);

    this.dijkstra.run(this.pzIdx, CITIES.length);
    const order = this.dijkstra.getInfectionOrder(this.pzIdx);
    this.ui.buildOrderTable(order, this.pzIdx);
    this._finalStats();
    this.ui.buildCityList(this.cityState, this.pzIdx, this.dijkstra.infectionDay, i => this.handleCityClick(i));
    this.ui.setStatus('Locked: <b>' + CITIES[i].name + '</b>. Dijkstra has recalculated all spread paths.');
    this._draw();
  }

  changeVariant(v) {
    this.variant = v;
    if (this.simDone) { this.reset(); return; }
    this.graph.recomputeWeights(v);
    this._draw();
  }

  reset() {
    if (this.animTid) clearTimeout(this.animTid);
    this.pzIdx     = null;
    this.selIdx    = null;
    this.lockMode  = false;
    this.simDone   = false;
    this.cityState = Array(CITIES.length).fill('healthy');

    this.statsEngine = new StatisticalEngine(42);
    this.graph       = new Graph();
    this.graph.build(CITIES, EDGES, this.variant, this.statsEngine);
    this.dijkstra    = new DijkstraEngine(this.graph);
    window._simState = this;

    this.ui.setRunEnabled(false);
    this.ui.showLockBtn(false);
    this.ui.setLockActive(false);
    this.ui.setStatus('Step 1: Select a <b>disease variant</b> above, then pick a <b>Patient Zero</b> city on the map or in the list');
    this.ui.buildCityList(this.cityState, null, null, i => this.handleCityClick(i));
    this.ui.buildFactors(this.graph.cityFactors);
    this.ui.clearLog();
    this.ui.clearPath();
    this.ui.clearOrderTable();
    this.ui.updateStats(0, CITIES.length, null, 0);
    this.ui.setStep(1);
    this._draw();
  }
}

let sim;
window.addEventListener('DOMContentLoaded', () => { sim = new Simulation(); });

function selVariant(btn) {
  document.querySelectorAll('.vbtn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  sim.changeVariant(btn.dataset.v);
}

function runSim()     { sim.run(); }
function toggleLock() { sim.toggleLockMode(); }
function resetSim()   { sim.reset(); }
