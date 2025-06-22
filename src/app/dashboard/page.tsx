'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase-client'
import { Bot, FileText, Settings, Shield, LogOut, Menu, X } from 'lucide-react'
import ChatInterface from '@/components/ChatInterface'
import DocumentUpload from '@/components/DocumentUpload'
import AdminDashboard from '@/components/AdminDashboard'
import toast from 'react-hot-toast'

type TabType = 'cees' | 'chris' | 'documents' | 'admin' | 'settings'

interface User {
  id: string
  email: string
  name: string
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
  twoFactorEnabled: boolean
  createdAt: string
  lastLogin?: string
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('cees')
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
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
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error || !profile) {
        console.error('Profile fetch error:', error)
        toast.error('Kon gebruikersprofiel niet laden')
        return
      }

      setUser(profile)
    } catch (error) {
      console.error('Auth check error:', error)
      toast.error('Authenticatie fout')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/')
      toast.success('Succesvol uitgelogd')
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Uitloggen mislukt')
    }
  }

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

  const navigation = [
    { id: 'cees', name: 'CeeS (Technisch)', icon: Bot, color: 'text-blue-600' },
    { id: 'chris', name: 'ChriS (Inkoop)', icon: Bot, color: 'text-green-600' },
    { id: 'documents', name: 'Documenten', icon: FileText, color: 'text-purple-600' },
    ...(isAdmin ? [{ id: 'admin', name: 'Admin', icon: Shield, color: 'text-red-600' }] : []),
    { id: 'settings', name: 'Instellingen', icon: Settings, color: 'text-gray-600' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Dashboard laden...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        
        {/* Sidebar header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center">
            <Bot className="h-8 w-8 text-primary-600 mr-2" />
            <span className="text-xl font-bold text-gray-900">CSrental AI</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User info */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-600 font-medium">
                {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{user.name || 'Gebruiker'}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
              <div className="flex items-center mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  user.role === 'SUPER_ADMIN' 
                    ? 'bg-red-100 text-red-800'
                    : user.role === 'ADMIN'
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {user.role}
                </span>
                {user.twoFactorEnabled && (
                  <Shield className="h-3 w-3 text-green-500 ml-2" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as TabType)
                setSidebarOpen(false)
              }}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                activeTab === item.id
                  ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className={`h-5 w-5 mr-3 ${
                activeTab === item.id ? 'text-primary-600' : item.color
              }`} />
              {item.name}
            </button>
          ))}
        </nav>

        {/* Sign out */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Uitloggen
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 lg:hidden">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md hover:bg-gray-100"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-medium text-gray-900">
              {navigation.find(item => item.id === activeTab)?.name}
            </h1>
            <div className="w-9" /> {/* Spacer */}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'cees' && (
              <div>
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">CeeS - Technische Assistent</h1>
                  <p className="text-gray-600">Uw AI assistent voor technische vragen en procedures</p>
                </div>
                <div className="h-[calc(100vh-200px)]">
                  <ChatInterface mode="TECHNICAL" />
                </div>
              </div>
            )}

            {activeTab === 'chris' && (
              <div>
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">ChriS - Inkoop Assistent</h1>
                  <p className="text-gray-600">Uw AI assistent voor inkoop en prijsvergelijkingen</p>
                </div>
                <div className="h-[calc(100vh-200px)]">
                  <ChatInterface mode="INKOOP" />
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div>
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">Document Beheer</h1>
                  <p className="text-gray-600">Upload documenten voor de AI kennisbank</p>
                </div>
                <DocumentUpload />
              </div>
            )}

            {activeTab === 'admin' && isAdmin && (
              <div>
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                  <p className="text-gray-600">Beheer gebruikers, documenten en systeem instellingen</p>
                </div>
                <AdminDashboard />
              </div>
            )}

            {activeTab === 'settings' && (
              <div>
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">Instellingen</h1>
                  <p className="text-gray-600">Beheer uw account en beveiligingsinstellingen</p>
                </div>
                
                <div className="space-y-6">
                  {/* Profile Settings */}
                  <div className="card">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Profiel Informatie</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={user.email}
                          disabled
                          className="input-field bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Naam
                        </label>
                        <input
                          type="text"
                          value={user.name || ''}
                          disabled
                          className="input-field bg-gray-50"
                          placeholder="Niet ingesteld"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Rol
                        </label>
                        <input
                          type="text"
                          value={user.role}
                          disabled
                          className="input-field bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Security Settings */}
                  <div className="card">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Beveiliging</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h4>
                          <p className="text-sm text-gray-500">
                            Extra beveiligingslaag voor uw account
                          </p>
                        </div>
                        <div className="flex items-center">
                          {user.twoFactorEnabled ? (
                            <span className="status-approved">Actief</span>
                          ) : (
                            <span className="status-pending">Inactief</span>
                          )}
                        </div>
                      </div>
                      
                      {!user.twoFactorEnabled && (isAdmin || user.role === 'ADMIN') && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex">
                            <Shield className="h-5 w-5 text-yellow-600 mt-0.5" />
                            <div className="ml-3">
                              <h4 className="text-sm font-medium text-yellow-800">
                                2FA Vereist voor Admin Accounts
                              </h4>
                              <p className="text-sm text-yellow-700 mt-1">
                                Als admin moet u 2FA inschakelen om toegang te krijgen tot admin functies.
                              </p>
                              <button 
                                onClick={() => router.push('/auth/setup-2fa')}
                                className="btn-primary mt-3 text-sm"
                              >
                                2FA Instellen
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* System Info */}
                  <div className="card">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Systeem Informatie</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Versie:</span>
                        <span className="text-gray-900">2.0.0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Laatste login:</span>
                        <span className="text-gray-900">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleString('nl-NL') : 'Onbekend'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Account aangemaakt:</span>
                        <span className="text-gray-900">
                          {new Date(user.createdAt).toLocaleDateString('nl-NL')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}