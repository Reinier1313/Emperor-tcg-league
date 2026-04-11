'use client';

import { createClient } from '@/lib/supabase/client';

/**
 * SUPABASE INTEGRATION GUIDE
 * ===========================
 * This file replaces the localStorage-based store with Supabase backend.
 * 
 * Key changes:
 * - Data persists to Supabase database (not localStorage)
 * - Authentication through Supabase Auth
 * - Row Level Security (RLS) controls data access
 * - User roles determine permissions
 */

// Types
export type UserRole = 'super_admin' | 'admin' | 'moderator' | 'user';

export interface Player {
  id: string;
  name: string;
  wins: number;
  losses: number;
  streak: number;
  bp: number;
  rank: string;
  created_by: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TrainerCard {
  id: string;
  name: string;
  display_name: string;
  description: string;
  colors: Record<string, string>;
  ball_style: string;
  top_gradient_color: string;
  bottom_gradient_color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  assigned_by?: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
}

// Supabase client instance
const supabase = createClient();

/**
 * PLAYERS MANAGEMENT
 */

export async function fetchPlayers(): Promise<Player[]> {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('bp', { ascending: false });

    if (error) {
      console.error('[v0] Error fetching players:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[v0] Error fetching players:', error);
    return [];
  }
}

export async function createPlayer(playerData: {
  name: string;
  rank: string;
  wins?: number;
  losses?: number;
  streak?: number;
  bp?: number;
}): Promise<Player | null> {
  try {
    const response = await fetch('/api/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(playerData),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[v0] Error creating player:', error);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('[v0] Error creating player:', error);
    return null;
  }
}

export async function updatePlayer(
  playerId: string,
  updates: Partial<Player>
): Promise<Player | null> {
  try {
    const response = await fetch(`/api/players/${playerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[v0] Error updating player:', error);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('[v0] Error updating player:', error);
    return null;
  }
}

export async function deletePlayer(playerId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/players/${playerId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      console.error('[v0] Error deleting player');
      return false;
    }

    return true;
  } catch (error) {
    console.error('[v0] Error deleting player:', error);
    return false;
  }
}

/**
 * TRAINER CARDS MANAGEMENT
 */

export async function fetchTrainerCards(): Promise<TrainerCard[]> {
  try {
    const { data, error } = await supabase
      .from('trainer_cards')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[v0] Error fetching trainer cards:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[v0] Error fetching trainer cards:', error);
    return [];
  }
}

export async function createTrainerCard(
  cardData: Omit<TrainerCard, 'id' | 'created_at' | 'updated_at'>
): Promise<TrainerCard | null> {
  try {
    const response = await fetch('/api/trainer-cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cardData),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[v0] Error creating trainer card:', error);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('[v0] Error creating trainer card:', error);
    return null;
  }
}

/**
 * USER AUTHENTICATION & ROLES
 */

export async function getCurrentUser(): Promise<User | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    // Get user's role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email || '',
      role: (roleData?.role as UserRole) || 'user',
    };
  } catch (error) {
    console.error('[v0] Error getting current user:', error);
    return null;
  }
}

export async function isSuperAdmin(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return user?.role === 'super_admin';
  } catch (error) {
    console.error('[v0] Error checking super admin status:', error);
    return false;
  }
}

export async function isAdmin(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return user?.role === 'admin' || user?.role === 'super_admin';
  } catch (error) {
    console.error('[v0] Error checking admin status:', error);
    return false;
  }
}

export async function isModerator(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return (
      ['moderator', 'admin', 'super_admin'].includes(user?.role || '') ||
      false
    );
  } catch (error) {
    console.error('[v0] Error checking moderator status:', error);
    return false;
  }
}

/**
 * AUTHENTICATION FLOWS
 */

export async function signUp(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
          `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('[v0] Sign up error:', error);
      return { success: false, error: error.message };
    }

    // Create user role record
    if (data.user) {
      await supabase
        .from('user_roles')
        .insert([{ user_id: data.user.id, role: 'user' }])
        .single();
    }

    return { success: true, data };
  } catch (error) {
    console.error('[v0] Sign up error:', error);
    return { success: false, error: 'An error occurred' };
  }
}

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('[v0] Sign in error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('[v0] Sign in error:', error);
    return { success: false, error: 'An error occurred' };
  }
}

export async function signOut() {
  try {
    await supabase.auth.signOut();
    return { success: true };
  } catch (error) {
    console.error('[v0] Sign out error:', error);
    return { success: false, error: 'An error occurred' };
  }
}

/**
 * RANK CONVERSION HELPER
 * Maps rank strings to trainer card display names for UI rendering
 */

export const RANK_CONFIG: Record<
  string,
  { displayName: string; color: string }
> = {
  pokeball: { displayName: 'Pokéball', color: '#EF4444' },
  greatball: { displayName: 'Great Ball', color: '#3B82F6' },
  ultraball: { displayName: 'Ultra Ball', color: '#A855F7' },
  masterball: { displayName: 'Master Ball', color: '#000000' },
};

export function getRankDisplayName(rank: string): string {
  return RANK_CONFIG[rank]?.displayName || rank;
}

export function getRankColor(rank: string): string {
  return RANK_CONFIG[rank]?.color || '#000000';
}
