import { useEffect, useState, useCallback } from 'react'
import { usePublicClient, useChainId } from 'wagmi'
import { decodeAbiParameters } from 'viem'
import { useContractAddresses } from './useContractAddresses'
import { AGREEMENT_CORE_ABI } from '../lib/contracts/abis'
import { createDemoContext, PORT_IDS, encodeInstanceIdPayload } from '../lib/utils'
import type { SignatureInstance } from '../components/views'
import { getInstanceTitle } from './useInstances'

interface UseAllInstancesResult {
  instances: SignatureInstance[]
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

export function useAllInstances(): UseAllInstancesResult {
  const [instances, setInstances] = useState<SignatureInstance[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const publicClient = usePublicClient()
  const chainId = useChainId()
  const { demoAgreement, isConfigured } = useContractAddresses()

  const fetchInstances = useCallback(async () => {
    if (!publicClient || !demoAgreement || !isConfigured) {
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

          // For admin view, we don't filter by user - show all instances
          // hasSigned will be false since we don't know which user is viewing
          discoveredInstances.push({
            instanceId: instanceIdBigInt,
            nonce: instanceIdBigInt,
            title: getInstanceTitle(instanceIdBigInt),
            refHash: dummyCtx.refHash,
            signers: signers as `0x${string}`[],
            signedCount: Number(signedCount),
            isComplete: completed as boolean,
            hasSigned: false, // Admin view doesn't track per-user signing
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
      console.error('Failed to fetch all instances:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch instances'))
    } finally {
      setIsLoading(false)
    }
  }, [publicClient, demoAgreement, isConfigured])

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
