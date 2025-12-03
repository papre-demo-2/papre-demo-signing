import { useState, useCallback } from 'react'
import { usePublicClient, useWalletClient, useAccount } from 'wagmi'
import { encodeAbiParameters, keccak256 } from 'viem'
import { toast } from 'sonner'
import { useContractAddresses } from './useContractAddresses'
import { AGREEMENT_CORE_ABI } from '../lib/contracts/abis'
import { createDemoContext, PORT_IDS } from '../lib/utils'

// Signature scheme enum (matches Solidity)
const SCHEME_EIP191 = 0

interface UseSignResult {
  sign: (instanceId: bigint) => Promise<boolean>
  isSigning: boolean
  signingNonce: bigint | null
  signingInstanceId: bigint | null
  error: Error | null
}

export function useSign(): UseSignResult {
  const [isSigning, setIsSigning] = useState(false)
  const [signingInstanceId, setSigningInstanceId] = useState<bigint | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const { address } = useAccount()
  const { demoAgreement, isConfigured } = useContractAddresses()

  const sign = useCallback(
    async (instanceId: bigint): Promise<boolean> => {
      if (!publicClient || !walletClient || !address || !demoAgreement || !isConfigured) {
        toast.error('Wallet not connected or contracts not configured')
        return false
      }

      setIsSigning(true)
      setSigningInstanceId(instanceId)
      setError(null)

      try {
        // Create a dummy context (not used by the clause but required by interface)
        const ctx = createDemoContext(demoAgreement, 0n)

        // Compute the EIP-191 digest that the contract expects
        // From SignatureClauseLogic: _ethSignedMessageHash = keccak256(abi.encode(instanceId, signer)).toEthSignedMessageHash()
        // But signMessage already applies the "\x19Ethereum Signed Message:\n32" prefix
        // So we just need to sign keccak256(abi.encode(instanceId, signer))

        const messageHash = keccak256(
          encodeAbiParameters(
            [{ type: 'uint256' }, { type: 'address' }],
            [instanceId, address]
          )
        )

        toast.loading('Requesting signature...', { id: 'sign-request' })

        // Request signature from wallet (EIP-191 personal_sign)
        // signMessage adds the "\x19Ethereum Signed Message:\n32" prefix automatically
        const signature = await walletClient.signMessage({
          message: { raw: messageHash as `0x${string}` },
        })

        toast.loading('Submitting signature...', { id: 'sign-request' })

        // Encode the sign payload: (uint256 instanceId, address signer, uint8 scheme, bytes signature)
        const signPayload = encodeAbiParameters(
          [
            { type: 'uint256', name: 'instanceId' },
            { type: 'address', name: 'signer' },
            { type: 'uint8', name: 'scheme' },
            { type: 'bytes', name: 'signature' },
          ],
          [instanceId, address, SCHEME_EIP191, signature]
        )

        // Simulate the transaction first
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { request } = await publicClient.simulateContract({
          address: demoAgreement,
          abi: AGREEMENT_CORE_ABI,
          functionName: 'executePort',
          args: [ctx, PORT_IDS.SIGN, signPayload],
          account: address,
        } as any)

        // Send the transaction
        const hash = await walletClient.writeContract(request)

        // Wait for confirmation
        const receipt = await publicClient.waitForTransactionReceipt({ hash })

        if (receipt.status === 'success') {
          toast.success('Signature submitted!', {
            id: 'sign-request',
            description: `Instance #${instanceId.toString()}`,
          })
          return true
        } else {
          throw new Error('Transaction failed')
        }
      } catch (err) {
        console.error('Failed to sign:', err)
        const message = err instanceof Error ? err.message : 'Failed to sign'
        setError(err instanceof Error ? err : new Error(message))

        // Check for user rejection
        if (message.includes('rejected') || message.includes('denied')) {
          toast.error('Signature rejected', { id: 'sign-request' })
        } else {
          toast.error('Failed to sign', {
            id: 'sign-request',
            description: message,
          })
        }
        return false
      } finally {
        setIsSigning(false)
        setSigningInstanceId(null)
      }
    },
    [publicClient, walletClient, address, demoAgreement, isConfigured]
  )

  return {
    sign,
    isSigning,
    signingNonce: signingInstanceId, // Keep for backwards compat
    signingInstanceId,
    error,
  }
}
