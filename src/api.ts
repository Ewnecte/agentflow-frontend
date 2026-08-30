import type { ConversationDetail, ConversationSummary } from './types'

const BASE = '/api'

export async function listConversations(): Promise<ConversationSummary[]> {
  const res = await fetch(`${BASE}/conversations/`)
  if (!res.ok) throw new Error('加载会话列表失败')
  return res.json()
}

export async function getConversation(id: number): Promise<ConversationDetail> {
  const res = await fetch(`${BASE}/conversations/${id}/`)
  if (!res.ok) throw new Error('加载会话失败')
  return res.json()
}

export async function renameConversation(id: number, title: string): Promise<void> {
  const res = await fetch(`${BASE}/conversations/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  })
  if (!res.ok) throw new Error('重命名失败')
}

export async function deleteConversation(id: number): Promise<void> {
  const res = await fetch(`${BASE}/conversations/${id}/`, { method: 'DELETE' })
  if (!res.ok) throw new Error('删除失败')
}

export interface StreamHandlers {
  onToken: (text: string) => void
  onDone: (payload: { message_id: number; conversation_id: number }) => void
  onError: (message: string) => void
}

/** 发送消息并消费后端 SSE 流。 */
export async function sendMessage(
  content: string,
  conversationId: number | null,
  handlers: StreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`${BASE}/chat/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, conversation_id: conversationId }),
    signal,
  })

  if (!res.ok || !res.body) {
    let msg = '请求失败'
    try {
      const data = await res.json()
      if (data.error) msg = data.error
    } catch {
      /* ignore */
    }
    throw new Error(msg)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const frames = buffer.split('\n\n')
    buffer = frames.pop() ?? ''

    for (const frame of frames) {
      const line = frame.trim()
      if (!line.startsWith('data:')) continue
      let evt: { type: string; content?: string; message?: string; message_id?: number; conversation_id?: number }
      try {
        evt = JSON.parse(line.slice(5).trim())
      } catch {
        continue
      }
      if (evt.type === 'token' && evt.content) handlers.onToken(evt.content)
      else if (evt.type === 'done') {
        handlers.onDone({ message_id: evt.message_id ?? 0, conversation_id: evt.conversation_id ?? 0 })
      } else if (evt.type === 'error') handlers.onError(evt.message || '生成失败')
    }
  }
}
