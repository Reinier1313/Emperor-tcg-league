'use client'

import { useState, useEffect } from 'react'
import { 
  useLeagueStore, 
  Player, 
  UserRole, 
  getRoleDisplayName, 
  getRoleColor, 
  canCRUDPlayers, 
  canEditStats 
} from '@/lib/store'
import { 
  fetchPlayersFromSupabase, 
  updatePlayerProgressionInSupabase, 
  updatePlayerProfileInSupabase, 
  updatePlayerRoleInSupabase, 
  deletePlayerFromSupabase,
  loginPlayerInSupabase
} from '@/lib/supabaseIntegration'
import { usePwaInstall } from '@/hooks/use-pwa-install'
import { PokeballIcon, PokeballSmall } from './pokeball-icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, Search, User, Award, Save, 
  CheckCircle2, Users, Shield, Lock, LogOut, Eye, EyeOff, 
  Download, Trash2, UserCog, Zap, Crown, AlertTriangle, Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminPanelProps {
  onBack: () => void
}

/**
 * Extended Player type that includes the database UUID (dbUserId)
 * necessary for performing Supabase update queries.
 */
type DbPlayer = Player & { dbUserId: string }

/**
 * Cloud-Connected Login Component for the Admin Panel
 */
function AdminLogin({ onBack }: { onBack: () => void }) {
  const { setCurrentUserFromSupabase } = useLeagueStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    // Connects directly to Supabase to verify your real credentials!
    const result = await loginPlayerInSupabase(username, password)
    
    if (result.success && result.player) {
      if (result.isAdmin) {
        // It's a real admin! Log them into the store
        setCurrentUserFromSupabase(result.player)
      } else {
        // They logged in successfully, but they are just a normal 'user'
        setError('Access Denied: This account does not have Admin privileges.')
        setPassword('')
      }
    } else {
      // Wrong password or email
      setError('Invalid admin credentials.')
      setPassword('')
    }
    
    setIsLoading(false)
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
          <CardDescription>Enter credentials to manage the League</CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-username" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Email, Trainer Name, or ID
              </Label>
              <Input
                id="admin-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin credentials"
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
                  placeholder="Admin password"
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
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-bold">
                {error}
              </div>
            )}
            
            <Button type="submit" className="w-full gap-2" disabled={isLoading || !username || !password}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying with Cloud...
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

/**
 * Main Admin Panel Component
 */
export function AdminPanel({ onBack }: AdminPanelProps) {
  const { currentUser, adminLogout, calculateRank } = useLeagueStore()
  const { isInstallable, install } = usePwaInstall()

  const [dbPlayers, setDbPlayers] = useState<DbPlayer[]>([])
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlayer, setSelectedPlayer] = useState<DbPlayer | null>(null)
  const [activeTab, setActiveTab] = useState('players')

  // Edit states
  const [editedWins, setEditedWins] = useState('')
  const [editedLosses, setEditedLosses] = useState('')
  const [editedStreak, setEditedStreak] = useState('')
  const [editedBP, setEditedBP] = useState('')
  const [editedRole, setEditedRole] = useState<UserRole>('user')
  const [editedFirstName, setEditedFirstName] = useState('')
  const [editedLastName, setEditedLastName] = useState('')
  const [editedTrainerName, setEditedTrainerName] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Fetch live players from Supabase on component mount
  // Fetch live players from Supabase on component mount
  useEffect(() => {
    let isMounted = true
    const loadPlayers = async () => {
      setIsLoadingPlayers(true)
      const res = await fetchPlayersFromSupabase()
      
      if (res.success && res.players && isMounted) {
        // Explicitly typed (p: any) to resolve the TypeScript "implicitly has an any type" error
        const mapped = res.players.map((p: any) => {
          // Supabase joins often return arrays; we safely extract the first object
          const prog = Array.isArray(p.progression) ? p.progression[0] : (p.progression || {})
          const roleObj = Array.isArray(p.user_role) ? p.user_role[0] : (p.user_role || {})
          
          // USE OPTIONAL CHAINING (?.) TO PREVENT CRASHES IF DATA IS MISSING
          const bp = prog?.bp || 0

          return {
            id: p.trainer_id || p.user_id, // Display the custom ETL ID if it exists
            dbUserId: p.user_id, // Store real UUID for backend queries
            email: p.email || '',
            firstName: p.full_name?.split(' ')[0] || '',
            lastName: p.full_name?.split(' ').slice(1).join(' ') || '',
            trainerName: p.username || 'Unknown',
            password: '',
            // SAFE READ: If roleObj is undefined, it skips .role and defaults to 'user'
            role: (roleObj?.role || p.role || 'user') as UserRole, 
            bp: bp,
            apexRank: calculateRank(bp),
            // SAFE READS: Use ?. to prevent crashes if prog is undefined
            wins: prog?.wins || 0,
            losses: prog?.losses || 0,
            streak: prog?.streak || 0,
            currentLeague: prog?.current_league || 'pokeball_1',
            gymBadges: prog?.gym_badges || {},
            eliteFourBadges: prog?.elite_four_badges || [],
            championBadge: prog?.champion_badge || false,
            emperorTitle: prog?.emperor_title || null,
            createdAt: p.created_at || new Date().toISOString()
          }
        })
        setDbPlayers(mapped)
      }
      if (isMounted) setIsLoadingPlayers(false)
    }
    loadPlayers()
    
    return () => { isMounted = false }
  }, [calculateRank])

  // Authentication Check: Panel is only for Admins or Super Admins
  const hasAdminAccess = currentUser && ['admin', 'super_admin'].includes(currentUser.role)

  if (!hasAdminAccess) {
    return <AdminLogin onBack={onBack} />
  }

  const canCRUD = canCRUDPlayers(currentUser.role)
  const canEdit = canEditStats(currentUser.role)
  
  // Filter the player list based on the search input
  const filteredPlayers = dbPlayers.filter(player => 
    player.trainerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.lastName.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const handleSelectPlayer = (player: DbPlayer) => {
    setSelectedPlayer(player)
    setEditedWins(player.wins.toString())
    setEditedLosses(player.losses.toString())
    setEditedStreak(player.streak.toString())
    setEditedBP(player.bp.toString())
    setEditedRole(player.role)
    setEditedFirstName(player.firstName)
    setEditedLastName(player.lastName)
    setEditedTrainerName(player.trainerName)
    setSaveSuccess(false)
    setDeleteConfirm(false)
  }
  
  const handleSaveStats = async () => {
    if (!selectedPlayer) return
    setIsSaving(true)
    
    const wins = parseInt(editedWins) || 0
    const losses = parseInt(editedLosses) || 0
    const streak = parseInt(editedStreak) || 0
    const bp = parseInt(editedBP) || 0
    
    // PERSIST TO SUPABASE: Uses the dbUserId (UUID) for the query
    const res = await updatePlayerProgressionInSupabase(selectedPlayer.dbUserId, { wins, losses, streak, bp })
    
    if (res.success) {
      const newRank = calculateRank(bp)
      
      // Update local state so UI reflects changes immediately
      setDbPlayers(prev => prev.map(p => 
        p.id === selectedPlayer.id ? { ...p, wins, losses, streak, bp, apexRank: newRank } : p
      ))
      
      setSelectedPlayer({ ...selectedPlayer, wins, losses, streak, bp, apexRank: newRank })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    }
    setIsSaving(false)
  }
  
  const handleSaveProfile = async () => {
    if (!selectedPlayer) return
    setIsSaving(true)
    
    const fullName = `${editedFirstName} ${editedLastName}`
    const res = await updatePlayerProfileInSupabase(selectedPlayer.dbUserId, {
      full_name: fullName,
      username: editedTrainerName,
    })
    
    if (res.success) {
      setDbPlayers(prev => prev.map(p => 
        p.id === selectedPlayer.id ? { ...p, firstName: editedFirstName, lastName: editedLastName, trainerName: editedTrainerName } : p
      ))
      setSelectedPlayer({ ...selectedPlayer, firstName: editedFirstName, lastName: editedLastName, trainerName: editedTrainerName })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    }
    setIsSaving(false)
  }
  
  const handleSaveRole = async () => {
    if (!selectedPlayer) return
    setIsSaving(true)
    
    const res = await updatePlayerRoleInSupabase(selectedPlayer.dbUserId, editedRole)
    
    if (res.success) {
      setDbPlayers(prev => prev.map(p => 
        p.id === selectedPlayer.id ? { ...p, role: editedRole } : p
      ))
      setSelectedPlayer({ ...selectedPlayer, role: editedRole })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    }
    setIsSaving(false)
  }
  
  const handleDeletePlayer = async () => {
    if (!selectedPlayer) return
    setIsSaving(true)
    
    const res = await deletePlayerFromSupabase(selectedPlayer.dbUserId)
    
    if (res.success) {
      setDbPlayers(prev => prev.filter(p => p.id !== selectedPlayer.id))
      setSelectedPlayer(null)
      setDeleteConfirm(false)
    }
    setIsSaving(false)
  }
  
  const getAssignableRoles = (): UserRole[] => {
    if (currentUser.role === 'super_admin') return ['user', 'moderator', 'admin']
    if (currentUser.role === 'admin') return ['user', 'moderator']
    return []
  }
  
  const canModifyPlayer = (player: DbPlayer): boolean => {
    if (currentUser.role === 'super_admin') return true
    if (player.role === 'super_admin') return false
    if (currentUser.role === 'admin' && player.role !== 'admin') return true
    if (currentUser.role === 'moderator' && player.role === 'user') return true
    return false
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
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
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-accent-foreground/70">
                      Logged in as {currentUser.trainerName}
                    </p>
                    <span className={cn(
                      'px-1.5 py-0.5 rounded text-[10px] font-semibold',
                      getRoleColor(currentUser.role).bg,
                      getRoleColor(currentUser.role).text
                    )}>
                      {getRoleDisplayName(currentUser.role)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isInstallable && (
                <Button variant="default" size="icon" onClick={install} className="bg-blue-600 hover:bg-blue-700">
                  <Download className="w-5 h-5" />
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => { adminLogout(); onBack() }}
              >
                <LogOut className="w-5 h-5" />
              </Button>
              <PokeballIcon size={36} />
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content Dashboard */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsContent value="players">
            <div className="grid lg:grid-cols-3 gap-6">
              
              {/* Left Column: Player Search & List */}
              <div className="lg:col-span-1">
                <Card className="h-[650px] flex flex-col">
                  <CardHeader className="pb-3 shrink-0">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Live Database
                      </div>
                      {isLoadingPlayers && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-1 overflow-hidden flex flex-col">
                    <div className="relative shrink-0">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search trainers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    <div className="space-y-2 overflow-y-auto flex-1 pr-2">
                      {isLoadingPlayers ? (
                        <div className="text-center py-8 text-muted-foreground">Connecting to Supabase...</div>
                      ) : filteredPlayers.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">No trainers found in Database</p>
                      ) : (
                        filteredPlayers.map((player) => {
                          const roleStyle = getRoleColor(player.role)
                          const isSelected = selectedPlayer?.id === player.id
                          return (
                            <button
                              key={player.id}
                              onClick={() => handleSelectPlayer(player)}
                              className={cn(
                                'w-full p-3 rounded-lg text-left transition-all',
                                'border hover:border-primary/50',
                                isSelected ? 'bg-primary/5 border-primary' : 'bg-card border-border hover:bg-muted/50'
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                                  {player.role === 'super_admin' ? <Crown className="w-5 h-5 text-amber-500" />
                                  : player.role === 'admin' ? <Shield className="w-5 h-5 text-purple-500" />
                                  : player.role === 'moderator' ? <UserCog className="w-5 h-5 text-blue-500" />
                                  : <User className="w-5 h-5 text-muted-foreground" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-card-foreground truncate">{player.trainerName}</p>
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs text-muted-foreground font-mono">{player.id}</p>
                                    <span className="text-xs text-muted-foreground">{player.bp} BP</span>
                                  </div>
                                </div>
                                <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold border shrink-0', roleStyle.bg, roleStyle.text, roleStyle.border)}>
                                  {getRoleDisplayName(player.role)}
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
              
              {/* Right Column: Profile Editor */}
              <div className="lg:col-span-2">
                {selectedPlayer ? (
                  <div className="space-y-6">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <div className={cn('w-16 h-16 rounded-full flex items-center justify-center', getRoleColor(selectedPlayer.role).bg)}>
                            {selectedPlayer.role === 'super_admin' ? <Crown className="w-8 h-8 text-amber-600" />
                            : selectedPlayer.role === 'admin' ? <Shield className="w-8 h-8 text-purple-600" />
                            : selectedPlayer.role === 'moderator' ? <UserCog className="w-8 h-8 text-blue-600" />
                            : <User className="w-8 h-8 text-zinc-600" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-xl font-bold text-card-foreground">{selectedPlayer.trainerName}</h3>
                              <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold border', getRoleColor(selectedPlayer.role).bg, getRoleColor(selectedPlayer.role).text, getRoleColor(selectedPlayer.role).border)}>
                                {getRoleDisplayName(selectedPlayer.role)}
                              </span>
                            </div>
                            <p className="text-muted-foreground">{selectedPlayer.firstName} {selectedPlayer.lastName}</p>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <span className="font-mono flex items-center gap-1"><PokeballSmall />{selectedPlayer.id}</span>
                              <span className="flex items-center gap-1"><Zap className="w-4 h-4" />{selectedPlayer.bp} BP</span>
                              <span>{selectedPlayer.apexRank}</span>
                            </div>
                          </div>
                          {saveSuccess && <span className="flex items-center gap-1 text-sm text-emerald-600"><CheckCircle2 className="w-4 h-4" />Live DB Saved!</span>}
                        </div>
                      </CardContent>
                    </Card>
                    
                    {canModifyPlayer(selectedPlayer) ? (
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Stats Panel */}
                        {canEdit && (
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base flex items-center gap-2"><Award className="w-4 h-4" />Edit Live Stats</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Wins</Label><Input type="number" min="0" value={editedWins} onChange={(e) => setEditedWins(e.target.value)} /></div>
                                <div className="space-y-2"><Label>Losses</Label><Input type="number" min="0" value={editedLosses} onChange={(e) => setEditedLosses(e.target.value)} /></div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Streak</Label><Input type="number" min="0" value={editedStreak} onChange={(e) => setEditedStreak(e.target.value)} /></div>
                                <div className="space-y-2"><Label>Battle Points</Label><Input type="number" min="0" value={editedBP} onChange={(e) => setEditedBP(e.target.value)} /></div>
                              </div>
                              <Button onClick={handleSaveStats} className="w-full gap-2" disabled={isSaving}>
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Push to Cloud
                              </Button>
                            </CardContent>
                          </Card>
                        )}
                        
                        {/* Profile Panel */}
                        {canCRUD && (
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base flex items-center gap-2"><User className="w-4 h-4" />Edit Live Profile</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="space-y-2"><Label>First Name</Label><Input value={editedFirstName} onChange={(e) => setEditedFirstName(e.target.value)} /></div>
                              <div className="space-y-2"><Label>Last Name</Label><Input value={editedLastName} onChange={(e) => setEditedLastName(e.target.value)} /></div>
                              <div className="space-y-2"><Label>Trainer Name</Label><Input value={editedTrainerName} onChange={(e) => setEditedTrainerName(e.target.value)} /></div>
                              <Button onClick={handleSaveProfile} className="w-full gap-2" disabled={isSaving}>
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Push to Cloud
                              </Button>
                            </CardContent>
                          </Card>
                        )}
                        
                        {/* Role Management */}
                        {canCRUD && selectedPlayer.role !== 'super_admin' && (
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4" />Manage Role</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="space-y-2">
                                <Label>Role</Label>
                                <Select value={editedRole} onValueChange={(v) => setEditedRole(v as UserRole)}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {getAssignableRoles().map((r) => <SelectItem key={r} value={r}>{getRoleDisplayName(r)}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button onClick={handleSaveRole} className="w-full gap-2" disabled={isSaving}>
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Push to Cloud
                              </Button>
                            </CardContent>
                          </Card>
                        )}
                        
                        {/* Delete User Section */}
                        {canCRUD && selectedPlayer.role !== 'super_admin' && selectedPlayer.id !== currentUser.id && (
                          <Card className="border-destructive/30">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base flex items-center gap-2 text-destructive"><AlertTriangle className="w-4 h-4" />Danger Zone</CardTitle>
                            </CardHeader>
                            <CardContent>
                              {!deleteConfirm ? (
                                <Button variant="destructive" className="w-full gap-2" onClick={() => setDeleteConfirm(true)}><Trash2 className="w-4 h-4" />Delete Player</Button>
                              ) : (
                                <div className="space-y-3">
                                  <p className="text-sm text-destructive">Are you sure? This action deletes the user from Supabase permanently.</p>
                                  <div className="flex gap-2">
                                    <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
                                    <Button variant="destructive" className="flex-1 gap-2" onClick={handleDeletePlayer} disabled={isSaving}>
                                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                      Confirm
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    ) : (
                      <Card>
                        <CardContent className="py-8 text-center">
                          <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                          <h3 className="font-semibold text-card-foreground mb-2">Insufficient Permissions</h3>
                          <p className="text-muted-foreground text-sm">You don&apos;t have permission to modify this player.</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <Card className="h-full flex items-center justify-center min-h-[400px]">
                    <div className="text-center p-8">
                      <PokeballIcon size={64} className="mx-auto mb-4 opacity-20" />
                      <h3 className="text-lg font-semibold text-card-foreground mb-2">Select a Player</h3>
                      <p className="text-muted-foreground">Choose a player from the Live Database to edit</p>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}