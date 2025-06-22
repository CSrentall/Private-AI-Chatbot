
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, supabaseAdmin } from '@/lib/supabase'
import { auditLogger } from '@/lib/audit-logger'

export async function GET(request: NextRequest) {
  try {
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
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get various statistics
    const [
      documentsStats,
      usersStats,
      chatStats,
      recentActivity
    ] = await Promise.all([
      // Documents statistics
      supabaseAdmin
        .from('documents_metadata')
        .select('status')
        .then(({ data }) => {
          const stats = { PENDING: 0, APPROVED: 0, REJECTED: 0, PROCESSING: 0, PROCESSED: 0, ERROR: 0 }
          data?.forEach(doc => {
            stats[doc.status as keyof typeof stats]++
          })
          return stats
        }),

      // Users statistics
      supabaseAdmin
        .from('users')
        .select('role, isActive, twoFactorEnabled')
        .then(({ data }) => {
          const stats = {
            total: data?.length || 0,
            active: data?.filter(u => u.isActive).length || 0,
            admins: data?.filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length || 0,
            twoFactorEnabled: data?.filter(u => u.twoFactorEnabled).length || 0
          }
          return stats
        }),

      // Chat statistics
      supabaseAdmin
        .from('chat_sessions')
        .select('mode, createdAt')
        .gte('createdAt', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .then(({ data }) => {
          const stats = {
            total: data?.length || 0,
            technical: data?.filter(s => s.mode === 'TECHNICAL').length || 0,
            inkoop: data?.filter(s => s.mode === 'INKOOP').length || 0
          }
          return stats
        }),

      // Recent activity
      supabaseAdmin
        .from('audit_logs')
        .select('action, createdAt, severity')
        .order('createdAt', { ascending: false })
        .limit(10)
        .then(({ data }) => data || [])
    ])

    await auditLogger.logAdmin('STATS_VIEWED', session.user.id)

    return NextResponse.json({
      documents: documentsStats,
      users: usersStats,
      chats: chatStats,
      recentActivity
    })

  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
