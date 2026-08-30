export interface Message {
  id: number
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

/** 前端展示用消息：额外带流式生成中的标记。 */
export interface ChatMessage extends Message {
  pending?: boolean
}

export interface ConversationSummary {
  id: number
  title: string
  created_at: string
  updated_at: string
  last_message: Message | null
}

export interface ConversationDetail {
  id: number
  title: string
  created_at: string
  updated_at: string
  messages: Message[]
}
