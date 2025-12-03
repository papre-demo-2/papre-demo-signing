import { createConfig, http } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { avalancheFuji, localhost } from './chains'

export const config = createConfig({
  chains: [avalancheFuji, localhost],
  connectors: [
    injected(),
  ],
  transports: {
    [avalancheFuji.id]: http(),
    [localhost.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
