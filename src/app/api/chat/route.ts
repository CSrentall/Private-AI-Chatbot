import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { OpenAIService } from '@/lib/openai'
import { DocumentProcessor } from '@/lib/document-processor'
import { auditLogger } from '@/lib/audit-logger'
import { rateLimitByType } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-forwarded-for') || request.ip || '127.0.0.1'
    
    // Rate limiting for chat
    const rateLimitResult = await rateLimitByType(clientIP, 'chat')
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many chat requests. Please wait before sending another message.' },
        { status: 429 }
      )
    }

    const supabase = createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { message, sessionId, mode = 'TECHNICAL' } = await request.json()

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Get or create chat session
    let chatSession
    if (sessionId) {
      const { data: existingSession } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('userId', session.user.id)
        .single()
      
      chatSession = existingSession
    }

    if (!chatSession) {
      const { data: newSession, error: sessionError } = await supabaseAdmin
        .from('chat_sessions')
        .insert({
          userId: session.user.id,
          mode,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single()

      if (sessionError) {
        throw sessionError
      }
      chatSession = newSession
    }

    // Save user message
    const { error: userMessageError } = await supabaseAdmin
      .from('messages')
      .insert({
        sessionId: chatSession.id,
        role: 'USER',
        content: message,
        createdAt: new Date().toISOString()
      })

    if (userMessageError) {
      throw userMessageError
    }

    // Get conversation history
    const { data: messages } = await supabase
      .from('messages')
      .select('role, content')
      .eq('sessionId', chatSession.id)
      .order('createdAt', { ascending: true })
      .limit(20) // Limit context to last 20 messages

    // Search for relevant documents
    const relevantChunks = await DocumentProcessor.searchChunks(
      message,
      5,
      session.user.id
    )

    // Build context from relevant documents
    let contextText = ''
    if (relevantChunks.length > 0) {
      contextText = '\n\nRelevante informatie uit documenten:\n' +
        relevantChunks.map(chunk => 
          `- ${chunk.documents_metadata.originalName}: ${chunk.content.substring(0, 200)}...`
        ).join('\n')
    }

    // Prepare messages for OpenAI
    const chatMessages = [
      {
        role: 'system' as const,
        content: OpenAIService.getSystemPrompt(mode as 'TECHNICAL' | 'INKOOP') + contextText
      },
      ...(messages || []).map(msg => ({
        role: msg.role.toLowerCase() as 'user' | 'assistant',
        content: msg.content
      }))
    ]

    // Get AI response
    const aiResponse = await OpenAIService.chat(
      chatMessages,
      session.user.id,
      chatSession.id
    )

    // Save AI response
    const { error: aiMessageError } = await supabaseAdmin
      .from('messages')
      .insert({
        sessionId: chatSession.id,
        role: 'ASSISTANT',
        content: aiResponse.message,
        tokens: aiResponse.tokens,
        metadata: JSON.stringify({
          model: aiResponse.model,
          relevantDocuments: relevantChunks.length
        }),
        createdAt: new Date().toISOString()
      })

    if (aiMessageError) {
      throw aiMessageError
    }

    // Update session title if it's the first message
    if (!chatSession.title) {
      const title = await OpenAIService.generateChatTitle(chatMessages)
      await supabaseAdmin
        .from('chat_sessions')
        .update({ 
          title,
          updatedAt: new Date().toISOString()
        })
        .eq('id', chatSession.id)
    }

    await auditLogger.logChat('MESSAGE_EXCHANGED', chatSession.id, session.user.id, {
      mode,
      messageLength: message.length,
      responseLength: aiResponse.message.length,
      tokens: aiResponse.tokens,
      relevantDocuments: relevantChunks.length
    })

    return NextResponse.json({
      response: aiResponse.message,
      sessionId: chatSession.id,
      sources: relevantChunks.map(chunk => ({
        filename: chunk.documents_metadata.originalName,
        content: chunk.content.substring(0, 200) + '...'
      }))
    })

  } catch (error) {
    console.error('Chat error:', error)
    await auditLogger.logError(error as Error, 'CHAT_API')
    
    return NextResponse.json(
      { error: 'Failed to process chat message. Please try again.' },
      { status: 500 }
    )
  }
}