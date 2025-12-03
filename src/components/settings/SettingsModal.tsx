import { useState, useEffect } from 'react'
import { useChainId } from 'wagmi'
import { Settings, Save, RotateCcw } from 'lucide-react'
import { Modal, Input, Button, Badge } from '../ui'
import { useSettingsStore, type ChainAddresses } from '../../stores/settingsStore'
import { avalancheFuji, localhost } from '../../lib/chains'
import { isAddress } from 'viem'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

type NetworkTab = 'fuji' | 'anvil'

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const chainId = useChainId()
  const addresses = useSettingsStore((state) => state.addresses)
  const setAddresses = useSettingsStore((state) => state.setAddresses)
  const resetToDefaults = useSettingsStore((state) => state.resetToDefaults)

  // Determine which tab to show based on current chain
  const [activeTab, setActiveTab] = useState<NetworkTab>(
    chainId === localhost.id ? 'anvil' : 'fuji'
  )

  // Local form state
  const [fujiForm, setFujiForm] = useState<ChainAddresses>(addresses[avalancheFuji.id])
  const [anvilForm, setAnvilForm] = useState<ChainAddresses>(addresses[localhost.id])

  // Sync form state when store changes
  useEffect(() => {
    setFujiForm(addresses[avalancheFuji.id])
    setAnvilForm(addresses[localhost.id])
  }, [addresses])

  // Update active tab when chain changes
  useEffect(() => {
    setActiveTab(chainId === localhost.id ? 'anvil' : 'fuji')
  }, [chainId])

  const currentForm = activeTab === 'fuji' ? fujiForm : anvilForm
  const setCurrentForm = activeTab === 'fuji' ? setFujiForm : setAnvilForm

  const validateAddress = (addr: string): boolean => {
    return addr === '' || isAddress(addr)
  }

  const isFormValid =
    validateAddress(currentForm.demoAgreement) &&
    validateAddress(currentForm.signatureClauseLogic)

  const handleSave = () => {
    if (!isFormValid) return

    if (activeTab === 'fuji') {
      setAddresses(avalancheFuji.id, fujiForm)
    } else {
      setAddresses(localhost.id, anvilForm)
    }

    onClose()
  }

  const handleReset = () => {
    resetToDefaults()
    // Re-fetch from store after reset
    const state = useSettingsStore.getState()
    setFujiForm(state.addresses[avalancheFuji.id])
    setAnvilForm(state.addresses[localhost.id])
  }

  const tabs: { id: NetworkTab; label: string; chainId: number }[] = [
    { id: 'fuji', label: 'Avalanche Fuji', chainId: avalancheFuji.id },
    { id: 'anvil', label: 'Local Anvil', chainId: localhost.id },
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Contract Settings">
      <div className="space-y-6">
        {/* Header with icon */}
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">Network Configuration</h3>
            <p className="text-sm text-muted">Configure contract addresses for each network</p>
          </div>
        </div>

        {/* Network tabs */}
        <div className="flex gap-2 p-1 bg-background rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium
                transition-all duration-200
                ${activeTab === tab.id
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted hover:text-foreground'
                }
              `}
            >
              {tab.label}
              {chainId === tab.chainId && (
                <Badge variant="success" className="text-xs py-0">Active</Badge>
              )}
            </button>
          ))}
        </div>

        {/* Address inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Demo Agreement Address
            </label>
            <Input
              placeholder="0x..."
              value={currentForm.demoAgreement}
              onChange={(e) => setCurrentForm({ ...currentForm, demoAgreement: e.target.value as `0x${string}` | '' })}
              error={!validateAddress(currentForm.demoAgreement) ? 'Invalid address format' : undefined}
            />
            <p className="text-xs text-muted mt-1.5">
              The Agreement proxy address that hosts signature instances
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              SignatureClauseLogic Address
            </label>
            <Input
              placeholder="0x..."
              value={currentForm.signatureClauseLogic}
              onChange={(e) => setCurrentForm({ ...currentForm, signatureClauseLogic: e.target.value as `0x${string}` | '' })}
              error={!validateAddress(currentForm.signatureClauseLogic) ? 'Invalid address format' : undefined}
            />
            <p className="text-xs text-muted mt-1.5">
              The SignatureClauseLogic contract for querying digests
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            icon={<RotateCcw className="w-4 h-4" />}
          >
            Reset to Defaults
          </Button>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!isFormValid}
              icon={<Save className="w-4 h-4" />}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
