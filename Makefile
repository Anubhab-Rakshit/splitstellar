.PHONY: build-contract build-frontend test-contract test-frontend test deploy dev setup clean

# ── Contract ──────────────────────────────────────────────
build-contract:
	cd contracts/expense-pool && soroban contract build

test-contract:
	cd contracts/expense-pool && cargo test

# ── Frontend ──────────────────────────────────────────────
build-frontend:
	cd frontend && npx vite build

dev:
	cd frontend && npx vite

# ── Tests ─────────────────────────────────────────────────
test: test-contract test-frontend

test-frontend:
	cd frontend && npx vitest run

# ── Deploy ────────────────────────────────────────────────
deploy: deploy-testnet

deploy-testnet:
	./scripts/deploy.sh testnet

# ── Setup ─────────────────────────────────────────────────
setup:
	cp -n .env.example frontend/.env 2>/dev/null || true
	cd contracts/expense-pool && cargo build
	cd frontend && npm install

# ── Clean ─────────────────────────────────────────────────
clean:
	cd contracts/expense-pool && cargo clean
	rm -rf frontend/dist frontend/node_modules
