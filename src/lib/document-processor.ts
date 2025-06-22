
import { supabaseAdmin } from './supabase'
import { OpenAIService } from './openai'
import { auditLogger } from './audit-logger'

export interface DocumentChunk {
  content: string
  embedding?: number[]
  chunkIndex: number
  tokens: number
  metadata?: Record<string, any>
}

export class DocumentProcessor {
  private static readonly CHUNK_SIZE = 500 // tokens
  private static readonly CHUNK_OVERLAP = 50 // tokens
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

  static async processDocument(documentId: string, userId: string): Promise<boolean> {
    try {
      // Get document metadata
      const { data: document, error: docError } = await supabaseAdmin
        .from('documents_metadata')
        .select('*')
        .eq('id', documentId)
        .single()

      if (docError || !document) {
        throw new Error('Document not found')
      }

      // Update status to processing
      await supabaseAdmin
        .from('documents_metadata')
        .update({ 
          status: 'PROCESSING',
          updatedAt: new Date().toISOString()
        })
        .eq('id', documentId)

      await auditLogger.logDocument('PROCESSING_STARTED', documentId, userId)

      // Download file from Supabase Storage
      const { data: fileData, error: downloadError } = await supabaseAdmin.storage
        .from('documents')
        .download(document.filename)

      if (downloadError || !fileData) {
        throw new Error('Failed to download document')
      }

      // Extract text content
      const textContent = await this.extractTextContent(fileData, document.mimeType)
      
      if (!textContent || textContent.trim().length === 0) {
        throw new Error('No text content extracted from document')
      }

      // Create chunks
      const chunks = await this.createChunks(textContent, document)

      // Generate embeddings for chunks
      const chunksWithEmbeddings = await this.generateEmbeddings(chunks, userId)

      // Save chunks to database
      await this.saveChunks(documentId, chunksWithEmbeddings)

      // Update document status
      await supabaseAdmin
        .from('documents_metadata')
        .update({ 
          status: 'PROCESSED',
          isProcessed: true,
          updatedAt: new Date().toISOString()
        })
        .eq('id', documentId)

      await auditLogger.logDocument('PROCESSING_COMPLETED', documentId, userId, {
        chunksCreated: chunksWithEmbeddings.length,
        textLength: textContent.length
      })

      return true
    } catch (error) {
      // Update document status to error
      await supabaseAdmin
        .from('documents_metadata')
        .update({ 
          status: 'ERROR',
          processingError: (error as Error).message,
          updatedAt: new Date().toISOString()
        })
        .eq('id', documentId)

      await auditLogger.logError(error as Error, 'DOCUMENT_PROCESSING', userId, { documentId })
      return false
    }
  }

  private static async extractTextContent(fileData: Blob, mimeType: string): Promise<string> {
    switch (mimeType) {
      case 'text/plain':
      case 'text/markdown':
        return await fileData.text()
      
      case 'application/pdf':
        // For PDF processing, you would typically use a library like pdf-parse
        // For now, we'll return a placeholder
        return 'PDF content extraction not implemented yet'
      
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        // For Word document processing, you would use libraries like mammoth
        return 'Word document extraction not implemented yet'
      
      default:
        throw new Error(`Unsupported file type: ${mimeType}`)
    }
  }

  private static async createChunks(text: string, document: any): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = []
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    
    let currentChunk = ''
    let currentTokens = 0
    let chunkIndex = 0

    for (const sentence of sentences) {
      const sentenceTokens = this.estimateTokens(sentence)
      
      if (currentTokens + sentenceTokens > this.CHUNK_SIZE && currentChunk.length > 0) {
        // Create chunk
        chunks.push({
          content: currentChunk.trim(),
          chunkIndex,
          tokens: currentTokens,
          metadata: {
            documentId: document.id,
            filename: document.originalName,
            mimeType: document.mimeType
          }
        })
        
        chunkIndex++
        
        // Start new chunk with overlap
        const overlapText = this.getOverlapText(currentChunk, this.CHUNK_OVERLAP)
        currentChunk = overlapText + ' ' + sentence
        currentTokens = this.estimateTokens(currentChunk)
      } else {
        currentChunk += ' ' + sentence
        currentTokens += sentenceTokens
      }
    }

    // Add final chunk
    if (currentChunk.trim().length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        chunkIndex,
        tokens: currentTokens,
        metadata: {
          documentId: document.id,
          filename: document.originalName,
          mimeType: document.mimeType
        }
      })
    }

    return chunks
  }

  private static async generateEmbeddings(chunks: DocumentChunk[], userId: string): Promise<DocumentChunk[]> {
    const chunksWithEmbeddings: DocumentChunk[] = []

    for (const chunk of chunks) {
      try {
        const embedding = await OpenAIService.generateEmbedding(chunk.content, userId)
        chunksWithEmbeddings.push({
          ...chunk,
          embedding
        })
      } catch (error) {
        console.error(`Failed to generate embedding for chunk ${chunk.chunkIndex}:`, error)
        // Add chunk without embedding
        chunksWithEmbeddings.push(chunk)
      }
    }

    return chunksWithEmbeddings
  }

  private static async saveChunks(documentId: string, chunks: DocumentChunk[]): Promise<void> {
    const chunkRecords = chunks.map(chunk => ({
      documentId,
      content: chunk.content,
      embedding: chunk.embedding ? JSON.stringify(chunk.embedding) : null,
      chunkIndex: chunk.chunkIndex,
      tokens: chunk.tokens,
      metadata: chunk.metadata ? JSON.stringify(chunk.metadata) : null,
      createdAt: new Date().toISOString()
    }))

    const { error } = await supabaseAdmin
      .from('document_chunks')
      .insert(chunkRecords)

    if (error) {
      throw new Error(`Failed to save chunks: ${error.message}`)
    }
  }

  private static estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English/Dutch text
    return Math.ceil(text.length / 4)
  }

  private static getOverlapText(text: string, overlapTokens: number): string {
    const words = text.split(' ')
    const overlapWords = Math.min(overlapTokens, words.length)
    return words.slice(-overlapWords).join(' ')
  }

  // Search for relevant chunks based on query
  static async searchChunks(query: string, limit: number = 5, userId?: string): Promise<any[]> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await OpenAIService.generateEmbedding(query, userId)

      // For now, we'll do a simple text search
      // In production, you'd use vector similarity search
      const { data: chunks, error } = await supabaseAdmin
        .from('document_chunks')
        .select(`
          *,
          documents_metadata!inner(
            id,
            filename,
            originalName,
            status
          )
        `)
        .eq('documents_metadata.status', 'PROCESSED')
        .textSearch('content', query)
        .limit(limit)

      if (error) {
        throw error
      }

      await auditLogger.log({
        userId,
        action: 'CHUNKS_SEARCHED',
        resource: 'document_chunks',
        metadata: {
          query,
          resultsCount: chunks?.length || 0
        },
        severity: 'DEBUG'
      })

      return chunks || []
    } catch (error) {
      await auditLogger.logError(error as Error, 'CHUNK_SEARCH', userId, { query })
      return []
    }
  }
}
