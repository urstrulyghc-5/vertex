/* ==========================================================================
   VERTEX, Registry
   Loads domain concept files and exposes a single, consistent API over them.
   This is the only module that knows where data lives on disk; every other
   module asks the registry, it never reads a JSON file directly.
   ========================================================================== */

const DOMAIN_FILES = {
  "statistics-mathematics": "./data/concepts/statistics-mathematics.json"
  // Additional domain files are added here as batches land.
  // Nothing else in the codebase needs to change when a new domain arrives.
};

export async function loadDomain(domainKey) {
  const path = DOMAIN_FILES[domainKey];
  if (!path) throw new Error(`Unknown domain key: ${domainKey}`);
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json();
}

export async function loadAllDomains() {
  const keys = Object.keys(DOMAIN_FILES);
  const domains = await Promise.all(keys.map(loadDomain));
  return domains;
}

export function groupByCategory(domain) {
  const groups = new Map();
  for (const category of domain.categories) groups.set(category, []);
  for (const concept of domain.concepts) {
    if (!groups.has(concept.category)) groups.set(concept.category, []);
    groups.get(concept.category).push(concept);
  }
  return groups;
}

export function findConcept(domain, id) {
  return domain.concepts.find((c) => c.id === id) || null;
}
