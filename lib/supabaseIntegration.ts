import { supabase } from './supabaseClient'
import { Player, UserRole, ApexRank, LeagueStage, EmperorTitle } from './store'

// Type for database player record
export interface SupabasePlayer {
  id: string
  user_id: string
  first_name: string
  last_name: string
  trainer_name: string
  password: string
  role: UserRole
  bp: number
  apex_rank: ApexRank
  wins: number
  losses: number
  streak: number
  current_league: LeagueStage
  gym_badges: Record<LeagueStage, any[]>
  elite_four_badges: any[]
  champion_badge: boolean
  emperor_title: EmperorTitle | null
  created_at: string
  created_by?: string
}

// Register new player - FIXED TYPE
export async function registerPlayerInSupabase(
  email: string,
  password: string,
  playerData: {
    firstName: string
    lastName: string
    trainerName: string
  }
) {
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) throw authError

    if (!authData.user) throw new Error('Failed to create user')

    // Generate trainer ID
    const trainerId = generateTrainerId()

    // Create player record in database
    const { data: playerRecord, error: playerError } = await supabase
      .from('players')
      .insert([
        {
          user_id: authData.user.id,
          first_name: playerData.firstName,
          last_name: playerData.lastName,
          trainer_name: playerData.trainerName,
          password: password, // Note: In production, never store plaintext passwords
          role: 'user' as UserRole,
          bp: 0,
          apex_rank: 'Rookie' as ApexRank,
          wins: 0,
          losses: 0,
          streak: 0,
          current_league: 'pokeball_1' as LeagueStage,
          gym_badges: createInitialGymBadges(),
          elite_four_badges: createInitialEliteFourBadges(),
          champion_badge: false,
          emperor_title: null,
        },
      ])
      .select()
      .single()

    if (playerError) throw playerError

    return { success: true, player: playerRecord, userId: authData.user.id }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Login player
export async function loginPlayerInSupabase(email: string, password: string) {
  try {
    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) throw authError

    if (!authData.user) throw new Error('Failed to authenticate')

    // Fetch player data from database
    const { data: playerData, error: playerError } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', authData.user.id)
      .single()

    if (playerError) throw playerError

    return { success: true, player: playerData, isAdmin: playerData.role !== 'user' }
  } catch (error: any) {
    return { success: false, error: error.message, isAdmin: false }
  }
}

// Logout
export async function logoutFromSupabase() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Get current session
export async function getCurrentSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return { success: true, session }
  } catch (error: any) {
    return { success: false, error: error.message, session: null }
  }
}

// Fetch all players
export async function fetchPlayersFromSupabase() {
  try {
    const { data, error } = await supabase.from('players').select('*')
    if (error) throw error
    return { success: true, players: data || [] }
  } catch (error: any) {
    return { success: false, error: error.message, players: [] }
  }
}

// Update player stats in Supabase
export async function updatePlayerStatsInSupabase(
  playerId: string,
  updates: { wins?: number; losses?: number; streak?: number; bp?: number }
) {
  try {
    const { data, error } = await supabase
      .from('players')
      .update(updates)
      .eq('id', playerId)
      .select()
      .single()

    if (error) throw error
    return { success: true, player: data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Update player profile in Supabase
export async function updatePlayerProfileInSupabase(
  playerId: string,
  updates: { first_name?: string; last_name?: string; trainer_name?: string }
) {
  try {
    const { data, error } = await supabase
      .from('players')
      .update(updates)
      .eq('id', playerId)
      .select()
      .single()

    if (error) throw error
    return { success: true, player: data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Update player role in Supabase
export async function updatePlayerRoleInSupabase(playerId: string, role: UserRole) {
  try {
    const { data, error } = await supabase
      .from('players')
      .update({ role })
      .eq('id', playerId)
      .select()
      .single()

    if (error) throw error
    return { success: true, player: data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Delete player from Supabase
export async function deletePlayerFromSupabase(playerId: string) {
  try {
    const { error } = await supabase.from('players').delete().eq('id', playerId)

    if (error) throw error
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Create player (for admin)
export async function createPlayerInSupabase(
  adminId: string,
  playerData: {
    firstName: string
    lastName: string
    trainerName: string
    password: string
    role: UserRole
  }
) {
  try {
    // Note: In a real app, you might want to create an auth user too
    // For now, we'll just create the player record

    const trainerId = generateTrainerId()

    const { data: playerRecord, error: playerError } = await supabase
      .from('players')
      .insert([
        {
          first_name: playerData.firstName,
          last_name: playerData.lastName,
          trainer_name: playerData.trainerName,
          password: playerData.password,
          role: playerData.role,
          bp: 0,
          apex_rank: 'Rookie' as ApexRank,
          wins: 0,
          losses: 0,
          streak: 0,
          current_league: 'pokeball_1' as LeagueStage,
          gym_badges: createInitialGymBadges(),
          elite_four_badges: createInitialEliteFourBadges(),
          champion_badge: false,
          emperor_title: null,
          created_by: adminId,
        },
      ])
      .select()
      .single()

    if (playerError) throw playerError

    return { success: true, player: playerRecord }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Helper functions
function generateTrainerId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = 'ETL-'
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function createInitialGymBadges() {
  const stages: LeagueStage[] = [
    'pokeball_1',
    'pokeball_2',
    'pokeball_3',
    'greatball_1',
    'greatball_2',
    'greatball_3',
    'ultraball_1',
    'ultraball_2',
    'ultraball_3',
    'masterball',
  ]
  const badges: Record<LeagueStage, any[]> = {} as Record<LeagueStage, any[]>

  stages.forEach((stage) => {
    badges[stage] = Array(8)
      .fill(null)
      .map(() => ({
        earned: false,
      }))
  })

  return badges
}

function createInitialEliteFourBadges() {
  return Array(4)
    .fill(null)
    .map((_, i) => ({
      position: i + 1,
      earned: false,
    }))
}