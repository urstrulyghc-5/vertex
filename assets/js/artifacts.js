/* ==========================================================================
   VERTEX, Interactive Artifacts
   Real simulators, meaningful inputs, accurate calculations, nothing that
   just animates a predetermined value. One module per concept that is
   both implemented and flagged artifact_required in its registry entry.
   A concept flagged artifact_required with no module here gets an honest
   "not yet built" notice instead of a badge with nothing behind it.
   ========================================================================== */

function nCk(n, k) {
  k = Math.min(k, n - k);
  let r = 1;
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1);
  return r;
}

function binomialPmf(n, p) {
  const out = [];
  for (let k = 0; k <= n; k++) out.push(nCk(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k));
  return out;
}

function normalPdf(x, mu, sigma) {
  return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));
}

function drawBars(canvas, values, highlightIndex) {
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth, h = canvas.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const max = Math.max(...values, 0.0001);
  const gap = 3;
  const barW = (w - gap * (values.length - 1)) / values.length;
  values.forEach((v, i) => {
    const barH = (v / max) * (h - 24);
    const x = i * (barW + gap);
    const y = h - barH - 18;
    ctx.fillStyle = i === highlightIndex ? "#C17A3E" : "rgba(53, 70, 107, 0.55)";
    ctx.fillRect(x, y, barW, barH);
  });
}

function drawCurve(canvas, points, xMin, xMax) {
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth, h = canvas.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const maxY = Math.max(...points.map((p) => p.y), 0.0001);
  ctx.beginPath();
  points.forEach((p, i) => {
    const px = ((p.x - xMin) / (xMax - xMin)) * w;
    const py = h - 18 - (p.y / maxY) * (h - 24);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  });
  ctx.lineTo(w, h - 18);
  ctx.lineTo(0, h - 18);
  ctx.closePath();
  ctx.fillStyle = "rgba(193, 122, 62, 0.18)";
  ctx.fill();
  ctx.beginPath();
  points.forEach((p, i) => {
    const px = ((p.x - xMin) / (xMax - xMin)) * w;
    const py = h - 18 - (p.y / maxY) * (h - 24);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  });
  ctx.strokeStyle = "#C17A3E";
  ctx.lineWidth = 2;
  ctx.stroke();
}

/* ---- STAT-004: Basic Probability. Favorable outcomes over total
   outcomes, shown both as a number and as a grid you can see. ---- */
function mountProbabilitySimulator(container) {
  container.innerHTML = `
    <div class="artifact-controls">
      <label>Favorable outcomes: <span data-out="fav">3</span>
        <input type="range" min="0" max="20" value="3" data-input="fav" />
      </label>
      <label>Total outcomes: <span data-out="total">10</span>
        <input type="range" min="1" max="20" value="10" data-input="total" />
      </label>
    </div>
    <div class="artifact-result">
      <span class="result-tag">Probability</span>
      <p class="result-line" data-out="prob">0.300</p>
    </div>
    <div class="artifact-grid" data-grid></div>
  `;
  const favInput = container.querySelector('[data-input="fav"]');
  const totalInput = container.querySelector('[data-input="total"]');
  const grid = container.querySelector("[data-grid]");

  function render() {
    let fav = Number(favInput.value);
    const total = Number(totalInput.value);
    favInput.max = total;
    if (fav > total) { fav = total; favInput.value = String(fav); }
    container.querySelector('[data-out="fav"]').textContent = fav;
    container.querySelector('[data-out="total"]').textContent = total;
    const p = total > 0 ? fav / total : 0;
    container.querySelector('[data-out="prob"]').textContent = p.toFixed(3);

    grid.innerHTML = "";
    for (let i = 0; i < total; i++) {
      const cell = document.createElement("span");
      cell.className = "artifact-cell" + (i < fav ? " is-favorable" : "");
      grid.appendChild(cell);
    }
  }
  favInput.addEventListener("input", render);
  totalInput.addEventListener("input", render);
  render();
}

/* ---- STAT-005: Probability Distributions. Uniform and Binomial as bar
   charts (discrete), Normal as a filled curve (continuous), switching the
   chart type honestly rather than faking a bar chart into looking
   continuous or vice versa. ---- */
function mountDistributionExplorer(container) {
  container.innerHTML = `
    <div class="artifact-controls">
      <div class="artifact-tabs">
        <button class="artifact-tab is-active" data-dist="uniform">Uniform</button>
        <button class="artifact-tab" data-dist="binomial">Binomial</button>
        <button class="artifact-tab" data-dist="normal">Normal</button>
      </div>
      <div data-params-uniform>
        <label>Outcomes (n): <span data-out="u-n">6</span>
          <input type="range" min="2" max="12" value="6" data-input="u-n" />
        </label>
      </div>
      <div data-params-binomial hidden>
        <label>Trials (n): <span data-out="b-n">10</span>
          <input type="range" min="1" max="30" value="10" data-input="b-n" />
        </label>
        <label>Success probability (p): <span data-out="b-p">0.50</span>
          <input type="range" min="0" max="1" step="0.01" value="0.5" data-input="b-p" />
        </label>
      </div>
      <div data-params-normal hidden>
        <label>Mean (&mu;): <span data-out="n-mu">0</span>
          <input type="range" min="-5" max="5" step="0.5" value="0" data-input="n-mu" />
        </label>
        <label>Std. deviation (&sigma;): <span data-out="n-sigma">1</span>
          <input type="range" min="0.3" max="3" step="0.1" value="1" data-input="n-sigma" />
        </label>
      </div>
    </div>
    <canvas class="artifact-canvas" data-chart></canvas>
  `;
  const chart = container.querySelector("[data-chart]");
  let dist = "uniform";

  function setDist(next) {
    dist = next;
    container.querySelectorAll(".artifact-tab").forEach((t) => t.classList.toggle("is-active", t.dataset.dist === dist));
    container.querySelector("[data-params-uniform]").hidden = dist !== "uniform";
    container.querySelector("[data-params-binomial]").hidden = dist !== "binomial";
    container.querySelector("[data-params-normal]").hidden = dist !== "normal";
    render();
  }

  function render() {
    if (dist === "uniform") {
      const n = Number(container.querySelector('[data-input="u-n"]').value);
      container.querySelector('[data-out="u-n"]').textContent = n;
      drawBars(chart, Array(n).fill(1 / n), -1);
    } else if (dist === "binomial") {
      const n = Number(container.querySelector('[data-input="b-n"]').value);
      const p = Number(container.querySelector('[data-input="b-p"]').value);
      container.querySelector('[data-out="b-n"]').textContent = n;
      container.querySelector('[data-out="b-p"]').textContent = p.toFixed(2);
      const pmf = binomialPmf(n, p);
      const mode = pmf.indexOf(Math.max(...pmf));
      drawBars(chart, pmf, mode);
    } else {
      const mu = Number(container.querySelector('[data-input="n-mu"]').value);
      const sigma = Number(container.querySelector('[data-input="n-sigma"]').value);
      container.querySelector('[data-out="n-mu"]').textContent = mu;
      container.querySelector('[data-out="n-sigma"]').textContent = sigma;
      const xMin = mu - 4 * sigma, xMax = mu + 4 * sigma;
      const points = [];
      for (let i = 0; i <= 80; i++) {
        const x = xMin + ((xMax - xMin) * i) / 80;
        points.push({ x, y: normalPdf(x, mu, sigma) });
      }
      drawCurve(chart, points, xMin, xMax);
    }
  }

  container.querySelectorAll(".artifact-tab").forEach((t) => t.addEventListener("click", () => setDist(t.dataset.dist)));
  container.querySelectorAll("input[type=range]").forEach((inp) => inp.addEventListener("input", render));
  setDist("uniform");
}

const REGISTRY = {
  "STAT-004": mountProbabilitySimulator,
  "STAT-005": mountDistributionExplorer,
};

export function hasArtifact(conceptId) {
  return Boolean(REGISTRY[conceptId]);
}

export function mountArtifact(container, conceptId) {
  const fn = REGISTRY[conceptId];
  if (fn) fn(container);
}
