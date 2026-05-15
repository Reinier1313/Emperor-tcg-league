import { supabase } from './supabaseClient'
import { Player, UserRole } from './store'

// ============================================
// REGISTRATION & AUTHENTICATION
// ============================================

/**
 * Register a new player using Supabase Auth
 * 1. Generates a unique ETL-XXXXXX Trainer ID
 * 2. Checks for duplicate usernames/emails
 * 3. Registers via Supabase Auth with metadata for the SQL Trigger
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

    // Step 1: Check if username already exists
    const { data: existingPlayer, error: checkError } = await supabase
      .from('players')
      .select('id')
      .ilike('username', playerData.trainerName)
      .maybeSingle() 

    if (checkError) throw checkError
    if (existingPlayer) {
      return { success: false, error: 'Trainer Name already taken' }
    }

    // Step 2: Check if email already exists
    const { data: existingEmail, error: emailCheckError } = await supabase
      .from('players')
      .select('id')
      .ilike('email', email)
      .maybeSingle()

    if (emailCheckError) throw emailCheckError
    if (existingEmail) {
      return { success: false, error: 'Email already exists' }
    }

    // Step 3: GENERATE UNIQUE TRAINER ID (ETL-XXXXXX)
    let uniqueTrainerId = '';
    let isUnique = false;
    
    // Loop ensures we never assign an ID that someone else already has
    while (!isUnique) {
      // Generates ETL- followed by 6 random numbers
      uniqueTrainerId = `ETL-${Math.floor(100000 + Math.random() * 900000)}`;
      const { data } = await supabase
        .from('players')
        .select('trainer_id')
        .eq('trainer_id', uniqueTrainerId)
        .maybeSingle();

      if (!data) isUnique = true; 
    }

    // Step 4: Create auth user & pass metadata for the SQL Trigger to catch
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: playerData.firstName,
          last_name: playerData.lastName,
          trainer_name: playerData.trainerName,
          trainer_id: uniqueTrainerId // Passing our unique ID!
        }
      }
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('Failed to create user')

    return { 
      success: true, 
      userId: authData.user.id,
      trainerId: uniqueTrainerId // Frontend uses this to show the success message
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Login player using email, trainer name, or trainer ID (ETL-XXXXXX)
 */
export async function loginPlayerInSupabase(identifier: string, password: string) {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured', isAdmin: false, player: null }
    }

    let targetEmail = identifier

    // If identifier is NOT an email, look up the email from the database
    if (!identifier.includes('@')) {
      // Look up by exact Trainer ID OR case-insensitive Trainer Name
      const lookupQuery = `username.ilike."${identifier}",trainer_id.eq."${identifier.toUpperCase()}"`;

      const { data: playerLookup, error: lookupError } = await supabase
        .from('players')
        .select('email')
        .or(lookupQuery)
        .maybeSingle()

      if (lookupError || !playerLookup?.email) {
        return { success: false, error: 'Trainer not found. Try logging in with your email or Trainer ID.', isAdmin: false, player: null }
      }

      // We found the email attached to that Trainer ID / Username!
      targetEmail = playerLookup.email
    }

    // Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password,
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('Authentication failed')

    const userId = authData.user.id

    // Fetch the full profile (including the joined role and progression)
    const { data: p, error: pError } = await supabase
      .from('players')
      .select(`
        *,
        user_role:users_roles(role),
        progression:player_progression(*)
      `)
      .eq('user_id', userId)
      .single()

    if (pError) throw pError

    // Flatten data for the App Store
    const prog = Array.isArray(p.progression) ? p.progression[0] : (p.progression || {})
    const roleObj = Array.isArray(p.user_role) ? p.user_role[0] : (p.user_role || {})
    const userRole = (roleObj.role || 'user') as UserRole

    const player = {
      ...p,
      id: p.trainer_id, // Map ETL-XXXXXX as the primary ID
      dbUserId: p.user_id, // Keep UUID hidden for background queries
      role: userRole,
      progression: prog,
    }

    return { 
      success: true, 
      player,
      userId,
      isAdmin: ['super_admin', 'admin', 'moderator'].includes(userRole),
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
// PLAYER & LEAGUE MANAGEMENT
// ============================================

/**
 * Fetch all players for the Admin Panel
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
 * Update player progression data (Wins, BP, etc.)
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