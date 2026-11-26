/* ==========================================================================
   VERTEX, Ego Graph
   A small, dark, radial graph: one concept at the centre, its directly
   related and cross-domain concepts around it. This is the connective
   tissue component that also seeds the larger central tree later; same
   drawing logic, smaller scale, no decorative force simulation.
   ========================================================================== */

export function renderEgoGraph(canvas, { center, neighbors }, onSelect) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssWidth = canvas.clientWidth;
  const cssHeight = canvas.clientHeight;
  canvas.width = cssWidth * dpr;
  canvas.height = cssHeight * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  const cx = cssWidth / 2;
  const cy = cssHeight / 2;
  const radius = Math.min(cssWidth, cssHeight) * 0.34;

  const nodes = neighbors.map((n, i) => {
    const angle = (Math.PI * 2 * i) / neighbors.length - Math.PI / 2;
    return {
      ...n,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle)
    };
  });

  function draw(hoveredId) {
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    // Connecting lines: drawn first, under the nodes.
    ctx.strokeStyle = "rgba(197, 201, 212, 0.35)";
    ctx.lineWidth = 1;
    nodes.forEach((n) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(n.x, n.y);
      ctx.stroke();
    });

    // Centre node.
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fillStyle = "#C17A3E";
    ctx.fill();

    ctx.font = "600 14px Fraunces, serif";
    ctx.fillStyle = "#F2EEE3";
    ctx.textAlign = "center";
    ctx.fillText(center.name, cx, cy - 16);

    // Neighbour nodes.
    ctx.font = "13px Inter, sans-serif";
    nodes.forEach((n) => {
      const isHover = n.id === hoveredId;
      ctx.beginPath();
      ctx.arc(n.x, n.y, isHover ? 6 : 4.5, 0, Math.PI * 2);
      ctx.fillStyle = isHover ? "#8FD0C4" : "#5FA99B";
      ctx.fill();

      ctx.fillStyle = isHover ? "#FFFFFF" : "#CBD4D6";
      const labelX = n.x + (n.x > cx ? 10 : -10);
      ctx.textAlign = n.x > cx ? "left" : "right";
      ctx.fillText(n.label, labelX, n.y + 4);
    });
  }

  function nodeAt(px, py) {
    return nodes.find((n) => Math.hypot(n.x - px, n.y - py) < 14) || null;
  }

  draw(null);

  canvas.onmousemove = (e) => {
    const rect = canvas.getBoundingClientRect();
    const hit = nodeAt(e.clientX - rect.left, e.clientY - rect.top);
    canvas.style.cursor = hit ? "pointer" : "default";
    draw(hit ? hit.id : null);
  };

  canvas.onclick = (e) => {
    const rect = canvas.getBoundingClientRect();
    const hit = nodeAt(e.clientX - rect.left, e.clientY - rect.top);
    if (hit) onSelect(hit.id);
  };
}
