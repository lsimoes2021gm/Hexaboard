// HEXABOARD — recompensas: moedas, conquistas, estilos de peça e perfil.
// Usa funções do jogo (prog, totalStars, worldStars, playerName...) no momento da chamada.
const Colecao = (() => {
  const S = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const COIN = '<svg class="coin" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="#f5c518"/><circle cx="10" cy="10" r="6.6" fill="none" stroke="#c99a00" stroke-width="1.5"/><path d="M10 6.3l3.2 1.85v3.7L10 13.7l-3.2-1.85v-3.7z" fill="#c99a00"/></svg>';

  const three = () => Object.values(prog).filter(r => r.stars === 3).length;
  const boss = w => prog[w * 10] ? 1 : 0;
  // val(st) = progresso atual; goal = quanto precisa
  const ACH = [
    { id: "primeira", name: "Primeiro passo", desc: "Vença a fase 1.", coins: 25, goal: 1, val: () => prog[1] ? 1 : 0 },
    { id: "combo5", name: "Corrente ×5", desc: "Tire 5 peças seguidas sem deslizar.", coins: 25, goal: 5, val: s => s.maxCombo },
    { id: "combo15", name: "Corrente longa", desc: "Tire 15 peças seguidas sem deslizar.", coins: 75, goal: 15, val: s => s.maxCombo },
    { id: "combo30", name: "Corrente infinita", desc: "Tire 30 peças seguidas sem deslizar.", coins: 150, goal: 30, val: s => s.maxCombo },
    { id: "perfeito10", name: "Perfeccionista", desc: "Ganhe 3 estrelas em 10 fases.", coins: 50, goal: 10, val: three },
    { id: "estrelas60", name: "Caçador de estrelas", desc: "Junte 60 estrelas.", coins: 100, goal: 60, val: () => totalStars() },
    { id: "estrelas120", name: "Céu completo", desc: "Junte todas as 120 estrelas.", coins: 250, goal: 120, val: () => totalStars() },
    { id: "mundo30", name: "Mundo perfeito", desc: "Ganhe as 30 estrelas de um mundo.", coins: 100, goal: 30, val: () => Math.max(worldStars(1), worldStars(2), worldStars(3), worldStars(4)) },
    { id: "chefe1", name: "Mestre da Colmeia", desc: "Vença o chefe da fase 10.", coins: 50, goal: 1, val: () => boss(1) },
    { id: "chefe2", name: "Mestre da Geleira", desc: "Vença o chefe da fase 20.", coins: 75, goal: 1, val: () => boss(2) },
    { id: "chefe3", name: "Mestre da Oficina", desc: "Vença o chefe da fase 30.", coins: 100, goal: 1, val: () => boss(3) },
    { id: "chefe4", name: "Mestre do Vulcão", desc: "Vença o chefe da fase 40.", coins: 150, goal: 1, val: () => boss(4) },
    { id: "semrede", name: "Sem rede", desc: "Vença uma fase chefe sem desfazer e sem dica.", coins: 100, goal: 1, val: s => s.cleanBoss },
    { id: "persistente", name: "Persistente", desc: "Vença um chefe depois que ele fez o mundo voltar ao início.", coins: 75, goal: 1, val: s => s.comebacks },
    { id: "sozinho", name: "Por conta própria", desc: "Vença 10 fases sem usar dica.", coins: 50, goal: 10, val: s => s.noHintWins },
    { id: "veterano", name: "Veterano", desc: "Vença 50 fases (repetições contam).", coins: 75, goal: 50, val: s => s.wins },
    { id: "recorde", name: "Recordista", desc: "Bata o seu próprio recorde numa fase.", coins: 25, goal: 1, val: s => s.records },
    { id: "pintor", name: "Pintor", desc: "Pinte 25 peças sem cor.", coins: 50, goal: 25, val: s => s.paints },
    { id: "relojoeiro", name: "Relojoeiro", desc: "Ganhe o bônus de giro 20 vezes.", coins: 50, goal: 20, val: s => s.rotBonus },
    { id: "diario1", name: "Desafiante", desc: "Jogue o seu primeiro desafio diário.", coins: 25, goal: 1, val: s => s.dailies },
    { id: "diario3", name: "Desafio perfeito", desc: "Ganhe 3 estrelas num desafio diário.", coins: 75, goal: 1, val: s => s.daily3 },
    { id: "seq3", name: "Três dias seguidos", desc: "Jogue o desafio diário 3 dias seguidos.", coins: 50, goal: 3, val: s => s.bestStreak },
    { id: "seq7", name: "Uma semana inteira", desc: "Jogue o desafio diário 7 dias seguidos.", coins: 150, goal: 7, val: s => s.bestStreak },
  ];
  const DEF = { maxCombo: 0, paints: 0, rotBonus: 0, slides: 0, wins: 0, noHintWins: 0, cleanBoss: 0, records: 0, comebacks: 0, dailies: 0, daily3: 0, bestStreak: 0 };
  let st = { ...DEF }, got = {}, owned = ["classico"], coins = 0, tab = "conquistas";

  // ---------- avisos (toasts) ----------
  const queue = []; let showing = false;
  function toast(title, sub) { queue.push([title, sub]); if (!showing) nextToast(); }
  function nextToast() {
    const el = document.getElementById("toast");
    if (!queue.length) { showing = false; el.hidden = true; return; }
    showing = true;
    const [title, sub] = queue.shift();
    document.getElementById("toastTitle").textContent = title;
    document.getElementById("toastSub").innerHTML = "";
    document.getElementById("toastSub").append(sub);
    el.hidden = false; el.classList.remove("in"); void el.offsetWidth; el.classList.add("in");
    if (typeof Som !== "undefined" && Som.medal) Som.medal();
    setTimeout(nextToast, 2900);
  }

  // ---------- moedas ----------
  function addCoins(n) {
    if (!n) return;
    coins += n; S.set("hx6_coins", coins); refreshCoins();
  }
  function refreshCoins() { document.querySelectorAll("[data-coins]").forEach(e => { e.textContent = fmt(coins); }); }

  // ---------- conquistas ----------
  const progress = a => Math.min(a.goal, a.val(st) || 0);
  function check() {
    const fresh = ACH.filter(a => !got[a.id] && progress(a) >= a.goal);
    if (!fresh.length) return;
    for (const a of fresh) got[a.id] = Date.now();
    S.set("hx6_ach", got);
    const total = fresh.reduce((t, a) => t + a.coins, 0);
    addCoins(total);
    if (fresh.length > 2) toast(`${fresh.length} conquistas desbloqueadas`, `+${total} moedas`);
    else for (const a of fresh) toast(`Conquista: ${a.name}`, `+${a.coins} moedas`);
    if (typeof submitPlayer === "function") submitPlayer();
    if (!document.getElementById("colScreen").hidden) render();
  }
  function stat(k, v = 1, how = "add") {
    if (how === "max") st[k] = Math.max(st[k], v); else st[k] += v;
    S.set("hx6_stats", st);
    check();
  }

  function init() {
    st = { ...DEF, ...S.get("hx6_stats", {}) };
    got = S.get("hx6_ach", {});
    owned = S.get("hx6_owned", ["classico"]);
    const c = S.get("hx6_coins", null);
    if (c === null) {
      // primeira vez: moedas pelas estrelas que o jogador já tem
      coins = totalStars() * 10; S.set("hx6_coins", coins);
      if (coins > 0) toast(`+${fmt(coins)} moedas`, "pelas estrelas que você já tinha");
    } else coins = c;
    const sk = S.get("hx6_skin", "classico");
    Pecas.set(owned.includes(sk) ? sk : "classico");
    refreshCoins();
    check();
  }

  // ---------- tela da coleção ----------
  function open(t) { if (t) tab = t; document.getElementById("colScreen").hidden = false; render(); document.getElementById("btnColClose").focus(); }
  function close() { document.getElementById("colScreen").hidden = true; if (typeof renderMap === "function" && !document.getElementById("mapScreen").hidden) renderMap(); }

  function render() {
    // perfil
    const pf = document.getElementById("colProfile");
    const bosses = [1, 2, 3, 4].reduce((t, w) => t + boss(w), 0);
    const medals = Object.keys(got).length;
    pf.innerHTML = `<div class="pf-top"><div><small>Seu apelido</small><b class="pf-name"></b></div><div class="pf-coins">${COIN}<b data-coins>${fmt(coins)}</b></div></div>
      <dl class="pf-stats">
        <div><dt>Fases vencidas</dt><dd>${fmt(st.wins)}</dd></div>
        <div><dt>Estrelas</dt><dd>${totalStars()}<em>/120</em></dd></div>
        <div><dt>Chefes</dt><dd>${bosses}<em>/4</em></dd></div>
        <div><dt>Maior corrente</dt><dd>×${st.maxCombo}</dd></div>
        <div><dt>Conquistas</dt><dd>${medals}<em>/${ACH.length}</em></dd></div>
        <div><dt>Dias seguidos</dt><dd>${st.bestStreak}</dd></div>
      </dl>`;
    pf.querySelector(".pf-name").textContent = playerName();
    for (const b of document.querySelectorAll("[data-ctab]")) b.setAttribute("aria-selected", String(b.dataset.ctab === tab));
    const body = document.getElementById("colBody"); body.textContent = "";
    if (tab === "conquistas") {
      const ul = document.createElement("ul"); ul.className = "ach-list";
      const sorted = ACH.slice().sort((a, b) => (got[b.id] ? 1 : 0) - (got[a.id] ? 1 : 0) || progress(b) / b.goal - progress(a) / a.goal);
      for (const a of sorted) {
        const li = document.createElement("li"); const ok = !!got[a.id]; li.className = ok ? "got" : "";
        const pr = progress(a);
        li.innerHTML = `<span class="medal" aria-hidden="true"><svg viewBox="-12 -12 24 24"><polygon points="-6,-10.4 6,-10.4 12,0 6,10.4 -6,10.4 -12,0"/>${ok ? '<path d="M-4 0.5l2.8 2.8L4.5 -3.5" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>' : '<rect x="-3.6" y="-1" width="7.2" height="6" rx="1.2" fill="#fff"/><path d="M-2.2 -1v-2a2.2 2.2 0 0 1 4.4 0v2" fill="none" stroke="#fff" stroke-width="1.6"/>'}</svg></span>
          <div class="ach-txt"><b></b><span></span>${!ok && a.goal > 1 ? `<div class="bar"><i style="width:${(pr / a.goal * 100).toFixed(0)}%"></i></div><small>${pr} de ${a.goal}</small>` : ""}</div>
          <span class="reward">+${a.coins}${COIN}</span>`;
        li.querySelector(".ach-txt b").textContent = a.name;
        li.querySelector(".ach-txt span").textContent = a.desc;
        ul.appendChild(li);
      }
      body.appendChild(ul);
    } else {
      const grid = document.createElement("div"); grid.className = "skin-grid";
      for (const sk of Pecas.SKINS) {
        const card = document.createElement("div"); card.className = "skin" + (Pecas.skin === sk.id ? " on" : "");
        const cv = document.createElement("canvas"); cv.className = "skin-prev"; cv.setAttribute("aria-hidden", "true");
        const h = document.createElement("b"); h.textContent = sk.name;
        const d = document.createElement("span"); d.textContent = sk.desc;
        const btn = document.createElement("button");
        const have = owned.includes(sk.id);
        if (Pecas.skin === sk.id) { btn.textContent = "Usando"; btn.disabled = true; }
        else if (have) { btn.textContent = "Usar"; btn.className = "primary"; btn.onclick = () => equip(sk.id); }
        else if (coins >= sk.price) {
          btn.innerHTML = `Comprar · ${sk.price}${COIN}`;
          btn.onclick = () => {
            if (btn.dataset.confirm) { buy(sk); return; }
            btn.dataset.confirm = "1"; btn.className = "primary"; btn.textContent = "Confirmar compra";
            setTimeout(() => { if (btn.isConnected && btn.dataset.confirm) { delete btn.dataset.confirm; btn.className = ""; btn.innerHTML = `Comprar · ${sk.price}${COIN}`; } }, 3000);
          };
        } else { btn.innerHTML = `${sk.price}${COIN}`; btn.disabled = true; btn.title = `Faltam ${sk.price - coins} moedas`; }
        card.append(cv, h, d, btn);
        grid.appendChild(card);
        requestAnimationFrame(() => drawPreview(cv, sk.id));
      }
      body.appendChild(grid);
      const note = document.createElement("p"); note.className = "rank-note";
      note.textContent = "O estilo muda só o visual: a cor de cada peça continua indicando a direção, como sempre. Ganhe moedas com estrelas novas, conquistas e o desafio diário.";
      body.appendChild(note);
    }
    refreshCoins();
  }
  function drawPreview(cv, id) {
    const dpr = Math.min(3, window.devicePixelRatio || 1), w = cv.clientWidth || 140, h = cv.clientHeight || 64;
    cv.width = w * dpr; cv.height = h * dpr;
    const c = cv.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const size = Math.min(h * 0.36, w / 7.5);
    const sample = [{ id: -1, d: 0, rot: false }, { id: -2, d: 1, rot: true }, { id: -3, d: 3, rot: false }, { id: -4, d: -1, rot: false }];
    sample.forEach((p, i) => {
      const x = w / 2 + (i - 1.5) * size * 1.75, y = h / 2 + (i % 2 ? size * 0.25 : -size * 0.25);
      Pecas.draw(c, p, x, y, size, p.d >= 0 ? DIRS[p.d].angle : 0, false, id);
    });
  }
  function buy(sk) {
    if (coins < sk.price || owned.includes(sk.id)) return;
    addCoins(-sk.price);
    owned.push(sk.id); S.set("hx6_owned", owned);
    equip(sk.id);
    toast(`Novo estilo: ${sk.name}`, "Já está nas suas peças");
  }
  function equip(id) {
    Pecas.set(id); S.set("hx6_skin", id);
    render();
  }

  return {
    init, stat, addCoins, check, toast, open, close, render, COIN,
    setTab(t) { tab = t; render(); },
    get medals() { return Object.keys(got).length; },
    get total() { return ACH.length; },
    get coins() { return coins; },
    get stats() { return st; },
  };
})();
