
class Renderer {
  constructor(canvasId) {
    this.canvas  = document.getElementById(canvasId);
    this.ctx     = this.canvas.getContext('2d');
    this.W       = 0;
    this.H       = 0;
  }

  resize() {
    const wrap   = this.canvas.parentElement;
    this.canvas.width  = wrap.clientWidth;
    this.canvas.height = wrap.clientHeight;
    this.W = this.canvas.width;
    this.H = this.canvas.height;
  }

  cx(i) { return CITIES[i].nx * this.W; }
  cy(i) { return CITIES[i].ny * this.H; }
  cr(i) { return i < 5 ? 18 : i < 8 ? 13 : 10; }

  draw(state) {
    const { ctx, W, H } = this;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, W, H);

    this._drawIndia();
    this._drawEdges(state);
    this._drawPathHighlight(state);
    this._drawCities(state);
  }

  _drawIndia() {
    const { ctx, W, H } = this;
    const pts = [
      [.27,.07],[.32,.11],[.20,.17],[.14,.27],[.17,.39],[.21,.51],
      [.19,.61],[.24,.69],[.27,.79],[.29,.87],[.37,.91],[.44,.94],
      [.51,.91],[.57,.87],[.67,.81],[.74,.74],[.79,.61],[.77,.49],
      [.71,.37],[.64,.29],[.59,.21],[.54,.17],[.51,.11],[.49,.07],
      [.44,.04],[.41,.03],[.39,.04],[.37,.05],[.35,.06],[.29,.07]
    ];
    ctx.beginPath();
    pts.forEach(([x, y], i) =>
      i ? ctx.lineTo(x * W, y * H) : ctx.moveTo(x * W, y * H)
    );
    ctx.closePath();
    ctx.fillStyle   = '#0f1526';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth   = 1;
    ctx.stroke();
  }

  _drawEdges(state) {
    const { ctx, W, H } = this;
    const drawn = new Set();

    EDGES.forEach(([a, b], ei) => {
      const key = Math.min(a,b) + '-' + Math.max(a,b);
      if (drawn.has(key)) return;
      drawn.add(key);

      const edge = state.graph ? state.graph.getEdgeBetween(a, b) : null;
      const active = edge ? edge.active : true;
      const aInf = state.cityState[a] === 'infected' || a === state.pzIdx;
      const bInf = state.cityState[b] === 'infected' || b === state.pzIdx;

      const x1 = this.cx(a), y1 = this.cy(a);
      const x2 = this.cx(b), y2 = this.cy(b);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);

      if (!active) {
        ctx.strokeStyle = 'rgba(72,149,239,0.2)';
        ctx.setLineDash([5, 4]);
        ctx.lineWidth = 0.8;
      } else if (aInf && bInf) {
        ctx.strokeStyle = 'rgba(255,77,109,0.5)';
        ctx.setLineDash([]);
        ctx.lineWidth = 1.8;
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.setLineDash([]);
        ctx.lineWidth = 1;
      }
      ctx.stroke();
      ctx.setLineDash([]);

      if (active && edge && edge.w < Infinity) {
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        ctx.font = '9px "DM Sans",monospace';
        ctx.fillStyle = 'rgba(139,147,184,0.45)';
        ctx.textAlign = 'center';
        ctx.fillText(edge.w.toFixed(1) + 'd', mx, my - 5);
      }
    });
    ctx.textAlign = 'left';
  }

  _drawPathHighlight(state) {
    if (state.selIdx === null || !state.simDone) return;
    const path = state.dijkstra ? state.dijkstra.reconstructPath(state.selIdx) : [];
    if (path.length < 2) return;

    const { ctx } = this;
    ctx.beginPath();
    ctx.moveTo(this.cx(path[0]), this.cy(path[0]));
    path.slice(1).forEach(i => ctx.lineTo(this.cx(i), this.cy(i)));
    ctx.strokeStyle = 'rgba(126,184,255,0.75)';
    ctx.lineWidth   = 3.5;
    ctx.setLineDash([]);
    ctx.stroke();
  }

  _drawCities(state) {
    const { ctx } = this;

    for (let i = 0; i < CITIES.length; i++) {
      const cx = this.cx(i), cy = this.cy(i), r = this.cr(i);
      const st = state.cityState[i];
      const day = state.dijkstra ? state.dijkstra.infectionDay[i] : Infinity;

      const fill =
        st === 'locked'   ? '#4895ef' :
        i === state.pzIdx ? '#ff6b35' :
        st === 'infected' ? '#ff4d6d' : '#06d6a0';

      if (i === state.pzIdx || st === 'infected') {
        const gc = i === state.pzIdx ? 'rgba(255,107,53,' : 'rgba(255,77,109,';
        ctx.beginPath(); ctx.arc(cx, cy, r * 2.6, 0, Math.PI * 2);
        ctx.fillStyle = gc + '0.07)'; ctx.fill();
        ctx.beginPath(); ctx.arc(cx, cy, r * 1.7, 0, Math.PI * 2);
        ctx.fillStyle = gc + '0.13)'; ctx.fill();
      }


      if (i === state.selIdx) {
        ctx.beginPath(); ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(126,184,255,0.85)';
        ctx.lineWidth = 2.5; ctx.stroke();
      }


      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = fill; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 1.5; ctx.stroke();

      ctx.font = `500 ${i < 5 ? 11 : 10}px "DM Sans",sans-serif`;
      ctx.fillStyle = 'rgba(232,234,246,0.88)';
      ctx.textAlign = 'center';
      ctx.fillText(CITIES[i].name, cx, cy + r + 14);

      if (day < Infinity) {
        const label = day === 0 ? 'D0' : 'D' + day.toFixed(1);
        const bw = label.length * 7 + 8;
        ctx.fillStyle = 'rgba(10,14,26,0.85)';
        ctx.beginPath();
        ctx.roundRect(cx - bw / 2, cy - r - 19, bw, 13, 4);
        ctx.fill();
        ctx.font = 'bold 9px "Syne",monospace';
        ctx.fillStyle = i === state.pzIdx ? '#ff8fa3' : '#ffd166';
        ctx.textAlign = 'center';
        ctx.fillText(label, cx, cy - r - 9);
      }
    }
    ctx.textAlign = 'left';
  }

  hitTest(mx, my) {
    for (let i = 0; i < CITIES.length; i++) {
      if (Math.hypot(mx - this.cx(i), my - this.cy(i)) <= this.cr(i) + 8) return i;
    }
    return -1;
  }
}
