'use client'

import { cn } from '@/lib/utils'

interface PokeballIconProps {
  className?: string
  size?: number
}

export function PokeballIcon({ className, size = 24 }: PokeballIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={cn('', className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Top half - red */}
      <path
        d="M50 5C25.2 5 5 25.2 5 50h90C95 25.2 74.8 5 50 5z"
        fill="currentColor"
        className="text-primary"
      />
      {/* Bottom half - white */}
      <path
        d="M5 50c0 24.8 20.2 45 45 45s45-20.2 45-45H5z"
        fill="currentColor"
        className="text-card"
      />
      {/* Center line */}
      <rect x="5" y="47" width="90" height="6" fill="currentColor" className="text-foreground" />
      {/* Outer circle */}
      <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="4" className="text-foreground" fill="none" />
      {/* Center button outer */}
      <circle cx="50" cy="50" r="15" fill="currentColor" className="text-foreground" />
      {/* Center button inner */}
      <circle cx="50" cy="50" r="10" fill="currentColor" className="text-card" />
      {/* Center button highlight */}
      <circle cx="50" cy="50" r="6" fill="currentColor" className="text-muted" />
    </svg>
  )
}

export function PokeballSmall({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 100 100"
      className={cn('inline-block', className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M50 5C25.2 5 5 25.2 5 50h90C95 25.2 74.8 5 50 5z" fill="#DC2626" />
      <path d="M5 50c0 24.8 20.2 45 45 45s45-20.2 45-45H5z" fill="white" />
      <rect x="5" y="47" width="90" height="6" fill="#1a1a1a" />
      <circle cx="50" cy="50" r="45" stroke="#1a1a1a" strokeWidth="4" fill="none" />
      <circle cx="50" cy="50" r="15" fill="#1a1a1a" />
      <circle cx="50" cy="50" r="10" fill="white" />
    </svg>
  )
}
