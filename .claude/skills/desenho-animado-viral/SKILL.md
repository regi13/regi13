---
name: desenho-animado-viral
description: Cria um desenho animado vertical (Shorts/Reels) em português: 10 ideias, roteiro, narração com voz de IA (grátis), legendas e o MP4 final com música e efeitos. Tem o modo cartoon leve e o modo POV de suspense (1ª pessoa + narrador em 3ª pessoa).
---

# Desenho animado viral: ideia → roteiro → narração → MP4 pronto

O visual: personagens 2D estilo "cabeça de feijão" (cartões desenhados em canvas, contorno ameixa) num mundo 3D colorido com contorno de tinta preta, texturas pintadas, desfoque de profundidade e câmeras deslizando. Saída: 1080x1920, 30 fps, com exatamente a duração da narração. Trilha e efeitos são sintetizados e ficam a **50 % do nível da voz**. Exemplo pronto no kit: "O cheiro do pão" (23 s, 6 planos).

Converse sempre em **português do Brasil**.

## Regras
- Histórias, personagens e planos são sempre originais. Nunca recrie o vídeo de outro criador plano a plano; ofereça uma versão original da mesma ideia.
- Nada de pessoas reais vivas como personagens, nem mascotes ou logotipos de marcas.
- Sem legendas, a menos que o usuário peça. Texto dentro da cena (placa, letreiro) pode, e precisa ler certo (não espelhado).
- Nunca edite nem mude o tempo da narração do usuário. A imagem é que segue a voz; cada reação visual acontece 0–3 quadros antes da palavra.
- **Níveis de áudio (cartoon leve):** trilha a 50 % do nível da voz (−6 dB, RMS com gate). No modo POV de suspense vale `mix2.py` (ver Lições aprendidas). Efeitos a 50 % ou menos, com picos limitados. No cartoon leve, mixe com `mix.py`, sem ducking nem compressão que mude essa proporção.
- Mantenha o usuário informado com uma lista de tarefas. Envie uma folha de quadros (prévia) antes do render longo.

## Lições aprendidas com o usuário (OBRIGATÓRIO: releia antes de cada vídeo e não repita nenhum erro)
Estas são correções reais que o usuário fez. Cada item é uma regra.

**Vozes**
- **Nunca** ofereça só as 3 vozes embutidas do kit (`pm_alex`, `pm_santa`, `pf_dora`) como "opções". O usuário pediu explicitamente para não repetir sempre as mesmas. Quando pedirem vozes, dê **3 opções diferentes por personagem**, nenhuma delas as embutidas. As embutidas são só reserva de emergência, com aviso.
- Ordem de motores de voz para **pt-BR** (melhor → pior): 1) **ElevenLabs** (só se o plano permitir; o plano gratuito pode ser desativado com "Unusual activity… Free Tier disabled": **não contorne**, avise e passe ao 2); 2) **Chatterbox pt-BR** (`FearL0rd/Chatterbox-TTS-Portuguese`, MIT, treinado em BRSpeech: sotaque brasileiro; use `ChatterboxTTS.from_local`, `kit/pov-suspense/pt_run.py`); 3) Kokoro (`voz.py`, robótico).
- **NÃO use Qwen3-TTS para pt-BR**: o português dele saiu **de Portugal** e engole palavras ("tranque a porta" → "tranque porta"). O usuário reprovou. Chatterbox multilingual genérico também erra palavras; prefira o fine-tune pt-BR.
- Fixe o timbre com uma **referência gerada pelo próprio modelo** (tomada boa, ASR 1,0, F0 do narrador ~110–135 Hz) e use-a em todas as falas; gere 4–8 tomadas por fala; palavras difíceis ("síndico", "desça") podem falhar: **troque a palavra** na fala em vez de insistir.
- Para baixar modelos do Hugging Face use `HF_HUB_DISABLE_XET=1` (senão trava no host do xet). Se a rede bloquear, use `read_documentation`/`update_environment` (pede aprovação do usuário), nunca contorne.
- **Confira cada fala com reconhecimento de fala** (faster-whisper) **palavra por palavra** (toda palavra do texto precisa aparecer; um ratio global alto esconde palavras engolidas), também no `voice.wav` final depois dos efeitos, e regenere até sair sem erro. Ouvido do usuário > ASR: se ele disser que cortou palavra ou que soa de Portugal, troque de motor.
- **Sussurro:** nos momentos de tensão a voz tem que sussurrar. Peça no estilo da voz (instrução/clone de uma referência sussurrada). Só use o processamento de sussurro (envelope cepstral + ruído) como reserva, porque o efeito sobre voz normal soa robótico.
- Se o usuário pedir narração em **3ª pessoa**, as falas dos personagens (mãe, interfone, vizinho…) viram **narração** e os personagens só aparecem animados (sem voz própria e sem mexer a boca). Use no máximo 2 vozes: narrador (3ª pessoa, grave, suspense) e pensamento (1ª pessoa, sussurrado). Textos de celular/chat aparecem na tela.
- **Narração profissional = frase a frase** (`kit/pov-suspense/pt_phrases.py` + `build_voice5.py`). NUNCA gere a fala inteira de uma vez: sai corrida, sem pontuação e "atravessada" (o usuário reprovou duas vezes). Divida em frases pelo ponto/interrogação/dois-pontos/reticências (e por vírgula quando a frase é longa), gere cada frase com a pontuação (entonação), escolha a tomada por ASR palavra por palavra + borda sem corte + ritmo (~0,40 s/palavra no narrador), e monte com pausas: ponto 0,55 s, interrogação 0,6, dois-pontos 0,42, vírgula 0,26, reticências 0,85 (×1,15 no narrador), com "room tone" nas pausas (nunca silêncio digital).
- Não processe demais a voz de pensamento: pitch/sopro em cima do TTS **piora a inteligibilidade** (virou "tranquilo" no lugar de "tranco"). Ao trocar de texto, **invalide o cache por texto** (a chave só por posição já fez perder "tranque a porta").
- Verifique o `voice.wav` final com ASR **depois da mixagem das vozes** (não só as tomadas cruas) e leia a lista inteira antes de entregar. Evite falas de 1 palavra (mescle com a vizinha) e palavras raras.
- **Tom de suspense na narração** (o usuário reprovou "voz sem suspense"): narrador grave e lento, não neutro. Receita usada: Chatterbox com `exaggeration≈0.75`, `cfg≈0.4`, `temperature≈0.65`; tom ×0,95 (rubberband), EQ quente (+3 dB em 130 Hz, +1,8 dB em 3 kHz), compressor 3:1, eco curto de sala e pausas ×1,05; frases curtas e ominosas ("Domingo à noite.", "E, de repente... as luzes se apagam."). O texto também precisa criar suspense (reticências, frases secas).
- **Personagens que o usuário quer ouvir** (ex.: a mãe) voltam como voz própria: gere uma referência feminina por busca de sementes (F0 ≥ ~175 Hz) e use-a só para ela; "voz atrás da porta" = mesma voz com passa-baixa + eco curto e mais baixa. A boca do personagem só mexe durante a fala dele.
- Agende as falas **sequencialmente** (cada uma só começa depois da anterior + 0,3 s) e confira que a última termina antes do fim do vídeo; fala cortada no fim é erro.
- A fala tem que caber no plano: ou encurte o texto, ou **estique o plano** (linha do tempo guiada pelo áudio, `plan_timeline.py`). Nunca acelere a voz acima de ~1,1×.
- Nunca afirme que a voz está "100 % humana": você não ouve áudio. Meça (ASR, F0), diga o que não conseguiu conferir e o que o usuário pode melhorar (ex.: plano pago do ElevenLabs).

**Roteiro e estrutura (lições do "Plantão das Cinco Regras")**
- **Ordem cronológica coerente:** se um chefe/guia explica regras no dia 1, o personagem NÃO pode reagir a acontecimentos no dia 1. Dia 1 = só explicação; os acontecimentos vão para a noite/dia 2, com cartão de título ("DIA 1", "NOITE 2"). Revise o roteiro lendo-o como linha do tempo antes de gravar.
- Final precisa **deixar o público decidir** (2 botões numerados + "COMENTE 1 OU 2" + "A PARTE 2 SEGUE A MAIORIA"). Nada de final "o que é a regra 5".
- Ícones/adereços nunca cobrem texto de botão: confira o quadro final.
- Uma fala nova só regrava as frases alteradas (cache por texto); mas **qualquer mudança de roteiro refaz tempos, legendas, trilha e todos os quadros**.

**Motor 2D (preferido desde "Plantão")**
- `kit/2d-suspense/`: Canvas 2D puro (sem Three.js), ~0,6–1 s/quadro, 4 processos em paralelo. `web/main.js` (cenas por tipo de plano, `CAM` zoom, vinheta, grão), `plan_cuts.py` (1 plano por fala, corte 0,12 s antes), `pt_phr4.py` (voz frase a frase, Chatterbox pt-BR, ASR estrito), `build_voice7.py`, `audio4.py`, `make_ass.py`, `mix2.py`, `finish.sh`. Exemplo de roteiro: `work/script_exemplo.json`.
- Vozes escolhidas pelo usuário via candidatas derivadas por pitch (`pt_cand2.py`): 3 opções por personagem.
- **Melhorias de edição (v3):** legendas palavra a palavra com destaque (`make_ass2.py`, alinha cada palavra ao `voice.wav` com faster-whisper; use `-vf "setpts=...,ass=legendas2.ass"`), punch-in de 4,5% em todo corte, quadros de impacto (inversão em 2 quadros) nos sustos, teste cego de voz A/B (`ab_f5.py`: F5-TTS pt-BR `firstpixel/F5-TTS-pt-br`, uso não comercial; texto em minúsculas; números por extenso; ele errou "sétimo andar" no teste, então confira por ASR).
- **Voz F5-TTS pt-BR (usada em "O Último Pedido", escolha do usuário no teste A/B):** `f5_phr.py` (frase a frase, 4 takes, ASR estrito, `nfe_step=22`, `speed` 0,58–0,74; ~1 min/frase em CPU). Frases com ≤ 2 palavras ou nomes ('Cliente: Thiago') saem erradas: reescreva para frases de 5+ palavras e evite palavras funcionais soltas ('a central', 'com o seu' → o modelo engole o artigo). Horários por extenso saem como dígitos no ASR: o `norm()` ignora 'duas e catorze'. Exemplo completo de cenas: `exemplo-pedido/main_pedido.js` + `work/script_pedido.json`. Use `audio5.py` e o `mix2.py` novo (comprime picos dos efeitos para ficarem ≈ −2 dB da voz).
- **Entonação e pontuação (o usuário reprovou voz F5 "sem entonação e sem pontuação"):** o TTS sai monótono. Depois de gerar as frases rode `prosody.py` (Praat/PSOLA via `praat-parselmouth`): exagera o contorno de F0 (expoente 1,3–1,5), **cai** no ponto final, **sobe** na interrogação, sobe levemente antes de vírgula, alonga o ritmo 5–12 %, e **insere pausas** de 0,30 s nas vírgulas e 0,42 s nos dois-pontos (alinhadas por ASR). Faz ASR da frase processada e, se piorar, reduz o exagero (fallback). Em `build_voice7.py` as pausas entre frases foram aumentadas (`.` 0,70, `?` 0,78, narrador ×1,10). Medido: variação de pitch ~+40 %. Palavras que o modelo deforma ('recibo' → 'recílo', 'é a central' → 'acentral') → troque a palavra no texto. Rode `check_voice.py` no `voice.wav` final.
- **Legendas × elementos:** legenda fica em y≈1650–1800; nada importante (botões, contador) abaixo de y≈1600 após o zoom da câmera.
- Pesquisa de referência (voz limpa + animação profissional): `PESQUISA-voz-e-animacao.md`.

**Roteiro profissional (o usuário reprovou um roteiro "confuso no final": releia isto antes de escrever)**
- **Um medo, uma pergunta dramática, um dilema.** Escreva primeiro: logline de 1 frase, a pergunta que o espectador quer ver respondida e as DUAS opções finais com a consequência de cada uma. Se não cabe em 1 frase por opção, está confuso.
- **Vocabulário único:** cada coisa tem UM nome no vídeo todo (ex.: "pedido", "entregar", "entrar"). Os botões finais usam exatamente os verbos que a história plantou.
- **Plante e pague:** toda regra/aviso dita no começo (prazo, "conta bloqueada", "não toque a campainha") tem que ser usada depois; nada aparece no final sem ter sido plantado antes. Corte o que não avança pergunta, pista ou aposta.
- **Apostas explícitas, simétricas e ditas em voz clara antes da decisão** (o que se perde em cada opção, em palavras simples, sem "perder tudo"/"quem está certo" vagos). Nenhuma opção pode ser obviamente a boa.
- **Causa e efeito linear e datas simples:** nada de "amanhã"/"ontem" sem necessidade; prefira horários (02:14 → 02:31 → 02:40) com cartão na tela.
- **Teste de clareza:** resuma cada fala em 3 palavras (o que muda?). Se duas falas dizem o mesmo, ou uma não muda nada, corte. Leia o roteiro em voz alta como um estranho: ele sabe QUEM quer O QUÊ, O QUE acontece se falhar e O QUE o público decide?
- Frases finais curtas, sem palavra solta de 1 palavra (o TTS erra); frases de 5+ palavras.
- Pesquisa de apoio: dilema único, plante/pague (Chekhov), ambos os finais roteirizados e equilibrados, cliffhanger que nasce da própria história.

**Som**
- No modo suspense, trilha/efeitos de suspense **altos**: música ≈ voz −0,4 dB, efeitos ≈ −2 dB, com ducking leve na voz (`mix2.py`). A regra "50 % da voz" vale só para o cartoon leve. Siga o pedido do usuário.
- Camadas de suspense: crescendo antes da virada, drone grave, batimentos que aceleram, rangido agudo, batidas graves, apito no fim, silêncio dramático e golpe no cartão final.

**Visual (checklist antes de finalizar: veja pelo menos 1 quadro a cada 2–3 s, as transições e cada animação de porta/objeto)**
- **Porta:** vão real na parede + batente + corredor atrás, abre **para fora**, sem placa clara no pé. **Nunca** brilho, faixa ou halo branco no pé da porta (nem no claro nem no escuro). Porta não pode girar na frente de parede maciça.
- **Zoom em objeto** (maçaneta etc.): confira o **último quadro do zoom**: o objeto tem que estar no centro e visível.
- **Mãos POV:** nada de "palmas abertas" nem braços de tubo; punhos relaxados e baixos. Mãos só abertas quando seguram algo.
- **Closes de rosto:** cabeça nunca cortada (câmera a ~2 m, fov ~34).
- **Cenas escuras:** legíveis (luz de lua, ganho azul moderado). Nunca um retângulo escuro vazio.
- **Efeitos** (anéis de som etc.) com tamanho proporcional ao objeto.
- **Personagem narrado** não mexe a boca.
- Cada pista visual citada na fala precisa existir na imagem (se tirar o recurso visual, reescreva a fala).

**Legendas**
- Narrador branco, pensamento ciano em itálico, uma linha de ≤ 22 caracteres (nunca estourar a borda), sussurro menor/itálico. Rodar `make_ass.py` depois de qualquer mudança de tempo.

**Processo**
- Gere 8–12 quadros de teste e olhe **antes** do render longo; re-renderize só os quadros afetados (lista de intervalos) e use 4 processos em paralelo com `RESUME=1`.
- A linha do tempo da história fica em **segundos** e o áudio comanda (`plan_timeline.py` gera `web/tmap.js` e `work/timeline.json`).
- Disco é curto (~12–17 GB livres): apague venvs e caches velhos antes de baixar modelos de 4 GB.
- Quando o usuário der autonomia total, **não pare para pedir aprovação**: decida, execute e conte o que mudou, incluindo o que não conseguiu verificar.
- Reporte tudo com franqueza (limitações, o que não ouviu/viu) e ofereça salvar o projeto no repositório.

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
- **A escolha da voz** (AskUserQuestion, depois das amostras): ofereça **3 opções por personagem** (nunca as 3 embutidas). Descreva cada uma (ex.: "grave, rouca, true crime"). Se o usuário pedir narração em 3ª pessoa, a escolha é só do **narrador** e da **voz de pensamento**. Veja "Lições aprendidas".
  - **Vou gerar fora e enviar**: ElevenLabs ou outra. Dicas: narrador firme e caloroso, velocidade ~1,05–1,1, estabilidade ~45–55 %, pausas naturais, sem música (mp3 ou wav).
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

## Modo POV de suspense (1ª pessoa + narrador em 3ª pessoa)
Usado em "O interfone" (apartamento, apagão, alguém na porta). Tudo em `kit/pov-suspense/`.
- **Câmera POV:** altura dos olhos, fov 60–72, **mãos do narrador** como cartão colado na câmera (`povHands`, poses `idle`/`stir`/`lock`/`grip`) e **celular** como cartão (`phoneUI`: chat, banner de notificação, digitação letra por letra). Cartão final `endCard` ("O QUE VOCÊ FARIA?" + 2 botões + "Comente PARTE 2").
- **Cenas de reação:** cartão do personagem (`teen`), câmera a ~2,4 m com fov ~34, fundo desfocado.
- **Mundo:** `kit/pov-suspense/main.js` tem o apartamento (cozinha, mesa, sofá, janela com skyline dia/noite, interfone, porta com vão + corredor). Luz clara → apagão azul-noite com luz de lua (`lightFor`).
- **Pipeline:** `qw_gen.py` (vozes) → `plan_timeline.py` (estica os planos conforme o áudio) → `build_voice3.py` (voice.wav + clips.json) → `audio.py` (trilha de suspense + efeitos, já remapeados no tempo) → `mix2.py` → `make_ass.py` → ffmpeg `ass=legendas.ass` + `loudnorm`.
- Gancho/estrutura (do vídeo de referência): normalidade → autoridade estranha → luz apaga → pistas pelo celular → ameaça por sons → dúvida sobre quem está do outro lado → dilema com 2 botões → "Comente PARTE 2". Cortes a cada 1–3 s, legendas curtas coloridas por quem fala.
