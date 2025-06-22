
'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface UploadedDocument {
  id: string
  filename: string
  status: string
  uploadedAt: string
}

export default function DocumentUpload() {
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [documents, setDocuments] = useState<UploadedDocument[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files)
    }
  }

  const handleFiles = async (files: FileList) => {
    const file = files[0]
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'text/plain', 'text/markdown', 
                         'application/msword', 
                         'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    
    if (!allowedTypes.includes(file.type)) {
      toast.error('Bestandstype niet ondersteund. Gebruik PDF, DOC, DOCX, TXT of MD bestanden.')
      return
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Bestand is te groot. Maximum grootte is 10MB.')
      return
    }

    await uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    setUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const data = await response.json()
      
      toast.success('Bestand succesvol geüpload! Wacht op admin goedkeuring.')
      
      // Add to documents list
      setDocuments(prev => [data.document, ...prev])
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Upload mislukt')
    } finally {
      setUploading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'APPROVED':
      case 'PROCESSED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'REJECTED':
        return <X className="h-4 w-4 text-red-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Wacht op goedkeuring'
      case 'APPROVED':
        return 'Goedgekeurd'
      case 'PROCESSED':
        return 'Verwerkt'
      case 'REJECTED':
        return 'Afgewezen'
      case 'PROCESSING':
        return 'Wordt verwerkt'
      case 'ERROR':
        return 'Fout bij verwerking'
      default:
        return status
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Document Uploaden
        </h3>
        
        <div
          className={`file-upload-area ${dragActive ? 'dragover' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleChange}
            accept=".pdf,.doc,.docx,.txt,.md"
            disabled={uploading}
          />
          
          <div className="flex flex-col items-center">
            {uploading ? (
              <>
                <div className="spinner w-8 h-8 mb-4"></div>
                <p className="text-lg font-medium text-gray-900">Uploaden...</p>
                <p className="text-sm text-gray-500">Even geduld alstublieft</p>
              </>
            ) : (
              <>
                <Upload className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900">
                  Sleep bestanden hierheen of klik om te selecteren
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Ondersteunde formaten: PDF, DOC, DOCX, TXT, MD (max 10MB)
                </p>
              </>
            )}
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p className="font-medium mb-2">Belangrijk:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Geüploade documenten moeten eerst door een admin worden goedgekeurd</li>
            <li>Na goedkeuring worden documenten automatisch verwerkt voor de AI chatbots</li>
            <li>Alleen relevante bedrijfsdocumenten uploaden</li>
            <li>Geen persoonlijke of vertrouwelijke informatie</li>
          </ul>
        </div>
      </div>

      {/* Documents List */}
      {documents.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Mijn Geüploade Documenten
          </h3>
          
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">{doc.filename}</div>
                    <div className="text-sm text-gray-500">
                      Geüpload op {new Date(doc.uploadedAt).toLocaleDateString('nl-NL')}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {getStatusIcon(doc.status)}
                  <span className={`text-sm font-medium ${
                    doc.status === 'APPROVED' || doc.status === 'PROCESSED' 
                      ? 'text-green-700'
                      : doc.status === 'REJECTED'
                      ? 'text-red-700'
                      : doc.status === 'PENDING'
                      ? 'text-yellow-700'
                      : 'text-gray-700'
                  }`}>
                    {getStatusText(doc.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
