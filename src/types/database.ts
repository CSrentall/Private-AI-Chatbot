// Database types
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          role: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
          isActive: boolean
          lastLogin: string | null
          ipAddress: string | null
          twoFactorEnabled: boolean
          twoFactorSecret: string | null
          backupCodes: string[]
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
          isActive?: boolean
          lastLogin?: string | null
          ipAddress?: string | null
          twoFactorEnabled?: boolean
          twoFactorSecret?: string | null
          backupCodes?: string[]
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
          isActive?: boolean
          lastLogin?: string | null
          ipAddress?: string | null
          twoFactorEnabled?: boolean
          twoFactorSecret?: string | null
          backupCodes?: string[]
          createdAt?: string
          updatedAt?: string
        }
      }
      chat_sessions: {
        Row: {
          id: string
          userId: string
          mode: 'TECHNICAL' | 'INKOOP'
          title: string | null
          isActive: boolean
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          userId: string
          mode?: 'TECHNICAL' | 'INKOOP'
          title?: string | null
          isActive?: boolean
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          userId?: string
          mode?: 'TECHNICAL' | 'INKOOP'
          title?: string | null
          isActive?: boolean
          createdAt?: string
          updatedAt?: string
        }
      }
      messages: {
        Row: {
          id: string
          sessionId: string
          role: 'USER' | 'ASSISTANT' | 'SYSTEM'
          content: string
          metadata: any | null
          tokens: number | null
          createdAt: string
        }
        Insert: {
          id?: string
          sessionId: string
          role: 'USER' | 'ASSISTANT' | 'SYSTEM'
          content: string
          metadata?: any | null
          tokens?: number | null
          createdAt?: string
        }
        Update: {
          id?: string
          sessionId?: string
          role?: 'USER' | 'ASSISTANT' | 'SYSTEM'
          content?: string
          metadata?: any | null
          tokens?: number | null
          createdAt?: string
        }
      }
      documents_metadata: {
        Row: {
          id: string
          filename: string
          originalName: string
          mimeType: string
          size: number
          uploadedBy: string
          status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSING' | 'PROCESSED' | 'ERROR'
          approvedBy: string | null
          approvedAt: string | null
          rejectedReason: string | null
          supabaseUrl: string | null
          isProcessed: boolean
          processingError: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          filename: string
          originalName: string
          mimeType: string
          size: number
          uploadedBy: string
          status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSING' | 'PROCESSED' | 'ERROR'
          approvedBy?: string | null
          approvedAt?: string | null
          rejectedReason?: string | null
          supabaseUrl?: string | null
          isProcessed?: boolean
          processingError?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          filename?: string
          originalName?: string
          mimeType?: string
          size?: number
          uploadedBy?: string
          status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSING' | 'PROCESSED' | 'ERROR'
          approvedBy?: string | null
          approvedAt?: string | null
          rejectedReason?: string | null
          supabaseUrl?: string | null
          isProcessed?: boolean
          processingError?: string | null
          createdAt?: string
          updatedAt?: string
        }
      }
      document_chunks: {
        Row: {
          id: string
          documentId: string
          content: string
          embedding: any | null
          chunkIndex: number
          tokens: number | null
          metadata: any | null
          createdAt: string
        }
        Insert: {
          id?: string
          documentId: string
          content: string
          embedding?: any | null
          chunkIndex: number
          tokens?: number | null
          metadata?: any | null
          createdAt?: string
        }
        Update: {
          id?: string
          documentId?: string
          content?: string
          embedding?: any | null
          chunkIndex?: number
          tokens?: number | null
          metadata?: any | null
          createdAt?: string
        }
      }
      document_approvals: {
        Row: {
          id: string
          documentId: string
          userId: string
          action: 'APPROVE' | 'REJECT'
          reason: string | null
          createdAt: string
        }
        Insert: {
          id?: string
          documentId: string
          userId: string
          action: 'APPROVE' | 'REJECT'
          reason?: string | null
          createdAt?: string
        }
        Update: {
          id?: string
          documentId?: string
          userId?: string
          action?: 'APPROVE' | 'REJECT'
          reason?: string | null
          createdAt?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          userId: string | null
          action: string
          resource: string | null
          resourceId: string | null
          ipAddress: string | null
          userAgent: string | null
          metadata: any | null
          severity: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL'
          createdAt: string
        }
        Insert: {
          id?: string
          userId?: string | null
          action: string
          resource?: string | null
          resourceId?: string | null
          ipAddress?: string | null
          userAgent?: string | null
          metadata?: any | null
          severity?: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL'
          createdAt?: string
        }
        Update: {
          id?: string
          userId?: string | null
          action?: string
          resource?: string | null
          resourceId?: string | null
          ipAddress?: string | null
          userAgent?: string | null
          metadata?: any | null
          severity?: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL'
          createdAt?: string
        }
      }
      system_config: {
        Row: {
          id: string
          key: string
          value: string
          description: string | null
          isActive: boolean
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          key: string
          value: string
          description?: string | null
          isActive?: boolean
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          key?: string
          value?: string
          description?: string | null
          isActive?: boolean
          createdAt?: string
          updatedAt?: string
        }
      }
    }
  }
}