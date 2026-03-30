
class MinHeap {
  constructor() { this._heap = []; }

  push(item) {
    this._heap.push(item);
    this._bubbleUp(this._heap.length - 1);
  }

  pop() {
    const top = this._heap[0];
    const last = this._heap.pop();
    if (this._heap.length > 0) {
      this._heap[0] = last;
      this._sinkDown(0);
    }
    return top;
  }

  get size() { return this._heap.length; }

  _bubbleUp(i) {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this._heap[parent].priority <= this._heap[i].priority) break;
      [this._heap[parent], this._heap[i]] = [this._heap[i], this._heap[parent]];
      i = parent;
    }
  }

  _sinkDown(i) {
    const n = this._heap.length;
    for (;;) {
      let smallest = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < n && this._heap[l].priority < this._heap[smallest].priority) smallest = l;
      if (r < n && this._heap[r].priority < this._heap[smallest].priority) smallest = r;
      if (smallest === i) break;
      [this._heap[i], this._heap[smallest]] = [this._heap[smallest], this._heap[i]];
      i = smallest;
    }
  }
}

class DijkstraEngine {
  constructor(graph) {
    this.graph        = graph;
    this.infectionDay = [];  // infectionDay[i] = days from Patient Zero to city i
    this.previousCity = [];  // previousCity[i] = which city infected city i
  }

  // Run Dijkstra from patientZeroIdx
  // Populates infectionDay and previousCity
  run(patientZeroIdx, cityCount) {
    this.infectionDay = Array(cityCount).fill(Infinity);
    this.previousCity = Array(cityCount).fill(-1);
    this.infectionDay[patientZeroIdx] = 0;

    const heap    = new MinHeap();
    const visited = new Set();
    heap.push({ city: patientZeroIdx, priority: 0 });

    while (heap.size > 0) {
      const { city: u, priority: d } = heap.pop();

      if (visited.has(u)) continue;
      // Skip stale entry
      if (d > this.infectionDay[u]) continue;
      visited.add(u);

      for (const edge of this.graph.getNeighbors(u)) {
        const newDay = this.infectionDay[u] + edge.w;
        if (newDay < this.infectionDay[edge.b]) {
          this.infectionDay[edge.b] = newDay;
          this.previousCity[edge.b] = u;
          heap.push({ city: edge.b, priority: newDay });
        }
      }
    }
  }

  // Reconstruct spread path from Patient Zero to destination
  // Uses a stack (array) to reverse the backtracked path — O(n)
  reconstructPath(dst) {
    if (this.infectionDay[dst] === Infinity) return []; // unreachable
    const stack = [];
    let cur = dst;
    while (cur !== -1) { stack.push(cur); cur = this.previousCity[cur]; }
    return stack.reverse(); // Patient Zero → destination
  }

  // Group cities by integer day bucket — for the day-by-day timeline
  // Uses a Map (hash map) keyed by day number
  getDayByDay(patientZeroIdx) {
    const map = new Map();
    this.infectionDay.forEach((day, i) => {
      if (day === Infinity) return;
      const bucket = i === patientZeroIdx ? 0 : Math.ceil(day);
      if (!map.has(bucket)) map.set(bucket, []);
      map.get(bucket).push(i);
    });
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }

  // Sorted infection order table: [cityIdx, day] sorted by day ascending
  getInfectionOrder(patientZeroIdx) {
    return this.infectionDay
      .map((day, i) => ({ cityIdx: i, day }))
      .filter(e => e.day < Infinity)
      .sort((a, b) => a.day - b.day);
  }

  infectedCount() {
    return this.infectionDay.filter(d => d < Infinity).length;
  }

  isReachable(cityIdx) {
    return this.infectionDay[cityIdx] < Infinity;
  }
}
