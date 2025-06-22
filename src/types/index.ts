
export interface User {
  id: string
  email: string
  name?: string
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
  isActive: boolean
  lastLogin?: string
  ipAddress?: string
  twoFactorEnabled: boolean
  twoFactorSecret?: string
  backupCodes: string[]
  createdAt: string
  updatedAt: string
}

export interface ChatSession {
  id: string
  userId: string
  mode: 'TECHNICAL' | 'INKOOP'
  title?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Message {
  id: string
  sessionId: string
  role: 'USER' | 'ASSISTANT' | 'SYSTEM'
  content: string
  metadata?: Record<string, any>
  tokens?: number
  createdAt: string
}

export interface Document {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  uploadedBy: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSING' | 'PROCESSED' | 'ERROR'
  approvedBy?: string
  approvedAt?: string
  rejectedReason?: string
  supabaseUrl?: string
  isProcessed: boolean
  processingError?: string
  createdAt: string
  updatedAt: string
}

export interface DocumentChunk {
  id: string
  documentId: string
  content: string
  embedding?: number[]
  chunkIndex: number
  tokens?: number
  metadata?: Record<string, any>
  createdAt: string
}

export interface DocumentApproval {
  id: string
  documentId: string
  userId: string
  action: 'APPROVE' | 'REJECT'
  reason?: string
  createdAt: string
}

export interface AuditLog {
  id: string
  userId?: string
  action: string
  resource?: string
  resourceId?: string
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, any>
  severity: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL'
  createdAt: string
}

export interface SystemConfig {
  id: string
  key: string
  value: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Chat Types
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatResponse {
  response: string
  sessionId: string
  sources?: Array<{
    filename: string
    content: string
  }>
}

// Upload Types
export interface FileUploadResponse {
  success: boolean
  document: {
    id: string
    filename: string
    status: string
    uploadedAt: string
  }
}

// Admin Types
export interface AdminStats {
  documents: {
    PENDING: number
    APPROVED: number
    REJECTED: number
    PROCESSING: number
    PROCESSED: number
    ERROR: number
  }
  users: {
    total: number
    active: number
    admins: number
    twoFactorEnabled: number
  }
  chats: {
    total: number
    technical: number
    inkoop: number
  }
  recentActivity: Array<{
    action: string
    createdAt: string
    severity: string
  }>
}

// 2FA Types
export interface TwoFactorSetup {
  qrCodeUrl: string
  backupCodes: string[]
  secret: string
}

export interface TwoFactorStatus {
  enabled: boolean
  backupCodesCount: number
}

// Rate Limiting Types
export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

// Error Types
export interface AppError extends Error {
  code?: string
  statusCode?: number
  details?: Record<string, any>
}

// Component Props Types
export interface ChatInterfaceProps {
  mode: 'TECHNICAL' | 'INKOOP'
  sessionId?: string
}

export interface AdminDashboardProps {
  user: User
}

export interface DocumentUploadProps {
  onUploadComplete?: (document: Document) => void
}

// Form Types
export interface LoginForm {
  email: string
  password: string
}

export interface TwoFactorForm {
  token: string
}

export interface DocumentApprovalForm {
  reason?: string
}

export interface DocumentRejectionForm {
  reason: string
}

// Utility Types
export type UserRole = User['role']
export type DocumentStatus = Document['status']
export type ChatMode = ChatSession['mode']
export type MessageRole = Message['role']
export type LogSeverity = AuditLog['severity']
export type ApprovalAction = DocumentApproval['action']

// Environment Types
export interface EnvironmentConfig {
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY: string
  OPENAI_API_KEY: string
  JWT_SECRET: string
  NEXTAUTH_SECRET: string
  NEXTAUTH_URL: string
  RATE_LIMIT_WINDOW_MS: string
  RATE_LIMIT_MAX_REQUESTS: string
  ALLOWED_IPS: string
  ADMIN_EMAIL: string
  SUPER_ADMIN_EMAIL: string
  MAX_FILE_SIZE: string
  ALLOWED_FILE_TYPES: string
  LOG_LEVEL: string
  ENABLE_AUDIT_LOGGING: string
  TOTP_ISSUER: string
  TOTP_WINDOW: string
}
