import { NextRequest, NextResponse } from 'next/server'
import client from '@/config/letta-client'
import defaultAgent from '@/default-agent'
import { getUserFromRequest } from './helpers'
import * as supabaseService from '@/services/supabase-service'

async function getAgents(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) {
    return NextResponse.json({ error: 'User authentication required' }, { status: 401 })
  }

  try {
    // Fetch agents from Letta using Identity
    const agents = await client.agents.list({
      identifierKeys: [user.cookieUid]
    })

    const sortedAgents = agents.sort((a, b) => {
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
      return dateB - dateA
    })

    return NextResponse.json(sortedAgents)
  } catch (error) {
    console.error('Error fetching agents:', error)
    return NextResponse.json(
      { error: 'Error fetching agents' },
      { status: 500 }
    )
  }
}

async function createAgent(req: NextRequest) {
  // ADD YOUR OWN AGENTS HERE
  const DEFAULT_MEMORY_BLOCKS = defaultAgent.DEFAULT_MEMORY_BLOCKS
  const DEFAULT_LLM = defaultAgent.DEFAULT_LLM
  const DEFAULT_EMBEDDING = defaultAgent.DEFAULT_EMBEDDING

  const user = getUserFromRequest(req)
  if (!user) {
    return NextResponse.json({ error: 'User authentication required' }, { status: 401 })
  }

  try {
    // Step 1: Create agent in Letta with Identity
    const newAgent = await client.agents.create({
      memoryBlocks: DEFAULT_MEMORY_BLOCKS,
      model: DEFAULT_LLM,
      embedding: DEFAULT_EMBEDDING,
      identityIds: [user.lettaIdentityId]
    })

    // Step 2: Store agent metadata in Supabase
    // Extract persona and human block from memory blocks
    const personaBlock = DEFAULT_MEMORY_BLOCKS.find(b => b.label === 'persona')
    const humanBlock = DEFAULT_MEMORY_BLOCKS.find(b => b.label === 'human')

    await supabaseService.createAgentMetadata({
      lettaAgentId: newAgent.id,
      userId: user.supabaseUserId,
      name: newAgent.name || 'New Agent',
      persona: personaBlock?.value,
      humanBlock: humanBlock?.value,
      model: DEFAULT_LLM
    })

    console.log(`Agent created: Letta ID ${newAgent.id}, Supabase metadata stored`)

    return NextResponse.json(newAgent)
  } catch (error) {
    console.error('Error creating agent:', error)
    return NextResponse.json({ error: 'Error creating agent' }, { status: 500 })
  }
}

export const GET = getAgents
export const POST = createAgent
