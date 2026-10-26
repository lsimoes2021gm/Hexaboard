# HEXABOARD

Puzzle de hexágonos com setas, em HTML + JavaScript puro (canvas). Funciona no navegador e instala no celular como app (PWA).

**Jogar:** https://lsimoes2021gm.github.io/Hexaboard/

## Regras
- Toque numa peça: ela anda na direção da seta e sai se o caminho estiver livre.
- Se bater em outra peça, desliza até encostar e fica parada ali.
- Peças com anel giram 60° quando uma vizinha sai do lugar.
- Paredes (pedra) não saem e bloqueiam o caminho.
- Peças sem cor (cinzas) não andam sozinhas: quando outra peça bate nelas, ganham a cor e a direção de quem bateu.
- Pontos: 10 por peça × corrente de saídas seguidas (até ×5); deslize ou pintura −10; giro aproveitado +15; dica −30.
- Vidas: desfazer, reiniciar ou sair da fase no meio custa 1 vida. Vencer a fase devolve as vidas.
  Nos chefes, travar, reiniciar ou sair sem nenhuma vida faz o mundo voltar para a primeira fase (recordes e estrelas continuam valendo).

## Modos
- **Campanha:** 4 mundos × 10 fases fixas: Colmeia, Geleira, Oficina e Vulcão, cada um com cenário próprio. Para abrir um mundo, vença a fase chefe do anterior e junte 20 estrelas nele. O chefe 10 estreia as paredes e o chefe 20, as peças sem cor.
- **Desafio diário:** uma fase por dia (horário de Brasília), igual para todos. Só a primeira tentativa vale.
- **Ranking online (Firebase):** geral, por fase e do dia.
- **Coleção:** 23 conquistas, moedas (10 por estrela nova, conquistas e desafio diário) e estilos de peça para comprar.

## Estrutura
| Arquivo | Conteúdo |
|---|---|
| `index.html` | Interface: mapa, jogo, cartões, ranking |
| `js/logica.js` | Regras, solver e gerador de fases |
| `js/som.js` | Efeitos sonoros (sintetizados, sem arquivos de áudio) |
| `js/pecas.js` | Estilos de peça (Clássico, Gemas, Balas, Origami, Pixel, Neon) |
| `js/colecao.js` | Moedas, conquistas, perfil e loja de estilos |
| `js/temas.js` | Visual de cada mundo: cenário animado, casas, paredes e arte do mapa |
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
Ao mudar qualquer arquivo, aumente o número em `CACHE` no `sw.js` (ex.: `hexaboard-v9`) para os celulares baixarem a versão nova.
