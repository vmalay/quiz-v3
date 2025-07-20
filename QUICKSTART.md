# 🚀 Quiz Battle - 5 Minute Setup

Get Quiz Battle running in under 5 minutes!

## Step 1: Clone & Install (30 seconds)

```bash
git clone https://github.com/your-username/quiz-v3.git
cd quiz-v3
npm run setup
```

## Step 2: Supabase Setup (2 minutes)

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com) → "New Project"
   - Choose any name, wait for initialization

2. **Get Your Credentials**
   - **Settings** → **Database** → Copy "Connection String"
   - **Settings** → **API** → Copy "Project URL" and both API keys

## Step 3: Configure Environment (1 minute)

```bash
# Copy template
cp packages/database/.env.example packages/database/.env

# Edit packages/database/.env with your Supabase credentials
```

Replace these placeholders:
- `[YOUR-PASSWORD]` → Your Supabase database password
- `[PROJECT-REF]` → Your Supabase project reference
- `[YOUR-SERVICE-ROLE-KEY]` → Service role key from API settings
- `[YOUR-ANON-KEY]` → Anonymous key from API settings

## Step 4: Initialize Database (1 minute)

1. Open **Supabase SQL Editor**
2. Copy contents of `database-setup.sql`
3. Paste and run the script
4. Verify 4 tables created: `themes`, `questions`, `games`, `answers`

## Step 5: Launch! (30 seconds)

```bash
# Verify setup
npm run verify

# Launch both servers
npm run dev
```

Open http://localhost:3000 and start battling! 🎯

## Verify It's Working

1. ✅ See quiz themes on homepage
2. ✅ Click "Start Battle" 
3. ✅ Open second browser tab as opponent
4. ✅ Both players get matched and quiz begins

## Need Help?

- Run `npm run verify` to check your setup
- Check the [full README](README.md) for detailed troubleshooting
- Common issue: Make sure both browser tabs select the same theme

**Ready to battle?** 🎮