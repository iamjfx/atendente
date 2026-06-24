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
rsync -avz --exclude 'node_modules' --exclude '.env' --exclude 'dist' server/ ${SERVER_USER}@${SERVER_IP}:${BACKEND_DEST}/

echo "=== 5. Instalando dependências e iniciando a API no VPS ==="
ssh ${SERVER_USER}@${SERVER_IP} "
  cd ${BACKEND_DEST}
  
  # Instalar dependências (incluindo pg e tsx para TypeScript)
  npm install

  # Compilar o código TypeScript do backend se houver script de build
  npm run build

  # Criar .env básico para o backend atendente se não existir
  if [ ! -f .env ]; then
    echo 'Criando .env padrão do banco local...'
    echo 'PORT=5003' > .env
    echo 'DB_USER=postgres' >> .env
    echo 'DB_HOST=localhost' >> .env
    echo 'DB_NAME=controletotal' >> .env
    echo 'DB_PASSWORD=Wukhoh-miqxim-simhu6' >> .env
    echo 'DB_PORT=5432' >> .env
    echo 'EVOLUTION_API_URL=http://localhost:8080' >> .env
    echo 'EVOLUTION_API_KEY=sua_chave_evolution' >> .env
    echo 'GEMINI_API_KEY=sua_chave_gemini' >> .env
    echo 'WEBHOOK_BASE_URL=http://${SERVER_IP}:5003' >> .env
  fi

  # Iniciar ou reiniciar o servidor usando PM2
  pm2 describe atendente-api &> /dev/null
  if [ \$? -eq 0 ]; then
    echo 'Reiniciando processo PM2 existente...'
    pm2 restart atendente-api
  else
    echo 'Iniciando novo processo PM2...'
    # Como o backend é em TS, rodamos a build em js
    pm2 start dist/index.js --name 'atendente-api'
  fi

  pm2 save
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
