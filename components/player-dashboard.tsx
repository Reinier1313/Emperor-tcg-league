'use client'

import { useState, useEffect } from 'react'
import { 
  useLeagueStore, 
  leagueRegions, 
  rankThresholds, 
  rankIcons,
  ApexRank, 
  getRoleDisplayName, 
  getRoleColor 
} from '@/lib/store'
import { fetchPlayerByUserId, logoutFromSupabase } from '@/lib/supabaseIntegration'
import { TrainerCard } from './trainer-card'
import { PokeballIcon, PokeballSmall } from './pokeball-icon'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LogOut, Trophy, Target, Flame, Award, Users, Zap, Shield, Settings, RefreshCw, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { AccountSettingsPage } from './account-settings-page'

interface PlayerDashboardProps {
  onLogout: () => void
  onViewDirectory: () => void
}

export function PlayerDashboard({ onLogout, onViewDirectory }: PlayerDashboardProps) {
  const { currentUser, logout, setCurrentUserFromSupabase } = useLeagueStore()
  const [showSettings, setShowSettings] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // ==========================================
  // LIVE DATABASE SYNC
  // Fetches fresh stats from Supabase on load
  // ==========================================
  useEffect(() => {
    let isMounted = true
    
    const syncLiveProfile = async () => {
      // We use the hidden dbUserId to query the database securely
      if (!currentUser?.dbUserId) return
      
      setIsRefreshing(true)
      const res = await fetchPlayerByUserId(currentUser.dbUserId)
      
      if (res.success && res.player && isMounted) {
        // Updates the local store with fresh live data from Supabase
        setCurrentUserFromSupabase(res.player)
      }
      
      if (isMounted) setIsRefreshing(false)
    }

    syncLiveProfile()
    
    return () => { isMounted = false }
  }, [currentUser?.dbUserId, setCurrentUserFromSupabase])

  if (!currentUser) return null

  if (showSettings) {
    return <AccountSettingsPage onBack={() => setShowSettings(false)} />
  }

  const handleLogout = async () => {
    await logoutFromSupabase() // Kills the live database session
    logout() // Clears the local browser cache
    onLogout() // Triggers the parent component to change screens
  }
  
  const winRate = currentUser.wins + currentUser.losses > 0 
    ? Math.round((currentUser.wins / (currentUser.wins + currentUser.losses)) * 100) 
    : 0
  
  // Calculate progress to next rank
  const ranks: ApexRank[] = ['Rookie', 'Ace', 'Rival', 'Elite', 'Veteran', 'Dominator', 'Supreme', 'Apex', 'Ascended', 'Invictus']
  const currentRankIndex = ranks.indexOf(currentUser.apexRank)
  const nextRank = currentRankIndex < ranks.length - 1 ? ranks[currentRankIndex + 1] : null
  const nextRankBP = nextRank ? rankThresholds[nextRank] : null
  const currentRankBP = rankThresholds[currentUser.apexRank]
  
  // Safe math: Prevent Division by Zero
  const bpDifference = nextRankBP ? Math.max(1, nextRankBP - currentRankBP) : 1
  const progressToNext = nextRankBP 
    ? Math.min(100, Math.max(0, Math.round(((currentUser.bp - currentRankBP) / bpDifference) * 100)))
    : 100
  
  const roleStyle = getRoleColor(currentUser.role)
  const isStaff = currentUser.role !== 'user'
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-2 left-[5%]"><PokeballIcon size={30} /></div>
          <div className="absolute top-4 right-[10%]"><PokeballIcon size={25} /></div>
          <div className="absolute bottom-2 left-[20%]"><PokeballIcon size={20} /></div>
        </div>
        
        <div className="container mx-auto px-4 relative">
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
      </header>
      
      {/* Welcome Banner */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">Welcome back,</p>
                {isStaff && (
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                    roleStyle.bg, roleStyle.text, roleStyle.border
                  )}>
                    <Shield className="w-3 h-3 inline mr-1" />
                    {getRoleDisplayName(currentUser.role)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-card-foreground">{currentUser.trainerName}</h2>
                {/* FIX: Wrapped the icon in a span to handle the title attribute */}
                {isRefreshing && (
                  <span title="Syncing Live Data...">
                    <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-sm font-mono text-muted-foreground bg-muted px-3 py-1 rounded-full">
                <PokeballSmall />
                <span className="font-bold">{currentUser.id}</span>
              </div>
              <Button 
                variant="destructive" 
                size="icon"
                onClick={handleLogout}
                title="Logout"
                className="shadow-sm"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Stats */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="bg-card shadow-sm border-border">
                <CardContent className="p-4 text-center">
                  <Trophy className="w-6 h-6 mx-auto mb-2 text-amber-500" />
                  <p className="text-2xl font-bold text-card-foreground">{currentUser.wins}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Wins</p>
                </CardContent>
              </Card>
              
              <Card className="bg-card shadow-sm border-border">
                <CardContent className="p-4 text-center">
                  <Target className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold text-card-foreground">{currentUser.losses}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Losses</p>
                </CardContent>
              </Card>
              
              <Card className="bg-card shadow-sm border-border">
                <CardContent className="p-4 text-center">
                  <Flame className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                  <p className="text-2xl font-bold text-card-foreground">{currentUser.streak}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Streak</p>
                </CardContent>
              </Card>
              
              <Card className="bg-card shadow-sm border-primary/30">
                <CardContent className="p-4 text-center">
                  <Zap className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold text-primary">{currentUser.bp}</p>
                  <p className="text-xs text-primary/80 uppercase tracking-wide">BP</p>
                </CardContent>
              </Card>
            </div>
            
            {/* Apex Rank Card */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Apex League Rank
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-black text-foreground tracking-tight">{currentUser.apexRank}</p>
                    <p className="text-sm font-medium text-muted-foreground">{rankIcons[currentUser.apexRank]}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground uppercase tracking-wider">Current Points</p>
                    <p className="text-2xl font-bold text-foreground">{currentUser.bp} BP</p>
                  </div>
                </div>
                
                {nextRank && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex justify-between text-xs font-semibold text-muted-foreground mb-2">
                      <span>Progress to {nextRank}</span>
                      <span>{currentUser.bp} / {nextRankBP} BP</span>
                    </div>
                    <div className="w-full h-3 bg-muted rounded-full overflow-hidden border border-border/50">
                      <div 
                        className="h-full bg-primary transition-all duration-700 ease-out"
                        style={{ width: `${progressToNext}%` }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Trainer Info Card */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Trainer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 pt-3">
                <div className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-muted-foreground text-sm">Full Name</span>
                  <span className="font-medium text-card-foreground">{currentUser.firstName} {currentUser.lastName}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-muted-foreground text-sm">Trainer Name</span>
                  <span className="font-bold text-card-foreground">{currentUser.trainerName}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-muted-foreground text-sm">Trainer ID</span>
                  <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{currentUser.id}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-muted-foreground text-sm">Current League</span>
                  <span className="text-card-foreground font-medium">{leagueRegions[currentUser.currentLeague]}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-muted-foreground text-sm">Win Rate</span>
                  <span className="px-3 py-1 rounded-full text-sm font-bold bg-primary/10 text-primary border border-primary/20">
                    {winRate}%
                  </span>
                </div>
              </CardContent>
            </Card>
            
            {/* Navigation Options */}
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="w-full h-auto py-6 flex flex-col gap-3 shadow-sm hover:border-primary/50 transition-colors"
                onClick={onViewDirectory}
              >
                <Users className="w-8 h-8 text-muted-foreground" />
                <span className="font-semibold">Player Directory</span>
              </Button>

              <Button
                variant="outline"
                className="w-full h-auto py-6 flex flex-col gap-3 shadow-sm hover:border-primary/50 transition-colors"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="w-8 h-8 text-muted-foreground" />
                <span className="font-semibold">Account Settings</span>
              </Button>
            </div>
          </div>
          
          {/* Right Column - Trainer Card */}
          <div className="lg:sticky lg:top-8 self-start">
            <Card className="p-6 shadow-md border-primary/10">
              <h3 className="text-xl font-bold text-card-foreground mb-6 text-center tracking-tight">
                Your Digital Trainer Card
              </h3>
              <div className="transform transition-transform hover:scale-[1.02] duration-300">
                <TrainerCard player={currentUser} />
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}