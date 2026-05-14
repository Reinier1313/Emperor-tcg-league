import { supabase } from './supabaseClient'
import { Player, UserRole } from './store'

// ============================================
// REGISTRATION & AUTHENTICATION
// ============================================

/**
 * Register a new player using Supabase Auth
 * Creates auth user, player profile, user role, and progression data
 */
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
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' }
    }

    // Step 0: Check if username already exists
    const { data: existingPlayer, error: checkError } = await supabase
      .from('players')
      .select('id')
      .ilike('username', playerData.trainerName)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      throw checkError
    }

    if (existingPlayer) {
      return { success: false, error: 'Username already taken' }
    }

    // Step 0b: Check if email already exists
    const { data: existingEmail, error: emailCheckError } = await supabase
      .from('players')
      .select('id')
      .ilike('email', email)
      .single()

    if (emailCheckError && emailCheckError.code !== 'PGRST116') { // PGRST116 = no rows found
      throw emailCheckError
    }

    if (existingEmail) {
      return { success: false, error: 'Email already exists' }
    }

    // Step 1: Create auth user via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('Failed to create user')

    const userId = authData.user.id

    // Step 2: Create player profile
    const { data: playerRecord, error: playerError } = await supabase
      .from('players')
      .insert([
        {
          user_id: userId,
          username: playerData.trainerName,
          email: email,
          full_name: `${playerData.firstName} ${playerData.lastName}`,
        },
      ])
      .select()
      .single()

    if (playerError) throw playerError

    // Step 3: Create user role (default to 'user')
    const { error: roleError } = await supabase
      .from('users_roles')
      .insert([
        {
          user_id: userId,
          role: 'user',
        },
      ])

    if (roleError) throw roleError

    // Step 4: Create player progression
    const { error: progressionError } = await supabase
      .from('player_progression')
      .insert([
        {
          user_id: userId,
        },
      ])

    if (progressionError) throw progressionError

    return { 
      success: true, 
      player: playerRecord, 
      userId,
      trainerId: playerData.trainerName 
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Login player using email, trainer name, or trainer ID via Supabase Auth
 */
export async function loginPlayerInSupabase(identifier: string, password: string) {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured', isAdmin: false, player: null }
    }

    let email = identifier

    // If identifier is not an email, look up the email from the players table
    if (!identifier.includes('@')) {
      const { data: playerLookup, error: lookupError } = await supabase
        .from('players')
        .select('email')
        .or(`username.ilike.${identifier},id.ilike.${identifier}`)
        .single()

      if (lookupError || !playerLookup?.email) {
        return { success: false, error: 'Trainer not found. Try logging in with your email.', isAdmin: false, player: null }
      }

      email = playerLookup.email
    }

    // Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('Authentication failed')

    const userId = authData.user.id

    // Get player profile
    const { data: playerData, error: playerError } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (playerError) throw playerError

    // Get user role
    const { data: roleData, error: roleError } = await supabase
      .from('users_roles')
      .select('role')
      .eq('user_id', userId)
      .single()

    const userRole = roleData?.role || 'user'
    const isAdmin = ['super_admin', 'admin', 'moderator'].includes(userRole)

    // Get player progression
    const { data: progressionData } = await supabase
      .from('player_progression')
      .select('*')
      .eq('user_id', userId)
      .single()

    const player = {
      ...playerData,
      role: userRole,
      progression: progressionData,
    }

    return { 
      success: true, 
      player,
      userId,
      isAdmin,
    }
  } catch (error: any) {
    return { success: false, error: error.message, isAdmin: false, player: null }
  }
}

/**
 * Logout user from Supabase Auth
 */
export async function logoutFromSupabase() {
  try {
    if (!supabase) return { success: true }
    
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Get current authenticated session
 */
export async function getCurrentSession() {
  try {
    if (!supabase) return { success: false, error: 'Supabase not configured', session: null }
    
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    
    return { success: true, session }
  } catch (error: any) {
    return { success: false, error: error.message, session: null }
  }
}

// ============================================
// PLAYER MANAGEMENT
// ============================================

/**
 * Fetch all players with their progression data
 */
export async function fetchPlayersFromSupabase() {
  try {
    if (!supabase) return { success: false, error: 'Supabase not configured', players: [] }
    
    const { data, error } = await supabase
      .from('players')
      .select(`
        *,
        user_role:users_roles(role),
        progression:player_progression(*)
      `)

    if (error) throw error
    return { success: true, players: data || [] }
  } catch (error: any) {
    return { success: false, error: error.message, players: [] }
  }
}

/**
 * Fetch a specific player by user_id
 */
export async function fetchPlayerByUserId(userId: string) {
  try {
    if (!supabase) return { success: false, error: 'Supabase not configured', player: null }
    
    const { data, error } = await supabase
      .from('players')
      .select(`
        *,
        user_role:users_roles(role),
        progression:player_progression(*),
        badges:gym_badges(*),
        battles:battle_history(*)
      `)
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return { success: true, player: data }
  } catch (error: any) {
    return { success: false, error: error.message, player: null }
  }
}

/**
 * Update player profile information
 */
export async function updatePlayerProfileInSupabase(
  userId: string,
  updates: { full_name?: string; username?: string }
) {
  try {
    if (!supabase) return { success: false, error: 'Supabase not configured' }
    
    const { data, error } = await supabase
      .from('players')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return { success: true, player: data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Update player progression data
 */
export async function updatePlayerProgressionInSupabase(
  userId: string,
  updates: Partial<any>
) {
  try {
    if (!supabase) return { success: false, error: 'Supabase not configured' }
    
    const { data, error } = await supabase
      .from('player_progression')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return { success: true, progression: data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ============================================
// ADMIN FUNCTIONS
// ============================================

/**
 * Update player role (admin only)
 */
export async function updatePlayerRoleInSupabase(userId: string, role: UserRole) {
  try {
    if (!supabase) return { success: false, error: 'Supabase not configured' }
    
    const { data, error } = await supabase
      .from('users_roles')
      .update({ role })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return { success: true, role: data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Delete player and all associated data
 */
export async function deletePlayerFromSupabase(userId: string) {
  try {
    if (!supabase) return { success: false, error: 'Supabase not configured' }
    
    // Delete from players table (cascades will handle other tables)
    const { error } = await supabase
      .from('players')
      .delete()
      .eq('user_id', userId)

    if (error) throw error
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ============================================
// GYM BADGES & BATTLE TRACKING
// ============================================

/**
 * Record a gym badge earned
 */
export async function recordGymBadgeInSupabase(
  userId: string,
  gymName: string,
  stage: string
) {
  try {
    if (!supabase) return { success: false, error: 'Supabase not configured' }
    
    const { data, error } = await supabase
      .from('gym_badges')
      .insert([
        {
          user_id: userId,
          gym_name: gymName,
          stage: stage,
          badge_earned: true,
        },
      ])
      .select()
      .single()

    if (error) throw error
    return { success: true, badge: data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Record a battle in history
 */
export async function recordBattleInSupabase(
  userId: string,
  battleData: {
    opponent_type: string
    opponent_name?: string
    result: 'win' | 'loss' | 'draw'
    battle_points_earned: number
  }
) {
  try {
    if (!supabase) return { success: false, error: 'Supabase not configured' }
    
    const { data, error } = await supabase
      .from('battle_history')
      .insert([
        {
          user_id: userId,
          opponent_type: battleData.opponent_type,
          opponent_name: battleData.opponent_name,
          result: battleData.result,
          battle_points_earned: battleData.battle_points_earned,
        },
      ])
      .select()
      .single()

    if (error) throw error
    return { success: true, battle: data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Fetch battle history for a player
 */
export async function fetchBattleHistoryInSupabase(userId: string) {
  try {
    if (!supabase) return { success: false, error: 'Supabase not configured', battles: [] }
    
    const { data, error } = await supabase
      .from('battle_history')
      .select('*')
      .eq('user_id', userId)
      .order('battle_date', { ascending: false })

    if (error) throw error
    return { success: true, battles: data || [] }
  } catch (error: any) {
    return { success: false, error: error.message, battles: [] }
  }
}

/**
 * Fetch gym badges for a player
 */
export async function fetchGymBadgesInSupabase(userId: string) {
  try {
    if (!supabase) return { success: false, error: 'Supabase not configured', badges: [] }
    
    const { data, error } = await supabase
      .from('gym_badges')
      .select('*')
      .eq('user_id', userId)

    if (error) throw error
    return { success: true, badges: data || [] }
  } catch (error: any) {
    return { success: false, error: error.message, badges: [] }
  }
}

// ============================================
// PASSWORD MANAGEMENT
// ============================================

/**
 * Request password reset via Supabase Auth
 */
export async function requestPasswordReset(email: string) {
  try {
    if (!supabase) return { success: false, error: 'Supabase not configured' }
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/reset-password`,
    })

    if (error) throw error
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Update user password
 */
export async function updatePassword(newPassword: string) {
  try {
    if (!supabase) return { success: false, error: 'Supabase not configured' }
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) throw error
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
