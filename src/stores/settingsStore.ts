import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Address } from 'viem'
import { avalancheFuji, localhost, type SupportedChainId } from '../lib/chains'

export interface ChainAddresses {
  demoAgreement: Address | ''
  signatureClauseLogic: Address | ''
}

interface SettingsState {
  addresses: Record<SupportedChainId, ChainAddresses>
  setAddresses: (chainId: SupportedChainId, addresses: Partial<ChainAddresses>) => void
  resetToDefaults: () => void
}

const defaultAddresses: Record<SupportedChainId, ChainAddresses> = {
  [avalancheFuji.id]: {
    demoAgreement: '',
    signatureClauseLogic: '',
  },
  [localhost.id]: {
    demoAgreement: '',
    signatureClauseLogic: '',
  },
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      addresses: defaultAddresses,
      setAddresses: (chainId, newAddresses) =>
        set((state) => ({
          addresses: {
            ...state.addresses,
            [chainId]: {
              ...state.addresses[chainId],
              ...newAddresses,
            },
          },
        })),
      resetToDefaults: () => set({ addresses: defaultAddresses }),
    }),
    {
      name: 'papre-demo-settings',
    }
  )
)

export const useCurrentChainAddresses = (chainId: SupportedChainId | undefined) => {
  const addresses = useSettingsStore((state) => state.addresses)
  if (!chainId) return null
  return addresses[chainId] ?? null
}
