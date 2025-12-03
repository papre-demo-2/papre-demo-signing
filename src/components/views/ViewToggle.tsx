import { motion } from 'framer-motion'
import { Inbox, PenTool, Shield } from 'lucide-react'

export type ViewMode = 'inbox' | 'create' | 'admin'

interface ViewToggleProps {
  view: ViewMode
  onChange: (view: ViewMode) => void
  inboxCount?: number
  adminCount?: number
}

export function ViewToggle({ view, onChange, inboxCount = 0, adminCount = 0 }: ViewToggleProps) {
  const views: { id: ViewMode; label: string; icon: React.ReactNode; count?: number }[] = [
    {
      id: 'inbox',
      label: 'Inbox',
      icon: <Inbox className="w-4 h-4" />,
      count: inboxCount,
    },
    {
      id: 'create',
      label: 'Create',
      icon: <PenTool className="w-4 h-4" />,
    },
    {
      id: 'admin',
      label: 'Admin',
      icon: <Shield className="w-4 h-4" />,
      count: adminCount,
    },
  ]

  const viewIndex = views.findIndex(v => v.id === view)

  // Calculate exact left positions accounting for 4px padding
  // Container inner width = 100% - 8px, each column = (100% - 8px) / 3
  const sliderPositions = [
    '4px',
    'calc(33.333% + 1.333px)',
    'calc(66.667% - 1.333px)',
  ]

  return (
    <div className="relative p-1 bg-card border border-border rounded-xl">
      {/* Button grid for layout reference */}
      <div className="grid grid-cols-3 gap-0">
        {/* Animated background slider */}
        <motion.div
          className="absolute top-1 bottom-1 rounded-lg bg-primary"
          style={{ width: 'calc(33.333% - 2.667px)' }}
          initial={false}
          animate={{
            left: sliderPositions[viewIndex],
          }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 35,
          }}
        />

        {/* Toggle buttons */}
        {views.map(({ id, label, icon, count }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`
              relative z-10 flex items-center justify-center gap-2 px-4 py-2.5
              rounded-lg text-sm font-medium transition-colors duration-200
              ${view === id ? 'text-white' : 'text-muted hover:text-foreground'}
            `}
          >
            {icon}
            <span>{label}</span>
            {count !== undefined && count > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`
                  ml-1 px-1.5 py-0.5 text-xs rounded-full font-semibold
                  ${view === id ? 'bg-white/20 text-white' : 'bg-primary/20 text-primary'}
                `}
              >
                {count}
              </motion.span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
