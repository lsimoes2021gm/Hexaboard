// HEXABOARD — ranking online (Firebase: login anônimo + Firestore).
// Expõe window.hxRanking e avisa com o evento "hx-ready" (ou "hx-error").
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, query, orderBy, limit, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDWEbFgsIrB-oe6tWZW24Z1HQLWadr4zrk",
  authDomain: "hexaboard-ca937.firebaseapp.com",
  projectId: "hexaboard-ca937",
  storageBucket: "hexaboard-ca937.firebasestorage.app",
  messagingSenderId: "431896965472",
  appId: "1:431896965472:web:b5caf070e287817c9bae05"
};

try {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const fs = getFirestore(app);
  let announced = false;

  const top = (segments, field, n, cb, err) => onSnapshot(
    query(collection(fs, ...segments), orderBy(field, "desc"), limit(n)),
    snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    err
  );

  onAuthStateChanged(auth, u => {
    if (!u || announced) return;
    announced = true;
    window.hxRanking = {
      uid: u.uid,
      // Ranking geral: soma do melhor resultado em cada fase
      setPlayer: data => setDoc(doc(fs, "players", u.uid), { ...data, at: serverTimestamp() }),
      watchPlayers: (cb, err) => top(["players"], "total", 20, cb, err),
      // Ranking de cada fase
      setLevel: (n, data) => setDoc(doc(fs, "levels", String(n), "scores", u.uid), { ...data, at: serverTimestamp() }),
      watchLevel: (n, cb, err) => top(["levels", String(n), "scores"], "score", 10, cb, err),
      // Desafio diário (as regras do Firestore só deixam gravar o resultado final uma vez)
      getDaily: day => getDoc(doc(fs, "daily", day, "scores", u.uid)).then(d => d.exists() ? d.data() : null),
      setDaily: (day, data) => setDoc(doc(fs, "daily", day, "scores", u.uid), { ...data, at: serverTimestamp() }),
      watchDaily: (day, cb, err) => top(["daily", day, "scores"], "score", 30, cb, err),
    };
    window.dispatchEvent(new Event("hx-ready"));
  });
  signInAnonymously(auth).catch(() => window.dispatchEvent(new Event("hx-error")));
} catch (e) {
  window.dispatchEvent(new Event("hx-error"));
}
