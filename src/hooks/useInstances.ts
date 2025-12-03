import { useEffect, useState, useCallback } from 'react'
import { usePublicClient, useChainId } from 'wagmi'
import { decodeAbiParameters, type Address } from 'viem'
import { useContractAddresses } from './useContractAddresses'
import { AGREEMENT_CORE_ABI } from '../lib/contracts/abis'
import { createDemoContext, PORT_IDS, encodeInstanceIdPayload, encodeHasSignedPayload } from '../lib/utils'
import type { SignatureInstance } from '../components/views'

interface UseInstancesResult {
  instances: SignatureInstance[]
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

// Store instance titles locally (they're not on-chain)
const instanceTitles = new Map<string, string>()

export function setInstanceTitle(instanceId: bigint, title: string) {
  instanceTitles.set(instanceId.toString(), title)
}

export function getInstanceTitle(instanceId: bigint): string {
  return instanceTitles.get(instanceId.toString()) || `Document #${instanceId.toString()}`
}

export function useInstances(userAddress: Address | undefined): UseInstancesResult {
  const [instances, setInstances] = useState<SignatureInstance[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const publicClient = usePublicClient()
  const chainId = useChainId()
  const { demoAgreement, isConfigured } = useContractAddresses()

  const fetchInstances = useCallback(async () => {
    if (!publicClient || !userAddress || !demoAgreement || !isConfigured) {
      setInstances([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const discoveredInstances: SignatureInstance[] = []

      // Create a dummy context (ports don't use it, but it's required by the interface)
      const dummyCtx = createDemoContext(demoAgreement, 0n)

      // Try instanceIds 0-49 for demo (adjust as needed)
      const maxInstances = 50

      for (let instanceId = 0; instanceId < maxInstances; instanceId++) {
        const instanceIdBigInt = BigInt(instanceId)

        try {
          // Query status with instanceId in payload
          const instancePayload = encodeInstanceIdPayload(instanceIdBigInt)

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const statusData = await publicClient.readContract({
            address: demoAgreement,
            abi: AGREEMENT_CORE_ABI,
            functionName: 'queryPort',
            args: [dummyCtx, PORT_IDS.STATUS, instancePayload],
          } as any)

          // Decode status: (bool initialized, uint256 signedCount, uint256 requiredCount, bool completed)
          const [initialized, signedCount, , completed] = decodeAbiParameters(
            [
              { type: 'bool', name: 'initialized' },
              { type: 'uint256', name: 'signedCount' },
              { type: 'uint256', name: 'requiredCount' },
              { type: 'bool', name: 'completed' },
            ],
            statusData as `0x${string}`
          )

          if (!initialized) continue

          // Get required signers
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const signersData = await publicClient.readContract({
            address: demoAgreement,
            abi: AGREEMENT_CORE_ABI,
            functionName: 'queryPort',
            args: [dummyCtx, PORT_IDS.GET_REQUIRED_SIGNERS, instancePayload],
          } as any)

          const [signers] = decodeAbiParameters(
            [{ type: 'address[]', name: 'signers' }],
            signersData as `0x${string}`
          )

          // Check if user is a signer
          const isUserSigner = (signers as Address[]).some(
            (s) => s.toLowerCase() === userAddress.toLowerCase()
          )

          if (!isUserSigner) continue

          // Check if user has signed
          const hasSignedPayload = encodeHasSignedPayload(instanceIdBigInt, userAddress)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const hasSignedData = await publicClient.readContract({
            address: demoAgreement,
            abi: AGREEMENT_CORE_ABI,
            functionName: 'queryPort',
            args: [dummyCtx, PORT_IDS.HAS_SIGNED, hasSignedPayload],
          } as any)

          const [hasSigned] = decodeAbiParameters(
            [{ type: 'bool', name: 'hasSigned' }],
            hasSignedData as `0x${string}`
          )

          discoveredInstances.push({
            instanceId: instanceIdBigInt,
            nonce: instanceIdBigInt, // Keep for backwards compat
            title: getInstanceTitle(instanceIdBigInt),
            refHash: dummyCtx.refHash, // Not really used
            signers: signers as `0x${string}`[],
            signedCount: Number(signedCount),
            isComplete: completed as boolean,
            hasSigned: hasSigned as boolean,
          })
        } catch {
          // Instance doesn't exist at this ID, continue
          continue
        }
      }

      // Sort by instanceId descending (newest first)
      discoveredInstances.sort((a, b) => Number(b.instanceId - a.instanceId))
      setInstances(discoveredInstances)
    } catch (err) {
      console.error('Failed to fetch instances:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch instances'))
    } finally {
      setIsLoading(false)
    }
  }, [publicClient, userAddress, demoAgreement, isConfigured])

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchInstances()
  }, [fetchInstances, chainId])

  return {
    instances,
    isLoading,
    error,
    refetch: fetchInstances,
  }
}
