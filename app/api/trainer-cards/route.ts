import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Helper to check if user is Super Admin
async function isSuperAdmin(userId: string, supabase: any) {
  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'super_admin')
    .single();

  return !!userRole;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get all active trainer cards
    const { data: cards, error } = await supabase
      .from('trainer_cards')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch trainer cards' },
        { status: 500 }
      );
    }

    return NextResponse.json(cards);
  } catch (error) {
    console.error('[v0] Error fetching trainer cards:', error);
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

    // Check if Super Admin
    const superAdmin = await isSuperAdmin(user.id, supabase);
    if (!superAdmin) {
      return NextResponse.json(
        { error: 'Only Super Admin can create trainer cards' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.display_name || !body.ball_style) {
      return NextResponse.json(
        { error: 'Missing required fields: name, display_name, ball_style' },
        { status: 400 }
      );
    }

    // Insert trainer card
    const { data: card, error } = await supabase
      .from('trainer_cards')
      .insert([
        {
          name: body.name,
          display_name: body.display_name,
          description: body.description || '',
          colors: body.colors || {},
          ball_style: body.ball_style,
          top_gradient_color: body.top_gradient_color,
          bottom_gradient_color: body.bottom_gradient_color,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('[v0] Trainer card creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create trainer card' },
        { status: 500 }
      );
    }

    return NextResponse.json(card, { status: 201 });
  } catch (error) {
    console.error('[v0] Error creating trainer card:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
