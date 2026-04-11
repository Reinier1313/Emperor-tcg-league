import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/function';

// Helper functions
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

async function isModeratorOrAbove(userId: string, supabase: any) {
  const role = await getUserRole(userId, supabase);
  return ['moderator', 'admin', 'super_admin'].includes(role);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const playerId = params.id;

    const { data: player, error } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .single();

    if (error || !player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    return NextResponse.json(player);
  } catch (error) {
    console.error('[v0] Error fetching player:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const playerId = params.id;
    const body = await request.json();

    // Get user role
    const userRole = await getUserRole(user.id, supabase);

    // Determine what fields can be updated based on role
    let updateData: any = {};

    // Super Admin can update anything
    if (userRole === 'super_admin') {
      updateData = body;
      if (body.rank) {
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
      }
    }
    // Admin can update everything except rank
    else if (userRole === 'admin') {
      const { rank, ...adminFields } = body;
      updateData = adminFields;
    }
    // Moderator can only update stats
    else if (userRole === 'moderator') {
      const { wins, losses, streak, bp } = body;
      updateData = {};
      if (wins !== undefined) updateData.wins = wins;
      if (losses !== undefined) updateData.losses = losses;
      if (streak !== undefined) updateData.streak = streak;
      if (bp !== undefined) updateData.bp = bp;
    } else {
      return NextResponse.json(
        { error: 'Insufficient permissions to update player' },
        { status: 403 }
      );
    }

    // Add updated_by and update timestamp
    updateData.updated_by = user.id;
    updateData.updated_at = new Date().toISOString();

    // Update player
    const { data: player, error } = await supabase
      .from('players')
      .update(updateData)
      .eq('id', playerId)
      .select()
      .single();

    if (error) {
      console.error('[v0] Player update error:', error);
      return NextResponse.json(
        { error: 'Failed to update player' },
        { status: 500 }
      );
    }

    return NextResponse.json(player);
  } catch (error) {
    console.error('[v0] Error updating player:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only Super Admin can delete
    const isSuperAdminUser = await isSuperAdmin(user.id, supabase);
    if (!isSuperAdminUser) {
      return NextResponse.json(
        { error: 'Only Super Admin can delete players' },
        { status: 403 }
      );
    }

    const playerId = params.id;

    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', playerId);

    if (error) {
      console.error('[v0] Player deletion error:', error);
      return NextResponse.json(
        { error: 'Failed to delete player' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Error deleting player:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
