// HEXABOARD — regras, solver e gerador de fases.
// Usado pelo jogo (index.html) e pelo script tools/gerar-fases.js (Node).

// Hexágonos "flat-top", colunas ímpares deslocadas para baixo.
const DIRS = [
  { dq: 0,  dr: -1, angle: -90,  color: "#f5c518", dark: "#c99a00" }, // cima
  { dq: 1,  dr: -1, angle: -30,  color: "#2fb344", dark: "#1f8a31" }, // cima-direita
  { dq: 1,  dr: 0,  angle: 30,   color: "#f59e0b", dark: "#c27400" }, // baixo-direita
  { dq: 0,  dr: 1,  angle: 90,   color: "#e5484d", dark: "#b22a2f" }, // baixo
  { dq: -1, dr: 1,  angle: 150,  color: "#3b82f6", dark: "#2360c4" }, // baixo-esquerda
  { dq: -1, dr: 0,  angle: -150, color: "#8b3ddb", dark: "#6424a8" }, // cima-esquerda
];
const SOLVER_CAP = 6000; // limite de nós da busca (mantém a interface fluida)

// ================= Tabuleiro hexagonal =================
let RADIUS = 3, CELLS = [];
const key = (c, r) => (c + 32) * 128 + (r + 32);
function buildCells(R) {
  const out = [];
  for (let q = -R; q <= R; q++)
    for (let ar = Math.max(-R, -q - R); ar <= Math.min(R, -q + R); ar++)
      out.push({ c: q, r: ar + (q - (q & 1)) / 2 });
  return out;
}
// Paredes: casas fixas que bloqueiam o caminho e nunca saem.
let WALLS = new Set(), WALL_LIST = [];
const WALL = { wall: true };
function setWalls(list) { WALL_LIST = (list || []).map(w => ({ c: w.c, r: w.r })); WALLS = new Set(WALL_LIST.map(w => key(w.c, w.r))); }
function getWalls() { return WALL_LIST; }
function isWall(c, r) { return WALLS.has(key(c, r)); }
function setBoard(R, walls) { RADIUS = R; CELLS = buildCells(R); setWalls(walls); return CELLS; }
function getCells() { return CELLS; }
function hexDist(c, r) { const ar = r - (c - (c & 1)) / 2; return (Math.abs(c) + Math.abs(ar) + Math.abs(c + ar)) / 2; }
function inBoard(c, r) {
  const ar = r - (c - (c & 1)) / 2;
  return (Math.abs(c) + Math.abs(ar) + Math.abs(c + ar)) / 2 <= RADIUS;
}
function step(c, r, d) {
  const ar = r - (c - (c & 1)) / 2;
  const q = c + DIRS[d].dq, rr = ar + DIRS[d].dr;
  return { c: q, r: rr + (q - (q & 1)) / 2 };
}
function stepBack(c, r, d) {
  const ar = r - (c - (c & 1)) / 2;
  const q = c - DIRS[d].dq, rr = ar - DIRS[d].dr;
  return { c: q, r: rr + (q - (q & 1)) / 2 };
}
function neighborKeys(c, r) {
  const out = new Set();
  for (let d = 0; d < 6; d++) { const n = step(c, r, d); out.add(key(n.c, n.r)); }
  return out;
}

// ================= Regras =================
// Peça sem cor: d = -1. Não anda sozinha; quando outra peça bate nela, ganha a direção de quem bateu.
// Resultado de tocar numa peça:
//   exit  = sai do tabuleiro
//   slide = desliza até encostar (paint = id da peça sem cor que ela pintou, se bateu numa)
//   paint = já estava encostada numa peça sem cor: pinta sem se mover
//   none  = não acontece nada
function moveOf(p, occ) {
  if (p.d < 0) return { type: "none", blocker: null };
  let cur = { c: p.c, r: p.r }, n = step(p.c, p.r, p.d), steps = 0;
  while (inBoard(n.c, n.r)) {
    const hit = occ.get(key(n.c, n.r));
    if (hit) {
      const paint = hit.d === -1 ? hit.id : null;
      if (steps === 0) return paint !== null ? { type: "paint", blocker: n, paint } : { type: "none", blocker: n };
      return { type: "slide", to: cur, blocker: n, paint };
    }
    cur = n; n = step(n.c, n.r, p.d); steps++;
  }
  return { type: "exit" };
}
function occOf(list) { const m = new Map(); for (const k of WALLS) m.set(k, WALL); for (const p of list) m.set(key(p.c, p.r), p); return m; }
function stateKey(list) { return list.map(p => p.id + ":" + p.c + "," + p.r + "," + p.d).sort().join("|"); }
function legalMoves(list) {
  const occ = occOf(list), out = [];
  for (const p of list) { const m = moveOf(p, occ); if (m.type !== "none") out.push({ p, m }); }
  out.sort((a, b) => (a.m.type === "exit" ? 0 : 1) - (b.m.type === "exit" ? 0 : 1));
  return out;
}
// Aplica a jogada. Quando a peça sai do lugar, as giratórias vizinhas da casa de ORIGEM giram 60° (horário).
// Se ela bateu numa peça sem cor, essa peça ganha a direção dela.
function apply(list, p, m) {
  const leaves = m.type === "exit" || m.type === "slide";
  const nb = leaves ? neighborKeys(p.c, p.r) : null;
  const out = [];
  for (const x of list) {
    if (x.id === p.id) {
      if (m.type === "exit") continue;
      out.push(m.type === "slide" ? { ...x, c: m.to.c, r: m.to.r } : x);
      continue;
    }
    if (m.paint != null && x.id === m.paint) { out.push({ ...x, d: p.d }); continue; }
    if (nb && x.rot && nb.has(key(x.c, x.r))) out.push({ ...x, d: (x.d + 1) % 6 });
    else out.push(x);
  }
  return out;
}

// ================= Solver (busca em profundidade com memória) =================
// ok: true = tem solução, false = sem saída, null = não decidiu dentro do limite.
function solve(list, cap = SOLVER_CAP) {
  const dead = new Set(); let nodes = 0;
  function dfs(s) {
    if (s.length === 0) return [];
    const k = stateKey(s);
    if (dead.has(k)) return null;
    if (++nodes > cap) throw "cap";
    for (const { p, m } of legalMoves(s)) {
      const r = dfs(apply(s, p, m));
      if (r) return [{ id: p.id }, ...r];
    }
    dead.add(k); return null;
  }
  try { const path = dfs(list); return { ok: !!path, path }; }
  catch (e) { return { ok: null }; }
}

// ================= Gerador (jogo reverso) =================
// Começa vazio e desfaz jogadas: "des-sair" (peça entra por um caminho livre)
// ou "des-deslizar" (peça recua ao longo da seta). Toda fase gerada tem solução.
let seed = 1;
function setSeed(n) { seed = (n >>> 0) || 1; }
function rand() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
function pick(a) { return a[Math.floor(rand() * a.length)]; }
function hashStr(s) { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

// cfg: { radius, density, slide, rot }
function generateOnce(cfg) {
  const walls = [];
  for (let wt = 0; walls.length < (cfg.walls || 0) && wt < 300; wt++) {
    const c = pick(CELLS);
    if (hexDist(c.c, c.r) >= RADIUS || walls.some(w => w.c === c.c && w.r === c.r)) continue;
    walls.push({ c: c.c, r: c.r });
  }
  setWalls(walls);
  const target = Math.floor((CELLS.length - walls.length) * cfg.density);
  let list = [], rev = [], id = 0, tries = 0;
  const unrotate = (l, c, r, moverId) => {
    const nb = neighborKeys(c, r);
    return l.map(x => x.id !== moverId && x.rot && nb.has(key(x.c, x.r)) ? { ...x, d: (x.d + 5) % 6 } : x);
  };
  const shuffled = a => a.map(x => [rand(), x]).sort((u, v) => u[0] - v[0]).map(x => x[1]);
  // Armadilha (deslize obrigatório), montada com 3 peças novas:
  // P está bloqueada por B, B por Q e Q por P. O ciclo só se desfaz deslizando uma delas.
  // Ordem reversa: P sai, B sai, Q sai e P "des-desliza" para trás.
  const tryTrap = () => {
    for (let attempt = 0; attempt < 40; attempt++) {
      const occ = occOf(list);
      const f = pick(CELLS);
      if (occ.has(key(f.c, f.r))) continue;
      const dP = Math.floor(rand() * 6);
      const b = step(f.c, f.r, dP);
      if (!inBoard(b.c, b.r) || occ.has(key(b.c, b.r))) continue;
      if (moveOf({ c: f.c, r: f.r, d: dP }, occ).type !== "exit") continue;
      const backs = [];
      let k = stepBack(f.c, f.r, dP);
      while (inBoard(k.c, k.r) && !occ.has(key(k.c, k.r))) { backs.push(k); k = stepBack(k.c, k.r, dP); }
      if (!backs.length) continue;
      const occ2 = new Map(occ); occ2.set(key(f.c, f.r), 1);
      const dB = Math.floor(rand() * 6);
      if (moveOf({ c: b.c, r: b.r, d: dB }, occ2).type !== "exit") continue;
      occ2.set(key(b.c, b.r), 1);
      const backKeys = new Set(backs.map(x => key(x.c, x.r)));
      const rayB = [];
      let n = step(b.c, b.r, dB);
      while (inBoard(n.c, n.r)) { rayB.push(n); n = step(n.c, n.r, dB); }
      for (const to of shuffled(backs)) {
        for (const q of shuffled(rayB)) {
          if (backKeys.has(key(q.c, q.r))) continue;
          for (const dQ of shuffled([0, 1, 2, 3, 4, 5])) {
            let m = step(q.c, q.r, dQ), hits = false;
            while (inBoard(m.c, m.r)) { if (m.c === to.c && m.r === to.r) hits = true; m = step(m.c, m.r, dQ); }
            if (hits && moveOf({ c: q.c, r: q.r, d: dQ }, occ2).type === "exit") return { f, dP, b, dB, q, dQ, to };
          }
        }
      }
    }
    return null;
  };
  // Peças da armadilha não giram (o giro mudaria a direção do deslize obrigatório)
  const addPiece = (c, r, d) => {
    const np = { id: id++, c, r, d, rot: false };
    list = unrotate(list, c, r, np.id);
    list.push(np); rev.push(np.id);
    return np;
  };
  // Peça sem cor: X está logo atrás de G, apontando para ela. No jogo, X bate em G
  // (pintando G com a direção de X) e então G sai. Ordem reversa: G sai, G perde a cor, X recua.
  const tryGrey = () => {
    const occ = occOf(list);
    for (const X of shuffled(list.filter(x => x.d >= 0 && !x.rot))) {
      const f = step(X.c, X.r, X.d);
      if (!inBoard(f.c, f.r) || occ.has(key(f.c, f.r))) continue;
      if (moveOf({ c: f.c, r: f.r, d: X.d }, occ).type !== "exit") continue;
      const backs = [];
      let b = stepBack(X.c, X.r, X.d);
      while (inBoard(b.c, b.r) && !occ.has(key(b.c, b.r))) { backs.push(b); b = stepBack(b.c, b.r, X.d); }
      return { X, f, backs };
    }
    return null;
  };
  while (list.length < target && tries++ < target * 120) {
    const occ = occOf(list);
    if (cfg.grey && rand() < cfg.grey) {
      if (list.length + 1 > target) continue;
      const t = tryGrey();
      if (!t) continue;
      const G = addPiece(t.f.c, t.f.r, t.X.d);
      list = list.map(x => x.id === G.id ? { ...x, d: -1 } : x);
      if (t.backs.length && rand() < 0.7) {
        const to = pick(t.backs);
        list = list.map(x => x.id === t.X.id ? { ...x, c: to.c, r: to.r } : x);
        list = unrotate(list, to.c, to.r, t.X.id);
      }
      rev.push(t.X.id);
    } else if (cfg.trap && rand() < cfg.trap) {
      if (list.length + 3 > target) continue;
      const t = tryTrap();
      if (!t) continue;
      const P = addPiece(t.f.c, t.f.r, t.dP);
      addPiece(t.b.c, t.b.r, t.dB);
      addPiece(t.q.c, t.q.r, t.dQ);
      list = list.map(x => x.id === P.id ? { ...x, c: t.to.c, r: t.to.r } : x);
      list = unrotate(list, t.to.c, t.to.r, P.id);
      rev.push(P.id);
    } else if (list.length > 2 && rand() < cfg.slide) {
      const cands = list.filter(p => {
        if (p.d < 0) return false;
        const f = step(p.c, p.r, p.d);
        const front = inBoard(f.c, f.r) ? occ.get(key(f.c, f.r)) : null;
        if (!front || front.d === -1) return false; // bater numa peça sem cor pintaria a peça
        const b = stepBack(p.c, p.r, p.d);
        return inBoard(b.c, b.r) && !occ.has(key(b.c, b.r));
      });
      if (!cands.length) continue;
      const p = pick(cands), back = [];
      let b = stepBack(p.c, p.r, p.d);
      while (inBoard(b.c, b.r) && !occ.has(key(b.c, b.r))) { back.push(b); b = stepBack(b.c, b.r, p.d); }
      const to = pick(back);
      list = list.map(x => x.id === p.id ? { ...x, c: to.c, r: to.r } : x);
      list = unrotate(list, to.c, to.r, p.id);
      rev.push(p.id);
    } else {
      const { c, r } = pick(CELLS);
      if (occ.has(key(c, r))) continue;
      const dirs = [0, 1, 2, 3, 4, 5].sort(() => rand() - 0.5);
      for (const d of dirs) {
        if (moveOf({ c, r, d }, occ).type === "exit") {
          const np = { id: id++, c, r, d, rot: rand() < cfg.rot };
          list = unrotate(list, c, r, np.id);
          list.push(np); rev.push(np.id); break;
        }
      }
    }
  }
  return { list, sol: rev.slice().reverse(), walls };
}

// Partidas simuladas. careful=true: prefere peça livre (jogador atento).
function playouts(list, runs, careful) {
  let fails = 0, best = Infinity;
  for (let i = 0; i < runs; i++) {
    let s = list, n = 0;
    while (s.length) {
      const lm = legalMoves(s);
      if (!lm.length) { fails++; n = Infinity; break; }
      const exits = careful ? lm.filter(x => x.m.type === "exit") : [];
      const { p, m } = pick(exits.length ? exits : lm);
      s = apply(s, p, m); n++;
    }
    best = Math.min(best, n);
  }
  return { fail: fails / runs, best };
}

// Gera várias candidatas e fica com a mais próxima da dificuldade desejada.
// want: { careful, careless } = taxa de travamento desejada para cada tipo de jogador.
function generate(cfg, seedValue, candidates, want, runs = 20) {
  setBoard(cfg.radius, []); setSeed(seedValue);
  let best = null, bestScore = -Infinity;
  for (let i = 0; i < candidates; i++) {
    const g = generateOnce(cfg);
    const careless = playouts(g.list, runs, false);
    const careful = playouts(g.list, runs, true);
    const score = -Math.abs(careful.fail - want.careful) - 0.5 * Math.abs(careless.fail - want.careless);
    if (score > bestScore) {
      bestScore = score;
      best = { ...g, par: Math.min(g.sol.length, careful.best), carefulFail: careful.fail, carelessFail: careless.fail };
    }
  }
  setWalls(best.walls);
  return best;
}

// Estrelas: 3 na meta, 2 até uma pequena folga, 1 acima disso.
function starsFor(moves, par) {
  if (moves <= par) return 3;
  if (moves <= par + Math.max(3, Math.round(par * 0.1))) return 2;
  return 1;
}

if (typeof module !== "undefined") {
  module.exports = { DIRS, setBoard, setWalls, getWalls, getCells, inBoard, moveOf, occOf, legalMoves, apply, solve, generate, starsFor, hashStr };
}
