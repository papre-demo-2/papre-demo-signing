import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Loader2, RefreshCw, Search, Filter, FileText, CheckCircle2, Users, Check } from 'lucide-react'
import { useState } from 'react'
import type { SignatureInstance } from './SignatureCard'
import { Card, Badge, Button, Input } from '../ui'
import { truncateAddress } from '../../lib/utils'

type FilterOption = 'all' | 'pending' | 'in_progress' | 'complete'

interface AdminViewProps {
  instances: SignatureInstance[]
  isLoading: boolean
  onRefresh: () => void
}

export function AdminView({
  instances,
  isLoading,
  onRefresh,
}: AdminViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<FilterOption>('all')

  // Filter and search instances
  const filteredInstances = instances.filter((instance) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesTitle = instance.title.toLowerCase().includes(query)
      const matchesId = instance.instanceId.toString().includes(query)
      const matchesSigner = instance.signers.some(s => s.toLowerCase().includes(query))
      if (!matchesTitle && !matchesId && !matchesSigner) return false
    }

    // Status filter
    switch (filter) {
      case 'pending':
        return instance.signedCount === 0 && !instance.isComplete
      case 'in_progress':
        return instance.signedCount > 0 && !instance.isComplete
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
      count: instances.filter((i) => i.signedCount === 0 && !i.isComplete).length,
    },
    {
      id: 'in_progress',
      label: 'In Progress',
      count: instances.filter((i) => i.signedCount > 0 && !i.isComplete).length,
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
            placeholder="Search by title, # or address..."
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
          <p className="text-muted">Loading all signature requests...</p>
        </div>
      ) : filteredInstances.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-muted" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">
            {searchQuery || filter !== 'all' ? 'No matches found' : 'No signature requests'}
          </h3>
          <p className="text-sm text-muted max-w-xs">
            {searchQuery || filter !== 'all'
              ? 'Try adjusting your search or filter'
              : 'All signature requests will appear here'
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
              <AdminCard key={instance.instanceId.toString()} instance={instance} />
            ))}
          </div>
        </AnimatePresence>
      )}
    </motion.div>
  )
}

// Simplified card for admin view (no sign action)
function AdminCard({ instance }: { instance: SignatureInstance }) {
  const statusVariant = instance.isComplete
    ? 'success'
    : instance.signedCount > 0
      ? 'info'
      : 'warning'

  const statusText = instance.isComplete
    ? 'Complete'
    : instance.signedCount > 0
      ? `${instance.signedCount}/${instance.signers.length} Signed`
      : 'Pending'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden">
        {/* Progress bar at top */}
        <div className="h-1 bg-background">
          <motion.div
            className={`h-full ${instance.isComplete ? 'bg-success' : 'bg-primary'}`}
            initial={{ width: 0 }}
            animate={{ width: `${(instance.signedCount / instance.signers.length) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`
                w-10 h-10 rounded-xl flex items-center justify-center
                ${instance.isComplete ? 'bg-success/10' : 'bg-primary/10'}
              `}>
                {instance.isComplete ? (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                ) : (
                  <FileText className="w-5 h-5 text-primary" />
                )}
              </div>
              <div>
                <h3 className="font-medium text-foreground line-clamp-1">{instance.title}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted font-mono">
                    #{instance.instanceId.toString()}
                  </span>
                  <span className="text-muted">·</span>
                  <Badge variant={statusVariant} className="text-xs py-0">
                    {statusText}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Signers list */}
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-muted" />
            <span className="text-sm text-muted-foreground">
              {instance.signedCount} of {instance.signers.length} signed
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {instance.signers.map((signer, index) => {
              const hasSigned = index < instance.signedCount

              return (
                <div
                  key={signer}
                  className={`
                    flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-mono
                    ${hasSigned
                      ? 'bg-success/10 text-success border border-success/20'
                      : 'bg-background text-muted border border-border'
                    }
                  `}
                >
                  {hasSigned && <Check className="w-3 h-3" />}
                  <span>{truncateAddress(signer, 4)}</span>
                </div>
              )
            })}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
