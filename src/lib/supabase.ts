
import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client with service role (admin privileges)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Server component client
export const createServerClient = () => {
  const cookieStore = cookies()
  return createServerComponentClient({ cookies: () => cookieStore })
}

// Client component client
export const createBrowserClient = () => {
  return createClientComponentClient()
}

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
    }
  }
}
