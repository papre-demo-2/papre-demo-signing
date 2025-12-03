import { useState, type ReactNode } from 'react'
import { Toaster } from 'sonner'
import { Header } from './Header'
import { SettingsModal } from '../settings/SettingsModal'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <Header onOpenSettings={() => setSettingsOpen(true)} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {children}
      </main>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'rgb(var(--color-card))',
            border: '1px solid rgb(var(--color-border))',
            color: 'rgb(var(--color-foreground))',
          },
        }}
      />
    </div>
  )
}
