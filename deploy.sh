#!/bin/bash

# Configurações do servidor
SERVER_IP="187.127.12.245"
SERVER_USER="root"
FRONTEND_DEST="/var/www/atendente"
BACKEND_DEST="/var/www/atendente-server"

echo "=== 1. Compilando o Frontend localmente (atendente) ==="
# Configura o endpoint do Controle Total API para banco/auth compartilhado e a API do Atendente
export VITE_API_URL="https://atendente.controletotal.app"
export VITE_API_BASE_URL="https://atendente.controletotal.app/api"
npm run build

echo "=== 2. Criando diretórios no servidor VPS ==="
ssh ${SERVER_USER}@${SERVER_IP} "mkdir -p ${FRONTEND_DEST} ${BACKEND_DEST}"

echo "=== 3. Enviando Frontend (arquivos estáticos) ==="
rsync -avz --delete dist/ ${SERVER_USER}@${SERVER_IP}:${FRONTEND_DEST}/

echo "=== 4. Enviando Backend (código Express + TS) ==="
rsync -avz --exclude 'node_modules' --exclude '.env' --exclude '.env.production' --exclude 'dist' server/ ${SERVER_USER}@${SERVER_IP}:${BACKEND_DEST}/

echo "=== 5. Instalando dependências e configurando ambiente ==="
ssh ${SERVER_USER}@${SERVER_IP} "
  cd ${BACKEND_DEST}
  
  # Instalar dependências
  npm install

  # Compilar o código TypeScript
  npm run build

  # Decriptar .env do arquivo criptografado (se existir)
  if [ -f .env.encrypted ]; then
    echo 'Decriptando .env.encrypted...'
    SOPS_AGE_KEY_FILE=/etc/atendente/age-key.txt sops --decrypt --input-type dotenv --output-type dotenv .env.encrypted > .env
    chmod 600 .env
    echo '.env gerado com segredos criptografados.'
  elif [ ! -f .env ]; then
    # Fallback: avisa que não tem .env
    echo '⚠️ ATENÇÃO: Nenhum .env encontrado! Crie /etc/atendente/.env ou corrija o deploy.'
    exit 1
  fi

  # Iniciar ou reiniciar o servidor usando PM2
  pm2 describe atendente-api &> /dev/null
  if [ \$? -eq 0 ]; then
    echo 'Reiniciando processo PM2 existente...'
    pm2 restart atendente-api
  else
    echo 'Iniciando novo processo PM2...'
    pm2 start dist/index.js --name 'atendente-api' --cwd ${BACKEND_DEST}
  fi

  pm2 save --force
"

echo "=== 6. Aplicando configuração do Nginx no VPS ==="
NGINX_CONF="/etc/nginx/sites-available/atendente"
ssh ${SERVER_USER}@${SERVER_IP} "
  # Escreve arquivo de configuração do Nginx para atendente
  cat << 'EOF' > ${NGINX_CONF}
server {
    listen 80;
    server_name atendente.controletotal.app;

    root ${FRONTEND_DEST};
    index index.html;

    # Frontend (React SPA)
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Proxy Reverso para a API Express do Atendente (porta 5003)
    location /api {
        proxy_pass http://localhost:5003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

  # Ativar site se não estiver ativado
  if [ ! -f /etc/nginx/sites-enabled/atendente ]; then
    ln -s ${NGINX_CONF} /etc/nginx/sites-enabled/
  fi

  # Testar e recarregar o Nginx
  nginx -t && systemctl reload nginx
"

echo "=== Deploy de atendente concluído com sucesso! ==="
