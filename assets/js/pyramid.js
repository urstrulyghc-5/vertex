/* ==========================================================================
   VERTEX, Orbital Pyramid
   The one visual the entrance carries, and the only thing on that screen.
   A real triangular pyramid, four faces, rendered in a simple rotation and
   weak-perspective projection, no library. Foundations sit on the wide
   ring near the base, applied analytics on the middle ring, frontiers on
   the small ring near the apex, the same hierarchy the rings used before,
   now given actual mass: filled translucent faces, not a bare wireframe.
   The whole solid turns continuously as one body, with a slight cinematic
   rock on top of the turn, and never freezes.
   ========================================================================== */

import { DOMAINS, CONNECTIONS } from "./domains.js";

const TIER_Y = { foundations: -0.58, applied: 0.02, frontiers: 0.58 };
const TIER_R = { foundations: 0.92, applied: 0.58, frontiers: 0.22 };

const ROT_SPEED = (Math.PI * 2) / 46000; // one full turn roughly every 46s
const TILT_AMPLITUDE = 0.16;
const TILT_SPEED = (Math.PI * 2) / 13000;

export function mountPyramid(canvas, onOpenDomain) {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const ctx = canvas.getContext("2d");

  let w = 0, h = 0;
  function size() {
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
  }
  size();
  const ro = new ResizeObserver(() => size());
  ro.observe(canvas);

  // Model space: apex points up (+y), base sits at -y. Built once, rotated
  // fresh every frame.
  const apex = [0, 1, 0];
  const baseVerts = [0, 1, 2].map((i) => {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 3;
    return [Math.cos(a), -1, Math.sin(a)];
  });

  const byRing = { foundations: [], applied: [], frontiers: [] };
  DOMAINS.forEach((d) => byRing[d.ring].push(d));

  const domainModel = [];
  for (const ringName of Object.keys(byRing)) {
    const members = byRing[ringName];
    const y = TIER_Y[ringName];
    const r = TIER_R[ringName];
    members.forEach((d, i) => {
      const spread = (Math.PI * 2) / members.length;
      const jitter = ((i * 53) % 17) / 17 - 0.5;
      const angle = spread * i + jitter * spread * 0.18;
      domainModel.push({ ...d, ring: ringName, angle, baseY: y, baseR: r });
    });
  }
  const byId = Object.fromEntries(domainModel.map((n) => [n.slug, n]));

  function rotate([x, y, z], theta, phi) {
    const x1 = x * Math.cos(theta) + z * Math.sin(theta);
    const z1 = -x * Math.sin(theta) + z * Math.cos(theta);
    const y2 = y * Math.cos(phi) - z1 * Math.sin(phi);
    const z2 = y * Math.sin(phi) + z1 * Math.cos(phi);
    return [x1, y2, z2];
  }

  function project([x, y, z], cx, cy, scalePx, focal) {
    const s = focal / (focal + z);
    return { x: cx + x * s * scalePx, y: cy - y * s * scalePx, z, s };
  }

  let hovered = null;
  let lastScreen = {}; // slug -> {x,y,r}

  function draw(elapsed) {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    const scalePx = Math.min(w, h) * 0.34;
    const focal = 3.1;
    const theta = elapsed * ROT_SPEED;
    const phi = TILT_AMPLITUDE * Math.sin(elapsed * TILT_SPEED);

    // Grading wash, kept here rather than on the page, since the canvas is
    // now the entire entrance.
    const grade = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.6);
    grade.addColorStop(0, "rgba(193, 122, 62, 0.09)");
    grade.addColorStop(0.5, "rgba(53, 70, 107, 0.05)");
    grade.addColorStop(1, "rgba(53, 70, 107, 0)");
    ctx.fillStyle = grade;
    ctx.fillRect(0, 0, w, h);

    const apexP = project(rotate(apex, theta, phi), cx, cy, scalePx, focal);
    const baseP = baseVerts.map((v) => project(rotate(v, theta, phi), cx, cy, scalePx, focal));

    lastScreen = {};
    const domainP = domainModel.map((d) => {
      const model = [d.baseR * Math.cos(d.angle), d.baseY, d.baseR * Math.sin(d.angle)];
      const p = project(rotate(model, theta, phi), cx, cy, scalePx, focal);
      lastScreen[d.slug] = { x: p.x, y: p.y, r: d.status === "live" ? 6 : 4.5 };
      return { ...d, p };
    });

    // Build a single paint queue, farthest first.
    const queue = [];

    // Four faces, filled translucent, this is where the solid gets its
    // weight instead of reading as a bare wireframe.
    const faces = [
      { verts: [apexP, baseP[0], baseP[1]], tint: "rgba(53, 70, 107, 0.06)" },
      { verts: [apexP, baseP[1], baseP[2]], tint: "rgba(193, 122, 62, 0.05)" },
      { verts: [apexP, baseP[2], baseP[0]], tint: "rgba(53, 70, 107, 0.06)" },
      { verts: [baseP[0], baseP[1], baseP[2]], tint: "rgba(38, 36, 32, 0.045)" },
    ];
    faces.forEach((f) => {
      const avgZ = (f.verts[0].z + f.verts[1].z + f.verts[2].z) / 3;
      queue.push({ z: avgZ, draw: () => {
        ctx.beginPath();
        ctx.moveTo(f.verts[0].x, f.verts[0].y);
        ctx.lineTo(f.verts[1].x, f.verts[1].y);
        ctx.lineTo(f.verts[2].x, f.verts[2].y);
        ctx.closePath();
        ctx.fillStyle = f.tint;
        ctx.fill();
        ctx.strokeStyle = "rgba(53, 70, 107, 0.16)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }});
    });

    // Tier ring guides, faint polylines joining each tier's own domains.
    for (const ringName of Object.keys(byRing)) {
      const ringDomains = domainP.filter((d) => d.ring === ringName).sort((a, b) => a.angle - b.angle);
      if (ringDomains.length < 2) continue;
      const avgZ = ringDomains.reduce((s, d) => s + d.p.z, 0) / ringDomains.length;
      queue.push({ z: avgZ, draw: () => {
        ctx.beginPath();
        ringDomains.forEach((d, i) => {
          if (i === 0) ctx.moveTo(d.p.x, d.p.y); else ctx.lineTo(d.p.x, d.p.y);
        });
        ctx.closePath();
        ctx.strokeStyle = "rgba(38, 36, 32, 0.08)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }});
    }

    // Cross-domain connections.
    CONNECTIONS.forEach(([a, b]) => {
      const pa = domainP.find((d) => d.slug === a);
      const pb = domainP.find((d) => d.slug === b);
      if (!pa || !pb) return;
      const touchesLive = byId[a].status === "live" || byId[b].status === "live";
      const touchesHover = hovered === a || hovered === b;
      const avgZ = (pa.p.z + pb.p.z) / 2;
      queue.push({ z: avgZ, draw: () => {
        ctx.beginPath();
        ctx.moveTo(pa.p.x, pa.p.y);
        ctx.lineTo(pb.p.x, pb.p.y);
        ctx.strokeStyle = touchesHover
          ? "rgba(193, 122, 62, 0.6)"
          : touchesLive
          ? "rgba(193, 122, 62, 0.3)"
          : "rgba(53, 70, 107, 0.18)";
        ctx.lineWidth = touchesHover ? 1.8 : 1;
        ctx.stroke();
      }});
    });

    // Domain nodes.
    domainP.forEach((d) => {
      const isLive = d.status === "live";
      const isHover = hovered === d.slug;
      const r = (isLive ? 6 : 4.5) * d.p.s + (isHover ? 1.5 : 0);
      queue.push({ z: d.p.z, draw: () => {
        if (isLive) {
          const glow = ctx.createRadialGradient(d.p.x, d.p.y, 0, d.p.x, d.p.y, r * 4);
          glow.addColorStop(0, "rgba(193, 122, 62, 0.35)");
          glow.addColorStop(1, "rgba(193, 122, 62, 0)");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(d.p.x, d.p.y, r * 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(d.p.x, d.p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = isLive ? "#C17A3E" : isHover ? "#35466B" : "rgba(53, 70, 107, 0.5)";
        ctx.fill();

        if (isLive || isHover) {
          ctx.font = isLive ? "600 13px Fraunces, serif" : "500 12px Inter, sans-serif";
          ctx.fillStyle = "#262420";
          ctx.textAlign = d.p.x >= cx ? "left" : "right";
          const lx = d.p.x + (d.p.x >= cx ? 10 : -10);
          ctx.fillText(d.name, lx, d.p.y + 4);
        }
      }});
    });

    // Apex hub.
    queue.push({ z: apexP.z, draw: () => {
      ctx.beginPath();
      ctx.arc(apexP.x, apexP.y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(38, 36, 32, 0.55)";
      ctx.fill();
      ctx.font = "600 11px 'IBM Plex Mono', monospace";
      ctx.fillStyle = "rgba(38, 36, 32, 0.4)";
      ctx.textAlign = "center";
      ctx.fillText("VERTEX", apexP.x, apexP.y - 14);
    }});

    // Painter's algorithm: farthest (largest z) first, nearest last.
    queue.sort((a, b) => b.z - a.z);
    queue.forEach((item) => item.draw());
  }

  function hitTest(px, py) {
    for (const slug of Object.keys(lastScreen)) {
      const p = lastScreen[slug];
      if (Math.hypot(p.x - px, p.y - py) < p.r + 10) return byId[slug];
    }
    return null;
  }

  canvas.onmousemove = (e) => {
    const rect = canvas.getBoundingClientRect();
    const hit = hitTest(e.clientX - rect.left, e.clientY - rect.top);
    hovered = hit ? hit.slug : null;
    canvas.style.cursor = hit && hit.status === "live" ? "pointer" : "default";
  };
  canvas.onmouseleave = () => { hovered = null; };
  canvas.onclick = (e) => {
    const rect = canvas.getBoundingClientRect();
    const hit = hitTest(e.clientX - rect.left, e.clientY - rect.top);
    if (hit && hit.status === "live") onOpenDomain(hit.slug);
  };

  if (prefersReduced) {
    draw(0);
    return;
  }

  const start = performance.now();
  function frame(now) {
    draw(now - start);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
