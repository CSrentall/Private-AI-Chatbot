
'use client'

import { useState, useEffect } from 'react'
import { 
  FileText, 
  Users, 
  Shield, 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  TrendingUp,
  Eye
} from 'lucide-react'
import toast from 'react-hot-toast'

interface AdminStats {
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

interface Document {
  id: string
  filename: string
  originalName: string
  size: number
  status: string
  createdAt: string
  users: {
    email: string
    name: string
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedStatus, setSelectedStatus] = useState('PENDING')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
    fetchDocuments()
  }, [selectedStatus])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      toast.error('Kon statistieken niet laden')
    }
  }

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/documents?status=${selectedStatus}`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents)
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error)
      toast.error('Kon documenten niet laden')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (documentId: string, reason?: string) => {
    try {
      setActionLoading(documentId)
      const response = await fetch(`/api/admin/documents/${documentId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })

      if (response.ok) {
        toast.success('Document goedgekeurd en verwerking gestart')
        fetchDocuments()
        fetchStats()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Goedkeuring mislukt')
      }
    } catch (error) {
      console.error('Approval error:', error)
      toast.error('Goedkeuring mislukt')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (documentId: string, reason: string) => {
    if (!reason.trim()) {
      toast.error('Reden voor afwijzing is verplicht')
      return
    }

    try {
      setActionLoading(documentId)
      const response = await fetch(`/api/admin/documents/${documentId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })

      if (response.ok) {
        toast.success('Document afgewezen en verwijderd')
        fetchDocuments()
        fetchStats()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Afwijzing mislukt')
      }
    } catch (error) {
      console.error('Rejection error:', error)
      toast.error('Afwijzing mislukt')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'PROCESSING':
        return <Activity className="h-4 w-4 text-blue-500" />
      case 'PROCESSED':
        return <CheckCircle className="h-4 w-4 text-purple-500" />
      case 'ERROR':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
        <span className="ml-2">Laden...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="admin-grid">
        {/* Documents Stats */}
        <div className="stat-card">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <div className="stat-number">{stats.documents.PENDING}</div>
              <div className="stat-label">Te Beoordelen</div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <div className="stat-number">{stats.documents.APPROVED}</div>
              <div className="stat-label">Goedgekeurd</div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <div className="stat-number">{stats.users.active}</div>
              <div className="stat-label">Actieve Gebruikers</div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <div className="stat-number">{stats.users.twoFactorEnabled}</div>
              <div className="stat-label">2FA Actief</div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Statistics */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Chat Statistieken (Laatste 30 dagen)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.chats.total}</div>
            <div className="text-sm text-gray-500">Totaal Sessies</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.chats.technical}</div>
            <div className="text-sm text-gray-500">CeeS (Technisch)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.chats.inkoop}</div>
            <div className="text-sm text-gray-500">ChriS (Inkoop)</div>
          </div>
        </div>
      </div>

      {/* Document Management */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            Document Beheer
          </h3>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="input-field w-auto"
          >
            <option value="PENDING">Te Beoordelen</option>
            <option value="APPROVED">Goedgekeurd</option>
            <option value="REJECTED">Afgewezen</option>
            <option value="PROCESSING">Verwerken</option>
            <option value="PROCESSED">Verwerkt</option>
            <option value="ERROR">Fout</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="spinner"></div>
            <span className="ml-2">Documenten laden...</span>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Geen documenten gevonden met status "{selectedStatus}"
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="responsive-table">
              <thead className="table-header">
                <tr>
                  <th>Bestand</th>
                  <th>Geüpload door</th>
                  <th>Grootte</th>
                  <th>Status</th>
                  <th>Datum</th>
                  {selectedStatus === 'PENDING' && <th>Acties</th>}
                </tr>
              </thead>
              <tbody className="table-body">
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="font-medium">{doc.originalName}</span>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className="font-medium">{doc.users.name || 'Onbekend'}</div>
                        <div className="text-sm text-gray-500">{doc.users.email}</div>
                      </div>
                    </td>
                    <td>{formatFileSize(doc.size)}</td>
                    <td>
                      <div className="flex items-center">
                        {getStatusIcon(doc.status)}
                        <span className={`ml-2 status-${doc.status.toLowerCase()}`}>
                          {doc.status}
                        </span>
                      </div>
                    </td>
                    <td>{new Date(doc.createdAt).toLocaleDateString('nl-NL')}</td>
                    {selectedStatus === 'PENDING' && (
                      <td>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApprove(doc.id)}
                            disabled={actionLoading === doc.id}
                            className="btn-primary text-xs py-1 px-2"
                          >
                            {actionLoading === doc.id ? (
                              <div className="spinner"></div>
                            ) : (
                              'Goedkeuren'
                            )}
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Reden voor afwijzing:')
                              if (reason) handleReject(doc.id, reason)
                            }}
                            disabled={actionLoading === doc.id}
                            className="btn-danger text-xs py-1 px-2"
                          >
                            Afwijzen
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Recente Activiteit
        </h3>
        <div className="space-y-3">
          {stats.recentActivity.map((activity, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center">
                <Activity className="h-4 w-4 text-gray-400 mr-3" />
                <span className="text-sm text-gray-900">{activity.action}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  activity.severity === 'ERROR' || activity.severity === 'CRITICAL' 
                    ? 'bg-red-100 text-red-800'
                    : activity.severity === 'WARN'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {activity.severity}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(activity.createdAt).toLocaleString('nl-NL')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
