import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { v4 as uuid } from 'uuid'
import { LETTA_UID } from '@/types'
import { USE_COOKIE_BASED_AUTHENTICATION } from '@/constants'
import { getOrCreateUser } from '@/lib/user-manager'

export async function middleware(request: NextRequest) {
  if (!USE_COOKIE_BASED_AUTHENTICATION) {
    // do nothing if we're not using cookie based authentication
    return NextResponse.next()
  }

  const response = NextResponse.next()
  let lettaUid = request.cookies.get(LETTA_UID)?.value

  // Step 1: Ensure cookie exists
  if (!lettaUid) {
    lettaUid = uuid()
    response.cookies.set({
      name: LETTA_UID,
      value: lettaUid,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // expires 24 hours from now
      sameSite: 'lax', // Helps prevent csrf
      httpOnly: true, // Prevents client-side access
      secure: process.env.NODE_ENV === 'production' // send over https if we're on prod
    })
  }

  // Step 2: Ensure user exists in Supabase + Letta
  // This creates the user if they don't exist yet
  try {
    const userData = await getOrCreateUser(lettaUid)

    // Step 3: Attach user data to request headers
    // API routes can access this data without additional DB queries
    response.headers.set('x-user-id', userData.supabaseUserId)
    response.headers.set('x-letta-identity-id', userData.lettaIdentityId)
    response.headers.set('x-cookie-uid', userData.cookieUid)

    // Optional: Log new user creation
    if (userData.isNewUser) {
      console.log(`New user created: ${userData.supabaseUserId}`)
    }
  } catch (error) {
    console.error('Middleware: Failed to setup user:', error)
    // Continue anyway - API routes will handle missing headers
    // This prevents the entire app from breaking if Supabase/Letta is down
  }

  return response
}
