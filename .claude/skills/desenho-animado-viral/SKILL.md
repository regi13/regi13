---
name: desenho-animado-viral
description: Cria um desenho animado vertical (Shorts/Reels) em português: 10 ideias, roteiro, narração grátis com voz de IA e o MP4 final com música e efeitos.
---

# Desenho animado viral: ideia → roteiro → narração → MP4 pronto

O visual: personagens 2D estilo "cabeça de feijão" (cartões desenhados em canvas, contorno ameixa) num mundo 3D colorido com contorno de tinta preta, texturas pintadas, desfoque de profundidade e câmeras deslizando. Saída: 1080x1920, 30 fps, com exatamente a duração da narração. Trilha e efeitos são sintetizados e ficam a **50 % do nível da voz**. Exemplo pronto no kit: "O cheiro do pão" (23 s, 6 planos).

Converse sempre em **português do Brasil**.

## Regras
- Histórias, personagens e planos são sempre originais. Nunca recrie o vídeo de outro criador plano a plano; ofereça uma versão original da mesma ideia.
- Nada de pessoas reais vivas como personagens, nem mascotes ou logotipos de marcas.
- Sem legendas, a menos que o usuário peça. Texto dentro da cena (placa, letreiro) pode, e precisa ler certo (não espelhado).
- Nunca edite nem mude o tempo da narração do usuário. A imagem é que segue a voz; cada reação visual acontece 0–3 quadros antes da palavra.
- **Níveis de áudio:** trilha a 50 % do nível da voz (−6 dB, RMS com gate). Efeitos a 50 % ou menos, com picos limitados. Mixe sempre com `mix.py`, nunca à mão. Sem ducking nem compressão que mude essa proporção.
- Mantenha o usuário informado com uma lista de tarefas. Envie uma folha de quadros (prévia) antes do render longo.

## Etapa 1: Ponto de partida (sempre primeiro)
Se já veio um arquivo de áudio, pule para a Etapa 4 (se veio o roteiro também, use-o no timing).
Senão, pergunte com AskUserQuestion (ou em texto): **"Por onde a gente começa?"**
- **Já tenho a narração gravada**: peça o áudio e, se tiver, o texto do roteiro. Vá para a Etapa 4.
- **Tenho o roteiro, falta a narração**: ajuste o roteiro pela Etapa 3 se precisar e siga para a escolha da voz.
- **Preciso de ideias e roteiro**: vá para a Etapa 2.
Pergunte também a duração, se não foi dita. Padrão 20–30 s; 45–60 s é possível (o render demora proporcionalmente).

## Etapa 2: 10 ideias de vídeo
Dê exatamente 10 ideias numa resposta, numeradas, e peça para responder com o número (ou "mais"). Cada ideia tem:
- **Título** (5–8 palavras, curiosidade, ex.: "O homem processado por cheirar pão").
- **Gancho**: a primeira frase falada, um paradoxo dito como fato ("Um homem vendeu a Torre Eiffel. Duas vezes.").
- **A virada** em uma linha (o desfecho irônico que encerra o vídeo).
- **Por que anima bem**: os 2–3 grandes momentos visuais (um desabamento, uma revelação, uma perseguição).
- **Verdade ou lenda**: diga claramente se é história documentada, relato discutido, conto popular ou folclore.

O que faz uma ideia perfeita para o formato:
- Uma história surpreendente com causa e efeito físico que dá para mostrar.
- Um personagem comum, tensão que cresce e uma virada na última frase.
- Um cenário que dá para montar com formas 3D simples + cartões (vilas, pontes, navios, castelos, desertos, laboratórios, palácios).
- Varie as 10 entre épocas e temas: antiguidade, idade média, 1800, moderno, ciência, animais, invenções, desastres, leis estranhas, acidentes de sorte. Inclua 2–3 histórias do Brasil.
- O que for apresentado como verdade: confira os fatos principais numa busca na web antes de oferecer. Não apresente lenda viral como fato; se o usuário quiser mesmo assim, use "diz a lenda".
- Nada de pessoas reais vivas como alvo de piada, nada gráfico e nada político.

## Etapa 3: Roteiro (depois da escolha)
Escreva só a narração (sem indicações de cena no texto falado), em **~3 palavras por segundo**: 20 s ≈ 60 palavras, 30 s ≈ 90, 60 s ≈ 180. Fórmula:
1. **Gancho** (frase 1, sem introdução): o fato absurdo.
2. **Cenário** em 1–2 frases: quando, onde, quem, um detalhe concreto.
3. **Escalada** em 2–4 batidas, cada uma maior. Alguém duvida ou zomba. Uma piada de exagero.
4. **Mistério ou virada de chave**: "Mas quando..." / "Acontece que..." revela o mecanismo, de preferência com uma comparação do dia a dia.
5. **Desfecho**: curto, irônico, e são as últimas palavras do vídeo.
Português do Brasil falado, frases de 8–15 palavras, números por extenso. Nunca descreva o que o espectador já está vendo.

Responda com:
- O roteiro num bloco copiável, com contagem de palavras e duração estimada.
- Um parágrafo com o plano visual (os planos que você vai animar).
- **Amostras das vozes antes da escolha:** rode o setup (4.0) se ainda não rodou e gere, com `voz.py`, a primeira frase do roteiro nas 3 vozes (`amostra_pm_alex.wav`, `amostra_pm_santa.wav`, `amostra_pf_dora.wav`). Entregue os 3 áudios na conversa para o usuário ouvir.
- **A escolha da voz** (AskUserQuestion, depois das amostras):
  - **Voz grátis embutida (recomendado para começar)**: voz de IA em português do Brasil gerada aqui mesmo pelo `voz.py`. Vozes: `pm_alex` (masculina, narrador), `pm_santa` (masculina, grave), `pf_dora` (feminina).
  - **Vou gerar fora e enviar**: ElevenLabs, Higgsfield ou outra. Dicas: uma voz de narrador firme e calorosa, velocidade ~1,05–1,1, estabilidade ~45–55 %, pausas naturais no fim das frases, exportar sem música (mp3 ou wav).
Guarde o texto final do roteiro: ele comanda o timing (não precisa de reconhecimento de fala). Se o usuário gravou uma versão alterada, peça o texto final.

## Etapa 4: Montar o vídeo
Daqui em diante faça tudo sem parar. Só pergunte se o timing não puder ser resolvido.

### 4.0 Pegar o kit e preparar o projeto
O kit vem **dentro desta pasta da skill**, em `kit/` (motor, ferramentas, exemplo, three.js r160 e a biblioteca toon de github.com/mromidev/claude-animated-shorts já incluídos, ambos MIT). Ache a pasta com `find / -name SKILL.md -path "*desenho-animado-viral*" 2>/dev/null` e trate `kit/` como somente leitura.
Rode `bash <skill>/kit/tools/setup.sh ~/shorts/<slug>`. Ele copia o motor e as ferramentas para o projeto, monta `web/toon.js` e verifica Node, numpy/Pillow, ffmpeg, Playwright e Chromium.
- Se o Chromium do Playwright não abrir, o setup instala um Chromium pelo npm (`@sparticuz/chromium`) e grava o caminho em `.chrome`; o `render.mjs` usa sozinho.
- Tudo vem de npm e PyPI, liberados no padrão do Claude. Se algo for bloqueado, confira com o usuário se "Permitir acesso de rede externo" está ligado. Nunca desative TLS nem contorne o proxy.

### 4.1 Narração
- **Voz embutida:** salve o roteiro em `script.txt` e rode `python3 voz.py script.txt voice.wav --voz pm_alex`. Na primeira vez ele instala o `kokoro-onnx` (PyPI) e baixa o modelo (~92 MB) pelo npm, conferido por sha256; as 3 vozes já vêm no kit. Depois roda offline. Funciona com a configuração padrão de rede do Claude ("só gerenciadores de pacotes"). O script corrige vícios de pronúncia de Portugal. Se o usuário reclamar de uma palavra, ajuste a grafia no texto falado (ex.: separar sílabas, trocar por sinônimo) ou acrescente uma regra em `br()`.
- **Trocar a voz depois do render** (sem renderizar de novo): `python3 voz.py script.txt voice2.wav --voz pf_dora --fit work/phrases.json`, depois só `mix.py` e `finish.sh`.
- **Áudio do usuário:** copie para o projeto como está.

### 4.2 Timing
`python3 timing.py voice.wav script.txt --out work`
- Com whisper/faster-whisper instalado, usa marcação por palavra. Senão, alinha as frases do roteiro (quebradas na pontuação) aos trechos de fala detectados por silêncio. Funciona em português.
- Sem roteiro e sem reconhecimento de fala, peça o roteiro: o Claude não ouve o áudio.
- Confira `work/phrases.json`: as pausas devem cair nos fins de frase. Total de quadros = round(duração × 30).

### 4.3 Plano de planos (`work/PLAN.md` antes do código)
Uma linha por plano: quadros, palavras, cenário, luz, movimento de câmera, personagens/poses/expressões, efeitos e som.
- O quadro 0 já é a imagem do gancho.
- Normalmente um plano por frase; junte frases muito curtas com a seguinte.
- Ilustre cada frase literalmente. Objetos carregam as piadas.
- Varie o tamanho: gancho em plano médio-fechado → abertura grande → dois personagens → close no objeto-chave → close de reação → movimento de cenário no desfecho.
- Luz para as batidas: dia para o normal, dourada para drama ou decadência, azul-noite para explicação. Salto de tempo/lugar = flash branco de 6 quadros.
- A frase da virada leva um "sting" (música para, golpe grave, aproximação com leve rotação). O desfecho físico do último plano cai na última palavra.

### 4.4 Mundo (`web/main.js`)
Mantenha as seções do motor: materiais toon, contrato de contorno, `add`/`tbox`, céu, luzes, cards, render targets/pós, `applyLight`, `drawActors`, `swapForNd`, `renderFrame`. Substitua o mundo de exemplo (a praça com a padaria) entre `// ---------- world ----------` e `// clouds:`, e a parte da história em `worldState()`.
- Construa com primitivas + texturas pintadas em canvas (`paint.js`: tábuas, vigas, madeira podre, pedra, musgo, grama, terra, reboco, telhas, mármore, bandeiras, texto entalhado, paralelepípedos `cobbles`, placa de loja `shopSign`). Novos pintores no mesmo estilo chapado com juntas escuras.
- `tbox` para densidade de textura constante, gradiente toon de 2 passos, neblina = cor do horizonte.
- Fundo: morros (esferas meio enterradas), montanhas (cones + neve), ciprestes/pinheiros, casas, nuvens pintadas.
- Peças que se mexem (portas, desabamentos, quedas) são grupos com pivô dirigidos por progresso 0..1 de `worldAt(f)` (ex.: `door` e `table` no exemplo).
- Texto na cena: plano virado para +z com a textura normal lê certo; confira se não ficou espelhado.

### 4.5 Elenco (`web/roman.js` → `web/toon.js`)
- `romanFront(p, roupa, opts)` desenha num canvas de 600x1000 com os pés em y=975. O cartão tem 2,25 m de altura (1 unidade = 0,00225 m). Olhos a ~1,47 m do chão.
- Roupas em `OUTFITS` (tunic/cape/armor/helmet/hair/cap/beard/moustache/apron/dress/toga/stout/patches). Já existem: `pobre`, `padeiro`, `juiz`, `velha`, `civA`–`civD`, `workA`, `workB` e os romanos.
- Poses de braço: hang, spear, point, up, wave (oscila com `wv`), hip, belly, temple, lift, reach, cheek, shield, cross, thumb.
- Expressões: o conjunto FACE + snore, stubborn, squint, angry, greedy, bliss. Amplie FACE se precisar.
- **Objetos na mão:** `holdL`/`holdR` com uma chave de `PROP` (`bread`, `purse`; `bite`, `holdDx`, `holdDy`, `holdRot` ajustam). Novos objetos: acrescente uma função em `PROP` desenhando em volta de (hx, hy).
- Depois de editar: `cat web/toonbase.js web/roman.js > web/toon.js`. Renderize um teste dos personagens novos antes de usar.
- Cartões giram só no eixo vertical, têm sombra e mancha de contato, e nunca levam contorno do mundo.
- Chaves de cartão com valores arredondados por `q()` (o canvas só redesenha quando muda algo visível).

### 4.6 Movimento vivo (`web/motion.js`)
- **Câmeras:** `camFromKeys(keys, f, {kicks})`. Deslizes suaves (18–45 q), `easeOut` em revelações e chicotes, `path` com pontos intermediários para curvas. Todo "parado" ainda se move; nada fica estático por 4+ quadros. Rotação de 3–5° no drama, tremida de 7 quadros nos impactos.
- **Continuidade:** prefira movimentos contínuos (abrir de um close para o geral, mudar o foco, atravessar o cenário). Corte seco só em salto de lugar/tempo, com flash.
- **Personagens nunca congelam:** `idle(f, seed)` em todos, piscadas `blinkAt`, balanço de cabeça nas palavras fortes.
- **Ações:** antecipação → passa do ponto (`back`) → assenta (`spring`). Batida = afunda 2 quadros + poeira + tremida. Risada = inclinação alternada + pulo.
- **Movimento secundário:** fumaça, fitas de cheiro, notas musicais, brilhos, folhas. Sempre tem algo se mexendo.
- **Lente:** desfoque em closes e planos médios (cinf 8–14), foco nos olhos. Planos gerais nítidos.

### 4.7 Checagem de visual (antes do render completo)
Renderize quadros no meio de cada plano + transições + ações-chave: `node render.mjs stills/a "5,40,..."` e `python3 sheet.py stills/a stills/sheet_a.jpg`. Olhe a folha e corrija:
- **Quadro vertical estreito:** meia-largura horizontal = d·tan(hfov/2), com hfov = 2·atan(tan(vfov/2)·0,5625). A 4 m com fov 40 são ±0,8 m: coloque os personagens em profundidade, não lado a lado.
- **Close cortando a cabeça:** a ~1,9 m com fov 34 a cabeça estoura; use ~2,3 m.
- **Objeto na mão cortado por uma linha reta:** o braço `reach` vai quase até a borda do cartão (600 px) e o objeto sai do canvas. Para segurar algo perto de outra pessoa, use `wave`/`lift` e aproxime os personagens.
- **Braço passando na frente do rosto de outro:** quem está mais perto da câmera desenha por cima. Ajuste a profundidade (z).
- **Efeito invisível:** as funções fx do toon desenham numa região pequena do canvas (ex.: `fxNote` no canto 0–200 px). Translade/escale para o centro do cartão antes de desenhar.
- Objetos de cenário a menos de ~2 m da câmera (viram borrões), câmera atravessando casas ou telhados, herói escondido atrás de alguém, texto espelhado.
Envie a folha ao usuário com um resumo de uma linha por plano e comece o render completo.

### 4.8 Som (`audio.py` → stems → `mix.py`)
Reescreva a tabela de deixas para a história; os sintetizadores ficam. `audio.py` só grava stems (`music.wav`, `sfx.wav`).
- Música: um loop leve (bumbo/caixa, baixo dedilhado, pad, melodia). Para na frase da virada; depois, um drone grave.
- Efeitos nos eventos (quadro/30): whoosh em movimentos grandes, thunk em batidas, rangido de porta, mordida, chiado de vapor, moedas, burburinho de multidão, risada, "ting" em revelações, sting na virada.
- Mixe com `python3 mix.py voice.wav music.wav sfx.wav`. Confirme na saída: música −6,0 dB vs voz e efeitos nesse nível ou abaixo.
- Trave o tempo da imagem antes do som. Mudou o tempo, rode `audio.py` e `mix.py` de novo.

### 4.9 Render + finalização
- O render leva **~3–7 s por quadro** na CPU: 20 s de vídeo (600 quadros) ≈ 30–70 min. Avise o usuário antes.
- **Nunca encerre a sua resposta com o render rodando.** No Claude.ai ninguém te avisa quando o processo termina, e o usuário fica sem o vídeo. Renderize em primeiro plano, em **blocos de 100 quadros por comando** com `RESUME=1` (`RESUME=1 node render.mjs frames "0-99"`, depois `"100-199"`...), um bloco atrás do outro na mesma resposta, até o último quadro. Em seguida rode `audio.py`/`mix.py` (se ainda não rodou) e `finish.sh` e entregue o MP4, tudo na mesma resposta.
- Entre os blocos, mande só uma linha de progresso ("300 de 997 quadros").
- Se a conversa atingir o limite de uso ou for interrompida, o usuário pede para continuar e você retoma com `RESUME=1` do quadro onde parou. Se os arquivos do projeto sumiram, refaça o setup e os arquivos antes de renderizar de novo.
- Não rode Python pesado ao mesmo tempo em máquinas pequenas.
- `bash finish.sh "Título"`: normaliza a −14 LUFS com limitador, codifica H.264 + AAC, checa quadros congelados/pretos e gera `out/qa_sheet.jpg`. Olhe a folha.
- Entregue o MP4 com algumas linhas sobre cada plano. Ofereça legendas, ajustes, troca de voz (`--fit`) ou a próxima ideia da lista.

## Detalhes do motor (manter se mexer no kit)
- `#include <fog_vertex>` / `<fog_fragment>` em linhas próprias.
- O passe final escreve `linearToOutputTexel(...)` (render targets lineares HalfFloat).
- O passe de normal+profundidade troca materiais por malha: mundo → normal/profundidade, cartões → máscara com alpha test, nuvens/céu escondidos. Neblina e sombras desligadas nesse passe.
- Contorno só no lado próximo de saltos de profundidade; vincos pelo produto escalar das normais; vizinhos de cartão ignorados.
- Desfoque: 48 amostras com teste de CoC por amostra (sem vazar o primeiro plano).
- O sol vem de az/el por preset de luz; a câmera de sombra centraliza na ação de cada plano (`shadowAt`).

## Arquitetura
- `web/index.html` carrega `main.js` (módulo ES) por um servidor HTTP local.
- `main.js`: renderer, materiais toon, mundo, cartões (planos CanvasTexture 1200x2000, origem nos pés), passes cor → normal/profundidade → contorno+gradação (saturação, vinheta, flash) → desfoque. Expõe `window.renderFrame(f)` e `window.ready`.
- `story.js` exporta SHOTS, `shotAt`, `camAt`, `dofAt`, LIGHTS/`lightFor`, `worldAt`, `actorsAt(f, T)`, `fxAt(f, T)`. Tudo função pura do quadro. O do kit é o exemplo "O cheiro do pão": use como modelo.
- `render.mjs`: Playwright → `renderFrame(f)` → JPEG em `frames/f0000.jpg`.
- `voz.py`: narração grátis pt-BR. `timing.py`: alinhamento. `audio.py`: stems. `mix.py`: trava de níveis. `finish.sh`: loudness, codificação, QA. `sheet.py`: folhas de quadros.
- Personagens: API Pen de mromidev/claude-animated-shorts (`templates/bridge/toon.ts`, já convertida em `engine/toonbase.js`), estendida por `roman.js`. Licenças em `LICENCAS.md`.
