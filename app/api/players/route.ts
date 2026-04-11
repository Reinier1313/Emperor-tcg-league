import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Helper functions for role checking
async function getUserRole(userId: string, supabase: any) {
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  return userRole?.role || 'user';
}

async function isSuperAdmin(userId: string, supabase: any) {
  const role = await getUserRole(userId, supabase);
  return role === 'super_admin';
}

async function isAdminOrAbove(userId: string, supabase: any) {
  const role = await getUserRole(userId, supabase);
  return role === 'admin' || role === 'super_admin';
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get all players
    const { data: players, error } = await supabase
      .from('players')
      .select('*')
      .order('bp', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch players' },
        { status: 500 }
      );
    }

    return NextResponse.json(players);
  } catch (error) {
    console.error('[v0] Error fetching players:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if Admin or above
    const isAdmin = await isAdminOrAbove(user.id, supabase);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only Admins can create players' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.rank) {
      return NextResponse.json(
        { error: 'Missing required fields: name, rank' },
        { status: 400 }
      );
    }

    // Verify trainer card exists
    const { data: trainerCard } = await supabase
      .from('trainer_cards')
      .select('id')
      .eq('name', body.rank)
      .single();

    if (!trainerCard) {
      return NextResponse.json(
        { error: 'Invalid trainer card rank' },
        { status: 400 }
      );
    }

    // Create player
    const { data: player, error } = await supabase
      .from('players')
      .insert([
        {
          name: body.name,
          rank: body.rank,
          wins: body.wins || 0,
          losses: body.losses || 0,
          streak: body.streak || 0,
          bp: body.bp || 0,
          created_by: user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('[v0] Player creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create player' },
        { status: 500 }
      );
    }

    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    console.error('[v0] Error creating player:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
