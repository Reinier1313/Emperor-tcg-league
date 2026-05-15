'use client'

import { useState } from 'react'
import { 
  useLeagueStore, 
  leagueRegions, 
  rankThresholds, 
  rankIcons, // <-- Added import from store
  ApexRank, 
  getRoleDisplayName, 
  getRoleColor 
} from '@/lib/store'
import { TrainerCard } from './trainer-card'
import { PokeballIcon, PokeballSmall } from './pokeball-icon'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LogOut, Trophy, Target, Flame, Award, Users, Zap, Shield, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { AccountSettingsPage } from './account-settings-page'

interface PlayerDashboardProps {
  onLogout: () => void
  onViewDirectory: () => void
}

export function PlayerDashboard({ onLogout, onViewDirectory }: PlayerDashboardProps) {
  const { currentUser, logout, isAdminAuthenticated } = useLeagueStore()
  const [showSettings, setShowSettings] = useState(false)

  if (!currentUser) return null

  if (showSettings) {
    return <AccountSettingsPage onBack={() => setShowSettings(false)} />
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
  
  // Safe math: Prevent Division by Zero if thresholds ever get messed up
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
            {/* FIXED TAILWIND CLASSES HERE */}
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
              <h2 className="text-2xl font-bold text-card-foreground">{currentUser.trainerName}</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-sm font-mono text-muted-foreground">
                <PokeballSmall />
                <span>{currentUser.id}</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => {
                  logout()
                  onLogout()
                }}
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
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
              <Card className="bg-card">
                <CardContent className="p-4 text-center">
                  <Trophy className="w-6 h-6 mx-auto mb-2 text-amber-500" />
                  <p className="text-2xl font-bold text-card-foreground">{currentUser.wins}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Wins</p>
                </CardContent>
              </Card>
              
              <Card className="bg-card">
                <CardContent className="p-4 text-center">
                  <Target className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold text-card-foreground">{currentUser.losses}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Losses</p>
                </CardContent>
              </Card>
              
              <Card className="bg-card">
                <CardContent className="p-4 text-center">
                  <Flame className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                  <p className="text-2xl font-bold text-card-foreground">{currentUser.streak}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Streak</p>
                </CardContent>
              </Card>
              
              <Card className="bg-card">
                <CardContent className="p-4 text-center">
                  <Zap className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold text-card-foreground">{currentUser.bp}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">BP</p>
                </CardContent>
              </Card>
            </div>
            
            {/* Apex Rank Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Apex League Rank
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-black text-foreground">{currentUser.apexRank}</p>
                    <p className="text-sm text-muted-foreground">{rankIcons[currentUser.apexRank]}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Battle Points</p>
                    <p className="text-xl font-bold text-foreground">{currentUser.bp} BP</p>
                  </div>
                </div>
                
                {nextRank && (
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Progress to {nextRank}</span>
                      <span>{currentUser.bp} / {nextRankBP} BP</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${progressToNext}%` }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Trainer Info Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Trainer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Full Name</span>
                  <span className="font-medium text-card-foreground">{currentUser.firstName} {currentUser.lastName}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Trainer Name</span>
                  <span className="font-medium text-card-foreground">{currentUser.trainerName}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Trainer ID</span>
                  <span className="font-mono text-card-foreground">{currentUser.id}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Current League</span>
                  <span className="text-card-foreground">{leagueRegions[currentUser.currentLeague]}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">Win Rate</span>
                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-primary/10 text-primary border border-primary/20">
                    {winRate}%
                  </span>
                </div>
              </CardContent>
            </Card>
            
            {/* Navigation */}
            <Button 
              variant="outline" 
              className="w-full h-auto py-4 flex flex-col gap-2"
              onClick={onViewDirectory}
            >
              <Users className="w-6 h-6" />
              <span>Player Directory</span>
            </Button>

            <Button
              variant="outline"
              className="w-full h-auto py-4 flex flex-col gap-2"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="w-6 h-6" />
              <span>Account Settings</span>
            </Button>
          </div>
          
          {/* Right Column - Trainer Card */}
          <div>
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-4 text-center">
                Your Digital Trainer Card
              </h3>
              <TrainerCard player={currentUser} />
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}