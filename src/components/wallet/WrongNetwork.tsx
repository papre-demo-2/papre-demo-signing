import { useSwitchChain, useChainId } from 'wagmi'
import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { Button } from '../ui'
import { avalancheFuji, localhost } from '../../lib/chains'

export function WrongNetwork() {
  const chainId = useChainId()
  const { switchChain, isPending } = useSwitchChain()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-warning/10 flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8 text-warning" />
      </div>

      <h1 className="text-2xl font-semibold text-foreground mb-2">
        Wrong Network
      </h1>

      <p className="text-muted-foreground max-w-sm mb-8">
        You're connected to an unsupported network (Chain ID: {chainId}).
        Please switch to Avalanche Fuji or Local Anvil.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="primary"
          loading={isPending}
          onClick={() => switchChain({ chainId: avalancheFuji.id })}
        >
          Switch to Fuji
        </Button>

        <Button
          variant="secondary"
          loading={isPending}
          onClick={() => switchChain({ chainId: localhost.id })}
        >
          Switch to Anvil
        </Button>
      </div>
    </motion.div>
  )
}
