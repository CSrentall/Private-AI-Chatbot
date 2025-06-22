
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return ''
  },
}))

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  createBrowserClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  })),
  createServerClient: jest.fn(),
  supabaseAdmin: {
    from: jest.fn(),
    storage: {
      from: jest.fn(),
    },
  },
}))

// Mock OpenAI
jest.mock('@/lib/openai', () => ({
  OpenAIService: {
    chat: jest.fn(),
    generateEmbedding: jest.fn(),
    generateChatTitle: jest.fn(),
    getSystemPrompt: jest.fn(),
  },
}))

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
process.env.OPENAI_API_KEY = 'test-openai-key'
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.ALLOWED_IPS = '127.0.0.1,::1'
