class UI {
  constructor() {
    this.cityList = document.getElementById("city-list");
    this.dayLog = document.getElementById("day-log");
    this.pathBox = document.getElementById("path-box");
    this.factorList = document.getElementById("factor-list");
    this.orderTable = document.getElementById("order-tbody");
    this.statusBar = document.getElementById("sb");
    this.runBtn = document.getElementById("run-btn");
    this.lockBtn = document.getElementById("lock-btn");
    this.tooltip = document.getElementById("tooltip");
  }

  setStep(n) {
    [1, 2, 3, 4].forEach((s) => {
      const el = document.getElementById("step" + s);
      el.classList.remove("active-step", "done-step");
      if (s < n) el.classList.add("done-step");
      else if (s === n) el.classList.add("active-step");
    });
  }

  setStatus(html) {
    this.statusBar.innerHTML = html;
  }

  setRunEnabled(enabled) {
    this.runBtn.disabled = !enabled;
  }

  showLockBtn(show) {
    this.lockBtn.style.display = show ? "" : "none";
  }

  setLockActive(active) {
    this.lockBtn.classList.toggle("active-lock", active);
    this.lockBtn.innerHTML = active ? "✕ Cancel lock mode" : "Lock down a city";
  }

  buildCityList(cityState, pzIdx, infDay, onCityClick) {
    this.cityList.innerHTML = "";
    CITIES.forEach((c, i) => {
      const st = cityState[i];
      const day = infDay && infDay[i] < Infinity ? infDay[i] : null;
      const col =
        st === "locked"
          ? "#4895ef"
          : i === pzIdx
            ? "#ff6b35"
            : st === "infected"
              ? "#ff4d6d"
              : "#06d6a0";
      const cls =
        "city-item" +
        (i === pzIdx
          ? " pz"
          : st === "locked"
            ? " locked"
            : st === "infected"
              ? " infected"
              : "");
      const dayBadge =
        day !== null
          ? `<span class="cday">${day === 0 ? "D0" : "D" + day.toFixed(1)}</span>`
          : "";

      const div = document.createElement("div");
      div.className = cls;
      div.innerHTML = `<div class="cdot" style="background:${col}"></div>
        <span class="cname">${c.name}</span>
        <span class="ctier">${c.tier}</span>${dayBadge}`;
      div.onclick = () => onCityClick(i);
      this.cityList.appendChild(div);
    });
  }

  //stats-codes
  updateStats(infected, safe, day, locked) {
    document.getElementById("s-inf").textContent = infected;
    document.getElementById("s-saf").textContent = safe;
    document.getElementById("s-day").textContent = day !== null ? day : "—";
    document.getElementById("s-lk").textContent = locked;
  }

  //day-log
  clearLog() {
    this.dayLog.innerHTML =
      '<span style="color:var(--text3);font-size:11px">Run simulation to see the timeline...</span>';
  }

  addLogEntry(day, cityIndices) {
    if (this.dayLog.querySelector("span")) this.dayLog.innerHTML = "";
    const div = document.createElement("div");
    div.className = "log-entry";
    div.innerHTML = `<span class="log-day">Day ${day}</span>
      <span class="log-cities">${cityIndices.map((i) => CITIES[i].name).join(", ")}</span>`;
    this.dayLog.appendChild(div);
    this.dayLog.scrollTop = this.dayLog.scrollHeight;
  }

  //infrction order table 
  buildOrderTable(infectionOrder, pzIdx) {
    this.orderTable.innerHTML = "";
    infectionOrder.forEach((entry, rank) => {
      const { cityIdx, day } = entry;
      const c = CITIES[cityIdx];
      const st =
        cityIdx === pzIdx
          ? "Patient Zero"
          : day === Infinity
            ? "Safe"
            : "Infected";
      const col =
        cityIdx === pzIdx
          ? "#ff6b35"
          : day === Infinity
            ? "#06d6a0"
            : "#ff4d6d";
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="color:var(--text3);font-family:'Syne',sans-serif;font-weight:700">${rank + 1}</td>
        <td>
          <div style="display:flex;align-items:center;gap:7px">
            <div style="width:8px;height:8px;border-radius:50%;background:${col};flex-shrink:0"></div>
            <span style="font-weight:500;color:var(--text)">${c.name}</span>
          </div>
        </td>
        <td><span class="tier-badge">${c.tier}</span></td>
        <td style="font-family:'Syne',sans-serif;font-weight:700;color:${cityIdx === pzIdx ? "#ff8fa3" : "#ffd166"}">
          ${cityIdx === pzIdx ? "D0" : "D" + day.toFixed(1)}
        </td>
        <td><span style="color:${col};font-size:11px">${st}</span></td>`;
      this.orderTable.appendChild(tr);
    });

    // Safe cities (unreachable)
    CITIES.forEach((c, i) => {
      if (infectionOrder.find((e) => e.cityIdx === i)) return;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="color:var(--text3)">—</td>
        <td>
          <div style="display:flex;align-items:center;gap:7px">
            <div style="width:8px;height:8px;border-radius:50%;background:#06d6a0;flex-shrink:0"></div>
            <span style="font-weight:500;color:var(--text)">${c.name}</span>
          </div>
        </td>
        <td><span class="tier-badge">${c.tier}</span></td>
        <td style="color:var(--text3)">—</td>
        <td><span style="color:#06d6a0;font-size:11px">Safe</span></td>`;
      this.orderTable.appendChild(tr);
    });
  }

  clearOrderTable() {
    this.orderTable.innerHTML = `
      <tr><td colspan="5" style="color:var(--text3);text-align:center;padding:16px;font-size:12px">
        Run the simulation to see infection order...
      </td></tr>`;
  }

  //Spread path
  showPath(path, infDay, pzIdx) {
    if (!path.length) {
      this.pathBox.innerHTML = `<span style="color:var(--red)">This city is unreachable from ${CITIES[pzIdx].name}</span>`;
      return;
    }
    const dst = path[path.length - 1];
    let html = "";
    path.forEach((ci, pi) => {
      const cls = ci === pzIdx ? "path-pz" : "path-city";
      html += `<span class="${cls}">${CITIES[ci].name}</span>`;
      if (pi < path.length - 1) html += '<span class="path-arr"> → </span>';
    });
    html += `<div class="path-time">Transmission time: ${infDay[dst].toFixed(2)} days from ${CITIES[pzIdx].name}</div>`;
    this.pathBox.innerHTML = html;
  }

  clearPath() {
    this.pathBox.innerHTML =
      '<span style="color:var(--text3)">Click any city after running the simulation...</span>';
  }

  //City factor bars
  buildFactors(cityFactors) {
    this.factorList.innerHTML = "";
    cityFactors.forEach((f, i) => {
      const c = CITIES[i];
      const div = document.createElement("div");
      div.className = "factor-row";
      div.innerHTML = `
        <div class="factor-header">
          <span class="factor-name">${c.name}</span>
          <span class="factor-val">${c.tier}</span>
        </div>
        <div class="factor-bars">
          <div class="fbar-wrap">
            <div class="fbar-label">Density</div>
            <div class="fbar"><div class="fbar-fill" style="width:${(f.d * 100).toFixed(0)}%;background:#4f8ef7"></div></div>
          </div>
          <div class="fbar-wrap">
            <div class="fbar-label">Healthcare</div>
            <div class="fbar"><div class="fbar-fill" style="width:${(f.h * 100).toFixed(0)}%;background:#06d6a0"></div></div>
          </div>
          <div class="fbar-wrap">
            <div class="fbar-label">Immunity</div>
            <div class="fbar"><div class="fbar-fill" style="width:${(f.im * 100).toFixed(0)}%;background:#9b72cf"></div></div>
          </div>
        </div>`;
      this.factorList.appendChild(div);
    });
  }

  showTooltip(i, infDay, cityState, pzIdx, x, y, canvasW, canvasH) {
    const f =
      window._simState && window._simState.graph
        ? window._simState.graph.cityFactors[i]
        : null;
    const st = cityState[i];
    const day = infDay && infDay[i] < Infinity ? infDay[i] : null;

    document.getElementById("tt-name").textContent = CITIES[i].name;
    document.getElementById("tt-status").textContent =
      i === pzIdx
        ? "Patient Zero"
        : st === "infected"
          ? "Infected"
          : st === "locked"
            ? "Locked down"
            : "Healthy";
    document.getElementById("tt-day").textContent =
      day !== null
        ? day === 0
          ? "Day 0"
          : "Day " + day.toFixed(2)
        : "Not infected";

    if (f) {
      document.getElementById("tt-d").textContent =
        (f.d * 100).toFixed(0) + "%";
      document.getElementById("tt-h").textContent =
        (f.h * 100).toFixed(0) + "%";
      document.getElementById("tt-i").textContent =
        (f.im * 100).toFixed(0) + "%";
      document.getElementById("tt-d-bar").style.width = f.d * 100 + "%";
      document.getElementById("tt-h-bar").style.width = f.h * 100 + "%";
      document.getElementById("tt-i-bar").style.width = f.im * 100 + "%";
    }

    const tx = Math.min(x + 16, canvasW - 210);
    const ty = Math.max(y - 170, 8);
    this.tooltip.style.left = tx + "px";
    this.tooltip.style.top = ty + "px";
    this.tooltip.classList.add("show");
  }

  hideTooltip() {
    this.tooltip.classList.remove("show");
  }
}
