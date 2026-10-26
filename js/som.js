// HEXABOARD — efeitos sonoros sintetizados com Web Audio (nenhum arquivo de áudio).
// O áudio só começa depois do primeiro toque na tela (regra dos navegadores).
const Som = (() => {
  let ac = null, master = null, noiseBuf = null, on = true, primed = false;
  try { on = localStorage.getItem("hx_som") !== "0"; } catch (e) {}
  const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  // iPhone: sem isto, o som fica mudo com a chave lateral no silencioso.
  // iOS 17+: pede a sessão de áudio "playback". Versões antigas: um áudio mudo em loop faz o mesmo papel.
  let silentEl = null;
  function setSession() {
    try { if (navigator.audioSession) navigator.audioSession.type = on ? "playback" : "auto"; } catch (e) {}
  }
  function silentLoop(play) {
    if (!isIOS || navigator.audioSession) return;
    if (play) {
      if (!silentEl) {
        // 0,5 s de silêncio em WAV, gerado aqui mesmo
        const n = 4000, buf = new ArrayBuffer(44 + n), v = new DataView(buf);
        const w = (o, str) => { for (let i = 0; i < str.length; i++) v.setUint8(o + i, str.charCodeAt(i)); };
        w(0, "RIFF"); v.setUint32(4, 36 + n, true); w(8, "WAVE"); w(12, "fmt "); v.setUint32(16, 16, true);
        v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, 8000, true); v.setUint32(28, 8000, true);
        v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, "data"); v.setUint32(40, n, true);
        for (let i = 0; i < n; i++) v.setUint8(44 + i, 128);
        silentEl = document.createElement("audio");
        silentEl.src = URL.createObjectURL(new Blob([buf], { type: "audio/wav" }));
        silentEl.loop = true; silentEl.setAttribute("playsinline", ""); silentEl.preload = "auto";
      }
      const pr = silentEl.play(); if (pr && pr.catch) pr.catch(() => {});
    } else if (silentEl) silentEl.pause();
  }

  function ensure() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ac = new AC();
      master = ac.createGain(); master.gain.value = 0.8;
      const comp = ac.createDynamicsCompressor(); // evita estourar quando vários sons tocam juntos
      master.connect(comp); comp.connect(ac.destination);
    }
    // "suspended" (pausado) ou "interrupted" (iPhone depois de ligação ou de ir para segundo plano)
    if (ac.state !== "running" && ac.state !== "closed") { const r = ac.resume(); if (r && r.catch) r.catch(() => {}); }
    return ac;
  }

  // Um oscilador com envelope curto. f2 = frequência final (glissando); lp = filtro passa-baixa.
  function tone({ f = 440, f2 = 0, type = "sine", t = 0, dur = 0.15, vol = 0.3, attack = 0.005, lp = 0 }) {
    const t0 = ac.currentTime + t;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    let node = o;
    if (lp) { const fl = ac.createBiquadFilter(); fl.type = "lowpass"; fl.frequency.value = lp; o.connect(fl); node = fl; }
    node.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.03);
  }

  // Ruído filtrado (sopros, batidas, "splash").
  function noise({ t = 0, dur = 0.2, vol = 0.2, type = "bandpass", f = 1000, f2 = 0, q = 1 }) {
    if (!noiseBuf) {
      noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const t0 = ac.currentTime + t;
    const src = ac.createBufferSource(); src.buffer = noiseBuf;
    const fl = ac.createBiquadFilter(); fl.type = type; fl.Q.value = q;
    fl.frequency.setValueAtTime(f, t0);
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(fl); fl.connect(g); g.connect(master);
    src.start(t0); src.stop(t0 + dur + 0.03);
  }

  // Sino: fundamental + harmônicos curtos.
  function bell(f, t = 0, vol = 0.2, dur = 0.55) {
    tone({ f, t, dur, vol });
    tone({ f: f * 2, t, dur: dur * 0.45, vol: vol * 0.35 });
    tone({ f: f * 3.01, t, dur: dur * 0.2, vol: vol * 0.15, type: "triangle" });
  }

  const play = fn => { if (!on || !ensure()) return; try { fn(); } catch (e) {} };

  // Pentatônica de Dó: cada peça da corrente sobe uma nota.
  const SCALE = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];

  return {
    _ctx: () => ac, // usado só em testes
    get on() { return on; },
    toggle() {
      on = !on;
      try { localStorage.setItem("hx_som", on ? "1" : "0"); } catch (e) {}
      setSession();
      if (on) { this.unlock(); play(() => bell(880, 0, 0.15, 0.3)); } else silentLoop(false);
      return on;
    },
    // Chamado dentro de um toque/clique: libera o áudio (exigência dos navegadores, principalmente no iPhone)
    unlock() {
      if (!on) return;
      setSession();
      if (!ensure()) return;
      if (!primed || ac.state !== "running") {
        // tocar um som vazio dentro do gesto é o que realmente destrava o áudio no iPhone
        try { const b = ac.createBuffer(1, 1, 22050), src = ac.createBufferSource(); src.buffer = b; src.connect(ac.destination); src.start(0); } catch (e) {}
        primed = true;
      }
      silentLoop(true);
    },
    suspend() { if (ac && ac.state === "running") ac.suspend(); silentLoop(false); },

    // Botões da interface
    click: () => play(() => tone({ f: 1250, f2: 900, dur: 0.05, vol: 0.12, type: "triangle" })),

    // Peça saiu: nota da corrente + sopro. Na corrente ×5, um brilho extra.
    exit: streak => play(() => {
      const i = Math.min(SCALE.length - 1, Math.max(0, streak - 1));
      bell(SCALE[i], 0, 0.42);
      noise({ dur: 0.2, vol: 0.09, type: "highpass", f: 2500, f2: 7000 });
      if (streak >= 5) { bell(SCALE[i] * 1.5, 0.07, 0.22, 0.4); bell(SCALE[i] * 2, 0.14, 0.16, 0.35); }
    }),
    // Bônus de giro (+15)
    bonus: () => play(() => { bell(1318.5, 0.09, 0.2, 0.3); bell(1568, 0.17, 0.18, 0.3); }),

    // Deslize: arrasto e batida quando encosta. Se pintou uma peça sem cor, "splash" na chegada.
    slide: (painted = false) => play(() => {
      noise({ dur: 0.3, vol: 0.06, type: "bandpass", f: 900, f2: 350, q: 0.8 });
      tone({ f: 160, f2: 70, t: 0.29, dur: 0.16, vol: 0.26 });
      noise({ t: 0.29, dur: 0.05, vol: 0.1, type: "lowpass", f: 1200 });
      if (painted) {
        noise({ t: 0.31, dur: 0.26, vol: 0.3, type: "bandpass", f: 500, f2: 2600, q: 2 });
        tone({ f: 330, f2: 700, t: 0.31, dur: 0.22, vol: 0.3 });
      }
    }),
    // Pintou sem se mover (peça já encostada)
    paint: () => play(() => {
      tone({ f: 200, f2: 120, dur: 0.07, vol: 0.3, type: "triangle" });
      noise({ t: 0.03, dur: 0.26, vol: 0.3, type: "bandpass", f: 500, f2: 2600, q: 2 });
      tone({ f: 330, f2: 700, t: 0.03, dur: 0.22, vol: 0.3 });
    }),
    // Toque que não faz nada (encostada, parede, peça sem cor)
    nudge: () => play(() => tone({ f: 230, f2: 180, dur: 0.09, vol: 0.4, type: "triangle" })),
    // Engrenagens girando: um "tic-tac" por peça (até 4)
    rotate: n => play(() => {
      for (let k = 0; k < Math.min(n, 4); k++) {
        tone({ f: 2300, dur: 0.025, vol: 0.12, type: "square", t: 0.05 + k * 0.05, lp: 5000 });
        tone({ f: 1500, dur: 0.025, vol: 0.1, type: "square", t: 0.075 + k * 0.05, lp: 4000 });
      }
    }),
    undo: () => play(() => { noise({ dur: 0.24, vol: 0.4, type: "bandpass", f: 2600, f2: 500, q: 1 }); tone({ f: 900, f2: 450, dur: 0.2, vol: 0.12 }); }),
    hint: () => play(() => [1046.5, 1318.5, 1568, 2093].forEach((f, k) => tone({ f, t: k * 0.05, dur: 0.22, vol: 0.15 }))),
    // Tabuleiro travou
    stuck: () => play(() => {
      tone({ f: 247, dur: 0.2, vol: 0.25, type: "sawtooth", lp: 900 });
      tone({ f: 185, t: 0.18, dur: 0.32, vol: 0.25, type: "sawtooth", lp: 700 });
    }),
    // Vitória: arpejo + uma nota por estrela, no ritmo em que elas aparecem no cartão
    win: stars => play(() => {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, k) => bell(f, k * 0.1, 0.17, 0.6));
      for (let k = 0; k < stars; k++) bell([1318.5, 1568, 2093][k], 0.55 + k * 0.3, 0.17, 0.5);
    }),
    // Recorde ou mundo liberado
    jingle: () => play(() => [783.99, 987.77, 1174.66, 1567.98].forEach((f, k) => bell(f, 1.5 + k * 0.08, 0.12, 0.45))),
    // Conquista desbloqueada
    medal: () => play(() => { [1046.5, 1318.5, 1568, 2093].forEach((f, k) => bell(f, k * 0.07, 0.13, 0.45)); noise({ t: 0.28, dur: 0.3, vol: 0.05, type: "highpass", f: 5000, f2: 9000 }); }),
    // Compra / moedas
    coin: () => play(() => { bell(1975.5, 0, 0.14, 0.25); bell(2637, 0.08, 0.14, 0.4); }),
    // Perdeu (sem vidas, chefe venceu, desafio sem terminar)
    lose: () => play(() => [392, 349.23, 311.13, 261.63].forEach((f, k) => tone({ f, t: k * 0.16, dur: 0.3, vol: 0.14, type: "triangle", lp: 2000 }))),
  };
})();
