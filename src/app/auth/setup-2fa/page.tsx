'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase-client'
import { Shield, Copy, Download, CheckCircle, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Setup2FAPage() {
  const [step, setStep] = useState(1)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [secret, setSecret] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createBrowserClient()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/auth/login')
        return
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profile?.twoFactorEnabled) {
        router.push('/dashboard')
        return
      }

      setUser(profile)
      initiate2FASetup()
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/auth/login')
    }
  }

  const initiate2FASetup = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/auth/setup-2fa', {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        setQrCodeUrl(data.qrCodeUrl)
        setBackupCodes(data.backupCodes)
        setSecret(data.secret)
      } else {
        const error = await response.json()
        toast.error(error.error || '2FA setup mislukt')
      }
    } catch (error) {
      console.error('2FA setup error:', error)
      toast.error('2FA setup mislukt')
    } finally {
      setLoading(false)
    }
  }

  const verify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Voer een geldige 6-cijferige code in')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/auth/setup-2fa', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret,
          token: verificationCode,
          backupCodes
        })
      })

      if (response.ok) {
        toast.success('2FA succesvol ingeschakeld!')
        setStep(3)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Verificatie mislukt')
      }
    } catch (error) {
      console.error('2FA verification error:', error)
      toast.error('Verificatie mislukt')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Gekopieerd naar klembord')
  }

  const downloadBackupCodes = () => {
    const content = `CSrental AI - 2FA Backup Codes
Gegenereerd op: ${new Date().toLocaleString('nl-NL')}
Account: ${user?.email}

BELANGRIJK: Bewaar deze codes op een veilige plaats!
Elke code kan slechts één keer worden gebruikt.

${backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}

Deze codes kunnen worden gebruikt als u geen toegang heeft tot uw authenticator app.
`

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `csrental-2fa-backup-codes-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Backup codes gedownload')
  }

  if (loading && !qrCodeUrl) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">2FA instellen...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Two-Factor Authentication Instellen
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Stap {step} van 3: Extra beveiliging voor uw account
          </p>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                1. Scan QR Code
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Scan deze QR code met uw authenticator app (Google Authenticator, Authy, etc.)
              </p>
              
              {qrCodeUrl && (
                <div className="qr-code-container">
                  <img src={qrCodeUrl} alt="2FA QR Code" className="mx-auto" />
                </div>
              )}

              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-2">Of voer deze code handmatig in:</p>
                <div className="flex items-center justify-between">
                  <code className="text-sm font-mono bg-white px-2 py-1 rounded border">
                    {secret}
                  </code>
                  <button
                    onClick={() => copyToClipboard(secret)}
                    className="btn-secondary text-xs py-1 px-2"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="btn-primary w-full"
            >
              Volgende: Code Verifiëren
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                2. Verifieer Code
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Voer de 6-cijferige code in die wordt getoond in uw authenticator app
              </p>
              
              <input
                type="text"
                maxLength={6}
                className="input-field text-center text-2xl tracking-widest"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                disabled={loading}
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setStep(1)}
                className="btn-secondary flex-1"
                disabled={loading}
              >
                Terug
              </button>
              <button
                onClick={verify2FA}
                disabled={loading || verificationCode.length !== 6}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="spinner mr-2"></div>
                    Verifiëren...
                  </div>
                ) : (
                  'Verifiëren'
                )}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-center mb-6">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">
                  2FA Succesvol Ingeschakeld!
                </h3>
                <p className="text-sm text-gray-600">
                  Uw account is nu extra beveiligd met two-factor authentication
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-yellow-800">
                      Backup Codes Bewaren
                    </h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Bewaar deze backup codes op een veilige plaats. U kunt ze gebruiken als u geen toegang heeft tot uw authenticator app.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <h4 className="text-sm font-medium text-gray-900">Backup Codes:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="bg-gray-50 p-2 rounded text-center">
                      <code className="text-sm font-mono">{code}</code>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3 mb-6">
                <button
                  onClick={() => copyToClipboard(backupCodes.join('\n'))}
                  className="btn-secondary flex-1"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Kopiëren
                </button>
                <button
                  onClick={downloadBackupCodes}
                  className="btn-secondary flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Downloaden
                </button>
              </div>
            </div>

            <button
              onClick={() => router.push('/dashboard')}
              className="btn-primary w-full"
            >
              Ga naar Dashboard
            </button>
          </div>
        )}

        <div className="text-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-primary-600 hover:text-primary-500"
          >
            Later instellen (niet aanbevolen)
          </button>
        </div>
      </div>
    </div>
  )
}