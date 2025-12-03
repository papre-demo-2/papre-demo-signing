import { useState } from 'react'
import { useAccount, useChainId, useDisconnect } from 'wagmi'
import { Settings, ChevronDown, LogOut, Copy, Check, ExternalLink, Sun, Moon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '../ui'
import { truncateAddress, copyToClipboard } from '../../lib/utils'
import { avalancheFuji, localhost } from '../../lib/chains'
import { useTheme } from '../../hooks'

interface HeaderProps {
  onOpenSettings: () => void
}

export function Header({ onOpenSettings }: HeaderProps) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { disconnect } = useDisconnect()
  const { theme, toggleTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const chainName = chainId === avalancheFuji.id
    ? 'Fuji'
    : chainId === localhost.id
    ? 'Anvil'
    : `Unknown (${chainId})`

  const chainVariant = chainId === avalancheFuji.id
    ? 'info'
    : chainId === localhost.id
    ? 'warning'
    : 'error'

  const handleCopy = async () => {
    if (address && await copyToClipboard(address)) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="font-semibold text-foreground">Papre Signing</span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Network badge */}
          {isConnected && (
            <Badge variant={chainVariant}>{chainName}</Badge>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-card-hover transition-colors"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-card-hover transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Account button / dropdown */}
          {isConnected && address && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border hover:bg-card-hover transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-purple-500" />
                <span className="font-mono text-sm text-foreground">
                  {truncateAddress(address)}
                </span>
                <ChevronDown className={`w-4 h-4 text-muted transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setMenuOpen(false)}
                    />

                    {/* Dropdown */}
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
                    >
                      {/* Address section */}
                      <div className="p-3 border-b border-border">
                        <p className="text-xs text-muted mb-1">Connected as</p>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm text-foreground">
                            {truncateAddress(address, 6)}
                          </span>
                          <button
                            onClick={handleCopy}
                            className="p-1.5 rounded-md hover:bg-card-hover transition-colors"
                          >
                            {copied ? (
                              <Check className="w-4 h-4 text-success" />
                            ) : (
                              <Copy className="w-4 h-4 text-muted" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Menu items */}
                      <div className="p-1">
                        {chainId === avalancheFuji.id && (
                          <a
                            href={`https://testnet.snowtrace.io/address/${address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-card-hover transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                            View on Snowtrace
                          </a>
                        )}
                        <button
                          onClick={() => {
                            disconnect()
                            setMenuOpen(false)
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-error hover:bg-error/10 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Disconnect
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
