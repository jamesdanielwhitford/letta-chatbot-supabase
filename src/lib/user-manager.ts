import * as supabaseService from '@/services/supabase-service'
import * as lettaIdentityService from '@/services/letta-identity-service'

export interface UserData {
  supabaseUserId: string
  lettaIdentityId: string
  cookieUid: string
  isNewUser: boolean
}

/**
 * Get or create a user across both Supabase and Letta systems
 * This is the main orchestration function that ensures consistency
 *
 * Flow:
 * 1. Check if user exists in Supabase by cookie UID
 * 2. If exists, return existing user data
 * 3. If not exists:
 *    a. Create Letta Identity first (with cookie UID as identifier)
 *    b. Create Supabase user with Letta Identity ID
 *    c. Return new user data
 *
 * @param cookieUid - The browser cookie UUID
 * @returns UserData object with IDs from both systems
 */
export async function getOrCreateUser(cookieUid: string): Promise<UserData> {
  // Step 1: Check if user already exists in Supabase
  const existingUser = await supabaseService.getUserByCookieUid(cookieUid)

  if (existingUser) {
    // User exists, return their data
    return {
      supabaseUserId: existingUser.id,
      lettaIdentityId: existingUser.letta_identity_id,
      cookieUid: existingUser.cookie_uid,
      isNewUser: false
    }
  }

  // Step 2: User doesn't exist, create them in both systems
  console.log(`Creating new user for cookie: ${cookieUid}`)

  try {
    // Step 2a: Create Letta Identity first
    // Use cookie UID as the identifier key for consistency
    const lettaIdentity = await lettaIdentityService.getOrCreateIdentity(
      cookieUid,
      `User ${cookieUid.substring(0, 8)}` // Generate friendly name from cookie
    )

    // Step 2b: Create user in Supabase with Letta Identity reference
    const supabaseUser = await supabaseService.createUser({
      cookieUid,
      lettaIdentityId: lettaIdentity.id,
      name: lettaIdentity.name || undefined
    })

    console.log(
      `Created new user: Supabase ID ${supabaseUser.id}, Letta Identity ${lettaIdentity.id}`
    )

    return {
      supabaseUserId: supabaseUser.id,
      lettaIdentityId: lettaIdentity.id,
      cookieUid: supabaseUser.cookie_uid,
      isNewUser: true
    }
  } catch (error) {
    console.error('Failed to create user:', error)
    throw new Error(`User creation failed: ${error}`)
  }
}

/**
 * Get user data by cookie UID (does not create if not found)
 * Returns null if user doesn't exist
 *
 * @param cookieUid - The browser cookie UUID
 * @returns UserData object or null
 */
export async function getUserByCookie(cookieUid: string): Promise<UserData | null> {
  const user = await supabaseService.getUserByCookieUid(cookieUid)

  if (!user) {
    return null
  }

  return {
    supabaseUserId: user.id,
    lettaIdentityId: user.letta_identity_id,
    cookieUid: user.cookie_uid,
    isNewUser: false
  }
}

/**
 * Verify that a user's Letta Identity exists
 * Useful for debugging or health checks
 *
 * @param userData - User data from Supabase
 * @returns true if Identity exists in Letta, false otherwise
 */
export async function verifyLettaIdentity(userData: UserData): Promise<boolean> {
  const identity = await lettaIdentityService.getIdentityById(userData.lettaIdentityId)
  return identity !== null
}
