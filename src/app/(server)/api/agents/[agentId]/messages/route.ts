import { NextRequest, NextResponse } from 'next/server'
import client from '@/config/letta-client'
import { filterMessages } from './helpers'
import { validateAgentOwner } from '../../helpers'
import { Context } from '@/types'
import {
  convertToAiSdkMessage,
  createLetta
} from '@letta-ai/vercel-ai-sdk-provider'
import { streamText, convertToModelMessages } from 'ai'
import { getAgentByLettaId, createMessages } from '@/services/supabase-service'

async function getAgentMessages(
  req: NextRequest,
  context: Context<{ agentId: string }>
) {
  const result = await validateAgentOwner(req, context)
  if (result instanceof NextResponse) {
    return result
  }
  const { agentId } = result

  try {
    const messages = await client.agents.messages.list(agentId, { limit: 100 })

    const result = filterMessages(messages)
    return NextResponse.json(convertToAiSdkMessage(result))
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Error fetching messages' },
      { status: 500 }
    )
  }
}

async function sendMessage(
  req: NextRequest,
  context: Context<{ agentId: string }>
) {
  const { agentId } = await context.params

  const validate = await validateAgentOwner(req, context)
  if (!('agentId' in validate)) {
    console.error('Error:', validate)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const letta = createLetta({
    token: process.env.LETTA_API_KEY,
    baseUrl: process.env.LETTA_BASE_URL
  })

  const { messages } = await req.json()

  // Get Supabase agent to store messages
  const supabaseAgent = await getAgentByLettaId(agentId)
  if (!supabaseAgent) {
    console.warn(`Agent ${agentId} not found in Supabase, skipping message persistence`)
  }

  const result = streamText({
    model: letta(),
    providerOptions: {
      agent: {
        id: agentId
      }
    },
    messages: convertToModelMessages(messages),
    async onFinish({ text }) {
      // Persist messages to Supabase after streaming completes
      if (supabaseAgent) {
        try {
          const userMessage = messages[messages.length - 1]

          // Extract content from message structure
          // Vercel AI SDK messages have a parts array with text content
          let userContent = ''
          if (typeof userMessage === 'string') {
            userContent = userMessage
          } else if (userMessage.content) {
            userContent = userMessage.content
          } else if (userMessage.parts && Array.isArray(userMessage.parts)) {
            // Extract text from parts array
            userContent = userMessage.parts
              .filter((part: any) => part.type === 'text')
              .map((part: any) => part.text)
              .join('')
          }

          await createMessages([
            {
              agentId: supabaseAgent.id,
              role: 'user',
              content: userContent
            },
            {
              agentId: supabaseAgent.id,
              role: 'assistant',
              content: text
            }
          ])

          console.log(`Persisted conversation to Supabase for agent ${agentId}`)
        } catch (error) {
          console.error('Failed to persist messages to Supabase:', error)
          // Don't fail the request, just log the error
        }
      }
    }
  })

  return result.toUIMessageStreamResponse()
}

export const GET = getAgentMessages
export const POST = sendMessage
