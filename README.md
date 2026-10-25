# HEXABOARD

Puzzle de hexágonos com setas, em HTML + JavaScript puro (canvas). Funciona no navegador e instala no celular como app (PWA).

**Jogar:** https://lsimoes2021gm.github.io/Hexaboard/

## Regras
- Toque numa peça: ela anda na direção da seta e sai se o caminho estiver livre.
- Se bater em outra peça, desliza até encostar e fica parada ali.
- Peças com anel giram 60° quando uma vizinha sai do lugar.
- Pontos: 10 por peça × corrente de saídas seguidas (até ×5); deslize −10; giro aproveitado +15; dica −30.

## Modos
- **Campanha:** 4 mundos × 10 fases fixas. Para abrir um mundo, vença a fase chefe do anterior e junte 20 estrelas nele.
- **Desafio diário:** uma fase por dia (horário de Brasília), igual para todos. Só a primeira tentativa vale.
- **Ranking online (Firebase):** geral, por fase e do dia.

## Estrutura
| Arquivo | Conteúdo |
|---|---|
| `index.html` | Interface: mapa, jogo, cartões, ranking |
| `js/logica.js` | Regras, solver e gerador de fases |
| `js/fases.js` | As 40 fases da campanha (gerado) |
| `js/ranking.js` | Conexão com o Firebase |
| `firestore.rules` | Regras de segurança do Firestore |
| `tools/gerar-fases.js` | Script que gera `js/fases.js` |
| `sw.js`, `manifest.webmanifest` | App instalável e modo offline |

## Gerar as fases de novo
```bash
node tools/gerar-fases.js
```
Atenção: mudar as fases invalida o ranking por fase de quem já jogou.

## Publicar uma atualização
Ao mudar qualquer arquivo, aumente o número em `CACHE` no `sw.js` (ex.: `hexaboard-v4`) para os celulares baixarem a versão nova.
