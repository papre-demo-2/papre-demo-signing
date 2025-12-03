import { type Address, keccak256, toBytes, encodeAbiParameters, decodeAbiParameters } from 'viem'

/**
 * Truncate an address for display: 0x1234...abcd
 */
export function truncateAddress(address: Address, chars = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

/**
 * Truncate a hash/CID for display
 */
export function truncateHash(hash: string, chars = 6): string {
  if (hash.length <= chars * 2 + 3) return hash
  return `${hash.slice(0, chars)}...${hash.slice(-chars)}`
}

/**
 * Create port ID from name
 */
export function createPortId(name: string): `0x${string}` {
  return keccak256(toBytes(name))
}

// Standard port IDs
export const PORT_IDS = {
  INIT: createPortId('port.init'),
  SIGN: createPortId('port.sign'),
  STATUS: createPortId('port.status'),
  GET_REQUIRED_SIGNERS: createPortId('port.getRequiredSigners'),
  HAS_SIGNED: createPortId('port.hasSigned'),
} as const

/**
 * Create PapreContext struct
 */
export interface PapreContext {
  agreement: Address
  purpose: `0x${string}`
  refHash: `0x${string}`
  salt: `0x${string}`
}

// Demo uses a fixed purpose and generates refHash/salt from nonce
const DEMO_PURPOSE = keccak256(toBytes('demo.signing'))

/**
 * Create context for a demo instance using nonce as identifier
 */
export function createDemoContext(
  agreement: Address,
  nonce: bigint
): PapreContext {
  const nonceBytes = keccak256(toBytes(`demo-nonce-${nonce.toString()}`))
  return {
    agreement,
    purpose: DEMO_PURPOSE,
    refHash: nonceBytes,
    salt: nonceBytes,
  }
}

/**
 * Create context with explicit parameters
 */
export function createContext(
  agreement: Address,
  purpose: string,
  refHash: `0x${string}`,
  salt?: `0x${string}`
): PapreContext {
  return {
    agreement,
    purpose: keccak256(toBytes(purpose)),
    refHash,
    salt: salt ?? keccak256(toBytes(Date.now().toString() + Math.random().toString())),
  }
}

/**
 * Encode context tuple for contract calls
 */
export function encodeContext(ctx: PapreContext): `0x${string}` {
  return encodeAbiParameters(
    [
      { type: 'address', name: 'agreement' },
      { type: 'bytes32', name: 'purpose' },
      { type: 'bytes32', name: 'refHash' },
      { type: 'bytes32', name: 'salt' },
    ],
    [ctx.agreement, ctx.purpose, ctx.refHash, ctx.salt]
  )
}

/**
 * Encode signers array for initializeSigners payload
 */
export function encodeSignersPayload(signers: Address[]): `0x${string}` {
  return encodeAbiParameters(
    [{ type: 'address[]' }],
    [signers]
  )
}

/**
 * Encode sign payload
 */
export function encodeSignPayload(
  instanceId: bigint,
  signer: Address,
  scheme: number,
  signature: `0x${string}`
): `0x${string}` {
  return encodeAbiParameters(
    [
      { type: 'uint256' },
      { type: 'address' },
      { type: 'uint8' },
      { type: 'bytes' },
    ],
    [instanceId, signer, scheme, signature]
  )
}

/**
 * Encode instanceId for query payloads
 */
export function encodeInstanceIdPayload(instanceId: bigint): `0x${string}` {
  return encodeAbiParameters(
    [{ type: 'uint256' }],
    [instanceId]
  )
}

/**
 * Encode (instanceId, signer) for hasSignedPort queries
 */
export function encodeHasSignedPayload(instanceId: bigint, signer: Address): `0x${string}` {
  return encodeAbiParameters(
    [{ type: 'uint256' }, { type: 'address' }],
    [instanceId, signer]
  )
}

/**
 * Decode instanceId from initializeSigners result
 */
export function decodeInstanceId(data: `0x${string}`): bigint {
  const [instanceId] = decodeAbiParameters(
    [{ type: 'uint256' }],
    data
  )
  return instanceId
}

/**
 * Format date for display
 */
export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(timestamp))
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/**
 * Generate share URL for an instance
 */
export function generateShareUrl(instanceId: bigint): string {
  const baseUrl = window.location.origin + window.location.pathname
  return `${baseUrl}?instance=${instanceId.toString()}`
}

/**
 * Parse instance ID from URL
 */
export function getInstanceFromUrl(): bigint | null {
  const params = new URLSearchParams(window.location.search)
  const instanceParam = params.get('instance')
  if (!instanceParam) return null
  try {
    return BigInt(instanceParam)
  } catch {
    return null
  }
}

/**
 * Validate Ethereum address
 */
export function isValidAddress(address: string): address is Address {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Validate bytes32 hash
 */
export function isValidBytes32(hash: string): hash is `0x${string}` {
  return /^0x[a-fA-F0-9]{64}$/.test(hash)
}

/**
 * Convert CID to bytes32 (simple hash for demo)
 * In production, you'd want proper CID handling
 */
export function cidToBytes32(cid: string): `0x${string}` {
  // If it's already a valid bytes32, return it
  if (isValidBytes32(cid)) return cid
  // Otherwise hash the CID string
  return keccak256(toBytes(cid))
}
