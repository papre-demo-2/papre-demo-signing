import { useChainId } from 'wagmi'
import { useSettingsStore } from '../stores/settingsStore'
import { avalancheFuji, localhost } from '../lib/chains'
import type { Address } from 'viem'

export interface ContractAddresses {
  demoAgreement: Address | null
  signatureClauseLogic: Address | null
  isConfigured: boolean
}

export function useContractAddresses(): ContractAddresses {
  const chainId = useChainId()
  const addresses = useSettingsStore((state) => state.addresses)

  const chainAddresses = chainId === avalancheFuji.id
    ? addresses[avalancheFuji.id]
    : chainId === localhost.id
      ? addresses[localhost.id]
      : null

  if (!chainAddresses) {
    return {
      demoAgreement: null,
      signatureClauseLogic: null,
      isConfigured: false,
    }
  }

  const demoAgreement = chainAddresses.demoAgreement || null
  const signatureClauseLogic = chainAddresses.signatureClauseLogic || null

  return {
    demoAgreement: demoAgreement as Address | null,
    signatureClauseLogic: signatureClauseLogic as Address | null,
    isConfigured: !!demoAgreement,
  }
}
