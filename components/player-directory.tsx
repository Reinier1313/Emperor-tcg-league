'use client'

import { useState } from 'react'
import { useLeagueStore, Player, Rank } from '@/lib/store'
import { PokeballIcon, PokeballSmall } from './pokeball-icon'
import { TrainerCard } from './trainer-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ArrowLeft, Search, User, Award, Trophy, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PlayerDirectoryProps {
  onBack: () => void
}

const rankColors: Record<Rank, { bg: string; text: string; border: string }> = {
  Beginner: { bg: 'bg-zinc-100', text: 'text-zinc-700', border: 'border-zinc-300' },
  Rookie: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
  Elite: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  Master: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
  Champion: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30' },
}

export function PlayerDirectory({ onBack }: PlayerDirectoryProps) {
  const { players } = useLeagueStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  
  const filteredPlayers = players.filter(player => 
    player.trainerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${player.firstName} ${player.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  // Sort by rank and wins
  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    const rankOrder = ['Champion', 'Master', 'Elite', 'Rookie', 'Beginner']
    const rankDiff = rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank)
    if (rankDiff !== 0) return rankDiff
    return b.wins - a.wins
  })
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-2 left-[5%]"><PokeballIcon size={30} /></div>
          <div className="absolute top-4 right-[10%]"><PokeballIcon size={25} /></div>
        </div>
        
        <div className="container mx-auto px-4 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onBack}
                className="text-primary-foreground hover:bg-primary-foreground/10"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl md:text-2xl font-black tracking-wider">Tondo Battle LEAGUE</h1>
                <p className="text-xs text-primary-foreground/70">Player Directory</p>
              </div>
            </div>
            <PokeballIcon size={36} />
          </div>
        </div>
      </header>
      
      {/* Search Bar */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or trainer ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Summary */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-muted-foreground" />
            <span className="text-muted-foreground">
              {sortedPlayers.length} {sortedPlayers.length === 1 ? 'Trainer' : 'Trainers'} registered
            </span>
          </div>
        </div>
        
        {/* Player Grid */}
        {sortedPlayers.length === 0 ? (
          <div className="text-center py-12">
            <PokeballIcon size={64} className="mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-semibold text-card-foreground mb-2">No trainers found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? 'Try a different search term' : 'Be the first to register!'}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedPlayers.map((player) => {
              const rankStyle = rankColors[player.rank]
              return (
                <Card 
                  key={player.id}
                  className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1"
                  onClick={() => setSelectedPlayer(player)}
                >
                  <CardContent className="p-4">
                    {/* Top section with avatar and rank */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-muted border-2 border-primary/20 flex items-center justify-center shrink-0">
                        <User className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-card-foreground truncate">{player.trainerName}</h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {player.firstName} {player.lastName}
                        </p>
                      </div>
                    </div>
                    
                    {/* ID and Rank */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                        <PokeballSmall />
                        {player.id}
                      </span>
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-semibold border',
                        rankStyle.bg, rankStyle.text, rankStyle.border
                      )}>
                        {player.rank}
                      </span>
                    </div>
                    
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
                      <div className="text-center">
                        <p className="text-sm font-bold text-card-foreground">{player.wins}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Wins</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-card-foreground">{player.losses}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Losses</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-card-foreground">{player.streak}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Streak</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
      
      {/* Player Profile Modal */}
      <Dialog open={!!selectedPlayer} onOpenChange={() => setSelectedPlayer(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Trainer Profile
            </DialogTitle>
          </DialogHeader>
          {selectedPlayer && (
            <div className="pt-2">
              <TrainerCard player={selectedPlayer} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
