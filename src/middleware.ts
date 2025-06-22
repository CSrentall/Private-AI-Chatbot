
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { auditLogger } from '@/lib/audit-logger'

// IP Whitelist check
function isIPAllowed(ip: string): boolean {
  const allowedIPs = process.env.ALLOWED_IPS?.split(',') || ['127.0.0.1', '::1']
  return allowedIPs.includes(ip) || allowedIPs.includes('*')
}

// Get client IP address
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return request.ip || '127.0.0.1'
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const clientIP = getClientIP(request)
  const userAgent = request.headers.get('user-agent') || 'Unknown'
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // IP Whitelist check (skip for public routes)
  const isPublicRoute = request.nextUrl.pathname.startsWith('/auth') || 
                       request.nextUrl.pathname === '/' ||
                       request.nextUrl.pathname.startsWith('/api/auth')
  
  if (!isPublicRoute && !isIPAllowed(clientIP)) {
    await auditLogger.log({
      action: 'IP_BLOCKED',
      ipAddress: clientIP,
      userAgent,
      metadata: { 
        path: request.nextUrl.pathname,
        reason: 'IP not in whitelist'
      },
      severity: 'WARN'
    })
    
    return new NextResponse('Access Denied', { status: 403 })
  }
  
  // Rate limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const rateLimitResult = await rateLimit(clientIP)
    
    if (!rateLimitResult.success) {
      await auditLogger.log({
        action: 'RATE_LIMIT_EXCEEDED',
        ipAddress: clientIP,
        userAgent,
        metadata: { 
          path: request.nextUrl.pathname,
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining
        },
        severity: 'WARN'
      })
      
      return new NextResponse('Too Many Requests', { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toString(),
        }
      })
    }
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString())
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
    response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString())
  }
  
  // Auth check for protected routes
  const protectedRoutes = ['/dashboard', '/admin', '/chat', '/documents']
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )
  
  if (isProtectedRoute) {
    const supabase = createMiddlewareClient({ req: request, res: response })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      const redirectUrl = new URL('/auth/login', request.url)
      redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
      
      await auditLogger.log({
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        ipAddress: clientIP,
        userAgent,
        metadata: { 
          path: request.nextUrl.pathname,
          reason: 'No valid session'
        },
        severity: 'WARN'
      })
      
      return NextResponse.redirect(redirectUrl)
    }
    
    // Check 2FA requirement for admin routes
    if (request.nextUrl.pathname.startsWith('/admin')) {
      const { data: user } = await supabase
        .from('users')
        .select('twoFactorEnabled, role')
        .eq('id', session.user.id)
        .single()
      
      if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
        if (!user.twoFactorEnabled) {
          const redirectUrl = new URL('/auth/setup-2fa', request.url)
          return NextResponse.redirect(redirectUrl)
        }
      }
    }
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
