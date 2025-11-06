import { supabase } from '@/config/supabase-client'

// ==================== User Operations ====================

export interface CreateUserData {
  cookieUid: string
  lettaIdentityId: string
  name?: string
  email?: string
}

export interface User {
  id: string
  cookie_uid: string
  letta_identity_id: string
  name: string | null
  email: string | null
  created_at: string
  updated_at: string
}

/**
 * Create a new user in Supabase
 */
export async function createUser(userData: CreateUserData): Promise<User> {
  const { cookieUid, lettaIdentityId, name, email } = userData

  const { data, error } = await supabase
    .from('users')
    .insert([
      {
        cookie_uid: cookieUid,
        letta_identity_id: lettaIdentityId,
        name: name || null,
        email: email || null
      }
    ])
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`)
  }

  console.log(`Created user in Supabase: ${data.id}`)
  return data
}

/**
 * Get user by cookie UID
 */
export async function getUserByCookieUid(cookieUid: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('cookie_uid', cookieUid)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null
    }
    throw new Error(`Failed to fetch user: ${error.message}`)
  }

  return data
}

/**
 * Get user by Letta Identity ID
 */
export async function getUserByLettaIdentity(lettaIdentityId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('letta_identity_id', lettaIdentityId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(`Failed to fetch user by Letta Identity: ${error.message}`)
  }

  return data
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(`Failed to fetch user: ${error.message}`)
  }

  return data
}

// ==================== Agent Operations ====================

export interface CreateAgentData {
  lettaAgentId: string
  userId: string
  name: string
  persona?: string
  humanBlock?: string
  model: string
}

export interface Agent {
  id: string
  letta_agent_id: string
  user_id: string
  name: string
  persona: string | null
  human_block: string | null
  model: string
  created_at: string
  updated_at: string
}

/**
 * Create agent metadata in Supabase (after creating in Letta)
 */
export async function createAgentMetadata(agentData: CreateAgentData): Promise<Agent> {
  const { lettaAgentId, userId, name, persona, humanBlock, model } = agentData

  const { data, error } = await supabase
    .from('agents')
    .insert([
      {
        letta_agent_id: lettaAgentId,
        user_id: userId,
        name,
        persona: persona || null,
        human_block: humanBlock || null,
        model
      }
    ])
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to store agent metadata: ${error.message}`)
  }

  console.log(`Stored agent metadata in Supabase: ${data.id}`)
  return data
}

/**
 * Get all agents for a user
 */
export async function getAgentsByUserId(userId: string): Promise<Agent[]> {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch agents: ${error.message}`)
  }

  return data
}

/**
 * Get agent by Letta agent ID
 */
export async function getAgentByLettaId(lettaAgentId: string): Promise<Agent | null> {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('letta_agent_id', lettaAgentId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(`Failed to fetch agent: ${error.message}`)
  }

  return data
}

/**
 * Get agent by Supabase ID
 */
export async function getAgentById(agentId: string): Promise<Agent | null> {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('id', agentId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(`Failed to fetch agent: ${error.message}`)
  }

  return data
}

/**
 * Delete agent metadata (when deleting from Letta)
 */
export async function deleteAgentMetadata(lettaAgentId: string): Promise<void> {
  const { error } = await supabase
    .from('agents')
    .delete()
    .eq('letta_agent_id', lettaAgentId)

  if (error) {
    throw new Error(`Failed to delete agent metadata: ${error.message}`)
  }

  console.log(`Deleted agent metadata from Supabase: ${lettaAgentId}`)
}

// ==================== Message Operations ====================

export interface CreateMessageData {
  agentId: string // Supabase agent ID
  lettaMessageId?: string
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface Message {
  id: string
  agent_id: string
  letta_message_id: string | null
  role: string
  content: string
  created_at: string
}

/**
 * Create a single message
 */
export async function createMessage(messageData: CreateMessageData): Promise<Message> {
  const { agentId, lettaMessageId, role, content } = messageData

  const { data, error } = await supabase
    .from('messages')
    .insert([
      {
        agent_id: agentId,
        letta_message_id: lettaMessageId || null,
        role,
        content
      }
    ])
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to store message: ${error.message}`)
  }

  return data
}

/**
 * Create multiple messages in bulk
 */
export async function createMessages(messages: CreateMessageData[]): Promise<Message[]> {
  const messagesToInsert = messages.map((msg) => ({
    agent_id: msg.agentId,
    letta_message_id: msg.lettaMessageId || null,
    role: msg.role,
    content: msg.content
  }))

  const { data, error } = await supabase
    .from('messages')
    .insert(messagesToInsert)
    .select()

  if (error) {
    throw new Error(`Failed to store messages: ${error.message}`)
  }

  console.log(`Stored ${data.length} messages in Supabase`)
  return data
}

/**
 * Get all messages for an agent (by Supabase agent ID)
 */
export async function getMessagesByAgentId(agentId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch messages: ${error.message}`)
  }

  return data
}

/**
 * Get messages for an agent by Letta agent ID
 */
export async function getMessagesByLettaAgentId(lettaAgentId: string): Promise<Message[]> {
  // First get the Supabase agent
  const agent = await getAgentByLettaId(lettaAgentId)
  if (!agent) {
    return []
  }

  return getMessagesByAgentId(agent.id)
}
