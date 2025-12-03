# SignatureClause Frontend Integration Guide

**What it does:** Collect cryptographic signatures from multiple wallets on-chain.

**How it works:**
1. Create a signing request with a list of wallet addresses
2. Each wallet signs and submits their signature
3. Contract tracks who signed and marks complete when all have signed

**Frontend talks to ONE contract** (the Agreement) using TWO functions:
- `executePort()` — write (create request, submit signature)
- `queryPort()` — read (check status, get signers)

**That's it.** The contract handles all cryptographic verification.

---

# Overview

## The Architecture

```
┌─────────────────┐         ┌─────────────────┐
│    Frontend     │ ──────▶ │    Agreement    │
│   (React App)   │         │   (Deployed)    │
└─────────────────┘         └────────┬────────┘
                                     │
                                     │ delegates to
                                     ▼
                            ┌─────────────────┐
                            │ SignatureClause │
                            │    (Logic)      │
                            └─────────────────┘
```

The frontend only talks to the **Agreement** contract. The Agreement routes calls to the **SignatureClause** which does the actual work.

## Key Concepts

| Concept       | What It Is                                                   |
|---------------|--------------------------------------------------------------|
| **Agreement** | The deployed contract you interact with                      |
| **Clause**    | Logic that handles signatures (you don't call directly)      |
| **Port**      | A named entry point (like "init", "sign", "status")          |
| **Instance**  | A single signing request (has ID, signers, completion status)|
| **Context**   | Metadata passed with each call (mostly ignored in demo)      |

## The 5 Operations

| # | Operation       | Port Name                 | What It Does                                     |
|---|-----------------|---------------------------|--------------------------------------------------|
| 1 | **Create**      | `port.init`               | Start a new signing request with list of signers |
| 2 | **Sign**        | `port.sign`               | Submit your cryptographic signature              |
| 3 | **Status**      | `port.status`             | Check if complete, how many signed               |
| 4 | **Get Signers** | `port.getRequiredSigners` | List all required signer addresses               |
| 5 | **Has Signed**  | `port.hasSigned`          | Check if specific address signed                 |

## Signing Flow

```
1. Creator calls INIT with [alice, bob, carol]
   └─▶ Returns instanceId = 0

2. Alice signs:
   a) Wallet signs message: hash(instanceId, alice)
   b) Submit to SIGN port with signature
   └─▶ Contract verifies & records

3. Bob signs (same process)
   └─▶ Contract verifies & records

4. Carol signs (same process)
   └─▶ Contract marks COMPLETED (3/3 signed)

5. Anyone can query STATUS to see completion
```

## What the Frontend Stores

| Data               | Where        | Why                           |
|--------------------|--------------|-------------------------------|
| Contract addresses | localStorage | User configures once          |
| Instance titles    | localStorage | Contract doesn't store titles |
| Everything else    | On-chain     | Signers, status, completion   |

---

# Detailed Reference

Everything below is the full technical reference with code examples.

---

## Part 1: SignatureClause Contract Interface

### What You Need

1. **Agreement Address** - The deployed agreement contract (stored in localStorage as `papre-demo-agreement`)
2. **SignatureClause Address** - The clause logic contract (stored as `papre-signature-clause`)

### Two Contract Functions

All interaction goes through two functions on the Agreement contract:

| Function                            | Purpose                           | Gas Cost |
|-------------------------------------|-----------------------------------|----------|
| `executePort(ctx, portId, payload)` | Write operations (create, sign)   | Yes      |
| `queryPort(ctx, portId, payload)`   | Read operations (status, signers) | No       |

### Port IDs

Ports are identified by `keccak256` hashes of their names:

```typescript
import { keccak256, toBytes } from 'viem'

const PORT_IDS = {
  INIT: keccak256(toBytes('port.init')),              // Create new instance
  SIGN: keccak256(toBytes('port.sign')),              // Submit signature
  STATUS: keccak256(toBytes('port.status')),          // Get instance status
  GET_REQUIRED_SIGNERS: keccak256(toBytes('port.getRequiredSigners')),
  HAS_SIGNED: keccak256(toBytes('port.hasSigned')),
}
```

### Context Object (the `ctx` parameter)

In the function signatures above: `executePort(ctx, portId, payload)`, `ctx` is a **PapreContext** struct — metadata that gets passed with every call.

**In this demo, context is mostly ignored.** The clause uses `instanceId` (from the payload) to look up data, not the context. But you still need to pass a valid struct. In the full v2, the context isolates data by agreement and purpose — so the same SignatureClause can serve multiple agreements without their data colliding.

```typescript
interface PapreContext {
  agreement: Address      // The agreement contract address
  purpose: `0x${string}`  // bytes32 - just use keccak256('demo.signing')
  refHash: `0x${string}`  // bytes32 - not used, pass any value
  salt: `0x${string}`     // bytes32 - not used, pass any value
}
```
---

## Operations

### 1. Create a Signing Request

**Port:** `INIT`
**Method:** `executePort`

**Payload:** ABI-encoded array of signer addresses
```typescript
const payload = encodeAbiParameters(
  [{ type: 'address[]' }],
  [['0x123...', '0x456...']]  // Array of required signers
)
```

**Returns:** The new `instanceId` (uint256)

**What happens:** Creates a new signing instance. Returns an auto-incrementing ID starting from 0.

---

### 2. Sign an Instance

**Port:** `SIGN`
**Method:** `executePort`

**Two steps:**

**Step 1 - Get the message to sign:**
```typescript
// The message hash the wallet needs to sign
const messageHash = keccak256(
  encodeAbiParameters(
    [{ type: 'uint256' }, { type: 'address' }],
    [instanceId, signerAddress]
  )
)

// Request signature from wallet (adds EIP-191 prefix automatically)
const signature = await walletClient.signMessage({
  message: { raw: messageHash }
})
```

**Step 2 - Submit to contract:**
```typescript
const payload = encodeAbiParameters(
  [
    { type: 'uint256' },  // instanceId
    { type: 'address' },  // signer
    { type: 'uint8' },    // scheme (0 = EIP191)
    { type: 'bytes' },    // signature
  ],
  [instanceId, signerAddress, 0, signature]
)

await walletClient.writeContract({
  address: agreementAddress,
  abi: AGREEMENT_CORE_ABI,
  functionName: 'executePort',
  args: [ctx, PORT_IDS.SIGN, payload],
})
```

**Signature Schemes:**

| Value | Name   | Use                                    |
|-------|--------|----------------------------------------|
| 0     | EIP191 | Standard wallet signature (use this)   |
| 1     | EIP712 | Typed data (not implemented in demo)   |

---

### 3. Query Instance Status

**Port:** `STATUS`
**Method:** `queryPort`

**Payload:**
```typescript
const payload = encodeAbiParameters(
  [{ type: 'uint256' }],
  [instanceId]
)
```

**Returns:** ABI-encoded tuple
```typescript
const [initialized, signedCount, requiredCount, completed] = decodeAbiParameters(
  [
    { type: 'bool' },     // initialized - true if instance exists
    { type: 'uint256' },  // signedCount - how many have signed
    { type: 'uint256' },  // requiredCount - total required
    { type: 'bool' },     // completed - true if all signed
  ],
  result
)
```

---

### 4. Get Required Signers

**Port:** `GET_REQUIRED_SIGNERS`
**Method:** `queryPort`

**Payload:**
```typescript
const payload = encodeAbiParameters(
  [{ type: 'uint256' }],
  [instanceId]
)
```

**Returns:**
```typescript
const [signers] = decodeAbiParameters(
  [{ type: 'address[]' }],
  result
)
// signers = ['0x123...', '0x456...']
```

---

### 5. Check if Address Has Signed

**Port:** `HAS_SIGNED`
**Method:** `queryPort`

**Payload:**
```typescript
const payload = encodeAbiParameters(
  [{ type: 'uint256' }, { type: 'address' }],
  [instanceId, addressToCheck]
)
```

**Returns:**
```typescript
const [hasSigned] = decodeAbiParameters(
  [{ type: 'bool' }],
  result
)
```

---

### Direct Clause Queries (Alternative)

You can also query the SignatureClause contract directly for some data:

```typescript
// Get total instance count
const count = await publicClient.readContract({
  address: signatureClauseAddress,
  abi: SIGNATURE_CLAUSE_ABI,
  functionName: 'getInstanceCount',
})

// Get full instance data
const instance = await publicClient.readContract({
  address: signatureClauseAddress,
  abi: SIGNATURE_CLAUSE_ABI,
  functionName: 'getInstance',
  args: [instanceId],
})
// Returns: { initialized, completed, initializer, signatureCount, agreement, purpose, refHash, salt }
```

---

## ABI Reference

### Agreement Core ABI (minimal)

```typescript
const AGREEMENT_CORE_ABI = [
  {
    name: 'executePort',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'ctx', type: 'tuple', components: [
        { name: 'agreement', type: 'address' },
        { name: 'purpose', type: 'bytes32' },
        { name: 'refHash', type: 'bytes32' },
        { name: 'salt', type: 'bytes32' },
      ]},
      { name: 'portId', type: 'bytes32' },
      { name: 'payload', type: 'bytes' },
    ],
    outputs: [{ type: 'bytes' }],
  },
  {
    name: 'queryPort',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'ctx', type: 'tuple', components: [
        { name: 'agreement', type: 'address' },
        { name: 'purpose', type: 'bytes32' },
        { name: 'refHash', type: 'bytes32' },
        { name: 'salt', type: 'bytes32' },
      ]},
      { name: 'portId', type: 'bytes32' },
      { name: 'payload', type: 'bytes' },
    ],
    outputs: [{ type: 'bytes' }],
  },
]
```

### SignatureClause ABI (for direct queries)

```typescript
const SIGNATURE_CLAUSE_ABI = [
  {
    name: 'getInstanceCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'getInstance',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'instanceId', type: 'uint256' }],
    outputs: [{
      type: 'tuple',
      components: [
        { name: 'initialized', type: 'bool' },
        { name: 'completed', type: 'bool' },
        { name: 'initializer', type: 'address' },
        { name: 'signatureCount', type: 'uint256' },
        { name: 'agreement', type: 'address' },
        { name: 'purpose', type: 'bytes32' },
        { name: 'refHash', type: 'bytes32' },
        { name: 'salt', type: 'bytes32' },
      ],
    }],
  },
  {
    name: 'getRequiredSigners',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'instanceId', type: 'uint256' }],
    outputs: [{ type: 'address[]' }],
  },
  {
    name: 'hasSigned',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'instanceId', type: 'uint256' },
      { name: 'signer', type: 'address' },
    ],
    outputs: [{ type: 'bool' }],
  },
]
```

---

## Events (for indexing/notifications)

```typescript
// Emitted when a new signing instance is created
event InstanceCreated(
  uint256 indexed instanceId,
  address indexed initializer,
  address agreement,
  bytes32 purpose,
  bytes32 refHash,
  bytes32 salt,
  address[] signers
)

// Emitted when someone signs
event Signed(
  uint256 indexed instanceId,
  address indexed signer,
  uint8 scheme,
  uint256 signedCount,
  uint256 requiredCount
)
```

---

## Quick Reference

| Operation    | Port                      | Method      | Payload                          |
|--------------|---------------------------|-------------|----------------------------------|
| Create       | `port.init`               | executePort | `address[]` signers              |
| Sign         | `port.sign`               | executePort | `uint256, address, uint8, bytes` |
| Get Status   | `port.status`             | queryPort   | `uint256` instanceId             |
| Get Signers  | `port.getRequiredSigners` | queryPort   | `uint256` instanceId             |
| Check Signed | `port.hasSigned`          | queryPort   | `uint256, address`               |

---

---

# Part 2: Demo Frontend Architecture

## Tech Stack

| Layer          | Tool                       | Purpose                    |
|----------------|----------------------------|----------------------------|
| Framework      | React 18                   | UI components              |
| Build          | Vite                       | Fast dev server, HMR       |
| Styling        | Tailwind CSS               | Utility classes            |
| Animation      | Framer Motion              | Smooth transitions         |
| Web3           | wagmi v2                   | React hooks for Ethereum   |
| Low-level Web3 | viem                       | ABI encoding, contract calls|
| State          | React hooks + localStorage | Simple state management    |
| Notifications  | sonner                     | Toast messages             |

## Project Structure

```
src/
├── components/
│   ├── layout/          # Header, Layout wrapper
│   ├── wallet/          # ConnectWallet, WrongNetwork
│   ├── views/           # Main views (Inbox, Create, Admin)
│   ├── inbox/           # SignatureCard component
│   ├── create/          # SignerInput component
│   ├── settings/        # SettingsModal for contract config
│   └── ui/              # Button, Card, Input, Modal
├── hooks/
│   ├── useContractAddresses.ts  # Load/save contract addresses
│   ├── useInstances.ts          # Fetch user's signing instances
│   ├── useAllInstances.ts       # Fetch all instances (admin)
│   ├── useCreateRequest.ts      # Create new signing request
│   ├── useSign.ts               # Sign an instance
│   └── useTheme.ts              # Dark/light mode
├── lib/
│   ├── wagmi.ts         # Wagmi config (chains, connectors)
│   ├── chains.ts        # Chain definitions (Fuji, localhost)
│   ├── utils.ts         # Helpers (encoding, port IDs)
│   └── contracts/
│       └── abis.ts      # Contract ABIs
└── App.tsx              # Main app with view routing
```

## Application Flow

```
┌─────────────────────────────────────────────────────────────┐
│                         App.tsx                             │
├─────────────────────────────────────────────────────────────┤
│  1. Check wallet connection (wagmi useAccount)              │
│     └─ Not connected? → Show ConnectWallet                  │
│                                                             │
│  2. Check network (wagmi useChainId)                        │
│     └─ Wrong network? → Show WrongNetwork                   │
│                                                             │
│  3. Check contract config (useContractAddresses)            │
│     └─ Not configured? → Show "Configure Contracts" prompt  │
│                                                             │
│  4. Main App                                                │
│     ├─ ViewToggle (Inbox / Create / Admin)                  │
│     ├─ InboxView → useInstances → SignatureCards            │
│     ├─ CreateView → useCreateRequest                        │
│     └─ AdminView → useAllInstances                          │
└─────────────────────────────────────────────────────────────┘
```

## Key Hooks

### `useContractAddresses`
- Reads/writes contract addresses from localStorage
- Returns `{ demoAgreement, signatureClause, isConfigured, setAddresses }`

### `useInstances(address)`
- Fetches all signing instances where the connected user is a signer
- Iterates through all instances, filters by user
- Returns `{ instances, isLoading, refetch }`

### `useAllInstances()`
- Fetches ALL signing instances (for admin view)
- Returns `{ instances, isLoading, refetch }`

### `useCreateRequest()`
- Creates a new signing instance
- Calls `executePort` with `INIT` port
- Returns `{ createRequest, isCreating, error }`

### `useSign()`
- Signs an instance
- Two-step: get wallet signature, then submit to contract
- Returns `{ sign, isSigning, signingInstanceId, error }`

### `useTheme()`
- Toggles dark/light mode
- Persists to localStorage
- Applies `.dark` class to document root

## Data Flow: Creating a Request

```
User clicks "Create Request"
         │
         ▼
    CreateView
         │
         ├─ Validate inputs (title, signers)
         │
         ▼
    useCreateRequest.createRequest(title, signers)
         │
         ├─ Encode signers as payload
         ├─ Call simulateContract (dry run)
         ├─ Call writeContract (MetaMask popup)
         ├─ Wait for transaction receipt
         ├─ Query to find new instanceId
         ├─ Store title in localStorage
         │
         ▼
    Return instanceId → Switch to Inbox view
```

## Data Flow: Signing

```
User clicks "Sign" on a SignatureCard
         │
         ▼
    useSign.sign(instanceId)
         │
         ├─ Compute messageHash = keccak256(instanceId, signer)
         ├─ Call signMessage (MetaMask signature popup)
         ├─ Encode signature payload
         ├─ Call simulateContract
         ├─ Call writeContract (MetaMask tx popup)
         ├─ Wait for receipt
         │
         ▼
    Refetch instances → UI updates
```

## Contract Address Storage

Addresses are stored in localStorage with these keys:
- `papre-demo-agreement` - Agreement contract address
- `papre-signature-clause` - SignatureClause address (optional, for direct queries)

Users configure these via the Settings modal (gear icon in header).

## Styling System

Uses CSS variables for theming:

```css
/* In globals.css */
:root {
  --color-background: 250 250 250;  /* RGB values */
  --color-foreground: 10 10 10;
  --color-primary: 59 130 246;
  /* ... */
}

.dark {
  --color-background: 10 10 10;
  --color-foreground: 250 250 250;
  /* ... */
}
```

Tailwind config maps these to utility classes:
```javascript
colors: {
  background: 'rgb(var(--color-background) / <alpha-value>)',
  foreground: 'rgb(var(--color-foreground) / <alpha-value>)',
  // ...
}
```

Usage: `bg-background`, `text-foreground`, `border-border`, etc.

## Instance Titles

The contract doesn't store titles - they're stored locally:

```typescript
// In useInstances.ts
const TITLES_KEY = 'papre-instance-titles'

export function setInstanceTitle(instanceId: bigint, title: string) {
  const titles = JSON.parse(localStorage.getItem(TITLES_KEY) || '{}')
  titles[instanceId.toString()] = title
  localStorage.setItem(TITLES_KEY, JSON.stringify(titles))
}

export function getInstanceTitle(instanceId: bigint): string | undefined {
  const titles = JSON.parse(localStorage.getItem(TITLES_KEY) || '{}')
  return titles[instanceId.toString()]
}
```

## Supported Networks

Configured in `lib/chains.ts`:
- **Avalanche Fuji** (testnet) - Chain ID: 43113
- **Localhost** (Anvil) - Chain ID: 31337

---

## Running the Demo

```bash
cd packages/demo-signing
npm install
npm run dev
```

Then:
1. Connect MetaMask
2. Switch to Fuji or local Anvil
3. Click settings (gear icon) and enter contract addresses
4. Create signing requests or sign existing ones
