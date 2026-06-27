#!/bin/bash
# ─── deploy-pi.sh — Deploy dos 3 produtos para Raspberry Pi ────────────────
# Uso: ./deploy-pi.sh                    # deploy dos 3
#      ./deploy-pi.sh atendente          # só um
#      ./deploy-pi.sh vitrine
#      ./deploy-pi.sh controletotal
# ============================================================================

set -e

PI_USER="pi"
PI_HOST="10.0.1.10"
PI_SSH="${PI_USER}@${PI_HOST}"
DOMAIN="controle.local"

# Pastas no Pi
DEST_ATD_FRONT="/var/www/atendente"
DEST_ATD_API="/var/www/atendente-server"
DEST_VIT_FRONT="/var/www/vitrine"
DEST_VIT_API="/var/www/vitrine-server"
DEST_CT_FRONT="/var/www/controletotal"
DEST_CT_API="/var/www/controletotal-server"

# ─── Detectar produtos ────────────────────────────────────────────────────
DEPLOY_ATD=false; DEPLOY_VIT=false; DEPLOY_CT=false
case "$1" in
  atendente)     DEPLOY_ATD=true ;;
  vitrine)       DEPLOY_VIT=true ;;
  controletotal) DEPLOY_CT=true ;;
  *)             DEPLOY_ATD=true; DEPLOY_VIT=true; DEPLOY_CT=true ;;
esac

echo "🚀 Deploy para Raspberry Pi ($PI_HOST)"
echo "========================================"

# ─── Cria pastas no Pi ─────────────────────────────────────────────────────
echo "📁 Criando diretórios..."
ssh ${PI_SSH} "sudo mkdir -p ${DEST_ATD_FRONT} ${DEST_VIT_FRONT} ${DEST_CT_FRONT} \
  ${DEST_ATD_API} ${DEST_VIT_API} ${DEST_CT_API}"

# ─── 1. Nginx ───────────────────────────────────────────────────────────────
setup_nginx() {
  echo "🌐 Configurando Nginx..."
  ssh ${PI_SSH} "sudo mkdir -p /etc/nginx/snippets"

  ssh ${PI_SSH} "sudo tee /etc/nginx/snippets/spa-cache.conf > /dev/null" << 'SNIP'
location /index.html {
    add_header Cache-Control 'no-cache, no-store, must-revalidate';
    add_header Pragma 'no-cache';
    add_header Expires '0';
}
location /assets/ {
    add_header Cache-Control 'no-cache, no-store, must-revalidate';
}
location /icons/ {
    add_header Cache-Control 'no-cache, no-store, must-revalidate';
}
SNIP

  ssh ${PI_SSH} "sudo tee /etc/nginx/sites-available/atendente > /dev/null" << NGX
server {
    listen 80 default_server;
    server_name _;

    root $DEST_ATD_FRONT;
    include /etc/nginx/snippets/spa-cache.conf;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }
    location /api/ {
        proxy_pass http://localhost:5003/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
    location /webhook {
        proxy_pass http://localhost:5003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGX

  ssh ${PI_SSH} "sudo tee /etc/nginx/sites-available/vitrine > /dev/null" << NGX
server {
    listen 8082;
    server_name _;

    root $DEST_VIT_FRONT;
    index index.html;

    location / {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        try_files \$uri \$uri/ /index.html;
    }
    location /api {
        proxy_pass http://localhost:5002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGX

  ssh ${PI_SSH} "sudo tee /etc/nginx/sites-available/controletotal > /dev/null" << NGX
server {
    listen 8083;
    server_name _;

    root $DEST_CT_FRONT;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGX

  ssh ${PI_SSH} "
    sudo ln -sf /etc/nginx/sites-available/atendente /etc/nginx/sites-enabled/
    sudo ln -sf /etc/nginx/sites-available/vitrine /etc/nginx/sites-enabled/
    sudo ln -sf /etc/nginx/sites-available/controletotal /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl reload nginx
  "
  echo "✅ Nginx OK"
}

# ─── 2. Atendente ──────────────────────────────────────────────────────────
deploy_atendente() {
  echo "═══════ Atendente ═══════"
  cd /Users/joel/Projetos/atendente

  export VITE_API_URL="http://${PI_HOST}:5003"
  export VITE_API_BASE_URL="http://${PI_HOST}:5003/api"
  npm run build

  rsync -avz --delete dist/ ${PI_SSH}:${DEST_ATD_FRONT}/

  cd server
  npm run build
  rsync -avz --delete dist/ ${PI_SSH}:${DEST_ATD_API}/dist/
  rsync -avz package.json ${PI_SSH}:${DEST_ATD_API}/
  [ -f .env ] && rsync -avz .env ${PI_SSH}:${DEST_ATD_API}/.env

  ssh ${PI_SSH} "
    cd ${DEST_ATD_API}
    npm install --production --legacy-peer-deps 2>/dev/null
    pm2 describe atendente-api &>/dev/null \
      && pm2 restart atendente-api \
      || pm2 start dist/index.js --name atendente-api --cwd ${DEST_ATD_API}
    pm2 save
  "
  cd /Users/joel/Projetos/atendente
  echo "✅ Atendente OK"
}

# ─── 3. Vitrine ────────────────────────────────────────────────────────────
deploy_vitrine() {
  echo "═══════ Vitrine ═══════"
  cd /Users/joel/Projetos/vitrine

  export VITE_API_URL="http://${PI_HOST}:5002"
  npm run build

  rsync -avz --delete dist/ ${PI_SSH}:${DEST_VIT_FRONT}/
  rsync -avz --delete server/ ${PI_SSH}:${DEST_VIT_API}/ --exclude node_modules --exclude uploads
  [ -f .env ] && rsync -avz .env ${PI_SSH}:${DEST_VIT_API}/.env

  ssh ${PI_SSH} "
    cd ${DEST_VIT_API}
    PUPPETEER_SKIP_DOWNLOAD=true npm install --legacy-peer-deps 2>/dev/null
    pm2 describe vitrine-api &>/dev/null \
      && pm2 restart vitrine-api \
      || pm2 start index.js --name vitrine-api --cwd ${DEST_VIT_API}
    pm2 save
  "
  echo "✅ Vitrine OK"
}

# ─── 4. Controle Total ────────────────────────────────────────────────────
deploy_ct() {
  echo "═══════ Controle Total ═══════"
  cd /Users/joel/Projetos/controletotal

  npm run build
  rsync -avz --delete dist/ ${PI_SSH}:${DEST_CT_FRONT}/

  if [ -d server ]; then
    rsync -avz --delete server/ ${PI_SSH}:${DEST_CT_API}/ --exclude node_modules --exclude uploads
    [ -f .env ] && sudo rsync -avz .env ${PI_SSH}:${DEST_CT_API}/.env
    ssh ${PI_SSH} "
      cd ${DEST_CT_API}
      [ -f package.json ] && npm install --production 2>/dev/null
      pm2 describe controle-total-api &>/dev/null \
        && pm2 restart controle-total-api \
        || pm2 start index.js --name controle-total-api --cwd ${DEST_CT_API}
      pm2 save
    "
  fi
  echo "✅ Controle Total OK"
}

# ─── Executar ──────────────────────────────────────────────────────────────
# Descomentar na primeira execução:
# setup_nginx

[ "$DEPLOY_ATD" = true ] && deploy_atendente
[ "$DEPLOY_VIT" = true ] && deploy_vitrine
[ "$DEPLOY_CT"  = true ] && deploy_ct

echo ""
echo "========================================"
echo "🎉 Deploy concluído!"
echo ""
echo "Acesse:"
echo "  http://${PI_HOST}           → Atendente"
echo "  http://${PI_HOST}:8082      → Vitrine"
echo "  http://${PI_HOST}:8083      → Controle Total"
echo ""
echo "========================================"
