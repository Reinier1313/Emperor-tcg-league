# Complete Emperor TCG League Setup & Integration Guide

Welcome! This is your comprehensive guide to understanding and using the entire system. Read this if you're new to the project.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [System Architecture](#system-architecture)
3. [Database Schema](#database-schema)
4. [User Roles & Permissions](#user-roles--permissions)
5. [Adding New Trainer Cards](#adding-new-trainer-cards)
6. [Managing Players](#managing-players)
7. [API Reference](#api-reference)
8. [Frontend Components](#frontend-components)
9. [Advanced Topics](#advanced-topics)

---

## Quick Start

### **1. Prerequisites**
✅ Supabase account (already set up)
✅ Next.js 15 app running
✅ Node.js and npm/pnpm installed

### **2. Set Yourself as Super Admin** (One-time Setup)

**In Supabase Console:**
1. Go to SQL Editor
2. Run:
```sql
-- Get your user ID first by checking auth.users table
SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- Then insert your super admin role
INSERT INTO user_roles (user_id, role) 
VALUES ('YOUR_UUID_HERE', 'super_admin');
```

### **3. Test the System**
1. Sign in with your account
2. Go to Admin Panel
3. Create a new player
4. Change player's rank from "pokeball" to "greatball"
5. View trainer card flip animation

---

## System Architecture

### **The Three Layers**

```
┌─────────────────────────────────────┐
│   Frontend (React Components)        │
│   - Trainer Cards                   │
│   - Player Dashboard                │
│   - Admin Panel                     │
└────────────────┬────────────────────┘
                 │ API Calls
┌─────────────────▼────────────────────┐
│   API Layer (Next.js Route Handlers) │
│   - /api/players                    │
│   - /api/trainer-cards              │
│   - Role-based authorization        │
└────────────────┬────────────────────┘
                 │ Supabase SDK
┌─────────────────▼────────────────────┐
│   Database Layer (PostgreSQL)        │
│   - trainer_cards table             │
│   - players table                   │
│   - user_roles table                │
│   - Row Level Security (RLS)        │
└─────────────────────────────────────┘
```

### **Data Flow: Changing Player Rank**

```
1. UI: Admin clicks "Change Rank to Great Ball"
   ↓
2. API: PUT /api/players/{id} { rank: 'greatball' }
   ↓
3. Handler: Check user role (must be super_admin or admin)
   ↓
4. Database: Verify 'greatball' exists in trainer_cards
   ↓
5. Update: players.rank = 'greatball'
   ↓
6. Return: Updated player object
   ↓
7. UI: Re-render with GreatBallCard component
```

---

## Database Schema

### **Table: trainer_cards**
Stores all trainer card designs

```sql
CREATE TABLE trainer_cards (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE,                    -- 'pokeball', 'greatball', etc
  display_name TEXT,                   -- 'Pokéball', 'Great Ball'
  description TEXT,                    -- What this rank means
  colors JSONB,                        -- { primaryColor, secondaryColor, ... }
  ball_style TEXT,                     -- pokeball | greatball | ultraball | masterball
  top_gradient_color TEXT,             -- Hex color
  bottom_gradient_color TEXT,          -- Hex color
  is_active BOOLEAN,                   -- Can it be assigned?
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Example Record:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "greatball",
  "display_name": "Great Ball",
  "description": "Intermediate trainer rank",
  "colors": {
    "primaryColor": "#3B82F6",
    "secondaryColor": "#EF4444",
    "accentColor": "#FFFFFF"
  },
  "ball_style": "greatball",
  "top_gradient_color": "#3B82F6",
  "bottom_gradient_color": "#FFFFFF",
  "is_active": true
}
```

### **Table: players**
Stores player profiles and stats

```sql
CREATE TABLE players (
  id UUID PRIMARY KEY,
  name TEXT,                           -- Player username
  wins INTEGER,                        -- Tournament wins
  losses INTEGER,                      -- Tournament losses
  streak INTEGER,                      -- Current win streak
  bp INTEGER,                          -- Battle Points
  rank TEXT,                           -- References trainer_cards.name
  created_by UUID,                     -- Admin who created them
  updated_by UUID,                     -- Last person to update
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  
  FOREIGN KEY (created_by) REFERENCES auth.users(id),
  FOREIGN KEY (updated_by) REFERENCES auth.users(id)
);
```

**Example Record:**
```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "name": "Ash Ketchum",
  "wins": 45,
  "losses": 8,
  "streak": 12,
  "bp": 3200,
  "rank": "greatball",
  "created_by": "550e8400-e29b-41d4-a716-446655440000",
  "updated_by": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2024-04-11T10:30:00Z",
  "updated_at": "2024-04-11T15:45:00Z"
}
```

### **Table: user_roles**
Manages who can do what

```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY,
  user_id UUID,                        -- References auth.users.id
  role TEXT,                           -- super_admin|admin|moderator|user
  assigned_by UUID,                    -- Who assigned this role
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES auth.users(id),
  UNIQUE(user_id, role)
);
```

**Example Records:**
```json
[
  { "user_id": "123...", "role": "super_admin", "assigned_by": null },
  { "user_id": "456...", "role": "admin", "assigned_by": "123..." },
  { "user_id": "789...", "role": "moderator", "assigned_by": "123..." },
  { "user_id": "000...", "role": "user", "assigned_by": "456..." }
]
```

---

## User Roles & Permissions

### **Role Hierarchy**

```
Super Admin (You)
    ├─ Can manage all trainer cards (add/edit/delete)
    ├─ Can manage all players (add/edit/delete)
    ├─ Can change any player's rank
    ├─ Can change any player's stats
    └─ Can assign Admin role
    
Admin
    ├─ Can create/edit players
    ├─ Cannot change player ranks
    ├─ Cannot delete players
    ├─ Can create Moderators
    └─ Cannot create other Admins
    
Moderator
    ├─ Can view all players
    ├─ Can edit player stats (wins, losses, bp, streak)
    ├─ Cannot change rank
    ├─ Cannot delete players
    └─ Cannot create other roles
    
User
    ├─ Can view their own profile
    └─ Cannot make any changes
```

### **Permission Matrix**

| Action | Super Admin | Admin | Moderator | User |
|--------|:-----------:|:-----:|:---------:|:----:|
| **View Players** | ✅ All | ✅ All | ✅ All | ✅ Own |
| **Create Player** | ✅ | ✅ | ❌ | ❌ |
| **Edit Stats** | ✅ | ✅ | ✅ | ❌ |
| **Change Rank** | ✅ | ❌ | ❌ | ❌ |
| **Delete Player** | ✅ | ❌ | ❌ | ❌ |
| **Manage Trainer Cards** | ✅ | ❌ | ❌ | ❌ |
| **Assign Roles** | ✅ | ❌ | ❌ | ❌ |

---

## Adding New Trainer Cards

### **Complete Workflow**

#### **Step 1: Design Your Card**
Before adding to the system, decide:
- **Name** (lowercase, no spaces): `ultraball`
- **Display Name**: `Ultra Ball`
- **Description**: What rank this represents
- **Colors**: Primary, secondary, accent (hex values)
- **Gradient**: Top and bottom colors
- **Ball Style**: pokeball, greatball, ultraball, or masterball

#### **Step 2: Create the Component**

Create a new file: `components/trainer-cards/ultra-ball-card.tsx`

```tsx
'use client';

import { Player } from '@/lib/store';
import { useState } from 'react';

interface TrainerCardProps {
  player: Player;
}

export function UltraBallCard({ player }: TrainerCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      onClick={() => setIsFlipped(!isFlipped)}
      className="w-full aspect-[2.5/3.5] bg-gradient-to-b from-purple-500 to-white rounded-lg shadow-lg cursor-pointer"
    >
      {isFlipped ? (
        // BACK: 8 badges on purple and white background
        <div className="flex flex-col h-full">
          <div className="h-1/2 bg-purple-500 flex items-center justify-around">
            {/* 4 badges on top */}
          </div>
          <div className="h-1/2 bg-white flex items-center justify-around">
            {/* 4 badges on bottom */}
          </div>
        </div>
      ) : (
        // FRONT: EMPEROR branding and center Ultra Ball
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <h2 className="text-3xl font-black text-yellow-400">EMPEROR</h2>
          <div className="w-24 h-24 bg-white rounded-full" />
          <p className="text-sm font-bold">{player.name}</p>
        </div>
      )}
    </div>
  );
}
```

#### **Step 3: Register the Card**

Update `components/trainer-card.tsx` or wherever cards are rendered:

```tsx
import { UltraBallCard } from './trainer-cards/ultra-ball-card';

const CARD_COMPONENTS = {
  'pokeball': PokeBallCard,
  'greatball': GreatBallCard,
  'ultraball': UltraBallCard,  // ← Add this
  'masterball': MasterBallCard,
};

export function TrainerCard({ player }: { player: Player }) {
  const CardComponent = CARD_COMPONENTS[player.rank];
  return <CardComponent player={player} />;
}
```

#### **Step 4: Add to Database**

**Option A: Via API (Recommended)**
```bash
curl -X POST http://localhost:3000/api/trainer-cards \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ultraball",
    "display_name": "Ultra Ball",
    "description": "Advanced trainer rank for experienced players",
    "colors": {
      "primaryColor": "#A855F7",
      "secondaryColor": "#FCD34D",
      "accentColor": "#FFFFFF"
    },
    "ball_style": "ultraball",
    "top_gradient_color": "#A855F7",
    "bottom_gradient_color": "#FFFFFF"
  }'
```

**Option B: Direct SQL**
```sql
INSERT INTO trainer_cards (name, display_name, description, colors, ball_style, top_gradient_color, bottom_gradient_color)
VALUES (
  'ultraball',
  'Ultra Ball',
  'Advanced trainer rank for experienced players',
  '{"primaryColor":"#A855F7","secondaryColor":"#FCD34D","accentColor":"#FFFFFF"}',
  'ultraball',
  '#A855F7',
  '#FFFFFF'
);
```

#### **Step 5: Assign to Players**

```bash
curl -X PUT http://localhost:3000/api/players/{player-id} \
  -H "Content-Type: application/json" \
  -d '{ "rank": "ultraball" }'
```

✅ Done! The player now shows the Ultra Ball trainer card.

---

## Managing Players

### **Create a Player**

```bash
POST /api/players
{
  "name": "Misty",
  "rank": "pokeball",
  "wins": 10,
  "losses": 5,
  "streak": 3,
  "bp": 500
}
```

**Who can do this:** Admin, Super Admin

### **Update Player Stats (Moderator Task)**

```bash
PUT /api/players/{id}
{
  "wins": 15,
  "losses": 3,
  "streak": 8,
  "bp": 750
}
```

**Who can do this:** Anyone with moderator or above role
**Note:** Cannot change rank, name, or other fields

### **Change Player Rank (Super Admin Only)**

```bash
PUT /api/players/{id}
{
  "rank": "greatball"
}
```

**Who can do this:** Super Admin only
**Note:** Admins cannot change ranks

### **Update Everything (Super Admin Only)**

```bash
PUT /api/players/{id}
{
  "name": "New Name",
  "rank": "ultraball",
  "wins": 50,
  "losses": 10,
  "streak": 5,
  "bp": 2500
}
```

### **Delete a Player (Super Admin Only)**

```bash
DELETE /api/players/{id}
```

---

## API Reference

### **Base URL**
```
http://localhost:3000/api
```

### **Authentication**
Include Supabase session (handled automatically by SDK)

### **Trainer Cards Endpoints**

#### **GET /trainer-cards**
Fetch all active trainer cards
```bash
curl http://localhost:3000/api/trainer-cards
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "pokeball",
    "display_name": "Pokéball",
    ...
  }
]
```

#### **POST /trainer-cards**
Create new trainer card (Super Admin only)
```bash
curl -X POST http://localhost:3000/api/trainer-cards \
  -d '{ "name": "...", "display_name": "...", ... }'
```

### **Players Endpoints**

#### **GET /players**
Fetch all players
```bash
curl http://localhost:3000/api/players
```

#### **POST /players**
Create new player (Admin+)
```bash
curl -X POST http://localhost:3000/api/players \
  -d '{ "name": "...", "rank": "..." }'
```

#### **GET /players/{id}**
Get single player
```bash
curl http://localhost:3000/api/players/player-uuid
```

#### **PUT /players/{id}**
Update player
```bash
curl -X PUT http://localhost:3000/api/players/player-uuid \
  -d '{ "wins": 20, "rank": "greatball" }'
```

#### **DELETE /players/{id}**
Delete player (Super Admin only)
```bash
curl -X DELETE http://localhost:3000/api/players/player-uuid
```

---

## Frontend Components

### **TrainerCard**
Main card display component
```tsx
import { TrainerCard } from '@/components/trainer-card';

<TrainerCard player={player} />
```

### **GreatBallCard**
Great Ball specific design
```tsx
import { GreatBallCard } from '@/components/trainer-cards/great-ball-card';

<GreatBallCard player={player} />
```

### **AdminPanel**
Management interface (Super Admin only)
```tsx
import { AdminPanel } from '@/components/admin-panel';

<AdminPanel />
```

### **PlayerDashboard**
View individual player stats
```tsx
import { PlayerDashboard } from '@/components/player-dashboard';

<PlayerDashboard player={player} />
```

---

## Advanced Topics

### **Understanding Row Level Security (RLS)**

RLS is a database feature that automatically filters data based on who's asking.

**Example:** Moderator tries to delete a player

```sql
-- RLS Policy
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

**What happens:**
1. Moderator runs: `DELETE FROM players WHERE id = '123'`
2. Database checks: Is this user a super_admin? NO
3. Database blocks the DELETE
4. Error returned to app

**Why it matters:** Security at the database level, not the app level.

### **Custom Trainer Cards with CSS**

The Great Ball card shows the pattern for custom designs:

```tsx
// Top gradient section - unique colors
<div className="bg-gradient-to-b from-blue-400 to-blue-300">
  {/* Blue-specific design */}
</div>

// Ball design
<div className="w-24 h-24 bg-white rounded-full">
  {/* Custom ball styling */}
</div>

// Bottom section
<div className="bg-white">
  {/* Bottom design */}
</div>
```

Copy this pattern for Ultraball, Masterball, etc.

### **Optimistic Updates**

For better UX, update the UI before waiting for API response:

```tsx
const handleUpdateStats = async (playerId, newStats) => {
  // Update UI immediately
  setPlayers(players.map(p => 
    p.id === playerId ? { ...p, ...newStats } : p
  ));
  
  // Update database in background
  const result = await updatePlayer(playerId, newStats);
  
  // If error, revert UI
  if (!result) {
    setPlayers(originalPlayers);
    alert('Update failed');
  }
};
```

---

## Frequently Asked Questions

**Q: How do I sign up new users?**
A: Users sign up through `/auth/sign-up` page. They get the 'user' role by default.

**Q: Can I change someone's role?**
A: Only Super Admin can assign/change roles. Do it via SQL or create an admin panel endpoint.

**Q: What if a Moderator's browser is hacked?**
A: Even if hacked code tries to delete players, the database RLS will block it.

**Q: How do I backup player data?**
A: Supabase auto-backs up. You can export via their dashboard.

**Q: Can players sign up and create their own profiles?**
A: Currently, only Admins create player profiles. You can build a self-signup flow if needed.

---

## Summary

You now understand:
- ✅ How the database stores trainer cards and players
- ✅ How user roles control permissions
- ✅ How to add new trainer card designs
- ✅ How to manage players and change their ranks
- ✅ How the API layer enforces permissions
- ✅ How Row Level Security protects data
- ✅ How to build custom trainer card components

**Next Steps:**
1. Set yourself as Super Admin (see Quick Start)
2. Create a few test players with different ranks
3. Test the admin panel
4. Design and add a new trainer card (Ultraball)
5. Explore the Supabase dashboard to see your data

Happy building! 🚀
