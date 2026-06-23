#!/usr/bin/env bash
set -euo pipefail

# ── SplitStellar Contract Deployment Script ──────────────
# Usage: ./scripts/deploy.sh [network]
#   network: testnet (default) | mainnet

NETWORK="${1:-testnet}"
IDENTITY="splitstellar-deployer"
CONTRACT_DIR="contracts/expense-pool"
ENV_FILE="frontend/.env"

echo "==> Building contract..."
cd "$CONTRACT_DIR"
stellar contract build
cd ../..

echo "==> Deploying to $NETWORK..."
WASM_PATH="$CONTRACT_DIR/target/wasm32v1-none/release/expense_pool.wasm"

if [ ! -f "$WASM_PATH" ]; then
  echo "ERROR: Wasm not found at $WASM_PATH. Build may have failed."
  exit 1
fi

CONTRACT_ID=$(stellar contract deploy \
  --source "$IDENTITY" \
  --network "$NETWORK" \
  --wasm "$WASM_PATH"
)

echo "==> Contract deployed!"
echo "    Network:    $NETWORK"
echo "    Contract:   $CONTRACT_ID"
echo ""

# Update frontend .env
if [ -f "$ENV_FILE" ]; then
  if grep -q "^VITE_SOROBAN_CONTRACT_ID=" "$ENV_FILE" 2>/dev/null; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' "s/^VITE_SOROBAN_CONTRACT_ID=.*/VITE_SOROBAN_CONTRACT_ID=$CONTRACT_ID/" "$ENV_FILE"
    else
      sed -i "s/^VITE_SOROBAN_CONTRACT_ID=.*/VITE_SOROBAN_CONTRACT_ID=$CONTRACT_ID/" "$ENV_FILE"
    fi
  else
    echo "VITE_SOROBAN_CONTRACT_ID=$CONTRACT_ID" >> "$ENV_FILE"
  fi
  echo "    Updated:    $ENV_FILE with VITE_SOROBAN_CONTRACT_ID=$CONTRACT_ID"
else
  echo "    WARNING: $ENV_FILE not found. Create it with:"
  echo "      echo 'VITE_SOROBAN_CONTRACT_ID=$CONTRACT_ID' > $ENV_FILE"
fi
