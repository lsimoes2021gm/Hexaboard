// Gera as 40 fases fixas da campanha e grava em js/fases.js.
// Uso: node tools/gerar-fases.js
// Cada fase é escolhida entre várias candidatas pela dificuldade desejada,
// e fica salva (peças + solução), então todo jogador recebe exatamente o mesmo tabuleiro.
const fs = require("fs");
const path = require("path");
const L = require("../js/logica.js");

const lerp = (a, b, t) => a + (b - a) * t;

// Parâmetros por mundo (i = 0..9 dentro do mundo; i = 9 é a fase chefe)
// Cada chefe estreia uma novidade: paredes no chefe 10, peças sem cor no chefe 20.
const WORLDS = [
  // 1. Primeiros passos: só setas (o chefe estreia as paredes)
  i => i < 9
    ? { cfg: { radius: i < 4 ? 3 : 4, density: lerp(0.26, 0.42, i / 8), slide: 0, rot: 0, trap: 0 },
        want: { careful: 0, careless: lerp(0.05, 0.4, i / 8) } }
    : { cfg: { radius: 4, density: 0.46, slide: 0.1, rot: 0, trap: 0.06, walls: 3 },
        want: { careful: 0, careless: 0.6 } },
  // 2. Deslize: armadilhas e paredes (o chefe estreia as peças sem cor)
  i => i < 9
    ? { cfg: { radius: i < 5 ? 4 : 5, density: lerp(0.3, 0.42, i / 8), slide: lerp(0.2, 0.4, i / 8), rot: 0, trap: lerp(0.08, 0.28, i / 8), walls: i < 5 ? 2 : 3 },
        want: { careful: 0, careless: lerp(0.5, 0.95, i / 8) } }
    : { cfg: { radius: 5, density: 0.44, slide: 0.35, rot: 0, trap: 0.3, walls: 3, grey: 0.1 },
        want: { careful: 0.4, careless: 0.95 } },
  // 3. Engrenagens: giratórias, paredes e peças sem cor
  i => i < 9
    ? { cfg: { radius: i < 5 ? 4 : 5, density: lerp(0.3, 0.4, i / 8), slide: 0.2, rot: lerp(0.08, 0.28, i / 8), trap: 0.08, walls: i < 5 ? 3 : 4, grey: lerp(0.03, 0.06, i / 8) },
        want: { careful: lerp(0.15, 0.6, i / 8), careless: lerp(0.5, 0.85, i / 8) } }
    : { cfg: { radius: 5, density: 0.42, slide: 0.25, rot: 0.34, trap: 0.1, walls: 4, grey: 0.09 },
        want: { careful: 0.8, careless: 0.95 } },
  // 4. Mestre: tudo junto
  i => i < 9
    ? { cfg: { radius: i < 6 ? 5 : 6, density: lerp(0.38, 0.44, i / 8), slide: lerp(0.35, 0.5, i / 8), rot: lerp(0.15, 0.3, i / 8), trap: lerp(0.1, 0.2, i / 8), walls: 4 + Math.floor(i / 4), grey: lerp(0.05, 0.08, i / 8) },
        want: { careful: lerp(0.5, 0.9, i / 8), careless: lerp(0.75, 0.95, i / 8) } }
    : { cfg: { radius: 6, density: 0.46, slide: 0.5, rot: 0.3, trap: 0.2, walls: 6, grey: 0.1 },
        want: { careful: 0.97, careless: 1 } },
];

const levels = [];
for (let w = 0; w < 4; w++) {
  for (let i = 0; i < 10; i++) {
    const n = w * 10 + i + 1;
    const { cfg, want } = WORLDS[w](i);
    const t0 = Date.now();
    const g = L.generate(cfg, 1000 + n * 7919, i === 9 ? 30 : 14, want, 30);
    // confere a solução gravada
    let s = g.list, ok = true;
    for (const id of g.sol) {
      const p = s.find(x => x.id === id);
      const m = L.moveOf(p, L.occOf(s));
      if (m.type === "none") { ok = false; break; }
      s = L.apply(s, p, m);
    }
    if (!ok || s.length) throw new Error("Fase " + n + " sem solução válida");
    const pieces = g.list.slice().sort((a, b) => a.id - b.id);
    pieces.forEach((p, idx) => { if (p.id !== idx) throw new Error("ids fora de ordem"); });
    levels.push({ n, w: w + 1, r: cfg.radius, par: g.par, x: g.walls.map(c => [c.c, c.r]), p: pieces.map(p => [p.c, p.r, p.d, p.rot ? 1 : 0]), s: g.sol });
    console.log(`fase ${String(n).padStart(2)}  raio ${cfg.radius}  peças ${String(pieces.length).padStart(2)}  meta ${String(g.par).padStart(2)} (+${g.par - pieces.length} deslizes)  ` +
      `paredes ${g.walls.length}  cinzas ${pieces.filter(p => p.d === -1).length}  atento trava ${g.carefulFail.toFixed(2)}  descuidado trava ${g.carelessFail.toFixed(2)}  ${Date.now() - t0}ms`);
  }
}

const out = "// Gerado por tools/gerar-fases.js — não edite à mão.\n" +
  "// x: paredes [coluna, linha]  p: [coluna, linha, direção (-1 = sem cor), giratória]  s: uma solução (ids das peças)\n" +
  "const LEVELS = [\n" + levels.map(l => "  " + JSON.stringify(l)).join(",\n") + "\n];\n" +
  "if (typeof module !== \"undefined\") module.exports = LEVELS;\n";
fs.writeFileSync(path.join(__dirname, "..", "js", "fases.js"), out);
console.log("OK: js/fases.js com " + levels.length + " fases");
