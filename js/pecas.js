// HEXABOARD — estilos de peça (desbloqueados na Coleção).
// O estilo muda só o "material": a cor (= direção) e a seta continuam iguais em todos.
// O corpo de cada peça é desenhado uma vez e guardado; a cada quadro só a seta é desenhada por cima.
const Pecas = (() => {
  const SKINS = [
    { id: "classico", name: "Clássico", price: 0, desc: "O visual de sempre." },
    { id: "gema", name: "Gemas", price: 150, desc: "Pedras lapidadas com brilho." },
    { id: "doce", name: "Balas", price: 200, desc: "Brilhantes como bala de goma." },
    { id: "origami", name: "Origami", price: 250, desc: "Papel colorido dobrado ao meio." },
    { id: "pixel", name: "Pixel", price: 350, desc: "Direto de um videogame antigo." },
    { id: "neon", name: "Neon", price: 500, desc: "Contornos que brilham no escuro." },
  ];
  const GREY = { color: "#aab3c1", dark: "#7a8394" };
  let skin = "classico";
  const cache = new Map();

  // ---------- cores ----------
  function rgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function mix(a, b, t) {
    const A = rgb(a), B = rgb(b);
    return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
  }
  const light = (c, t) => mix(c, "#ffffff", t), dark = (c, t) => mix(c, "#000000", t);

  // ---------- formas ----------
  const V = (s, i) => [s * Math.cos(Math.PI / 3 * i), s * Math.sin(Math.PI / 3 * i)];
  function hex(c, x, y, s) {
    c.beginPath();
    for (let i = 0; i < 6; i++) { const [vx, vy] = V(s, i); i ? c.lineTo(x + vx, y + vy) : c.moveTo(x + vx, y + vy); }
    c.closePath();
  }
  function inHex(x, y, s) { const ax = Math.abs(x), ay = Math.abs(y); return ay <= s * 0.866 && 1.732 * ax + ay <= 1.732 * s; }

  // Corpo da peça centrado em (0,0)
  function body(c, sk, D, p, size) {
    const s = size * 0.94, depth = size * 0.16, grey = p.d < 0;
    if (sk === "gema") {
      hex(c, 0, depth, s); c.fillStyle = D.dark; c.fill();
      hex(c, 0, 0, s); c.fillStyle = D.color; c.fill();
      const ri = s * 0.52;
      for (let i = 0; i < 6; i++) {
        const [ax, ay] = V(s, i), [bx, by] = V(s, i + 1), [cx, cy] = V(ri, i + 1), [dx, dy] = V(ri, i);
        c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.lineTo(cx, cy); c.lineTo(dx, dy); c.closePath();
        c.fillStyle = [light(D.color, 0.28), light(D.color, 0.12), dark(D.color, 0.06), dark(D.color, 0.16), dark(D.color, 0.06), light(D.color, 0.18)][i];
        c.fill();
      }
      hex(c, 0, 0, ri); c.fillStyle = light(D.color, 0.3); c.fill();
      hex(c, 0, 0, s); c.strokeStyle = dark(D.color, 0.25); c.lineWidth = Math.max(1, s * 0.04); c.stroke();
      // brilho
      c.fillStyle = "rgba(255,255,255,.9)"; const bx = -s * 0.42, by = -s * 0.5, r = s * 0.16;
      c.beginPath(); c.moveTo(bx, by - r); c.lineTo(bx + r * 0.25, by - r * 0.25); c.lineTo(bx + r, by); c.lineTo(bx + r * 0.25, by + r * 0.25);
      c.lineTo(bx, by + r); c.lineTo(bx - r * 0.25, by + r * 0.25); c.lineTo(bx - r, by); c.lineTo(bx - r * 0.25, by - r * 0.25); c.closePath(); c.fill();
    } else if (sk === "doce") {
      c.lineJoin = "round";
      hex(c, 0, depth, s * 0.86); c.fillStyle = D.dark; c.strokeStyle = D.dark; c.lineWidth = s * 0.2; c.fill(); c.stroke();
      hex(c, 0, 0, s * 0.86); c.fillStyle = D.color; c.strokeStyle = D.color; c.fill(); c.stroke();
      c.fillStyle = "rgba(255,255,255,.42)"; c.beginPath(); c.ellipse(-s * 0.08, -s * 0.42, s * 0.6, s * 0.24, -0.12, 0, Math.PI * 2); c.fill();
      c.fillStyle = "rgba(255,255,255,.85)"; c.beginPath(); c.arc(s * 0.42, -s * 0.38, s * 0.08, 0, Math.PI * 2); c.fill();
    } else if (sk === "origami") {
      hex(c, s * 0.07, s * 0.12, s); c.fillStyle = "rgba(0,0,0,.2)"; c.fill();
      hex(c, 0, 0, s); c.fillStyle = light(D.color, 0.12); c.fill();
      // metade de baixo mais escura: papel dobrado
      c.beginPath(); const [ax, ay] = V(s, 0), [bx, by] = V(s, 3);
      c.moveTo(ax, ay); for (let i = 1; i <= 2; i++) { const [x, y] = V(s, i); c.lineTo(x, y); } c.lineTo(bx, by); c.closePath();
      c.fillStyle = dark(D.color, 0.14); c.fill();
      c.strokeStyle = dark(D.color, 0.35); c.lineWidth = Math.max(1, s * 0.035);
      c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke();
      hex(c, 0, 0, s); c.stroke();
    } else if (sk === "pixel") {
      const n = 10, g = (2 * s) / n;
      const px = (oy, col, top) => {
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
          const x = -s + g * (i + 0.5), y = -s + g * (j + 0.5);
          if (!inHex(x, y, s * 0.98)) continue;
          let f = col;
          if (top) { if (!inHex(x, y - g, s * 0.98)) f = light(col, 0.35); else if (!inHex(x + g, y + g, s * 0.98)) f = dark(col, 0.15); }
          c.fillStyle = f; c.fillRect(Math.floor(-s + g * i), Math.floor(-s + g * j + oy), Math.ceil(g), Math.ceil(g));
        }
      };
      px(depth, D.dark, false); px(0, D.color, true);
    } else if (sk === "neon") {
      hex(c, 0, 0, s * 0.9); c.fillStyle = "#11141d"; c.fill();
      c.save(); c.shadowColor = D.color; c.shadowBlur = s * 0.55;
      c.strokeStyle = D.color; c.lineWidth = s * 0.11; c.stroke(); c.stroke(); c.restore();
      hex(c, 0, 0, s * 0.9); c.strokeStyle = light(D.color, 0.55); c.lineWidth = s * 0.035; c.stroke();
    } else {
      hex(c, 0, depth, s); c.fillStyle = D.dark; c.fill();
      hex(c, 0, 0, s); c.fillStyle = D.color; c.fill();
      hex(c, 0, -s * 0.08, s * 0.82); c.fillStyle = "rgba(255,255,255,.12)"; c.fill();
    }
    const ink = sk === "neon" ? D.color : "rgba(255,255,255,.95)";
    if (grey) {
      c.save(); c.strokeStyle = ink; c.lineWidth = Math.max(1.5, size * 0.08); c.setLineDash([size * 0.12, size * 0.1]);
      c.beginPath(); c.arc(0, 0, s * 0.36, 0, Math.PI * 2); c.stroke(); c.restore();
    } else if (p.rot) {
      // anel da peça giratória
      c.save(); c.strokeStyle = ink; c.lineWidth = Math.max(1.5, size * 0.07); c.lineCap = "round";
      const R = s * 0.7;
      c.beginPath(); c.arc(0, 0, R, -Math.PI * 0.35, Math.PI * 1.45); c.stroke();
      const ea = Math.PI * 1.45, ex = R * Math.cos(ea), ey = R * Math.sin(ea), t = s * 0.16;
      c.beginPath(); c.moveTo(ex - t, ey - t * 0.2); c.lineTo(ex + t * 0.2, ey); c.lineTo(ex - t * 0.1, ey + t); c.stroke();
      c.restore();
    }
  }

  function sprite(sk, p, size) {
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const k = `${sk}|${p.d}|${p.rot ? 1 : 0}|${size.toFixed(2)}|${dpr}`;
    let sp = cache.get(k);
    if (sp) return sp;
    const half = Math.ceil(size * 1.35);
    const cv = document.createElement("canvas"); cv.width = cv.height = half * 2 * dpr;
    const c = cv.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, half * dpr, half * dpr);
    body(c, sk, p.d >= 0 ? DIRS[p.d] : GREY, p, size);
    sp = { cv, half }; cache.set(k, sp);
    return sp;
  }

  function arrow(c, sk, x, y, size, ang, D, rot) {
    const s = size * 0.94, L = s * (rot ? 0.34 : 0.42);
    c.save(); c.translate(x, y); c.rotate(ang * Math.PI / 180);
    const path = () => { c.beginPath(); c.moveTo(-L, 0); c.lineTo(L, 0); c.moveTo(L * 0.4, -L * 0.6); c.lineTo(L, 0); c.lineTo(L * 0.4, L * 0.6); };
    c.lineCap = "round"; c.lineJoin = "round";
    if (sk === "neon") {
      path(); c.strokeStyle = D.color; c.globalAlpha = 0.35; c.lineWidth = size * 0.26; c.stroke();
      c.globalAlpha = 1; c.lineWidth = size * 0.11; c.stroke();
      c.strokeStyle = "rgba(255,255,255,.85)"; c.lineWidth = size * 0.04; c.stroke();
    } else if (sk === "pixel") {
      c.lineCap = "butt"; c.lineJoin = "miter"; path(); c.strokeStyle = "#fff"; c.lineWidth = Math.max(2, size * 0.16); c.stroke();
    } else if (sk === "gema") {
      path(); c.strokeStyle = D.dark; c.lineWidth = Math.max(3, size * 0.21); c.stroke();
      c.strokeStyle = "#fff"; c.lineWidth = Math.max(2, size * 0.12); c.stroke();
    } else {
      path(); c.strokeStyle = "#fff"; c.lineWidth = Math.max(2, size * (sk === "origami" ? 0.11 : 0.13)); c.stroke();
    }
    c.restore();
  }

  function draw(c, p, x, y, size, ang, glow, sk = skin) {
    const sp = sprite(sk, p, size);
    if (glow) { c.save(); c.shadowColor = "#fff"; c.shadowBlur = 18; }
    c.drawImage(sp.cv, x - sp.half, y - sp.half, sp.half * 2, sp.half * 2);
    if (glow) c.restore();
    if (p.d >= 0) arrow(c, sk, x, y, size, ang, DIRS[p.d], p.rot);
  }

  return {
    SKINS, draw,
    set(id) { skin = SKINS.some(s => s.id === id) ? id : "classico"; cache.clear(); },
    clear() { cache.clear(); },
    get skin() { return skin; },
  };
})();
