import { useState, useEffect } from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAccount, useChainId } from 'wagmi'
import { AnimatePresence, motion } from 'framer-motion'
import { Settings } from 'lucide-react'
import { config } from './lib/wagmi'
import { avalancheFuji, localhost } from './lib/chains'
import { Layout } from './components/layout/Layout'
import { ConnectWallet } from './components/wallet/ConnectWallet'
import { WrongNetwork } from './components/wallet/WrongNetwork'
import { ViewToggle, CreateView, InboxView, AdminView, type ViewMode } from './components/views'
import { useContractAddresses, useInstances, useAllInstances, useCreateRequest, useSign, setInstanceTitle } from './hooks'
import { Card, CardContent } from './components/ui'
import { getInstanceFromUrl } from './lib/utils'
import type { Address } from 'viem'

const queryClient = new QueryClient()

function AppContent() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const [view, setView] = useState<ViewMode>('inbox')

  const { isConfigured } = useContractAddresses()
  const { instances, isLoading, refetch } = useInstances(address)
  const { instances: allInstances, isLoading: isLoadingAll, refetch: refetchAll } = useAllInstances()
  const { createRequest, isCreating } = useCreateRequest()
  const { sign, isSigning, signingNonce } = useSign()

  // Check for instance in URL
  useEffect(() => {
    const instanceFromUrl = getInstanceFromUrl()
    if (instanceFromUrl !== null) {
      setView('inbox')
    }
  }, [])

  // Check if connected to supported network
  const isSupportedNetwork = chainId === avalancheFuji.id || chainId === localhost.id

  // Handle create request
  const handleCreate = async (title: string, signers: string[]) => {
    const nonce = await createRequest(title, signers as Address[])
    if (nonce !== null) {
      setInstanceTitle(nonce, title)
      setView('inbox')
      refetch()
    }
  }

  // Handle sign
  const handleSign = async (instanceId: bigint) => {
    const success = await sign(instanceId)
    if (success) {
      refetch()
    }
  }

  // Count pending items for badge
  const pendingCount = instances.filter((i) => !i.hasSigned && !i.isComplete).length

  // Not connected
  if (!isConnected) {
    return (
      <Layout>
        <ConnectWallet />
      </Layout>
    )
  }

  // Wrong network
  if (!isSupportedNetwork) {
    return (
      <Layout>
        <WrongNetwork />
      </Layout>
    )
  }

  // Not configured
  if (!isConfigured) {
    return (
      <Layout>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center min-h-[60vh] text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-warning/10 flex items-center justify-center mb-6">
            <Settings className="w-8 h-8 text-warning" />
          </div>

          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Configure Contracts
          </h1>

          <p className="text-muted-foreground max-w-sm mb-8">
            You need to configure the contract addresses before you can use this app.
            Click the settings icon in the header to add your contract addresses.
          </p>

          <Card className="max-w-md w-full">
            <CardContent className="text-left">
              <h3 className="font-medium text-foreground mb-3">What you'll need:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span><strong className="text-foreground">Demo Agreement Address:</strong> The deployed Agreement proxy that hosts signature instances</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span><strong className="text-foreground">SignatureClauseLogic Address:</strong> The clause implementation for signature verification (optional)</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </Layout>
    )
  }

  // Main app
  return (
    <Layout>
      <div className="space-y-6">
        {/* View toggle */}
        <div className="flex justify-center">
          <ViewToggle
            view={view}
            onChange={setView}
            inboxCount={pendingCount}
            adminCount={allInstances.length}
          />
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {view === 'inbox' && (
            <InboxView
              key="inbox"
              instances={instances}
              isLoading={isLoading}
              currentAddress={address!}
              onRefresh={refetch}
              onSign={handleSign}
              isSigning={isSigning}
              signingInstanceId={signingNonce ?? undefined}
            />
          )}
          {view === 'create' && (
            <CreateView
              key="create"
              onSubmit={handleCreate}
              isSubmitting={isCreating}
              currentAddress={address}
            />
          )}
          {view === 'admin' && (
            <AdminView
              key="admin"
              instances={allInstances}
              isLoading={isLoadingAll}
              onRefresh={refetchAll}
            />
          )}
        </AnimatePresence>
      </div>
    </Layout>
  )
}

export default function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </WagmiProvider>
  )
}
