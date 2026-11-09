#!/usr/bin/env bash
DIR="/home/edu/Projects/mptreco/daemon"
export PATH="$DIR/.venv/bin:$PATH"
export MPTRECO_ADMIN_TOKEN="a8ead6af9a2e9d762a087839b245b246ef2da951889a9912"
GIST_ID="32466da6692cf6e85f1ae35fc410189d"

# Matar instâncias antigas se houver
pkill -f "python3.*server.py" 2>/dev/null || true
pkill -f "cloudflared.*7777" 2>/dev/null || true

# Iniciar servidor Python em background na porta 7777
python3 "$DIR/server.py" > "$DIR/server.log" 2>&1 &
SERVER_PID=$!

sleep 2

# Iniciar túnel Cloudflare para a porta 7777
/home/edu/.local/bin/cloudflared tunnel --url http://127.0.0.1:7777 > "$DIR/tunnel.log" 2>&1 &
TUNNEL_PID=$!

echo "mptreco daemon iniciado: server_pid=$SERVER_PID tunnel_pid=$TUNNEL_PID"

# Monitorar a URL do túnel e sincronizar automaticamente com o Gist
for i in {1..30}; do
  TUNNEL_URL=$(grep -o 'https://.*\.trycloudflare\.com' "$DIR/tunnel.log" | tail -n 1)
  if [ -n "$TUNNEL_URL" ]; then
    echo "$TUNNEL_URL" > "$DIR/current_tunnel_url.txt"
    echo "Túnel ativo em: $TUNNEL_URL"
    # Atualizar o Gist via GitHub CLI para a Vercel saber o endereço sem intervenção manual
    gh gist edit "$GIST_ID" -a "$DIR/current_tunnel_url.txt" >/dev/null 2>&1 || true
    break
  fi
  sleep 1
done

wait $SERVER_PID $TUNNEL_PID
