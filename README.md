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
2. Enter these contract addresses:
   - **SignatureClause**: `0xc53D0B67870304550172E9b9A9319A5bCbB7E534`
   - **AgreementFactory**: `0x6dCcE19Be252b4c7652f30126FE7011A53FbD22D`
3. Connect MetaMask to **Avalanche Fuji** testnet (Chain ID: 43113)

### Adding Fuji to MetaMask

If you don't have Fuji configured:
- Network Name: `Avalanche Fuji C-Chain`
- RPC URL: `https://api.avax-test.network/ext/bc/C/rpc`
- Chain ID: `43113`
- Symbol: `AVAX`
- Explorer: `https://testnet.snowtrace.io`

### Getting Test AVAX

Get free testnet AVAX from the faucet: https://faucet.avax.network/

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

---

## Usage Guide

### Step 1: Configure Contracts

1. Open the app at http://localhost:5173
2. Click the **gear icon** in the top-right corner
3. Paste these addresses:
   - SignatureClause: `0xc53D0B67870304550172E9b9A9319A5bCbB7E534`
   - AgreementFactory: `0x6dCcE19Be252b4c7652f30126FE7011A53FbD22D`
4. Click **Save**

### Step 2: Connect Wallet

1. Click **Connect Wallet**
2. MetaMask will prompt you to connect
3. If you see "Wrong Network", switch to Avalanche Fuji in MetaMask

### Step 3: Create a Signature Request

1. Click the **Create** tab
2. Enter a title for your document/agreement
3. Add signer addresses (paste wallet addresses, one per line)
4. Click **Create Request**
5. MetaMask will ask you to confirm the transaction
6. Wait for confirmation (~2 seconds on Fuji)

### Step 4: Sign a Request

1. Click the **Inbox** tab to see pending requests
2. Click on a request where you're listed as a signer
3. Click **Sign**
4. MetaMask will show a signature request (not a transaction)
5. Click **Sign** in MetaMask
6. The app will submit your signature to the blockchain

### Step 5: View All Agreements (Admin)

1. Click the **Admin** tab
2. See all agreements created through the factory
3. View status, signers, and completion state
