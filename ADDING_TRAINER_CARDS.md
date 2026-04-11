# How to Add New Trainer Cards to Emperor TCG League

This guide explains everything you need to know about adding new trainer card designs to the system and managing the Supabase backend.

## Understanding the System Architecture

### **Trainer Cards Database (trainer_cards table)**
The `trainer_cards` table stores all trainer card designs. Only Super Admin can modify this table.

**Table Structure:**
```sql
trainer_cards {
  id: UUID (Primary Key)
  name: TEXT (unique identifier like 'pokeball', 'greatball')
  display_name: TEXT (User-facing name like 'Pokéball', 'Great Ball')
  description: TEXT (What this rank represents)
  colors: JSONB (Color configuration for the card)
  ball_style: TEXT (pokeball, greatball, ultraball, masterball)
  top_gradient_color: TEXT (Hex color for top section)
  bottom_gradient_color: TEXT (Hex color for bottom section)
  is_active: BOOLEAN (Whether the card is available for assignment)
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

### **Players Table**
Each player has a `rank` field that references a trainer card by its `name`.

```sql
players {
  id: UUID
  name: TEXT (Player username)
  rank: TEXT (References trainer_cards.name)
  bp: INTEGER (Battle Points)
  wins: INTEGER
  losses: INTEGER
  streak: INTEGER
  created_by: UUID (Admin who created the player)
  ...
}
```

### **User Roles Table**
Controls who can do what in the system.

```sql
user_roles {
  user_id: UUID
  role: 'super_admin' | 'admin' | 'moderator' | 'user'
  assigned_by: UUID
}
```

---

## How to Add a New Trainer Card Design

### **Step 1: Design the Card**
Before adding to the database, you need:
- **Card name** (lowercase, no spaces): e.g., `ultraball`
- **Display name**: e.g., `Ultra Ball`
- **Description**: What rank this represents
- **Colors**: Primary, secondary, and accent colors
- **Ball style**: pokeball, greatball, ultraball, or masterball
- **Gradient colors**: Top and bottom hex colors

### **Step 2: Add to Supabase via API**

**Only Super Admin can add trainer cards.** Use the API endpoint:

```bash
POST /api/trainer-cards
Content-Type: application/json

{
  "name": "ultraball",
  "display_name": "Ultra Ball",
  "description": "Advanced trainer rank - For experienced players",
  "colors": {
    "primaryColor": "#A855F7",
    "secondaryColor": "#FCD34D",
    "accentColor": "#FFFFFF"
  },
  "ball_style": "ultraball",
  "top_gradient_color": "#A855F7",
  "bottom_gradient_color": "#FFFFFF"
}
```

### **Step 3: Create the Component**

Create a new component in `components/trainer-cards/` for the card design:

```tsx
// components/trainer-cards/ultra-ball-card.tsx
import { TrainerCardBase } from './base';

export function UltraBallCard({ player, isFlipped, onFlip }: TrainerCardProps) {
  return (
    <TrainerCardBase
      player={player}
      isFlipped={isFlipped}
      onFlip={onFlip}
      frontGradient="from-purple-500 to-white"
      backGradient="from-purple-500 to-white"
      topColor="from-purple-500 to-amber-300"
      badgeColor="bg-purple-600"
    >
      {/* Your custom card design here */}
    </TrainerCardBase>
  );
}
```

### **Step 4: Update the Card Renderer**

In your trainer card rendering logic, map trainer card names to components:

```tsx
const cardComponents = {
  'pokeball': PokeBallCard,
  'greatball': GreatBallCard,
  'ultraball': UltraBallCard,
  'masterball': MasterBallCard,
};

const CardComponent = cardComponents[player.rank];
```

---

## How Changing Player Ranks Works

### **For Super Admin:**
```bash
PUT /api/players/{playerId}
Content-Type: application/json

{
  "rank": "greatball"
}
```

This updates the player's rank to the Great Ball trainer card design.

### **For Admins & Moderators:**
Moderators can ONLY update stats (wins, losses, bp, streak), NOT the rank:

```bash
PUT /api/players/{playerId}
Content-Type: application/json

{
  "wins": 15,
  "losses": 3,
  "bp": 500,
  "streak": 5
}
```

---

## Supabase Integration: From localStorage to Backend

### **Key Changes from localStorage to Supabase:**

#### **Before (localStorage):**
```tsx
const players = JSON.parse(localStorage.getItem('players') || '[]');
const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
```

#### **After (Supabase):**
```tsx
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

// Fetch players
const { data: players, error } = await supabase
  .from('players')
  .select('*')
  .eq('is_active', true);

// Get current user
const { data: { user } } = await supabase.auth.getUser();
```

### **Understanding Supabase Auth:**

1. **User Authentication**: Handled by Supabase Auth (email/password by default)
2. **User Roles**: Stored in the `user_roles` table
3. **Data Isolation**: Row Level Security (RLS) prevents unauthorized access

**Getting the current user's role:**
```tsx
const { data: { user } } = await supabase.auth.getUser();

const { data: userRole } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', user.id)
  .single();

const isSuperAdmin = userRole.role === 'super_admin';
```

---

## API Endpoints Structure

### **Players Endpoints:**

```
GET    /api/players              - List all players
GET    /api/players/{id}         - Get player by ID
POST   /api/players              - Create new player (Admin only)
PUT    /api/players/{id}         - Update player
DELETE /api/players/{id}         - Delete player (Super Admin only)
```

### **Trainer Cards Endpoints:**

```
GET    /api/trainer-cards        - List all active trainer cards
GET    /api/trainer-cards/{id}   - Get trainer card by ID
POST   /api/trainer-cards        - Create new trainer card (Super Admin only)
PUT    /api/trainer-cards/{id}   - Update trainer card (Super Admin only)
DELETE /api/trainer-cards/{id}   - Delete trainer card (Super Admin only)
```

### **User Roles Endpoints:**

```
GET    /api/user-roles/{userId}  - Get user's role
POST   /api/user-roles           - Assign role (Super Admin only)
PUT    /api/user-roles/{id}      - Update role (Super Admin only)
```

---

## Understanding Row Level Security (RLS)

RLS policies are SQL rules that automatically filter data based on the logged-in user. For example:

```sql
-- Only Admins and Super Admins can see all players
CREATE POLICY "players_read_admins" ON players
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Moderators can only update player stats, not rank
CREATE POLICY "players_update_moderator" ON players
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'moderator'
    )
  );
```

This means:
- Even if a Moderator tries to query the database, only stats updates will succeed
- Super Admin controls are enforced at the database level, not just the UI

---

## The Complete Flow: Adding a Greatball Card

### **1. Database is Ready**
✅ `trainer_cards` table exists with sample data
✅ `players` table exists
✅ `user_roles` table exists

### **2. Create the Component**
You'll create a `GreatBallCard` component matching the design reference image (blue gradient top, red corners, gray accents)

### **3. Register in App**
Map `'greatball'` rank to the `GreatBallCard` component

### **4. Use via API**
When a Super Admin assigns a player to the Great Ball rank:
```bash
PUT /api/players/{playerId}
{ "rank": "greatball" }
```

### **5. Component Renders**
The player's trainer card automatically shows the Great Ball design

---

## Super Admin Authentication

Only you can access Super Admin features. The system checks this by:

1. **Login**: Your Supabase account
2. **Check Role**: Query `user_roles` table for your user_id
3. **Verify Role**: Check if role = 'super_admin'
4. **Allow/Deny**: Show admin features or hide them

**Setting up Super Admin (One-time setup):**
```sql
-- After you sign up, set yourself as super admin
INSERT INTO user_roles (user_id, role)
VALUES ('YOUR_USER_ID_HERE', 'super_admin');
```

---

## Summary

| Task | Who | How |
|------|-----|-----|
| Add new trainer card design | Super Admin | POST /api/trainer-cards with design details |
| Change player rank | Super Admin | PUT /api/players/{id} with new rank |
| Update player stats | Moderator | PUT /api/players/{id} with new stats |
| Create new player | Admin | POST /api/players with player details |
| Delete player | Super Admin | DELETE /api/players/{id} |
| View all players | Admin+ | GET /api/players (filtered by RLS) |

This architecture ensures:
- ✅ Only Super Admin controls trainer cards and ranks
- ✅ Admins can create/manage players
- ✅ Moderators can only update stats
- ✅ Users have read-only access to their own data
- ✅ All changes are tracked in the database
