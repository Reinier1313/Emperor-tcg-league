'use client'

import { useState, useEffect } from 'react'
import { useLeagueStore, Player, ApexRank, getRoleDisplayName, getRoleColor, UserRole, LeagueStage } from '@/lib/store'
import { fetchPlayersFromSupabase } from '@/lib/supabaseIntegration'
import { PokeballIcon, PokeballSmall } from './pokeball-icon'
import { TrainerCard } from './trainer-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ArrowLeft, Search, User, Trophy, Zap, Shield, Crown, UserCog, Loader2, CalendarDays, Mail, Medal, BarChart2, Hash } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface PlayerDirectoryProps {
  onBack: () => void
}

// Rank colors for Apex League ranks
const apexRankColors: Record<ApexRank, { bg: string; text: string; border: string }> = {
  Rookie: { bg: 'bg-zinc-100', text: 'text-zinc-700', border: 'border-zinc-300' },
  Ace: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
  Rival: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  Elite: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  Veteran: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
  Dominator: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  Supreme: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  Apex: { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-300' },
  Ascended: { bg: 'bg-amber-200', text: 'text-amber-800', border: 'border-amber-400' },
  Invictus: { bg: 'bg-rose-200', text: 'text-rose-800', border: 'border-rose-400' },
}

export function PlayerDirectory({ onBack }: PlayerDirectoryProps) {
  const { calculateRank } = useLeagueStore()
  
  // State for live database players
  const [dbPlayers, setDbPlayers] = useState<Player[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  
  // Fetch live players from Supabase on mount
  useEffect(() => {
    let isMounted = true
    const loadPlayers = async () => {
      setIsLoading(true)
      try {
        const res = await fetchPlayersFromSupabase()
        
        if (res.success && res.players && isMounted) {
          const mapped = res.players.map((p: any) => {
            // Safely unwrap Supabase joined data (handles arrays or direct objects)
            const prog = Array.isArray(p.progression) ? p.progression[0] : (p.progression || {})
            const roleObj = Array.isArray(p.user_role) ? p.user_role[0] : (p.user_role || {})
            const bp = prog.bp || 0

            return {
              id: p.trainer_id || 'ID PENDING',
              dbUserId: p.user_id || p.id || '',
              email: p.email || '',
              firstName: p.full_name?.split(' ')[0] || '',
              lastName: p.full_name?.split(' ').slice(1).join(' ') || '',
              trainerName: p.username || 'Unknown Trainer',
              password: '', 
              role: (roleObj.role || p.role || 'user') as UserRole,
              bp: bp,
              apexRank: calculateRank(bp),
              wins: prog.wins || 0,
              losses: prog.losses || 0,
              streak: prog.streak || 0,
              currentLeague: (prog.current_league || 'pokeball_1') as LeagueStage,
              gymBadges: prog.gym_badges || {},
              eliteFourBadges: prog.elite_four_badges || [],
              championBadge: prog.champion_badge || false,
              emperorTitle: prog.emperor_title || null,
              createdAt: p.created_at || new Date().toISOString()
            }
          })
          setDbPlayers(mapped)
        }
      } catch (error) {
        console.error("Error fetching live players:", error)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    
    loadPlayers()
    return () => { isMounted = false }
  }, [calculateRank])

  const filteredPlayers = dbPlayers.filter(player => 
    player.trainerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${player.firstName} ${player.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  // Sort by BP (highest first), then by wins
  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    if (b.bp !== a.bp) return b.bp - a.bp
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
              <div className="flex flex-col items-center text-center">
                <PokeballIcon size={48} className="mb-4" />
                <div className="relative w-full max-w-[300px] md:max-w-[400px] aspect-[4/1]">
                  <Image
                    src="/emperor-tcg.png"
                    alt="Emperor TCG League"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
                <h2 className="text-primary-foreground/80 mt-2">Official Trainer Registry</h2>
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
              {isLoading ? 'Loading Trainers...' : `${sortedPlayers.length} ${sortedPlayers.length === 1 ? 'Trainer' : 'Trainers'} registered`}
            </span>
          </div>
        </div>
        
        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-card-foreground">Connecting to Supabase...</h3>
            <p className="text-muted-foreground">Downloading live player data</p>
          </div>
        ) : sortedPlayers.length === 0 ? (
          <div className="text-center py-12">
            <PokeballIcon size={64} className="mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-semibold text-card-foreground mb-2">No trainers found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? 'Try a different search term' : 'Be the first to register!'}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedPlayers.map((player, index) => {
              const rankStyle = apexRankColors[player.apexRank]
              const roleStyle = getRoleColor(player.role)
              const isStaff = player.role !== 'user'
              
              return (
                <Card 
                  key={player.id}
                  className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1"
                  onClick={() => setSelectedPlayer(player)}
                >
                  <CardContent className="p-4 relative">
                    {/* Leaderboard position for top 3 */}
                    {index < 3 && (
                      <div className={cn(
                        'absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm',
                        index === 0 && 'bg-amber-400 text-amber-900',
                        index === 1 && 'bg-zinc-300 text-zinc-800',
                        index === 2 && 'bg-amber-600 text-amber-100'
                      )}>
                        {index + 1}
                      </div>
                    )}
                    
                    {/* Top section with avatar and role */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center shrink-0',
                        isStaff ? roleStyle.bg : 'bg-muted border-2 border-primary/20'
                      )}>
                        {player.role === 'super_admin' ? (
                          <Crown className="w-6 h-6 text-amber-600" />
                        ) : player.role === 'admin' ? (
                          <Shield className="w-6 h-6 text-purple-600" />
                        ) : player.role === 'moderator' ? (
                          <UserCog className="w-6 h-6 text-blue-600" />
                        ) : (
                          <User className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <h3 className="font-bold text-card-foreground truncate">{player.trainerName}</h3>
                          {isStaff && (
                            <span className={cn(
                              'px-1 py-0.5 rounded text-[8px] font-semibold shrink-0',
                              roleStyle.bg, roleStyle.text
                            )}>
                              {getRoleDisplayName(player.role)}
                            </span>
                          )}
                        </div>
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
                        {player.apexRank}
                      </span>
                    </div>
                    
                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-1 pt-3 border-t border-border">
                      <div className="text-center">
                        <p className="text-sm font-bold text-card-foreground">{player.wins}</p>
                        <p className="text-[9px] text-muted-foreground uppercase">Wins</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-card-foreground">{player.losses}</p>
                        <p className="text-[9px] text-muted-foreground uppercase">Losses</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-card-foreground">{player.streak}</p>
                        <p className="text-[9px] text-muted-foreground uppercase">Streak</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-0.5">
                          <Zap className="w-3 h-3 text-primary" />
                          <p className="text-sm font-bold text-card-foreground">{player.bp}</p>
                        </div>
                        <p className="text-[9px] text-muted-foreground uppercase">BP</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
      
      {/* Player Profile Detailed Modal */}
      <Dialog open={!!selectedPlayer} onOpenChange={(open) => !open && setSelectedPlayer(null)}>
        <DialogContent className="max-w-md md:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Trophy className="w-5 h-5 text-primary" />
              Trainer Profile
            </DialogTitle>
          </DialogHeader>
          
          {selectedPlayer && (
            <div className="space-y-6 pt-4 pb-2">
              {/* Center the Trainer Card at the top */}
              <div className="flex justify-center">
                <TrainerCard player={selectedPlayer} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Trainer Information */}
                <div className="bg-card border rounded-lg p-4 space-y-4">
                  <h3 className="font-semibold flex items-center gap-2 border-b pb-2">
                    <User className="w-4 h-4 text-primary" />
                    Trainer Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground flex items-center gap-1 mb-1"><Hash className="w-3 h-3"/> Trainer ID</p>
                      <p className="font-medium font-mono">{selectedPlayer.id}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground flex items-center gap-1 mb-1"><User className="w-3 h-3"/> Real Name</p>
                      <p className="font-medium">{selectedPlayer.firstName} {selectedPlayer.lastName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground flex items-center gap-1 mb-1"><CalendarDays className="w-3 h-3"/> Joined</p>
                      <p className="font-medium">{new Date(selectedPlayer.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* League Progress */}
                <div className="bg-card border rounded-lg p-4 space-y-4">
                  <h3 className="font-semibold flex items-center gap-2 border-b pb-2">
                    <Medal className="w-4 h-4 text-primary" />
                    League Progress
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Current League:</span>
                      <span className="font-semibold uppercase tracking-wider bg-primary/10 text-primary px-2 py-1 rounded text-xs">
                        {selectedPlayer.currentLeague.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Gym Badges (Current):</span>
                      <span className="font-semibold">
                        {/* Safe optional chaining ? added below to prevent crashes if JSONB is missing data */}
                        {selectedPlayer.gymBadges?.[selectedPlayer.currentLeague]?.filter(b => b.earned).length || 0} / 8
                      </span>
                    </div>
                    {selectedPlayer.championBadge && (
                      <div className="flex justify-between items-center pt-1 border-t">
                        <span className="text-muted-foreground">Status:</span>
                        <span className="font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded text-xs">
                          LEAGUE CHAMPION
                        </span>
                      </div>
                    )}
                    {selectedPlayer.emperorTitle && (
                      <div className="flex justify-between items-center pt-1 border-t">
                        <span className="text-muted-foreground">Emperor Title:</span>
                        <span className="font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded text-xs uppercase">
                          {selectedPlayer.emperorTitle.replace('_', ' ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Battle Statistics */}
              <div className="bg-card border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold flex items-center gap-2 border-b pb-2">
                  <BarChart2 className="w-4 h-4 text-primary" />
                  Battle Statistics
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-muted rounded-md p-3 text-center">
                    <p className="text-2xl font-bold text-foreground">{selectedPlayer.wins}</p>
                    <p className="text-[10px] uppercase text-muted-foreground font-semibold mt-1">Wins</p>
                  </div>
                  <div className="bg-muted rounded-md p-3 text-center">
                    <p className="text-2xl font-bold text-foreground">{selectedPlayer.losses}</p>
                    <p className="text-[10px] uppercase text-muted-foreground font-semibold mt-1">Losses</p>
                  </div>
                  <div className="bg-muted rounded-md p-3 text-center">
                    <p className="text-2xl font-bold text-foreground">
                      {selectedPlayer.wins + selectedPlayer.losses > 0 
                        ? Math.round((selectedPlayer.wins / (selectedPlayer.wins + selectedPlayer.losses)) * 100) 
                        : 0}%
                    </p>
                    <p className="text-[10px] uppercase text-muted-foreground font-semibold mt-1">Win Rate</p>
                  </div>
                  <div className="bg-muted rounded-md p-3 text-center">
                    <p className="text-2xl font-bold text-foreground">{selectedPlayer.streak}</p>
                    <p className="text-[10px] uppercase text-muted-foreground font-semibold mt-1">Win Streak</p>
                  </div>
                </div>
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}