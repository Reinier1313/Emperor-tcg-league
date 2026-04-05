'use client'

import { useState } from 'react'
import { useLeagueStore, Player, UserRole, ApexRank, LeagueStage, getRoleDisplayName, getRoleColor, canCRUDPlayers, canEditStats, leagueRegions } from '@/lib/store'
import { usePwaInstall } from '@/hooks/use-pwa-install'
import { PokeballIcon, PokeballSmall } from './pokeball-icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, Search, User, Award, Settings, Save, 
  CheckCircle2, Users, Shield, Lock, LogOut, Eye, EyeOff, 
  Download, Plus, Trash2, UserCog, Zap, Crown, AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminPanelProps {
  onBack: () => void
}

const roles: UserRole[] = ['user', 'moderator', 'admin', 'super_admin']
const apexRanks: ApexRank[] = ['Rookie', 'Ace', 'Rival', 'Elite', 'Veteran', 'Dominator', 'Supreme', 'Apex', 'Ascended', 'Invictus']
const leagueStages: LeagueStage[] = ['pokeball_1', 'pokeball_2', 'pokeball_3', 'greatball_1', 'greatball_2', 'greatball_3', 'ultraball_1', 'ultraball_2', 'ultraball_3', 'masterball']

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

// Create Player Form Component
function CreatePlayerForm({ currentUser, onSuccess }: { currentUser: Player; onSuccess: () => void }) {
  const { createPlayer } = useLeagueStore()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [trainerName, setTrainerName] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('user')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  // Available roles based on current user's role
  const availableRoles: UserRole[] = currentUser.role === 'super_admin' 
    ? ['user', 'moderator', 'admin']
    : currentUser.role === 'admin'
    ? ['user', 'moderator']
    : ['user']
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    const result = createPlayer({
      firstName,
      lastName,
      trainerName,
      password,
      role,
    }, currentUser.id)
    
    if (result.success) {
      setSuccess(true)
      setFirstName('')
      setLastName('')
      setTrainerName('')
      setPassword('')
      setRole('user')
      setTimeout(() => {
        setSuccess(false)
        onSuccess()
      }, 1500)
    } else {
      setError(result.message)
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Create New Player
        </CardTitle>
        <CardDescription>Add a new player to the league</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter first name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter last name"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Trainer Name</Label>
            <Input
              value={trainerName}
              onChange={(e) => setTrainerName(e.target.value)}
              placeholder="Enter trainer name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label>Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {getRoleDisplayName(r)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="p-3 rounded-lg bg-emerald-100 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Player created successfully!
            </div>
          )}
          
          <Button type="submit" className="w-full gap-2">
            <Plus className="w-4 h-4" />
            Create Player
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export function AdminPanel({ onBack }: AdminPanelProps) {
  const { 
    players, 
    currentUser,
    updatePlayerStats, 
    updatePlayerRole,
    updatePlayerProfile,
    deletePlayer,
    addBP,
    awardGymBadge,
    isAdminAuthenticated, 
    adminLogout 
  } = useLeagueStore()
  const { isInstallable, install } = usePwaInstall()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
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
  
  // Show login screen if not authenticated
  if (!isAdminAuthenticated || !currentUser) {
    return <AdminLogin onBack={onBack} />
  }
  
  const canCRUD = canCRUDPlayers(currentUser.role)
  const canEdit = canEditStats(currentUser.role)
  const isSuperAdmin = currentUser.role === 'super_admin'
  
  const filteredPlayers = players.filter(player => 
    player.trainerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.lastName.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const handleSelectPlayer = (player: Player) => {
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
  
  const handleSaveStats = () => {
    if (!selectedPlayer) return
    
    const wins = parseInt(editedWins) || 0
    const losses = parseInt(editedLosses) || 0
    const streak = parseInt(editedStreak) || 0
    const bp = parseInt(editedBP) || 0
    
    updatePlayerStats(selectedPlayer.id, { wins, losses, streak, bp })
    
    setSelectedPlayer({
      ...selectedPlayer,
      wins,
      losses,
      streak,
      bp
    })
    
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2000)
  }
  
  const handleSaveProfile = () => {
    if (!selectedPlayer) return
    
    updatePlayerProfile(selectedPlayer.id, {
      firstName: editedFirstName,
      lastName: editedLastName,
      trainerName: editedTrainerName,
    })
    
    setSelectedPlayer({
      ...selectedPlayer,
      firstName: editedFirstName,
      lastName: editedLastName,
      trainerName: editedTrainerName,
    })
    
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2000)
  }
  
  const handleSaveRole = () => {
    if (!selectedPlayer) return
    
    const result = updatePlayerRole(selectedPlayer.id, editedRole, currentUser)
    
    if (result.success) {
      setSelectedPlayer({
        ...selectedPlayer,
        role: editedRole
      })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    }
  }
  
  const handleDeletePlayer = () => {
    if (!selectedPlayer) return
    
    const result = deletePlayer(selectedPlayer.id, currentUser)
    
    if (result.success) {
      setSelectedPlayer(null)
      setDeleteConfirm(false)
    }
  }
  
  // Get available roles for assignment based on current user's role
  const getAssignableRoles = (): UserRole[] => {
    if (currentUser.role === 'super_admin') {
      return ['user', 'moderator', 'admin']
    }
    if (currentUser.role === 'admin') {
      return ['user', 'moderator']
    }
    return []
  }
  
  // Check if current user can modify selected player
  const canModifyPlayer = (player: Player): boolean => {
    if (currentUser.role === 'super_admin') return true
    if (player.role === 'super_admin') return false
    if (currentUser.role === 'admin' && player.role !== 'admin') return true
    if (currentUser.role === 'moderator' && player.role === 'user') return true
    return false
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
                <Button 
                  variant="default" 
                  size="icon"
                  onClick={install}
                  title="Add to your mobile"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="w-5 h-5" />
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => {
                  adminLogout()
                  onBack()
                }}
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="players" className="gap-2">
              <Users className="w-4 h-4" />
              Players
            </TabsTrigger>
            {canCRUD && (
              <TabsTrigger value="create" className="gap-2">
                <Plus className="w-4 h-4" />
                Create
              </TabsTrigger>
            )}
          </TabsList>
          
          {/* Players Tab */}
          <TabsContent value="players">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Player List */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      All Players ({players.length})
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
                          const roleStyle = getRoleColor(player.role)
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
                                  {player.role === 'super_admin' ? (
                                    <Crown className="w-5 h-5 text-amber-500" />
                                  ) : player.role === 'admin' ? (
                                    <Shield className="w-5 h-5 text-purple-500" />
                                  ) : player.role === 'moderator' ? (
                                    <UserCog className="w-5 h-5 text-blue-500" />
                                  ) : (
                                    <User className="w-5 h-5 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-card-foreground truncate">
                                    {player.trainerName}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs text-muted-foreground font-mono">
                                      {player.id}
                                    </p>
                                    <span className="text-xs text-muted-foreground">
                                      {player.bp} BP
                                    </span>
                                  </div>
                                </div>
                                <span className={cn(
                                  'px-2 py-0.5 rounded-full text-xs font-semibold border shrink-0',
                                  roleStyle.bg, roleStyle.text, roleStyle.border
                                )}>
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
              
              {/* Edit Panel */}
              <div className="lg:col-span-2">
                {selectedPlayer ? (
                  <div className="space-y-6">
                    {/* Player Info Header */}
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            'w-16 h-16 rounded-full flex items-center justify-center',
                            getRoleColor(selectedPlayer.role).bg
                          )}>
                            {selectedPlayer.role === 'super_admin' ? (
                              <Crown className="w-8 h-8 text-amber-600" />
                            ) : selectedPlayer.role === 'admin' ? (
                              <Shield className="w-8 h-8 text-purple-600" />
                            ) : selectedPlayer.role === 'moderator' ? (
                              <UserCog className="w-8 h-8 text-blue-600" />
                            ) : (
                              <User className="w-8 h-8 text-zinc-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-xl font-bold text-card-foreground">
                                {selectedPlayer.trainerName}
                              </h3>
                              <span className={cn(
                                'px-2 py-0.5 rounded-full text-xs font-semibold border',
                                getRoleColor(selectedPlayer.role).bg,
                                getRoleColor(selectedPlayer.role).text,
                                getRoleColor(selectedPlayer.role).border
                              )}>
                                {getRoleDisplayName(selectedPlayer.role)}
                              </span>
                            </div>
                            <p className="text-muted-foreground">
                              {selectedPlayer.firstName} {selectedPlayer.lastName}
                            </p>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <span className="font-mono flex items-center gap-1">
                                <PokeballSmall />
                                {selectedPlayer.id}
                              </span>
                              <span className="flex items-center gap-1">
                                <Zap className="w-4 h-4" />
                                {selectedPlayer.bp} BP
                              </span>
                              <span>{selectedPlayer.apexRank}</span>
                            </div>
                          </div>
                          {saveSuccess && (
                            <span className="flex items-center gap-1 text-sm text-emerald-600">
                              <CheckCircle2 className="w-4 h-4" />
                              Saved!
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    
                    {canModifyPlayer(selectedPlayer) ? (
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Stats Editing - Available to all staff */}
                        {canEdit && (
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base flex items-center gap-2">
                                <Award className="w-4 h-4" />
                                Edit Stats
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Wins</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={editedWins}
                                    onChange={(e) => setEditedWins(e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Losses</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={editedLosses}
                                    onChange={(e) => setEditedLosses(e.target.value)}
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Streak</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={editedStreak}
                                    onChange={(e) => setEditedStreak(e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Battle Points</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={editedBP}
                                    onChange={(e) => setEditedBP(e.target.value)}
                                  />
                                </div>
                              </div>
                              <Button onClick={handleSaveStats} className="w-full gap-2">
                                <Save className="w-4 h-4" />
                                Save Stats
                              </Button>
                            </CardContent>
                          </Card>
                        )}
                        
                        {/* Profile Editing - Admins only */}
                        {canCRUD && (
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Edit Profile
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="space-y-2">
                                <Label>First Name</Label>
                                <Input
                                  value={editedFirstName}
                                  onChange={(e) => setEditedFirstName(e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Last Name</Label>
                                <Input
                                  value={editedLastName}
                                  onChange={(e) => setEditedLastName(e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Trainer Name</Label>
                                <Input
                                  value={editedTrainerName}
                                  onChange={(e) => setEditedTrainerName(e.target.value)}
                                />
                              </div>
                              <Button onClick={handleSaveProfile} className="w-full gap-2">
                                <Save className="w-4 h-4" />
                                Save Profile
                              </Button>
                            </CardContent>
                          </Card>
                        )}
                        
                        {/* Role Management - Super Admin and Admin only */}
                        {canCRUD && selectedPlayer.role !== 'super_admin' && (
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                Manage Role
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="space-y-2">
                                <Label>Role</Label>
                                <Select value={editedRole} onValueChange={(v) => setEditedRole(v as UserRole)}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {getAssignableRoles().map((r) => (
                                      <SelectItem key={r} value={r}>
                                        {getRoleDisplayName(r)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {currentUser.role === 'super_admin' 
                                    ? 'Super Admin can assign any role except Super Admin'
                                    : 'Admin can assign Moderator and User roles'}
                                </p>
                              </div>
                              <Button onClick={handleSaveRole} className="w-full gap-2">
                                <Save className="w-4 h-4" />
                                Update Role
                              </Button>
                            </CardContent>
                          </Card>
                        )}
                        
                        {/* Delete Player - Admins only */}
                        {canCRUD && selectedPlayer.role !== 'super_admin' && selectedPlayer.id !== currentUser.id && (
                          <Card className="border-destructive/30">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base flex items-center gap-2 text-destructive">
                                <AlertTriangle className="w-4 h-4" />
                                Danger Zone
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              {!deleteConfirm ? (
                                <Button 
                                  variant="destructive" 
                                  className="w-full gap-2"
                                  onClick={() => setDeleteConfirm(true)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete Player
                                </Button>
                              ) : (
                                <div className="space-y-3">
                                  <p className="text-sm text-destructive">
                                    Are you sure? This action cannot be undone.
                                  </p>
                                  <div className="flex gap-2">
                                    <Button 
                                      variant="outline" 
                                      className="flex-1"
                                      onClick={() => setDeleteConfirm(false)}
                                    >
                                      Cancel
                                    </Button>
                                    <Button 
                                      variant="destructive" 
                                      className="flex-1 gap-2"
                                      onClick={handleDeletePlayer}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Confirm Delete
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
                          <h3 className="font-semibold text-card-foreground mb-2">
                            Insufficient Permissions
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            You don&apos;t have permission to modify this player&apos;s information.
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <Card className="h-full flex items-center justify-center min-h-[400px]">
                    <div className="text-center p-8">
                      <PokeballIcon size={64} className="mx-auto mb-4 opacity-20" />
                      <h3 className="text-lg font-semibold text-card-foreground mb-2">Select a Player</h3>
                      <p className="text-muted-foreground">
                        Choose a player from the list to edit their information
                      </p>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
          
          {/* Create Tab - Only for Admins */}
          {canCRUD && (
            <TabsContent value="create">
              <div className="max-w-xl mx-auto">
                <CreatePlayerForm 
                  currentUser={currentUser} 
                  onSuccess={() => setActiveTab('players')} 
                />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  )
}
