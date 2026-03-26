import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Rank = 'Beginner' | 'Rookie' | 'Elite' | 'Master' | 'Champion'

export interface Player {
  id: string
  firstName: string
  lastName: string
  trainerName: string
  password: string
  rank: Rank
  wins: number
  losses: number
  streak: number
  createdAt: string
}

interface LeagueStore {
  players: Player[]
  currentUser: Player | null
  isAdmin: boolean
  isAdminAuthenticated: boolean
  
  // Auth actions
  register: (player: Omit<Player, 'id' | 'rank' | 'wins' | 'losses' | 'streak' | 'createdAt'>) => { success: boolean; message: string; player?: Player }
  login: (identifier: string, password: string) => { success: boolean; message: string; isAdmin?: boolean }
  logout: () => void
  
  // Admin actions
  adminLogin: (username: string, password: string) => { success: boolean; message: string }
  adminLogout: () => void
  toggleAdmin: () => void
  updatePlayerRank: (playerId: string, rank: Rank) => void
  updatePlayerStats: (playerId: string, wins: number, losses: number, streak: number) => void
  
  // Player actions
  getPlayerById: (id: string) => Player | undefined
  getPlayerByTrainerName: (name: string) => Player | undefined
}

function generateTrainerId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = 'RL-'
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export const useLeagueStore = create<LeagueStore>()(
  persist(
    (set, get) => ({
      players: [],
      currentUser: null,
      isAdmin: false,
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
          rank: 'Beginner',
          wins: 0,
          losses: 0,
          streak: 0,
          createdAt: new Date().toISOString(),
        }
        
        set({ players: [...players, newPlayer] })
        return { success: true, message: 'Registration successful', player: newPlayer }
      },
      
      login: (identifier, password) => {
        // Check for admin credentials first
        if (identifier === 'admin-rein' && password === 'Reinier121399!') {
          set({ isAdminAuthenticated: true })
          return { success: true, message: 'Admin login successful', isAdmin: true }
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
        
        set({ currentUser: player })
        return { success: true, message: 'Login successful' }
      },
      
      logout: () => {
        set({ currentUser: null })
      },
      
      adminLogin: (username, password) => {
        if (username === 'admin-rein' && password === 'Reinier121399!') {
          set({ isAdminAuthenticated: true })
          return { success: true, message: 'Admin access granted' }
        }
        return { success: false, message: 'Invalid admin credentials' }
      },
      
      adminLogout: () => {
        set({ isAdminAuthenticated: false })
      },
      
      toggleAdmin: () => {
        set(state => ({ isAdmin: !state.isAdmin }))
      },
      
      updatePlayerRank: (playerId, rank) => {
        set(state => ({
          players: state.players.map(p => 
            p.id === playerId ? { ...p, rank } : p
          ),
          currentUser: state.currentUser?.id === playerId 
            ? { ...state.currentUser, rank } 
            : state.currentUser
        }))
      },
      
      updatePlayerStats: (playerId, wins, losses, streak) => {
        set(state => ({
          players: state.players.map(p => 
            p.id === playerId ? { ...p, wins, losses, streak } : p
          ),
          currentUser: state.currentUser?.id === playerId 
            ? { ...state.currentUser, wins, losses, streak } 
            : state.currentUser
        }))
      },
      
      getPlayerById: (id) => {
        return get().players.find(p => p.id === id)
      },
      
      getPlayerByTrainerName: (name) => {
        return get().players.find(p => p.trainerName.toLowerCase() === name.toLowerCase())
      },
    }),
    {
      name: 'ronin-league-storage',
    }
  )
)
