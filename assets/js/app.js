/* ==========================================================================
   VERTEX, App
   Two views: the Knowledge landing (domain cards, the entrance) and a
   domain view (rail + concept panel). The entrance never shows concepts
   directly, same layering FinHub uses: universe, then domain, then
   category, then concept.
   ========================================================================== */

import { loadDomain, groupByCategory, findConcept } from "./registry.js";
import { renderConceptPanel } from "./concept-view.js";
import { DOMAINS } from "./domains.js";

const entranceEl = document.getElementById("entrance");
const homeEl = document.getElementById("knowledge-home");
const domainViewEl = document.getElementById("domain-view");
const startEl = document.getElementById("start-intro");
const allConceptsEl = document.getElementById("all-concepts");
const gridEl = document.getElementById("domain-grid");
const railEl = document.getElementById("rail");
const panelEl = document.getElementById("concept-panel");
const allConceptsListEl = document.getElementById("all-concepts-list");
const overallProgressEl = document.getElementById("overall-progress");

const views = { entrance: entranceEl, home: homeEl, domain: domainViewEl, start: startEl, allConcepts: allConceptsEl };

function showView(name) {
  for (const key of Object.keys(views)) {
    views[key].hidden = key !== name;
  }
}

let currentDomain = null;
let currentConcept = null;
let currentLevel = "beginner";
let byId = {};

function progressBarHtml(done, total) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return `
    <div class="progress-bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
      <div class="progress-bar-fill" style="width:${pct}%"></div>
    </div>`;
}

function renderDomainGrid() {
  gridEl.innerHTML = DOMAINS.map((d) => {
    return `
      <button class="domain-card ${d.status === "live" ? "is-live" : "is-planned"}" data-slug="${d.slug}" ${d.status !== "live" ? "disabled" : ""}>
        <span class="domain-progress" data-slug-progress="${d.slug}">0/${d.total}</span>
        <div class="domain-tagline">${d.tagline}</div>
        <h3>${d.name}</h3>
        <p>${d.status === "live" ? "Open to browse its categories and concepts." : "Classified and queued. Not yet drafted."}</p>
        <div data-slug-bar="${d.slug}">${progressBarHtml(0, d.total)}</div>
      </button>
    `;
  }).join("");

  gridEl.querySelectorAll(".domain-card.is-live").forEach((btn) => {
    btn.addEventListener("click", () => openDomain(btn.dataset.slug));
  });

  // Fill in the one real progress count we have.
  loadDomain("statistics-mathematics").then((d) => {
    const done = d.concepts.filter((c) => c.status === "implemented").length;
    const badge = gridEl.querySelector('[data-slug-progress="statistics-mathematics"]');
    if (badge) badge.textContent = `${done}/${d.concepts.length}`;
    const bar = gridEl.querySelector('[data-slug-bar="statistics-mathematics"]');
    if (bar) bar.innerHTML = progressBarHtml(done, d.concepts.length);
  });
}

async function openDomain(slug, conceptId) {
  if (slug !== "statistics-mathematics") return; // only live domain so far
  currentDomain = await loadDomain(slug);
  byId = Object.fromEntries(currentDomain.concepts.map((c) => [c.id, c]));
  currentConcept = conceptId ? findConcept(currentDomain, conceptId) : null;

  showView("domain");
  location.hash = currentConcept ? currentConcept.id : `domain/${slug}`;

  renderRail(currentDomain);
  renderPanel();
}

function showHome() {
  showView("home");
  location.hash = "home";
}

function showEntrance() {
  showView("entrance");
  location.hash = "";
}

function showStart() {
  showView("start");
  location.hash = "start";
}

async function showAllConcepts() {
  showView("allConcepts");
  location.hash = "all-concepts";
  await renderAllConcepts();
}

async function renderAllConcepts() {
  const stat = await loadDomain("statistics-mathematics");
  const totalConcepts = DOMAINS.reduce((sum, d) => sum + d.total, 0);
  const doneConcepts = stat.concepts.filter((c) => c.status === "implemented").length;
  overallProgressEl.innerHTML = `
    <p class="meta">${doneConcepts} of ${totalConcepts} concepts drafted across all thirteen domains</p>
    ${progressBarHtml(doneConcepts, totalConcepts)}
  `;

  const groups = groupByCategory(stat);
  let html = `<div class="rail-group-title">${stat.name}</div>`;
  for (const [category, concepts] of groups.entries()) {
    html += `<p class="meta" style="margin-top: var(--space-3);">${category}</p>`;
    for (const c of concepts) {
      const dotClass = c.status === "implemented" ? "is-live" : "is-planned";
      html += `
        <button class="rail-item all-concepts-item ${dotClass}" data-slug="statistics-mathematics" data-id="${c.id}">
          <span>${c.name}</span>
          <span class="count">${c.status === "implemented" ? "written" : "planned"}</span>
        </button>`;
    }
  }

  for (const d of DOMAINS) {
    if (d.slug === "statistics-mathematics") continue;
    html += `
      <div class="rail-group-title" style="margin-top: var(--space-5);">${d.name}</div>
      <p class="meta">${d.total} concepts classified, not yet drafted individually.</p>`;
  }

  allConceptsListEl.innerHTML = html;
  allConceptsListEl.querySelectorAll(".all-concepts-item").forEach((btn) => {
    btn.addEventListener("click", () => openDomain(btn.dataset.slug, btn.dataset.id));
  });
}

function renderRail(domain) {
  const groups = groupByCategory(domain);
  let html = `<button class="rail-item" id="back-to-knowledge" style="font-weight:600; margin-bottom: var(--space-4);">&larr; All domains</button>`;
  for (const [category, concepts] of groups.entries()) {
    html += `<div class="rail-group-title">${category}</div>`;
    for (const c of concepts) {
      const selected = currentConcept && currentConcept.id === c.id ? "is-selected" : "";
      const marker = c.status === "planned" ? "&middot;" : "";
      html += `
        <button class="rail-item ${selected}" data-id="${c.id}">
          <span>${c.name}</span>
          <span class="count">${marker}</span>
        </button>`;
    }
  }
  railEl.innerHTML = html;

  document.getElementById("back-to-knowledge").addEventListener("click", showHome);
  railEl.querySelectorAll(".rail-item[data-id]").forEach((btn) => {
    btn.addEventListener("click", () => selectConcept(btn.dataset.id, { animate: true }));
  });
}

function selectConcept(id, { animate } = {}) {
  const concept = findConcept(currentDomain, id);
  currentConcept = concept;
  currentLevel = "beginner";
  location.hash = concept ? concept.id : "";

  if (animate) {
    panelEl.classList.add("is-transitioning");
    window.setTimeout(() => {
      renderPanel();
      renderRail(currentDomain);
      requestAnimationFrame(() => panelEl.classList.remove("is-transitioning"));
    }, 180);
  } else {
    renderPanel();
    renderRail(currentDomain);
  }
}

function renderPanel() {
  panelEl.innerHTML = renderConceptPanel(currentConcept, currentLevel, byId, (relatedId) => selectConcept(relatedId, { animate: true }));
  panelEl.querySelectorAll(".level-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentLevel = btn.dataset.level;
      renderPanel();
    });
  });
}

async function init() {
  renderDomainGrid();

  document.querySelectorAll("[data-go-entrance]").forEach((el) => {
    el.addEventListener("click", (e) => { e.preventDefault(); showEntrance(); });
  });
  document.querySelectorAll("[data-go-home]").forEach((el) => {
    el.addEventListener("click", (e) => { e.preventDefault(); showHome(); });
  });
  document.querySelectorAll("[data-go-start]").forEach((el) => {
    el.addEventListener("click", (e) => { e.preventDefault(); showStart(); });
  });
  document.querySelectorAll("[data-go-all-concepts]").forEach((el) => {
    el.addEventListener("click", (e) => { e.preventDefault(); showAllConcepts(); });
  });

  // Exposed so the orbit canvas, mounted outside this module, can open a
  // domain when the lit orbit is clicked.
  window.vertexOpenDomain = (slug) => openDomain(slug);

  const hash = location.hash.replace("#", "");
  if (hash === "home") {
    showHome();
  } else if (hash === "start") {
    showStart();
  } else if (hash === "all-concepts") {
    await showAllConcepts();
  } else if (hash.startsWith("domain/")) {
    await openDomain(hash.replace("domain/", ""));
  } else if (hash) {
    // A bare concept id, e.g. shared as #STAT-004: find which domain it
    // belongs to. Only one domain file exists so far.
    await openDomain("statistics-mathematics", hash);
  } else {
    showEntrance();
  }
}

init().catch((err) => {
  gridEl.innerHTML = `<p class="meta">Could not load the domain registry. ${err.message}</p>`;
  console.error(err);
});
