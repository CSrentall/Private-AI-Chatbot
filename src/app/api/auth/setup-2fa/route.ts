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

    // Get user email
    const userEmail = session.user.email!

    // Generate 2FA setup
    const twoFactorSetup = await TwoFactorAuth.generateSecret(userEmail)

    await auditLogger.logAuth('2FA_SETUP_INITIATED', session.user.id, {
      email: userEmail
    }, clientIP)

    return NextResponse.json({
      qrCodeUrl: twoFactorSetup.qrCodeUrl,
      backupCodes: twoFactorSetup.backupCodes,
      secret: twoFactorSetup.secret // Only for setup, remove in production
    })

  } catch (error) {
    console.error('2FA setup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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

    const { secret, token, backupCodes } = await request.json()

    if (!secret || !token || !backupCodes) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Enable 2FA
    const success = await TwoFactorAuth.enableTwoFactor(
      session.user.id,
      secret,
      token,
      backupCodes
    )

    if (!success) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('2FA enable error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}