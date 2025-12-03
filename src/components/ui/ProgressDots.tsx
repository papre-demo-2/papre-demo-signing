export interface ProgressDotsProps {
  total?: number
  completed?: number
  size?: 'sm' | 'md'
  className?: string
}

const sizeStyles = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
}

export function ProgressDots({ total = 3, completed = 0, size = 'md', className = '' }: ProgressDotsProps) {
  // If used as a simple loading indicator, show animated dots
  if (total <= 0) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`rounded-full bg-primary ${sizeStyles[size]}`}
            style={{
              animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {Array.from({ length: total }).map((_, i) => {
        const isFilled = i < completed
        const isCurrent = i === completed && completed < total

        return (
          <div
            key={i}
            className={`
              rounded-full transition-colors duration-200
              ${sizeStyles[size]}
              ${isFilled ? 'bg-success' : isCurrent ? 'bg-primary animate-pulse-subtle' : 'bg-border'}
            `}
          />
        )
      })}
    </div>
  )
}
