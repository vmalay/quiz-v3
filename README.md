# Quiz Battle 2025 🎮

A real-time multiplayer quiz application built with modern web technologies. Challenge opponents in themed trivia duels with speed-based scoring and live competitions.

![Quiz Battle](https://img.shields.io/badge/Status-Production%20Ready-green)
![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)
![Real-time](https://img.shields.io/badge/Real--time-Socket.IO-orange)

## ✨ Features

### 🎯 Core Gameplay
- **Real-time Multiplayer**: Chess.com-style server-authoritative gameplay
- **Themed Quizzes**: Science, History, Geography, and more
- **Speed Scoring**: Faster answers earn more points (up to 1000 per question)
- **Live Countdown**: 10-second timer with real-time synchronization
- **Guest Mode**: No authentication required - jump straight into action

### 🎨 User Experience  
- **Animated Results**: Confetti celebrations and detailed statistics
- **Smooth Transitions**: Professional animations throughout
- **Mobile Responsive**: Works seamlessly on all devices
- **Live Status**: Real-time opponent tracking and game state

### 🏗️ Technical Excellence
- **Server Authority**: All game logic runs server-side for fairness
- **Type Safety**: 100% TypeScript coverage
- **Real-time Sync**: 100ms countdown updates via Socket.io
- **Production Ready**: Zero build errors, optimized performance

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 15 + React 19
- **Styling**: Tailwind CSS + Custom Animations
- **State**: Zustand + TanStack Query
- **Validation**: React Hook Form + Zod
- **Real-time**: Socket.io Client

### Backend
- **Runtime**: Node.js + Express
- **API**: tRPC for type-safe endpoints
- **Real-time**: Socket.io Server
- **Game Engine**: Custom server-authoritative system

### Database & Infrastructure
- **Database**: PostgreSQL (Supabase)
- **ORM**: Drizzle ORM with migrations
- **Monorepo**: Turborepo for optimal builds
- **Package Manager**: npm workspaces

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **npm** 9+
- **Supabase Account** (free tier works)

### 1. Clone Repository

```bash
git clone https://github.com/your-username/quiz-v3.git
cd quiz-v3
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup (Supabase)

#### 3.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for project initialization (2-3 minutes)

#### 3.2 Get Database Credentials
1. In your Supabase dashboard, go to **Settings** → **Database**
2. Copy the **Connection String** (URI format)
3. Go to **Settings** → **API** 
4. Copy the **Project URL** and **API Keys**

#### 3.3 Configure Environment Variables
Create environment files:

```bash
# Copy environment template
cp packages/database/.env.example packages/database/.env
```

Edit `packages/database/.env`:
```env
# Database (from Supabase Settings → Database)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Supabase Configuration (from Settings → API)
SUPABASE_URL="https://[PROJECT-REF].supabase.co"
SUPABASE_SERVICE_KEY="[YOUR-SERVICE-ROLE-KEY]"

# Frontend Environment Variables
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"

# Server Configuration
PORT=3001
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

#### 3.4 Initialize Database Schema
Run the database setup script in Supabase SQL Editor:

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the contents of `database-setup.sql`
3. Paste and run the script
4. Verify tables are created: `themes`, `questions`, `games`, `answers`

### 4. Launch Application

#### 4.1 Start Development Servers

```bash
# Start both API and Web servers concurrently
npm run dev
```

This will start:
- **API Server**: http://localhost:3001
- **Web App**: http://localhost:3000

#### 4.2 Verify Setup
1. Open http://localhost:3000
2. You should see quiz themes loaded from database
3. Click "Start Battle" to test matchmaking
4. Open second browser tab to test multiplayer

## 📁 Project Structure

```
quiz-v3/
├── apps/
│   ├── api/                    # Node.js + Socket.io server
│   │   ├── src/
│   │   │   ├── routes/         # tRPC routes
│   │   │   ├── socket/         # Socket.io handlers  
│   │   │   └── server.ts       # Express server
│   │   └── package.json
│   │
│   └── web/                    # Next.js frontend
│       ├── src/
│       │   ├── app/            # Next.js App Router
│       │   ├── components/     # React components
│       │   ├── hooks/          # Custom hooks
│       │   └── stores/         # Zustand stores
│       └── package.json
│
├── packages/
│   ├── database/               # Database layer
│   │   ├── src/
│   │   │   ├── schema.ts       # Drizzle schema
│   │   │   ├── queries.ts      # Database queries
│   │   │   └── connection.ts   # DB connection
│   │   └── .env                # Database config
│   │
│   ├── game-engine/            # Game logic
│   │   └── src/
│   │       └── game-manager.ts # Server-authoritative engine
│   │
│   ├── shared/                 # Shared types & utils
│   │   └── src/
│   │       ├── types.ts        # TypeScript definitions
│   │       └── utils.ts        # Utility functions
│   │
│   └── trpc/                   # API layer
│       └── src/
│           └── router.ts       # tRPC router definition
│
├── database-setup.sql          # Supabase initialization
├── turbo.json                  # Turborepo configuration
└── package.json                # Root package.json
```

## 🎮 How to Play

### Single Player Testing
1. **Choose Theme**: Select from Science, History, Geography
2. **Join Matchmaking**: Click "Start Battle"
3. **Wait for Opponent**: Open second browser tab as opponent
4. **Quiz Battle**: Answer 5 questions as fast as possible
5. **View Results**: See detailed statistics and celebrate!

### Multiplayer Setup
1. **Share URL**: Send game URL to friends
2. **Same Theme**: Both players select same theme
3. **Auto-Match**: System automatically pairs players
4. **Live Competition**: Race to answer questions correctly and quickly

## 🔧 Development Commands

```bash
# Install dependencies
npm install

# Development (starts both API + Web)
npm run dev

# Build all packages
npm run build

# Type checking
npm run type-check

# Clean build artifacts
npm run clean

# API only
npm run dev:api

# Web only  
npm run dev:web
```

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## 📊 Database Schema

### Tables
- **themes**: Quiz categories (Science, History, etc.)
- **questions**: Quiz questions with multiple choice answers
- **games**: Game sessions and results
- **answers**: Player responses and scoring

### Sample Data
The setup includes 50+ questions across multiple themes:
- **Science**: Physics, Chemistry, Biology
- **History**: World History, Ancient Civilizations  
- **Geography**: Countries, Capitals, Landmarks

## 🚀 Deployment

### Frontend (Vercel)
```bash
# Deploy to Vercel
vercel --prod

# Set environment variables in Vercel dashboard:
# NEXT_PUBLIC_API_URL=https://your-api-domain.com
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Backend (Railway/Heroku)
```bash
# Set environment variables:
# DATABASE_URL=your-supabase-connection-string
# SUPABASE_URL=https://your-project.supabase.co  
# SUPABASE_SERVICE_KEY=your-service-role-key
# PORT=3001
# CLIENT_URL=https://your-frontend-domain.com
```

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Test database connection
npm run db:test

# Check environment variables
echo $DATABASE_URL
```

### Build Errors
```bash
# Clean and rebuild
npm run clean
npm run build
```

### Socket.io Connection Issues
- Verify API server is running on port 3001
- Check CORS configuration in server.ts
- Ensure CLIENT_URL environment variable is set

### Common Issues

**❌ "No themes available"**
- Database not initialized → Run database-setup.sql in Supabase
- Wrong DATABASE_URL → Check connection string format

**❌ "Failed to connect to server"**  
- API server not running → `npm run dev:api`
- Wrong API URL → Check NEXT_PUBLIC_API_URL

**❌ "Matchmaking timeout"**
- Need 2 players → Open second browser tab
- Socket.io issues → Check server logs

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern React and Node.js ecosystem
- Inspired by Chess.com's real-time architecture
- UI design influenced by modern gaming platforms
- TypeScript for type safety and developer experience

---

**Ready to battle?** 🎯 Start your quiz adventure now!