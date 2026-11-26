/* ==========================================================================
   VERTEX, Concept View
   Section-based content within each of the four levels (not a fixed
   summary/body/example shape): the section list flexes per concept, the
   same way a statistical method and a business framework need different
   treatment. Connected concepts render once per page, below the levels,
   with a dark ego graph and "where to go from here" cards, modelled on
   how FinHub's knowledge graph pages behave.
   ========================================================================== */

import { renderEgoGraph } from "./ego-graph.js";
import { hasArtifact, mountArtifact } from "./artifacts.js";

const LEVEL_ORDER = ["beginner", "intermediate", "advanced", "pro"];
const LEVEL_LABEL = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  pro: "Pro"
};

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderSections(sections) {
  if (!sections || !sections.length) {
    return `<p class="meta">This level has not been drafted yet. It is classified and queued, not skipped.</p>`;
  }
  return sections.map((s) => {
    if (s.kind === "result") {
      return `
        <section>
          <h4>${escapeHtml(s.label)}</h4>
          <div class="result-callout">
            <span class="result-tag">Result</span>
            <p class="result-line">${escapeHtml(s.headline)}</p>
          </div>
          ${s.note ? `<p class="meta">${escapeHtml(s.note)}</p>` : ""}
        </section>`;
    }
    if (s.kind === "steps") {
      return `
        <section>
          <h4>${escapeHtml(s.label)}</h4>
          <ol class="step-list">
            ${s.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
          </ol>
        </section>`;
    }
    return `
      <section>
        <h4>${escapeHtml(s.label)}</h4>
        <p>${escapeHtml(s.body)}</p>
      </section>`;
  }).join("");
}

function renderConnected(concept, allById) {
  const related = (concept.related || []).map((id) => allById[id]).filter(Boolean);
  const cross = concept.cross_domain || [];
  if (!related.length && !cross.length) return "";

  const nextCards = related.slice(0, 2).map((r, i) => `
    <div class="next-card" data-id="${r.id}">
      <span class="meta">0${i + 1}</span>
      <h4>${escapeHtml(r.name)}</h4>
      <p>${escapeHtml((r.levels?.beginner?.summary) || "")}</p>
      <span class="read-next">Read next &rarr;</span>
    </div>
  `).join("");

  const crossChips = cross.map((c) => `<span class="chip" title="${escapeHtml(c.relation)}">${escapeHtml(c.label)}</span>`).join("");

  return `
    <section class="connected-section">
      <h4>Connected concepts</h4>
      <div class="ego-card">
        <canvas id="ego-canvas" width="600" height="320"></canvas>
      </div>
      ${crossChips ? `<p class="meta" style="margin-top:1rem;">Cross-domain</p><div class="chip-row">${crossChips}</div>` : ""}
      ${nextCards ? `
        <div class="where-next">
          <p class="meta">Where to go from here</p>
          <div class="next-grid">${nextCards}</div>
        </div>` : ""}
    </section>
  `;
}

export function renderConceptPanel(concept, activeLevel, allById, onSelectRelated) {
  if (!concept) {
    return `<div class="empty-state"><p>Choose a concept from the left to open it.</p></div>`;
  }

  const isPlanned = concept.status === "planned";
  const sections = concept.levels ? (concept.levels[activeLevel] && concept.levels[activeLevel].sections) : null;

  const tabs = LEVEL_ORDER.map((lvl) => `
    <button class="level-tab ${lvl === activeLevel ? "is-active" : ""}" data-level="${lvl}">
      ${LEVEL_LABEL[lvl]}
    </button>
  `).join("");

  const prereqs = (concept.prerequisites || []).map((id) => allById[id]).filter(Boolean);
  const readFirst = prereqs.length ? `
    <div class="read-first">
      <span class="meta">Read first</span>
      <div class="chip-row">
        ${prereqs.map((p) => `<button class="chip chip-link" data-id="${p.id}">${escapeHtml(p.name)}</button>`).join("")}
      </div>
    </div>` : "";

  const refs = (concept.references || []).map((r) => `
    <li>${escapeHtml(r.text)} <cite>(${escapeHtml(r.type)})</cite></li>
  `).join("");

  const html = `
    <article class="concept-panel">
      <div class="concept-eyebrow">
        <span>${escapeHtml(concept.category)}</span>
        <span>&middot;</span>
        <span>${escapeHtml(concept.id)}</span>
        ${concept.artifact_required ? `<span class="badge badge-artifact">Interactive artifact</span>` : ""}
      </div>
      <h2>${escapeHtml(concept.name)}</h2>
      ${readFirst}

      ${isPlanned ? `
        <p class="meta" style="margin-top:1.5rem;">Classified and registry-placed. Full content is queued for an upcoming batch, not yet drafted.</p>
      ` : `
        <div class="level-tabs">${tabs}</div>
        <div class="level-body">${renderSections(sections)}</div>

        ${concept.artifact_required ? `
        <section style="margin-top:2rem;">
          <h4>Interactive artifact</h4>
          ${hasArtifact(concept.id)
            ? `<div class="artifact-shell" data-artifact-mount></div>`
            : `<p class="meta">Flagged for an interactive artifact. Not yet built, so nothing is shown in its place.</p>`}
        </section>` : ""}

        ${refs ? `
        <section style="margin-top:2rem;">
          <h4>References</h4>
          <ul class="ref-list">${refs}</ul>
        </section>` : ""}

        ${renderConnected(concept, allById)}
      `}

      <div class="status-line">Status: ${escapeHtml(concept.status)}</div>
    </article>
  `;

  // Deferred: wire the ego graph, the interactive artifact, and chip clicks
  // once this HTML is in the DOM.
  queueMicrotask(() => {
    const artifactMount = document.querySelector("[data-artifact-mount]");
    if (artifactMount) mountArtifact(artifactMount, concept.id);

    const canvas = document.getElementById("ego-canvas");
    if (canvas) {
      const neighbourIds = (concept.related || []);
      const neighbours = neighbourIds.map((id) => allById[id]).filter(Boolean).map((c) => ({ id: c.id, label: c.name, name: c.name }));
      if (neighbours.length) {
        renderEgoGraph(canvas, { center: { name: concept.name }, neighbors: neighbours }, onSelectRelated);
      }
    }
    document.querySelectorAll("[data-id].chip-link, .next-card[data-id]").forEach((el) => {
      el.addEventListener("click", () => onSelectRelated(el.dataset.id));
    });
  });

  return html;
}
