import { useCallback, useEffect, useRef, useState } from 'react'
import ChatWindow from './components/ChatWindow'
import Sidebar from './components/Sidebar'
import Toast from './components/Toast'
import type { ToastItem } from './components/Toast'
import {
  deleteConversation,
  getConversation,
  listConversations,
  renameConversation,
  sendMessage,
} from './api'
import type { ChatMessage, ConversationSummary } from './types'

function App() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [currentId, setCurrentId] = useState<number | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [streaming, setStreaming] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const abortRef = useRef<AbortController | null>(null)

  const pushToast = useCallback((text: string, kind: 'error' | 'info' = 'error') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, text, kind }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  const loadConversations = useCallback(async () => {
    try {
      setConversations(await listConversations())
    } catch {
      pushToast('加载会话列表失败')
    }
  }, [pushToast])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  const selectConversation = useCallback(
    async (id: number) => {
      if (streaming || id === currentId) return
      try {
        const detail = await getConversation(id)
        setCurrentId(id)
        setMessages(detail.messages)
      } catch {
        pushToast('加载会话失败')
      }
    },
    [streaming, currentId, pushToast],
  )

  const newChat = useCallback(() => {
    if (streaming) return
    setCurrentId(null)
    setMessages([])
  }, [streaming])

  const handleSend = useCallback(
    async (content: string) => {
      if (streaming) return
      const now = new Date().toISOString()
      const userMsg: ChatMessage = { id: Date.now(), role: 'user', content, created_at: now }
      const assistantMsg: ChatMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: '',
        created_at: now,
        pending: true,
      }

      setMessages((prev) => [...prev, userMsg, assistantMsg])
      setStreaming(true)

      const controller = new AbortController()
      abortRef.current = controller

      const appendToken = (text: string) => {
        setMessages((prev) => {
          const next = [...prev]
          const last = { ...next[next.length - 1] }
          last.content += text
          next[next.length - 1] = last
          return next
        })
      }

      const finalize = (patch: (last: ChatMessage) => ChatMessage) => {
        setMessages((prev) => {
          const next = [...prev]
          const last = { ...next[next.length - 1] }
          next[next.length - 1] = patch(last)
          return next
        })
        setStreaming(false)
      }

      try {
        await sendMessage(
          content,
          currentId,
          {
            onToken: appendToken,
            onDone: (payload) => {
              finalize((last) => ({ ...last, pending: false }))
              if (payload.conversation_id) setCurrentId(payload.conversation_id)
              loadConversations()
            },
            onError: (msg) => {
              finalize((last) => ({
                ...last,
                pending: false,
                content: last.content ? `${last.content}\n\n⚠️ ${msg}` : `⚠️ ${msg}`,
              }))
            },
          },
          controller.signal,
        )
      } catch (e) {
        finalize((last) => ({ ...last, pending: false }))
        const err = e as Error
        if (err.name !== 'AbortError') pushToast(err.message || '请求失败')
      }
    },
    [streaming, currentId, loadConversations, pushToast],
  )

  const handleRename = useCallback(
    async (id: number, title: string) => {
      try {
        await renameConversation(id, title)
        setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)))
      } catch {
        pushToast('重命名失败')
      }
    },
    [pushToast],
  )

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await deleteConversation(id)
        setConversations((prev) => prev.filter((c) => c.id !== id))
        if (currentId === id) {
          setCurrentId(null)
          setMessages([])
        }
      } catch {
        pushToast('删除失败')
      }
    },
    [currentId, pushToast],
  )

  return (
    <div className="app">
      <Sidebar
        conversations={conversations}
        currentId={currentId}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        onSelect={selectConversation}
        onNew={newChat}
        onRename={handleRename}
        onDelete={handleDelete}
      />
      <ChatWindow
        messages={messages}
        streaming={streaming}
        currentTitle={conversations.find((c) => c.id === currentId)?.title}
        onSend={handleSend}
        onStop={() => abortRef.current?.abort()}
      />
      <Toast toasts={toasts} />
    </div>
  )
}

export default App
