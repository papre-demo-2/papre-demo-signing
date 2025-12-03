import { useConnect } from 'wagmi'
import { motion } from 'framer-motion'
import { Wallet, AlertCircle } from 'lucide-react'
import { Button } from '../ui'

export function ConnectWallet() {
  const { connect, connectors, isPending, error } = useConnect()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <Wallet className="w-8 h-8 text-primary" />
      </div>

      <h1 className="text-2xl font-semibold text-foreground mb-2">
        Connect Your Wallet
      </h1>

      <p className="text-muted-foreground max-w-sm mb-8">
        Connect with MetaMask to view and sign signature requests on the blockchain.
      </p>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 mb-6 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error.message}</span>
        </div>
      )}

      <div className="space-y-3">
        {/* Show only the first available connector (avoids duplicate MetaMask/Injected buttons) */}
        {connectors.length > 0 && (
          <Button
            size="lg"
            loading={isPending}
            onClick={() => connect({ connector: connectors[0] })}
            icon={<Wallet className="w-5 h-5" />}
            className="w-full"
          >
            Connect Wallet
          </Button>
        )}
      </div>

      <p className="text-xs text-muted mt-6 max-w-xs">
        Make sure you're connected to <strong className="text-foreground">Avalanche Fuji</strong> or <strong className="text-foreground">Local Anvil</strong> network.
      </p>
    </motion.div>
  )
}
