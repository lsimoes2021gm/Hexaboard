// HEXABOARD — efeitos visuais: faíscas, rastro, poeira, respingo, onda de luz,
// tremida do tabuleiro, peças caindo no início da fase, confete e vibração.
const Efeitos = (() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const parts = [];      // partículas desenhadas no tabuleiro
  const rings = [];      // ondas de luz
  let flash = 0, shakeT = 0, shakeAmp = 0;
  const MAX = reduce ? 80 : 320;
  const rnd = (a, b) => a + Math.random() * (b - a);

  function add(p) { if (parts.length < MAX) parts.push(p); }

  // Faíscas da cor da peça
  function burst(x, y, color, n = 14, speed = 1) {
    n = reduce ? Math.ceil(n / 3) : n;
    for (let i = 0; i < n; i++) {
      const a = rnd(0, Math.PI * 2), v = rnd(60, 220) * speed;
      add({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, g: 380, life: rnd(0.35, 0.7), t: 0, r: rnd(1.5, 3.6), color, kind: i % 3 ? "dot" : "spark" });
    }
  }
  // Rastro deixado pela peça voando
  function trail(x, y, color, size) {
    if (reduce) return;
    add({ x: x + rnd(-size * 0.3, size * 0.3), y: y + rnd(-size * 0.3, size * 0.3), vx: 0, vy: 0, g: 0, life: 0.28, t: 0, r: size * rnd(0.12, 0.22), color, kind: "fade" });
  }
  // Poeira quando a peça bate depois de deslizar
  function dust(x, y, size) {
    const n = reduce ? 3 : 9;
    for (let i = 0; i < n; i++) {
      const a = rnd(Math.PI * 0.9, Math.PI * 2.1), v = rnd(20, 70);
      add({ x: x + rnd(-size * 0.4, size * 0.4), y: y + size * 0.4, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.5 - 15, g: -10, life: rnd(0.4, 0.7), t: 0, r: size * rnd(0.12, 0.22), color: "rgba(180,170,155,1)", kind: "puff" });
    }
  }
  // Respingo de tinta ao pintar uma peça sem cor
  function splash(x, y, color, size) {
    const n = reduce ? 5 : 18;
    for (let i = 0; i < n; i++) {
      const a = rnd(0, Math.PI * 2), v = rnd(80, 200);
      add({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 260, life: rnd(0.3, 0.55), t: 0, r: rnd(2, 4.5), color, kind: "dot" });
    }
    ring(x, y, color, size * 1.6);
  }
  // Onda de luz (corrente ×5)
  function ring(x, y, color, max) { if (!reduce) rings.push({ x, y, color, t: 0, max }); }
  function doFlash(v = 0.35) { if (!reduce) flash = Math.max(flash, v); }
  function shake(amp = 6, dur = 0.35) { if (!reduce) { shakeT = dur; shakeAmp = amp; } }

  // ---------- peças caindo no início da fase ----------
  let introStart = 0, introDelay = new Map(), introEnd = 0;
  function intro(pieces, centerOf) {
    introDelay.clear();
    if (reduce || !pieces.length) { introEnd = 0; return; }
    const sorted = pieces.slice().sort((a, b) => centerOf(b).y - centerOf(a).y); // de baixo para cima
    const step = Math.min(22, 700 / sorted.length);
    sorted.forEach((p, i) => introDelay.set(p.id, i * step));
    introStart = performance.now();
    introEnd = introStart + sorted.length * step + 380;
  }
  const introBusy = () => performance.now() < introEnd;
  // deslocamento e transparência de cada peça durante a entrada
  function introFor(id, size) {
    if (!introEnd || performance.now() > introEnd) return null;
    const d = introDelay.get(id); if (d == null) return null;
    const t = Math.min(1, Math.max(0, (performance.now() - introStart - d) / 380));
    if (t <= 0) return { dy: -size * 3, alpha: 0 };
    const s = 1.70158, e = 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); // easeOutBack
    return { dy: -size * 3 * (1 - e), alpha: Math.min(1, t * 2.5) };
  }

  // ---------- desenho (chamado a cada quadro, por cima das peças) ----------
  function preTransform(ctx, dt) {
    if (shakeT > 0) {
      shakeT -= dt / 1000;
      const k = Math.max(0, shakeT) / 0.35;
      ctx.translate(rnd(-1, 1) * shakeAmp * k, rnd(-1, 1) * shakeAmp * k);
    }
  }
  function draw(ctx, dt, w, h) {
    const k = dt / 1000;
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i]; r.t += k / 0.5;
      if (r.t >= 1) { rings.splice(i, 1); continue; }
      ctx.save(); ctx.globalAlpha = (1 - r.t) * 0.8; ctx.strokeStyle = r.color; ctx.lineWidth = 6 * (1 - r.t) + 1;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.max * (0.3 + r.t), 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]; p.t += k;
      if (p.t >= p.life) { parts.splice(i, 1); continue; }
      p.vy += p.g * k; p.x += p.vx * k; p.y += p.vy * k;
      const f = 1 - p.t / p.life;
      ctx.globalAlpha = p.kind === "puff" ? f * 0.45 : p.kind === "fade" ? f * 0.5 : Math.min(1, f * 1.4);
      ctx.fillStyle = p.color;
      if (p.kind === "spark") {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.atan2(p.vy, p.vx));
        ctx.fillRect(-p.r * 2, -p.r * 0.45, p.r * 4, p.r * 0.9); ctx.restore();
      } else {
        const r = p.kind === "puff" ? p.r * (1 + p.t / p.life) : p.kind === "fade" ? p.r * f : p.r;
        ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.3, r), 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    if (flash > 0) {
      ctx.save(); ctx.globalAlpha = flash; ctx.fillStyle = "#fff8d6"; ctx.fillRect(0, 0, w, h); ctx.restore();
      flash = Math.max(0, flash - k * 1.6);
    }
  }
  function clear() { parts.length = 0; rings.length = 0; flash = 0; shakeT = 0; introEnd = 0; }

  // ---------- confete (vitória) ----------
  const cf = document.getElementById("confetti"), cc = cf.getContext("2d");
  let pieces = [], running = false, last = 0;
  function confetti(colors) {
    if (reduce) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1), W = innerWidth, H = innerHeight;
    cf.width = W * dpr; cf.height = H * dpr; cc.setTransform(dpr, 0, 0, dpr, 0, 0);
    cf.hidden = false;
    for (let i = 0; i < 140; i++) {
      const fromLeft = i % 2 === 0;
      pieces.push({
        x: fromLeft ? -10 : W + 10, y: H * rnd(0.55, 0.85),
        vx: (fromLeft ? 1 : -1) * rnd(180, 520), vy: -rnd(420, 900),
        rot: rnd(0, 6), vr: rnd(-12, 12), w: rnd(6, 11), h: rnd(3, 6),
        color: colors[i % colors.length], t: 0, life: rnd(2.2, 3.2), hexa: i % 5 === 0,
      });
    }
    if (!running) { running = true; last = performance.now(); requestAnimationFrame(tick); }
  }
  function tick(now) {
    const k = Math.min(0.05, (now - last) / 1000); last = now;
    const W = innerWidth, H = innerHeight;
    cc.clearRect(0, 0, W, H);
    for (let i = pieces.length - 1; i >= 0; i--) {
      const p = pieces[i]; p.t += k;
      if (p.t > p.life || p.y > H + 40) { pieces.splice(i, 1); continue; }
      p.vy += 900 * k; p.vx *= (1 - 1.2 * k); p.vy *= (1 - 0.6 * k);
      p.x += p.vx * k; p.y += p.vy * k; p.rot += p.vr * k;
      cc.save(); cc.translate(p.x, p.y); cc.rotate(p.rot);
      cc.globalAlpha = Math.min(1, (p.life - p.t) * 2);
      cc.fillStyle = p.color;
      if (p.hexa) {
        cc.beginPath();
        for (let j = 0; j < 6; j++) { const a = Math.PI / 3 * j; j ? cc.lineTo(Math.cos(a) * p.w * 0.6, Math.sin(a) * p.w * 0.6) : cc.moveTo(Math.cos(a) * p.w * 0.6, Math.sin(a) * p.w * 0.6); }
        cc.closePath(); cc.fill();
      } else cc.fillRect(-p.w / 2, -p.h / 2 * Math.abs(Math.cos(p.rot * 1.7)), p.w, p.h * Math.abs(Math.cos(p.rot * 1.7)) + 0.5);
      cc.restore();
    }
    if (pieces.length) requestAnimationFrame(tick);
    else { running = false; cc.clearRect(0, 0, W, H); cf.hidden = true; }
  }

  // ---------- vibração (Android; o iPhone não permite) ----------
  const canVibrate = typeof navigator.vibrate === "function";
  let vibOn = true;
  try { vibOn = localStorage.getItem("hx_vib") !== "0"; } catch (e) {}
  function vibrate(pattern) { if (canVibrate && vibOn) { try { navigator.vibrate(pattern); } catch (e) {} } }

  // ---------- contagem da pontuação no cartão ----------
  function countUp(el, target, delay = 250, dur = 900) {
    if (!el || reduce) return;
    const start = performance.now() + delay;
    el.textContent = fmt(0);
    (function step(now) {
      const t = Math.min(1, Math.max(0, (now - start) / dur));
      el.textContent = fmt(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1 && el.isConnected) requestAnimationFrame(step);
    })(performance.now());
  }

  return {
    burst, trail, dust, splash, ring, flash: doFlash, shake, intro, introFor, introBusy,
    preTransform, draw, clear, confetti, vibrate, countUp,
    canVibrate,
    get vibOn() { return vibOn; },
    toggleVib() { vibOn = !vibOn; try { localStorage.setItem("hx_vib", vibOn ? "1" : "0"); } catch (e) {} if (vibOn) vibrate(20); return vibOn; },
  };
})();
