# Backend Migration Guide: localStorage → Supabase

This guide explains how we've migrated from localStorage to Supabase and teaches you everything about the system architecture.

## What Changed and Why

### **Before (localStorage)**
```tsx
// Data stored in browser memory only
const players = JSON.parse(localStorage.getItem('players') || '[]');
// Problem: Data lost when browser cache cleared, no real persistence
```

### **After (Supabase)**
```tsx
// Data stored in PostgreSQL database
const { data: players } = await supabase.from('players').select('*');
// Benefit: Data persists, accessible from anywhere, secure, scalable
```

---

## Understanding the New Architecture

### **1. Database Layer (Supabase PostgreSQL)**

Three main tables manage the system:

#### **trainer_cards** - Stores all trainer card designs
```sql
trainer_cards {
  id: UUID (unique identifier)
  name: 'pokeball' | 'greatball' | 'ultraball' | 'masterball'
  display_name: 'Pokéball', 'Great Ball', etc.
  ball_style: the visual style identifier
  colors: JSON with color configuration
  is_active: boolean (if available for use)
  created_at: when it was created
}
```

**How it works:**
- Only Super Admin can modify (insert/update/delete)
- Everyone can read active cards
- When you assign a player a "greatball" rank, you're linking them to the trainer_cards record with name='greatball'

#### **players** - Stores player profiles and stats
```sql
players {
  id: UUID
  name: 'Player Name'
  rank: 'pokeball' (references trainer_cards.name)
  wins: number (# of tournament wins)
  losses: number (# of tournament losses)
  streak: number (current win streak)
  bp: number (Battle Points total)
  created_by: UUID (admin who created the player)
  created_at: timestamp
}
```

**Permissions:**
- Super Admin: Can CRUD everything
- Admin: Can create/read/update players (except rank), can CRUD moderators
- Moderator: Can read all, update only stats (wins/losses/bp/streak)
- User: Can read their own data

#### **user_roles** - Manages who has what permissions
```sql
user_roles {
  id: UUID
  user_id: UUID (references auth.users.id)
  role: 'super_admin' | 'admin' | 'moderator' | 'user'
  assigned_by: UUID (who assigned this role)
  created_at: timestamp
}
```

---

### **2. Authentication Layer (Supabase Auth)**

Supabase provides built-in authentication without managing passwords yourself.

**Flow:**
1. User signs up with email/password → stored in `auth.users` table
2. User signs in → Supabase generates a session token
3. Token stored in browser (secure cookie)
4. Every API request includes the token
5. Supabase verifies token = user is authenticated

**In your code:**
```tsx
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();
// user.id = currently logged-in user's ID
```

---

### **3. API Layer (Next.js Route Handlers)**

Instead of localStorage access, we now have typed API endpoints:

```
POST   /api/players           → Create new player (Admin only)
GET    /api/players           → List all players
GET    /api/players/{id}      → Get single player
PUT    /api/players/{id}      → Update player (role-based)
DELETE /api/players/{id}      → Delete player (Super Admin only)

GET    /api/trainer-cards     → List all active cards
POST   /api/trainer-cards     → Create new card (Super Admin only)
```

**How it works:**
```tsx
// Creating a player through API
const response = await fetch('/api/players', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Ash Ketchum',
    rank: 'pokeball',
    wins: 10,
    losses: 2,
    bp: 500
  })
});

const newPlayer = await response.json();
```

---

### **4. Row Level Security (RLS)**

The database enforces permissions automatically at the SQL level.

**Example:** A Moderator tries to change a player's rank:
```tsx
// In app code
await updatePlayer('player-123', { rank: 'greatball' });

// At database level:
// 1. Supabase checks: Is current user a moderator?
// 2. Checks RLS policy for moderator updates
// 3. Policy says: "Moderators can only update wins, losses, streak, bp"
// 4. UPDATE gets rejected before reaching database
```

**Why this matters:**
- Security is enforced at database level, not just UI
- Even if someone modifies the frontend code, they can't bypass permissions
- Malicious code can't directly update the database

---

## How to Use the New Store

### **Old Way (localStorage)**
```tsx
// app/page.tsx (OLD - DON'T USE)
import { useStore } from '@/lib/store';

const App = () => {
  const { players, addPlayer } = useStore();
  
  return <div>{players.length} players</div>;
};
```

### **New Way (Supabase)**
```tsx
// app/page.tsx (NEW)
'use client';

import { useState, useEffect } from 'react';
import { fetchPlayers, createPlayer } from '@/lib/store-supabase';

const App = () => {
  const [players, setPlayers] = useState([]);
  
  useEffect(() => {
    // Fetch from Supabase when component mounts
    const loadPlayers = async () => {
      const data = await fetchPlayers();
      setPlayers(data);
    };
    loadPlayers();
  }, []);
  
  const handleAddPlayer = async (name: string, rank: string) => {
    const newPlayer = await createPlayer({ name, rank });
    if (newPlayer) {
      setPlayers([...players, newPlayer]);
    }
  };
  
  return <div>{players.length} players</div>;
};
```

---

## Key Functions in store-supabase.ts

### **Players Management**

```tsx
// Fetch all players
const players = await fetchPlayers();

// Create a new player (Admin only)
const newPlayer = await createPlayer({
  name: 'New Player',
  rank: 'pokeball',
  wins: 0,
  losses: 0,
  bp: 0
});

// Update a player
const updated = await updatePlayer('player-id', {
  wins: 15,
  losses: 3,
  bp: 500
});

// Delete a player (Super Admin only)
const deleted = await deletePlayer('player-id');
```

### **Trainer Cards Management**

```tsx
// Fetch all active trainer cards
const cards = await fetchTrainerCards();

// Create new trainer card (Super Admin only)
const newCard = await createTrainerCard({
  name: 'ultraball',
  display_name: 'Ultra Ball',
  description: 'Advanced trainer rank',
  colors: { primaryColor: '#A855F7', ... },
  ball_style: 'ultraball',
  top_gradient_color: '#A855F7',
  bottom_gradient_color: '#FFFFFF',
  is_active: true
});
```

### **User & Role Management**

```tsx
// Get currently logged-in user
const currentUser = await getCurrentUser();
// Returns: { id, email, role: 'super_admin' | 'admin' | 'moderator' | 'user' }

// Check user role
if (await isSuperAdmin()) {
  // Show Super Admin controls
}

if (await isAdmin()) {
  // Show Admin controls
}

// Sign up new user
await signUp('user@example.com', 'password123');

// Sign in
await signIn('user@example.com', 'password123');

// Sign out
await signOut();
```

---

## Step-by-Step: How Adding a Greatball Trainer Card Works

### **Step 1: Super Admin Creates Card in Database**
```bash
POST /api/trainer-cards
{
  "name": "greatball",
  "display_name": "Great Ball",
  "description": "Intermediate trainer rank",
  "colors": {...},
  "ball_style": "greatball",
  "top_gradient_color": "#3B82F6",
  "bottom_gradient_color": "#FFFFFF"
}
```

Database inserts: `trainer_cards { id: '123abc', name: 'greatball', ... }`

### **Step 2: Component Receives Card Data**
```tsx
const trainerCards = await fetchTrainerCards();
// Returns: [{ id: '123abc', name: 'greatball', ... }, ...]
```

### **Step 3: Admin Assigns Card to Player**
```bash
PUT /api/players/player-456
{
  "rank": "greatball"
}
```

Database updates: `players { rank: 'greatball' }`

### **Step 4: UI Renders Correct Card**
```tsx
import { GreatBallCard } from '@/components/trainer-cards/great-ball-card';

const player = { rank: 'greatball', name: 'Ash', ... };
const CardComponent = cardComponents[player.rank]; // GreatBallCard
return <CardComponent player={player} />;
```

Result: **Ash's trainer card now displays as Great Ball design** ✅

---

## Understanding RLS Policies

### **Example Policy: Only Super Admins Can Delete**

```sql
CREATE POLICY "players_delete_super_admin" ON players
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );
```

**What this does:**
1. When someone tries `DELETE FROM players WHERE id = 'xyz'`
2. Database checks: Is current user in user_roles with role='super_admin'?
3. If YES → DELETE succeeds
4. If NO → Throws permission error

### **Example Policy: Moderators Can Only Update Stats**

```sql
CREATE POLICY "players_update_moderator" ON players
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'moderator'
    )
  );
```

This allows the UPDATE, but your API enforces which columns can change.

---

## Migrating Existing Components

### **Before: Using localStorage store**
```tsx
// OLD - Don't use this anymore
import { useStore } from '@/lib/store';

export function PlayerList() {
  const { players } = useStore();
  
  return (
    <ul>
      {players.map(p => <li key={p.id}>{p.name}</li>)}
    </ul>
  );
}
```

### **After: Using Supabase**
```tsx
// NEW - Use this pattern
'use client';

import { useState, useEffect } from 'react';
import { fetchPlayers } from '@/lib/store-supabase';

export function PlayerList() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadData = async () => {
      const data = await fetchPlayers();
      setPlayers(data);
      setLoading(false);
    };
    loadData();
  }, []);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <ul>
      {players.map(p => <li key={p.id}>{p.name}</li>)}
    </ul>
  );
}
```

---

## Common Patterns

### **Pattern 1: Fetch Data on Mount**
```tsx
'use client';
import { useEffect, useState } from 'react';
import { fetchPlayers } from '@/lib/store-supabase';

export function MyComponent() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetchPlayers().then(setData);
  }, []);
  
  return data ? <div>{data.length} items</div> : <div>Loading...</div>;
}
```

### **Pattern 2: Create with Error Handling**
```tsx
const handleCreate = async (playerData) => {
  const result = await createPlayer(playerData);
  if (result) {
    console.log('Success!', result);
  } else {
    console.error('Failed to create');
  }
};
```

### **Pattern 3: Check Permissions**
```tsx
const superAdmin = await isSuperAdmin();
const admin = await isAdmin();

if (superAdmin) {
  // Show delete button
}

if (admin) {
  // Show create/edit buttons
}
```

---

## Troubleshooting

**Q: Data not persisting after refresh**
A: Make sure you're using Supabase functions, not localStorage. Check that fetch calls have correct endpoints.

**Q: "Unauthorized" error when creating player**
A: Check your user's role. You need to be Admin or Super Admin to create players.

**Q: Changes not showing in UI**
A: After creating/updating, manually refetch data or use a state update.

**Q: Can't change player rank as Moderator**
A: This is by design! Only Super Admin and Admins can change ranks. Moderators can only update stats.

---

## Summary

| Aspect | Before (localStorage) | After (Supabase) |
|--------|---------------------|------------------|
| Data Storage | Browser memory | PostgreSQL database |
| Persistence | Lost on cache clear | Permanent |
| Authentication | Manual, not secure | Supabase Auth |
| Permissions | Frontend only | Database RLS + API |
| Scalability | Single browser | Multiple users |
| API Access | N/A | TypeScript-safe endpoints |

This architecture ensures:
- ✅ Data is always persisted and recoverable
- ✅ Only authorized users can perform actions
- ✅ Security enforced at database level
- ✅ Multiple admins can manage the system
- ✅ Complete audit trail of who changed what
