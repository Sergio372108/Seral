#!/bin/bash

echo "Iniciando Mensajería Privada..."
echo "================================"

# Iniciar el servidor backend en segundo plano
echo "🚀 Iniciando servidor backend..."
node server/index.js &
SERVER_PID=$!

# Esperar a que el servidor inicie
sleep 2

# Iniciar el frontend
echo "🌐 Iniciando frontend..."
npm run dev

# Cuando se cierre el frontend, matar el servidor
trap "kill $SERVER_PID 2>/dev/null; exit" INT TERM EXIT
