import { defineChain } from 'viem'

export const avalancheFuji = defineChain({
  id: 43113,
  name: 'Avalanche Fuji',
  nativeCurrency: {
    decimals: 18,
    name: 'Avalanche',
    symbol: 'AVAX',
  },
  rpcUrls: {
    default: {
      http: ['https://api.avax-test.network/ext/bc/C/rpc'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Snowtrace',
      url: 'https://testnet.snowtrace.io',
    },
  },
  testnet: true,
})

export const localhost = defineChain({
  id: 31337,
  name: 'Local Anvil',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
  },
  testnet: true,
})

export const supportedChains = [avalancheFuji, localhost] as const
export type SupportedChainId = typeof supportedChains[number]['id']
