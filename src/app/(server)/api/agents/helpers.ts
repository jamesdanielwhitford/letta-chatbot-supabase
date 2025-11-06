import client from '@/config/letta-client'
import { Context } from '@/types'
import { NextRequest, NextResponse } from 'next/server'
import { USE_COOKIE_BASED_AUTHENTICATION } from '@/constants'
import * as supabaseService from '@/services/supabase-service'

export interface UserData {
  supabaseUserId: string
  lettaIdentityId: string
  cookieUid: string
}

/**
 * Get user data from request headers (set by middleware)
 */
export function getUserFromRequest(req: NextRequest): UserData | null {
  if (!USE_COOKIE_BASED_AUTHENTICATION) {
    // Default user for non-authenticated mode
    return {
      supabaseUserId: 'default',
      lettaIdentityId: 'default',
      cookieUid: 'default'
    }
  }

  const supabaseUserId = req.headers.get('x-user-id')
  const lettaIdentityId = req.headers.get('x-letta-identity-id')
  const cookieUid = req.headers.get('x-cookie-uid')

  if (!supabaseUserId || !lettaIdentityId || !cookieUid) {
    return null
  }

  return {
    supabaseUserId,
    lettaIdentityId,
    cookieUid
  }
}

export async function validateAgentOwner(
  req: NextRequest,
  context: Context<{ agentId: string }>
) {
  const { agentId } = await context.params

  if (!USE_COOKIE_BASED_AUTHENTICATION) {
    return {
      userId: 'default',
      agentId,
      agent: await getAgent(agentId)
    }
  }

  // Get user from request headers
  const user = getUserFromRequest(req)
  if (!user) {
    return NextResponse.json({ error: 'User authentication required' }, { status: 401 })
  }

  if (!agentId) {
    return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 })
  }

  // Verify agent exists in Letta
  const agent = await getAgent(agentId)
  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  // Verify ownership via Supabase
  // Check if this agent belongs to the user
  const agentMetadata = await supabaseService.getAgentByLettaId(agentId)
  if (!agentMetadata || agentMetadata.user_id !== user.supabaseUserId) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  return {
    userId: user.supabaseUserId,
    agentId: agentId,
    agent: agent,
    user: user
  }
}

/**
 * @deprecated Use getUserFromRequest() instead
 * Kept for backwards compatibility
 */
export function getUserId(req: NextRequest) {
  const user = getUserFromRequest(req)
  return user?.cookieUid || null
}

export async function getAgent(agentId: string) {
  const agent = await client.agents.retrieve(agentId)
  return agent
}
