import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// User Roles with hierarchical permissions
export type UserRole = 'super_admin' | 'admin' | 'moderator' | 'user'

// Apex League Ranks based on BP
export type ApexRank = 'Rookie' | 'Ace' | 'Rival' | 'Elite' | 'Veteran' | 'Dominator' | 'Supreme' | 'Apex' | 'Ascended' | 'Invictus'

// League stages
export type LeagueStage = 'pokeball_1' | 'pokeball_2' | 'pokeball_3' | 'greatball_1' | 'greatball_2' | 'greatball_3' | 'ultraball_1' | 'ultraball_2' | 'ultraball_3' | 'masterball'

// Emperor titles
export type EmperorTitle = 'poke_emperor' | 'great_emperor' | 'ultra_emperor' | 'master_emperor' | 'fallen_emperor' | 'banished_emperor' | 'vanquished_emperor' | 'forsaken_emperor' | 'eternal_emperor' | 'first_emperor' | null

// Regions for each league stage
export const leagueRegions: Record<LeagueStage, string> = {
  pokeball_1: 'Kanto',
  pokeball_2: 'Johto',
  pokeball_3: 'Hoenn',
  greatball_1: 'Sinnoh',
  greatball_2: 'Unova',
  greatball_3: 'Kalos',
  ultraball_1: 'Alola',
  ultraball_2: 'Galar',
  ultraball_3: 'Paldea',
  masterball: 'Championship',
}

// BP thresholds for ranks
export const rankThresholds: Record<ApexRank, number> = {
  Rookie: 0,
  Ace: 100,
  Rival: 300,
  Elite: 600,
  Veteran: 1000,
  Dominator: 1500,
  Supreme: 2200,
  Apex: 3000,
  Ascended: 7000,
  Invictus: 10000,
}

// Rank Pokémon icons
export const rankIcons: Record<ApexRank, string> = {
  Rookie: 'Pikachu',
  Ace: 'Eevee',
  Rival: 'Lucario',
  Elite: 'Gengar',
  Veteran: 'Garchomp',
  Dominator: 'Dragonite',
  Supreme: 'Charizard X',
  Apex: 'Rayquaza',
  Ascended: 'Arceus',
  Invictus: 'Eternatus',
}

export interface GymBadge {
  region: string
  earned: boolean
  earnedAt?: string
}

export interface EliteFourBadge {
  position: number // 1-4
  earned: boolean
  earnedAt?: string
}

export interface Player {
  id: string
  firstName: string
  lastName: string
  trainerName: string
  password: string
  role: UserRole
  // Battle Points and Ranking
  bp: number
  apexRank: ApexRank
  // Stats
  wins: number
  losses: number
  streak: number
  // League Progress
  currentLeague: LeagueStage
  // Gym Badges (8 per league stage)
  gymBadges: Record<LeagueStage, GymBadge[]>
  // Elite Four progress
  eliteFourBadges: EliteFourBadge[]
  championBadge: boolean
  // Emperor titles
  emperorTitle: EmperorTitle
  // Metadata
  createdAt: string
  createdBy?: string // ID of admin who created
}

interface LeagueStore {
  players: Player[]
  currentUser: Player | null
  isAdminAuthenticated: boolean
  
  // Auth actions
  register: (player: Omit<Player, 'id' | 'role' | 'bp' | 'apexRank' | 'wins' | 'losses' | 'streak' | 'currentLeague' | 'gymBadges' | 'eliteFourBadges' | 'championBadge' | 'emperorTitle' | 'createdAt'>) => { success: boolean; message: string; player?: Player }
  login: (identifier: string, password: string) => { success: boolean; message: string; isAdmin?: boolean }
  logout: () => void
  
  // Admin actions
  adminLogin: (username: string, password: string) => { success: boolean; message: string }
  adminLogout: () => void
  
  // Player management (role-based)
  createPlayer: (playerData: Omit<Player, 'id' | 'bp' | 'apexRank' | 'wins' | 'losses' | 'streak' | 'currentLeague' | 'gymBadges' | 'eliteFourBadges' | 'championBadge' | 'emperorTitle' | 'createdAt'>, createdBy: string) => { success: boolean; message: string; player?: Player }
  updatePlayerRole: (playerId: string, role: UserRole, updatedBy: Player) => { success: boolean; message: string }
  updatePlayerStats: (playerId: string, updates: Partial<Pick<Player, 'wins' | 'losses' | 'streak' | 'bp'>>) => void
  updatePlayerProfile: (playerId: string, updates: Partial<Pick<Player, 'firstName' | 'lastName' | 'trainerName'>>) => void
  deletePlayer: (playerId: string, deletedBy: Player) => { success: boolean; message: string }
  
  // BP and Rank
  addBP: (playerId: string, amount: number) => void
  removeBP: (playerId: string, amount: number) => void
  
  // Gym badges
  awardGymBadge: (playerId: string, league: LeagueStage, badgeIndex: number) => void
  
  // Helper functions
  getPlayerById: (id: string) => Player | undefined
  getPlayerByTrainerName: (name: string) => Player | undefined
  calculateRank: (bp: number) => ApexRank
  canManageRole: (manager: Player, targetRole: UserRole) => boolean
}

function generateTrainerId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = 'ETL-'
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function createInitialGymBadges(): Record<LeagueStage, GymBadge[]> {
  const stages: LeagueStage[] = ['pokeball_1', 'pokeball_2', 'pokeball_3', 'greatball_1', 'greatball_2', 'greatball_3', 'ultraball_1', 'ultraball_2', 'ultraball_3', 'masterball']
  const badges: Record<LeagueStage, GymBadge[]> = {} as Record<LeagueStage, GymBadge[]>
  
  stages.forEach(stage => {
    badges[stage] = Array(8).fill(null).map(() => ({
      region: leagueRegions[stage],
      earned: false,
    }))
  })
  
  return badges
}

function createInitialEliteFourBadges(): EliteFourBadge[] {
  return Array(4).fill(null).map((_, i) => ({
    position: i + 1,
    earned: false,
  }))
}

function calculateRankFromBP(bp: number): ApexRank {
  if (bp >= 10000) return 'Invictus'
  if (bp >= 7000) return 'Ascended'
  if (bp >= 3000) return 'Apex'
  if (bp >= 2200) return 'Supreme'
  if (bp >= 1500) return 'Dominator'
  if (bp >= 1000) return 'Veteran'
  if (bp >= 600) return 'Elite'
  if (bp >= 300) return 'Rival'
  if (bp >= 100) return 'Ace'
  return 'Rookie'
}

// Role hierarchy for permission checks
const roleHierarchy: Record<UserRole, number> = {
  super_admin: 4,
  admin: 3,
  moderator: 2,
  user: 1,
}

export const useLeagueStore = create<LeagueStore>()(
  persist(
    (set, get) => ({
      players: [],
      currentUser: null,
      isAdminAuthenticated: false,
      
      register: (playerData) => {
        const { players } = get()
        
        // Check if trainer name already exists
        if (players.some(p => p.trainerName.toLowerCase() === playerData.trainerName.toLowerCase())) {
          return { success: false, message: 'Trainer name already exists' }
        }
        
        // Generate unique ID
        let id = generateTrainerId()
        while (players.some(p => p.id === id)) {
          id = generateTrainerId()
        }
        
        const newPlayer: Player = {
          ...playerData,
          id,
          role: 'user',
          bp: 0,
          apexRank: 'Rookie',
          wins: 0,
          losses: 0,
          streak: 0,
          currentLeague: 'pokeball_1',
          gymBadges: createInitialGymBadges(),
          eliteFourBadges: createInitialEliteFourBadges(),
          championBadge: false,
          emperorTitle: null,
          createdAt: new Date().toISOString(),
        }
        
        set({ players: [...players, newPlayer] })
        return { success: true, message: 'Registration successful', player: newPlayer }
      },
      
      login: (identifier, password) => {
        // Check for super admin credentials
        if (identifier === 'admin-rein' && password === 'Reinier121399!') {
          // Create or find the super admin player
          const { players } = get()
          let superAdmin = players.find(p => p.role === 'super_admin' && p.trainerName === 'Emperor Rein')
          
          if (!superAdmin) {
            // Create super admin player
            superAdmin = {
              id: 'ETL-ADMIN',
              firstName: 'Reinier',
              lastName: 'Admin',
              trainerName: 'Emperor Rein',
              password: password,
              role: 'super_admin' as UserRole,
              bp: 10000,
              apexRank: 'Invictus' as ApexRank,
              wins: 999,
              losses: 0,
              streak: 999,
              currentLeague: 'masterball' as LeagueStage,
              gymBadges: createInitialGymBadges(),
              eliteFourBadges: createInitialEliteFourBadges(),
              championBadge: true,
              emperorTitle: 'master_emperor' as EmperorTitle,
              createdAt: new Date().toISOString(),
            }
            // Mark all badges as earned for super admin
            Object.keys(superAdmin.gymBadges).forEach(stage => {
              superAdmin!.gymBadges[stage as LeagueStage].forEach(badge => {
                badge.earned = true
                badge.earnedAt = new Date().toISOString()
              })
            })
            superAdmin.eliteFourBadges.forEach(badge => {
              badge.earned = true
              badge.earnedAt = new Date().toISOString()
            })
            set({ players: [...players, superAdmin] })
          }
          
          set({ isAdminAuthenticated: true, currentUser: superAdmin })
          return { success: true, message: 'Super Admin login successful', isAdmin: true }
        }
        
        const { players } = get()
        
        // Find player by trainer name or ID
        const player = players.find(
          p => p.trainerName.toLowerCase() === identifier.toLowerCase() || 
               p.id.toLowerCase() === identifier.toLowerCase()
        )
        
        if (!player) {
          return { success: false, message: 'Player not found' }
        }
        
        if (player.password !== password) {
          return { success: false, message: 'Invalid password' }
        }
        
        // Check if player is admin or higher
        const isAdmin = player.role === 'super_admin' || player.role === 'admin' || player.role === 'moderator'
        
        set({ currentUser: player, isAdminAuthenticated: isAdmin })
        return { success: true, message: 'Login successful', isAdmin }
      },
      
      logout: () => {
        set({ currentUser: null, isAdminAuthenticated: false })
      },
      
      adminLogin: (username, password) => {
        if (username === 'admin-rein' && password === 'Reinier121399!') {
          const result = get().login(username, password)
          return { success: result.success, message: result.success ? 'Admin access granted' : result.message }
        }
        return { success: false, message: 'Invalid admin credentials' }
      },
      
      adminLogout: () => {
        set({ isAdminAuthenticated: false, currentUser: null })
      },
      
      createPlayer: (playerData, createdBy) => {
        const { players } = get()
        
        if (players.some(p => p.trainerName.toLowerCase() === playerData.trainerName.toLowerCase())) {
          return { success: false, message: 'Trainer name already exists' }
        }
        
        let id = generateTrainerId()
        while (players.some(p => p.id === id)) {
          id = generateTrainerId()
        }
        
        const newPlayer: Player = {
          ...playerData,
          id,
          bp: 0,
          apexRank: 'Rookie',
          wins: 0,
          losses: 0,
          streak: 0,
          currentLeague: 'pokeball_1',
          gymBadges: createInitialGymBadges(),
          eliteFourBadges: createInitialEliteFourBadges(),
          championBadge: false,
          emperorTitle: null,
          createdAt: new Date().toISOString(),
          createdBy,
        }
        
        set({ players: [...players, newPlayer] })
        return { success: true, message: 'Player created successfully', player: newPlayer }
      },
      
      updatePlayerRole: (playerId, role, updatedBy) => {
        const { players, canManageRole } = get()
        const targetPlayer = players.find(p => p.id === playerId)
        
        if (!targetPlayer) {
          return { success: false, message: 'Player not found' }
        }
        
        // Check permissions
        if (!canManageRole(updatedBy, role)) {
          return { success: false, message: 'You do not have permission to assign this role' }
        }
        
        // Super admin cannot be demoted
        if (targetPlayer.role === 'super_admin' && updatedBy.role !== 'super_admin') {
          return { success: false, message: 'Cannot modify Super Admin' }
        }
        
        // Only super admin can create other admins
        if (role === 'admin' && updatedBy.role !== 'super_admin') {
          return { success: false, message: 'Only Super Admin can create Admins' }
        }
        
        set({
          players: players.map(p => 
            p.id === playerId ? { ...p, role } : p
          ),
          currentUser: get().currentUser?.id === playerId 
            ? { ...get().currentUser!, role } 
            : get().currentUser
        })
        
        return { success: true, message: `Role updated to ${role}` }
      },
      
      updatePlayerStats: (playerId, updates) => {
        set(state => {
          const updatedPlayers = state.players.map(p => {
            if (p.id === playerId) {
              const newBp = updates.bp !== undefined ? updates.bp : p.bp
              return { 
                ...p, 
                ...updates,
                bp: Math.max(0, newBp),
                apexRank: calculateRankFromBP(Math.max(0, newBp))
              }
            }
            return p
          })
          
          return {
            players: updatedPlayers,
            currentUser: state.currentUser?.id === playerId 
              ? updatedPlayers.find(p => p.id === playerId) || state.currentUser
              : state.currentUser
          }
        })
      },
      
      updatePlayerProfile: (playerId, updates) => {
        set(state => ({
          players: state.players.map(p => 
            p.id === playerId ? { ...p, ...updates } : p
          ),
          currentUser: state.currentUser?.id === playerId 
            ? { ...state.currentUser, ...updates } 
            : state.currentUser
        }))
      },
      
      deletePlayer: (playerId, deletedBy) => {
        const { players } = get()
        const targetPlayer = players.find(p => p.id === playerId)
        
        if (!targetPlayer) {
          return { success: false, message: 'Player not found' }
        }
        
        // Check permissions
        if (roleHierarchy[deletedBy.role] <= roleHierarchy[targetPlayer.role]) {
          return { success: false, message: 'You do not have permission to delete this player' }
        }
        
        // Cannot delete super admin
        if (targetPlayer.role === 'super_admin') {
          return { success: false, message: 'Cannot delete Super Admin' }
        }
        
        set({ players: players.filter(p => p.id !== playerId) })
        return { success: true, message: 'Player deleted successfully' }
      },
      
      addBP: (playerId, amount) => {
        set(state => {
          const updatedPlayers = state.players.map(p => {
            if (p.id === playerId) {
              const newBp = p.bp + amount
              return { 
                ...p, 
                bp: newBp,
                apexRank: calculateRankFromBP(newBp)
              }
            }
            return p
          })
          
          return {
            players: updatedPlayers,
            currentUser: state.currentUser?.id === playerId 
              ? updatedPlayers.find(p => p.id === playerId) || state.currentUser
              : state.currentUser
          }
        })
      },
      
      removeBP: (playerId, amount) => {
        set(state => {
          const updatedPlayers = state.players.map(p => {
            if (p.id === playerId) {
              const newBp = Math.max(0, p.bp - amount)
              return { 
                ...p, 
                bp: newBp,
                apexRank: calculateRankFromBP(newBp)
              }
            }
            return p
          })
          
          return {
            players: updatedPlayers,
            currentUser: state.currentUser?.id === playerId 
              ? updatedPlayers.find(p => p.id === playerId) || state.currentUser
              : state.currentUser
          }
        })
      },
      
      awardGymBadge: (playerId, league, badgeIndex) => {
        set(state => ({
          players: state.players.map(p => {
            if (p.id === playerId) {
              const newGymBadges = { ...p.gymBadges }
              newGymBadges[league] = [...newGymBadges[league]]
              newGymBadges[league][badgeIndex] = {
                ...newGymBadges[league][badgeIndex],
                earned: true,
                earnedAt: new Date().toISOString(),
              }
              return { ...p, gymBadges: newGymBadges }
            }
            return p
          }),
          currentUser: state.currentUser?.id === playerId 
            ? { 
                ...state.currentUser!,
                gymBadges: {
                  ...state.currentUser!.gymBadges,
                  [league]: state.currentUser!.gymBadges[league].map((b, i) => 
                    i === badgeIndex ? { ...b, earned: true, earnedAt: new Date().toISOString() } : b
                  )
                }
              }
            : state.currentUser
        }))
      },
      
      getPlayerById: (id) => {
        return get().players.find(p => p.id === id)
      },
      
      getPlayerByTrainerName: (name) => {
        return get().players.find(p => p.trainerName.toLowerCase() === name.toLowerCase())
      },
      
      calculateRank: (bp) => calculateRankFromBP(bp),
      
      canManageRole: (manager, targetRole) => {
        // Super admin can manage all roles
        if (manager.role === 'super_admin') return true
        
        // Admin can manage moderators and users
        if (manager.role === 'admin' && (targetRole === 'moderator' || targetRole === 'user')) return true
        
        // Moderators cannot change roles
        return false
      },
    }),
    {
      name: 'emperor-league-storage',
    }
  )
)

// Helper to get role display name
export function getRoleDisplayName(role: UserRole): string {
  const names: Record<UserRole, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    moderator: 'Moderator',
    user: 'User',
  }
  return names[role]
}

// Helper to get role badge color
export function getRoleColor(role: UserRole): { bg: string; text: string; border: string } {
  const colors: Record<UserRole, { bg: string; text: string; border: string }> = {
    super_admin: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
    admin: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
    moderator: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
    user: { bg: 'bg-zinc-100', text: 'text-zinc-700', border: 'border-zinc-300' },
  }
  return colors[role]
}

// Helper to check if user can perform CRUD operations
export function canCRUDPlayers(role: UserRole): boolean {
  return role === 'super_admin' || role === 'admin'
}

// Helper to check if user can edit player stats
export function canEditStats(role: UserRole): boolean {
  return role === 'super_admin' || role === 'admin' || role === 'moderator'
}
