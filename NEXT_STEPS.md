# Next Steps - What to Do Now

Congratulations! Your Supabase integration is complete. Here's what to do next.

---

## 🎯 Immediate Tasks (Today)

### 1. Set Yourself as Super Admin ⭐ CRITICAL
**Why:** Without this, you can't manage the system

```sql
-- Go to Supabase → SQL Editor and run:
-- First, find your user ID:
SELECT id, email FROM auth.users;

-- Then set yourself as super admin:
INSERT INTO user_roles (user_id, role) 
VALUES ('YOUR_UUID_HERE', 'super_admin');
```

**Verify it worked:**
```tsx
// In browser console or component:
const isSuperAdmin = await getCurrentUser();
console.log(isSuperAdmin); // Should show role: 'super_admin'
```

### 2. Create Your First Player
```tsx
import { createPlayer } from '@/lib/store-supabase';

// Create a test player
const player = await createPlayer({
  name: 'Ash Ketchum',
  rank: 'pokeball',
  wins: 0,
  losses: 0,
  bp: 0
});

console.log('Created:', player);
```

### 3. Change Player Rank to Greatball
```tsx
import { updatePlayer } from '@/lib/store-supabase';

// Change Ash's rank to Great Ball
await updatePlayer(player.id, { rank: 'greatball' });
```

**Result:** Ash's card now displays the Great Ball design with blue gradient!

### 4. Update Player Stats
```tsx
// After a tournament
await updatePlayer(player.id, {
  wins: 5,
  losses: 1,
  streak: 5,
  bp: 500
});
```

### 5. View the Great Ball Card
Open your app and see the Great Ball trainer card in action!

---

## 📚 Read the Documentation

**Priority order:**
1. **QUICK_REFERENCE.md** (5 min) - Get familiar with common tasks
2. **COMPLETE_SETUP_GUIDE.md** (30 min) - Understand the system
3. **ADDING_TRAINER_CARDS.md** (15 min) - Learn how to add new cards
4. **FILES_CREATED.md** (10 min) - See what was built

---

## 🎨 Create a New Trainer Card (Ultraball)

### Step 1: Design the Component
Create `components/trainer-cards/ultra-ball-card.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { Player } from '@/lib/store';

export function UltraBallCard({ player }: { player: Player }) {
  const [isFlipped, setIsFlipped] = useState(false);

  if (isFlipped) {
    return (
      <div
        onClick={() => setIsFlipped(false)}
        className="w-full aspect-[2.5/3.5] bg-gradient-to-b from-purple-600 to-white rounded-lg shadow-lg cursor-pointer p-4"
      >
        {/* Top section - purple gradient */}
        <div className="h-1/2 flex items-center justify-around">
          {/* 4 badges on purple */}
          {[...Array(4)].map((_, i) => (
            <div key={`top-${i}`} className="w-12 h-12 bg-yellow-300 rounded-full border-2 border-gray-800" />
          ))}
        </div>
        
        <div className="h-1 bg-black my-2"></div>
        
        {/* Bottom section - white background */}
        <div className="h-1/2 flex items-center justify-around">
          {/* 4 badges on white */}
          {[...Array(4)].map((_, i) => (
            <div key={`bottom-${i}`} className="w-10 h-10 bg-black rounded-full border-2 border-gray-800" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsFlipped(true)}
      className="w-full aspect-[2.5/3.5] bg-gradient-to-b from-purple-600 to-white rounded-lg shadow-lg cursor-pointer p-6 flex flex-col items-center justify-center gap-4"
    >
      <h2 className="text-3xl font-black text-yellow-400">EMPEROR</h2>
      <p className="text-sm font-bold text-yellow-300">TCG League</p>
      <div className="w-20 h-20 bg-white rounded-full border-4 border-purple-800 flex items-center justify-center">
        <div className="w-18 h-18 bg-purple-600 rounded-full"></div>
      </div>
      <p className="text-sm font-bold text-white">{player.name}</p>
      <p className="text-xs text-gray-100">Ultra Ball | BP: {player.bp}</p>
    </div>
  );
}
```

### Step 2: Register in Your Card Renderer
```tsx
// components/trainer-card.tsx
import { UltraBallCard } from './trainer-cards/ultra-ball-card';

const CARD_COMPONENTS = {
  'pokeball': PokeBallCard,
  'greatball': GreatBallCard,
  'ultraball': UltraBallCard,  // ← Add this
  'masterball': MasterBallCard,
};
```

### Step 3: Add to Database
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

### Step 4: Assign to a Player
```tsx
await updatePlayer(player.id, { rank: 'ultraball' });
```

✅ Done! Purple Ultra Ball card is live!

---

## 👥 Invite Other Admins

### Create an Admin User
```sql
-- 1. User signs up and their account is created
-- 2. You assign them admin role:
INSERT INTO user_roles (user_id, role, assigned_by)
VALUES ('THEIR_UUID', 'admin', 'YOUR_UUID');
```

### Create a Moderator
```sql
-- Only Admins can create moderators
INSERT INTO user_roles (user_id, role, assigned_by)
VALUES ('THEIR_UUID', 'moderator', 'YOUR_ADMIN_UUID');
```

---

## 🔧 Build UI Components

### Admin Dashboard
```tsx
'use client';

import { useState, useEffect } from 'react';
import { fetchPlayers, isSuperAdmin } from '@/lib/store-supabase';

export function AdminDashboard() {
  const [players, setPlayers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const init = async () => {
      const admin = await isSuperAdmin();
      setIsAdmin(admin);
      
      if (admin) {
        const data = await fetchPlayers();
        setPlayers(data);
      }
    };
    init();
  }, []);

  if (!isAdmin) {
    return <div>You must be Super Admin to access this</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="grid gap-4">
        {players.map(player => (
          <div key={player.id} className="border p-4 rounded">
            <h3>{player.name}</h3>
            <p>Rank: {player.rank}</p>
            <p>BP: {player.bp}</p>
            {/* Add edit/delete buttons here */}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Player Leaderboard
```tsx
'use client';

import { useEffect, useState } from 'react';
import { fetchPlayers } from '@/lib/store-supabase';

export function Leaderboard() {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    fetchPlayers().then(setPlayers);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Leaderboard</h1>
      <ol className="space-y-2">
        {players.map((player, index) => (
          <li key={player.id} className="flex gap-4 p-2 border rounded">
            <span className="font-bold w-8">#{index + 1}</span>
            <span className="flex-1">{player.name}</span>
            <span>{player.rank}</span>
            <span className="font-bold">{player.bp} BP</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
```

---

## 🔐 Set Up Authentication Pages

Copy the example auth pages from Supabase skill:
- Sign up page
- Sign in page
- Sign out button
- Auth callback handler

---

## 📊 Add Real-time Features

```tsx
// Real-time updates when players are updated
import { createClient } from '@/lib/supabase/client';

export function RealtimePlayerUpdates() {
  const supabase = createClient();

  useEffect(() => {
    const subscription = supabase
      .from('players')
      .on('*', payload => {
        console.log('Player updated:', payload);
        // Refresh your player list
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);
}
```

---

## 📈 Improve the System

### Ideas to Build:
1. **Match Results** - Track tournament matches
2. **Ranking History** - See how BP changed over time
3. **Statistics** - Win rate, average streak, head-to-head records
4. **Badges** - Achievements for milestones
5. **Notifications** - Alert when promoted/demoted
6. **Export** - Download player data as CSV
7. **Search** - Find players by name or rank
8. **Filters** - Filter by rank, minimum BP, etc.
9. **Bulk Actions** - Update multiple players at once
10. **Audit Log** - See who changed what when

---

## 🧪 Testing Checklist

- [ ] Create player with pokeball rank
- [ ] Change rank to greatball (should render differently)
- [ ] Update player stats
- [ ] Create ultraball trainer card
- [ ] Assign ultraball to a player
- [ ] Check that moderator can only update stats
- [ ] Check that super admin can delete players
- [ ] Test signing out and back in
- [ ] Verify data persists on page refresh
- [ ] Test from different browser (data syncs)

---

## 📞 If You Get Stuck

1. **Check QUICK_REFERENCE.md** - Most common issues covered
2. **Check COMPLETE_SETUP_GUIDE.md** - Full system explanation
3. **Check API errors** - Route handlers log detailed errors
4. **Check Supabase logs** - SQL errors show there
5. **Check browser console** - SDK errors logged there

---

## 📊 Files to Review

**Essential:**
- `lib/store-supabase.ts` - All available functions
- `app/api/players/[id]/route.ts` - How permissions work
- `components/trainer-cards/great-ball-card.tsx` - Component pattern

**Reference:**
- `QUICK_REFERENCE.md` - Quick answers
- `COMPLETE_SETUP_GUIDE.md` - Full documentation
- `ADDING_TRAINER_CARDS.md` - Card system details

---

## 🎯 30-Day Roadmap

### Week 1
- [ ] Set yourself as Super Admin
- [ ] Create test players
- [ ] Test all rank changes
- [ ] Create Ultraball card
- [ ] Read all documentation

### Week 2
- [ ] Invite first admin user
- [ ] Build admin dashboard UI
- [ ] Create leaderboard page
- [ ] Set up auth pages

### Week 3
- [ ] Add tournament tracking
- [ ] Create Masterball card (most advanced)
- [ ] Build statistics page
- [ ] Set up email notifications

### Week 4
- [ ] Launch to beta testers
- [ ] Gather feedback
- [ ] Fix bugs
- [ ] Plan next features

---

## 🚀 You're Ready!

You have:
- ✅ Complete Supabase backend
- ✅ Role-based API endpoints
- ✅ Great Ball trainer card
- ✅ Store functions for all operations
- ✅ Comprehensive documentation
- ✅ Clear path forward

**Start with:** QUICK_REFERENCE.md → Create first player → Add Ultraball card

**Questions?** Check COMPLETE_SETUP_GUIDE.md or the specific documentation files.

**Happy building! 🎉**
