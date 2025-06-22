
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, supabaseAdmin } from '@/lib/supabase'
import { auditLogger } from '@/lib/audit-logger'
import { rateLimitByType } from '@/lib/rate-limit'

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB
const ALLOWED_TYPES = (process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx,txt,md').split(',')

export async function POST(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-forwarded-for') || request.ip || '127.0.0.1'
    
    // Rate limiting for uploads
    const rateLimitResult = await rateLimitByType(clientIP, 'upload')
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many uploads. Please try again later.' },
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

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      )
    }

    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    if (!fileExtension || !ALLOWED_TYPES.includes(fileExtension)) {
      return NextResponse.json(
        { error: `File type not allowed. Allowed types: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('documents')
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      throw uploadError
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('documents')
      .getPublicUrl(filename)

    // Save document metadata
    const { data: document, error: dbError } = await supabaseAdmin
      .from('documents_metadata')
      .insert({
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        uploadedBy: session.user.id,
        status: 'PENDING',
        supabaseUrl: publicUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single()

    if (dbError) {
      // Clean up uploaded file if database insert fails
      await supabaseAdmin.storage
        .from('documents')
        .remove([filename])
      throw dbError
    }

    await auditLogger.logDocument('UPLOADED', document.id, session.user.id, {
      filename: file.name,
      size: file.size,
      mimeType: file.type
    })

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        filename: document.originalName,
        status: document.status,
        uploadedAt: document.createdAt
      }
    })

  } catch (error) {
    console.error('File upload error:', error)
    await auditLogger.logError(error as Error, 'FILE_UPLOAD')
    
    return NextResponse.json(
      { error: 'Upload failed. Please try again.' },
      { status: 500 }
    )
  }
}

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

    // Get user's uploaded documents
    const { data: documents, error } = await supabase
      .from('documents_metadata')
      .select('id, originalName, status, createdAt, size, mimeType')
      .eq('uploadedBy', session.user.id)
      .order('createdAt', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      documents: documents || []
    })

  } catch (error) {
    console.error('Documents fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}
