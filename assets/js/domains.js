/* ==========================================================================
   VERTEX, Domain Registry Metadata
   The 13 domains as they appear on the Knowledge landing page. Progress
   counts are real, drawn from the actual concept files, never rounded up.
   Only Statistics & Mathematics has a working domain file so far; the rest
   are classified and queued, not hidden and not faked as further along.
   ========================================================================== */

/* "ring" groups each domain for the orbital entrance visual: foundations
   sit closest to the center, frontiers sit furthest out. This is a
   presentation grouping, it does not change a domain's own classification
   in the registry. */
export const DOMAINS = [
  { slug: "statistics-mathematics", name: "Statistics & Mathematics", tagline: "Where every method starts", total: 38, status: "live", ring: "foundations" },
  { slug: "research-history", name: "Research, Knowledge & History", tagline: "Where the discipline came from", total: 15, status: "planned", ring: "foundations" },
  { slug: "data-analytics", name: "Data Analytics", tagline: "What the data actually shows", total: 22, status: "planned", ring: "applied" },
  { slug: "business-analytics", name: "Business Analytics", tagline: "What to do about it", total: 22, status: "planned", ring: "applied" },
  { slug: "functional-analytics", name: "Business & Functional Analytics", tagline: "Organized by function, not method", total: 25, status: "planned", ring: "applied" },
  { slug: "bi-decision-intelligence", name: "BI & Decision Intelligence", tagline: "From reporting to deciding", total: 20, status: "planned", ring: "applied" },
  { slug: "data-engineering", name: "Data Engineering & Infrastructure", tagline: "What makes data trustworthy", total: 20, status: "planned", ring: "applied" },
  { slug: "programming-tools", name: "Programming & Analytical Tools", tagline: "How it actually gets done", total: 25, status: "planned", ring: "applied" },
  { slug: "interactive-lab", name: "Interactive Learning Lab", tagline: "The smallest domain, on purpose", total: 10, status: "planned", ring: "applied" },
  { slug: "data-science-ml", name: "Data Science & Machine Learning", tagline: "From method to prediction", total: 32, status: "planned", ring: "frontiers" },
  { slug: "emerging-technologies", name: "Emerging Technologies", tagline: "The frontier, dated and sourced", total: 18, status: "planned", ring: "frontiers" },
  { slug: "case-studies", name: "Case Studies & Real-World Applications", tagline: "Analytics in actual organizations", total: 22, status: "planned", ring: "frontiers" },
  { slug: "career-development", name: "Career Development", tagline: "Where this knowledge leads", total: 15, status: "planned", ring: "frontiers" }
];

/* Real cross-domain relationships, drawn as connecting lines between rings
   on the orbital visual. Kept small and meaningful, not a line to every
   node, which would just be clutter with no actual relationship behind it. */
export const CONNECTIONS = [
  ["statistics-mathematics", "data-analytics"],
  ["statistics-mathematics", "data-science-ml"],
  ["research-history", "statistics-mathematics"],
  ["data-analytics", "business-analytics"],
  ["data-analytics", "bi-decision-intelligence"],
  ["business-analytics", "functional-analytics"],
  ["bi-decision-intelligence", "functional-analytics"],
  ["programming-tools", "data-engineering"],
  ["data-engineering", "data-science-ml"],
  ["data-science-ml", "emerging-technologies"],
  ["functional-analytics", "case-studies"],
  ["case-studies", "career-development"],
  ["interactive-lab", "statistics-mathematics"]
];
