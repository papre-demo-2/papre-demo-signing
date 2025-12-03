import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, FileSignature, Users, Send, AlertCircle } from 'lucide-react'
import { isAddress } from 'viem'
import { Card, CardHeader, CardContent, CardFooter, Input, Button, Badge } from '../ui'
import { truncateAddress } from '../../lib/utils'

interface CreateViewProps {
  onSubmit: (title: string, signers: `0x${string}`[]) => Promise<void>
  isSubmitting: boolean
  currentAddress?: string
}

export function CreateView({ onSubmit, isSubmitting, currentAddress }: CreateViewProps) {
  const [title, setTitle] = useState('')
  const [signerInput, setSignerInput] = useState('')
  const [signers, setSigners] = useState<`0x${string}`[]>([])
  const [error, setError] = useState<string | null>(null)

  const addSigner = () => {
    const addr = signerInput.trim()

    if (!addr) return

    if (!isAddress(addr)) {
      setError('Invalid Ethereum address')
      return
    }

    if (signers.some(s => s.toLowerCase() === addr.toLowerCase())) {
      setError('Signer already added')
      return
    }

    setSigners([...signers, addr.toLowerCase() as `0x${string}`])
    setSignerInput('')
    setError(null)
  }

  const removeSigner = (index: number) => {
    setSigners(signers.filter((_, i) => i !== index))
  }

  const addSelf = () => {
    if (!currentAddress) return

    if (signers.includes(currentAddress.toLowerCase() as `0x${string}`)) {
      setError('You are already a signer')
      return
    }

    setSigners([...signers, currentAddress.toLowerCase() as `0x${string}`])
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      setError('Please enter a document title')
      return
    }

    if (signers.length === 0) {
      setError('Please add at least one signer')
      return
    }

    try {
      await onSubmit(title.trim(), signers)
      // Reset form on success
      setTitle('')
      setSigners([])
      setError(null)
    } catch {
      // Error handled by parent via toast
    }
  }

  const isValid = title.trim() && signers.length > 0

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileSignature className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Create Signature Request</h2>
                <p className="text-sm text-muted">
                  Set up a new document for signatures
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Document title */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Document Title
              </label>
              <Input
                placeholder="e.g., Service Agreement Q1 2025"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted mt-1.5">
                This will be hashed to create a unique document reference
              </p>
            </div>

            {/* Signers section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Required Signers
                </label>
                {currentAddress && (
                  <button
                    type="button"
                    onClick={addSelf}
                    className="text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    + Add myself
                  </button>
                )}
              </div>

              {/* Add signer input */}
              <div className="flex gap-2 mb-3">
                <div className="flex-1">
                  <Input
                    placeholder="0x... (Ethereum address)"
                    value={signerInput}
                    onChange={(e) => {
                      setSignerInput(e.target.value)
                      setError(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addSigner()
                      }
                    }}
                    disabled={isSubmitting}
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={addSigner}
                  disabled={!signerInput.trim() || isSubmitting}
                  icon={<Plus className="w-4 h-4" />}
                >
                  Add
                </Button>
              </div>

              {/* Signers list */}
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {signers.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-3 px-4 py-6 border border-dashed border-border rounded-lg text-center"
                    >
                      <Users className="w-5 h-5 text-muted mx-auto" />
                      <span className="text-sm text-muted">No signers added yet</span>
                    </motion.div>
                  ) : (
                    signers.map((signer, index) => (
                      <motion.div
                        key={signer}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center justify-between px-3 py-2 bg-background rounded-lg group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/50 to-purple-500/50" />
                          <div>
                            <span className="font-mono text-sm text-foreground">
                              {truncateAddress(signer, 6)}
                            </span>
                            {currentAddress?.toLowerCase() === signer && (
                              <Badge variant="info" className="ml-2 text-xs py-0">You</Badge>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSigner(index)}
                          className="p-1.5 rounded-md text-muted opacity-0 group-hover:opacity-100 hover:text-error hover:bg-error/10 transition-all"
                          disabled={isSubmitting}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>

              {signers.length > 0 && (
                <p className="text-xs text-muted mt-2">
                  {signers.length} signer{signers.length !== 1 && 's'} required to complete
                </p>
              )}
            </div>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 px-4 py-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>

          <CardFooter>
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={!isValid || isSubmitting}
              loading={isSubmitting}
              icon={<Send className="w-4 h-4" />}
            >
              Create Signature Request
            </Button>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  )
}
