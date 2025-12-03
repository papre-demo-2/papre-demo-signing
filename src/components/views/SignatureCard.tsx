import { motion } from 'framer-motion'
import { FileText, Check, Clock, Users, Pen, Copy, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { Card, Badge, Button, ProgressDots } from '../ui'
import { truncateAddress, copyToClipboard } from '../../lib/utils'

export interface SignatureInstance {
  instanceId: bigint
  nonce: bigint
  title: string
  refHash: `0x${string}`
  signers: `0x${string}`[]
  signedCount: number
  isComplete: boolean
  hasSigned: boolean
  createdAt?: number
}

interface SignatureCardProps {
  instance: SignatureInstance
  currentAddress: `0x${string}`
  onSign: (instanceId: bigint) => Promise<void>
  isSigning: boolean
  signingInstanceId?: bigint
}

export function SignatureCard({
  instance,
  currentAddress,
  onSign,
  isSigning,
  signingInstanceId,
}: SignatureCardProps) {
  const [copied, setCopied] = useState(false)
  const isThisSigning = isSigning && signingInstanceId === instance.instanceId

  const handleCopyLink = async () => {
    const url = `${window.location.origin}?instance=${instance.nonce.toString()}`
    if (await copyToClipboard(url)) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const statusVariant = instance.isComplete
    ? 'success'
    : instance.hasSigned
      ? 'info'
      : 'warning'

  const statusText = instance.isComplete
    ? 'Complete'
    : instance.hasSigned
      ? 'Signed'
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
          <div className="flex items-start justify-between mb-4">
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
                    #{instance.nonce.toString()}
                  </span>
                  <span className="text-muted">·</span>
                  <Badge variant={statusVariant} className="text-xs py-0">
                    {statusText}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Copy link button */}
            <button
              onClick={handleCopyLink}
              className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-card-hover transition-colors"
              title="Copy share link"
            >
              {copied ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Signers */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-muted" />
              <span className="text-sm text-muted-foreground">
                {instance.signedCount} of {instance.signers.length} signed
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {instance.signers.map((signer, index) => {
                // Determine if this signer has signed (we'd need actual data, for now show based on order)
                const hasSigned = index < instance.signedCount
                const isCurrentUser = signer.toLowerCase() === currentAddress.toLowerCase()

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
                    {!hasSigned && isCurrentUser && <Clock className="w-3 h-3" />}
                    <span>{truncateAddress(signer, 4)}</span>
                    {isCurrentUser && (
                      <span className="text-primary ml-1">(you)</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Action */}
          {!instance.isComplete && !instance.hasSigned && (
            <Button
              onClick={() => onSign(instance.instanceId)}
              loading={isThisSigning}
              disabled={isSigning}
              icon={<Pen className="w-4 h-4" />}
              className="w-full"
            >
              Sign Document
            </Button>
          )}

          {instance.hasSigned && !instance.isComplete && (
            <div className="flex items-center justify-center gap-2 px-4 py-3 bg-info/10 border border-info/20 rounded-lg text-info text-sm">
              <Check className="w-4 h-4" />
              <span>You've signed - waiting for others</span>
              <ProgressDots />
            </div>
          )}

          {instance.isComplete && (
            <div className="flex items-center justify-center gap-2 px-4 py-3 bg-success/10 border border-success/20 rounded-lg text-success text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>All signatures collected</span>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
