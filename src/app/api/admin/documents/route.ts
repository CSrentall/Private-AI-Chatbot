
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, supabaseAdmin } from '@/lib/supabase'
import { auditLogger } from '@/lib/audit-logger'
import { rateLimitByType } from '@/lib/rate-limit'

// Get all documents for admin review
export async function GET(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-forwarded-for') || request.ip || '127.0.0.1'
    
    // Rate limiting
    const rateLimitResult = await rateLimitByType(clientIP, 'api')
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

    // Check if user is admin
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      await auditLogger.logSecurity('UNAUTHORIZED_ADMIN_ACCESS', 'WARN', {
        userId: session.user.id,
        attemptedResource: 'admin/documents'
      }, clientIP)
      
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'PENDING'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Get documents with user information
    const { data: documents, error } = await supabaseAdmin
      .from('documents_metadata')
      .select(`
        *,
        users!documents_metadata_uploadedBy_fkey(
          id,
          email,
          name
        )
      `)
      .eq('status', status)
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw error
    }

    // Get total count
    const { count } = await supabaseAdmin
      .from('documents_metadata')
      .select('*', { count: 'exact', head: true })
      .eq('status', status)

    await auditLogger.logAdmin('DOCUMENTS_VIEWED', session.user.id, {
      status,
      page,
      count: documents?.length || 0
    })

    return NextResponse.json({
      documents: documents || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Admin documents fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
