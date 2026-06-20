#!/bin/bash
cd /Users/joel/projetos/atendente
npx tsx server/src/index.ts &
echo $! > /tmp/atendente-backend.pid
echo "Backend PID: $!"
