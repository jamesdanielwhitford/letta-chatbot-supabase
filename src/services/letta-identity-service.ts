import client from '@/config/letta-client'

export interface CreateIdentityData {
  identifierKey: string
  name?: string
  identityType?: 'user' | 'agent' | 'system'
}

export interface LettaIdentity {
  id: string
  identifier_key: string
  name: string | null
  identity_type: string
  agent_ids: string[]
}

/**
 * Create a new Identity in Letta
 * Used to represent a user in the Letta system
 */
export async function createIdentity(
  identityData: CreateIdentityData
): Promise<LettaIdentity> {
  const { identifierKey, name, identityType = 'user' } = identityData

  try {
    const identity = await client.identities.create({
      identifierKey,
      name: name || identifierKey,
      identityType
    })

    console.log(`Created Letta Identity: ${identity.id} for ${identifierKey}`)
    return identity as LettaIdentity
  } catch (error) {
    console.error('Error creating Letta Identity:', error)
    throw new Error(`Failed to create Letta Identity: ${error}`)
  }
}

/**
 * Get an Identity by its ID
 */
export async function getIdentityById(identityId: string): Promise<LettaIdentity | null> {
  try {
    const identity = await client.identities.retrieve(identityId)
    return identity as LettaIdentity
  } catch (error) {
    console.error('Error fetching Letta Identity:', error)
    return null
  }
}

/**
 * Get an Identity by its identifier key
 * This searches through all identities to find a match
 */
export async function getIdentityByKey(identifierKey: string): Promise<LettaIdentity | null> {
  try {
    const identities = await client.identities.list()
    const identity = identities.find((i) => i.identifierKey === identifierKey)
    return identity ? (identity as LettaIdentity) : null
  } catch (error) {
    console.error('Error fetching Letta Identities:', error)
    return null
  }
}

/**
 * List all Identities (useful for admin purposes)
 */
export async function listIdentities(): Promise<LettaIdentity[]> {
  try {
    const identities = await client.identities.list()
    return identities as LettaIdentity[]
  } catch (error) {
    console.error('Error listing Letta Identities:', error)
    throw new Error(`Failed to list Identities: ${error}`)
  }
}

/**
 * Attach an Identity to an existing agent
 * Useful for sharing agents between users
 */
export async function attachIdentityToAgent(
  identityId: string,
  agentId: string
): Promise<void> {
  try {
    // Update the identity to include the agent ID
    await client.identities.update(identityId, {
      agentIds: [agentId]
    })
    console.log(`Attached Identity ${identityId} to agent ${agentId}`)
  } catch (error) {
    console.error('Error attaching Identity to agent:', error)
    throw new Error(`Failed to attach Identity to agent: ${error}`)
  }
}

/**
 * Get or create an Identity by identifier key
 * Useful for ensuring an Identity exists before creating an agent
 */
export async function getOrCreateIdentity(
  identifierKey: string,
  name?: string
): Promise<LettaIdentity> {
  // First try to find existing identity
  const existing = await getIdentityByKey(identifierKey)
  if (existing) {
    console.log(`Found existing Letta Identity: ${existing.id} for ${identifierKey}`)
    return existing
  }

  // Create new identity if not found
  return createIdentity({
    identifierKey,
    name: name || identifierKey,
    identityType: 'user'
  })
}
