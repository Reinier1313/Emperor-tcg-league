'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { PokeballSmall } from './pokeball-icon'
import { Player, Rank } from '@/lib/store'
import { User, QrCode, Award, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TrainerCardProps {
  player: Player
  className?: string
}

const rankColors: Record<Rank, { bg: string; text: string; border: string }> = {
  Beginner: { bg: 'bg-zinc-100', text: 'text-zinc-700', border: 'border-zinc-300' },
  Rookie: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
  Elite: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  Master: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
  Champion: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30' },
}

const rankBadges: Record<Rank, number> = {
  Beginner: 0,
  Rookie: 1,
  Elite: 2,
  Master: 3,
  Champion: 4,
}

export function TrainerCard({ player, className }: TrainerCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const rankStyle = rankColors[player.rank]

  return (
    <div className={cn('w-full max-w-sm mx-auto', className)}>
      <div 
        className="perspective-1000 cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div 
          className={cn(
            'relative w-full aspect-[3/4] preserve-3d transition-transform duration-700',
            isFlipped && 'rotate-y-180'
          )}
        >
          {/* Front Side */}
          <div className="absolute inset-0 backface-hidden">
            <div className="h-full w-full rounded-2xl overflow-hidden shadow-2xl border-2 border-foreground/10">
              {/* Top Red Section */}
              <div className="h-[35%] bg-primary relative overflow-hidden">
                {/* Decorative corner lines */}
                <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-primary-foreground/30" />
                <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-primary-foreground/30" />
                
                {/* Pokeball decorations */}
                <div className="absolute top-3 left-12 opacity-40">
                  <PokeballSmall />
                </div>
                <div className="absolute top-3 right-12 opacity-40">
                  <PokeballSmall />
                </div>
                
                {/* Rules placeholder */}
                <span className="absolute top-4 left-16 text-[10px] text-primary-foreground/60 uppercase tracking-wider">
                  Rules
                </span>
                
                {/* Sponsor placeholder */}
                <span className="absolute top-4 right-16 text-[10px] text-primary-foreground/60 uppercase tracking-wider">
                  TCG
                </span>
                
                {/* Center title */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-2xl md:text-3xl font-black text-primary-foreground tracking-wider drop-shadow-lg">
                      EMPEROR TCG LEAGUE
                    </h1>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <div className="w-8 h-[2px] bg-primary-foreground/40" />
                      <PokeballSmall className="opacity-60" />
                      <div className="w-8 h-[2px] bg-primary-foreground/40" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Divider */}
              <div className="h-1 bg-foreground" />
              
              {/* Bottom White Section */}
              <div className="h-[calc(65%-4px)] bg-card p-4 flex flex-col">
                {/* Profile section */}
                <div className="flex items-start gap-4">
                  {/* Profile image placeholder */}
                  <div className="w-20 h-20 rounded-full bg-muted border-4 border-primary/20 flex items-center justify-center shrink-0">
                    <User className="w-10 h-10 text-muted-foreground" />
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-card-foreground truncate">
                      {player.trainerName}
                    </h2>
                    <p className="text-sm text-muted-foreground truncate">
                      {player.firstName} {player.lastName}
                    </p>
                    <p className="text-xs font-mono text-muted-foreground mt-1">
                      {player.id}
                    </p>
                    
                    {/* Rank Badge */}
                    <div className={cn(
                      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold mt-2 border',
                      rankStyle.bg, rankStyle.text, rankStyle.border
                    )}>
                      <Award className="w-3 h-3" />
                      {player.rank}
                    </div>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mt-4 mb-3">
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold text-card-foreground">{player.wins}</p>
                    <p className="text-[10px] uppercase text-muted-foreground tracking-wide">Wins</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold text-card-foreground">{player.losses}</p>
                    <p className="text-[10px] uppercase text-muted-foreground tracking-wide">Losses</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold text-card-foreground">{player.streak}</p>
                    <p className="text-[10px] uppercase text-muted-foreground tracking-wide">Streak</p>
                  </div>
                </div>
                
                {/* QR Code placeholder */}
                <div className="mt-auto flex items-center justify-center gap-2 p-2 rounded-lg border border-dashed border-muted-foreground/30">
                  <QrCode className="w-4 h-4 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">Scan Profile (Coming Soon)</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Back Side */}
          <div className="absolute inset-0 backface-hidden rotate-y-180">
            <div className="h-full w-full rounded-2xl overflow-hidden shadow-2xl border-2 border-foreground/10">
              {/* Top Red Section */}
              <div className="h-[30%] bg-primary relative overflow-hidden">
                {/* Pokeball row */}
                <div className="absolute inset-0 flex items-center justify-center gap-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="opacity-60">
                      <PokeballSmall />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Divider */}
              <div className="h-1 bg-foreground" />
              
              {/* Bottom White Section */}
              <div className="h-[calc(70%-4px)] bg-card p-6 flex flex-col">
                <h3 className="text-sm font-semibold text-card-foreground text-center mb-4 uppercase tracking-wider">
                  Rank Progression
                </h3>
                
                {/* Badge slots */}
                <div className="grid grid-cols-5 gap-2 flex-1">
                  {(['Beginner', 'Rookie', 'Elite', 'Master', 'Champion'] as Rank[]).map((rank, i) => {
                    const isUnlocked = rankBadges[player.rank] >= i
                    const style = rankColors[rank]
                    return (
                      <div 
                        key={rank}
                        className="flex flex-col items-center gap-2"
                      >
                        <div className={cn(
                          'w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all',
                          isUnlocked 
                            ? cn(style.bg, style.border) 
                            : 'bg-muted border-muted-foreground/20'
                        )}>
                          {isUnlocked ? (
                            <Award className={cn('w-5 h-5', style.text)} />
                          ) : (
                            <div className="w-3 h-3 rounded-full bg-muted-foreground/20" />
                          )}
                        </div>
                        <span className={cn(
                          'text-[8px] uppercase tracking-wide text-center leading-tight',
                          isUnlocked ? 'text-card-foreground font-medium' : 'text-muted-foreground'
                        )}>
                          {rank}
                        </span>
                      </div>
                    )
                  })}
                </div>
                
                {/* Trainer info summary */}
                <div className="mt-auto pt-4 border-t border-border">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Trainer:</span>
                    <span className="font-medium text-card-foreground">{player.trainerName}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-muted-foreground">ID:</span>
                    <span className="font-mono text-card-foreground">{player.id}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Flip button */}
      <div className="flex justify-center mt-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsFlipped(!isFlipped)}
          className="gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Flip Card
        </Button>
      </div>
    </div>
  )
}
