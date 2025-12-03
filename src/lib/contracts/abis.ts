// AgreementCoreV1 ABI (relevant functions)
export const agreementCoreAbi = [
  {
    type: 'function',
    name: 'executePort',
    inputs: [
      {
        name: 'ctx',
        type: 'tuple',
        components: [
          { name: 'agreement', type: 'address' },
          { name: 'purpose', type: 'bytes32' },
          { name: 'refHash', type: 'bytes32' },
          { name: 'salt', type: 'bytes32' },
        ],
      },
      { name: 'portId', type: 'bytes32' },
      { name: 'payload', type: 'bytes' },
    ],
    outputs: [{ name: '', type: 'bytes' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'queryPort',
    inputs: [
      {
        name: 'ctx',
        type: 'tuple',
        components: [
          { name: 'agreement', type: 'address' },
          { name: 'purpose', type: 'bytes32' },
          { name: 'refHash', type: 'bytes32' },
          { name: 'salt', type: 'bytes32' },
        ],
      },
      { name: 'portId', type: 'bytes32' },
      { name: 'payload', type: 'bytes' },
    ],
    outputs: [{ name: '', type: 'bytes' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'creator',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
] as const

// SignatureClauseLogic ABI (relevant functions)
export const signatureClauseAbi = [
  {
    type: 'function',
    name: 'getStatus',
    inputs: [{ name: 'instanceId', type: 'uint256' }],
    outputs: [
      { name: 'initialized', type: 'bool' },
      { name: 'signedCount', type: 'uint256' },
      { name: 'requiredCount', type: 'uint256' },
      { name: 'completed', type: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getRequiredSigners',
    inputs: [{ name: 'instanceId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'hasSigned',
    inputs: [
      { name: 'instanceId', type: 'uint256' },
      { name: 'signer', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getInitializer',
    inputs: [{ name: 'instanceId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getInstanceCount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getInstance',
    inputs: [{ name: 'instanceId', type: 'uint256' }],
    outputs: [
      {
        name: '',
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
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getEIP191Digest',
    inputs: [
      { name: 'instanceId', type: 'uint256' },
      { name: 'signer', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'pure',
  },
  {
    type: 'event',
    name: 'InstanceCreated',
    inputs: [
      { name: 'instanceId', type: 'uint256', indexed: true },
      { name: 'initializer', type: 'address', indexed: true },
      { name: 'agreement', type: 'address', indexed: false },
      { name: 'purpose', type: 'bytes32', indexed: false },
      { name: 'refHash', type: 'bytes32', indexed: false },
      { name: 'salt', type: 'bytes32', indexed: false },
      { name: 'signers', type: 'address[]', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Signed',
    inputs: [
      { name: 'instanceId', type: 'uint256', indexed: true },
      { name: 'signer', type: 'address', indexed: true },
      { name: 'scheme', type: 'uint8', indexed: false },
      { name: 'signedCount', type: 'uint256', indexed: false },
      { name: 'requiredCount', type: 'uint256', indexed: false },
    ],
  },
] as const

// Export with uppercase names as well for compatibility
export const AGREEMENT_CORE_ABI = agreementCoreAbi
export const SIGNATURE_CLAUSE_ABI = signatureClauseAbi

// Port IDs (keccak256 hashes)
export const PORTS = {
  INIT: '0x' + 'a1b2c3d4e5f6'.padEnd(64, '0'), // Will be computed properly
  SIGN: '0x' + 'b2c3d4e5f6a1'.padEnd(64, '0'),
  STATUS: '0x' + 'c3d4e5f6a1b2'.padEnd(64, '0'),
} as const
