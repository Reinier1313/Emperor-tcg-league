# Emperor TCG League - Supabase Integration Guide

## Architecture Overview

This guide explains how to add new trainer cards, manage player ranks, and integrate everything with Supabase.

### Key Concepts

1. **Trainer Cards**: Templates stored in the database with visual properties (colors, design style)
2. **Player Ranks**: Each player has a rank that determines their trainer card design
3. **User Roles**: Super Admin (you) → Admin → Moderator → User permissions hierarchy
4. **RLS (Row Level Security)**: Database-level security ensuring users can only access their data

---

## Database Schema

### Tables Created:

```sql
-- 1. trainer_cards: Template definitions for each card design
CREATE TABLE trainer_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,                    -- 'pokeball', 'greatball', 'ultraball', etc.
  display_name TEXT NOT NULL,                   -- 'Pokéball', 'Great Ball', etc.
  description TEXT,
  colors JSON NOT NULL,                         -- {primaryColor, secondaryColor, accentColor}
  ball_style TEXT NOT NULL,                     -- 'pokeball', 'greatball', 'ultraball', 'masterball'
  top_gradient_color TEXT,                      -- For gradient backgrounds
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 2. user_roles: Define role hierarchy and permissions
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,                           -- 'super_admin', 'admin', 'moderator', 'user'
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT now()
);

-- 3. players: Updated to include trainer card and rank info
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  bp INTEGER DEFAULT 0,
  trainer_card_id UUID NOT NULL REFERENCES trainer_cards(id),
  rank TEXT NOT NULL DEFAULT 'pokeball',       -- Quick reference to card type
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

---

## How It Works: Flow Diagram

```
User Login
    ↓
Get User Role from user_roles table
    ↓
Super Admin? ───YES──→ Can CRUD everything, change player ranks
    ↓ NO
Admin? ───YES──→ Can CRUD players, assign Moderators
    ↓ NO
Moderator? ───YES──→ Can edit player stats only
    ↓ NO
User ───→ View own profile
```

---

## File Structure

```
lib/
  supabase/
    client.ts          ← Browser Supabase client
    server.ts          ← Server Supabase client
  db/
    trainer-cards.ts   ← Functions to manage trainer card templates
    players.ts         ← Functions to manage player data
    roles.ts           ← Functions to manage user roles
  store.ts            ← Zustand store for client state (NEW)
  
components/
  admin/
    TrainerCardManager.tsx   ← Super Admin only: Add/edit trainer cards
    RankChanger.tsx          ← Super Admin: Change player ranks
    RoleAssigner.tsx         ← Super Admin: Assign admin roles
```

---

## Implementation Steps

### Step 1: Trainer Card Templates (Database)

All trainer card designs are templates stored in the database. This makes it EASY to add new designs:

```typescript
// Example: Adding a new trainer card

const newTrainerCard = {
  name: 'greatball',
  display_name: 'Great Ball',
  description: 'Intermediate trainer rank',
  colors: {
    primaryColor: '#3B82F6',      // Blue
    secondaryColor: '#EF4444',    // Red
    accentColor: '#FFFFFF'        // White
  },
  ball_style: 'greatball',
  top_gradient_color: '#60A5FA'
};

// INSERT into trainer_cards table
// Components automatically use this data to render the design
```

### Step 2: Changing Player Ranks (As Super Admin)

```typescript
// Simply update the trainer_card_id and rank field:
const updatePlayerRank = async (playerId: string, newTrainerCardId: string) => {
  const { data, error } = await supabase
    .from('players')
    .update({
      trainer_card_id: newTrainerCardId,
      rank: 'greatball'  // The display name of the card
    })
    .eq('id', playerId);
};
```

### Step 3: Role-Based Permissions

All components check the user's role before allowing actions:

```typescript
// In a component:
const { role } = useUserRole();

if (role === 'super_admin') {
  return <SuperAdminPanel />;
}

if (role === 'admin') {
  return <AdminPanel />;
}

if (role === 'moderator') {
  return <ModeratorPanel />;
}

return <UserPanel />;
```

---

## RLS (Row Level Security) Policies

These policies enforce permissions at the DATABASE LEVEL:

```sql
-- trainer_cards: Everyone can READ, only super admin can WRITE
CREATE POLICY "trainer_cards_read" ON trainer_cards FOR SELECT USING (true);
CREATE POLICY "trainer_cards_write" ON trainer_cards FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- players: Read own + admin's players, Write only with proper role
CREATE POLICY "players_read_own" ON players FOR SELECT 
  USING (auth.uid() = created_by OR EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin', 'moderator')
  ));

CREATE POLICY "players_write_own" ON players FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- user_roles: Only super admin can assign roles
CREATE POLICY "user_roles_view" ON user_roles FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "user_roles_assign" ON user_roles FOR INSERT 
  WITH CHECK (
    assigned_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );
```

---

## How to Add a New Trainer Card Design (Easy!)

### Option A: Through the App (As Super Admin)
1. Go to Admin Panel → Trainer Cards
2. Click "Add New Card"
3. Fill in:
   - Name: `ultraball`
   - Display Name: `Ultra Ball`
   - Colors: Choose your colors
   - Ball Style: Select from dropdown
4. Save - Done! All components automatically update

### Option B: Direct SQL (If you prefer)
```sql
INSERT INTO trainer_cards (name, display_name, colors, ball_style) VALUES
('ultraball', 'Ultra Ball', 
  '{"primaryColor":"#8B5CF6","secondaryColor":"#EF4444","accentColor":"#FFFFFF"}',
  'ultraball');
```

### Option C: Programmatically
```typescript
import { createClient } from '@/lib/supabase/server';

export async function createTrainerCard(cardData) {
  const supabase = createClient();
  
  return await supabase
    .from('trainer_cards')
    .insert([cardData]);
}
```

---

## Key Differences: Before vs After Integration

### BEFORE (localStorage):
```typescript
// store.ts - All data in memory/browser
const players = JSON.parse(localStorage.getItem('players')) || [];

// Problem: 
// - Data lost on browser clear
// - No user authentication
// - No real permissions
```

### AFTER (Supabase):
```typescript
// lib/db/players.ts - Queries from database
const { data: players } = await supabase
  .from('players')
  .select('*')
  .order('bp', { ascending: false });

// Benefits:
// - Persistent data across devices
// - Real authentication with Supabase Auth
// - RLS enforces permissions at database level
// - Audit trail (who created/modified what)
```

---

## Updated Component Flow

### Old Way (with localStorage):
```
Component
  ↓
useStore (Zustand store with localStorage)
  ↓
JSON in browser memory
```

### New Way (with Supabase):
```
Component
  ↓
useQuery hook (fetch from database)
  ↓
Server Action or API route
  ↓
Supabase (with RLS enforcement)
  ↓
PostgreSQL Database
```

---

## Updating utils.ts and store.ts

### utils.ts Changes:
```typescript
// BEFORE: Helper functions for rank calculations
export const calculateRank = (bp: number) => {...}

// AFTER: Added database-aware utilities
export const calculateRank = (bp: number) => {...}  // Keep this
export const getTrainerCardByBP = async (bp: number) => {
  // Query trainer_cards to find appropriate card for this BP
  const supabase = createClient();
  return await supabase
    .from('trainer_cards')
    .select('*')
    .order('min_bp', { ascending: false })
    .lt('min_bp', bp)
    .limit(1);
}
```

### store.ts Changes:
```typescript
// BEFORE: Zustand store with localStorage
export const usePlayerStore = create((set) => ({
  players: loadPlayersFromLocalStorage(),
  addPlayer: (player) => { ... localStorage.setItem() }
}));

// AFTER: Zustand store + Supabase integration
export const usePlayerStore = create((set) => ({
  players: [],
  loading: false,
  
  // Still use local state for UI responsiveness
  setPlayers: (players) => set({ players }),
  
  // But fetch from Supabase
  fetchPlayers: async () => {
    set({ loading: true });
    const supabase = createClient();
    const { data } = await supabase.from('players').select('*');
    set({ players: data, loading: false });
  },
  
  // Mutations go to server actions
  addPlayer: async (player) => {
    const result = await createPlayerAction(player);
    // Then refetch
    // (Or use optimistic updates)
  }
}));
```

---

## Security: Super Admin Verification

You will be the ONLY Super Admin. Here's how it works:

### 1. On Signup:
```typescript
const signUp = async (email: string, password: string, isSuperAdmin: boolean) => {
  const supabase = createClient();
  
  // Sign up the user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      data: {
        is_super_admin_candidate: isSuperAdmin  // Flag for verification
      }
    }
  });
  
  return { data, error };
};
```

### 2. After Email Confirmation:
```typescript
// Server action that only YOU can run (requires manual approval)
export async function assignSuperAdminRole(userId: string) {
  // This would only be callable by someone already authenticated as super admin
  // OR requires a server-side secret key
  
  const supabase = createServerClient();
  
  return await supabase
    .from('user_roles')
    .insert({
      user_id: userId,
      role: 'super_admin',
      assigned_by: (await supabase.auth.getUser()).data.user.id
    });
}
```

---

## Testing the Setup

1. **Invite an Admin**: Go to Admin Panel → Add Admin, enter their email
2. **Admin tries Super Admin action**: Should get permission denied (RLS blocks it)
3. **You perform Super Admin action**: Works perfectly
4. **Change a player's rank**: Click player → "Change Rank" → Select Greatball → Save
5. **See it update**: Component re-fetches and displays new card design

---

## Migration Path: localStorage → Supabase

Currently your app uses `store.ts` with localStorage. Here's the gradual migration:

```
Phase 1: Setup Supabase (THIS)
  ↓
Phase 2: Add Supabase queries alongside localStorage
  ↓
Phase 3: Gradually replace localStorage calls
  ↓
Phase 4: Remove localStorage entirely
```

This way you can test everything without breaking existing functionality.

---

## Summary

**What Changed:**
- Data lives in Supabase (postgres database) instead of browser memory
- User roles managed in database with RLS enforcement
- Trainer card designs are templates, easy to add new ones
- Super Admin (you) can change player ranks instantly

**What Stayed the Same:**
- Component structure is mostly the same
- UI looks exactly the same
- Local Zustand store still used for performance
- But now backed by persistent database

**Adding New Cards:**
1. Create trainer card template in database
2. Assign to players via Admin Panel
3. Components automatically render correct design
4. No code changes needed!
