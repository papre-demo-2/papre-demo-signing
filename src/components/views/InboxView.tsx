import { motion, AnimatePresence } from 'framer-motion'
import { Inbox, Loader2, RefreshCw, Search, Filter } from 'lucide-react'
import { useState } from 'react'
import { SignatureCard, type SignatureInstance } from './SignatureCard'
import { Button, Input } from '../ui'

type FilterOption = 'all' | 'pending' | 'signed' | 'complete'

interface InboxViewProps {
  instances: SignatureInstance[]
  isLoading: boolean
  currentAddress: `0x${string}`
  onRefresh: () => void
  onSign: (instanceId: bigint) => Promise<void>
  isSigning: boolean
  signingInstanceId?: bigint
}

export function InboxView({
  instances,
  isLoading,
  currentAddress,
  onRefresh,
  onSign,
  isSigning,
  signingInstanceId,
}: InboxViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<FilterOption>('all')

  // Filter and search instances
  const filteredInstances = instances.filter((instance) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesTitle = instance.title.toLowerCase().includes(query)
      const matchesNonce = instance.nonce.toString().includes(query)
      if (!matchesTitle && !matchesNonce) return false
    }

    // Status filter
    switch (filter) {
      case 'pending':
        return !instance.hasSigned && !instance.isComplete
      case 'signed':
        return instance.hasSigned && !instance.isComplete
      case 'complete':
        return instance.isComplete
      default:
        return true
    }
  })

  const filterOptions: { id: FilterOption; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: instances.length },
    {
      id: 'pending',
      label: 'Pending',
      count: instances.filter((i) => !i.hasSigned && !i.isComplete).length,
    },
    {
      id: 'signed',
      label: 'Signed',
      count: instances.filter((i) => i.hasSigned && !i.isComplete).length,
    },
    {
      id: 'complete',
      label: 'Complete',
      count: instances.filter((i) => i.isComplete).length,
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {/* Header with search and filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <Input
            placeholder="Search by title or #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Refresh button */}
        <Button
          variant="secondary"
          onClick={onRefresh}
          disabled={isLoading}
          icon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
        >
          Refresh
        </Button>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="w-4 h-4 text-muted flex-shrink-0" />
        {filterOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => setFilter(option.id)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
              whitespace-nowrap transition-all
              ${filter === option.id
                ? 'bg-primary text-white'
                : 'bg-card border border-border text-muted hover:text-foreground hover:border-primary/50'
              }
            `}
          >
            {option.label}
            <span className={`
              text-xs px-1.5 py-0.5 rounded-full
              ${filter === option.id ? 'bg-white/20' : 'bg-background'}
            `}>
              {option.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading && instances.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
          <p className="text-muted">Loading signature requests...</p>
        </div>
      ) : filteredInstances.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center mb-4">
            <Inbox className="w-8 h-8 text-muted" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">
            {searchQuery || filter !== 'all' ? 'No matches found' : 'No signature requests'}
          </h3>
          <p className="text-sm text-muted max-w-xs">
            {searchQuery || filter !== 'all'
              ? 'Try adjusting your search or filter'
              : "Signature requests where you're a signer will appear here"
            }
          </p>
          {(searchQuery || filter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('')
                setFilter('all')
              }}
              className="mt-4"
            >
              Clear filters
            </Button>
          )}
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {filteredInstances.map((instance) => (
              <SignatureCard
                key={instance.instanceId.toString()}
                instance={instance}
                currentAddress={currentAddress}
                onSign={onSign}
                isSigning={isSigning}
                signingInstanceId={signingInstanceId}
              />
            ))}
          </div>
        </AnimatePresence>
      )}
    </motion.div>
  )
}
