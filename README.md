# Letta + Supabase Chatbot

> A full-stack AI chatbot integrating [Letta](https://docs.letta.com/) for stateful agents and [Supabase](https://supabase.com) for persistent storage.

## 🎯 What This App Does

This application demonstrates how to build a production-ready chatbot that combines:
- **Letta** - Manages AI agents with memory and conversation state
- **Supabase** - Stores user data, agent metadata, and provides queryable history
- **Letta Identities** - Multi-user support with proper user management
- **Vercel AI SDK** - Real-time streaming chat interface

## ✨ Key Features

- **User Management** - Cookie-based sessions linked to Letta Identities
- **Agent Creation** - Create AI agents with custom personalities and memory
- **Persistent Storage** - Agent metadata stored in Supabase for querying
- **Real-time Chat** - Streaming responses powered by Vercel AI SDK
- **Multi-User Support** - Each user sees only their own agents (via Letta Identities)
- **Production-Ready** - TypeScript, error handling, clean architecture

## 🏗️ Architecture

```
Frontend (React + Shadcn UI)
    ↓
Next.js API Routes
    ↓
┌─────────────┬──────────────┐
│   Letta     │   Supabase   │
│  (Agents)   │   (Storage)  │
└─────────────┴──────────────┘
```

**What Each Layer Does:**
- **Letta**: Agent runtime, memory management, conversation processing
- **Supabase**: User profiles, agent metadata, message history
- **Letta Identities**: Links Supabase users to Letta agents
- **Vercel AI SDK**: Streams responses to UI in real-time

## 📋 Prerequisites

Before starting, you need:

1. **Node.js** v18 or higher
2. **Letta Cloud Account** - [Sign up here](https://www.letta.com)
3. **Supabase Account** - [Sign up here](https://supabase.com)

## 🚀 Setup Instructions

### 1. Clone and Install

```bash
git clone <this-repo>
cd letta-chatbot-example
npm install
```

### 2. Get Letta API Key

1. Sign up at [letta.com](https://www.letta.com)
2. Navigate to **API Keys** in the sidebar
3. Click **+ Create API key**
4. Copy your API key

### 3. Setup Supabase

#### Create Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/)
2. Click **+ New project**
3. Choose name, password, and region
4. Wait ~2 minutes for setup

#### Get API Credentials
1. Click **Connect** in top navigation
2. Select **App Frameworks** tab
3. Copy:
   - **Project URL** (after `NEXT_PUBLIC_SUPABASE_URL=`)
   - **Publishable Key** (after `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=`)

#### Create Database Schema
1. In Supabase Dashboard, go to **SQL Editor**
2. Click **+ New query**
3. Copy contents of `./supabase-schema.sql` (from project root)
4. Paste and click **Run**
5. Verify "Success. No rows returned"

The schema creates three tables:
- `users` - Links cookies to Letta Identities
- `agents` - Stores agent metadata
- `messages` - Stores chat history (future enhancement)

### 4. Configure Environment Variables

```bash
cp .env.template .env
```

Edit `.env` with your credentials:

```bash
# Letta Cloud
LETTA_API_KEY=sk_your_letta_api_key
LETTA_BASE_URL=https://api.letta.com

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...

# Authentication
USE_COOKIE_BASED_AUTHENTICATION=true
NEXT_PUBLIC_CREATE_AGENTS_FROM_UI=true
```

### 5. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧪 Testing the Integration

### Test 1: User Creation
1. Visit `http://localhost:3000`
2. Open browser DevTools → Application → Cookies
3. Verify `letta-uid` cookie exists
4. Check Supabase Dashboard → Table Editor → `users` table
5. Verify new user row with your cookie value
6. Check Letta Dashboard → Identities (if visible in UI)

### Test 2: Agent Creation
1. Click **+ New Agent** in the UI
2. Agent appears in sidebar
3. Check Supabase → `agents` table → Verify new row
4. Check Letta Dashboard → Agents → Verify agent exists
5. Note: `letta_agent_id` in Supabase matches agent ID in Letta

### Test 3: Multi-User Support
1. Create an agent in current browser
2. Open **Incognito/Private window** → Visit `http://localhost:3000`
3. Verify: No agents visible (different cookie = different user)
4. Return to original browser → Verify: Your agent still visible

### Test 4: Agent Deletion
1. Click delete on an agent
2. Verify removed from UI
3. Check Supabase → `agents` table → Row deleted
4. Check Letta Dashboard → Agent deleted

### Test 5: Chatting
1. Click on an agent to open chat
2. Send a message
3. Verify streaming response appears
4. Note: Messages work but don't persist to Supabase (future feature)

## 📦 What's Included

### From Original Template
- [Letta TypeScript SDK](https://github.com/letta-ai/letta-node) - Letta API client
- [Vercel AI SDK](https://ai-sdk.dev/docs/introduction) - Streaming chat UI
- [Next.js 15+](https://nextjs.org) - Full-stack framework
- [React](https://reactjs.org) - UI components
- [TypeScript](https://www.typescriptlang.org) - Type safety
- [Shadcn UI](https://ui.shadcn.com) - Beautiful components
- [Tailwind CSS](https://tailwindcss.com) - Styling

### New Integrations
- [Supabase](https://supabase.com) - PostgreSQL database
- **Letta Identities** - Multi-user management
- **User Manager** - Orchestrates Supabase + Letta
- **Service Layers** - Clean data access patterns

## 🗂️ Project Structure

```
letta-chatbot-example/
├── src/
│   ├── app/                        # Next.js pages and API routes
│   │   ├── (server)/api/
│   │   │   └── agents/            # Agent CRUD + messaging
│   │   ├── [agentId]/             # Agent chat page
│   │   └── page.tsx               # Home page
│   ├── components/                 # React UI components
│   ├── config/
│   │   ├── letta-client.ts        # Letta SDK setup
│   │   └── supabase-client.ts     # ✨ NEW: Supabase client
│   ├── services/
│   │   ├── supabase-service.ts    # ✨ NEW: Database operations
│   │   └── letta-identity-service.ts  # ✨ NEW: Identity management
│   ├── lib/
│   │   └── user-manager.ts        # ✨ NEW: User orchestration
│   └── middleware.ts              # ✨ MODIFIED: User setup
├── default-agent.json             # Default agent configuration
├── .env.template                  # Environment variables template
└── README.md                      # This file
```

## 🔑 Key Concepts

### Letta Identities
Identities are Letta's way of managing users in multi-user applications:
- Each browser cookie maps to a Letta Identity
- Agents are linked to Identities (not just tags)
- Enables proper user management and permissions

**Example:**
```typescript
// Create Identity
const identity = await client.identities.create({
  identifierKey: cookieUid,
  name: "User",
  identityType: "user"
})

// Create agent linked to Identity
const agent = await client.agents.create({
  memoryBlocks: [...],
  identityIds: [identity.id]
})

// List user's agents
const agents = await client.agents.list({
  identifierKeys: [cookieUid]
})
```

### Data Flow
1. **User visits** → Middleware creates user in Supabase + Letta Identity
2. **Create agent** → Letta creates agent, Supabase stores metadata
3. **List agents** → Fetched from Letta by Identity
4. **Delete agent** → Removed from both Letta and Supabase

## 🛠️ Configuration

### Agent Configuration
Edit `default-agent.json` to customize default agent settings:
```json
{
  "DEFAULT_MEMORY_BLOCKS": [
    {
      "label": "human",
      "value": "The human's name is Bob the Builder"
    },
    {
      "label": "persona",
      "value": "My name is Sam, the all-knowing sentient AI."
    }
  ],
  "DEFAULT_LLM": "letta/letta-free",
  "DEFAULT_EMBEDDING": "letta/letta-free"
}
```

### Environment Options
- `USE_COOKIE_BASED_AUTHENTICATION=true` - Enable user sessions
- `NEXT_PUBLIC_CREATE_AGENTS_FROM_UI=true` - Show + button to create agents
- `LETTA_BASE_URL` - Use Letta Cloud (`https://api.letta.com`) or local server

## 🐛 Troubleshooting

### "User authentication required" error
- Check `.env` has correct `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Verify Supabase database schema was created
- Check browser console for errors

### Agent not appearing
- Verify Letta API key is valid
- Check Letta dashboard to see if agent exists
- Check Supabase `agents` table for metadata

### Database errors
- Ensure SQL schema was run successfully in Supabase
- Check Supabase logs in Dashboard → Logs
- Verify table structure matches schema

### Middleware errors
- Check server console logs
- Verify both Letta and Supabase are accessible
- Try disabling middleware temporarily (`USE_COOKIE_BASED_AUTHENTICATION=false`)

## 📚 Learn More

- [Letta Documentation](https://docs.letta.com/)
- [Letta Identities Guide](https://docs.letta.com/guides/agents/multi-user)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel AI SDK](https://ai-sdk.dev/docs/introduction)
- [Next.js Documentation](https://nextjs.org/docs)

## 🤝 Contributing

This is a tutorial/example project. Feel free to fork and modify for your needs!

## 📄 License

MIT License - See original Letta chatbot template for details.

---

**Built with** ❤️ **using Letta and Supabase**
