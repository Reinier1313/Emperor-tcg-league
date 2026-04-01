'use client'

import { useState } from 'react'
import { useLeagueStore, Player, Rank } from '@/lib/store'
import { PokeballIcon, PokeballSmall } from './pokeball-icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ArrowLeft, Search, User, Award, Settings, Save, 
  CheckCircle2, Users, Shield, Lock, LogOut, Eye, EyeOff
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminPanelProps {
  onBack: () => void
}

const ranks: Rank[] = ['Beginner', 'Rookie', 'Elite', 'Master', 'Champion']

const rankColors: Record<Rank, { bg: string; text: string; border: string }> = {
  Beginner: { bg: 'bg-zinc-100', text: 'text-zinc-700', border: 'border-zinc-300' },
  Rookie: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
  Elite: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  Master: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
  Champion: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30' },
}

function AdminLogin({ onBack }: { onBack: () => void }) {
  const { adminLogin } = useLeagueStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    // Small delay for UX
    setTimeout(() => {
      const result = adminLogin(username, password)
      if (!result.success) {
        setError(result.message)
        setPassword('')
      }
      setIsLoading(false)
    }, 500)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[5%] opacity-5"><PokeballIcon size={120} /></div>
        <div className="absolute bottom-[15%] right-[8%] opacity-5"><PokeballIcon size={80} /></div>
        <div className="absolute top-[40%] right-[15%] opacity-5"><PokeballIcon size={60} /></div>
      </div>
      
      <Card className="w-full max-w-md relative">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onBack}
          className="absolute top-4 left-4"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <CardHeader className="text-center pt-12">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-black tracking-wide">ADMIN ACCESS</CardTitle>
          <CardDescription>Enter your admin credentials to continue</CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-username" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Username
              </Label>
              <Input
                id="admin-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="admin-password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </Label>
              <div className="relative">
                <Input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}
            
            <Button type="submit" className="w-full gap-2" disabled={isLoading || !username || !password}>
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Access Admin Panel
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export function AdminPanel({ onBack }: AdminPanelProps) {
  const { players, updatePlayerRank, updatePlayerStats, isAdminAuthenticated, adminLogout } = useLeagueStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [editedRank, setEditedRank] = useState<Rank>('Beginner')
  const [editedWins, setEditedWins] = useState('')
  const [editedLosses, setEditedLosses] = useState('')
  const [editedStreak, setEditedStreak] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  
  // Show login screen if not authenticated
  if (!isAdminAuthenticated) {
    return <AdminLogin onBack={onBack} />
  }
  
  const filteredPlayers = players.filter(player => 
    player.trainerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.id.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const handleSelectPlayer = (player: Player) => {
    setSelectedPlayer(player)
    setEditedRank(player.rank)
    setEditedWins(player.wins.toString())
    setEditedLosses(player.losses.toString())
    setEditedStreak(player.streak.toString())
    setSaveSuccess(false)
  }
  
  const handleSave = () => {
    if (!selectedPlayer) return
    
    const wins = parseInt(editedWins) || 0
    const losses = parseInt(editedLosses) || 0
    const streak = parseInt(editedStreak) || 0
    
    updatePlayerRank(selectedPlayer.id, editedRank)
    updatePlayerStats(selectedPlayer.id, wins, losses, streak)
    
    // Update local selected player state
    setSelectedPlayer({
      ...selectedPlayer,
      rank: editedRank,
      wins,
      losses,
      streak
    })
    
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2000)
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-accent text-accent-foreground py-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
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
                className="text-accent-foreground hover:bg-accent-foreground/10"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                <div>
                  <h1 className="text-xl md:text-2xl font-black tracking-wider">ADMIN PANEL</h1>
                  <p className="text-xs text-accent-foreground/70">Rank & Stats Management</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => {
                  adminLogout()
                  onBack()
                }}
                className="h-10 w-10 text-accent-foreground hover:bg-accent-foreground/10"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </Button>
              <PokeballIcon size={36} />
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Player List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  All Players
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search players..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {/* Player List */}
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {filteredPlayers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No players found</p>
                  ) : (
                    filteredPlayers.map((player) => {
                      const rankStyle = rankColors[player.rank]
                      const isSelected = selectedPlayer?.id === player.id
                      return (
                        <button
                          key={player.id}
                          onClick={() => handleSelectPlayer(player)}
                          className={cn(
                            'w-full p-3 rounded-lg text-left transition-all',
                            'border hover:border-primary/50',
                            isSelected 
                              ? 'bg-primary/5 border-primary' 
                              : 'bg-card border-border hover:bg-muted/50'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                              <User className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-card-foreground truncate">
                                {player.trainerName}
                              </p>
                              <p className="text-xs text-muted-foreground font-mono">
                                {player.id}
                              </p>
                            </div>
                            <span className={cn(
                              'px-2 py-0.5 rounded-full text-xs font-semibold border shrink-0',
                              rankStyle.bg, rankStyle.text, rankStyle.border
                            )}>
                              {player.rank}
                            </span>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Edit Panel */}
          <div className="lg:col-span-2">
            {selectedPlayer ? (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Edit Player
                    </CardTitle>
                    {saveSuccess && (
                      <span className="flex items-center gap-1 text-sm text-emerald-600">
                        <CheckCircle2 className="w-4 h-4" />
                        Saved!
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Player Info (Read-only) */}
                  <div className="p-4 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-card border-2 border-primary/20 flex items-center justify-center">
                        <User className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-card-foreground">{selectedPlayer.trainerName}</h3>
                        <p className="text-muted-foreground">{selectedPlayer.firstName} {selectedPlayer.lastName}</p>
                        <p className="text-sm font-mono text-muted-foreground flex items-center gap-1 mt-1">
                          <PokeballSmall />
                          {selectedPlayer.id}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Editable Fields */}
                  <div className="grid sm:grid-cols-2 gap-6">
                    {/* Rank */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        Rank
                      </Label>
                      <Select value={editedRank} onValueChange={(v) => setEditedRank(v as Rank)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ranks.map((rank) => (
                            <SelectItem key={rank} value={rank}>
                              {rank}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Wins */}
                    <div className="space-y-2">
                      <Label>Wins</Label>
                      <Input
                        type="number"
                        min="0"
                        value={editedWins}
                        onChange={(e) => setEditedWins(e.target.value)}
                      />
                    </div>
                    
                    {/* Losses */}
                    <div className="space-y-2">
                      <Label>Losses</Label>
                      <Input
                        type="number"
                        min="0"
                        value={editedLosses}
                        onChange={(e) => setEditedLosses(e.target.value)}
                      />
                    </div>
                    
                    {/* Win Streak */}
                    <div className="space-y-2">
                      <Label>Win Streak</Label>
                      <Input
                        type="number"
                        min="0"
                        value={editedStreak}
                        onChange={(e) => setEditedStreak(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  {/* Save Button */}
                  <Button onClick={handleSave} className="w-full gap-2">
                    <Save className="w-4 h-4" />
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center min-h-[400px]">
                <div className="text-center p-8">
                  <PokeballIcon size={64} className="mx-auto mb-4 opacity-20" />
                  <h3 className="text-lg font-semibold text-card-foreground mb-2">Select a Player</h3>
                  <p className="text-muted-foreground">
                    Choose a player from the list to edit their rank and stats
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
