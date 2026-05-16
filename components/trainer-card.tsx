'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Player, LeagueStage, leagueRegions, ApexRank, rankThresholds } from '@/lib/store'
import { QrCode, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

interface TrainerCardProps {
  player: Player
  className?: string
}

// Pokeball badge component for gym badges
function PokeballBadge({ 
  earned, 
  size = 'md',
  variant = 'dark'
}: { 
  earned: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'dark' | 'light'
}) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }
  
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn(sizeClasses[size])}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Top half */}
      <path
        d="M50 5C25.2 5 5 25.2 5 50h90C95 25.2 74.8 5 50 5z"
        fill={earned ? '#1a1a1a' : (variant === 'dark' ? '#1a1a1a' : '#d1d5db')}
        fillOpacity={earned ? 1 : 0.3}
      />
      {/* Bottom half */}
      <path
        d="M5 50c0 24.8 20.2 45 45 45s45-20.2 45-45H5z"
        fill={earned ? 'white' : (variant === 'dark' ? 'white' : '#f3f4f6')}
        fillOpacity={earned ? 1 : 0.3}
      />
      {/* Center line */}
      <rect 
        x="5" 
        y="47" 
        width="90" 
        height="6" 
        fill={earned ? '#1a1a1a' : (variant === 'dark' ? '#1a1a1a' : '#9ca3af')}
        fillOpacity={earned ? 1 : 0.3}
      />
      {/* Outer circle */}
      <circle 
        cx="50" 
        cy="50" 
        r="45" 
        stroke={earned ? '#1a1a1a' : (variant === 'dark' ? '#1a1a1a' : '#9ca3af')}
        strokeWidth="4" 
        fill="none"
        strokeOpacity={earned ? 1 : 0.3}
      />
      {/* Center button outer */}
      <circle 
        cx="50" 
        cy="50" 
        r="15" 
        fill={earned ? '#1a1a1a' : (variant === 'dark' ? '#1a1a1a' : '#9ca3af')}
        fillOpacity={earned ? 1 : 0.3}
      />
      {/* Center button inner */}
      <circle 
        cx="50" 
        cy="50" 
        r="10" 
        fill={earned ? 'white' : (variant === 'dark' ? 'white' : '#e5e7eb')}
        fillOpacity={earned ? 1 : 0.5}
      />
    </svg>
  )
}

// Large center pokeball that shows win progress
function CenterPokeball({ 
  wins, 
  filled = false 
}: { 
  wins: number
  filled?: boolean 
}) {
  const showFill = filled || wins > 0
  
  return (
    <svg
      viewBox="0 0 100 100"
      className="w-24 h-24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer ring */}
      <circle cx="50" cy="50" r="45" stroke="#374151" strokeWidth="8" fill="none" />
      {/* Inner white circle */}
      <circle cx="50" cy="50" r="38" fill="white" />
      {/* Center fill (shows progress) */}
      {showFill && <circle cx="50" cy="50" r="20" fill="#374151" />}
      {/* Center white dot */}
      <circle cx="50" cy="50" r={showFill ? 8 : 12} fill="white" />
    </svg>
  )
}

// Corner frame decorations
function CornerFrame({ 
  position, 
  color = 'white' 
}: { 
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  color?: 'white' | 'red' | 'black'
}) {
  const colorClass = {
    white: 'border-white',
    red: 'border-primary',
    black: 'border-foreground',
  }[color]
  
  const positionClasses = {
    'top-left': 'top-3 left-3 border-l-2 border-t-2',
    'top-right': 'top-3 right-3 border-r-2 border-t-2',
    'bottom-left': 'bottom-3 left-3 border-l-2 border-b-2',
    'bottom-right': 'bottom-3 right-3 border-r-2 border-b-2',
  }
  
  return (
    <div className={cn('absolute w-6 h-6', positionClasses[position], colorClass)} />
  )
}

// Get current league display info
function getLeagueInfo(league: LeagueStage | undefined): { name: string; number: number; type: 'pokeball' | 'greatball' | 'ultraball' | 'masterball' } {
  const safeLeague = league || 'pokeball_1'
  const mapping: Record<string, { name: string; number: number; type: 'pokeball' | 'greatball' | 'ultraball' | 'masterball' }> = {
    pokeball_1: { name: 'LEAGUE ONE', number: 1, type: 'pokeball' },
    pokeball_2: { name: 'LEAGUE TWO', number: 2, type: 'pokeball' },
    pokeball_3: { name: 'LEAGUE THREE', number: 3, type: 'pokeball' },
    greatball_1: { name: 'LEAGUE ONE', number: 1, type: 'greatball' },
    greatball_2: { name: 'LEAGUE TWO', number: 2, type: 'greatball' },
    greatball_3: { name: 'LEAGUE THREE', number: 3, type: 'greatball' },
    ultraball_1: { name: 'LEAGUE ONE', number: 1, type: 'ultraball' },
    ultraball_2: { name: 'LEAGUE TWO', number: 2, type: 'ultraball' },
    ultraball_3: { name: 'LEAGUE THREE', number: 3, type: 'ultraball' },
    masterball: { name: 'MASTER LEAGUE', number: 0, type: 'masterball' },
  }
  return mapping[safeLeague] || mapping.pokeball_1
}

// Get rank color for display
function getRankColor(rank: ApexRank | undefined): string {
  const safeRank = rank || 'Rookie'
  const colors: Record<string, string> = {
    Rookie: 'text-zinc-600',
    Ace: 'text-amber-600',
    Rival: 'text-blue-600',
    Elite: 'text-purple-600',
    Veteran: 'text-emerald-600',
    Dominator: 'text-orange-600',
    Supreme: 'text-red-600',
    Apex: 'text-cyan-600',
    Ascended: 'text-amber-500',
    Invictus: 'text-rose-500',
  }
  return colors[safeRank] || colors.Rookie
}

export function TrainerCard({ player, className }: TrainerCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  
  // SAFE FALLBACKS: Ensure the card doesn't crash if Supabase data is missing
  const safeLeague = player.currentLeague || 'pokeball_1'
  const leagueInfo = getLeagueInfo(safeLeague)
  
  // Create a default array of 8 empty badges if none exist for this user yet
  const safeBadges = player.gymBadges && Array.isArray(player.gymBadges[safeLeague]) 
    ? player.gymBadges[safeLeague] 
    : Array(8).fill({ earned: false })

  // Safely count earned badges
  const earnedBadges = safeBadges.filter(b => b.earned).length

  return (
    <div className={cn('w-full max-w-md mx-auto', className)}>
      <div 
        className="perspective-1000 cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div 
          className={cn(
            'relative w-full aspect-[16/10] preserve-3d transition-transform duration-700',
            isFlipped && 'rotate-y-180'
          )}
        >
          {/* Front Side */}
          <div className="absolute inset-0 backface-hidden">
            <div className="h-full w-full rounded-xl overflow-hidden shadow-2xl border-2 border-foreground/20">
              {/* Top Red Section (60%) */}
              <div className="h-[55%] bg-primary relative overflow-hidden">
                <CornerFrame position="top-left" color="white" />
                <CornerFrame position="top-right" color="white" />
                
                {/* Username/QR Zone (top left) */}
                <div className="absolute top-4 left-10">
                  <p className="text-[10px] text-primary-foreground/70 uppercase tracking-wider font-bold mb-1">
                    @{player.trainerName ? player.trainerName.toUpperCase().replace(/\s/g, '') : 'UNKNOWN'}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-primary-foreground/20 rounded flex items-center justify-center">
                      <QrCode className="w-6 h-6 text-primary-foreground/60" />
                    </div>
                  </div>
                </div>
                
                {/* Center Logo */}
                <div className="absolute inset-0 flex items-center justify-center pt-2">
                  <div className="relative w-40 md:w-56 aspect-[3/1]">
                    <Image
                      src="/emperor-tcg.png"
                      alt="Emperor TCG League"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                </div>
                
                {/* Sticker Zone (top right) */}
                <div className="absolute top-4 right-4">
                  <div className="w-16 h-12 bg-primary-foreground/20 rounded border border-primary-foreground/30 flex items-center justify-center">
                    <span className="text-[8px] text-primary-foreground/60 uppercase text-center leading-tight">
                      Sticker<br/>Zone
                    </span>
                  </div>
                </div>
                
                {/* Decorative pokeballs on sides */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30">
                  <PokeballBadge earned={false} size="lg" variant="light" />
                </div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30">
                  <PokeballBadge earned={false} size="lg" variant="light" />
                </div>
              </div>
              
              {/* Center Divider with Pokeball */}
              <div className="h-1 bg-foreground relative">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                  <CenterPokeball wins={player.wins || 0} filled={earnedBadges > 0} />
                </div>
              </div>
              
              {/* Bottom White Section (40%) */}
              <div className="h-[calc(45%-4px)] bg-card relative">
                <CornerFrame position="bottom-left" color="red" />
                <CornerFrame position="bottom-right" color="red" />
                
                {/* Decorative pokeballs */}
                <div className="absolute left-4 bottom-4">
                  <PokeballBadge earned={true} size="md" />
                </div>
                <div className="absolute right-4 bottom-4">
                  <PokeballBadge earned={true} size="md" />
                </div>
                
                {/* League name */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-px bg-foreground/30" />
                    <span className="text-sm font-bold text-foreground tracking-wider">
                      {leagueInfo.name}
                    </span>
                    <div className="w-4 h-px bg-foreground/30" />
                  </div>
                </div>
                
                {/* Player info at very bottom corners */}
                <div className="absolute bottom-1 left-10 text-[8px] text-muted-foreground font-mono">
                  {player.id}
                </div>
                <div className="absolute bottom-1 right-10 text-[8px] text-muted-foreground">
                  {leagueRegions[safeLeague as LeagueStage] || 'Unknown Region'}
                </div>
              </div>
            </div>
          </div>
          
          {/* Back Side - Gym Badges */}
          <div className="absolute inset-0 backface-hidden rotate-y-180">
            <div className="h-full w-full rounded-xl overflow-hidden shadow-2xl border-2 border-foreground/20">
              {/* Top Red Section with 4 badges */}
              <div className="h-[50%] bg-primary relative overflow-hidden">
                <CornerFrame position="top-left" color="white" />
                <CornerFrame position="top-right" color="white" />
                
                {/* 4 Gym badges row */}
                <div className="absolute inset-0 flex items-center justify-center gap-4 px-8">
                  {safeBadges.slice(0, 4).map((badge, i) => (
                    <PokeballBadge key={i} earned={badge.earned} size="lg" variant="dark" />
                  ))}
                </div>
              </div>
              
              {/* Divider */}
              <div className="h-1 bg-foreground" />
              
              {/* Bottom White Section with 4 badges */}
              <div className="h-[calc(50%-4px)] bg-card relative">
                <div className="absolute bottom-3 left-3 w-6 h-6 border-l-2 border-b-2 border-foreground" />
                <div className="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 border-primary" />
                
                {/* 4 Gym badges row */}
                <div className="absolute inset-0 flex items-center justify-center gap-4 px-8">
                  {safeBadges.slice(4, 8).map((badge, i) => (
                    <PokeballBadge key={i + 4} earned={badge.earned} size="lg" variant="light" />
                  ))}
                </div>
                
                {/* Badge count */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground font-mono">
                  {earnedBadges}/8 Badges Earned
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Flip button and stats */}
      <div className="flex items-center justify-between mt-4 px-2">
        <div className="text-sm">
          <span className="text-muted-foreground">BP: </span>
          <span className="font-bold text-foreground">{player.bp || 0}</span>
          <span className="text-muted-foreground mx-2">|</span>
          <span className={cn('font-semibold', getRankColor(player.apexRank))}>
            {player.apexRank || 'Rookie'}
          </span>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            setIsFlipped(!isFlipped)
          }}
          className="gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Flip Card
        </Button>
      </div>
    </div>
  )
}