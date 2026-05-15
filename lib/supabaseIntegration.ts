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

    let targetEmail = identifier.trim() // Clean whitespace

    // If identifier is NOT an email, look up the email from the database
    if (!targetEmail.includes('@')) {
      // Look up by exact Trainer ID (case-corrected) OR case-insensitive Trainer Name
      const lookupQuery = `username.ilike."${targetEmail}",trainer_id.eq."${targetEmail.toUpperCase()}"`;

      const { data: playerLookup, error: lookupError } = await supabase
        .from('players')
        .select('email')
        .or(lookupQuery)
        .maybeSingle()

      if (lookupError || !playerLookup?.email) {
        return { 
          success: false, 
          error: 'Trainer not found. Try logging in with your email or Trainer ID.', 
          isAdmin: false, 
          player: null 
        }
      }

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

    // ==========================================
    // DECOUPLED QUERIES (Bypasses 400 Join Error)
    // ==========================================

    // 1. Fetch core profile
    const { data: p, error: pError } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (pError) throw pError

    // 2. Fetch role
    const { data: roleData } = await supabase
      .from('users_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle()

    // 3. Fetch progression
    const { data: progData } = await supabase
      .from('player_progression')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    // Flatten data for the App Store
    const prog = progData || {}
    const userRole = (roleData?.role || 'user') as UserRole

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
    
    // Decoupled query to prevent 400 Bad Request
    const { data: playersData, error: playersError } = await supabase.from('players').select('*')
    if (playersError) throw playersError

    const { data: rolesData } = await supabase.from('users_roles').select('*')
    const { data: progData } = await supabase.from('player_progression').select('*')

    const players = (playersData || []).map((p: any) => {
      const roleMatch = rolesData?.find((r: any) => r.user_id === p.user_id)
      const progMatch = progData?.find((pr: any) => pr.user_id === p.user_id)

      return {
        ...p,
        user_role: roleMatch ? [roleMatch] : [],
        progression: progMatch ? [progMatch] : []
      }
    })

    return { success: true, players }
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
    
    // Decoupled query to prevent 400 Bad Request
    const { data: p, error: pError } = await supabase.from('players').select('*').eq('user_id', userId).single()
    if (pError) throw pError

    const { data: roleData } = await supabase.from('users_roles').select('*').eq('user_id', userId).maybeSingle()
    const { data: progData } = await supabase.from('player_progression').select('*').eq('user_id', userId).maybeSingle()
    const { data: badgesData } = await supabase.from('gym_badges').select('*').eq('user_id', userId)
    const { data: battlesData } = await supabase.from('battle_history').select('*').eq('user_id', userId)

    const player = {
      ...p,
      user_role: roleData ? [roleData] : [],
      progression: progData ? [progData] : [],
      badges: badgesData || [],
      battles: battlesData || []
    }

    return { success: true, player }
  } catch (error: any) {
    return { success: false, error: error.message, player: null }
  }
}

// ============================================
// CRASH-PROOF UPDATES (406 FIX)
// ============================================

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

    if (error) throw error
    // Safely extract without .single()
    const updatedPlayer = Array.isArray(data) ? data[0] : data
    return { success: true, player: updatedPlayer }
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
    
    // Safely check using limit(1) instead of maybeSingle()
    const { data: existing } = await supabase
      .from('player_progression')
      .select('id')
      .eq('user_id', userId)
      .limit(1)

    let result;
    
    if (existing && existing.length > 0) {
      result = await supabase
        .from('player_progression')
        .update(updates)
        .eq('user_id', userId)
        .select()
    } else {
      result = await supabase
        .from('player_progression')
        .insert([{ user_id: userId, ...updates }])
        .select()
    }

    if (result.error) throw result.error
    
    const updatedProgression = Array.isArray(result.data) ? result.data[0] : result.data
    return { success: true, progression: updatedProgression }
  } catch (error: any) {
    console.error("Progression Update Error:", error)
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
    
    const { data: existing } = await supabase
      .from('users_roles')
      .select('id')
      .eq('user_id', userId)
      .limit(1)

    let result;
    
    if (existing && existing.length > 0) {
      result = await supabase
        .from('users_roles')
        .update({ role })
        .eq('user_id', userId)
        .select()
    } else {
      result = await supabase
        .from('users_roles')
        .insert([{ user_id: userId, role }])
        .select()
    }

    if (result.error) throw result.error
    
    const updatedRole = Array.isArray(result.data) ? result.data[0] : result.data
    return { success: true, role: updatedRole }
  } catch (error: any) {
    console.error("Role Update Error:", error)
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

    if (error) throw error
    const newBadge = Array.isArray(data) ? data[0] : data
    return { success: true, badge: newBadge }
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

    if (error) throw error
    const newBattle = Array.isArray(data) ? data[0] : data
    return { success: true, battle: newBattle }
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
    
    // Use window.location.origin to ensure the redirect matches the current domain
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://emperor-tcg-league.vercel.app'
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/reset-password`,
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