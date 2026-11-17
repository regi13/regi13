# Pesquisa: narração limpa e animação profissional (nov/2026)

Fontes: buscas na web (blogs, papers, GitHub, Hugging Face). Quase nenhum resultado direto de YouTube, StackOverflow ou Reddit; tudo abaixo é evidência secundária e precisa ser validado com teste de escuta.

## 1. Voz limpa em pt-BR

### Achados
- Nenhuma fonte compara modelos em pt-BR para narração. Há um estudo acadêmico (VR/NPC, diálogo) com MOS médio 3,29 e XTTS/Parler no topo; no corpus do EMNLP 2025, F5-TTS teve maior naturalidade (uTMOS 3,39) e XTTS o menor erro de palavras (5,5%), Fish-Speech tinha saídas de duração anômala.
- Candidatos com pt-BR: Chatterbox (fine-tune pt-BR, MIT) [em uso], F5-TTS pt-BR (firstpixel, CC-BY-NC: só não comercial), XTTS-v2/Tagarela, Qwen3-TTS (sotaque PT-PT no nosso teste), Kokoro (robótico no nosso teste), IndexTTS-2 (controle de emoção/duração; pt-BR não confirmado), Voxtral (não confirmado).
- Licença: conferir se permite monetizar no YouTube (F5 pt-BR, Higgs e VibeVoice são só pesquisa/não comercial).
- Chatterbox (README oficial): padrão exaggeration 0,5 / cfg 0,5; para ritmo mais lento e dramático, cfg ~0,3 e exaggeration ~0,7; frases com menos de ~5 palavras geram mais artefatos.
- Pós-processamento: ordem consenso = limpeza/edição → HPF 80 Hz → compressão leve → de-esser → presença ~3 kHz → limiter → loudnorm (~-16 LUFS, pico -1 dBTP; ffmpeg: afftdn, acompressor, loudnorm em 2 passes). Denoisers genéricos funcionam mal em TTS porque o ruído é gerado junto com a fala; o paper usa Voicefixer + perfil de ruído do último 0,5 s (sox) + corte de silêncio das bordas + 0,1 s de padding.
- Naturalidade (guias de criadores): frases curtas escritas para o ouvido, pausas por pontuação, ritmo ~0,92x em momentos sérios, tags emocionais com moderação, respiração/room tone sutil, grafar nomes difíceis foneticamente.
- Voice conversion (Seed-VC) por cima do TTS pode melhorar naturalidade (paper cross-lingual), mas herda a prosódia do prompt; evidência fraca.

### Método recomendado (a validar)
1. Roteiro escrito para o ouvido; frases de 5–12 palavras; pontuação como direção de cena.
2. Gerar por frase, 6 takes, ASR palavra por palavra, escolher a take, ritmo ~0,40–0,46 s/palavra. (Já implementado.)
3. Teste A/B cego com o usuário: Chatterbox pt-BR × F5-TTS pt-BR × XTTS-v2 × IndexTTS-2 na mesma fala de 15 s.
4. Limpeza: Voicefixer ou resemble-enhance só se o A/B mostrar ganho (comparar com/sem); senão só cadeia ffmpeg.
5. Cadeia por locutor + room tone + loudnorm 2 passes (-16 LUFS voz).
6. Caminho "100% humano": voz paga (ElevenLabs) ou gravação do próprio usuário + conversão de timbre.

## 2. Animação profissional

### Achados
- Princípios de animação em motion graphics: easing é o mais importante; antecipação de 2–4 frames; overshoot + assentar; squash/stretch conservando área; ações secundárias (sombras atrasadas); timing e spacing no graph editor.
- Rhubarb Lip Sync (MIT): gera formas de boca (A–F + G,H,X) a partir do áudio; dar o texto falado melhora a precisão; há versão WASM. Atenção (conhecimento próprio, não confirmado nas fontes): o reconhecedor padrão é de inglês; para pt-BR usar modo fonético ou nosso fluxo por janelas de fala.
- Rigging 2D para web: Rive (MIT, vetor, state machines), Spine (runtime WebGL, ~20–30 esqueletos em mobile), DragonBones (editor parado desde ~2021). Blender Grease Pencil exporta para Lottie.
- Remotion: template TikTok oficial com legendas Whisper.cpp e destaque palavra a palavra; ver licença para uso comercial.
- Sobre canais virais de terror 2D: poucas fontes sólidas; recomendações recorrentes = paleta/local consistentes, movimento mínimo com luz dinâmica, estrutura gancho → escalada → desfecho.

### Método recomendado (a validar)
1. Biblioteca de personagens com rig por partes (cabeça, olhos, boca, braços) e visemas A–X; cada personagem com 3 expressões base.
2. Todo movimento com easing + overshoot; entradas com antecipação; respiração idle em personagens parados.
3. Câmera: zoom/pan por plano, parallax em 3 camadas, shake só em impacto, impact frames (1–2 quadros) em sustos.
4. Planos longos parados (>6 s) precisam de segundo evento visual (texto animado, mudança de luz, zoom).
5. Legendas palavra a palavra com destaque (Whisper alinhado) em vez de bloco.
6. QA automático: contact sheet por plano, checagem de elementos cobertos por legenda/ícone, taxa de cortes.

## Pendências
- Rodar o teste A/B de vozes e o ensaio com/sem enhancer.
- Prototipar visemas e rig de personagem no motor 2D.
