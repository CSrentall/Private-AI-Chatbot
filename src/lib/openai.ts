
import OpenAI from 'openai'
import { auditLogger } from './audit-logger'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatResponse {
  message: string
  tokens: number
  model: string
  sources?: string[]
}

export class OpenAIService {
  private static readonly DEFAULT_MODEL = 'gpt-4-turbo-preview'
  private static readonly MAX_TOKENS = 4000
  private static readonly TEMPERATURE = 0.7

  static async chat(
    messages: ChatMessage[],
    userId?: string,
    sessionId?: string,
    model: string = this.DEFAULT_MODEL
  ): Promise<ChatResponse> {
    try {
      const startTime = Date.now()

      const completion = await openai.chat.completions.create({
        model,
        messages,
        max_tokens: this.MAX_TOKENS,
        temperature: this.TEMPERATURE,
        stream: false,
      })

      const response = completion.choices[0]?.message?.content || ''
      const tokens = completion.usage?.total_tokens || 0
      const duration = Date.now() - startTime

      // Log the chat interaction
      await auditLogger.logChat('MESSAGE_SENT', sessionId || 'unknown', userId, {
        model,
        tokens,
        duration,
        messageCount: messages.length
      })

      return {
        message: response,
        tokens,
        model,
      }
    } catch (error) {
      await auditLogger.logError(error as Error, 'OPENAI_CHAT', userId, {
        sessionId,
        model,
        messageCount: messages.length
      })
      throw error
    }
  }

  static async generateEmbedding(text: string, userId?: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
      })

      const embedding = response.data[0]?.embedding
      if (!embedding) {
        throw new Error('No embedding returned from OpenAI')
      }

      await auditLogger.log({
        userId,
        action: 'EMBEDDING_GENERATED',
        resource: 'openai',
        metadata: {
          textLength: text.length,
          embeddingDimensions: embedding.length
        },
        severity: 'DEBUG'
      })

      return embedding
    } catch (error) {
      await auditLogger.logError(error as Error, 'OPENAI_EMBEDDING', userId)
      throw error
    }
  }

  static async generateChatTitle(messages: ChatMessage[]): Promise<string> {
    try {
      const firstUserMessage = messages.find(m => m.role === 'user')?.content || ''
      
      if (!firstUserMessage) {
        return 'Nieuwe Chat'
      }

      const titlePrompt: ChatMessage[] = [
        {
          role: 'system',
          content: 'Genereer een korte, beschrijvende titel (max 50 karakters) voor deze chat conversatie in het Nederlands. Geef alleen de titel terug, geen extra tekst.'
        },
        {
          role: 'user',
          content: `Eerste bericht: ${firstUserMessage.substring(0, 200)}`
        }
      ]

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: titlePrompt,
        max_tokens: 20,
        temperature: 0.5,
      })

      const title = completion.choices[0]?.message?.content?.trim() || 'Nieuwe Chat'
      return title.length > 50 ? title.substring(0, 47) + '...' : title
    } catch (error) {
      console.error('Error generating chat title:', error)
      return 'Nieuwe Chat'
    }
  }

  // System prompts for different chat modes
  static getSystemPrompt(mode: 'TECHNICAL' | 'INKOOP'): string {
    const basePrompt = `Je bent een AI assistent voor CSrental, een bedrijf gespecialiseerd in verhuur van bouwmachines en technische apparatuur. Je communiceert altijd in het Nederlands en bent behulpzaam, professioneel en accuraat.`

    switch (mode) {
      case 'TECHNICAL':
        return `${basePrompt}

Je bent CeeS, de technische kennis chatbot. Je helpt met:
- Technische vragen over bouwmachines en apparatuur
- Installatiehandleidingen en procedures
- Troubleshooting en onderhoud
- Veiligheidsinstructies
- Technische specificaties
- Best practices voor monteurs en technici

Geef altijd praktische, veilige en accurate technische adviezen. Als je niet zeker bent van een antwoord, geef dit eerlijk aan en adviseer om contact op te nemen met een technische specialist.`

      case 'INKOOP':
        return `${basePrompt}

Je bent ChriS, de inkoop AI chatbot. Je helpt met:
- Prijsvergelijkingen van leveranciers
- Productspecificaties en alternatieven
- Inkoopprocessen en procedures
- Leveranciersinformatie
- Kostenanalyses
- Contractvoorwaarden

Focus op het optimaliseren van inkoop beslissingen, kostenbesparing en efficiëntie. Geef concrete adviezen voor betere inkoopresultaten.`

      default:
        return basePrompt
    }
  }
}

export { openai }
