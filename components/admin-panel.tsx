'use client'

import { useState, useEffect } from 'react'
import { 
  useLeagueStore, 
  Player, 
  UserRole, 
  ApexRank, 
  LeagueStage, 
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
  deletePlayerFromSupabase 
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

// DbPlayer type must match the flattened structure your UI expects
type DbPlayer = Player & { dbUserId: string }

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

  useEffect(() => {
    let isMounted = true
    const loadPlayers = async () => {
      setIsLoadingPlayers(true)
      try {
        const res = await fetchPlayersFromSupabase()
        console.log("Supabase Raw Response:", res) // Debug log to see exactly what Supabase returns

        if (res.success && res.players && isMounted) {
          const mapped = res.players.map((p: any) => {
            // FIX: Supabase returns joined tables as objects OR arrays. 
            // We must safely extract them.
            const prog = Array.isArray(p.progression) ? p.progression[0] : (p.progression || {})
            const roleData = Array.isArray(p.user_role) ? p.user_role[0] : (p.user_role || {})
            
            const bp = prog.bp || 0
            const fullName = p.full_name || ''
            const nameParts = fullName.split(' ')

            return {
              // Priority: Custom Trainer ID -> Supabase UUID
              id: p.trainer_id || p.user_id || p.id,
              dbUserId: p.user_id, 
              email: p.email || '',
              firstName: nameParts[0] || '',
              lastName: nameParts.slice(1).join(' ') || '',
              trainerName: p.username || 'Unknown Trainer',
              password: '', 
              role: (roleData.role || p.role || 'user') as UserRole,
              bp: bp,
              apexRank: calculateRank(bp),
              wins: prog.wins || 0,
              losses: prog.losses || 0,
              streak: prog.streak || 0,
              currentLeague: prog.current_league || 'pokeball_1',
              gymBadges: prog.gym_badges || {},
              eliteFourBadges: prog.elite_four_badges || [],
              championBadge: prog.champion_badge || false,
              emperorTitle: prog.emperor_title || null,
              createdAt: p.created_at || new Date().toISOString()
            }
          })
          setDbPlayers(mapped)
        }
      } catch (err) {
        console.error("Failed to map players:", err)
      } finally {
        if (isMounted) setIsLoadingPlayers(false)
      }
    }
    loadPlayers()
    return () => { isMounted = false }
  }, [calculateRank])

  // Authentication Guard
  if (!currentUser || !['admin', 'super_admin'].includes(currentUser.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Shield className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold">Unauthorized Access</h2>
        <Button onClick={onBack} className="mt-4">Go Back</Button>
      </div>
    )
  }

  const filteredPlayers = dbPlayers.filter(p => 
    p.trainerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
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
  }

  // SAVE LOGIC - Stats
  const handleSaveStats = async () => {
    if (!selectedPlayer) return
    setIsSaving(true)
    const bp = parseInt(editedBP) || 0
    const res = await updatePlayerProgressionInSupabase(selectedPlayer.dbUserId, {
      wins: parseInt(editedWins) || 0,
      losses: parseInt(editedLosses) || 0,
      streak: parseInt(editedStreak) || 0,
      bp: bp
    })
    if (res.success) {
      setDbPlayers(prev => prev.map(p => p.dbUserId === selectedPlayer.dbUserId ? { ...p, bp, apexRank: calculateRank(bp) } : p))
      setSaveSuccess(true)
    }
    setIsSaving(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-accent text-accent-foreground py-6 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft /></Button>
          <h1 className="text-2xl font-black">ADMIN PANEL</h1>
        </div>
        <Button variant="ghost" onClick={adminLogout}><LogOut className="mr-2 h-4 w-4" /> Logout</Button>
      </header>

      <main className="container mx-auto py-8 px-4">
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users /> Live Database
                {isLoadingPlayers && <Loader2 className="animate-spin w-4 h-4" />}
              </CardTitle>
              <Input 
                placeholder="Search trainers..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
            </CardHeader>
            <CardContent className="overflow-y-auto flex-1">
              <div className="space-y-2">
                {filteredPlayers.map(player => (
                  <button 
                    key={player.dbUserId}
                    onClick={() => handleSelectPlayer(player)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border transition-all",
                      selectedPlayer?.dbUserId === player.dbUserId ? "bg-primary/10 border-primary" : "hover:bg-muted"
                    )}
                  >
                    <p className="font-bold">{player.trainerName}</p>
                    <p className="text-xs font-mono text-muted-foreground">{player.id}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            {selectedPlayer ? (
              <CardContent className="pt-6 space-y-6">
                <div className="flex items-center gap-4 border-b pb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{selectedPlayer.trainerName}</h3>
                    <p className="text-sm text-muted-foreground">{selectedPlayer.email}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Battle Points (BP)</Label>
                    <Input type="number" value={editedBP} onChange={(e) => setEditedBP(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Wins</Label>
                    <Input type="number" value={editedWins} onChange={(e) => setEditedWins(e.target.value)} />
                  </div>
                </div>

                <Button onClick={handleSaveStats} disabled={isSaving} className="w-full">
                  {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
                  Push Changes to Cloud
                </Button>
                {saveSuccess && <p className="text-emerald-500 text-center text-sm font-bold">Successfully updated in Supabase!</p>}
              </CardContent>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-20">
                <PokeballIcon size={48} className="opacity-20 mb-4" />
                <p>Select a trainer to view details</p>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}