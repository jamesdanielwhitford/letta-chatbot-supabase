-- Supabase Schema for Letta + Supabase Integration
-- This schema stores user data, agent metadata, and message history
-- while Letta manages agent runtime and conversation state

-- Table: users
-- Stores user information and links to Letta Identities
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cookie_uid TEXT NOT NULL UNIQUE,  -- Maps to browser cookie UUID
  letta_identity_id TEXT NOT NULL UNIQUE,  -- Links to Letta Identity
  name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: agents
-- Stores metadata about Letta agents
CREATE TABLE agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  letta_agent_id TEXT NOT NULL UNIQUE,  -- Links to Letta agent
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  persona TEXT,
  human_block TEXT,
  model TEXT NOT NULL DEFAULT 'openai/gpt-4o-mini',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: messages
-- Stores chat messages between users and agents
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  letta_message_id TEXT,  -- Links to Letta message (null for user messages)
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_cookie_uid ON users(cookie_uid);
CREATE INDEX idx_users_letta_identity_id ON users(letta_identity_id);
CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE INDEX idx_agents_letta_agent_id ON agents(letta_agent_id);
CREATE INDEX idx_messages_agent_id ON messages(agent_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at
    BEFORE UPDATE ON agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments explaining the schema
COMMENT ON TABLE users IS 'Stores user information and links to Letta Identities for multi-user support';
COMMENT ON TABLE agents IS 'Stores agent metadata while Letta manages the actual agent runtime and memory';
COMMENT ON TABLE messages IS 'Stores queryable message history while Letta manages conversation state';

COMMENT ON COLUMN users.cookie_uid IS 'Browser cookie UUID used for anonymous session tracking';
COMMENT ON COLUMN users.letta_identity_id IS 'References the Letta Identity object for this user';
COMMENT ON COLUMN agents.letta_agent_id IS 'References the actual agent in Letta (source of truth for agent state)';
COMMENT ON COLUMN messages.letta_message_id IS 'References Letta message ID for traceability (null for user messages)';
