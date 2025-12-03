import { useState, useCallback } from 'react'
import { usePublicClient, useWalletClient, useAccount } from 'wagmi'
import { encodeAbiParameters, type Address } from 'viem'
import { toast } from 'sonner'
import { useContractAddresses } from './useContractAddresses'
import { AGREEMENT_CORE_ABI } from '../lib/contracts/abis'
import { createDemoContext, PORT_IDS } from '../lib/utils'
import { setInstanceTitle } from './useInstances'

interface UseCreateRequestResult {
  createRequest: (title: string, signers: Address[]) => Promise<bigint | null>
  isCreating: boolean
  error: Error | null
}

export function useCreateRequest(): UseCreateRequestResult {
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const { address } = useAccount()
  const { demoAgreement, isConfigured } = useContractAddresses()

  const createRequest = useCallback(
    async (title: string, signers: Address[]): Promise<bigint | null> => {
      if (!publicClient || !walletClient || !address || !demoAgreement || !isConfigured) {
        toast.error('Wallet not connected or contracts not configured')
        return null
      }

      setIsCreating(true)
      setError(null)

      try {
        // Create a context (the clause stores context data but uses instanceId for lookup)
        const ctx = createDemoContext(demoAgreement, 0n)

        // Encode signers payload
        const signersPayload = encodeAbiParameters(
          [{ type: 'address[]' }],
          [signers]
        )

        // Simulate the transaction first
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { request } = await publicClient.simulateContract({
          address: demoAgreement,
          abi: AGREEMENT_CORE_ABI,
          functionName: 'executePort',
          args: [ctx, PORT_IDS.INIT, signersPayload],
          account: address,
        } as any)

        toast.loading('Creating signature request...', { id: 'create-request' })

        // Send the transaction
        const hash = await walletClient.writeContract(request)

        // Wait for confirmation
        const receipt = await publicClient.waitForTransactionReceipt({ hash })

        if (receipt.status === 'success') {
          // Find the instanceId by looking for the highest initialized instance
          // The new instance will be the first uninitialized one - 1 doesn't work
          // because we just created it. Instead, find the last initialized one.
          let instanceId = 0n

          // Binary search would be better, but for demo just iterate
          for (let i = 0; i < 100; i++) {
            const testId = BigInt(i)
            try {
              const statusPayload = encodeAbiParameters([{ type: 'uint256' }], [testId])
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const statusData = await publicClient.readContract({
                address: demoAgreement,
                abi: AGREEMENT_CORE_ABI,
                functionName: 'queryPort',
                args: [ctx, PORT_IDS.STATUS, statusPayload],
              } as any)

              const { decodeAbiParameters } = await import('viem')
              const [initialized] = decodeAbiParameters(
                [{ type: 'bool' }],
                statusData as `0x${string}`
              )

              if (initialized) {
                // Keep track of highest initialized ID
                instanceId = testId
              } else {
                // Found first uninitialized, stop searching
                break
              }
            } catch {
              // Query failed, stop searching
              break
            }
          }

          // Store the title locally
          setInstanceTitle(instanceId, title)

          toast.success('Signature request created!', {
            id: 'create-request',
            description: `Instance #${instanceId.toString()}`,
          })

          return instanceId
        } else {
          throw new Error('Transaction failed')
        }
      } catch (err) {
        console.error('Failed to create request:', err)
        const message = err instanceof Error ? err.message : 'Failed to create request'
        setError(err instanceof Error ? err : new Error(message))
        toast.error('Failed to create request', {
          id: 'create-request',
          description: message,
        })
        return null
      } finally {
        setIsCreating(false)
      }
    },
    [publicClient, walletClient, address, demoAgreement, isConfigured]
  )

  return {
    createRequest,
    isCreating,
    error,
  }
}
