#!/usr/bin/env bash
# Cria um projeto novo:  bash <skill>/kit/tools/setup.sh <pasta_do_projeto>
# Tudo o que o motor precisa já vem no kit (three.js r160 + biblioteca toon). Sem rede, exceto se faltar Playwright/Chromium.
set -e
KIT="$(cd "$(dirname "$0")/.." && pwd)"; P="${1:?informe a pasta do projeto}"
mkdir -p "$P/web/lib" "$P/work" "$P/stills" "$P/out"
cp "$KIT"/engine/*.js "$KIT"/engine/index.html "$P/web/"
cp "$KIT"/vendor/three.module.js "$P/web/lib/"
cat "$P/web/toonbase.js" "$P/web/roman.js" > "$P/web/toon.js"
cp "$KIT"/tools/render.mjs "$KIT"/tools/*.py "$KIT"/tools/finish.sh "$KIT"/vendor/vozes_ptbr.npz "$P/"
chmod -R u+w "$P"
cd "$P"
# --- checagens ---
node -e 'const v=process.versions.node.split(".").map(Number); if(v[0]<18){console.error("Node 18+ necessário");process.exit(1)}'
python3 -c "import numpy, PIL" 2>/dev/null || pip install -q --break-system-packages numpy pillow 2>/dev/null || pip install -q numpy pillow
command -v ffmpeg >/dev/null || echo "AVISO: ffmpeg não encontrado (necessário para timing, mix e o MP4 final)."
# --- Playwright: global > local ---
if ! node --input-type=module -e "await import('playwright')" 2>/dev/null; then
  G="$(npm root -g 2>/dev/null)/playwright"
  if [ -d "$G" ]; then mkdir -p node_modules && ln -sfn "$G" node_modules/playwright
  else npm i --silent --no-audit --no-fund playwright-core@1.49.1 >/dev/null 2>&1 && echo "playwright-core instalado"; fi
fi
# --- Chromium: o do Playwright; se não abrir, um Chromium empacotado no npm (@sparticuz/chromium) ---
cat > _probe.mjs <<'JS'
let pw; try { pw = await import('playwright'); } catch { pw = await import('playwright-core'); }
const b = await pw.chromium.launch({ args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader'] }); await b.close(); console.log('ok');
JS
if node _probe.mjs >/dev/null 2>&1; then echo "Chromium: Playwright ok"; rm -f .chrome
else
  ( npx --yes playwright install chromium >/dev/null 2>&1 && node _probe.mjs >/dev/null 2>&1 && echo "Chromium: baixado pelo Playwright" ) || {
    npm i --silent --no-audit --no-fund @sparticuz/chromium@131 >/dev/null 2>&1
    node -e "import('@sparticuz/chromium').then(async c=>{require('fs').writeFileSync('.chrome', await c.default.executablePath()); console.log('Chromium: @sparticuz/chromium')})"
  }
fi
rm -f _probe.mjs
echo "pronto: $P"
echo "depois de editar web/roman.js rode: cat web/toonbase.js web/roman.js > web/toon.js"
