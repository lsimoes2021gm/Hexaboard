// Gera as 40 fases fixas da campanha e grava em js/fases.js.
// Uso: node tools/gerar-fases.js
// Cada fase é escolhida entre várias candidatas pela dificuldade desejada,
// e fica salva (peças + solução), então todo jogador recebe exatamente o mesmo tabuleiro.
const fs = require("fs");
const path = require("path");
const L = require("../js/logica.js");

const lerp = (a, b, t) => a + (b - a) * t;

// Parâmetros por mundo (i = 0..9 dentro do mundo; i = 9 é a fase chefe)
const WORLDS = [
  // 1. Primeiros passos: só setas
  i => ({ cfg: { radius: i < 4 ? 3 : 4, density: i === 9 ? 0.46 : lerp(0.26, 0.42, i / 8), slide: 0, rot: 0, trap: 0 },
          want: { careful: 0, careless: lerp(0.05, 0.4, i / 9) } }),
  // 2. Deslize: armadilhas que só se desfazem deslizando uma peça
  i => ({ cfg: { radius: i < 5 ? 4 : 5, density: i === 9 ? 0.44 : lerp(0.3, 0.42, i / 8), slide: lerp(0.2, 0.4, i / 9), rot: 0, trap: i === 9 ? 0.35 : lerp(0.08, 0.28, i / 8) },
          want: { careful: 0, careless: lerp(0.5, 0.95, i / 9) } }),
  // 3. Engrenagens: peças giratórias
  i => ({ cfg: { radius: i < 5 ? 4 : 5, density: i === 9 ? 0.42 : lerp(0.3, 0.4, i / 8), slide: 0.2, rot: i === 9 ? 0.34 : lerp(0.08, 0.28, i / 8), trap: 0.08 },
          want: { careful: lerp(0.15, 0.6, i / 9), careless: lerp(0.5, 0.85, i / 9) } }),
  // 4. Mestre: tudo junto
  i => ({ cfg: { radius: i < 6 ? 5 : 6, density: i === 9 ? 0.46 : lerp(0.38, 0.44, i / 8), slide: lerp(0.35, 0.5, i / 9), rot: lerp(0.15, 0.3, i / 9), trap: lerp(0.1, 0.2, i / 9) },
          want: { careful: lerp(0.5, 0.9, i / 9), careless: lerp(0.75, 0.95, i / 9) } }),
];

const levels = [];
for (let w = 0; w < 4; w++) {
  for (let i = 0; i < 10; i++) {
    const n = w * 10 + i + 1;
    const { cfg, want } = WORLDS[w](i);
    const t0 = Date.now();
    const g = L.generate(cfg, 1000 + n * 7919, i === 9 ? 24 : 14, want, 30);
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
    levels.push({ n, w: w + 1, r: cfg.radius, par: g.par, p: pieces.map(p => [p.c, p.r, p.d, p.rot ? 1 : 0]), s: g.sol });
    console.log(`fase ${String(n).padStart(2)}  raio ${cfg.radius}  peças ${String(pieces.length).padStart(2)}  meta ${String(g.par).padStart(2)} (+${g.par - pieces.length} deslizes)  ` +
      `atento trava ${g.carefulFail.toFixed(2)}  descuidado trava ${g.carelessFail.toFixed(2)}  ${Date.now() - t0}ms`);
  }
}

const out = "// Gerado por tools/gerar-fases.js — não edite à mão.\n" +
  "// p: [coluna, linha, direção, giratória]  s: ordem de uma solução (ids das peças)\n" +
  "const LEVELS = [\n" + levels.map(l => "  " + JSON.stringify(l)).join(",\n") + "\n];\n" +
  "if (typeof module !== \"undefined\") module.exports = LEVELS;\n";
fs.writeFileSync(path.join(__dirname, "..", "js", "fases.js"), out);
console.log("OK: js/fases.js com " + levels.length + " fases");
