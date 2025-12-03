# Papre Signing Demo

A standalone demo of the Papre v2 signing flow built with React, wagmi, and viem.

## Features

- Create signature requests with multiple signers
- Sign using MetaMask (EIP-191 personal_sign)
- Real-time status tracking
- Admin view for agreement management
- Configurable contract addresses

## Quick Start

```bash
# Clone the repo
git clone https://github.com/papre-demo-2/papre-demo-signing.git
cd papre-demo-signing

# Install dependencies
npm install

# Run the dev server
npm run dev
```

Then open **http://localhost:5173**

## First-Time Setup

1. Click the **gear icon** (Settings) in the header
2. Enter the contract addresses (get these from the team)
3. Connect MetaMask to **Avalanche Fuji** testnet

## Documentation

See [FRONTEND-INTEGRATION.md](./FRONTEND-INTEGRATION.md) for:
- How the signing flow works
- Contract interaction patterns
- ABI reference

## Tech Stack

- React 18 + TypeScript
- Vite
- wagmi v2 + viem
- Tailwind CSS
- Framer Motion
- Zustand (state management)
