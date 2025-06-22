import { supabaseAdmin } from './supabase-admin'

export type LogSeverity = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL'

export interface AuditLogEntry {
  userId?: string
  action: string
  resource?: string
  resourceId?: string
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, any>
  severity?: LogSeverity
}

class AuditLogger {
  private isEnabled: boolean

  constructor() {
    this.isEnabled = process.env.ENABLE_AUDIT_LOGGING === 'true'
  }

  async log(entry: AuditLogEntry): Promise<void> {
    if (!this.isEnabled) {
      return
    }

    try {
      const logEntry = {
        ...entry,
        severity: entry.severity || 'INFO',
        createdAt: new Date().toISOString(),
      }

      // Log to database
      const { error } = await supabaseAdmin
        .from('audit_logs')
        .insert([logEntry])

      if (error) {
        console.error('Failed to write audit log:', error)
        // Fallback to console logging
        this.logToConsole(logEntry)
      }

      // Also log to console for development
      if (process.env.NODE_ENV === 'development') {
        this.logToConsole(logEntry)
      }

    } catch (error) {
      console.error('Audit logging error:', error)
      this.logToConsole(entry)
    }
  }

  private logToConsole(entry: AuditLogEntry): void {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [${entry.severity}] ${entry.action}`
    
    switch (entry.severity) {
      case 'CRITICAL':
      case 'ERROR':
        console.error(logMessage, entry)
        break
      case 'WARN':
        console.warn(logMessage, entry)
        break
      case 'DEBUG':
        console.debug(logMessage, entry)
        break
      default:
        console.log(logMessage, entry)
    }
  }

  // Convenience methods for common log types
  async logAuth(action: string, userId?: string, metadata?: Record<string, any>, ipAddress?: string): Promise<void> {
    await this.log({
      userId,
      action: `AUTH_${action}`,
      resource: 'authentication',
      ipAddress,
      metadata,
      severity: 'INFO'
    })
  }

  async logSecurity(action: string, severity: LogSeverity = 'WARN', metadata?: Record<string, any>, ipAddress?: string): Promise<void> {
    await this.log({
      action: `SECURITY_${action}`,
      resource: 'security',
      ipAddress,
      metadata,
      severity
    })
  }

  async logDocument(action: string, documentId: string, userId?: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      userId,
      action: `DOCUMENT_${action}`,
      resource: 'document',
      resourceId: documentId,
      metadata,
      severity: 'INFO'
    })
  }

  async logAdmin(action: string, userId: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      userId,
      action: `ADMIN_${action}`,
      resource: 'admin',
      metadata,
      severity: 'INFO'
    })
  }

  async logChat(action: string, sessionId: string, userId?: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      userId,
      action: `CHAT_${action}`,
      resource: 'chat',
      resourceId: sessionId,
      metadata,
      severity: 'INFO'
    })
  }

  async logError(error: Error, context?: string, userId?: string, metadata?: Record<string, any>): Promise<void> {
    await this.log({
      userId,
      action: 'ERROR_OCCURRED',
      resource: context || 'application',
      metadata: {
        ...metadata,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      },
      severity: 'ERROR'
    })
  }
}

export const auditLogger = new AuditLogger()

// Middleware helper for automatic request logging
export function createAuditMiddleware() {
  return async (req: any, res: any, next: any) => {
    const startTime = Date.now()
    
    // Log request start
    await auditLogger.log({
      action: 'REQUEST_START',
      resource: 'api',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata: {
        method: req.method,
        path: req.path,
        query: req.query
      },
      severity: 'DEBUG'
    })

    // Override res.end to log response
    const originalEnd = res.end
    res.end = function(...args: any[]) {
      const duration = Date.now() - startTime
      
      auditLogger.log({
        action: 'REQUEST_END',
        resource: 'api',
        ipAddress: req.ip,
        metadata: {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration
        },
        severity: res.statusCode >= 400 ? 'WARN' : 'DEBUG'
      })

      originalEnd.apply(this, args)
    }

    next()
  }
}