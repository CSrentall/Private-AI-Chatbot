
'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Bot, User, FileText, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  sources?: Array<{
    filename: string
    content: string
  }>
}

interface ChatInterfaceProps {
  mode: 'TECHNICAL' | 'INKOOP'
  sessionId?: string
}

export default function ChatInterface({ mode, sessionId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState(sessionId)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Add welcome message
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: mode === 'TECHNICAL' 
        ? 'Hallo! Ik ben CeeS, uw technische assistent. Ik kan u helpen met technische vragen, installatiehandleidingen, troubleshooting en veiligheidsinstructies. Waar kan ik u mee helpen?'
        : 'Hallo! Ik ben ChriS, uw inkoop assistent. Ik kan u helpen met prijsvergelijkingen, leveranciersinformatie, kostenanalyses en inkoopadvies. Wat wilt u weten?',
      timestamp: new Date()
    }
    setMessages([welcomeMessage])
  }, [mode])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId: currentSessionId,
          mode
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Chat request failed')
      }

      const data = await response.json()
      
      // Update session ID if this is a new session
      if (!currentSessionId && data.sessionId) {
        setCurrentSessionId(data.sessionId)
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        sources: data.sources
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      console.error('Chat error:', error)
      toast.error('Er ging iets mis bij het versturen van uw bericht. Probeer het opnieuw.')
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, er is een fout opgetreden. Probeer het opnieuw of neem contact op met de beheerder.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const getBotName = () => mode === 'TECHNICAL' ? 'CeeS' : 'ChriS'
  const getBotColor = () => mode === 'TECHNICAL' ? 'text-blue-600' : 'text-green-600'

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center">
          <Bot className={`h-6 w-6 ${getBotColor()} mr-2`} />
          <div>
            <h3 className="font-medium text-gray-900">{getBotName()}</h3>
            <p className="text-sm text-gray-500">
              {mode === 'TECHNICAL' ? 'Technische Assistent' : 'Inkoop Assistent'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 bg-green-400 rounded-full"></div>
          <span className="text-xs text-gray-500">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((message) => (
          <div key={message.id} className={`chat-message ${message.role}`}>
            <div className="flex items-start space-x-3">
              {message.role === 'assistant' && (
                <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center`}>
                  <Bot className={`h-4 w-4 ${getBotColor()}`} />
                </div>
              )}
              
              <div className={`chat-bubble ${message.role} max-w-3xl`}>
                <div className="whitespace-pre-wrap">{message.content}</div>
                
                {/* Sources */}
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-500 mb-2">Bronnen:</div>
                    <div className="space-y-1">
                      {message.sources.map((source, index) => (
                        <div key={index} className="flex items-start space-x-2 text-xs">
                          <FileText className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-gray-700">{source.filename}</div>
                            <div className="text-gray-500">{source.content}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-gray-400 mt-2">
                  {message.timestamp.toLocaleTimeString('nl-NL', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>

              {message.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-600" />
                </div>
              )}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="chat-message assistant">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <Bot className={`h-4 w-4 ${getBotColor()}`} />
              </div>
              <div className="chat-bubble assistant">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Aan het typen...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Stel een vraag aan ${getBotName()}...`}
            className="flex-1 input-field resize-none"
            rows={1}
            disabled={loading}
            style={{ minHeight: '40px', maxHeight: '120px' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement
              target.style.height = 'auto'
              target.style.height = Math.min(target.scrollHeight, 120) + 'px'
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="btn-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          Druk op Enter om te versturen, Shift+Enter voor een nieuwe regel
        </div>
      </div>
    </div>
  )
}
