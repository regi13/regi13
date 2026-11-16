# kit/pov-suspense
Projeto completo de "O interfone" (POV de suspense). Copie para o projeto criado por `setup.sh` (web/ por cima do engine; scripts na raiz).
Ordem: `qw_gen.py` → `plan_timeline.py` → renderizar quadros → `build_voice3.py` → `audio.py` → `mix2.py` → `make_ass.py` → ffmpeg (`ass=legendas.ass`, `loudnorm`).
- `web/main.js`: mundo 3D do apartamento (porta com vão + corredor, interfone, janela dia/noite) e luz de apagão.
- `web/story.js`: planos, câmeras, cartões (mãos POV, celular, cartão final) e remapeamento do tempo (`tmap.js`).
- `web/roman.js`: acrescenta ao motor as mãos POV (`povHands`), o celular (`phoneUI`) e o cartão final (`endCard`).
- `qw_gen.py`: vozes Qwen3-TTS (VoiceDesign → clone Base) com conferência por reconhecimento de fala. Requer `pip install qwen-tts faster-whisper`, ~13 GB livres e `HF_HUB_DISABLE_XET=1`.

**Vozes pt-BR atuais:** `pt_run.py` (refs + falas, conferência palavra por palavra), `pt_redo.py` (refaz as reprovadas) e `build_voice4.py` (monta voice.wav; pensamento = voz mais aguda + sopro leve). `qw_gen.py` (Qwen3-TTS) ficou só como registro: **não serve para pt-BR**.
