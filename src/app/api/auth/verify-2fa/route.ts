import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { TwoFactorAuth } from '@/lib/two-factor'
import { auditLogger } from '@/lib/audit-logger'
import { rateLimitByType } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-forwarded-for') || request.ip || '127.0.0.1'
    
    // Rate limiting
    const rateLimitResult = await rateLimitByType(clientIP, 'auth')
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
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

    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // Verify 2FA token
    const isValid = await TwoFactorAuth.verifyUserToken(session.user.id, token)

    if (!isValid) {
      await auditLogger.logAuth('2FA_VERIFICATION_FAILED', session.user.id, {
        reason: 'Invalid token'
      }, clientIP)
      
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 400 }
      )
    }

    // Update last login
    await supabase
      .from('users')
      .update({ 
        lastLogin: new Date().toISOString(),
        ipAddress: clientIP
      })
      .eq('id', session.user.id)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('2FA verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}