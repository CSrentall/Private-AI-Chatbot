import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { auditLogger } from '@/lib/audit-logger'
import { DocumentProcessor } from '@/lib/document-processor'
import { rateLimitByType } from '@/lib/rate-limit'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const documentId = params.id
    const { reason } = await request.json()

    // Get document
    const { data: document, error: docError } = await supabaseAdmin
      .from('documents_metadata')
      .select('*')
      .eq('id', documentId)
      .single()

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    if (document.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Document is not pending approval' },
        { status: 400 }
      )
    }

    // Update document status
    const { error: updateError } = await supabaseAdmin
      .from('documents_metadata')
      .update({
        status: 'APPROVED',
        approvedBy: session.user.id,
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .eq('id', documentId)

    if (updateError) {
      throw updateError
    }

    // Log approval
    await supabaseAdmin
      .from('document_approvals')
      .insert({
        documentId,
        userId: session.user.id,
        action: 'APPROVE',
        reason: reason || null,
        createdAt: new Date().toISOString()
      })

    await auditLogger.logDocument('APPROVED', documentId, session.user.id, {
      approvedBy: session.user.id,
      reason
    })

    // Start document processing in background
    DocumentProcessor.processDocument(documentId, session.user.id)
      .catch(error => {
        console.error('Document processing failed:', error)
      })

    return NextResponse.json({ 
      success: true,
      message: 'Document approved and processing started'
    })

  } catch (error) {
    console.error('Document approval error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}