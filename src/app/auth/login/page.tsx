
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase'
import { Bot, Mail, Lock, Eye, EyeOff, Shield } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [twoFactorRequired, setTwoFactorRequired] = useState(false)
  const [twoFactorToken, setTwoFactorToken] = useState('')
  const router = useRouter()
  const supabase = createBrowserClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      if (data.user) {
        // Check if user has 2FA enabled
        const { data: userProfile } = await supabase
          .from('users')
          .select('twoFactorEnabled, role')
          .eq('id', data.user.id)
          .single()

        if (userProfile?.twoFactorEnabled) {
          setTwoFactorRequired(true)
          toast.success('Voer uw 2FA code in')
        } else {
          toast.success('Succesvol ingelogd!')
          router.push('/dashboard')
        }
      }
    } catch (error: any) {
      console.error('Login error:', error)
      toast.error(error.message || 'Inloggen mislukt')
    } finally {
      setLoading(false)
    }
  }

  const handleTwoFactorVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: twoFactorToken })
      })

      if (response.ok) {
        toast.success('2FA verificatie succesvol!')
        router.push('/dashboard')
      } else {
        const error = await response.json()
        toast.error(error.error || '2FA verificatie mislukt')
      }
    } catch (error) {
      console.error('2FA verification error:', error)
      toast.error('2FA verificatie mislukt')
    } finally {
      setLoading(false)
    }
  }

  if (twoFactorRequired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary-600" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Two-Factor Authentication
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Voer de 6-cijferige code in van uw authenticator app
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleTwoFactorVerification}>
            <div>
              <label htmlFor="token" className="sr-only">
                2FA Code
              </label>
              <input
                id="token"
                name="token"
                type="text"
                required
                maxLength={6}
                className="input-field text-center text-2xl tracking-widest"
                placeholder="000000"
                value={twoFactorToken}
                onChange={(e) => setTwoFactorToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                disabled={loading}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || twoFactorToken.length !== 6}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
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

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setTwoFactorRequired(false)
                  setTwoFactorToken('')
                  supabase.auth.signOut()
                }}
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                Terug naar inloggen
              </button>
            </div>
          </form>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Backup codes gebruiken?</p>
              <p>Als u geen toegang heeft tot uw authenticator app, kunt u ook een backup code invoeren.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
            <Bot className="h-6 w-6 text-primary-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Inloggen bij CSrental AI
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Toegang tot uw persoonlijke AI assistenten
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email adres
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input-field pl-10"
                  placeholder="uw.email@csrental.nl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Wachtwoord
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="input-field pl-10 pr-10"
                  placeholder="Uw wachtwoord"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="spinner mr-2"></div>
                  Inloggen...
                </div>
              ) : (
                'Inloggen'
              )}
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/"
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              Terug naar homepage
            </Link>
          </div>
        </form>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <Shield className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Beveiligde Toegang
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Deze applicatie is alleen toegankelijk voor geautoriseerde CSrental medewerkers. 
                Toegang wordt gecontroleerd via IP whitelisting en 2FA.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
