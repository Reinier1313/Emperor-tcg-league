# Quick Reference Card

## 🚀 Common Tasks

### Create Player
```tsx
import { createPlayer } from '@/lib/store-supabase';
const player = await createPlayer({
  name: 'Ash',
  rank: 'pokeball'
});
```

### Update Player Rank (Super Admin Only)
```tsx
import { updatePlayer } from '@/lib/store-supabase';
await updatePlayer('player-id', { rank: 'greatball' });
```

### Update Stats (Moderator+)
```tsx
await updatePlayer('player-id', {
  wins: 20,
  losses: 3,
  bp: 1500,
  streak: 5
});
```

### Fetch Players
```tsx
import { fetchPlayers } from '@/lib/store-supabase';
const players = await fetchPlayers();
```

### Check User Role
```tsx
import { getCurrentUser, isSuperAdmin, isAdmin } from '@/lib/store-supabase';

const user = await getCurrentUser();
// Returns: { id, email, role: 'super_admin'|'admin'|'moderator'|'user' }

if (await isSuperAdmin()) {
  // Show super admin controls
}
```

---

## 📊 Database Tables

### trainer_cards
```sql
SELECT * FROM trainer_cards;
-- name: 'pokeball', 'greatball', 'ultraball', 'masterball'
-- Stores all card designs
```

### players
```sql
SELECT * FROM players WHERE bp > 1000 ORDER BY bp DESC;
-- rank: references trainer_cards.name
-- Shows all players sorted by BP
```

### user_roles
```sql
SELECT user_id, role FROM user_roles WHERE role = 'super_admin';
-- Shows all super admins
```

---

## 🔐 Permissions Matrix

| Action | Super Admin | Admin | Moderator |
|--------|:-----------:|:-----:|:---------:|
| Create Player | ✅ | ✅ | ❌ |
| Edit Stats | ✅ | ✅ | ✅ |
| Change Rank | ✅ | ❌ | ❌ |
| Delete Player | ✅ | ❌ | ❌ |
| Create Card | ✅ | ❌ | ❌ |

---

## 🌐 API Endpoints

### GET /api/players
```bash
curl http://localhost:3000/api/players
# Returns all players
```

### POST /api/players
```bash
curl -X POST http://localhost:3000/api/players \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Misty",
    "rank": "pokeball",
    "wins": 5,
    "losses": 2,
    "bp": 200
  }'
```

### PUT /api/players/{id}
```bash
curl -X PUT http://localhost:3000/api/players/abc-123 \
  -d '{ "rank": "greatball" }'
```

### DELETE /api/players/{id}
```bash
curl -X DELETE http://localhost:3000/api/players/abc-123
# Super Admin only
```

### GET /api/trainer-cards
```bash
curl http://localhost:3000/api/trainer-cards
# Returns all active cards
```

### POST /api/trainer-cards
```bash
curl -X POST http://localhost:3000/api/trainer-cards \
  -d '{
    "name": "ultraball",
    "display_name": "Ultra Ball",
    "colors": {...},
    "ball_style": "ultraball"
  }'
# Super Admin only
```

---

## 🎨 Component Usage

### Display Trainer Card
```tsx
import { TrainerCard } from '@/components/trainer-card';

<TrainerCard player={player} />
```

### Great Ball Card Specifically
```tsx
import { GreatBallCard } from '@/components/trainer-cards/great-ball-card';

<GreatBallCard player={player} />
```

---

## 📝 TypeScript Types

```tsx
interface Player {
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

interface TrainerCard {
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

interface User {
  id: string;
  email: string;
  role: 'super_admin' | 'admin' | 'moderator' | 'user';
}
```

---

## 🔧 Setup Checklist

- [ ] Set yourself as Super Admin:
  ```sql
  INSERT INTO user_roles (user_id, role) 
  VALUES ('YOUR_ID', 'super_admin');
  ```
- [ ] Create first player
- [ ] Test Great Ball rank assignment
- [ ] Check admin panel
- [ ] Design new trainer card
- [ ] Add new trainer card via API

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `COMPLETE_SETUP_GUIDE.md` | Full reference for everything |
| `ADDING_TRAINER_CARDS.md` | How to create new card designs |
| `BACKEND_MIGRATION_GUIDE.md` | Understanding localStorage → Supabase |
| `SUPABASE_INTEGRATION_GUIDE.md` | Detailed system architecture |
| `INTEGRATION_SUMMARY.md` | What was built and why |

---

## 🚨 Common Errors

### "Unauthorized" on player creation
**Fix:** Check user role is 'admin' or 'super_admin'

### "Invalid trainer card rank"
**Fix:** Verify rank exists in trainer_cards table

### Player rank won't change
**Fix:** Only super_admin can change ranks

### Data not persisting
**Fix:** Make sure using `/api/` endpoints, not localStorage

---

## 🎯 Role Checklists

### Super Admin Setup
- [ ] Set your user_id as super_admin in user_roles
- [ ] Create trainer cards as needed
- [ ] Assign ranks to players
- [ ] Manage all aspects of system

### Admin Setup
- [ ] Receive super_admin assignment
- [ ] Create players
- [ ] Update player stats
- [ ] Create moderators

### Moderator Setup
- [ ] Receive admin assignment
- [ ] View all players
- [ ] Update player stats only
- [ ] Cannot change ranks

---

## 💡 Tips

1. **Testing an endpoint?** Use the curl examples above or Postman
2. **Adding a new card?** Follow the pattern in `great-ball-card.tsx`
3. **Checking permissions?** Use the permission matrix above
4. **Need audit trail?** Check `created_by`, `updated_by` fields
5. **Want real-time updates?** Supabase supports subscriptions (advanced)

---

## 📞 Quick Links

- Supabase Dashboard: https://app.supabase.com
- Next.js Docs: https://nextjs.org/docs
- Supabase Docs: https://supabase.io/docs
- This Project: `/vercel/share/v0-project`

---

**Last Updated:** April 11, 2024
**Status:** ✅ Ready to Use
