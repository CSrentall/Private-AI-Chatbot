import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import { supabaseAdmin } from './supabase-admin'
import { auditLogger } from './audit-logger'

export interface TwoFactorSetup {
  secret: string
  qrCodeUrl: string
  backupCodes: string[]
}

export class TwoFactorAuth {
  private static readonly ISSUER = process.env.TOTP_ISSUER || 'CSrental'
  private static readonly WINDOW = parseInt(process.env.TOTP_WINDOW || '2')

  static async generateSecret(userEmail: string): Promise<TwoFactorSetup> {
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: userEmail,
      issuer: this.ISSUER,
      length: 32
    })

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!)

    // Generate backup codes
    const backupCodes = this.generateBackupCodes()

    return {
      secret: secret.base32!,
      qrCodeUrl,
      backupCodes
    }
  }

  static async enableTwoFactor(userId: string, secret: string, token: string, backupCodes: string[]): Promise<boolean> {
    // Verify the token first
    const isValid = this.verifyToken(secret, token)
    if (!isValid) {
      await auditLogger.logAuth('2FA_ENABLE_FAILED', userId, { reason: 'Invalid token' })
      return false
    }

    try {
      // Update user record
      const { error } = await supabaseAdmin
        .from('users')
        .update({
          twoFactorEnabled: true,
          twoFactorSecret: secret,
          backupCodes: backupCodes,
          updatedAt: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        throw error
      }

      await auditLogger.logAuth('2FA_ENABLED', userId)
      return true
    } catch (error) {
      await auditLogger.logError(error as Error, '2FA_ENABLE', userId)
      return false
    }
  }

  static async disableTwoFactor(userId: string, token: string): Promise<boolean> {
    try {
      // Get user's 2FA secret
      const { data: user, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('twoFactorSecret, backupCodes')
        .eq('id', userId)
        .single()

      if (fetchError || !user) {
        throw new Error('User not found')
      }

      // Verify token or backup code
      const isValidToken = user.twoFactorSecret && this.verifyToken(user.twoFactorSecret, token)
      const isValidBackupCode = this.verifyBackupCode(user.backupCodes || [], token)

      if (!isValidToken && !isValidBackupCode) {
        await auditLogger.logAuth('2FA_DISABLE_FAILED', userId, { reason: 'Invalid token/backup code' })
        return false
      }

      // Remove backup code if used
      let updatedBackupCodes = user.backupCodes || []
      if (isValidBackupCode) {
        updatedBackupCodes = updatedBackupCodes.filter(code => code !== token)
      }

      // Update user record
      const { error } = await supabaseAdmin
        .from('users')
        .update({
          twoFactorEnabled: false,
          twoFactorSecret: null,
          backupCodes: [],
          updatedAt: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        throw error
      }

      await auditLogger.logAuth('2FA_DISABLED', userId)
      return true
    } catch (error) {
      await auditLogger.logError(error as Error, '2FA_DISABLE', userId)
      return false
    }
  }

  static verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: this.WINDOW
    })
  }

  static async verifyUserToken(userId: string, token: string): Promise<boolean> {
    try {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('twoFactorSecret, twoFactorEnabled, backupCodes')
        .eq('id', userId)
        .single()

      if (error || !user || !user.twoFactorEnabled) {
        return false
      }

      // Check TOTP token
      if (user.twoFactorSecret && this.verifyToken(user.twoFactorSecret, token)) {
        await auditLogger.logAuth('2FA_VERIFIED', userId, { method: 'totp' })
        return true
      }

      // Check backup code
      if (this.verifyBackupCode(user.backupCodes || [], token)) {
        // Remove used backup code
        const updatedBackupCodes = (user.backupCodes || []).filter(code => code !== token)
        
        await supabaseAdmin
          .from('users')
          .update({ backupCodes: updatedBackupCodes })
          .eq('id', userId)

        await auditLogger.logAuth('2FA_VERIFIED', userId, { 
          method: 'backup_code',
          remainingBackupCodes: updatedBackupCodes.length 
        })
        return true
      }

      await auditLogger.logAuth('2FA_VERIFICATION_FAILED', userId)
      return false
    } catch (error) {
      await auditLogger.logError(error as Error, '2FA_VERIFY', userId)
      return false
    }
  }

  static verifyBackupCode(backupCodes: string[], code: string): boolean {
    return backupCodes.includes(code)
  }

  static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = []
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = Math.random().toString(36).substring(2, 10).toUpperCase()
      codes.push(code)
    }
    return codes
  }

  static async regenerateBackupCodes(userId: string): Promise<string[]> {
    try {
      const newBackupCodes = this.generateBackupCodes()

      const { error } = await supabaseAdmin
        .from('users')
        .update({
          backupCodes: newBackupCodes,
          updatedAt: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        throw error
      }

      await auditLogger.logAuth('BACKUP_CODES_REGENERATED', userId)
      return newBackupCodes
    } catch (error) {
      await auditLogger.logError(error as Error, 'BACKUP_CODES_REGENERATE', userId)
      throw error
    }
  }

  static async getUserTwoFactorStatus(userId: string): Promise<{
    enabled: boolean
    backupCodesCount: number
  }> {
    try {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('twoFactorEnabled, backupCodes')
        .eq('id', userId)
        .single()

      if (error || !user) {
        return { enabled: false, backupCodesCount: 0 }
      }

      return {
        enabled: user.twoFactorEnabled || false,
        backupCodesCount: (user.backupCodes || []).length
      }
    } catch (error) {
      await auditLogger.logError(error as Error, '2FA_STATUS_CHECK', userId)
      return { enabled: false, backupCodesCount: 0 }
    }
  }
}