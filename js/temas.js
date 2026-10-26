// HEXABOARD — identidade visual de cada mundo: cenário de fundo animado,
// casas e paredes do tabuleiro, cores da interface na fase e arte dos cartões do mapa.
// As peças NÃO mudam de cor: cor = direção, é a linguagem do jogo.
const Temas = (() => {
  const T = {
    colmeia: {
      fx: "polen",
      light: { sky1: "#bfe3ff", sky2: "#eef8dc", far: "#a8d88e", near: "#82c46a", sun: "#fff3b0",
               cell: "#f4ecd2", cellEdge: "#d6c697", cellHi: "rgba(255,255,255,.55)",
               wall: "#a9a194", wallEdge: "#7b7468", wallLine: "#7b7468",
               fg: "#22301f", muted: "#4f6146", panel: "#ffffff", panelEdge: "#bfd2ab", fx: "#ffd23f" },
      dark:  { sky1: "#151d38", sky2: "#26363a", far: "#24402e", near: "#1b3224", sun: "#e9edf7",
               cell: "#5e5233", cellEdge: "#3d3520", cellHi: "rgba(255,255,255,.10)",
               wall: "#555259", wallEdge: "#33313a", wallLine: "#33313a",
               fg: "#eef3e6", muted: "#b2c0a6", panel: "#28332d", panelEdge: "#151c18", fx: "#ffe66b" },
    },
    geleira: {
      fx: "neve",
      light: { sky1: "#cfe9ff", sky2: "#f3faff", far: "#bcd6ec", near: "#9cc0e0", cap: "#ffffff",
               cell: "#e2eff9", cellEdge: "#a9c8e2", cellHi: "rgba(255,255,255,.9)",
               wall: "#9fd2ef", wallEdge: "#5a9ccc", wallLine: "rgba(255,255,255,.85)",
               fg: "#1d3350", muted: "#4d6987", panel: "#ffffff", panelEdge: "#b3cfe6", fx: "#ffffff" },
      dark:  { sky1: "#0a1430", sky2: "#15294a", far: "#1c3558", near: "#152d4c", cap: "#c4d8ee",
               cell: "#21395a", cellEdge: "#142842", cellHi: "rgba(255,255,255,.16)",
               wall: "#2f6d9c", wallEdge: "#1a466b", wallLine: "rgba(220,240,255,.6)",
               fg: "#e6f2ff", muted: "#9db7d4", panel: "#1d3352", panelEdge: "#0e1d33", fx: "#ffffff", aurora: true },
    },
    oficina: {
      fx: "poeira",
      light: { sky1: "#f2e2c2", sky2: "#dfc396", gear: "rgba(120,78,25,.13)", stripe: "rgba(120,78,25,.06)",
               cell: "#dccbad", cellEdge: "#ab8b56", cellHi: "rgba(255,255,255,.3)", rivet: "rgba(95,62,20,.4)",
               wall: "#6c6965", wallEdge: "#43403d", wallLine: "rgba(255,255,255,.28)",
               fg: "#3a2912", muted: "#6c5432", panel: "#fff8ea", panelEdge: "#c4a26c", fx: "#fff3cf" },
      dark:  { sky1: "#28190c", sky2: "#3c2914", gear: "rgba(255,196,110,.08)", stripe: "rgba(255,196,110,.03)",
               cell: "#6b5233", cellEdge: "#45321c", cellHi: "rgba(255,255,255,.08)", rivet: "rgba(0,0,0,.4)",
               wall: "#4b4845", wallEdge: "#2a2725", wallLine: "rgba(255,255,255,.18)",
               fg: "#f6e8cf", muted: "#cfb68e", panel: "#3a2a17", panelEdge: "#1e150a", fx: "#ffd27a" },
    },
    vulcao: {
      fx: "brasas",
      light: { sky1: "#3b2350", sky2: "#b8513c", far: "#5a2c3c", near: "#2a1a26", glow: "rgba(255,130,50,.55)",
               cell: "#4c3744", cellEdge: "#2d1e29", cellHi: "rgba(255,255,255,.08)", cellGlow: "rgba(255,120,50,.28)",
               wall: "#1f1a24", wallEdge: "#0e0b12", wallLine: "#ff8a3d",
               fg: "#fff2e8", muted: "#f2c7b0", panel: "#3b2632", panelEdge: "#1b1016", fx: "#ffb066", stars: true },
      dark:  { sky1: "#100818", sky2: "#41161f", far: "#2e1520", near: "#180d15", glow: "rgba(255,110,40,.45)",
               cell: "#3a2a35", cellEdge: "#21161e", cellHi: "rgba(255,255,255,.06)", cellGlow: "rgba(255,110,40,.22)",
               wall: "#17131b", wallEdge: "#09070c", wallLine: "#ff7a2e",
               fg: "#fff0e4", muted: "#e2b49c", panel: "#2f1e29", panelEdge: "#130b10", fx: "#ffa055", stars: true },
    },
    desafio: {
      fx: "brilho",
      light: { sky1: "#fff2c0", sky2: "#ffe1a6", rays: "rgba(255,255,255,.38)",
               cell: "#f4e9cc", cellEdge: "#d6bf86", cellHi: "rgba(255,255,255,.5)",
               wall: "#a59880", wallEdge: "#786c56", wallLine: "#786c56",
               fg: "#3a2d0e", muted: "#7a6532", panel: "#fffaf0", panelEdge: "#d9c494", fx: "#fffbe0" },
      dark:  { sky1: "#29220e", sky2: "#3b3013", rays: "rgba(255,220,120,.07)",
               cell: "#57492a", cellEdge: "#372e17", cellHi: "rgba(255,255,255,.08)",
               wall: "#4b4537", wallEdge: "#2c281e", wallLine: "#2c281e",
               fg: "#fbf0d4", muted: "#d0bd8c", panel: "#3a3118", panelEdge: "#1d180a", fx: "#ffe08a" },
    },
  };

  let name = "colmeia", P = T.colmeia.light;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function isDark() {
    const t = document.documentElement.getAttribute("data-theme");
    if (t) return t === "dark";
    return matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function palette(n = name) { return T[n][isDark() ? "dark" : "light"]; }

  // ---------- utilidades de desenho ----------
  function hex(c, x, y, s) {
    c.beginPath();
    for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i; i ? c.lineTo(x + s * Math.cos(a), y + s * Math.sin(a)) : c.moveTo(x + s * Math.cos(a), y + s * Math.sin(a)); }
    c.closePath();
  }
  function gear(c, x, y, r, teeth, ang, color) {
    c.save(); c.translate(x, y); c.rotate(ang); c.beginPath();
    const ri = r * 0.8, th = Math.PI * 2 / teeth;
    for (let i = 0; i < teeth; i++) {
      const a = i * th;
      const pts = [[a - th * 0.28, ri], [a - th * 0.16, r], [a + th * 0.16, r], [a + th * 0.28, ri]];
      for (const [aa, rr] of pts) c.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr);
    }
    c.closePath();
    c.moveTo(r * 0.32, 0); c.arc(0, 0, r * 0.32, 0, Math.PI * 2, true);
    c.fillStyle = color; c.fill("evenodd"); c.restore();
  }
  // número pseudo-aleatório estável (o cenário não muda a cada redesenho)
  let sd = 1; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;

  // ---------- casas e paredes ----------
  function drawCell(c, x, y, size) {
    const s = size * 0.94;
    hex(c, x, y + size * 0.08, s); c.fillStyle = P.cellEdge; c.fill();
    hex(c, x, y, s); c.fillStyle = P.cell; c.fill();
    c.save();
    if (name === "colmeia" || name === "desafio") {
      hex(c, x, y - s * 0.02, s * 0.72); c.strokeStyle = P.cellHi; c.lineWidth = Math.max(1, s * 0.06); c.stroke();
    } else if (name === "geleira") {
      c.strokeStyle = P.cellHi; c.lineWidth = Math.max(1, s * 0.07); c.lineCap = "round";
      c.beginPath(); c.moveTo(x - s * 0.5, y - s * 0.2); c.lineTo(x - s * 0.2, y - s * 0.58); c.stroke();
      c.beginPath(); c.moveTo(x - s * 0.28, y - s * 0.05); c.lineTo(x - s * 0.12, y - s * 0.26); c.stroke();
    } else if (name === "oficina") {
      c.fillStyle = P.rivet;
      for (const dx of [-0.58, 0.58]) { c.beginPath(); c.arc(x + s * dx, y, s * 0.075, 0, Math.PI * 2); c.fill(); }
    } else if (name === "vulcao") {
      hex(c, x, y, s * 0.96); c.strokeStyle = P.cellGlow; c.lineWidth = Math.max(1, s * 0.06); c.stroke();
    }
    c.restore();
  }
  function drawWall(c, x, y, size) {
    const s = size * 0.94, d = size * 0.22, yy = y - d * 0.5;
    hex(c, x, y + d * 0.5, s); c.fillStyle = P.wallEdge; c.fill();
    hex(c, x, yy, s); c.fillStyle = P.wall; c.fill();
    c.save(); c.lineCap = "round"; c.lineJoin = "round";
    if (name === "geleira") {
      // bloco de gelo: contorno claro e reflexos
      hex(c, x, yy, s * 0.8); c.strokeStyle = P.wallLine; c.lineWidth = Math.max(1, s * 0.05); c.stroke();
      c.lineWidth = Math.max(1.5, s * 0.09);
      c.beginPath(); c.moveTo(x - s * 0.45, yy + s * 0.1); c.lineTo(x - s * 0.05, yy - s * 0.5); c.stroke();
      c.beginPath(); c.moveTo(x - s * 0.15, yy + s * 0.3); c.lineTo(x + s * 0.12, yy - s * 0.1); c.stroke();
    } else if (name === "oficina") {
      // chapa de ferro com seis rebites
      hex(c, x, yy, s * 0.82); c.strokeStyle = P.wallLine; c.lineWidth = Math.max(1, s * 0.04); c.stroke();
      c.fillStyle = P.wallLine;
      for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i; c.beginPath(); c.arc(x + Math.cos(a) * s * 0.62, yy + Math.sin(a) * s * 0.62, s * 0.08, 0, Math.PI * 2); c.fill(); }
    } else if (name === "vulcao") {
      // obsidiana com rachaduras de lava
      c.strokeStyle = P.wallLine; c.lineWidth = Math.max(1.2, s * 0.07); c.shadowColor = P.wallLine; c.shadowBlur = s * 0.35;
      c.beginPath(); c.moveTo(x - s * 0.6, yy - s * 0.15); c.lineTo(x - s * 0.2, yy + s * 0.05); c.lineTo(x + s * 0.05, yy - s * 0.3); c.lineTo(x + s * 0.55, yy - s * 0.1); c.stroke();
      c.beginPath(); c.moveTo(x - s * 0.2, yy + s * 0.05); c.lineTo(x - s * 0.05, yy + s * 0.55); c.stroke();
    } else {
      // pedra com juntas
      c.strokeStyle = P.wallLine; c.lineWidth = Math.max(1.5, s * 0.07);
      c.beginPath();
      c.moveTo(x - s * 0.7, yy - s * 0.18); c.lineTo(x + s * 0.7, yy - s * 0.18);
      c.moveTo(x - s * 0.7, yy + s * 0.22); c.lineTo(x + s * 0.7, yy + s * 0.22);
      c.moveTo(x - s * 0.1, yy - s * 0.18); c.lineTo(x - s * 0.1, yy - s * 0.62);
      c.moveTo(x + s * 0.25, yy - s * 0.18); c.lineTo(x + s * 0.25, yy + s * 0.22);
      c.moveTo(x - s * 0.3, yy + s * 0.22); c.lineTo(x - s * 0.3, yy + s * 0.62);
      c.stroke();
    }
    c.restore();
  }

  // ---------- cenário de fundo ----------
  const bg = document.getElementById("bgfx"), bc = bg.getContext("2d");
  const still = document.createElement("canvas"), sc = still.getContext("2d");
  let W = 0, H = 0, parts = [], stars = [], t = 0;

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = bg.clientWidth; H = bg.clientHeight;
    if (!W || !H) return;
    bg.width = still.width = W * dpr; bg.height = still.height = H * dpr;
    bc.setTransform(dpr, 0, 0, dpr, 0, 0); sc.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildStill(); seed();
  }

  // Parte parada do cenário (céu, colinas, montanhas, vulcão): desenhada uma vez
  function buildStill() {
    const c = sc; sd = 7;
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, P.sky1); g.addColorStop(1, P.sky2);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    if (name === "colmeia") {
      c.fillStyle = P.sun; c.globalAlpha = .8; c.beginPath(); c.arc(W * 0.86, H * 0.74, Math.min(W, H) * 0.055, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
      for (const [col, base, amp] of [[P.far, 0.8, 0.07], [P.near, 0.88, 0.05]]) {
        c.fillStyle = col; c.beginPath(); c.moveTo(0, H);
        for (let x = 0; x <= W; x += 8) c.lineTo(x, H * base - Math.sin(x / W * Math.PI * 2 + base * 9) * H * amp);
        c.lineTo(W, H); c.closePath(); c.fill();
      }
      for (let i = 0; i < 22; i++) { // florzinhas
        const x = rnd() * W, y = H * (0.9 + rnd() * 0.08);
        c.fillStyle = ["#ffffff", "#ffd23f", "#ff9ec7"][i % 3]; c.globalAlpha = isDark() ? .25 : .9;
        c.beginPath(); c.arc(x, y, 2 + rnd() * 2, 0, Math.PI * 2); c.fill();
      }
      c.globalAlpha = 1;
    } else if (name === "geleira") {
      for (const [col, base, peaks] of [[P.far, 0.72, 5], [P.near, 0.82, 4]]) {
        const pts = [];
        for (let i = 0; i <= peaks; i++) pts.push([W * i / peaks, H * base - (i % 2 ? H * (0.1 + rnd() * 0.08) : H * 0.01)]);
        c.fillStyle = col; c.beginPath(); c.moveTo(0, H);
        for (const [x, y] of pts) c.lineTo(x, y);
        c.lineTo(W, H); c.closePath(); c.fill();
        c.fillStyle = P.cap; // neve no topo
        for (let i = 1; i < pts.length - 1; i++) {
          const [x, y] = pts[i]; if (y > H * base - H * 0.05) continue;
          const [px, py] = pts[i - 1], [nx, ny] = pts[i + 1];
          c.beginPath(); c.moveTo(x, y);
          c.lineTo(x + (px - x) * 0.25, y + (py - y) * 0.25); c.lineTo(x + (nx - x) * 0.25, y + (ny - y) * 0.25); c.closePath(); c.fill();
        }
      }
    } else if (name === "oficina") {
      c.fillStyle = P.stripe;
      for (let x = 0; x < W; x += 56) c.fillRect(x, 0, 2, H);
      const v = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
      v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(60,30,0,.22)");
      c.fillStyle = v; c.fillRect(0, 0, W, H);
    } else if (name === "vulcao") {
      c.fillStyle = P.far; c.beginPath(); c.moveTo(0, H);
      for (let x = 0; x <= W; x += 10) c.lineTo(x, H * 0.8 - Math.abs(Math.sin(x * 0.013)) * H * 0.06);
      c.lineTo(W, H); c.closePath(); c.fill();
      const cx = W * 0.5, top = H * 0.74, half = W * 0.55;
      const gl = c.createRadialGradient(cx, top, 0, cx, top, W * 0.4);
      gl.addColorStop(0, P.glow); gl.addColorStop(1, "rgba(255,120,40,0)");
      c.fillStyle = gl; c.fillRect(0, 0, W, H);
      c.fillStyle = P.near; c.beginPath();
      c.moveTo(cx - half, H); c.lineTo(cx - W * 0.08, top); c.lineTo(cx - W * 0.03, top + H * 0.012); c.lineTo(cx + W * 0.03, top + H * 0.012); c.lineTo(cx + W * 0.08, top); c.lineTo(cx + half, H);
      c.closePath(); c.fill();
    } else if (name === "desafio") {
      const gl = c.createRadialGradient(W / 2, 0, 0, W / 2, 0, H * 0.7);
      gl.addColorStop(0, "rgba(255,255,255,.5)"); gl.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = gl; c.fillRect(0, 0, W, H);
    }
    // estrelas paradas nos céus noturnos
    if (isDark() && (name === "colmeia" || name === "geleira")) {
      c.fillStyle = "#ffffff";
      for (let i = 0; i < 40; i++) { c.globalAlpha = 0.2 + rnd() * 0.5; c.beginPath(); c.arc(rnd() * W, rnd() * H * 0.5, rnd() * 1.3 + 0.3, 0, Math.PI * 2); c.fill(); }
      c.globalAlpha = 1;
    }
  }

  // Partículas animadas
  function seed() {
    parts = []; stars = [];
    const n = { polen: 26, neve: 70, poeira: 30, brasas: 45, brilho: 22 }[T[name].fx] || 0;
    for (let i = 0; i < n; i++) parts.push(newPart(true));
    if (P.stars) for (let i = 0; i < 60; i++) stars.push({ x: Math.random() * W, y: Math.random() * H * 0.55, r: Math.random() * 1.3 + 0.3, ph: Math.random() * 6 });
  }
  function newPart(anywhere) {
    const fx = T[name].fx, r = Math.random;
    if (fx === "neve") return { x: r() * W, y: anywhere ? r() * H : -5, r: 1 + r() * 2.4, vy: 18 + r() * 30, ph: r() * 6 };
    if (fx === "brasas") return { x: r() * W, y: anywhere ? r() * H : H + 5, r: 1 + r() * 2, vy: -(25 + r() * 55), ph: r() * 6, life: 0.4 + r() * 0.6 };
    if (fx === "brilho") return { x: r() * W, y: r() * H, r: 2 + r() * 4, ph: r() * 6, sp: 0.6 + r() * 1.2 };
    return { x: r() * W, y: r() * H, r: 1 + r() * 2.2, vx: 6 + r() * 12, vy: -3 - r() * 6, ph: r() * 6 }; // pólen, poeira
  }

  function frame(dt) {
    if (!W) return;
    const k = reduce ? 0 : dt / 1000;
    t += k;
    bc.drawImage(still, 0, 0, W, H);
    const fx = T[name].fx, dark = isDark();
    // engrenagens da oficina
    if (name === "oficina") {
      const m = Math.min(W, H);
      gear(bc, W * 0.08, H * 0.14, m * 0.24, 14, t * 0.12, P.gear);
      gear(bc, W * 0.08 + m * 0.37, H * 0.14 + m * 0.12, m * 0.15, 9, -t * 0.12 * 14 / 9 + 0.2, P.gear);
      gear(bc, W * 0.94, H * 0.86, m * 0.3, 16, -t * 0.08, P.gear);
      gear(bc, W * 0.94 - m * 0.4, H * 0.86 + m * 0.18, m * 0.13, 8, t * 0.08 * 16 / 8, P.gear);
    }
    // aurora boreal (geleira à noite)
    if (P.aurora) {
      bc.save(); bc.lineCap = "round";
      for (const [col, off, amp, lw] of [["rgba(90,255,190,.10)", 0, 26, 46], ["rgba(150,120,255,.08)", 2, 34, 36]]) {
        bc.strokeStyle = col; bc.lineWidth = lw; bc.beginPath();
        for (let x = -20; x <= W + 20; x += 18) { const y = H * 0.16 + Math.sin(x * 0.009 + t * 0.35 + off) * amp + Math.sin(x * 0.021 - t * 0.2) * 10; x < 0 ? bc.moveTo(x, y) : bc.lineTo(x, y); }
        bc.stroke();
      }
      bc.restore();
    }
    // raios de sol (desafio)
    if (name === "desafio") {
      bc.save(); bc.translate(W / 2, -H * 0.05); bc.rotate(t * 0.05); bc.fillStyle = P.rays;
      for (let i = 0; i < 14; i++) { bc.rotate(Math.PI * 2 / 14); bc.beginPath(); bc.moveTo(0, 0); bc.lineTo(-H * 0.07, H * 1.3); bc.lineTo(H * 0.07, H * 1.3); bc.closePath(); bc.fill(); }
      bc.restore();
    }
    // estrelas piscando (vulcão)
    if (stars.length) {
      bc.fillStyle = "#ffffff";
      for (const s of stars) { bc.globalAlpha = 0.25 + 0.5 * (0.5 + 0.5 * Math.sin(t * 2 + s.ph)); bc.beginPath(); bc.arc(s.x, s.y, s.r, 0, Math.PI * 2); bc.fill(); }
      bc.globalAlpha = 1;
    }
    // partículas
    bc.save();
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (fx === "neve") {
        p.y += p.vy * k; p.x += Math.sin(t * 1.2 + p.ph) * 12 * k;
        if (p.y > H + 5) parts[i] = newPart(false);
        bc.globalAlpha = 0.85; bc.fillStyle = P.fx; bc.beginPath(); bc.arc(p.x, p.y, p.r, 0, Math.PI * 2); bc.fill();
        if (!dark) { bc.strokeStyle = "rgba(90,140,190,.35)"; bc.lineWidth = 0.7; bc.stroke(); }
      } else if (fx === "brasas") {
        p.y += p.vy * k; p.x += Math.sin(t * 2 + p.ph) * 16 * k;
        const a = Math.max(0, Math.min(1, (p.y / H) / p.life));
        if (p.y < H * (1 - p.life) || p.y < -5) parts[i] = newPart(false);
        bc.globalAlpha = a; bc.fillStyle = P.fx; bc.shadowColor = P.fx; bc.shadowBlur = 8;
        bc.beginPath(); bc.arc(p.x, p.y, p.r, 0, Math.PI * 2); bc.fill();
      } else if (fx === "brilho") {
        const a = Math.max(0, Math.sin(t * p.sp + p.ph));
        bc.globalAlpha = a * 0.9; bc.fillStyle = P.fx;
        const r = p.r * (0.6 + a * 0.4);
        bc.beginPath(); bc.moveTo(p.x, p.y - r); bc.lineTo(p.x + r * 0.25, p.y - r * 0.25); bc.lineTo(p.x + r, p.y); bc.lineTo(p.x + r * 0.25, p.y + r * 0.25);
        bc.lineTo(p.x, p.y + r); bc.lineTo(p.x - r * 0.25, p.y + r * 0.25); bc.lineTo(p.x - r, p.y); bc.lineTo(p.x - r * 0.25, p.y - r * 0.25); bc.closePath(); bc.fill();
        if (a < 0.02 && Math.random() < 0.02) { p.x = Math.random() * W; p.y = Math.random() * H; }
      } else {
        // pólen / vaga-lumes / poeira
        p.x += (p.vx + Math.sin(t + p.ph) * 6) * k; p.y += (p.vy + Math.cos(t * 0.8 + p.ph) * 5) * k;
        if (p.x > W + 5) p.x = -5; if (p.y < -5) p.y = H + 5;
        const glow = dark && name === "colmeia";
        bc.globalAlpha = glow ? 0.35 + 0.55 * (0.5 + 0.5 * Math.sin(t * 2.5 + p.ph)) : (name === "oficina" ? 0.45 : 0.75);
        bc.fillStyle = P.fx;
        if (glow) { bc.shadowColor = P.fx; bc.shadowBlur = 10; }
        bc.beginPath(); bc.arc(p.x, p.y, p.r, 0, Math.PI * 2); bc.fill();
        bc.shadowBlur = 0;
      }
    }
    bc.restore();
  }

  // ---------- arte dos cartões do mapa (SVG) ----------
  function gearPath(cx, cy, r, teeth) {
    const ri = r * 0.8, th = Math.PI * 2 / teeth; let d = "";
    for (let i = 0; i < teeth; i++) {
      const a = i * th;
      for (const [aa, rr] of [[a - th * 0.28, ri], [a - th * 0.16, r], [a + th * 0.16, r], [a + th * 0.28, ri]])
        d += (d ? "L" : "M") + (cx + Math.cos(aa) * rr).toFixed(1) + " " + (cy + Math.sin(aa) * rr).toFixed(1);
    }
    return d + "Z M" + (cx + r * 0.32).toFixed(1) + " " + cy + " a" + (r * 0.32).toFixed(1) + " " + (r * 0.32).toFixed(1) + " 0 1 0 0.1 0Z";
  }
  function art(n) {
    const p = palette(n), id = "g-" + n;
    const sky = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.sky1}"/><stop offset="1" stop-color="${p.sky2}"/></linearGradient></defs><rect width="400" height="70" fill="url(#${id})"/>`;
    let body = "";
    if (n === "colmeia") {
      body = `<circle cx="340" cy="18" r="11" fill="${p.sun}" opacity=".85"/>
        <path d="M0 52 Q60 30 130 46 T260 42 T400 40 V70 H0Z" fill="${p.far}"/>
        <path d="M0 62 Q90 46 190 58 T400 54 V70 H0Z" fill="${p.near}"/>
        <g fill="#ffd23f"><circle cx="70" cy="58" r="2.2"/><circle cx="150" cy="61" r="2"/><circle cx="300" cy="60" r="2.2"/></g>
        <g transform="translate(220 22)"><ellipse rx="7" ry="5" fill="#ffd23f"/><path d="M-2 -5 v10 M2 -5 v10" stroke="#3a2a10" stroke-width="1.6"/><ellipse cx="-1" cy="-6" rx="4" ry="2.6" fill="#fff" opacity=".8"/></g>`;
    } else if (n === "geleira") {
      body = `<path d="M0 60 L50 28 L95 50 L150 18 L210 52 L270 24 L330 48 L400 26 V70 H0Z" fill="${p.far}"/>
        <path d="M150 18 L139 26 L162 26Z M270 24 L259 32 L282 31Z M50 28 L42 33 L58 33Z" fill="${p.cap}"/>
        <path d="M0 70 L70 46 L140 62 L230 40 L320 60 L400 48 V70Z" fill="${p.near}"/>
        <g fill="#fff" opacity=".9"><circle cx="30" cy="14" r="1.6"/><circle cx="120" cy="10" r="1.3"/><circle cx="200" cy="16" r="1.8"/><circle cx="360" cy="12" r="1.4"/><circle cx="300" cy="8" r="1.2"/></g>`;
    } else if (n === "oficina") {
      body = `<path d="${gearPath(60, 40, 34, 12)}" fill="${p.gear.replace(/[\d.]+\)$/, ".35)")}" fill-rule="evenodd"/>
        <path d="${gearPath(112, 22, 20, 9)}" fill="${p.gear.replace(/[\d.]+\)$/, ".28)")}" fill-rule="evenodd"/>
        <path d="${gearPath(350, 52, 40, 14)}" fill="${p.gear.replace(/[\d.]+\)$/, ".3)")}" fill-rule="evenodd"/>
        <rect x="0" y="60" width="400" height="10" fill="${p.cellEdge}" opacity=".55"/>`;
    } else if (n === "vulcao") {
      body = `<radialGradient id="${id}-gl" cx=".5" cy=".55" r=".45"><stop offset="0" stop-color="#ff8a3d" stop-opacity=".7"/><stop offset="1" stop-color="#ff8a3d" stop-opacity="0"/></radialGradient>
        <rect width="400" height="70" fill="url(#${id}-gl)"/>
        <g fill="#fff"><circle cx="40" cy="12" r="1.2"/><circle cx="90" cy="22" r="1"/><circle cx="300" cy="10" r="1.3"/><circle cx="360" cy="24" r="1"/><circle cx="250" cy="18" r=".9"/></g>
        <path d="M120 70 L188 30 L196 33 L204 33 L212 30 L280 70Z" fill="${p.near}"/>
        <g fill="#ffb066"><circle cx="196" cy="24" r="1.8"/><circle cx="205" cy="16" r="1.4"/><circle cx="200" cy="8" r="1.1"/></g>`;
    }
    return `<svg viewBox="0 0 400 70" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${sky}${body}</svg>`;
  }

  // ---------- aplicar ----------
  function set(n) {
    name = T[n] ? n : "colmeia"; P = palette();
    const gs = document.getElementById("gameScreen");
    gs.style.setProperty("--fg", P.fg); gs.style.setProperty("--muted", P.muted);
    gs.style.setProperty("--panel", P.panel); gs.style.setProperty("--cell-edge", P.panelEdge);
    gs.style.color = P.fg;
    const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.content = P.sky1;
    resize();
  }
  function clear() {
    const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.content = "#2fb344";
  }
  return { set, clear, resize, frame, drawCell, drawWall, art, palette, get name() { return name; } };
})();
